/*
 * 모듈명  : announce.js
 * 설명    : 관리자화면 메뉴 '공지사항 관리' 에 대한 모듈.
 * 작성일  : 2016년 11월 1일
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
    //console.log(">>> userId = " + ss.usrId);
    //console.log(">>> userName = " + ss.usrName);
    console.log(">>> usrLevel = " + ss.usrLevel);

    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {

        var srchType = req.query.srchType != null ? req.query.srchType : "";
        var srchText = req.query.srchText != null ? req.query.srchText : "";
        console.log(">>> srchType : " + srchType);
        var addSQL = "";
        if (srchType == "title") {
            addSQL = ' where title like concat("%", ?, "%")';
        } else if (srchType == "writer") {
            addSQL = ' where writer like concat(?,"%")';
        }
        // 페이징 처리.
        var reqPage = req.query.page ? parseInt(req.query.page) : 0;
        //console.log(">>> reqPage = " + reqPage);
        var offset = 3;
        var page = Math.max(1, reqPage);
        //console.log(">>> page = " + page);
        var limit = 10;
        var skip = (page - 1) * limit;

        // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
        conn.query('select count(*) as cnt from announce_inf_tbl' + addSQL
            + '; select @rownum:=@rownum+1 as num, category, no, title, content, DATE_FORMAT(date, "%Y-%m-%d") as date,'
            + ' writer, count from announce_inf_tbl, (SELECT @rownum:=' + skip + ') TMP' + addSQL
            + ' order by no desc limit ' + skip + ', ' + limit + ";",
            [srchText, srchText],
            function (err, results) {
                if (err) {
                    console.log('error : ', err.message);
                } else {
                    var count = results[0][0].cnt;
                    var maxPage = Math.ceil(count / limit);

                    res.render('./admin/announce/list', {
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

router.post('/search', function(req, res) {
    console.log('routes 게시글 검색 처리 호출');
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
        addSQL =  ' where writer like concat(?,"%")';
    }
    // 페이징 처리.
    var reqPage = req.query.page ? parseInt(req.query.page) : 0;
    //console.log(">>> reqPage = " + reqPage);
    var offset = 3;
    var page = Math.max(1,reqPage);
    //console.log(">>> page = " + page);
    var limit = 10;
    var skip = (page-1)*limit;

    conn.query('select count(*) as cnt from announce_inf_tbl' + addSQL
        + '; select @rownum:=@rownum+1 as num, no, category, title, content, DATE_FORMAT(date, "%Y-%m-%d") as date,'
        + ' writer, count from announce_inf_tbl, (SELECT @rownum:='+skip+') TMP'+ addSQL
        + ' order by no desc limit '+ skip + ', ' + limit + ";",
        [srchText, srchText],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                var count = results[0][0].cnt;
                var maxPage = Math.ceil(count/limit);

                res.render('./admin/announce/list', {board : results[1], srchType: srchType, srchText : srchText, page : page, maxPage: maxPage, offset: offset, session : ss});
            }
        });
});

router.get('/new', function(req, res) {
    console.log('routes 게시글 작성 화면 호출');
    var ss = req.session;
    res.render('./admin/announce/new', {session : ss});
});

router.post('/insert', function(req, res) {
    console.log('routes 게시글 작성 처리');

    conn.query('insert into announce_inf_tbl(title, content, date, writer, category) values(?, ?, now(), ?, ?)',
        [req.body.title, req.body.content, req.body.writer, req.body.ctg],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                res.redirect('/admin/announce/');
            }
        });
});

// 수정 화면 호출.
router.get('/edit/:no', function(req, res) {

    var ss = req.session;

    console.log("수정 화면 호출처리.");
    conn.query('select @rownum:=@rownum+1 as num, category, no, title, content, DATE_FORMAT(date, "%Y-%m-%d") as date, writer, count from announce_inf_tbl, (SELECT @rownum:=0) TMP where no = ?',
        [req.params.no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('routes announce Edit View !!!');
                res.render('./admin/announce/edit', {board : results[0], session : ss});
            }
        });
});

// 게시글 상세 화면 호출.
router.get('/view/:no', function(req, res) {
    console.log("상세 화면 호출처리.");

    var ss = req.session;

    // 뷰 카운트 추가.
    console.log("조회업데이트");
    conn.query('update announce_inf_tbl set count = (select * from (select count+1 from announce_inf_tbl where no = ?) as tmp) where no = ?',
        [req.params.no,req.params.no],
        function(err) {
            if (err) {
                console.log('error : ', err.message);
            }
        }
    );

    // 리스트 조회 처리.
    conn.query('select no, title, content, DATE_FORMAT(date, "%Y-%m-%d") as date, writer, count, category from announce_inf_tbl where no = ?',
        [req.params.no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('routes board view Result !!!');
                res.render('./admin/announce/view', {board : results[0], session : ss});
            }
        });
});

// 게시글 수정 처리.
router.post('/edit/do', function(req, res) {
    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.

    var ss = req.session;

    console.log("게시글 수정 처리");
    conn.query('update announce_inf_tbl set title = ?, content = ?, writer = ?, date = now(),  category = ? where no = ?',
        [req.body.title, req.body.content, req.body.writer, req.body.ctg, req.body.no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            }
        });

    console.log("수정후 상세 화면 호출처리.");
    conn.query('select @rownum:=@rownum+1 as num, category, no, title, content, DATE_FORMAT(date, "%Y-%m-%d") as date,'
        + '  writer, count from announce_inf_tbl, (SELECT @rownum:=0) TMP where no = ?',
        [req.body.no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('routes board View Result !!!');
                res.render('./admin/announce/view', {board : results[0], session : ss});
            }
        });
});

// 게시글 삭제.(get)
router.get('/delete/:no', function(req, res) {

    var ss = req.session;

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log("게시글 삭제 처리");
    conn.query('delete from announce_inf_tbl where no = ?',
        [req.params.no],
        function(err) {
            if(err) {
                console.log('error : ', err.message);
            }
        });
    console.log("게시글 화면 호출처리.");
    conn.query('select @rownum:=@rownum+1 as num, no, title, content, DATE_FORMAT(date, "%Y-%m-%d") as date, writer,'
        + '  count, category from announce_inf_tbl, (SELECT @rownum:=0) TMP',
        [],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('routes board View Result !!!');
                //res.render('./admin/announce/list', {board : results, session : ss});
                res.redirect('/admin/announce/');
            }
        });
});


// 게시글 삭제.(post)
router.post('/delete', function(req, res) {

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log("게시글 삭제 처리");

    var params = req.body['dataList'];

    for (var i = 0; i < params.length; i++) {
        //console.log(">>> get params[" + i + "] =" + params[i]);
        conn.query('delete from announce_inf_tbl where no = ?',
            [params[i]],
            function (err) {
                if (err) {
                    console.log('error : ', err.message);
                }
            });
    }

    res.json({'result' : 'OK'});
});

// 서브 코멘트 조회
router.post('/comment', function(req, res) {

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    conn.query('select writer, email, content from test_comment_tbl',
        [],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                res.render('./admin/announce/view', {board : results[0], comment : results});
            }
        });

});

module.exports = router;