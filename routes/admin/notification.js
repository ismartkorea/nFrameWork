/*
 * 모듈명  : notification.js
 * 설명    : 관리자화면 메뉴 '상단 알림창' 에 대한 모듈.
 * 작성일  : 2017년 3월 7일
 * author  : HiBizNet
 * copyright : JT-LAB
 * version : 1.0
 */
var express = require('express');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var flash = require('connect-flash');
var router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));
router.use(methodOverride("_method"));
router.use(flash());

var conn = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    database : 'jtlab',
    user: 'jtlab',
    password: 'jtlab9123',
    insecureAuth: true,
    multipleStatements: true
});

// 게시글 리스트 호출.
router.get('/', function(req, res) {

    var ss = req.session;
    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {

        var srchType = req.query.srchType != null ? req.query.srchType : "";
        var srchText = req.query.srchText != null ? req.query.srchText : "";
        console.log(">>> srchType : " + srchType);
        var addSQL = "";

        if (srchType == "title") {
            addSQL = ' where title like concat("%", ?, "%")';
        } else if (srchType == "writer") {
            addSQL = ' where ins_usr_nm like concat(?,"%")';
        }

        var reqPage = req.query.page ? parseInt(req.query.page) : 0;
        //console.log(">>> reqPage = " + reqPage);
        var offset = 3;
        var page = Math.max(1, reqPage);
        //console.log(">>> page = " + page);
        var limit = 10;
        var skip = (page - 1) * limit;
        //console.log(">>> skip = " + skip);

        // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
        conn.query('select count(*) as cnt from admin_notice_inf_tbl ' + addSQL + '; select @rownum:=@rownum+1 as num, no, title, content,'
            + ' DATE_FORMAT(ins_date, "%Y-%m-%d") as date, ins_usr_nm as writer, count from admin_notice_inf_tbl, (SELECT @rownum:=' + skip + ') TMP' + addSQL
            + ' order by no desc limit ' + skip + ', ' + limit + ";",
            [srchText, srchText],
            function (err, results) {
                if (err) {
                    //console.log('error : ', err.message);
                    res.render('error', {message: err.message, error: err, session: ss});
                } else {
                    var count = results[0][0].cnt;
                    //console.log(">>> count = " + count);
                    var maxPage = Math.ceil(count / limit);
                    //console.log(">>> maxPage = " + maxPage);

                    res.render('./admin/notification/list', {
                        title: '게시글 화면',
                        board: results[1],
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
});

// 게시판 검색 처리.
router.post('/search', function(req, res) {

    var ss = req.session;
    console.log(">>> search type = " + req.body.srchType);
    console.log(">>> search word = " + req.body.srchText);
    var srchType = req.body.srchType != null ? req.body.srchType : "";
    var srchText = req.body.srchText != null ? req.body.srchText : "";
    console.log(">>> srchType : " + srchType);
    var addSQL = "";

    if(srchType=="title") {
        addSQL =  ' where title like concat("%", ?, "%")';
    } else if(srchType=="writer") {
        addSQL =  ' where ins_usr_nm like concat(?,"%")';
    }

    var reqPage = req.query.page ? parseInt(req.query.page) : 0;
    //console.log(">>> reqPage = " + reqPage);
    var offset = 3;
    var page = Math.max(1,reqPage);
    //console.log(">>> page = " + page);
    var limit = 10;
    var skip = (page-1)*limit;
    //console.log(">>> skip = " + skip);

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    conn.query('select count(*) as cnt from admin_notice_inf_tbl '+ addSQL + '; select @rownum:=@rownum+1 as num, no, title, content,'
        + ' DATE_FORMAT(ins_date, "%Y-%m-%d") as date, ins_usr_nm as writer, count from admin_notice_inf_tbl, (SELECT @rownum:='+skip+') TMP'+ addSQL
        + ' order by no desc limit '+ skip + ', ' + limit + ";",
        [srchText, srchText],
        function(err, results) {
            if(err) {
                //console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                var count = results[0][0].cnt;
                //console.log(">>> count = " + count);
                var maxPage = Math.ceil(count/limit);
                console.log(">>> maxPage = " + maxPage);

                res.render('./admin/notification/list', {title: '게시글 화면', board : results[1], srchType: srchType, srchText : srchText, page : page, maxPage: maxPage, offset: offset, session : ss});
            }
        });
});


router.get('/new', function(req, res) {
    console.log('routes 게시글 작성 화면 호출');
    var ss = req.session;
    res.render('./admin/notification/new', {title: '게시글 작성 화면', session : ss});
});

router.post('/insert', function(req, res) {
    console.log('routes 게시글 작성 처리');
    var ss = req.session;

    conn.query('insert into admin_notice_inf_tbl(title, content, ins_date, ins_usr_id, ins_usr_nm) values(?, ?, now(), ?, ?)',
        [req.body.title, req.body.content, ss.usrId, ss.usrName],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.redirect('/admin/notification');
            }
        });
});

// 상세 게시글 화면 호출.
router.get('/view/:no', function(req, res) {

    var ss = req.session;

    console.log("뷰 조회.");
    // 조회.
    conn.query('SELECT no as no, title as title, content as content, DATE_FORMAT(ins_date, "%Y-%m-%d") as date,'
        + ' ins_usr_nm as writer FROM admin_notice_inf_tbl WHERE no = ?',
        [req.params.no],
        function(err, results) {
            if (err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.log('routes board View !!!');
                res.render('admin/notification/view', {result : results[0], session : ss});
            }
        }
    );

});

// 게시글 수정 화면 호출.
router.get('/edit/:no', function(req, res) {
    console.log("상세 화면 호출처리.");
    var ss = req.session;

    conn.query('select no, title, content, DATE_FORMAT(ins_date, "%Y-%m-%d") as date, ins_usr_nm as writer, count from admin_notice_inf_tbl where no = ?',
        [req.params.no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.log('routes board Edit Result !!!');
                res.render('./admin/notification/edit', {title: '수정화면', result : results[0], session : ss});
            }
        });
});

// 게시글 수정 처리.
router.post('/edit/do', function(req, res) {
    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    var ss = req.session;

    console.log("게시글 수정 처리");
    conn.query('UPDATE admin_notice_inf_tbl SET title = ?, content = ?, ins_date = now(), ins_usr_id = ?, ins_usr_nm = ?,'
        + ' upd_date = now(), upd_usr_id = ?, upd_usr_nm = ? WHERE no = ?',
        [req.body.title, req.body.content, ss.usrId, ss.usrName, ss.usrId, ss.usrName, req.body.no],
        function(err) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.redirect("/admin/notification/view/"+req.body.no);
            }
        }
    );
});

// 게시글 삭제.(get)
router.get('/delete/:no', function(req, res) {

    var ss = req.session;

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log("게시글 삭제 처리");
    conn.query('delete from admin_notice_inf_tbl where no = ?',
        [req.params.no],
        function(err) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.redirect("/admin/notification");
            }
        }
    );
});


// 게시글 삭제.(post)
router.post('/delete', function(req, res) {

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log("게시글 삭제 처리");

    var ss = req.session;

    var params = req.body['dataList'];

    for(var i = 0; i < params.length; i++) {
        //console.log(">>>> params[" + i + "] = " + params[i]);
        conn.query('delete from admin_notice_inf_tbl where no = ?',
            [params[i]],
            function (err) {
                if (err) {
                    console.log('error : ', err.message);
                    res.render('error', {message: err.message, error : err, session: ss});
                }
            });
    }


    res.json({'result' : 'OK'});
});


module.exports = router;