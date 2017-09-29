/*
 * 모듈명  : announce.js
 * 설명    : JT-LAB 화면 '공지사항' 에 대한 모듈.
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
    insecureAuth: true
});

// 게시글 리스트 호출.
router.get('/', function(req, res) {

    var ss = req.session;
    console.log(">>> userId = " + ss.usrId);
    console.log(">>> userName = " + ss.usrName);

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    conn.query('select @rownum:=@rownum+1 as num, no, title, content, DATE_FORMAT(date, "%Y-%m-%d") as date, writer, count from announce_inf_tbl, (SELECT @rownum:=0) TMP',
        [],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.render('./announce/list', {title : "공지사항", rList : results, session : ss});
            }
        });
});


// 게시글 상세 화면 호출.
router.get('/view/:no', function(req, res) {
    console.log("상세 화면 호출처리.");

    var ss = req.session;

    // 뷰 카운트 추가.
    console.log("조회 상세 조회");

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
    conn.query('select no, title, content, DATE_FORMAT(date, "%Y-%m-%d") as date, writer, count from announce_inf_tbl where no = ?',
        [req.params.no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.log('routes view Result !!!');
                res.render('./announce/view', {title : "공지사항 상세", result : results[0], session : ss});
            }
        });
});

module.exports = router;