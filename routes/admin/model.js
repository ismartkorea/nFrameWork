/*
 * 모듈명  : model.js
 * 설명    : 관리자화면 메뉴 '자동차 브랜드(코드) 관리' 에 대한 모듈.
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

// 자동차 브랜드 관리 화면 호출
router.get('/category', function(req, res) {
    var ss = req.session;

    var srchType = req.query.srchType != null ? req.query.srchType : "";
    var srchText = req.query.srchText != null ? req.query.srchText : "";
    console.log(">>> srchType : " + srchType);
    console.log(">>> srchText : " + srchText);
    var addSQL = "";
    // 검색 조건 처리.
    if (srchType == "brand") {
        addSQL = ' where s.cateName like concat(?,"%")';
    }
    // 페이징 처리.
    var reqPage = req.query.page ? parseInt(req.query.page) : 0;
    var offset = 3;
    var page = Math.max(1, reqPage);
    var limit = 10;
    var skip = (page - 1) * limit;

    conn.query('SELECT COUNT(s.cateNo) as cnt FROM (SELECT t1.category_no as cateNo, t1.name as cateName'
        + ' FROM car_cate_inf_tbl AS t1 WHERE t1.parent_no is null group by t1.name order by t1.name asc) s '+ addSQL + ";"
        + ' SELECT @rownum:=@rownum+1 as num, s.cateNo, s.cateName from (SELECT t1.category_no as cateNo,'
        + ' t1.name as cateName FROM car_cate_inf_tbl AS t1 WHERE t1.parent_no is null group by t1.name order by t1.name asc) s,'
        + ' (SELECT @rownum:=' + skip + ') TMP' + addSQL + ' limit ' + skip + ', ' + limit + ";",
        [srchText, srchText],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                var count = results[0][0].cnt;
                var maxPage = Math.ceil(count / limit);

                res.render('./admin/code/model/list', {
                    rList : results[1],
                    srchType: srchType,
                    srchText: srchText,
                    page: page,
                    maxPage: maxPage,
                    offset: offset,
                    session : ss
                    }
                );
            }
        }
    );

});

// 브랜드 검색 처리.
router.post('/category/search', function(req, res) {
    var ss = req.session;

    var srchType = req.body.srchType != null ? req.body.srchType : "";
    var srchText = req.body.srchText != null ? req.body.srchText : "";
    console.log(">>> srchType : " + srchType);
    console.log(">>> srchText : " + srchText);
    var addSQL = "";
    // 검색 조건 처리.
    if (srchType == "brand") {
        addSQL = ' where s.cateName like concat(?,"%")';
    }
    // 페이징 처리.
    var reqPage = req.query.page ? parseInt(req.query.page) : 0;
    var offset = 3;
    var page = Math.max(1, reqPage);
    var limit = 10;
    var skip = (page - 1) * limit;

    conn.query('SELECT COUNT(s.cateNo) as cnt FROM (SELECT t1.category_no as cateNo, t1.name as cateName'
        + ' FROM car_cate_inf_tbl AS t1 WHERE t1.parent_no is null group by t1.name order by t1.name asc) s '+ addSQL + ";"
        + ' SELECT @rownum:=@rownum+1 as num, s.cateNo, s.cateName from (SELECT t1.category_no as cateNo,'
        + ' t1.name as cateName FROM car_cate_inf_tbl AS t1 WHERE t1.parent_no is null group by t1.name order by t1.name asc) s,'
        + ' (SELECT @rownum:=' + skip + ') TMP' + addSQL + ' limit ' + skip + ', ' + limit + ";",
        [srchText, srchText],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                var count = results[0][0].cnt;
                var maxPage = Math.ceil(count / limit);

                res.render('./admin/code/model/list', {
                        rList : results[1],
                        srchType: srchType,
                        srchText: srchText,
                        page: page,
                        maxPage: maxPage,
                        offset: offset,
                        session : ss
                    }
                );
            }
        }
    );

});

// 카테고리(대) 관리 저장 처리.
router.post('/category/insert', function(req, res) {
    var ss = req.session;

    conn.query('INSERT INTO car_cate_inf_tbl(`name`) values( ? );',
        [req.body.cateName],
        function(err) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.redirect('/admin/model/category');
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
        console.log(">>>> params[" + i + "] = " + params[i]);
        conn.query('delete from car_cate_inf_tbl where category_no = ?;'
            + ' delete from car_cate_inf_tbl where parent_no = ?;',
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

    var srchType = req.query.srchType != null ? req.query.srchType : "";
    var srchText = req.query.srchText != null ? req.query.srchText : "";
    console.log(">>> srchType : " + srchType);
    console.log(">>> srchText : " + srchText);
    var addSQL = "";
    // 검색 조건 처리.
    if (srchType == "brand") {
        addSQL = ' where s.cateName1 like concat(?,"%")';
    } else if (srchType == "model") {
        addSQL = ' where s.cateName2 like concat(?,"%")';
    }
    // 페이징 처리.
    var reqPage = req.query.page ? parseInt(req.query.page) : 0;
    var offset = 3;
    var page = Math.max(1, reqPage);
    var limit = 10;
    var skip = (page - 1) * limit;
    // 쿼리 처리.
    conn.query('SELECT @rownum:=@rownum+1 as num, s.cateName1, s.cateName2, s.cateNo FROM ('
        + 'SELECT t1.name as cateName1, t2.name as cateName2, t2.category_no as cateNo FROM car_cate_inf_tbl AS t1'
        + ' LEFT JOIN car_cate_inf_tbl as t2 ON t1.category_no = t2.parent_no WHERE t2.parent_no is not null'
        + ' group by t1.name, t2.name order by t1.name, t1.order_no, t2.order_no asc) s, (SELECT @rownum:=' + skip + ') TMP' + addSQL + ' limit ' + skip + ', ' + limit + ";"
        + 'SELECT t3.category_no as cateNo3, t3.name as cateName3 FROM car_cate_inf_tbl t3 WHERE t3.parent_no is null'
        + ' group by t3.name order by t3.name asc;'
        + ' SELECT COUNT(s.cateNo) as cnt FROM ('
        + ' SELECT t1.name as cateName1, t2.name as cateName2, t2.category_no as cateNo FROM car_cate_inf_tbl AS t1'
        + ' LEFT JOIN car_cate_inf_tbl as t2 ON t1.category_no = t2.parent_no WHERE t2.parent_no is not null'
        + ' group by t1.name, t2.name order by t1.name, t1.order_no, t2.order_no asc) s '+ addSQL + ";",
        [srchText, srchText],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                var count = results[2][0].cnt;
                var maxPage = Math.ceil(count / limit);

                res.render('./admin/code/model/listM', {rList : results[0], rList2 : results[1], srchType: srchType, srchText: srchText, page: page, maxPage: maxPage, offset: offset, session : ss});
            }
        }
    );

});

// 카테고리(중) 검색 처리.
router.post('/category2/search', function(req, res) {
    var ss = req.session;

    var srchType = req.body.srchType != null ? req.body.srchType : "";
    var srchText = req.body.srchText != null ? req.body.srchText : "";
    console.log(">>> srchType : " + srchType);
    console.log(">>> srchText : " + srchText);
    var addSQL = "";

    // 검색조건 처리.
    if (srchType == "brand") {
        addSQL = ' WHERE s.cateName1 LIKE concat("%", ?,"%")';
    } else if (srchType == "model") {
        addSQL = ' WHERE s.cateName2 LIKE concat(?,"%")';
    }
    // 페이징 처리.
    var reqPage = req.query.page ? parseInt(req.query.page) : 0;
    var offset = 3;
    var page = Math.max(1, reqPage);
    var limit = 10;
    var skip = (page - 1) * limit;
    // 쿼리 처리.
    conn.query('SELECT @rownum:=@rownum+1 as num, s.cateName1, s.cateName2, s.cateNo FROM ('
        + 'SELECT t1.name as cateName1, t2.name as cateName2, t2.category_no as cateNo FROM car_cate_inf_tbl AS t1'
        + ' LEFT JOIN car_cate_inf_tbl as t2 ON t1.category_no = t2.parent_no WHERE t2.parent_no is not null'
        + ' group by t1.name, t2.name order by t1.name, t1.order_no, t2.order_no asc) s, (SELECT @rownum:=' + skip + ') TMP' + addSQL + ' LIMIT ' + skip + ', ' + limit + ";"
        + ' SELECT t3.category_no as cateNo3, t3.name as cateName3 FROM car_cate_inf_tbl t3 WHERE t3.parent_no is null'
        + ' group by t3.name order by t3.name asc;'
        + ' SELECT COUNT(s.cateNo) as cnt FROM ('
        + ' SELECT t1.name as cateName1, t2.name as cateName2, t2.category_no as cateNo FROM car_cate_inf_tbl AS t1'
        + ' LEFT JOIN car_cate_inf_tbl as t2 ON t1.category_no = t2.parent_no WHERE t2.parent_no is not null'
        + ' group by t1.name, t2.name order by t1.name, t1.order_no, t2.order_no asc) s '+ addSQL + ";",
        [srchText, srchText],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                var count = results[2][0].cnt;
                console.log("count", count);
                var maxPage = Math.ceil(count / limit);

                res.render('./admin/code/model/listM', {rList : results[0], rList2 : results[1], srchType: srchType, srchText: srchText, page: page, maxPage: maxPage, offset: offset, session : ss});
            }
        }
    );

});

// 카테고리(중) 관리 저장 처리.
router.post('/category2/insert', function(req, res) {
    var ss = req.session;

    conn.query('INSERT INTO car_cate_inf_tbl(`name`, `parent_no`) values(?, ?);',
        [req.body.cateName, req.body.cateSelBox],
        function(err) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.redirect('/admin/model/category2');
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
        //console.log(">>>> params[" + i + "] = " + params[i]);
        conn.query('delete from car_cate_inf_tbl where category_no = ?;',
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

    conn.query('SELECT @rownum:=@rownum+1 as num, s.cateName1, s.cateName2, s.cateName3, s.cateNo FROM ('
        + 'SELECT t1.name AS cateName1, t2.name as cateName2, t3.name as cateName3, t3.category_no as cateNo'
        + ' FROM car_cate_inf_tbl AS t1 LEFT JOIN car_cate_inf_tbl AS t2 ON t2.parent_no = t1.category_no'
        + ' LEFT JOIN car_cate_inf_tbl AS t3 ON t3.parent_no = t2.category_no WHERE t1.parent_no is null'
        + ' group by t1.name, t2.name, t3.name order by t1.name, t2.order_no, t3.order_no) s, (SELECT @rownum:=0) TMP;'
        + ' SELECT t2.name as cateName3, t2.category_no as cateNo3 FROM car_cate_inf_tbl AS t1'
        + ' LEFT JOIN car_cate_inf_tbl as t2 ON t1.category_no = t2.parent_no WHERE t2.category_no IS NOT NULL;',
        [],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.render('./admin/code/model/listS', {rList : results[0], rList2 : results[1], session : ss});
            }
        }
    );

});

// 카테고리(소) 관리 저장 처리.
router.post('/category3/insert', function(req, res) {
    var ss = req.session;

    conn.query('INSERT INTO car_cate_inf_tbl(`name`, `parent_no`) values(?, ?);',
        [req.body.cateName, req.body.cateSelBox],
        function(err) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.redirect('/admin/model/category3');
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
        //console.log(">>>> params[" + i + "] = " + params[i]);
        conn.query('delete from car_cate_inf_tbl where category_no = ?;',
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