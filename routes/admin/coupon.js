/*
 * 모듈명  : coupon.js
 * 설명    : 관리자화면 메뉴 '쿠폰 관리' 에 대한 모듈.
 * 작성일  : 2017년 2월 1일
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

// 쿠폰 리스트 호출.
router.get('/', function(req, res) {

    var ss = req.session;
    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {

        var srchType = req.query.srchType != null ? req.query.srchType : "";
        var srchText = req.query.srchText != null ? req.query.srchText : "";
        console.log(">>> srchType : " + srchType);
        var addSQL = "";

        if (srchType == "couponNo") {
            addSQL = ' where coupon_no = ?';
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
        conn.query('SELECT count(*) as cnt FROM coupon_inf_tbl ' + addSQL + '; SELECT @rownum:=@rownum+1 as num, no,'
            + ' coupon_no as couponNo, coupon_status as couponStatus, DATE_FORMAT(ins_date, "%Y-%m-%d") as insDate,'
            + ' ins_usr_id as insUsrId, ins_usr_nm as insUsrNm FROM coupon_inf_tbl, (SELECT @rownum:=' + skip + ') TMP' + addSQL
            + ' ORDER BY no DESC LIMIT ' + skip + ', ' + limit + ";",
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

                    res.render('./admin/coupon/list', {
                        title: '쿠폰 관리 화면',
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
});

// 쿠폰 검색 처리.
router.post('/search', function(req, res) {

    var ss = req.session;
    console.log(">>> search type = " + req.body.srchType);
    console.log(">>> search word = " + req.body.srchText);
    var srchType = req.body.srchType != null ? req.body.srchType : "";
    var srchText = req.body.srchText != null ? req.body.srchText : "";
    console.log(">>> srchType : " + srchType);
    var addSQL = "";

    if (srchType == "couponNo") {
        addSQL = ' where coupon_no = ?';
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
    conn.query('SELECT count(*) as cnt FROM coupon_inf_tbl ' + addSQL + '; SELECT @rownum:=@rownum+1 as num, no,'
        + ' coupon_no as couponNo, coupon_status as couponStatus, DATE_FORMAT(ins_date, "%Y-%m-%d") as insDate,'
        + ' ins_usr_id as insUsrId, ins_usr_nm as insUsrNm FROM coupon_inf_tbl, (SELECT @rownum:=' + skip + ') TMP' + addSQL
        + ' ORDER BY no DESC LIMIT ' + skip + ', ' + limit + ";",
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

                res.render('./admin/coupon/list', {title: '쿠폰 관리 화면', rList : results[1], srchType: srchType, srchText : srchText, page : page, maxPage: maxPage, offset: offset, session : ss});
            }
        });
});

// 쿠폰 리스트 호출.
router.get('/use', function(req, res) {

    var ss = req.session;
    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {

        var srchType = req.query.srchType != null ? req.query.srchType : "";
        var srchText = req.query.srchText != null ? req.query.srchText : "";
        console.log(">>> srchType : " + srchType);
        var addSQL = "";

        if (srchType == "couponNo") {
            addSQL = ' where coupon_no like concat("%", ?, "%")';
        } else if (srchType == "userName") {
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
        conn.query('select count(*) as cnt from coupon_use_inf_tbl ' + addSQL + '; select @rownum:=@rownum+1 as num, no,'
            + ' coupon_no as couponNo, ins_usr_id as insUsrId, ins_usr_nm as insUsrNm, DATE_FORMAT(ins_date, "%Y-%m-%d") as insDate,'
            + ' accept_yn as acceptYn, accept_usr_id as acceptUsrId, accept_usr_nm as acceptUsrNm,'
            + ' DATE_FORMAT(accept_date, "%Y-%m-%d") as acceptDate from coupon_use_inf_tbl, (SELECT @rownum:=' + skip + ') TMP' + addSQL
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

                    res.render('./admin/coupon/use/list', {
                        title: '쿠폰 접수 관리 화면',
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
});

// 쿠폰 검색 처리.
router.post('/use/search', function(req, res) {

    var ss = req.session;
    console.log(">>> search type = " + req.body.srchType);
    console.log(">>> search word = " + req.body.srchText);
    var srchType = req.body.srchType != null ? req.body.srchType : "";
    var srchText = req.body.srchText != null ? req.body.srchText : "";
    console.log(">>> srchType : " + srchType);
    var addSQL = "";

    if (srchType == "couponNo") {
        addSQL = ' where coupon_no like concat("%", ?, "%")';
    } else if (srchType == "userName") {
        addSQL = ' where ins_usr_nm like concat(?,"%")';
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
    conn.query('select count(*) as cnt from coupon_use_inf_tbl ' + addSQL + '; select @rownum:=@rownum+1 as num, no,'
        + ' coupon_no as couponNo, ins_usr_id as insUsrId, ins_usr_nm as insUsrNm, DATE_FORMAT(ins_date, "%Y-%m-%d") as insDate,'
        + ' accept_yn as acceptYn, accept_usr_id as acceptUsrId, accept_usr_nm as acceptUsrNm,'
        + ' DATE_FORMAT(accept_date, "%Y-%m-%d") as acceptDate from coupon_use_inf_tbl, (SELECT @rownum:=' + skip + ') TMP' + addSQL
        + ' order by no desc limit ' + skip + ', ' + limit + ";",
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

                res.render('./admin/coupon/use/list', {title: '쿠폰 접수 관리 화면', rList : results[1], srchType: srchType, srchText : srchText, page : page, maxPage: maxPage, offset: offset, session : ss});
            }
        });
});


router.get('/new', function(req, res) {
    console.log('routes 게시글 작성 화면 호출');
    var ss = req.session;
    res.render('./admin/coupon/new', {title: '게시글 작성 화면', session : ss});
});

router.post('/insert', function(req, res) {
    console.log('routes 게시글 작성 처리');
    var ss = req.session;

    conn.query('insert into coupon_inf_tbl(title, content, date, writer) values(?, ?, now(), ?)',
        [req.body.title, req.body.content, req.body.writer],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.redirect('/admin/coupon');
            }
        });
});

// 상세 게시글 화면 호출.
router.get('/view/:no', function(req, res) {

    var ss = req.session;

    console.log("뷰 조회.");
    // 조회.
    conn.query('SELECT coupon_no as couponNo, case when coupon_status = "NOTUSED" then "미사용" when coupon_status = "USED"'
        + ' then "사용" when coupon_status = "DISUSE" then "폐기" else "" end as couponStatus,'
        + ' DATE_FORMAT(ins_date, "%Y-%m-%d") as insDate, ins_usr_id as insUsrId, ins_usr_nm as insUsrNm'
        + ' FROM coupon_inf_tbl WHERE coupon_no = ?',
        [req.params.no],
        function(err, results) {
            if (err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.log('routes coupon View !!!');
                res.render('./admin/coupon/view', {result : results[0], session : ss});
            }
        }
    );

});

// 게시글 수정 화면 호출.
router.get('/edit/:no', function(req, res) {
    console.log("상세 화면 호출처리.");
    var ss = req.session;

    // 조회.
    conn.query('SELECT coupon_no as couponNo, coupon_status as couponStatus,'
        + ' DATE_FORMAT(ins_date, "%Y-%m-%d") as insDate, ins_usr_id as insUsrId, ins_usr_nm as insUsrNm'
        + ' FROM coupon_inf_tbl WHERE coupon_no = ?',
        [req.params.no],
        function(err, results) {
            if (err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.log('routes coupon View !!!');
                res.render('./admin/coupon/edit', {result : results[0], session : ss});
            }
        }
    );
});

// 게시글 수정 처리.
router.post('/edit/do', function(req, res) {
    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    var ss = req.session;

    console.log("게시글 수정 처리");
    conn.query('update coupon_inf_tbl set coupon_status = ? where coupon_no = ?',
        [req.body.couponStatus, req.body.couponNo],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                //res.send(err);
            } else {
                res.redirect("/admin/coupon/view/"+req.body.couponNo);
            }
        });
});

// 게시글 삭제.(get)
router.get('/delete/:no', function(req, res) {

    var ss = req.session;

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log("게시글 삭제 처리");
    conn.query('delete from coupon_inf_tbl where coupon_no = ?',
        [req.params.no],
        function(err) {
            if(err) {
                console.log('error : ', err.message);
                //res.send(err);
            } else {
                res.redirect('/admin/coupon');
            }
        }
    );
});


// 게시글 삭제.(post)
router.post('/delete', function(req, res) {

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log("쿠폰 삭제 처리");

    var ss = req.session;
    var params = req.body['dataList'];

    for (var i = 0; i < params.length; i++) {
        //console.log(">>>> params[" + i + "] = " + params[i]);
        conn.query('delete from coupon_inf_tbl where coupon_no = ?',
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

// USE 상세 게시글 화면 호출.
router.get('/use/view/:no', function(req, res) {

    var ss = req.session;

    console.log("뷰 조회.");
    // 조회.
    conn.query('SELECT coupon_no as couponNo, ins_usr_id as insUsrId, ins_usr_nm as insUsrNm,'
        + ' DATE_FORMAT(ins_date, "%Y-%m-%d") as insDate, case when accept_yn = "Y" then "허가(Y)" when accept_yn = "N"'
        + ' then "불가(N)" else "" end as acceptYn, IFNULL(accept_usr_id,"") as acceptUsrId, IFNULL(accept_usr_nm,"") as acceptUsrNm,'
        + ' IFNULL(DATE_FORMAT(accept_date, "%Y-%m-%d %H:%m"),"") as acceptDate FROM coupon_use_inf_tbl WHERE coupon_no = ?',
        [req.params.no],
        function(err, results) {
            if (err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.log('routes use coupon View !!!');
                res.render('./admin/coupon/use/view', {result : results[0], session : ss});
            }
        }
    );

});

// USE 수정 화면 호출.
router.get('/use/edit/:no', function(req, res) {
    console.log("상세 화면 호출처리.");
    var ss = req.session;

    // 조회.
    conn.query('SELECT coupon_no as couponNo, ins_usr_id as insUsrId, ins_usr_nm as insUsrNm,'
        + ' DATE_FORMAT(ins_date, "%Y-%m-%d") as insDate, accept_yn as acceptYn, IFNULL(accept_usr_id,"") as acceptUsrId,'
        + ' IFNULL(accept_usr_nm,"") as acceptUsrNm, DATE_FORMAT(accept_date, "%Y-%m-%d %H:%m") as acceptDate'
        + ' FROM coupon_use_inf_tbl WHERE coupon_no = ?',
        [req.params.no],
        function(err, results) {
            if (err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.log('routes use coupon View !!!');
                res.render('./admin/coupon/use/edit', {result : results[0], session : ss});
            }
        }
    );
});

// USE 수정 처리.
router.post('/use/edit/do', function(req, res) {
    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    var ss = req.session;

    console.log("게시글 수정 처리");
    conn.query('update coupon_use_inf_tbl set accept_yn = ?, accept_usr_id =?, accept_usr_nm = ?, accept_date = now() where coupon_no = ?',
        [req.body.acceptYn, ss.usrId, ss.usrName, req.body.couponNo],
        function(err) {
            if(err) {
                console.log('error : ', err.message);
                //res.send(err);
            } else {
                res.redirect("/admin/coupon/use/view/"+req.body.couponNo);
            }
        });
});

// 게시글 삭제.(get)
router.get('/use/delete/:no', function(req, res) {

    var ss = req.session;

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log("게시글 삭제 처리");
    conn.query('delete from coupon_use_inf_tbl where coupon_no = ?',
        [req.params.no],
        function(err) {
            if(err) {
                console.log('error : ', err.message);
                //res.send(err);
            } else {
                res.redirect('./admin/coupon/use');
            }
        }
    );
});


// USE 삭제.(post)
router.post('/use/delete', function(req, res) {

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log("쿠폰 삭제 처리");

    var ss = req.session;
    var params = req.body['dataList'];

    for (var i = 0; i < params.length; i++) {
        //console.log(">>>> params[" + i + "] = " + params[i]);
        conn.query('delete from coupon_use_inf_tbl where coupon_no = ?',
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