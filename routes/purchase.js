/*
 * 모듈명  : purchase.js
 * 설명    : JT-LAB 화면 '상품결제정보' 에 대한 모듈.
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
var config = require('./common/dbconfig');
var utils = require("./common/utils");
var async = require('async');
var router = express.Router();

//var fullPrice = (basicSrcMonthAmount * 360 / 30) + (plusService1 * 360 / 30) + (plusService2 * 360 / 30) + (plusService3 * 360 / 30);

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));
router.use(methodOverride("_method"));
router.use(flash());

/**
 * 각 상품코드 별로 구매안내 페이지 호출 하는 부분.
 */
router.get('/:pCode/:pUniqCode', function(req, res) {
    console.log(' 구매 안내 페이지 호출');
    var ss = req.session;
    var pCode = req.params.pCode !=null ? req.params.pCode : '';
    var pUniqCode = req.params.pUniqCode !=null ? req.params.pUniqCode : '';
    var termDays = req.body.termDays !=null ? req.body.termDays : '30';

    // 상품 리스트 조회.
    var SQL1 = 'SELECT p_no as pNo, p_code as pCode, p_nm as pNm, p_price as pPrice, p_uniq_code as pUniqCode, p_smmry as pSmmry,'
        + ' p_desc as pDesc, p_type as pType, opt_cnt as optCnt, p_stock_count as pStockCount'
        + ' FROM product_lab_info_tbl WHERE p_div = "M" AND p_display_yn = "Y" AND p_code = ?;';
    // 장바구니 리스트 조회.
    var SQL2 = ' SELECT p_code as pCode, p_pair_code_yn as pPairCodeYn, p_pair_code as pPairCode, p_div as pDiv, p_type as pType,'
        + ' CASE WHEN p_div = "M" THEN "기본" WHEN p_div = "O" THEN "옵션" ELSE "" END as pDivNm,'
        + ' p_opt_btn_dis_yn as pOptBtnDisYn, p_nm as pNm, p_price as pPrice, opt_cnt as optCnt, p_count as pCount,'
        + ' p_uniq_code as pUniqCode FROM lab_cart_inf_tbl WHERE usr_id = ? AND p_uniq_code = ? ORDER BY p_code ASC, sort_no ASC;';
    // 장바구니 합계 조회.
    var SQL3 = 'SELECT SUM(p_price) as price FROM lab_cart_inf_tbl WHERE usr_id = ? AND p_uniq_code = ?;';
    // 상품결제 정보 조회.
    var SQL4 = 'SELECT x.order_no as orderNo, x.p_code as pCode, x.p_pair_code_yn as pPairCodeYn,'
        + ' CASE WHEN x.p_div = "M" THEN "기본" WHEN x.p_div = "O" THEN "옵션" ELSE "" END as pDiv,'
        + ' x.p_opt_btn_dis_yn as pOptBtnDisYn, x.p_nm as pNm, x.p_price as pPrice, x.p_uniq_code as pUniqCode,'
        + ' x.sort_no as sortNo, y.pay_result as payResult,'
        + ' CASE WHEN y.pay_result = "wait" THEN "대기" WHEN y.pay_result = "paid" THEN "결제완료" WHEN y.pay_result = "end" THEN "서비스종료"'
        + ' WHEN y.pay_result = "cancelled" THEN "결제취소" WHEN y.pay_result = "failed" THEN "결제실패"'
        + ' WHEN y.pay_result = "refunded" THEN "환불완료" WHEN y.pay_result = "ready" THEN "미결제"'
        + ' ELSE "" END as payStatus'
        + ' FROM lab_order_detail_inf_tbl x, lab_pay_info_tbl y WHERE x.order_no = y.order_no AND x.p_type = "SVC"'
        + ' AND x.usr_id = y.usr_id AND y.pay_result = "paid" AND x.p_uniq_code = ?'
        + ' AND y.usr_id = ? ORDER BY x.p_code ASC, x.sort_no ASC;';
    // 결제 정보 조회.
    var SQL5 = 'SELECT x.order_no as orderNo, x.use_term_days as useTermDays, @rDays:=use_term_days, DATEDIFF(now(), x.pay_date) as usedDays,'
        + ' DATEDIFF(adddate(x.pay_date, @rDays), now()) as remainDays, x.p_sum_price as totalPrice,'
        + ' ROUND(x.p_sum_price / @rDays) as dayPrice, ROUND((x.p_sum_price / @rDays) * DATEDIFF(adddate(x.pay_date, @rDays), now())) as remainPrice'
        + ' FROM lab_pay_info_tbl x, lab_order_detail_inf_tbl y WHERE x.order_no = y.order_no AND y.p_type = "SVC" AND y.p_code = ? AND x.pay_result = "paid" AND x.usr_id = ?;';
    // 결제 정보 승인대기 갯수 조회.
    var SQL6 = ' SELECT COUNT(x.order_no) as cnt'
        + ' FROM lab_pay_info_tbl x, lab_order_detail_inf_tbl y WHERE x.order_no = y.order_no'
        + ' AND y.p_uniq_code = ? AND x.pay_result = "wait" AND x.usr_id = ?;';

    // MySQL Connect
    var conn = mysql.createConnection(config);

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    conn.connect();
    conn.query(SQL1+SQL2+SQL3+SQL4+SQL5+SQL6,
        [pCode, ss.usrId, pUniqCode, pUniqCode, ss.usrId, pUniqCode, ss.usrId, pCode, ss.usrId, pUniqCode, ss.usrId],
        function(err, results) {
            if(err) {
                console.log('err : ', err);
            } else {
                var cartPrice = 0;
                if(results[2].length > 0) {
                    cartPrice = results[2][0].price;
                }
                console.log('results');
                res.render('./puchase', {
                    'rList': results[0],
                    'rList1' : '',
                    'rList2' : results[1],
                    'rList3' : '',
                    'rList4' : results[3],
                    'rList5' : results[4],
                    'rCnt' : results[5][0].cnt,
                    'result' : '',
                    'price' : cartPrice,
                    'payPrice' : 0,
                    'termDays' : termDays,
                    'payCmpltYn' : '',
                    'productCode' :pCode,
                    'productUniqCode' : pUniqCode,
                    'session': ss
                });
            }
        });
    conn.end();

});


/**
 * 구매안내 페이지 호출 부분.
 */
router.get('/', function(req, res) {
    console.log('routes 구매안내 화면 호출.');
    var ss = req.session;
    var termDays = req.body.termDays !=null ? req.body.termDays : '30';
    console.log('termDays : ', termDays + '\n');

    // MySQL Connect
    var conn = mysql.createConnection(config);

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    conn.connect();
    conn.query('SELECT p_no as pNo, p_code as pCode, p_nm as pNm, p_price as pPrice, p_uniq_code as pUniqCode,'
        + ' p_desc as pDesc, opt_cnt as optCnt FROM product_lab_info_tbl WHERE p_div = "M" AND p_display_yn = "Y";'
        + ' SELECT p_code as pCode, p_pair_code_yn as pPairCodeYn, p_pair_code as pPairCode, p_div as pDiv,'
        + ' CASE WHEN p_div = "M" THEN "기본" WHEN p_div = "O" THEN "옵션" ELSE "" END as pDivNm,'
        + ' p_opt_btn_dis_yn as pOptBtnDisYn, p_nm as pNm, p_price as pPrice, opt_cnt as optCnt,'
        + ' p_uniq_code as pUniqCode FROM lab_cart_inf_tbl WHERE usr_id = ? ORDER BY p_code ASC, sort_no ASC;'
        + 'SELECT SUM(p_price) as price FROM lab_cart_inf_tbl WHERE usr_id = ?;'
        + 'SELECT x.order_no as orderNo, x.p_code as pCode, x.p_pair_code_yn as pPairCodeYn,'
        + ' CASE WHEN x.p_div = "M" THEN "기본" WHEN x.p_div = "O" THEN "옵션" ELSE "" END as pDiv,'
        + ' x.p_opt_btn_dis_yn as pOptBtnDisYn, x.p_nm as pNm, x.p_price as pPrice, x.p_uniq_code as pUniqCode,'
        + ' x.sort_no as sortNo, y.pay_result as payResult,'
        + ' CASE WHEN y.pay_result = "wait" THEN "대기" WHEN y.pay_result = "paid" THEN "결제완료" WHEN y.pay_result = "end" THEN "서비스종료"'
        + ' WHEN y.pay_result = "cancelled" THEN "결제취소" WHEN y.pay_result = "failed" THEN "결제실패"'
        + ' WHEN y.pay_result = "refunded" THEN "환불완료" WHEN y.pay_result = "ready" THEN "미결제"'
        + ' ELSE "" END as payStatus'
        + ' FROM lab_order_detail_inf_tbl x, lab_pay_info_tbl y WHERE x.order_no = y.order_no'
        + ' AND x.usr_id = y.usr_id AND y.pay_result = "paid" AND y.usr_id = ? ORDER BY x.p_code ASC, x.sort_no ASC;'
        + 'SELECT order_no as orderNo, use_term_days as useTermDays, @rDays:=use_term_days, DATEDIFF(now(), pay_date) as usedDays,'
        + ' DATEDIFF(adddate(pay_date, @rDays), now()) as remainDays, p_total_price as totalPrice,'
        + ' ROUND(p_total_price / @rDays) as dayPrice, ROUND((p_total_price / @rDays) * DATEDIFF(adddate(pay_date, @rDays), now())) as remainPrice'
        + ' FROM lab_pay_info_tbl WHERE pay_result = "paid" AND usr_id = ?;'
        + ' SELECT COUNT(x.order_no) as cnt'
        + ' FROM lab_pay_info_tbl x, lab_order_detail_inf_tbl y WHERE x.order_no = y.order_no'
        + ' AND y.p_code = "APP170109ASS" AND x.pay_result = "wait" AND x.usr_id = ?;',
        [ss.usrId, ss.usrId, ss.usrId, ss.usrId, ss.usrId],
        function (err, results) {
            if (err) {
                console.log('error : ', err.message);
                res.send(err);
            } else {
                var cartPrice = 0;
                if(results[2].length > 0) {
                    cartPrice = results[2][0].price;
                }
                res.render('./puchase', {
                    'rList': results[0],
                    'rList1' : '',
                    'rList2' : results[1],
                    'rList3' : '',
                    'rList4' : results[3],
                    'rList5' : results[4],
                    'rCnt' : results[5][0].cnt,
                    'result' : '',
                    'price' : cartPrice,
                    'payPrice' : 0,
                    'termDays' : termDays,
                    'payCmpltYn' : '',
                    'session': ss
                });
            }
        });
    conn.end();
});

/**
 * 옵션 조회 처리.
 */
router.post('/opt', function(req, res) {
    console.log('routes 옵션 조회 처리.');
    var ss = req.session;
    var pCode = req.body.pCode !=null ? req.body.pCode : '';
    var pUniqCode = req.body.pUniqCode !=null ? req.body.pUniqCode : '';
    //var termDays = req.body.termDays !=null ? req.body.termDays : '30';
    console.log('pUniqCode : ', pUniqCode);

    // MySQL 쿼리 조회.
    var conn = mysql.createConnection(config);
    conn.connect();

    conn.query('SELECT p_no as pNo, p_code as pCode, p_nm as pNm, p_price as pPrice, p_uniq_code as pUniqCode,'
        + ' CASE WHEN p_div = "M" THEN "기본" WHEN p_div = "O" THEN "옵션" ELSE "" END as pDivNm,'
        + ' p_opt_btn_dis_yn as pOptBtnDisYn, p_nm as pNm, p_price as pPrice, p_desc as pDesc, p_uniq_code as pUniqCode,'
        + ' opt_cnt as optCnt, sort_no as sortNo FROM product_lab_info_tbl WHERE p_div = "O" AND p_uniq_code = ?;',
        [pUniqCode],
        function(err, results) {
            if(err) {
                console.log('err : ', err);
            } else {
                res.status(200).json({'cnt' : results.length, 'list' : results, 'session' : ss});
            }
        });
    conn.end();
});

/**
 * 카트 저장 처리.
 */
router.post('/cart/save', function(req, res) {
    console.log('routes 카트 저장 처리');
    var ss = req.session;

    var DEL_SQL1 = ''; var DEL_SQL2 = '';
    var pCode = req.body.pCode !=null ? req.body.pCode : '';
    var pUniqCode = req.body.pUniqCode !='null' ? req.body.pUniqCode : '';
    var pPairCodeYn = req.body.pPairCodeYn !='null' ? req.body.pPairCodeYn : 'N';
    var pPairCode = req.body.pPairCode !='null' ? req.body.pPairCode : '';
    var optSelectedYn = req.body.optSelectedYn !='null' ? req.body.optSelectedYn : 'N';
    var termDays = req.body.termDays !=null ? req.body.termDays : '30';
    var pCount = req.body.pCount !=null ? req.body.pCount : 0;
    console.log('pUniqCode : ', pUniqCode);
    console.log('pPairCodeYn : ', pPairCodeYn);
    console.log('pPairCode : ', pPairCode + '\n');
    console.log('optSelectedYn : ', optSelectedYn + '\n');

    if(pPairCodeYn == 'Y') {
        DEL_SQL1 = 'DELETE FROM lab_cart_inf_tbl WHERE p_code = "' + pPairCode + '" AND p_uniq_code = ? AND usr_id = ?;';
        console.log('>>> DEL_SQL1 : ', DEL_SQL1 + '\n');
    }

    var DEL_SQL2 = 'DELETE FROM lab_cart_inf_tbl WHERE p_code = ? AND p_uniq_code = ? AND usr_id = ?;';
    console.log('>>> DEL_SQL2 : ', DEL_SQL2 + '\n');

    async.waterfall([
        function(callback) {

            if(pPairCodeYn == 'Y') {
                console.log(' 기존 pUniqCode 삭제처리 요청');
                var conn = mysql.createConnection(config);
                conn.connect();
                conn.query(DEL_SQL1,
                    [pUniqCode, ss.usrId],
                    function (err, results) {
                        if (err) {
                            console.log('err : ', err);
                        } else {
                            console.dir(results);
                        }
                    }
                );
                conn.commit();
                conn.end();
            }
            console.log(' 기존 pCode 삭제처리 요청');
            var conn = mysql.createConnection(config);
            conn.connect();
            conn.query(DEL_SQL2,
                [pCode, pUniqCode, ss.usrId],
                function (err, results) {
                    if (err) {
                        console.log('err : ', err);
                    } else {
                        console.dir(results);
                    }
                }
            );
            conn.commit();
            conn.end();

            callback(null);

        },
        function(callback) {

            console.log(' 기본서비스 삭제 처리 요청');
            // MySQL Connect
            var conn = mysql.createConnection(config);

            // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
            conn.connect();
            conn.query('DELETE FROM lab_cart_inf_tbl WHERE p_div = "M" AND p_uniq_code = ? AND usr_id = ?',
                [pUniqCode, ss.usrId],
                function (err, results) {
                    if (err) {
                        console.log('err : ', err);
                    } else {
                        console.dir(results);
                        callback(null);
                    }
                });
            conn.commit();
            conn.end();
        },
        function(callback) {
            console.log(' 기본서비스 저장 처리 요청');
            // MySQL Connect
            var conn = mysql.createConnection(config);

            // 상품테이블에서 메인 상품 정보 조회한 후 저장 처리.
            conn.connect();
            conn.query('INSERT INTO lab_cart_inf_tbl(usr_id, p_code, p_pair_code_yn, p_pair_code, p_div, p_type, p_gubun,'
                + ' p_opt_btn_dis_yn, p_nm, p_price, p_uniq_code, sort_no, opt_cnt, p_count, insert_dt, insert_usr, update_dt, update_usr)'
                + 'SELECT "' + ss.usrId + '", p_code,  p_pair_code_yn, p_pair_code, p_div, p_type, p_gubun,'
                + ' p_opt_btn_dis_yn, p_nm, p_price, p_uniq_code, sort_no, opt_cnt, "' + pCount + '", now(), "' + ss.usrId + '", now(),'
                + '"' + ss.usrId + '" FROM product_lab_info_tbl WHERE p_div = "M" AND p_uniq_code = ?',
                [pUniqCode],
                function (err, results) {
                    if (err) {
                        console.log('err : ', err);
                    } else {
                        console.dir(results);
                        callback(null);
                    }
                });
            conn.commit();
            conn.end();
        },
        function(callback) {

            console.log(' 옵션 저장 처리 요청');
            // MySQL Connect
            var conn = mysql.createConnection(config);


            // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
            conn.connect();
            conn.query('INSERT INTO lab_cart_inf_tbl(usr_id, p_code, p_pair_code_yn, p_pair_code, p_div, p_type, p_gubun,'
                + ' p_opt_btn_dis_yn, p_nm, p_price, p_uniq_code, sort_no, opt_cnt, insert_dt, insert_usr, update_dt, update_usr)'
                + 'SELECT "' + ss.usrId + '", p_code, p_pair_code_yn, p_pair_code, p_div, p_type, p_gubun,'
                + ' p_opt_btn_dis_yn, p_nm, p_price, p_uniq_code, sort_no, opt_cnt, now(), "' + ss.usrId + '", now(),'
                + '"' + ss.usrId + '" FROM product_lab_info_tbl WHERE p_div = "O" AND p_code = ? AND p_uniq_code = ?' ,
                [pCode, pUniqCode],
                function (err, results) {
                    if (err) {
                        console.log('err : ', err);
                    } else {
                        console.dir(results);
                        callback(null);
                    }
                });
            conn.commit();
            conn.end();
        },
        function(callback) {

            console.log(' 조회 처리 요청');
            // MySQL Connect
            var conn = mysql.createConnection(config);
            conn.connect();
            conn.query('SELECT p_code as pCode, p_pair_code_yn as pPairCodeYn, p_pair_code as pPairCode, p_div as pDiv,'
                + ' CASE WHEN p_div = "M" THEN "기본" WHEN p_div = "O" THEN "옵션" ELSE "" END as pDivNm, p_type as pType,'
                + ' p_opt_btn_dis_yn as pOptBtnDisYn, p_nm as pNm, p_price as pPrice, opt_cnt as optCnt, p_count as pCount,'
                + ' p_uniq_code as pUniqCode FROM lab_cart_inf_tbl WHERE usr_id = ? AND p_uniq_code = ? ORDER BY p_code ASC, sort_no ASC;',
                [ss.usrId, pUniqCode],
                function (err2, results2) {
                    if (err2) {
                        console.log('err2 : ', err2);
                    } else {
                        //console.dir(results2);
                        if (results2.length > 0) {
                            res.status(200).json({'cnt': results2.length, 'list': results2, 'optSelectedYn' : optSelectedYn, 'session': ss});
                        } else {
                            res.status(200).json({'cnt': 0, 'list': '', 'optSelectedYn' : optSelectedYn, 'session': ss});
                        }

                    }
                }
            );
            conn.end();
            callback(null);
        } // end function

    ], function (err, result) {
        if(err) {
            console.log('err : ', err);
        } else {
            console.log('results : ', result);
        }
        // result에는 '끝'이 담겨 온다.
        //console.log(' async result : ', result);
    });


});

/**
 * 카트 삭제 처리.
 */
router.post('/cart/delete', function(req, res) {
    console.log('routes 카트 삭제 처리');
    var ss= req.session;
    var DEL_SQL1 = ''; var DEL_SQL2 = '';
    //var pCode = req.body.productCode !=null ? req.body.productCode : '';
    //var pUniqCode = req.body.productUniqCode !='null' ? req.body.productUniqCode : '';
    //var pDiv = req.body.productDiv !='null' ? req.body.productDiv : '';
    //var pPairCodeYn = req.body.productPairCodeYn !='null' ? req.body.productPairCodeYn : '';
    //var pPairCode = req.body.productPairCode !='null' ? req.body.productPairCode : '';
    //var termDays = req.body.termDays !=null ? req.body.termDays : '30';
    var pCode = req.body.pCode !=null ? req.body.pCode : '';
    var pUniqCode = req.body.pUniqCode !='null' ? req.body.pUniqCode : '';
    var pDiv = req.body.pDiv !='null' ? req.body.pDiv : '';
    var pPairCodeYn = req.body.pPairCodeYn !='null' ? req.body.pPairCodeYn : '';
    var pPairCode = req.body.pPairCode !='null' ? req.body.pPairCode : '';

    console.log('pCode : ', pCode);
    console.log('pUniqCode : ', pUniqCode);
    console.log('pDiv : ', pDiv);
    console.log('pPairCodeYn : ', pPairCodeYn);
    console.log('pPairCode : ', pPairCode + '\n');

    // 쌍코드인 경우 함게 삭제 처리.
    if(pPairCodeYn == 'Y') {
        DEL_SQL1 = 'DELETE FROM lab_cart_inf_tbl WHERE p_code = "' + pPairCode + '" AND p_uniq_code = ? AND usr_id = ?;';
        console.log('>>> DEL_SQL1 : ', DEL_SQL1 + '\n');
    }

    var DEL_SQL2 = 'DELETE FROM lab_cart_inf_tbl WHERE p_code = ? AND p_uniq_code = ? AND usr_id = ?;';
    console.log('>>> DEL_SQL2 : ', DEL_SQL2 + '\n');

    async.waterfall([
        function(callback) {
            // 메인 서비스 인 경우 해당 서비스 삭제 처리.
            if(pDiv == "M") {
                console.log('카트 메인서비스 삭제 처리.');
                // MySQL Connect
                var conn = mysql.createConnection(config);
                conn.connect();
                conn.query('DELETE FROM lab_cart_inf_tbl WHERE p_uniq_code = ? AND usr_id = ?',
                    [pUniqCode, ss.usrId],
                    function(err, results) {
                        if(err) {
                            console.log('err : ', err);
                        } else {
                            console.dir(results);
                        }
                    }
                );
                conn.commit();
                conn.end();
            } else {
                // 쌍인 코드인 경우 삭제 처리.
                if(pPairCodeYn == 'Y') {
                    console.log('pUniqCode 삭제처리 요청');
                    var conn = mysql.createConnection(config);
                    conn.connect();
                    conn.query(DEL_SQL1,
                        [pUniqCode, ss.usrId],
                        function (err, results) {
                            if (err) {
                                console.log('err : ', err);
                            } else {
                                console.dir(results);
                            }
                        }
                    );
                    conn.commit();
                    conn.end();
                }
                console.log('pCode 삭제처리 요청');
                var conn = mysql.createConnection(config);
                conn.connect();
                conn.query(DEL_SQL2,
                    [pCode, pUniqCode, ss.usrId],
                    function (err, results) {
                        if (err) {
                            console.log('err : ', err);
                        } else {
                            console.dir(results);
                        }
                    }
                );
                conn.commit();
                conn.end();
            }
            callback(null);
        },
    ], function (err, result) {
        if(err) {
            console.log('err : ', err);
        } else {
            console.log('results : ', result);
        }
        // result에는 '끝'이 담겨 온다.
        //console.log(' async result : ', result);
    });

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query('DELETE FROM lab_cart_inf_tbl WHERE p_code = ? AND p_uniq_code =?',
        [pCode, pUniqCode],
        function(err, results) {
            if(err) {
                console.log('err : ', err);
            } else {
                console.dir(results);

                // MySQL Connect
                var conn = mysql.createConnection(config);
                conn.connect();
                conn.query('SELECT p_code as pCode, p_pair_code_yn as pPairCodeYn, p_pair_code as pPairCode, p_div as pDiv,'
                    + ' CASE WHEN p_div = "M" THEN "기본" WHEN p_div = "O" THEN "옵션" ELSE "" END as pDivNm, p_type as pType,'
                    + ' p_opt_btn_dis_yn as pOptBtnDisYn, p_nm as pNm, p_price as pPrice, opt_cnt as optCnt, p_count as pCount,'
                    + ' p_uniq_code as pUniqCode FROM lab_cart_inf_tbl WHERE usr_id = ? ORDER BY p_code ASC, sort_no ASC;',
                    [ss.usrId],
                    function(err2, results2) {
                        if(err2) {
                            console.log('err2 : ', err2);
                        } else {
                            /*
                             var cartPrice = 0;
                             if(results2[1].length > 0) {
                             cartPrice = results2[2][0].price;
                             }
                             */
                            if(results2.length > 0) {
                                res.status(200).json({'cnt' : results2.length, 'list': results2, 'session': ss});
                            } else {
                                res.status(200).json({'cnt' : 0, 'list': '', 'session': ss});
                            }
                        }
                    }
                );
                conn.end();
            }
        }
    );
    conn.end();

});

/**
 * 카트 전체 삭제처리.
 */
router.post('/cart/alldel', function(req, res) {
    console.log('카트 전체 삭제 처리');

    var ss = req.session;
    //var termDays = req.body.termDays !=null ? req.body.termDays : '30';

    async.waterfall([

        // 해당 사용자의 주문 상세 테이블 전체 삭제
        function(callback) {
            // MySQL Connect
            var conn = mysql.createConnection(config);
            conn.connect();
            conn.query('DELETE FROM lab_cart_inf_tbl WHERE usr_id = ?;',
                [ss.usrId],
                function(err, results) {
                    if(err) {
                        console.log('err : ', err);
                    } else {
                        console.dir(results);
                        callback(null);
                    }
                }
            );
            conn.commit();
            conn.end();
        },
        function(callback) {
            // MySQL Connect
            var conn = mysql.createConnection(config);
            conn.connect();
            conn.query('SELECT p_code as pCode, p_pair_code_yn as pPairCodeYn, p_pair_code as pPairCode, p_div as pDiv,'
                + ' CASE WHEN p_div = "M" THEN "기본" WHEN p_div = "O" THEN "옵션" ELSE "" END as pDivNm, p_type as pType,'
                + ' p_opt_btn_dis_yn as pOptBtnDisYn, p_nm as pNm, p_price as pPrice, opt_cnt as optCnt, p_count as pCount,'
                + ' p_uniq_code as pUniqCode FROM lab_cart_inf_tbl WHERE usr_id = ? ORDER BY p_code ASC, sort_no ASC;',
                [ss.usrId],
                function(err, results) {
                    if(err) {
                        console.log('err : ', err);
                    } else {

                        res.status(200).json({'cnt' : results.length, 'list' : results, 'session' : ss});
                    }
                }
            );
            conn.commit();
            conn.end();

            callback(null);
        }
    ], function (err, result) {
        if(err) {
            console.log('err : ', err);
        } else {
            console.log('results : ', result);
        }
        // result에는 '끝'이 담겨 온다.
        //console.log(' async result : ', result);
    });

});

/**
 * 주문 확정 처리.
 */
router.post('/order', function(req, res) {
    console.log('routes 주문 확정 처리');

    var ss = req.session;
    var termDays = req.body.termDays !=null ? req.body.termDays : '30';
    var totalCalPayPrice = req.body.totalCalPayPrice !=null ? parseInt(fnUnComma(req.body.totalCalPayPrice)) : 0; // 결제예정금액
    var cmpltYn = req.body.cmpltYn !=null ? req.body.cmpltYn : '';
    var useTermDays = req.body.useTermDays !=null ? req.body.useTermDays : 0;
    // 기존 주문번호, 잔여일수, 사용한 일수, 잔액, 공제액 셋팅.
    var prevOrderNo = req.body.prevOrderNo !=null ? req.body.prevOrderNo : '';
    var remainDays = req.body.remainDays !=null ? req.body.remainDays : 0;
    var usedDays = req.body.usedDays !=null ? req.body.usedDays : 0;
    var remainPrice = req.body.remainPrice !=null ? fnUnComma(req.body.remainPrice) : 0;
    var subtractPrice = req.body.subtractPrice !=null ? fnUnComma(req.body.subtractPrice) : 0;
    var dcntPercent = req.body.dcntPercent !=null ? req.body.dcntPercent : 0;
    var productCode = req.body.productCode !=null ? req.body.productCode : '';
    var productUniqCode = req.body.productUniqCode !=null ? req.body.productUniqCode : '';
    //var productCount = req.body.productCount !='null' ? req.body.productCount : 0;

    console.log('useTermDays : ', useTermDays);
    console.log('\n prevOrderNo : ', prevOrderNo);
    console.log('remainDays : ', remainDays);
    console.log('usedDays : ', usedDays);
    console.log('remainPrice : ', remainPrice);
    console.log('dcntPercent : ', dcntPercent);
    console.log('subtractPrice : ', subtractPrice + '\n');
    console.log('totalCalPayPrice : ', totalCalPayPrice + '\n');
    console.log('productCode : ', productCode + '\n');
    console.log('productUniqCode : ', productUniqCode + '\n');
    //console.log('productCount : ', productCount + '\n');

    // 현재날짜
    var today = new Date();
    var year = today.getFullYear().toString();
    var month = today.getMonth()+1;
    if(month<10) {
        month = '0' + month;
    }
    var cDate = year + "" + month;
    var orderNum = "JTLABON" + cDate + randomString(6,"N");
    console.log('orderNum : ', orderNum);

    console.log('req.body : [ ' + JSON.stringify(req.body) + ' ]\n');


    async.waterfall([
        function(callback) {
            if(prevOrderNo != '') {
                // 잔여 이력 정보 테이블에 저장 처리.
                var conn = mysql.createConnection(config);
                conn.connect();
                conn.query('INSERT INTO lab_pay_remain_inf_tbl(order_no, usr_id, remain_days, used_days, remain_price,'
                    + ' subtract_price, term_days, dsctPct, insert_dt, insert_usr) VALUES(?, ?, ?, ?, ?, ?, ?, ?, now(), ?)',
                    [prevOrderNo, ss.usrId, remainDays, usedDays, remainPrice, subtractPrice, useTermDays, dcntPercent, ss.usrId],
                    function (err, results) {
                        if (err) {
                            console.log('err : ', err);
                        } else {
                            console.log('잔여 이력 정보 테이블에 저장 처리.');
                            console.dir(results);
                        }
                    });
                conn.commit();
                conn.end();
            }
            callback(null);
        },
        function(callback) {
            // 기존 주문 히스토리에 복사.
            var conn = mysql.createConnection(config);
            conn.query('INSERT INTO  lab_order_detail_his_inf_tbl  (SELECT * FROM lab_order_detail_inf_tbl WHERE p_uniq_code = ? AND usr_id = ?);'
                + 'INSERT INTO  lab_order_his_inf_tbl  (order_no, usr_id, service_nm, total_price, order_date, use_term_days,'
                + ' insert_dt, insert_usr, update_dt, update_usr)'
                + ' (SELECT x.order_no, x.usr_id, x.service_nm, x.total_price, x.order_date, x.use_term_days, x.insert_dt,'
                + ' x.insert_usr, x.update_dt, x.update_usr FROM lab_order_inf_tbl x, lab_order_detail_inf_tbl y '
                + ' WHERE x.order_no = y.order_no AND y.p_uniq_code = ? AND x.usr_id = ?);',
                [productUniqCode, ss.usrId, productUniqCode, ss.usrId],
                function (err, results) {
                    if (err) {
                        console.log('err : ', err);
                    } else {
                        console.log('기존 주문 테이블 복사 처리.');
                        console.dir(results);
                        callback(null);
                    }
                }
            );
            conn.commit();
            conn.end();
        },
        function(callback) {

            // 중복 주문 삭제 처리.
            // MySQL Connect
            var conn = mysql.createConnection(config);
            conn.query('DELETE FROM x USING lab_order_inf_tbl x, lab_order_detail_inf_tbl y'
                + ' WHERE x.order_no = y.order_no AND y.p_uniq_code = ? AND y.usr_id = ?;'
                + ' DELETE FROM lab_order_detail_inf_tbl WHERE p_uniq_code = ? AND usr_id = ?;',
                [productUniqCode, ss.usrId, productUniqCode, ss.usrId],
                function (err, results) {
                    if (err) {
                        console.log('err : ', err);
                    } else {
                        console.log('중복 주문 삭제 처리.');
                        console.dir(results);
                        callback(null);
                    }
                }
            );
            conn.commit();
            conn.end();
        },
        function(callback) {

            console.log('orderNum : ', orderNum + '\n');

            // 주문 상세 처리.
            // MySQL Connect
            var conn = mysql.createConnection(config);
            conn.query('INSERT INTO lab_order_detail_inf_tbl(order_no, usr_id, p_code, p_pair_code_yn, p_pair_code,'
                + 'p_div, p_type, p_nm, p_opt_btn_dis_yn, p_price, p_uniq_code, sort_no, opt_cnt, p_count, insert_dt, insert_usr, update_dt, update_usr)'
                + ' SELECT "' + orderNum + '", "' + ss.usrId + '", p_code, p_pair_code_yn, p_pair_code,'
                + 'p_div, p_type, p_nm, p_opt_btn_dis_yn, p_price, p_uniq_code, sort_no, opt_cnt, p_count, now(), "' + ss.usrId + '", now(), "' + ss.usrId + '"'
                + 'FROM lab_cart_inf_tbl WHERE p_uniq_code = ? AND usr_id = ?',
                [productUniqCode, ss.usrId],
                function (err, results) {
                    if (err) {
                        console.log('err : ', err);
                    } else {
                        console.log('주문 상세 저장 처리.');
                        console.dir(results);
                        callback(null);
                    }
                }
            );
            conn.commit();
            conn.end();
        },
        function(callback) {

            console.log('orderNum 저장 처리!!!');
            console.log('orderNum : ', orderNum + '\n');
            console.log('totalCalPayPrice : ', totalCalPayPrice + '\n');
            console.log('useTermDays : ', useTermDays + '\n');
            var utDays = useTermDays !=null && useTermDays !='' ? parseInt(useTermDays) : 0;
            console.log('utDays : ', utDays + '\n');

            // 주문 처리.
            var conn = mysql.createConnection(config);
            conn.query('INSERT INTO lab_order_inf_tbl(order_no, usr_id, service_nm, total_price, order_date, use_term_days,'
                + ' insert_dt, insert_usr, update_dt, update_usr)'
                + 'SELECT IFNULL(MAX("' + orderNum + '"),"' + orderNum + '"), "' + ss.usrId + '", (SELECT MAX(p_nm) as p_nm FROM lab_cart_inf_tbl WHERE p_code = ? AND p_div = "M" AND usr_id = ?),'
                + '"' + totalCalPayPrice + '", now(), "' + utDays + '", now(), "' + ss.usrId + '", now(), "' + ss.usrId
                + '" FROM lab_cart_inf_tbl WHERE p_code = ? AND p_div = "M" AND usr_id = ?;',
                [productCode, ss.usrId, productCode, ss.usrId],
                function (err, results) {
                    if (err) {
                        console.log('err : ', err);
                    } else {
                        console.log('주문 저장 처리.');
                        console.dir(results);
                        callback(null);
                    }
                }
            );
            conn.commit();
            conn.end();
        },
        function(callback) {
            // 카트 삭제 처리.
            var conn = mysql.createConnection(config);
            conn.query('DELETE FROM lab_cart_inf_tbl WHERE p_uniq_code = ? AND usr_id = ?',
                [productUniqCode, ss.usrId],
                function (err, results) {
                    if (err) {
                        console.log('err : ', err);
                    } else {
                        console.log('카트 삭제 처리.');
                        console.dir(results);
                        callback(null);
                    }
                }
            );
            conn.commit();
            conn.end();
        },
        function(callback) {

            console.log('주문 상세 조회 처리.');
            // MySQL Connect
            var conn = mysql.createConnection(config);
            conn.connect();
            conn.query('SELECT order_no as orderNo, p_code as pCode, p_pair_code_yn as pPairCodeYn, p_pair_code as pPairCode, p_div as pDiv,'
                + ' CASE WHEN p_type = "SVC" THEN "서비스(기간)" WHEN p_type = "HDW" THEN "하드웨어" ELSE "" END as pType,'
                + ' CASE WHEN p_div = "M" THEN "기본" WHEN p_div = "O" THEN "옵션" ELSE "" END as pDivNm,'
                + ' p_opt_btn_dis_yn as pOptBtnDisYn, p_nm as pNm, p_price as pPrice, opt_cnt as optCnt,'
                + ' p_uniq_code as pUniqCode FROM lab_order_detail_inf_tbl WHERE order_no = ? AND usr_id = ? ORDER BY p_code ASC, sort_no ASC;'
                + ' SELECT order_no as orderNo, service_nm as serviceNm, DATE_FORMAT(order_date, "%Y-%m-%d") as orderDate'
                + ' FROM lab_order_inf_tbl WHERE order_no = ? AND usr_id = ?;',
                [orderNum, ss.usrId, orderNum, ss.usrId],
                function(err, results) {
                    if(err) {
                        console.log('err : ', err);
                    } else {
                        res.status(200).json({
                            'cnt' : results[0].length,
                            'list' : results[0],
                            'totalPrice' : totalCalPayPrice,
                            'termDays' : termDays,
                            'payCmpltYn' : cmpltYn,
                            'result' : results[1][0],
                            'session' : ss
                        });
                    }
                }
            );

            callback(null);
        } // end function

    ], function (err, result) {
        if(err) {
            console.log('err : ', err);
        } else {
            console.log('results : ', result);
        }
        // result에는 '끝'이 담겨 온다.
        //console.log(' async result : ', result);
    });
});

/**
 * 주문 삭제 처리.
 */
router.post('/order/delete', function(req, res) {

    console.log('routes 주문 삭제 처리');
    var ss= req.session;

    var termDays = req.body.termDays !=null ? req.body.termDays : '30';
    var totalCalPayPrice = req.body.totalCalPayPrice !=null ? parseInt(fnUnComma(req.body.totalCalPayPrice)) : 0; // 결제예정금액
    var cmpltYn = req.body.cmpltYn !=null ? req.body.cmpltYn : '';
    var useTermDays = req.body.useTermDays !=null ? req.body.useTermDays : 0;

    var DEL_SQL1 = ''; var DEL_SQL2 = '';
    var orderNo = req.body.orderNo !=null ? req.body.orderNo : '';
    var pCode = req.body.pCode3 !=null ? req.body.pCode3 : '';
    var pUniqCode = req.body.pUniqCode3 !='null' ? req.body.pUniqCode3 : '';
    var pDiv = req.body.pDiv3 !='null' ? req.body.pDiv3 : '';
    var pPairCodeYn = req.body.pPairCodeYn3 !='null' ? req.body.pPairCodeYn3 : '';
    var pPairCode = req.body.pPairCode3 !='null' ? req.body.pPairCode3 : '';

    console.log('orderNo : ', orderNo);
    console.log('pCode : ', pCode);
    console.log('pUniqCode : ', pUniqCode);
    console.log('pDiv : ', pDiv);
    console.log('pPairCodeYn : ', pPairCodeYn);
    console.log('pPairCode : ', pPairCode + '\n');

    if(pPairCodeYn == 'Y') {
        DEL_SQL1 = 'DELETE FROM lab_order_detail_inf_tbl WHERE p_code = "' + pPairCode + '" AND p_uniq_code = ? AND usr_id = ?;';
        console.log('>>> DEL_SQL1 : ', DEL_SQL1 + '\n');
    }

    var DEL_SQL2 = 'DELETE FROM lab_order_detail_inf_tbl WHERE p_code = ? AND p_uniq_code = ? AND usr_id = ?;';
    console.log('>>> DEL_SQL2 : ', DEL_SQL2 + '\n');

    async.waterfall([

        function(callback) {
            // 메인 서비스 인 경우 해당 서비스 삭제 처리.
            console.log('메인서비스 전체 삭제 처리.');
            if(pDiv == "M") {
                // MySQL Connect
                var conn = mysql.createConnection(config);
                conn.connect();
                conn.query('DELETE FROM lab_order_detail_inf_tbl WHERE p_uniq_code = ? AND usr_id = ?',
                    [pUniqCode, ss.usrId],
                    function(err, results) {
                        if(err) {
                            console.log('err : ', err);
                        } else {
                            console.dir(results);
                        }
                    }
                );
                conn.commit();
                conn.end();
            } else {
                // 쌍인 코드인 경우 삭제 처리.
                if(pPairCodeYn == 'Y') {
                    console.log('pUniqCode 삭제처리 요청');
                    var conn = mysql.createConnection(config);
                    conn.connect();
                    conn.query(DEL_SQL1,
                        [pUniqCode, ss.usrId],
                        function (err, results) {
                            if (err) {
                                console.log('err : ', err);
                            } else {
                                console.dir(results);
                            }
                        }
                    );
                    conn.commit();
                    conn.end();
                }
                console.log('pCode 삭제처리 요청');
                var conn = mysql.createConnection(config);
                conn.connect();
                conn.query(DEL_SQL2,
                    [pCode, pUniqCode, ss.usrId],
                    function (err, results) {
                        if (err) {
                            console.log('err : ', err);
                        } else {
                            console.dir(results);
                        }
                    }
                );
                conn.commit();
                conn.end();
            }
            callback(null);
        },
        function(callback) {
            // 주문 메인 테이블 삭제.
            // MySQL Connect
            console.log('메인서비스 삭제 처리.');
            var conn = mysql.createConnection(config);
            conn.connect();
            conn.query('DELETE FROM lab_order_inf_tbl WHERE order_no = ?',
                [pUniqCode, ss.usrId],
                function(err, results) {
                    if(err) {
                        console.log('err : ', err);
                    } else {
                        console.dir(results);
                        callback(null);
                    }
                }
            );
        }
    ], function (err, result) {
        if(err) {
            console.log('err : ', err);
        } else {
            console.log('results : ', result);
        }
        // result에는 '끝'이 담겨 온다.
        //console.log(' async result : ', result);
    });

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query('DELETE FROM lab_order_detail_inf_tbl WHERE p_code = ? AND p_uniq_code =? AND order_no = ?',
        [pCode, pUniqCode, orderNo],
        function(err, results) {
            if(err) {
                console.log('err : ', err);
            } else {
                console.dir(results);

                // MySQL Connect
                var conn = mysql.createConnection(config);
                conn.connect();
                // MySQL Connect
                var conn = mysql.createConnection(config);
                conn.connect();
                conn.query('SELECT order_no as orderNo, p_code as pCode, p_pair_code_yn as pPairCodeYn, p_pair_code as pPairCode, p_div as pDiv,'
                    + ' CASE WHEN p_div = "M" THEN "기본" WHEN p_div = "O" THEN "옵션" ELSE "" END as pDivNm,'
                    + ' p_opt_btn_dis_yn as pOptBtnDisYn, p_nm as pNm, p_price as pPrice, opt_cnt as optCnt,'
                    + ' p_uniq_code as pUniqCode FROM lab_order_detail_inf_tbl WHERE order_no = ? AND usr_id = ? ORDER BY p_code ASC, sort_no ASC;',
                    [orderNo, ss.usrId],
                    function(err, results) {
                        if(err) {
                            console.log('err : ', err);
                        } else {
                            res.status(200).json({
                                'cnt' : results.length,
                                'list' : results,
                                'totalPrice' : totalCalPayPrice,
                                'termDays' : termDays,
                                'payCmpltYn' : cmpltYn,
                                'session' : ss
                            });
                        }
                    }
                );

                conn.end();
            }
        }
    );
    conn.end();

});

/**
 * 주문 전체 삭제 처리.
 */
router.post('/order/alldel', function(req, res) {
    console.log('전체 삭제 처리');

    var ss = req.session;
    var termDays = req.body.termDays !=null ? req.body.termDays : '30';
    var orderNo = req.body.orderNo !=null ? req.body.orderNo : '';

    async.waterfall([

        // 해당 사용자의 주문 상세 테이블 전체 삭제
        function(callback) {
            // MySQL Connect
            var conn = mysql.createConnection(config);
            conn.connect();
            conn.query('DELETE FROM lab_order_detail_inf_tbl WHERE usr_id = ?;',
                [ss.usrId],
                function(err, results) {
                    if(err) {
                        console.log('err : ', err);
                    } else {
                        console.dir(results);
                        callback(null);
                    }
                }
            );
            conn.commit();
            conn.end();
        },
        function(callback) {
            // 해당 사용자의 주문 테이블 전체 삭제
            // MySQL Connect
            var conn = mysql.createConnection(config);
            conn.connect();
            conn.query('DELETE FROM lab_order_inf_tbl WHERE usr_id = ?;',
                [ss.usrId],
                function(err, results) {
                    if(err) {
                        console.log('err : ', err);
                    } else {
                        console.dir(results);
                        callback(null);
                    }
                }
            );
            conn.commit();
            conn.end();
        },
        function(callback) {
            // MySQL Connect
            var conn = mysql.createConnection(config);
            conn.connect();
            conn.query('SELECT order_no as orderNo, p_code as pCode, p_pair_code_yn as pPairCodeYn, p_pair_code as pPairCode, p_div as pDiv,'
                + ' CASE WHEN p_div = "M" THEN "기본" WHEN p_div = "O" THEN "옵션" ELSE "" END as pDivNm,'
                + ' p_opt_btn_dis_yn as pOptBtnDisYn, p_nm as pNm, p_price as pPrice, opt_cnt as optCnt,'
                + ' p_uniq_code as pUniqCode FROM lab_order_detail_inf_tbl WHERE usr_id = ? ORDER BY p_code ASC, sort_no ASC;',
                [ss.usrId],
                function(err, results) {
                    if(err) {
                        console.log('err : ', err);
                    } else {
                        res.status(200).json({'cnt' : results.length, 'list' : results, 'session' : ss});
                    }
                }
            );

            conn.commit();
            conn.end();
            callback(null);
        }
    ], function (err, result) {
        if(err) {
            console.log('err : ', err);
        } else {
            console.log('results : ', result);
        }
        // result에는 '끝'이 담겨 온다.
        //console.log(' async result : ', result);
    });

});

/**
 *  장바구니 기간별 할인금액/서비스금액 계산처리.
 */
router.post('/calculate', function(req, res) {
    console.log('서비스금액 계산 처리');
    var ss = req.session;

    var pCode = req.body.pCode !=null ? req.body.pCode : '';
    var pDiv = req.body.pDiv != null ? req.body.pDiv : '';
    var pUniqCode = req.body.pUniqCode !=null ? req.body.pUniqCode : '';
    var pPrice = req.body.pPrice !=null ? req.body.pPrice : 0;
    var pOptCnt = req.body.pOptCnt !=null ? req.body.pOptCnt : 0;
    var termDays = req.body.termDays !=null ? req.body.termDays : 30;
    var pCount = req.body.pCount !=null ? req.body.pCount : 0;
    var productType = req.body.productType !=null ? req.body.productType : '';
    //var prvRemainPrice = req.body.prvRemainPrice !=null ? req.body.prvRemainPrice : 0;
    var prvRemainPrice = req.body.prvRemainPrice;
    var arrPcode = []; var arrPdiv = []; var arrPuniqCode = []; var arrPprice = []; var arrPoptCnt = []; var arrPcount = [];
    var totalCalPrice = 0; var getOptCnt = 0; var optCnt = 0; var calPrice = 0; var disCountPct = 0; var pCnt = 0;
    var disCountPrice = 0; var calPayPrice = 0; var cmpltYn = 'Y';
    console.log('termDays : ', termDays);
    console.log('초기 prvRemainPrice : ', prvRemainPrice +'\n');

    if(pCode.length > 0) {
        for (var x = 0; x < pCode.length; x++) {
            arrPcode[x] = pCode[x];
            arrPdiv[x] = pDiv[x];
            arrPuniqCode[x] = pUniqCode[x];
            arrPprice[x] = pPrice[x];
            arrPoptCnt[x] = pOptCnt[x];
            if(productType == "HDW") {
                arrPcount[x] = pCount[x];
                console.log('arrPcount [' + x + '] = ', arrPcount[x]);
            }

            console.log('arrPcode [' + x + '] = ', arrPcode[x]);
            console.log('arrPdiv [' + x + '] = ', arrPdiv[x]);
            console.log('arrPuniqCode [' + x + '] = ', arrPuniqCode[x]);
            console.log('arrPprice [' + x + '] = ', arrPprice[x]);
            console.log('arrPoptCnt [' + x + '] = ', arrPoptCnt[x]);

            if(arrPdiv[x] == 'M') {
                getOptCnt += arrPoptCnt[x] !=null ? parseInt(arrPoptCnt[x]) : 0;
                pCnt = arrPcount[x] !=null ? arrPcount[x] : 0;
                console.log('getOptCnt = ', getOptCnt + '\n');
            }
            if(arrPdiv[x]=="O") {
                optCnt += 1;
                console.log('optCnt = ', optCnt + '\n');
            }
            calPrice += arrPprice[x] !=null ? parseInt(arrPprice[x]) : 0;
        }
        console.log('calPrice : ', calPrice);
        console.log('getOptCnt : ', getOptCnt);
        console.log('optCnt : ', optCnt);
        console.log('productType : ', productType + "\n");

        if (termDays == '30') {
            if(productType == "HDW") {
                totalCalPrice = parseInt(calPrice);
                calPayPrice = Math.abs(parseInt(totalCalPrice)) - Math.abs(parseInt(prvRemainPrice));
            } else {
                totalCalPrice = parseInt(calPrice);
                calPayPrice = Math.abs(parseInt(totalCalPrice)) - Math.abs(parseInt(prvRemainPrice));
            }
        } else {
            if(productType == "HDW") {
                if (getOptCnt != 0 && optCnt != 0 && getOptCnt == optCnt) {
                    disCountPct = 15;
                } else {
                    disCountPct = 10;
                }
                totalCalPrice = parseInt(calPrice) * parseInt(pCnt) / 30 * 360;
                disCountPrice = (parseInt(calPrice) * parseInt(pCnt) / 30 * 360) * (parseInt(disCountPct) / 100);
                calPayPrice = Math.abs(parseInt(totalCalPrice)) - Math.abs(parseInt(prvRemainPrice)) - Math.abs(parseInt(disCountPrice));
            } else {
                if (getOptCnt != 0 && optCnt != 0 && getOptCnt == optCnt) {
                    disCountPct = 15;
                } else {
                    disCountPct = 10;
                }
                totalCalPrice = parseInt(calPrice) / 30 * 360;
                disCountPrice = (parseInt(calPrice) / 30 * 360) * (parseInt(disCountPct) / 100);
                calPayPrice = Math.abs(parseInt(totalCalPrice)) - Math.abs(parseInt(prvRemainPrice)) - Math.abs(parseInt(disCountPrice));
            }
        }
    }

    if(totalCalPrice == 0 && calPayPrice <= 0) {
        cmpltYn = 'N';
    }

    var baseCalPayPrice = calPayPrice;
    if(calPayPrice < 0) calPayPrice = 0;

    console.log('totalCalPrice : ', totalCalPrice);
    console.log('prvRemainPrice : ', prvRemainPrice);
    console.log('disCountPrice : ', disCountPrice);
    console.log('calPayPrice : ', calPayPrice);
    console.log('disCountPct : ', disCountPct);
    console.log('baseCalPayPrice : ', baseCalPayPrice);

    res.status('200').json({
        'totalCalPrice' : totalCalPrice,
        'disCountPrice' : disCountPrice,
        'calPayPrice' : calPayPrice,
        'baseCalPayPrice' : baseCalPayPrice,
        'disCountPct' : disCountPct,
        'termDays' : termDays,
        'prvRemainPrice' : prvRemainPrice,
        'cmpltYn' : cmpltYn,
        'pType' : productType,
        'pCnt' : pCnt,
        'session' : ss
    });

});

// 환불처리.
// 결제금액 조회.
/**
 * 환불처리.
 */
router.post('/refund', function(req, res, next) {
// 환불공식
// 남은 금액 : 결제금액 / 개월수 * 남은 달수
// 사용 금액 : 월이용료 * (개월수 - 남은 달수)
// 환불 예상 금액 : 결제금액 - 사용금액 - 할인 금액
    var ss = req.session;
    var serviceNo = req.body.serviceNo !=null ? parseInt(req.body.serviceNo) : 0;

    // 사용자의 결제정보 취득.
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query('SELECT COUNT(pno) as cnt FROM pay_inf_tbl WHERE expire_yn = "N" AND pno = ? AND c_no = ?;'
        + ' SELECT pay_no as payNo, pno as pNo, pname as pName, pprice as pprice, pdc_price as pDcPrice, pay_price as payPrice,'
        + ' pay_method as payMethod, pay_date as payDate, use_month_cnt as useMonthCnt, from_dt as fromDt, to_dt as toDt,'
        + ' opt_cnt as optCnt, opt1_name as opt1Name, opt1_price as opt1Price, opt1_gigan_yn as opt1GiganYn, opt1_gigan as optGigan, opt1_gigan_from as opt1GiganFrom, opt1_gigan_to as opt1GiganTo,'
        + ' opt2_name as opt2Name, opt2_price as opt2Price, opt2_gigan_yn as opt2GiganYn, opt2_gigan as opt2Gigan, opt2_gigan_from as opt2GiganFrom, opt2_gigan_to as opt2GiganTo,'
        + ' opt3_name as opt3Name, opt3_price as opt3Price, opt3_gigan_yn as opt3GiganYn, opt3_gigan as opt3Gigan, opt3_gigan_from as opt3GiganFrom, opt3_gigan_to as opt3GiganTo,'
        + ' opt1_use_yn as opt1UseYn, opt2_use_yn as opt2UseYn, opt3_use_yn as opt3UseYn FROM pay_inf_tbl'
        + ' WHERE expire_yn = "N" AND pno = ? AND c_no = ?;',
        [serviceNo, usrNo, serviceNo, usrNo],
        function(err, results) {
            if (err) {
                console.log('err : ', err);
            } else {
                var cnt = results[0][0].cnt;
                // 기존 서비스 가 있는 지 체크.
                if (cnt > 0) {
                    // 결제 금액
                    var paidPrice = results[1][0].payPrice !=null ? parseInt(results[1][0].payPrice) : 0;
                    var month = results[1][0].useMonthCnt !=null ? parseInt(results[1][0].useMonthCnt) : 0;
                    var dcPrice = results[1][0].pDcPrice != null ? parseInt(results[1][0].pDcPrice) : 0;
                    // 남은 월수 조회.
                    var remainMonth = fncRemainMonth(results[1][0].toDt);
                    // 남은 금액
                    var remainPaidPrice = paidPrice / month * remainMonth;
                    // 사용 금액 (월이용료 * (개월수-남은달수))
                    var usedPrice = refundServicePrice * (month-remainMonth);
                    // 환불예상금액 (결제금액 - 사용금액 - 할인금액)
                    var refundPrice = refundServicePrice - usePrice - dcPrice;
                }
                var result = {
                    'remainMonth' : remainMonth,
                    'remainPaidPrice' : remainPaidPrice,
                    'usedPrice' : usedPrice,
                    'refundPrice' : refundPrice
                };
                res.status(200).json({'result' : result, 'session' : ss});
            }
        });
    conn.end();

});

/**
 *  기능 : 결제 통합 팝업 호출.
 */
router.get('/paypopup', function(req, res, next) {
    console.log('결제 통합 팝업 호출.');
    var ss = req.session;
    var usrId = ss.usrId !=null ? ss.usrId : '';
    // product_info 상품 조회.
    var SQL1 = 'SELECT p_no as pNo, p_code as pCode, p_nm as pNm, p_price as pPrice, p_uniq_code as pUniqCode, p_type as pType,'
        + ' p_desc as pDesc, opt_cnt as optCnt, p_count as pCount FROM product_lab_info_tbl WHERE p_div = "M" AND p_display_yn = "Y";';
    // 주문 조회.
    /*
     var SQL2 = ' SELECT p_code as pCode, p_pair_code_yn as pPairCodeYn, p_pair_code as pPairCode, p_div as pDiv,'
     + ' CASE WHEN p_div = "M" THEN "기본" WHEN p_div = "O" THEN "옵션" ELSE "" END as pDivNm,'
     + ' p_opt_btn_dis_yn as pOptBtnDisYn, p_nm as pNm, p_price as pPrice, opt_cnt as optCnt,'
     + ' p_uniq_code as pUniqCode FROM lab_cart_inf_tbl WHERE usr_id = ? ORDER BY p_code ASC, sort_no ASC;';
     var SQL2 = 'SELECT order_no as orderNo, usr_id as usrId, service_nm as serviceNm, total_price as totalPrice,'
     + ' DATE_FORMAT(order_date,"%Y-%m-%d") as orderDate'
     + 'FROM lab_order_inf_tbl WHERE usr_id = ? ORDER BY order_date DESC;';
     var SQL2 = 'SELECT order_no as orderNo, usr_id as usrId, p_code as pCode, p_div as pDiv,'
     + ' CASE WHEN p_div = "M" THEN "기본" WHEN p_div = "O" THEN "옵션" ELSE "" END as pDivNm,'
     + ' p_pair_code_yn as pPairCodeYn, p_nm as pNm, p_price as pPrice, p_uniq_code as pUniqCode,'
     + ' p_opt_btn_dis_yn as pOptBtnDisYn, opt_cnt as optCnt FROM lab_order_detail_inf_tbl WHERE usr_id = ? ORDER BY p_code ASC, sort_no ASC;';
     */
    var SQL2 = 'SELECT x.order_no as orderNo, x.usr_id as usrId, x.p_code as pCode, x.p_div as pDiv, x.p_type as pType,'
        + ' CASE WHEN x.p_div = "M" THEN "기본" WHEN x.p_div = "O" THEN "옵션" ELSE "" END as pDivNm,'
        + ' x.p_pair_code_yn as pPairCodeYn, x.p_nm as pNm, x.p_price as pPrice, y.use_term_days as useTermDays,'
        + ' (SELECT total_price FROM lab_order_inf_tbl  WHERE order_no = x.order_no AND x.p_div = "M" AND x.usr_id = ?) as totalPrice,'
        + ' x.p_uniq_code as pUniqCode, x.p_opt_btn_dis_yn as pOptBtnDisYn, x.opt_cnt as optCnt, x.p_count as pCount'
        + ' FROM lab_order_detail_inf_tbl x, lab_order_inf_tbl y WHERE x.order_no = y.order_no AND y.pay_result IS NULL'
        + ' AND y.usr_id = ? ORDER BY x.p_code ASC, x.sort_no ASC;';

    // 카트 합계 조회.
    var SQL3 = 'SELECT SUM(total_price) as price FROM lab_order_inf_tbl WHERE pay_result IS NULL AND usr_id = ?;';
    // 이전 서비스 내역 조회.
    var SQL4 = 'SELECT x.order_no as orderNo, x.p_code as pCode, x.p_pair_code_yn as pPairCodeYn, x.p_div as pDiv, x.p_type as pType,'
        + ' x.p_opt_btn_dis_yn as pOptBtnDisYn, x.p_nm as pNm, x.p_price as pPrice, x.p_uniq_code as pUniqCode, x.p_count as pCount,'
        + ' x.sort_no as sortNo, y.pay_result as payResult'
        + ' FROM lab_order_detail_inf_tbl x, lab_pay_info_tbl y WHERE x.order_no = y.order_no'
        + ' AND x.usr_id = y.usr_id AND y.pay_result = "paid" AND y.usr_id = ? ORDER BY x.p_code ASC, x.sort_no ASC;';
    // 이전 서비스 내역 잔여 상세 조회.
    var SQL5 = 'SELECT order_no as orderNo, use_term_days as useTermDays, @rDays:=use_term_days, DATEDIFF(now(), pay_date) as usedDays,'
        + ' DATEDIFF(adddate(pay_date, @rDays), now()) as remainDays, p_total_price as totalPrice,'
        + ' ROUND(p_total_price / @rDays) as dayPrice, ROUND((p_total_price / @rDays) * DATEDIFF(adddate(pay_date, @rDays), now())) as remainPrice'
        + ' FROM lab_pay_info_tbl WHERE pay_result = "paid" AND usr_id = ?;';
    // 주문자 정보 조회
    var SQL6 = 'SELECT c_id as cId, c_name as cName, c_addr1 as cAddr1, c_addr2 as cAddr2, c_postno as cPostno,c_tel_no as cTelNo,'
        + ' c_tel_no1 as cTelNo1, c_tel_no2 as cTelNo2, c_tel_no3 as cTelNo3, c_cell_no as cCellNo, c_cell_no1 as cCellNo1,'
        + ' c_cell_no2 as cCellNo2, c_cell_no3 as cCellNo3 FROM c_inf_tbl WHERE c_id = ?;';

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query(SQL1+SQL2+SQL3+SQL4+SQL5+SQL6, [usrId, usrId, usrId, usrId, usrId, usrId], function(err, results) {
            if(err) {
                console.log('err : ', err);
            } else {
                var cartPrice = 0;
                if(results[2].length > 0) {
                    cartPrice = results[2][0].price;
//console.log('cartPrice = ', cartPrice);
                }
                res.status(200).render(
                    './puchasePopup',
                    {
                        'rList' : results[0],
                        'rList1' : results[1],
                        'rList2' : '',
                        'rList3' : results[3],
                        'rList4' : results[4],
                        'result' : '',
                        'price' : cartPrice,
                        'payPrice' : 0,
                        'payCmpltYn' : '',
                        'order' : results[5][0],
                        'session' : ss
                    });
            }
        }
    );
    conn.end();
});

/**
 *  결제 통합 팝업 호출.
 */
router.post('/paypopup/list', function(req, res, next) {
    console.log('결제 통합 팝업 호출.');
    var ss = req.session;
    var usrId = ss.usrId !=null ? ss.usrId : '';
    // product_info 상품 조회.
    var SQL1 = 'SELECT x.order_no as orderNo, x.usr_id as usrId, x.p_code as pCode, x.p_div as pDiv, x.p_type as pType,'
        + ' CASE WHEN x.p_div = "M" THEN "기본" WHEN x.p_div = "O" THEN "옵션" ELSE "" END as pDivNm,'
        + ' x.p_pair_code_yn as pPairCodeYn, x.p_nm as pNm, x.p_price as pPrice, y.use_term_days as useTermDays,'
        + ' (SELECT total_price FROM lab_order_inf_tbl  WHERE order_no = x.order_no AND x.p_div = "M" AND x.usr_id = ?) as totalPrice,'
        + ' x.p_uniq_code as pUniqCode, x.p_opt_btn_dis_yn as pOptBtnDisYn, x.opt_cnt as optCnt, x.p_count as pCount'
        + ' FROM lab_order_detail_inf_tbl x, lab_order_inf_tbl y WHERE x.order_no = y.order_no AND y.pay_result IS NULL'
        + ' AND y.usr_id = ? ORDER BY x.p_code ASC, x.sort_no ASC;';

    // 카트 합계 조회.
    var SQL2 = 'SELECT IFNULL(SUM(total_price),0) as price FROM lab_order_inf_tbl WHERE pay_result IS NULL AND usr_id = ?;';

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query(SQL1+SQL2, [usrId, usrId, usrId], function(err, results) {
            if(err) {
                console.log('err : ', err);
            } else {
                var cartPrice = 0;
                if(results[1].length > 0) {
                    cartPrice = results[1][0].price;
                }
                res.status(200).json(
                    {
                        'cnt' : results[0].length,
                        'list' : results[0],
                        'totalPrice' : cartPrice,
                        'session' : ss
                    });
            }
        }
    );
    conn.end();
});

/**
 * 주문 전체 삭제 처리.
 */
router.post('/paypopup/alldel', function(req, res) {
    console.log('전체 삭제 처리');

    var ss = req.session;

    async.waterfall([

        // 해당 사용자의 주문 상세 테이블 전체 삭제
        function(callback) {
            // MySQL Connect
            var conn = mysql.createConnection(config);
            conn.connect();
            conn.query('DELETE FROM lab_order_detail_inf_tbl WHERE usr_id = ?;',
                [ss.usrId],
                function(err, results) {
                    if(err) {
                        console.log('err : ', err);
                    } else {
                        console.dir(results);
                        callback(null);
                    }
                }
            );
            conn.commit();
            conn.end();
        },
        function(callback) {
            // 해당 사용자의 주문 테이블 전체 삭제
            // MySQL Connect
            var conn = mysql.createConnection(config);
            conn.connect();
            conn.query('DELETE FROM lab_order_inf_tbl WHERE usr_id = ?;',
                [ss.usrId],
                function(err, results) {
                    if(err) {
                        console.log('err : ', err);
                    } else {
                        console.dir(results);
                        callback(null);
                    }
                }
            );
            conn.commit();
            conn.end();
        },
        // 해당 사용자의 주문 상세 이력 테이블 전체 삭제
        function(callback) {
            // MySQL Connect
            var conn = mysql.createConnection(config);
            conn.connect();
            conn.query('DELETE FROM lab_order_detail_his_inf_tbl WHERE usr_id = ?;',
                [ss.usrId],
                function(err, results) {
                    if(err) {
                        console.log('err : ', err);
                    } else {
                        console.dir(results);
                        callback(null);
                    }
                }
            );
            conn.commit();
            conn.end();
        },
        function(callback) {
            // 해당 사용자의 주문 이력 테이블 전체 삭제
            // MySQL Connect
            var conn = mysql.createConnection(config);
            conn.connect();
            conn.query('DELETE FROM lab_order_his_inf_tbl WHERE usr_id = ?;',
                [ss.usrId],
                function(err, results) {
                    if(err) {
                        console.log('err : ', err);
                    } else {
                        console.dir(results);
                        callback(null);
                    }
                }
            );
            conn.commit();
            conn.end();
        },
        function(callback) {
            // MySQL Connect
            var conn = mysql.createConnection(config);
            conn.connect();
            conn.query('SELECT x.order_no as orderNo, x.usr_id as usrId, x.p_code as pCode, x.p_div as pDiv, x.p_type as pType,'
                + ' CASE WHEN x.p_div = "M" THEN "기본" WHEN x.p_div = "O" THEN "옵션" ELSE "" END as pDivNm,'
                + ' x.p_pair_code_yn as pPairCodeYn, x.p_nm as pNm, x.p_price as pPrice, y.use_term_days as useTermDays,'
                + ' (SELECT total_price FROM lab_order_inf_tbl  WHERE order_no = x.order_no AND x.p_div = "M" AND x.usr_id = ?) as totalPrice,'
                + ' x.p_uniq_code as pUniqCode, x.p_opt_btn_dis_yn as pOptBtnDisYn, x.opt_cnt as optCnt, x.p_count as pCount'
                + ' FROM lab_order_detail_inf_tbl x, lab_order_inf_tbl y WHERE x.order_no = y.order_no AND y.usr_id = ? ORDER BY x.p_code ASC, x.sort_no ASC;'
                + ' SELECT IFNULL(SUM(total_price),0) as totalPrice FROM lab_order_inf_tbl WHERE usr_id = ?;',
                [ss.usrId, ss.usrId, ss.usrId],
                function(err, results) {
                    if(err) {
                        console.log('err : ', err);
                    } else {
                        var cartPrice = 0;
                        if(results[1].length > 0) {
                            cartPrice = results[1][0].totalPrice;
                        }
                        res.status(200).json({'cnt' : results[0].length, 'list' : results[0], 'totalPrice' : cartPrice, 'session' : ss});
                    }
                }
            );

            conn.commit();
            conn.end();
            callback(null);
        }
    ], function (err, result) {
        if(err) {
            console.log('err : ', err);
        } else {
            console.log('results : ', result);
        }
        // result에는 '끝'이 담겨 온다.
        //console.log(' async result : ', result);
    });

});

/**
 * 주문 서비스 기본단위로 삭제 처리.
 */
router.post('/paypopup/delete', function(req, res) {
    console.log('삭제 처리');

    var ss = req.session;
    var orderNo = req.body.orderNo !=null ? req.body.orderNo : '';
    var pUniqCode = req.body.pUniqCode !=null ? req.body.pUniqCode : '';
console.log('orderNo : ', orderNo);

    async.waterfall([

        // 해당 사용자의 주문 상세 테이블 전체 삭제
        function(callback) {
            // MySQL Connect
            var conn = mysql.createConnection(config);
            conn.connect();
            conn.query('DELETE FROM lab_order_detail_inf_tbl WHERE p_uniq_code = ? AND usr_id = ?;',
                [pUniqCode, ss.usrId],
                function(err, results) {
                    if(err) {
                        console.log('err : ', err);
                    } else {
                        console.dir(results);
                        callback(null);
                    }
                }
            );
            conn.commit();
            conn.end();
        },
        function(callback) {
            // 해당 사용자의 주문 테이블 삭제
            // MySQL Connect
            var conn = mysql.createConnection(config);
            conn.connect();
            conn.query('DELETE FROM lab_order_inf_tbl WHERE order_no = ? AND usr_id = ?;',
                [orderNo, ss.usrId],
                function(err, results) {
                    if(err) {
                        console.log('err : ', err);
                    } else {
                        console.dir(results);
                        callback(null);
                    }
                }
            );
            conn.commit();
            conn.end();
        },
        // 해당 사용자의 주문 상세 이력 테이블 삭제
        function(callback) {
            // MySQL Connect
            var conn = mysql.createConnection(config);
            conn.connect();
            conn.query('DELETE FROM lab_order_detail_his_inf_tbl WHERE p_uniq_code = ? AND usr_id = ?;',
                [pUniqCode, ss.usrId],
                function(err, results) {
                    if(err) {
                        console.log('err : ', err);
                    } else {
                        console.dir(results);
                        callback(null);
                    }
                }
            );
            conn.commit();
            conn.end();
        },
        function(callback) {
            // 해당 사용자의 주문 이력 테이블 삭제
            // MySQL Connect
            var conn = mysql.createConnection(config);
            conn.connect();
            conn.query('DELETE FROM lab_order_his_inf_tbl WHERE order_no = ? AND usr_id = ?;',
                [orderNo, ss.usrId],
                function(err, results) {
                    if(err) {
                        console.log('err : ', err);
                    } else {
                        console.dir(results);
                        callback(null);
                    }
                }
            );
            conn.commit();
            conn.end();
        },
        function(callback) {
            // MySQL Connect
            var conn = mysql.createConnection(config);
            conn.connect();
            conn.query('SELECT x.order_no as orderNo, x.usr_id as usrId, x.p_code as pCode, x.p_div as pDiv, x.p_type as pType,'
                + ' CASE WHEN x.p_div = "M" THEN "기본" WHEN x.p_div = "O" THEN "옵션" ELSE "" END as pDivNm,'
                + ' x.p_pair_code_yn as pPairCodeYn, x.p_nm as pNm, x.p_price as pPrice, y.use_term_days as useTermDays,'
                + ' (SELECT total_price FROM lab_order_inf_tbl  WHERE order_no = x.order_no AND x.p_div = "M" AND x.usr_id = ?) as totalPrice,'
                + ' x.p_uniq_code as pUniqCode, x.p_opt_btn_dis_yn as pOptBtnDisYn, x.opt_cnt as optCnt, x.p_count as pCount'
                + ' FROM lab_order_detail_inf_tbl x, lab_order_inf_tbl y WHERE x.order_no = y.order_no AND y.pay_result IS NULL'
                + ' AND y.usr_id = ? ORDER BY x.p_code ASC, x.sort_no ASC;'
                + ' SELECT IFNULL(SUM(total_price),0) as totalPrice FROM lab_order_inf_tbl WHERE pay_result IS NULL AND usr_id = ?;',
                [ss.usrId, ss.usrId, ss.usrId],
                function(err, results) {
                    if(err) {
                        console.log('err : ', err);
                    } else {
                        var cartPrice = 0;
                        if(results[1].length > 0) {
                            cartPrice = results[1][0].totalPrice;
                        }
                        res.status(200).json({'cnt' : results[0].length, 'list' : results[0], 'totalPrice' : cartPrice, 'session' : ss});
                    }
                }
            );

            conn.commit();
            conn.end();
            callback(null);
        }
    ], function (err, result) {
        if(err) {
            console.log('err : ', err);
        } else {
            console.log('results : ', result);
        }
        // result에는 '끝'이 담겨 온다.
        //console.log(' async result : ', result);
    });

});


/**
 * 결제 전체 삭제 처리.
 */
router.post('/paypopup/pay/alldel', function(req, res) {
    console.log('결제 전체 삭제 처리');

    var ss = req.session;

    async.waterfall([

        // 해당 사용자의 주문 상세 테이블 전체 삭제
        function(callback) {
            // MySQL Connect
            var conn = mysql.createConnection(config);
            conn.connect();
            conn.query('DELETE FROM lab_order_detail_inf_tbl WHERE usr_id = ?;',
                [ss.usrId],
                function(err, results) {
                    if(err) {
                        console.log('err : ', err);
                    } else {
                        console.dir(results);
                        callback(null);
                    }
                }
            );
            conn.commit();
            conn.end();
        },
        function(callback) {
            // 해당 사용자의 주문 테이블 전체 삭제
            // MySQL Connect
            var conn = mysql.createConnection(config);
            conn.connect();
            conn.query('DELETE FROM lab_order_inf_tbl WHERE usr_id = ?;',
                [ss.usrId],
                function(err, results) {
                    if(err) {
                        console.log('err : ', err);
                    } else {
                        console.dir(results);
                        callback(null);
                    }
                }
            );
            conn.commit();
            conn.end();
        },
        // 해당 사용자의 주문 상세 이력 테이블 전체 삭제
        function(callback) {
            // MySQL Connect
            var conn = mysql.createConnection(config);
            conn.connect();
            conn.query('DELETE FROM lab_order_detail_his_inf_tbl WHERE usr_id = ?;',
                [ss.usrId],
                function(err, results) {
                    if(err) {
                        console.log('err : ', err);
                    } else {
                        console.dir(results);
                        callback(null);
                    }
                }
            );
            conn.commit();
            conn.end();
        },
        function(callback) {
            // 해당 사용자의 주문 이력 테이블 전체 삭제
            // MySQL Connect
            var conn = mysql.createConnection(config);
            conn.connect();
            conn.query('DELETE FROM lab_order_his_inf_tbl WHERE usr_id = ?;',
                [ss.usrId],
                function(err, results) {
                    if(err) {
                        console.log('err : ', err);
                    } else {
                        console.dir(results);
                        callback(null);
                    }
                }
            );
            conn.commit();
            conn.end();
        },
        function(callback) {
            // MySQL Connect
            var conn = mysql.createConnection(config);
            conn.connect();
            conn.query('SELECT x.order_no as orderNo, x.usr_id as usrId, x.p_code as pCode, x.p_div as pDiv, x.p_type as pType,'
                + ' CASE WHEN x.p_div = "M" THEN "기본" WHEN x.p_div = "O" THEN "옵션" ELSE "" END as pDivNm,'
                + ' x.p_pair_code_yn as pPairCodeYn, x.p_nm as pNm, x.p_price as pPrice, y.use_term_days as useTermDays,'
                + ' (SELECT total_price FROM lab_order_inf_tbl  WHERE order_no = x.order_no AND x.p_div = "M" AND x.usr_id = ?) as totalPrice,'
                + ' x.p_uniq_code as pUniqCode, x.p_opt_btn_dis_yn as pOptBtnDisYn, x.opt_cnt as optCnt, x.p_count as pCount'
                + ' FROM lab_order_detail_inf_tbl x, lab_order_inf_tbl y WHERE x.order_no = y.order_no AND y.pay_result IS NULL'
                + ' AND y.usr_id = ? ORDER BY x.p_code ASC, x.sort_no ASC;'
                + ' SELECT IFNULL(SUM(total_price),0) as totalPrice FROM lab_order_inf_tbl WHERE pay_result IS NULL AND usr_id = ?;',
                [ss.usrId, ss.usrId, ss.usrId],
                function(err, results) {
                    if(err) {
                        console.log('err : ', err);
                    } else {
                        var cartPrice = 0;
                        if(results[1].length > 0) {
                            cartPrice = results[1][0].totalPrice;
                        }
                        res.status(200).json({'cnt' : results[0].length, 'list' : results[0], 'totalPrice' : cartPrice, 'session' : ss});
                    }
                }
            );

            conn.commit();
            conn.end();
            callback(null);
        }
    ], function (err, result) {
        if(err) {
            console.log('err : ', err);
        } else {
            console.log('results : ', result);
        }
        // result에는 '끝'이 담겨 온다.
        //console.log(' async result : ', result);
    });

});

/**
 * 결제 기본단위로 삭제 처리.
 */
router.post('/paypopup/pay/delete', function(req, res) {
    console.log('결제 기본단위 삭제 처리');

    var ss = req.session;
    var orderNo = req.body.orderNo !=null ? req.body.orderNo : '';
    var pUniqCode = req.body.pUniqCode !=null ? req.body.pUniqCode : '';

    async.waterfall([

        // 해당 사용자의 주문 상세 테이블 전체 삭제
        function(callback) {
            // MySQL Connect
            var conn = mysql.createConnection(config);
            conn.connect();
            conn.query('DELETE FROM lab_order_detail_inf_tbl WHERE p_uniq_code = ? AND usr_id = ?;',
                [pUniqCode, ss.usrId],
                function(err, results) {
                    if(err) {
                        console.log('err : ', err);
                    } else {
                        console.dir(results);
                        callback(null);
                    }
                }
            );
            conn.commit();
            conn.end();
        },
        function(callback) {
            // 해당 사용자의 주문 테이블 전체 삭제
            // MySQL Connect
            var conn = mysql.createConnection(config);
            conn.connect();
            conn.query('DELETE FROM lab_order_inf_tbl WHERE order_no = ? AND usr_id = ?;',
                [orderNo, ss.usrId],
                function(err, results) {
                    if(err) {
                        console.log('err : ', err);
                    } else {
                        console.dir(results);
                        callback(null);
                    }
                }
            );
            conn.commit();
            conn.end();
        },
        // 해당 사용자의 주문 상세 이력 테이블 전체 삭제
        function(callback) {
            // MySQL Connect
            var conn = mysql.createConnection(config);
            conn.connect();
            conn.query('DELETE FROM lab_order_detail_his_inf_tbl WHERE p_uniq_code = ? AND usr_id = ?;',
                [pUniqCode, ss.usrId],
                function(err, results) {
                    if(err) {
                        console.log('err : ', err);
                    } else {
                        console.dir(results);
                        callback(null);
                    }
                }
            );
            conn.commit();
            conn.end();
        },
        function(callback) {
            // 해당 사용자의 주문 이력 테이블 전체 삭제
            // MySQL Connect
            var conn = mysql.createConnection(config);
            conn.connect();
            conn.query('DELETE FROM lab_order_his_inf_tbl WHERE order_no = ? AND usr_id = ?;',
                [orderNo, ss.usrId],
                function(err, results) {
                    if(err) {
                        console.log('err : ', err);
                    } else {
                        console.dir(results);
                        callback(null);
                    }
                }
            );
            conn.commit();
            conn.end();
        },
        function(callback) {
            // MySQL Connect
            var conn = mysql.createConnection(config);
            conn.connect();
            conn.query('SELECT x.order_no as orderNo, x.usr_id as usrId, x.p_code as pCode, x.p_div as pDiv, x.p_type as pType,'
                + ' CASE WHEN x.p_div = "M" THEN "기본" WHEN x.p_div = "O" THEN "옵션" ELSE "" END as pDivNm,'
                + ' x.p_pair_code_yn as pPairCodeYn, x.p_nm as pNm, x.p_price as pPrice, y.use_term_days as useTermDays,'
                + ' (SELECT total_price FROM lab_order_inf_tbl  WHERE order_no = x.order_no AND x.p_div = "M" AND x.usr_id = ?) as totalPrice,'
                + ' x.p_uniq_code as pUniqCode, x.p_opt_btn_dis_yn as pOptBtnDisYn, x.opt_cnt as optCnt, x.p_count as pCount'
                + ' FROM lab_order_detail_inf_tbl x, lab_order_inf_tbl y WHERE x.order_no = y.order_no AND y.usr_id = ? ORDER BY x.p_code ASC, x.sort_no ASC;'
                + ' SELECT IFNULL(SUM(total_price),0) as totalPrice FROM lab_order_inf_tbl WHERE usr_id = ?;',
                [ss.usrId, ss.usrId, ss.usrId],
                function(err, results) {
                    if(err) {
                        console.log('err : ', err);
                    } else {
                        var cartPrice = 0;
                        if(results[1].length > 0) {
                            cartPrice = results[1][0].totalPrice;
                        }
                        res.status(200).json({'cnt' : results[0].length, 'list' : results[0], 'totalPrice' : cartPrice, 'session' : ss});
                    }
                }
            );

            conn.commit();
            conn.end();
            callback(null);
        }
    ], function (err, result) {
        if(err) {
            console.log('err : ', err);
        } else {
            console.log('results : ', result);
        }
        // result에는 '끝'이 담겨 온다.
        //console.log(' async result : ', result);
    });

});


// 콤마 붙이기
function fnComma(num) {
    var reg = /(^[+-]?\d+)(\d{3})/;
    num += '';
    while(reg.test(num)) {
        num = num.replace(reg, '$1' + ',' + '$2');
    }
    return num;
}
// 콤마 제거
function fnUnComma(num) {
    if(num !=null) {
        return (num.replace(/\,/g,""));
    } else {
        return num;
    }

}

/**
 * 잔여 일수 계산
 * @param starDt
 * @param endDt
 */
function fncRemainDay(endDt) {
    var day = 1000 * 60 * 60 * 24;
    var month = day * 30;
    var year = month * 12;
    var remainDay = 0;

    console.log('endDt : ', endDt);
    if(endDt !=null) {
        // 현재날짜
        var dt = new Date();
        var nowYear = dt.getFullYear();
        var nowMonth = (dt.getMonth() + 1) > 9 ? '' + (dt.getMonth() + 1) : '0' + (dt.getMonth() + 1);
        var nowDay = dt.getDate() > 9 ? '' + dt.getDate() : '0' + dt.getDate();
        var nowDate = nowYear.toString() + "" + nowMonth.toString() + "" + nowDay.toString();

        //var startDate = new Date(startDt.substr(0,4), startDt.substr(4,2)-1, startDt.substr(6,2));
        var endDate = new Date(endDt.substr(0, 4), endDt.substr(4, 2) - 1, endDt.substr(6, 2));
        var nDate = new Date(nowDate.substr(0, 4), nowDate.substr(4, 2) - 1, nowDate.substr(6, 2));

        var interval = endDate - nDate;

        //var remainYear = parseInt(interval / year);
        //var remainMonth = parseInt(interval / month);
        remainDay = parseInt(interval / day);
    }

    return remainDay;
}

/**
 * 잔여 월수 계산 함수.
 * @param endDt
 * @returns {Number}
 */
function fncRemainMonth(endDt) {
    var day = 1000 * 60 * 60 * 24;
    var month = day * 30;
    var year = month * 12;
    var remainMonth = 0;

    if(endDt != null) {
        // 현재날짜
        var dt = new Date();
        var nowYear = dt.getFullYear();
        var nowMonth = (dt.getMonth() + 1) > 9 ? '' + (dt.getMonth() + 1) : '0' + (dt.getMonth() + 1);
        var nowDay = dt.getDate() > 9 ? '' + dt.getDate() : '0' + dt.getDate();
        var nowDate = nowYear.toString() + "" + nowMonth.toString() + "" + nowDay.toString();

        //var startDate = new Date(startDt.substr(0,4), startDt.substr(4,2)-1, startDt.substr(6,2));
        var endDate = new Date(endDt.substr(0, 4), endDt.substr(4, 2) - 1, endDt.substr(6, 2));
        var nDate = new Date(nowDate.substr(0, 4), nowDate.substr(4, 2) - 1, nowDate.substr(6, 2));

        var interval = endDate - nDate;

        //var remainYear = parseInt(interval / year);
        remainMonth = parseInt(interval / month);
        //var remainDay = parseInt(interval / day);
    }

    return remainMonth;
}

/**
 * 월을 일로 변환 처리.
 * @param month
 * @returns {number}
 */
function monthToDay(month) {
    var day = 30;
    var retVal = 0;
    if(month != null) {
        retVal = parseInt(month) * day;
    }
    return retVal;
}

function DayToMonth(day) {
    var retVal = 0;
    if(day != null) {
        retVal = parseInt(day) / 30;
    }
    return parseInt(retVal);
}

/*
 * RANDOM STRING GENERATOR
 *
 * Info:      http://stackoverflow.com/a/27872144/383904
 * Use:       randomString(length [,"A"] [,"N"] );
 * Default:   return a random alpha-numeric string
 * Arguments: If you use the optional "A", "N" flags:
 *            "A" (Alpha flag)   return random a-Z string
 *            "N" (Numeric flag) return random 0-9 string
 */
function randomString(len, an){
    an = an&&an.toLowerCase();
    var str="", i=0, min=an=="a"?10:0, max=an=="n"?10:62;
    for(;i++<len;){
        var r = Math.random()*(max-min)+min <<0;
        str += String.fromCharCode(r+=r>9?r<36?55:61:48);
    }
    return str;
}


module.exports = router;