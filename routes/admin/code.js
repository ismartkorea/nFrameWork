/*
 * 모듈명  : code.js
 * 설명    : 관리자화면 메뉴 'AssistPro 카테고리 관리' 에 대한 모듈.
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

// 카테고리(대) 관리 화면 호출
router.get('/category', function(req, res) {
    var ss = req.session;

    conn.query('SELECT @rownum:=@rownum+1 as num, s.cateNo, s.cateName from (SELECT t1.category_no as cateNo,'
        + ' t1.name as cateName FROM category_inf_tbl AS t1'
        + ' WHERE t1.parent_no is null group by t1.name order by t1.name asc) s, (SELECT @rownum:=0) TMP',
        [],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.render('./admin/code/category/list', {rList : results, session : ss});
            }
        }
    );

});

// 카테고리(대) 관리 저장 처리.
router.post('/category/insert', function(req, res) {
    var ss = req.session;

    conn.query('INSERT INTO category_inf_tbl(`name`) values( ? );',
        [req.body.cateName],
        function(err) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.redirect('/admin/code/category');
            }
    });
});

// 카테고리(대) 관리 삭제 처리.
router.post('/category/delete', function(req, res) {

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log("삭제 처리");

    var ss = req.session;

    var params = req.body['dataList'];

    for (var i = 0; i < params.length; i++) {
        //console.log(">>>> params[" + i + "] = " + params[i]);
        conn.query('delete from category_inf_tbl where category_no = ?;'
            + ' delete from category_inf_tbl where parent_no = ?;',
            [params[i], params[i]],
            function (err) {
                if (err) {
                    console.log('error : ', err.message);
                    res.render('error', {message: err.message, error : err, session: ss});
                }
            });
    }

    res.json({'result' : 'OK'});
});

// 카테고리(중) 관리 화면 호출
router.get('/category2', function(req, res) {
    var ss = req.session;

    conn.query('SELECT @rownum:=@rownum+1 as num, s.cateName1, s.cateName2, s.cateNo FROM ('
        + 'SELECT t1.name as cateName1, t2.name as cateName2, t2.category_no as cateNo FROM category_inf_tbl AS t1'
        + ' LEFT JOIN category_inf_tbl as t2 ON t1.category_no = t2.parent_no WHERE t1.parent_no is null'
        + ' group by t1.name, t2.name order by t1.name, t1.order_no, t2.order_no asc) s, (SELECT @rownum:=0) TMP;'
        + 'SELECT t3.category_no as cateNo3, t3.name as cateName3 FROM category_inf_tbl t3 WHERE t3.parent_no is null'
        + ' group by t3.name order by t3.name asc;',
        [],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.render('./admin/code/category/listM', {rList : results[0], rList2 : results[1], session : ss});
            }
        }
    );

});

// 카테고리(중) 관리 저장 처리.
router.post('/category2/insert', function(req, res) {
    var ss = req.session;

    conn.query('INSERT INTO category_inf_tbl(`name`, `parent_no`) values(?, ?);',
        [req.body.cateName, req.body.cateSelBox],
        function(err) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.redirect('/admin/code/category2');
            }
        });
});

// 카테고리(중) 관리 삭제 처리.
router.post('/category2/delete', function(req, res) {

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log("삭제 처리");

    var ss = req.session;
    var params = req.body['dataList'];

    for (var i = 0; i < params.length; i++) {
        console.log(">>>> params[" + i + "] = " + params[i]);
        conn.query('delete from category_inf_tbl where category_no = ?;',
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

// 카테고리(소) 관리 화면 호출
router.get('/category3', function(req, res) {
    var ss = req.session;

    var srchCategory1 = req.body.category1 != null ? req.body.category1 : "";
    var srchCategory2 = req.body.category2 != null ? req.body.category2 : "";

    conn.query('SELECT @rownum:=@rownum+1 as num, s.cateName1, s.cateName2, s.cateName3, s.cateNo FROM ('
        + 'SELECT t1.name AS cateName1, t2.name as cateName2, t3.name as cateName3, t3.category_no as cateNo'
        + ' FROM category_inf_tbl AS t1 LEFT JOIN category_inf_tbl AS t2 ON t2.parent_no = t1.category_no'
        + ' LEFT JOIN category_inf_tbl AS t3 ON t3.parent_no = t2.category_no WHERE t1.parent_no is null'
        + ' group by t1.name, t2.name, t3.name order by t1.name, t2.order_no, t3.order_no) s, (SELECT @rownum:=0) TMP;'
        + ' SELECT t2.name as cateName3, t2.category_no as cateNo3 FROM category_inf_tbl AS t1'
        + ' LEFT JOIN category_inf_tbl as t2 ON t1.category_no = t2.parent_no WHERE t2.category_no IS NOT NULL;'
        + ' SELECT t1.category_no as cateNo, t1.name as cateName FROM category_inf_tbl AS t1'
        + ' WHERE t1.parent_no is null group by t1.name order by t1.name asc;',
        [],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.render('./admin/code/category/listS', {rList : results[0], rList2 : results[1], cList : results[2], srchCategory1 : srchCategory1 , srchCategory2 : srchCategory2, session : ss});
            }
        }
    );

});

// 카테고리(소) 관리 저장 처리.
router.post('/category3/insert', function(req, res) {
    var ss = req.session;

    conn.query('INSERT INTO category_inf_tbl(`name`, `parent_no`) values(?, ?);',
        [req.body.cateName, req.body.category2],
        function(err) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.redirect('/admin/code/category3');
            }
        });
});

// 카테고리(소) 관리 삭제 처리.
router.post('/category3/delete', function(req, res) {

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log("삭제 처리");

    var ss = req.session;

    var params = req.body['dataList'];

    for (var i = 0; i < params.length; i++) {
        console.log(">>>> params[" + i + "] = " + params[i]);
        conn.query('delete from category_inf_tbl where category_no = ?;',
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

// 카테고리2(중분류) 리스트 조회
router.post('/getcate2', function(req, res) {
    var ss = req.session;

    console.log(">>>> setDataVal : " + req.body.setDataVal);

    conn.query('SELECT t2.name as cateName2, t2.category_no as cateNo2 FROM category_inf_tbl AS t1'
        + ' LEFT JOIN category_inf_tbl AS t2 ON t2.parent_no = t1.category_no WHERE t1.category_no = ?;',
        [req.body.setDataVal],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.json({result : 'OK', rList : results, session : ss});
            }
        }
    );
});

module.exports = router;