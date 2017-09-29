/*
 * 모듈명  : commoncd.js
 * 설명    : 관리자화면 메뉴 '공통코드 관리' 에 대한 모듈.
 * 작성일  : 2016년 11월 1일
 * author  : HiBizNet
 * copyright : JT-LAB
 * version : 1.0
 */
var express = require('express');
var engine = require('ejs-locals');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var flash = require('connect-flash');
var router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));
router.use(methodOverride("_method"));
router.use(flash());

router.use('ejs', engine);


var conn = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    database : 'jtlab',
    user: 'jtlab',
    password: 'jtlab9123',
    insecureAuth: true,
    multipleStatements: true
});

// 공통코드 리스트 호출.
router.get('/', function(req, res) {

    var ss = req.session;
    //console.log(">>> userId = " + ss.usrId);
    //console.log(">>> userName = " + ss.usrName);
    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {

        var srchType = req.query.srchType != null ? req.query.srchType : "";
        var srchText = req.query.srchText != null ? req.query.srchText : "";
        console.log(">>> srchType : " + srchType);
        var addSQL = "";
        if (srchType == "cd") {
            addSQL = ' where `comm_cd` = ?';
        } else if (srchType == "ucd") {
            addSQL = ' where `p_comm_cd` like concat(?,"%")';
        } else if (srchType == "nm") {
            addSQL = ' where `comm_nm` like concat("%", ?,"%")';
        }
        // 페이징 처리.
        var reqPage = req.query.page ? parseInt(req.query.page) : 0;
        //console.log(">>> reqPage = " + reqPage);
        var offset = 3;
        var page = Math.max(1, reqPage);
        //console.log(">>> page = " + page);
        var limit = 10;
        var skip = (page - 1) * limit;
        //conn.connect();

        // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
        conn.query('select count(*) as cnt from `commcd_inf_tbl`' + addSQL
            + '; select @rownum:=@rownum+1 as `num`, `comm_cd`, `p_comm_cd`, `comm_nm`, `desc`,'
            + ' DATE_FORMAT(insert_dt,"%Y-%m-%d") as `w_dt`, `insert_usr` as `w_nm`, DATE_FORMAT(update_dt,"%Y-%m-%d") as `u_dt`,'
            + ' `update_usr` as `u_nm` from `commcd_inf_tbl`, (SELECT @rownum:=' + skip + ') `TMP`' + addSQL
            + ' order by `comm_cd` asc limit ' + skip + ', ' + limit + ";",
            [srchText, srchText],
            function (err, results) {
                if (err) {
                    console.log('error : ', err.message);
                } else {
                    var count = results[0][0].cnt;
                    var maxPage = Math.ceil(count / limit);

                    res.render('./admin/commcd/list', {
                        rList: results[1],
                        srchType: srchType,
                        srchText: srchText,
                        page: page,
                        maxPage: maxPage,
                        offset: offset,
                        session: ss
                    });
                }
            });

    } else {
        res.redirect('/admin');
    }

    //conn.end();
});

// 게시글 리스트 호출(post).
router.post('/search', function(req, res) {

    var ss = req.session;

    var srchType = req.body.srchType != null ? req.body.srchType : "";
    var srchText = req.body.srchText != null ? req.body.srchText : "";
    console.log(">>> srchType : " + srchType);
    var addSQL = "";
    if(srchType=="cd") {
        addSQL =  ' where `comm_cd` = ?';
    } else if(srchType=="ucd") {
        addSQL =  ' where `p_comm_cd` like concat(?,"%")';
    } else if(srchType=="nm") {
        addSQL =  ' where `comm_nm` like concat("%", ?,"%")';
    }
    // 페이징 처리.
    var reqPage = req.query.page ? parseInt(req.query.page) : 0;
    //console.log(">>> reqPage = " + reqPage);
    var offset = 3;
    var page = Math.max(1,reqPage);
    //console.log(">>> page = " + page);
    var limit = 10;
    var skip = (page-1)*limit;

    //conn.connect();

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    conn.query('select count(*) as cnt from `commcd_inf_tbl`' + addSQL
        + '; select @rownum:=@rownum+1 as `num`, `comm_cd`, `p_comm_cd`, `comm_nm`, `desc`,'
        + ' DATE_FORMAT(insert_dt,"%Y-%m-%d") as `w_dt`, `insert_usr` as `w_nm`, DATE_FORMAT(update_dt,"%Y-%m-%d") as `u_dt`,'
        + ' `update_usr` as `u_nm` from `commcd_inf_tbl`, (SELECT @rownum:='+skip+') `TMP`'+ addSQL,
        [srchText, srchText],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                var count = results[0][0].cnt;
                var maxPage = Math.ceil(count/limit);

                res.render('./admin/commcd/list', {rList : results[1], srchType: srchType, srchText : srchText, page : page, maxPage: maxPage, offset: offset, session : ss});
            }
        });

    //conn.end();
});


// 공통코드 작성 화면 호출.
router.get('/new', function(req, res) {
    console.log('routes 작성 화면 호출');
    var ss = req.session;
    res.render('./admin/commcd/new', {session : ss});
});

// 공통코드 작성처리.
router.post('/insert', function(req, res) {
    console.log('routes  공통코드 작성 처리');
    var ss = req.session;

    conn.query('insert into `commcd_inf_tbl`(`comm_cd`, `p_comm_cd`, `comm_nm`, `desc`, `insert_dt`, `insert_usr`, `update_dt`, `update_usr`) values(?, ?, ?, ?, now(), ?, now(), ?)',
        [req.body.commCd, req.body.pCommCd, req.body.commNm, req.body.desc, ss.usrName, ss.usrName],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                res.json({'result' : 'OK'});
            }
        }
    );
});

// 공통코드 수정 화면 호출.
router.get('/view/:cd', function(req, res) {

    // 뷰 카운트 추가.
    /*    console.log("조회업데이트");
     conn.query('update user_info_tbl set count = (select * from (select count+1 from user_info_tbl where no = ?) as tmp) where no = ?',
     [req.params.no,req.params.no],
     function(err) {
     if (err) {
     console.log('error : ', err.message);
     }
     }
     );*/
    var ss = req.session;

    console.log("상세 화면 호출처리.");
    conn.query('select `comm_cd`, `p_comm_cd`, `comm_nm`, `desc`, `insert_dt`, `insert_usr`, `update_dt`, `update_usr` from `commcd_inf_tbl` where `comm_cd` = ?',
        [req.params.cd],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('routes common code View Result !!!');
                res.render('./admin/commcd/view', {retval : results[0], session : ss});
            }
        });
});

// 공통코드 수정 화면 호출.
router.get('/edit/:cd', function(req, res) {
    console.log("상세 화면 호출처리.");
    var ss = req.session;

    conn.query('select `comm_cd`, `p_comm_cd`, `comm_nm`, `desc`, `insert_dt`, `insert_usr`, `update_dt`, `update_usr` from `commcd_inf_tbl` where `comm_cd` = ?',
        [req.params.cd],
        function(err, results) {
            if(err) {
                console.log('error : ', JSON.stringify(err));
            } else {
                console.log('routes common code Edit Result !!!');
                res.render('./admin/commcd/edit', {retval : results[0], session : ss});
            }
        });
});

// 공통코드 수정 처리.
router.post('/edit/do', function(req, res) {

    var ss = req.session;

    console.log("공통코드 수정 처리");
    conn.query('update `commcd_inf_tbl` set `comm_cd` = ?, `p_comm_cd` = ?, `comm_nm` = ?, `desc` = ?,'
        + ' `insert_dt` = now(), `insert_usr` = ?, `update_dt` = now(), `update_usr` = ? where `comm_cd` = ? and `p_comm_cd` = ?',
        [req.body.newCommCd, req.body.newPcommCd, req.body.newCommNm, req.body.newDesc, ss.usrName, ss.usrName, req.body.commCd, req.body.pCommCd],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('>>> results : ' + results.affectedRows);
                res.json({result : "OK", session : ss});
            }
        });
});

// 공통코드 삭제.(get)
router.get('/delete/:cd', function(req, res) {

    var ss = req.session;

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log("게시글 삭제 처리");
    conn.query('delete from `commcd_inf_tbl` where `comm_cd` = ?',
        [req.params.cd],
        function(err) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                res.redirect('/admin/commoncd');
            }
        });
});


// 공통코드 삭제.(post)
router.post('/delete', function(req, res) {

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log("공통코드 삭제 처리");

    var params = req.body['dataList'];

    for(var i=0; i < params.length; i++) {
        //console.log(">>> get params[" + i + "] =" + params[i]);
        conn.query('delete from `commcd_inf_tbl` where comm_cd = ?',
            [params[i]],
            function(err) {
                if(err) {
                    console.log('error : ', err.message);
                }
            });
    }

    res.json({'result' : 'OK'});
});


module.exports = router;