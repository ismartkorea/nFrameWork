/*
 * 모듈명  : pay.js
 * 설명    : JT-LAB 화면 '결제' 에 대한 모듈.
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
var path = require('path');
var config = require('./common/dbconfig');
var Logs = require('./common/dblog');
var nodeEmail =require('nodemailer');
var EmailTemplate = require('email-templates').EmailTemplate;
var templateDir = path.resolve(__dirname, 'templates2');
var smtpTransport = require('nodemailer-smtp-transport');
var async = require('async');
var Iamport = require('iamport');
var iamport = new Iamport({
    impKey : '6727859979366252',
    impSecret : 'npEtTRfzAuks0hrLfQpR5V3d4kqJXkZlJEPDv4c6zxzAO1l4RKVWFZaKkBtiVtDF8siExvK72kHRl3Vc'
    // 테스트용
    //impKey : 'imp_apikey',
    //impSecret : 'ekKoeW8RyKuT0zgaZsUtXXTLQ4AhPFW3ZGseDA6bkA5lamv9OqDMnxyeB9wqOsuO9W3Mx9YSJ4dTqJ3f'
});
var router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));
router.use(methodOverride("_method"));
router.use(flash());


// mysql setting
var conn = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    database : 'jtlab',
    user: 'jtlab',
    password: 'jtlab9123',
    insecureAuth: true,
    multipleStatements: true
});


// 이메일 서버 정보 셋팅
var smtpTransport = nodeEmail.createTransport(smtpTransport({
    host : 'smtp.gmail.com',
    secureConnection : false,
    port : 465,
    auth : {
        user : 'jtlab.notifier@gmail.com',
        pass : '0o0o!!!@'
    }
}));
// SQL Err 저장용 로그유틸 초기화.
var logs = new Logs();

/**
 * 결제 테이블 업데이트 처리.
 */
router.post('/', function(req, res) {
    console.log('routes 결제 처리.');

    var ss = req.session;
    var usrNo = ss.usrNo !=null ? ss.usrNo : "";
    console.log('req.body : ', JSON.stringify(req.body) + '\n');

    var prvOrderNo = req.body.pastOrderNo !=null ? req.body.pastOrderNo : ''; // 이전 주문번호
    var orderNo = req.body.orderNo !=null ? req.body.orderNo : ''; // 현 주문번호
    //var payType = req.body.payType !=null ? req.body.payType : ''; // 결제타입 (1:신용카드,2:이체,3:모바일소액결제)
    var totalPrice = req.body.totalPayPrice != null ? parseInt(fnUnComma(req.body.totalPayPrice)) : 0;
    var taxInvoiceYn = req.body.taxInvoiceYn != null ? req.body.taxInvoiceYn : ''; // 전자계산서 발행 요청여부.
    var payMethod = req.body.payMethod != null ? req.body.payMethod : '';
    var useTermDays = req.body.uTermDays !=null ? req.body.uTermDays : 0;
    // 기존 주문번호, 잔여일수, 사용한 일수, 잔액, 공제액 셋팅.
    /*
    var prevOrderNo = req.body.prevOrderNo !=null ? req.body.prevOrderNo : '';
    var remainDays = req.body.remainDays !=null ? req.body.remainDays : 0;
    var usedDays = req.body.usedDays !=null ? req.body.usedDays : 0;
    var remainPrice = req.body.remainPrice !=null ? fnUnComma(req.body.remainPrice) : 0;
    var subtractPrice = req.body.subtractPrice !=null ? fnUnComma(req.body.subtractPrice) : 0;
    var dcntPercent = req.body.dcntPercent !=null ? req.body.dcntPercent : 0;

console.log('\n prevOrderNo : ', prevOrderNo);
console.log('remainDays : ', remainDays);
console.log('usedDays : ', usedDays);
console.log('remainPrice : ', remainPrice);
console.log('dcntPercent : ', dcntPercent);
console.log('subtractPrice : ', subtractPrice + '\n');
     */
    console.log('\n prvOrderNo : ', prvOrderNo);
    console.log('orderNo : ', orderNo);
    console.log('useTermDays : ', useTermDays + '\n');

    // 테이블 저장 처리.
    async.waterfall([
/*
        function(callback) {

            if(prvOrderNo != '') {
                // 기존 주문 히스토리에 복사.
                var conn = mysql.createConnection(config);
                conn.query('INSERT INTO  lab_order_detail_his_inf_tbl  (SELECT * FROM lab_order_detail_inf_tbl WHERE order_no = ? AND usr_id = ?);'
                    + 'INSERT INTO  lab_order_his_inf_tbl  (SELECT * FROM lab_order_inf_tbl WHERE order_no = ? AND usr_id = ?);',
                    [prvOrderNo, ss.usrId, prvOrderNo, ss.usrId],
                    function (err, results) {
                        if (err) {
                            console.log('err : ', err);
                        } else {
                            console.log('pay.js 기존 주문 테이블 복사 처리.');
                            console.dir(results);
                        }
                    }
                );
                conn.commit();
                conn.end();
            } else {
                // 현 주문 히스토리에 복사.
                var conn = mysql.createConnection(config);
                conn.query('INSERT INTO  lab_order_detail_his_inf_tbl  (SELECT * FROM lab_order_detail_inf_tbl WHERE order_no = ? AND usr_id = ?);'
                    + 'INSERT INTO  lab_order_his_inf_tbl  (SELECT * FROM lab_order_inf_tbl WHERE order_no = ? AND usr_id = ?);',
                    [orderNo, ss.usrId, orderNo, ss.usrId],
                    function (err, results) {
                        if (err) {
                            console.log('err : ', err);
                        } else {
                            console.log('pay.js 현 주문 테이블 복사 처리.');
                            console.dir(results);
                        }
                    }
                );
                conn.commit();
                conn.end();
            }
            callback(null);
        },
 */
        function(callback) {
            if(prvOrderNo != '') {
                // 기존 주문 삭제 처리.
                var conn = mysql.createConnection(config);
                /* Begin transaction */
                conn.beginTransaction(function(err) {
                    if(err) { console.log('transaction err!'); }
                    conn.query('DELETE FROM lab_order_detail_inf_tbl WHERE order_no = ? AND usr_id = ?;'
                        + 'DELETE FROM lab_order_inf_tbl WHERE order_no = ? AND usr_id = ?;',
                        [prvOrderNo, ss.usrId, prvOrderNo, ss.usrId],
                        function (err, results) {
                            if (err) {
                                conn.rollback(function() {
                                    //throw err;
                                    logs.saveErrLog(err.code, err.errno, err.sqlMessage);
                                });
                                conn.end();
                            } else {
                                conn.commit(function(err) {
                                    if(err) {
                                        conn.rollback(function() {
                                            //throw err;
                                            logs.saveErrLog(err.code, err.errno, err.sqlMessage);
                                        });
                                    }
                                    console.log('pay.js 기존주문 삭제처리.');
                                    conn.end();
                                });
                            }
                        }
                    );
                });
            }
            callback(null);
        },

        function(callback) {
            // 주문 테이블의 주문번호로 처리함.
            var conn = mysql.createConnection(config);
            conn.connect();
            conn.query('INSERT INTO lab_pay_info_tbl(order_no, pay_code, usr_id, p_total_price, pay_method, pay_date, pay_result, use_term_days, use_end_date,'
                + ' tax_invoice_req_yn, expire_yn, insert_dt, insert_usr, update_dt, update_usr) SELECT order_no, "", "' + ss.usrId + '", total_price,'
                + ' "' + payMethod + '", now(), "wait", "' + useTermDays + '", ADDDATE(now(), "' + useTermDays + '"), "' + taxInvoiceYn + '", "N", now(), "' + ss.usrId + '", now(), "'
                + ss.usrId + '" FROM lab_order_inf_tbl WHERE order_no = ? AND usr_id = ?',
                [orderNo, ss.usrId],
                function (err, results) {
                    if (err) {
                        console.log('err : ', err);
                    } else {
                        console.log('pay.js 주문 마스터 테이블에서 결제 마스터 테이블에 복사 처리.');
                        console.dir(results);
                        callback(null);
                    }
                });
            conn.commit();
            conn.end();
        },
        function(callback) {
            // 카트 정보 삭제 처리.
            // 주문 테이블의 주문번호로 처리함.
            var conn = mysql.createConnection(config);
            conn.connect();
            conn.query('DELETE FROM lab_cart_inf_tbl WHERE usr_id = ?;',
                [ss.usrId],
                function (err, results) {
                    if (err) {
                        console.log('err : ', err);
                    } else {
                        console.log('pay.js 카트 정보 삭제 처리.');
                        console.dir(results);
                        callback(null);
                    }
                });
            conn.commit();
            conn.end();
        },
        function(callback) {
            // 결제된 내역 정보 조회.
            var conn = mysql.createConnection(config);
            conn.connect();
            conn.query('SELECT p_code as pCode, p_div as pDiv,'
                + ' CASE WHEN p_div = "M" THEN "기본" WHEN p_div = "O" THEN "옵션" ELSE "" END as pDivNm,'
                + ' p_nm as pNm, p_price as pPrice FROM lab_order_detail_inf_tbl'
                + ' WHERE order_no = ? AND usr_id = ? ORDER BY p_code ASC, sort_no ASC;',
                [orderNo, ss.usrId],
                function (err, results) {
                    if (err) {
                        console.log('err : ', err);
                    } else {
                        console.log('pay.js 결제된 내역 정보 조회');
                        console.dir(results);
                        callback(null, results);
                    }
                });
            conn.end();
        },
        function(retList, callback) {

            // 무통장 입금인 경우
            if (payMethod == 'bank' || payMethod == 'escro') {

                // 메일 발송
                var usrEmail = ss.usrEmail != null ? ss.usrEmail : '';
                var compNm = ss.usrCompNm != null ? ss.usrCompNm : '';
                var content = '<dd>Assist Pro 서비스 이용 신청해주셔서 감사합니다.</dd>';
                content += '<dd>* 아래의 계좌정보로 입금해주시면 확인하시고 이용처리 해드립니다. </dd>';
                content += '<dd>* 입금 계좌 은행 : 농협 </dd>';
                content += '<dd>* 예금계좌번호 : 농협 302-9992-3210-21</dd>';
                content += '<dd>* 예금주명:  황경록(제이티랩(JTLAB)) </dd>';

                // 관리자에게 이메일 전송처리.
                sendMail(usrEmail, compNm, content);

                // 안내 페이지로 이동.
                res.render('./pay/announce', {'orderNo' : orderNo, 'rList' : retList, 'payPrice': totalPrice, 'session': ss});

            } else if (payMethod == 'paypal') {
                // 그 외 결제방법.(페이팔)
                var conn = mysql.createConnection(config);
                conn.connect();
                conn.query('select c_no, c_id, c_pwd, c_name, c_addr1, c_addr2, c_postno, c_email, c_sex, c_birth,  c_jumin_no,'
                    + ' c_tel_no, c_tel_no1, c_tel_no2, c_tel_no3, c_cell_no, c_cell_no1, c_cell_no2, c_cell_no3, c_comp_nm,'
                    + ' c_comp_tel_no, c_comp_addr1, c_comp_addr2, c_comp_postno, c_saup_no from c_inf_tbl'
                    + ' where c_no = ?',
                    [usrNo],
                    function (err, results) {
                        if (err) {
                            console.log('error : ', err.message);
                            res.render('error', {message: err.message, error: err, session: ss});
                        } else {
                            //console.log(">>> 사용자 정보 조회 : " + JSON.stringify(results[0]));
                            var usrEmail = results[0].c_email;
                            var usrName = results[0].c_name;
                            var usrTelNo = results[0].c_tel_no1 + "-" + results[0].c_tel_no2 + "-" + results[0].c_tel_no3;
                            var usrCellNo = results[0].c_cell_no1 + "-" + results[0].c_cell_no2 + "-" + results[0].c_cell_no3;
                            var usrAddress = results[0].c_addr1 + "" + results[0].c_addr2;
                            var usrPostNo = results[0].c_postno;
//console.log('result -> gPayNo : ' , gPayNo);
                            var payData = {
                                payNo: orderNo,
                                //payPgNm : 'html5_inicis',
                                payPgNm: 'paypal',
                                //payMethod : req.body.payMethod,
                                payMethod: payMethod,
                                orderNo: orderNo,
                                payName: 'JTLAB 서비스 결제',
                                amount: totalPrice,
                                //email : req.body.email,
                                email: usrEmail,
                                //name : req.body.name,
                                name: usrName,
                                //telno : req.body.telno,
                                telno: usrTelNo,
                                //address : req.body.address,
                                address: usrAddress,
                                //postno : req.body.postno
                                postno: usrPostNo
                            };
                            res.render('./pay/pgCall', {data: payData});
                        }
                    });
                conn.end();
                // 그외 결제인(금액이 0인) 경우
            } else {
                // 메일 발송
                var usrEmail = ss.usrEmail != null ? ss.usrEmail : '';
                var compNm = ss.usrCompNm != null ? ss.usrCompNm : '';
                var content = '<dd>Assist Pro 서비스 이용 신청해주셔서 감사합니다.</dd>';
                content += '<dd>* 4시간 이내 확인하고 서비스 이용처리 해드리겠습니다. </dd>';

                // 관리자에게 이메일 전송처리.
                sendMail(usrEmail, compNm, content);

                // 안내 페이지로 이동.
                res.render('./pay/announce', {'orderNo' : orderNo, 'rList' : retList, 'payPrice': totalPrice, 'session': ss});
            }
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
 * 결제 테이블 업데이트 처리. (신규)
 */
router.post('/new', function(req, res) {
    console.log('routes NEW 결제 처리.');

    var ss = req.session;
    var usrNo = ss.usrNo !=null ? ss.usrNo : "";
    var usrId = ss.usrId !=null ? ss.usrId : '';
    var usrName = ss.usrName !=null ? ss.usrName : '';
    var orderAddr1 = ""; var orderAddr2 = ""; var orderTelno = ""; var orderPostno = "";
    var orderTelno1 = ""; var orderTelno2 = ""; var orderTelno3 = ""; var orderCellno = "";
    var orderCellno1 = ""; var orderCellno2 = ""; var orderCellno3 = "";
    var receiverPostno = ""; var receiverCellno = ""; var receiverId = "";
    var receiverNm = ""; var receiverAddr1 = ""; var receiverAddr2 = "";
    var receiverTelno1 = ""; var receiverTelno2 = ""; var receiverTelno3 = "";
    var receiverCellno1 = ""; var receiverCellno2 = ""; var receiverCellno3 = "";
    var receiverTelno = "";
    console.log('req.body : ', JSON.stringify(req.body) + '\n');

    var orderNo = req.body['orderNo'] !=null ? req.body['orderNo'] : ''; // 현 주문번호
    var pDiv = req.body['2pDiv'] !=null ? req.body['2pDiv'] : '';
    var prvOrderNo = req.body.pastOrderNo !=null ? req.body.pastOrderNo : ''; // 과거 주문번호
    //var payType = req.body.payType !=null ? req.body.payType : ''; // 결제타입 (1:신용카드,2:이체,3:모바일소액결제)
    var totalPrice = req.body.totalPayPrice != null ? parseInt(fnUnComma(req.body.totalPayPrice)) : 0;
    var taxInvoiceYn = req.body.taxInvoiceYn != null ? req.body.taxInvoiceYn : ''; // 전자계산서 발행 요청여부.
    var payMethod = req.body.payMethod != null ? req.body.payMethod : '';
    var shippingUseYn = req.body.shippingUseYn != null ? req.body.shippingUseYn : '';
    // 배솓지 정보 조회
    if(shippingUseYn == "Y") {
        orderPostno = req.body.orderPostno !=null ? req.body.orderPostno : '';
        orderAddr1 = req.body.orderAddr1 !=null ? req.body.orderAddr1 : '';
        orderAddr2 = req.body.orderAddr2 !=null ? req.body.orderAddr2 : '';
        orderTelno1 = req.body.orderTelno1 !=null ? req.body.orderTelno1 : '';
        orderTelno2 = req.body.orderTelno2 !=null ? req.body.orderTelno2 : '';
        orderTelno3 = req.body.orderTelno3 !=null ? req.body.orderTelno3 : '';
        orderCellno = req.body.orderCellno !=null ? req.body.orderCellno : '';
        orderCellno1 = req.body.orderCellno1 !=null ? req.body.orderCellno1 : '';
        orderCellno2 = req.body.orderCellno2 !=null ? req.body.orderCellno2 : '';
        orderCellno3 = req.body.orderCellno3 !=null ? req.body.orderCellno3 : '';
        receiverNm = req.body.receiverNm != null ? req.body.receiverNm : '';
        receiverId = req.body.receiverId != null ? req.body.receiverId : '';
        receiverPostno = req.body.receiverPostno != null ? req.body.receiverPostno : '';
        receiverAddr1 = req.body.receiverAddr1 !=null ? req.body.receiverAddr1 : '';
        receiverAddr2 = req.body.receiverAddr2 !=null ? req.body.receiverAddr2 : '';
        receiverTelno1 = req.body.receiverTelno1 !=null ? req.body.receiverTelno1 : '';
        receiverTelno2 = req.body.receiverTelno2 !=null ? req.body.receiverTelno2 : '';
        receiverTelno3 = req.body.receiverTelno3 !=null ? req.body.receiverTelno3 : '';
        receiverCellno = req.body.receiverCellno !=null ? req.body.receiverCellno : '';
        receiverCellno1 = req.body.receiverCellno1 !=null ? req.body.receiverCellno1 : '';
        receiverCellno2 = req.body.receiverCellno2 !=null ? req.body.receiverCellno2 : '';
        receiverCellno3 = req.body.receiverCellno3 !=null ? req.body.receiverCellno3 : '';
        orderTelno = orderTelno1 + orderTelno2 + orderTelno3;
        receiverTelno = receiverTelno1 + "-" + receiverTelno2 + "-" + receiverTelno3;
        receiverCellno = receiverCellno1 + "-" + receiverCellno2 + "-" + receiverCellno3;
    }

    var splitPrvOrderNo = prvOrderNo.split(",");
    var splitOrderNo = '';
    var arrOrderNo = [];
    var orderNoCnt = 0;
    if(typeof(orderNo) == 'object') {
        orderNoCnt = orderNo.length;
    } else if(typeof(orderNo) == 'string') {
        orderNoCnt = 1;
    }

    // pay code 생성.
    var pMiddle = randomString(15, 'n');
    var pPrev = "JTPC";
    var payCode = pPrev + pMiddle;

    //var useTermDays = req.body.uTermDays !=null ? req.body.uTermDays : 0;
    // 기존 주문번호, 잔여일수, 사용한 일수, 잔액, 공제액 셋팅.
    /*
     var remainDays = req.body.remainDays !=null ? req.body.remainDays : 0;
     var usedDays = req.body.usedDays !=null ? req.body.usedDays : 0;
     var remainPrice = req.body.remainPrice !=null ? fnUnComma(req.body.remainPrice) : 0;
     var subtractPrice = req.body.subtractPrice !=null ? fnUnComma(req.body.subtractPrice) : 0;
     var dcntPercent = req.body.dcntPercent !=null ? req.body.dcntPercent : 0;

     console.log('\n prevOrderNo : ', prevOrderNo);
     console.log('remainDays : ', remainDays);
     console.log('usedDays : ', usedDays);
     console.log('remainPrice : ', remainPrice);
     console.log('dcntPercent : ', dcntPercent);
     console.log('subtractPrice : ', subtractPrice + '\n');
     */
    console.log('orderNoCnt : ', orderNoCnt + '\n');
    var cnt = orderNo.length - 1;
    for(var z = 0; z < orderNoCnt; z++) {

        if(orderNoCnt > 1) {
            if (z == cnt) {
                splitOrderNo += '"' + orderNo[z] + '"';
            } else {
                splitOrderNo += '"' + orderNo[z] + '",';
            }
        } else {
            splitOrderNo = '"' + orderNo + '"';
        }


        (function () {
            var idx = z;

            // 테이블 저장 처리.
            async.waterfall([
                function(callback) {
                    if(splitPrvOrderNo[idx] !=null && splitPrvOrderNo[idx] != '') {
                        // 기존 주문 삭제 처리.
                        var conn = mysql.createConnection(config);
                        /* Begin transaction */
                        conn.beginTransaction(function(err) {
                            if(err) { console.log('pay.js 기존주문 삭제처리. err : ', err); }
                            conn.query('DELETE FROM lab_order_detail_inf_tbl WHERE order_no = ? AND usr_id = ?;'
                                + 'DELETE FROM lab_order_inf_tbl WHERE order_no = ? AND usr_id = ?;',
                                [prvOrderNo, ss.usrId, prvOrderNo, ss.usrId],
                                function (err, results) {
                                    if (err) {
                                        conn.rollback(function() {
                                            //throw err;
                                            logs.saveErrLog(err.code, err.errno, err.sqlMessage);
                                        });
                                        conn.end();
                                    } else {
                                        conn.commit(function(err) {
                                            if(err) {
                                                conn.rollback(function() {
                                                    //throw err;
                                                    logs.saveErrLog(err.code, err.errno, err.sqlMessage);
                                                });
                                            }
                                            console.log('pay.js 기존주문 삭제처리.');
                                            conn.end();
                                        });
                                    }
                                }
                            );
                        });
                    }
                    callback(null);
                },
                function (callback) {

                    var setOrderNo = '';
                    if(orderNoCnt > 1) {
                        setOrderNo = orderNo[idx];
                    } else {
                        setOrderNo = orderNo;
                    }

                    // 주문 테이블의 주문번호로 처리함.
                    var conn = mysql.createConnection(config);
                    conn.connect();
                    /* Begin transaction */
                    conn.beginTransaction(function(err) {
                        if (err) {
                            console.log('주문 테이블의 주문번호로 처리 err : ', err);
                        }
                        conn.query('INSERT INTO lab_pay_info_tbl(order_no, pay_code, usr_id, p_sum_price, p_total_price, pay_method, pay_date, pay_result, use_term_days, use_end_date,'
                            + ' tax_invoice_req_yn, expire_yn, insert_dt, insert_usr, update_dt, update_usr) SELECT order_no, "' + payCode + '", "' + ss.usrId + '", total_price, "' + totalPrice + '",'
                            + ' "' + payMethod + '", now(), "wait", use_term_days, ADDDATE(now(), use_term_days), "' + taxInvoiceYn + '", "N", now(), "' + ss.usrId + '", now(), "'
                            + ss.usrId + '" FROM lab_order_inf_tbl WHERE order_no = ? AND usr_id = ?',
                            [setOrderNo, ss.usrId],
                            function (err, results) {
                                if (err) {
                                    conn.rollback(function() {
                                        //throw err;
                                        logs.saveErrLog(err.code, err.errno, err.sqlMessage);
                                    });
                                    conn.end();
                                } else {
                                    conn.commit(function(err) {
                                        if(err) {
                                            conn.rollback(function() {
                                                //throw err;
                                                logs.saveErrLog(err.code, err.errno, err.sqlMessage);
                                            });
                                        }
                                        console.log('pay.js 주문 마스터 테이블에서 결제 마스터 테이블에 복사 처리.');
                                        conn.end();
                                    });
                                    callback(null, setOrderNo);
                                }
                            });
                    });
                },
                function (getOrderNo, callback) {

console.log('getOrderNo : ', getOrderNo);

                    // 주문 테이블의 주문번호로 처리함.
                    var conn = mysql.createConnection(config);
                    conn.connect();
                    /* Begin transaction */
                    conn.beginTransaction(function(err) {
                        if (err) {
                            console.log('lab_order_inf_tbl pay_result 업데이트 처리 err : ', err);
                        }
                        conn.query('UPDATE lab_order_inf_tbl SET pay_result = "wait" WHERE order_no = ? AND usr_id = ?',
                            [getOrderNo, ss.usrId],
                            function (err, results) {
                                if (err) {
                                    conn.rollback(function() {
                                        //throw err;
                                        logs.saveErrLog(err.code, err.errno, err.sqlMessage);
                                    });
                                    conn.end();
                                } else {
                                    conn.commit(function(err) {
                                        if(err) {
                                            conn.rollback(function() {
                                                //throw err;
                                                logs.saveErrLog(err.code, err.errno, err.sqlMessage);
                                            });
                                        }
                                        console.log('lab_order_inf_tbl pay_result 업데이트 처리.');
                                        conn.end();
                                    });
                                    callback(null);
                                }
                            });
                    });
                },
                function (callback) {
                    // 카트 정보 삭제 처리.
                    // 주문 테이블의 주문번호로 처리함.
                    var conn = mysql.createConnection(config);
                    conn.connect();
                    /* Begin transaction */
                    conn.beginTransaction(function(err) {
                        if (err) {
                            console.log('lab_order_inf_tbl pay_result 업데이트 처리 err : ', err);
                        }
                        conn.query('DELETE FROM lab_cart_inf_tbl WHERE usr_id = ?;',
                            [ss.usrId],
                            function (err, results) {
                                if (err) {
                                    conn.rollback(function() {
                                        //throw err;
                                        logs.saveErrLog(err.code, err.errno, err.sqlMessage);
                                    });
                                    conn.end();
                                } else {
                                    conn.commit(function(err) {
                                        if(err) {
                                            conn.rollback(function() {
                                                //throw err;
                                                logs.saveErrLog(err.code, err.errno, err.sqlMessage);
                                            });
                                        }
                                        console.log('pay.js 카트 정보 삭제 처리.');
                                        conn.end();
                                    });
                                    callback(null);
                                }
                            });
                    });
                },
                function (callback) {
                    if(shippingUseYn == "Y") {
                        // 배송정보 저장 처리.
                        var conn = mysql.createConnection(config);
                        conn.connect();
                        conn.query('INSERT INTO lab_shipping_inf_tbl(pay_code, order_usr_id, order_nm, order_addr1,'
                            + ' order_addr2, order_postno, order_tel_no, order_tel_no1, order_tel_no2, order_tel_no3,'
                            + ' order_cell_no, order_cell_no1, order_cell_no2, order_cell_no3, addrsee_nm, addrsee_usr_id,'
                            + ' addrsee_addr1, addrsee_addr2, addrsee_postno, addrsee_tel_no, addrsee_tel_no1, addrsee_tel_no2,'
                            + ' addrsee_tel_no3, addrsee_cell_no, addrsee_cell_no1, addrsee_cell_no2, addrsee_cell_no3,'
                            + ' ins_date, ins_usr_id, upd_date, upd_usr_id)'
                            + ' VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), ?, now(), ?)',
                            [payCode, usrId, usrName, orderAddr1, orderAddr2, orderPostno, orderTelno,
                                orderTelno1, orderTelno2, orderTelno3, orderCellno, orderCellno1, orderCellno2, orderCellno3,
                                receiverNm, receiverId, receiverAddr1, receiverAddr2, receiverPostno, receiverTelno, receiverTelno1,
                                receiverTelno2, receiverTelno3, receiverCellno, receiverCellno1, receiverCellno2, receiverCellno3, usrId, usrId
                            ],
                            function(err, results) {
                                if(err) {
                                    console.log('err : ', err);
                                } else {
                                    console.dir(results);
                                }
                            });
                        conn.commit();
                        conn.end();
                    }
                    callback(null);
                }
            ], function (err, result) {
                if (err) {
                    console.log('err : ', err);
                } else {
                    console.log('results : ', result);
                }
                // result에는 '끝'이 담겨 온다.
                //console.log(' async result : ', result);
            });

        })(); // end function
    }

console.log('splitOrderNo : ', splitOrderNo);

    // 테이블 조회 처리 및 결제 결과 이메일 발송 처리.
    async.waterfall([
        function(callback) {

//console.log('usrId : ', usrId);
            // 결제된 내역 정보 조회.
            var conn = mysql.createConnection(config);
            conn.connect();
            conn.query('SELECT p_code as pCode, p_div as pDiv,'
                + ' CASE WHEN p_div = "M" THEN "기본" WHEN p_div = "O" THEN "옵션" ELSE "" END as pDivNm,'
                + ' p_nm as pNm, p_price as pPrice FROM lab_order_detail_inf_tbl'
                + ' WHERE order_no IN (' + splitOrderNo + ') AND usr_id = ? ORDER BY p_code ASC, sort_no ASC;',
/*
            conn.query('SELECT x.p_code as pCode, x.p_div as pDiv,'
                + ' CASE WHEN x.p_div = "M" THEN "기본" WHEN x.p_div = "O" THEN "옵션" ELSE "" END as pDivNm,'
                + ' x.p_nm as pNm, x.p_price as pPrice FROM lab_order_detail_inf_tbl x, lab_pay_info_tbl y'
                + ' WHERE x.order_no = y.order_no AND y.pay_result = "wait" AND x.usr_id = ? ORDER BY x.p_code ASC, x.sort_no ASC;',
*/
                [usrId],
                function (err, results) {
                    if (err) {
                        console.log('err : ', err);
                    } else {
                        console.log('pay.js 결제된 내역 정보 조회');
                        console.dir(results);
                        callback(null, results);
                    }
                });
            conn.end();
        },
        function(retList, callback) {

            // 무통장 입금인 경우
            if (payMethod == 'bank' || payMethod == 'escro') {

                // 메일 발송
                var usrEmail = ss.usrEmail != null ? ss.usrEmail : '';
                var compNm = ss.usrCompNm != null ? ss.usrCompNm : '';
                var content = '<dd>JT-LAB 시스템/서비스 구매(이용) 신청해주셔서 감사합니다.</dd>';
                content += '<dd>* 아래의 계좌정보로 입금해주시면 확인하시고 이용처리 해드립니다. </dd>';
                content += '<dd>* 입금 계좌 은행 : 농협 </dd>';
                content += '<dd>* 예금계좌번호 : 농협 302-9992-3210-21</dd>';
                content += '<dd>* 예금주명:  황경록(제이티랩(JTLAB)) </dd>';

                // 관리자에게 이메일 전송처리.
                sendMail(usrEmail, compNm, content);

                // 안내 페이지로 이동.
                res.render('./pay/announce', {'orderNo' : orderNo, 'rList' : retList, 'payPrice': totalPrice, 'session': ss});
            } else if (payMethod == 'card') {
                // 그 외 결제방법.(카드)
                var conn = mysql.createConnection(config);
                conn.connect();
                conn.query('select c_no, c_id, c_pwd, c_name, c_addr1, c_addr2, c_postno, c_email, c_sex, c_birth,  c_jumin_no,'
                    + ' c_tel_no, c_tel_no1, c_tel_no2, c_tel_no3, c_cell_no, c_cell_no1, c_cell_no2, c_cell_no3, c_comp_nm,'
                    + ' c_comp_tel_no, c_comp_addr1, c_comp_addr2, c_comp_postno, c_saup_no from c_inf_tbl'
                    + ' where c_no = ?',
                    [usrNo],
                    function (err, results) {
                        if (err) {
                            console.log('error : ', err.message);
                            res.render('error', {message: err.message, error: err, session: ss});
                        } else {
                            //console.log(">>> 사용자 정보 조회 : " + JSON.stringify(results[0]));
                            var usrEmail = results[0].c_email;
                            var usrName = results[0].c_name;
                            var usrTelNo = results[0].c_tel_no1 + "-" + results[0].c_tel_no2 + "-" + results[0].c_tel_no3;
                            var usrCellNo = results[0].c_cell_no1 + "-" + results[0].c_cell_no2 + "-" + results[0].c_cell_no3;
                            var usrAddress = results[0].c_addr1 + "" + results[0].c_addr2;
                            var usrPostNo = results[0].c_postno;
//console.log('result -> gPayNo : ' , gPayNo);
                            var payData = {
                                //payNo: orderNo,
                                payNo: payCode,
                                //payPgNm : 'html5_inicis',
                                payPgNm: 'card',
                                //payMethod : req.body.payMethod,
                                payMethod: payMethod,
                                orderNo: orderNo,
                                payName: 'JTLAB 서비스 결제',
                                amount: totalPrice,
                                //email : req.body.email,
                                email: usrEmail,
                                //name : req.body.name,
                                name: usrName,
                                //telno : req.body.telno,
                                telno: usrTelNo,
                                //address : req.body.address,
                                address: usrAddress,
                                //postno : req.body.postno
                                postno: usrPostNo
                            };
                            res.render('./pay/pgCall', {data: payData});
                        }
                    });
                conn.end();
                // 그외 결제인(금액이 0인) 경우

            } else if (payMethod == 'paypal') {
                // 그 외 결제방법.(페이팔)
                var conn = mysql.createConnection(config);
                conn.connect();
                conn.query('select c_no, c_id, c_pwd, c_name, c_addr1, c_addr2, c_postno, c_email, c_sex, c_birth,  c_jumin_no,'
                    + ' c_tel_no, c_tel_no1, c_tel_no2, c_tel_no3, c_cell_no, c_cell_no1, c_cell_no2, c_cell_no3, c_comp_nm,'
                    + ' c_comp_tel_no, c_comp_addr1, c_comp_addr2, c_comp_postno, c_saup_no from c_inf_tbl'
                    + ' where c_no = ?',
                    [usrNo],
                    function (err, results) {
                        if (err) {
                            console.log('error : ', err.message);
                            res.render('error', {message: err.message, error: err, session: ss});
                        } else {
                            //console.log(">>> 사용자 정보 조회 : " + JSON.stringify(results[0]));
                            var usrEmail = results[0].c_email;
                            var usrName = results[0].c_name;
                            var usrTelNo = results[0].c_tel_no1 + "-" + results[0].c_tel_no2 + "-" + results[0].c_tel_no3;
                            var usrCellNo = results[0].c_cell_no1 + "-" + results[0].c_cell_no2 + "-" + results[0].c_cell_no3;
                            var usrAddress = results[0].c_addr1 + "" + results[0].c_addr2;
                            var usrPostNo = results[0].c_postno;
//console.log('result -> gPayNo : ' , gPayNo);
                            var payData = {
                                //payNo: orderNo,
                                payNo: payCode,
                                //payPgNm : 'html5_inicis',
                                payPgNm: 'paypal',
                                //payMethod : req.body.payMethod,
                                payMethod: payMethod,
                                orderNo: orderNo,
                                payName: 'JTLAB 서비스 결제',
                                amount: totalPrice,
                                //email : req.body.email,
                                email: usrEmail,
                                //name : req.body.name,
                                name: usrName,
                                //telno : req.body.telno,
                                telno: usrTelNo,
                                //address : req.body.address,
                                address: usrAddress,
                                //postno : req.body.postno
                                postno: usrPostNo
                            };
                            res.render('./pay/pgCall', {data: payData});
                        }
                    });
                conn.end();
                // 그외 결제인(금액이 0인) 경우
            } else {
                // 메일 발송
                var usrEmail = ss.usrEmail != null ? ss.usrEmail : '';
                var compNm = ss.usrCompNm != null ? ss.usrCompNm : '';
                var content = '<dd>Assist Pro 서비스 이용 신청해주셔서 감사합니다.</dd>';
                content += '<dd>* 4시간 이내 확인하고 서비스 이용처리 해드리겠습니다. </dd>';

                // 관리자에게 이메일 전송처리.
                sendMail(usrEmail, compNm, content);

                // 안내 페이지로 이동.
                res.render('./pay/announce', {'orderNo' : orderNo, 'rList' : retList, 'payPrice': totalPrice, 'session': ss});
            }
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


// login 폼 호출.
router.post('/old', function(req, res) {
    console.log('routes 결제 호출.');
    var ss = req.session;
    var usrNo = ss.usrNo !=null ? ss.usrNo : "";
    //console.log(">>>> usrNo = " + usrNo);

    var today = new Date();
    var year = today.getFullYear().toString();
    var month = today.getMonth()+1;
    if(month<10) {
        month = '0' + month;
    }
    var cDate = year + "" + month;
    var orderNo = "PN" + cDate + randomString(6,"N");

console.log('req.body : [ ' + JSON.stringify(req.body) + ' ]\n');

    var gPayNo = ""; var usedSrvcPayNo = "";
    var option1PlusMonth = []; var option2PlusMonth = []; var option3PlusMonth = [];
    var opt1RemainDays = []; var opt2RemainDays = []; var opt3RemainDays = [];
    var payType = req.body.payType !=null ? req.body.payType : ''; // 결제타입 (1:신용카드,2:이체,3:모바일소액결제)
    var productCnt = req.body.productCnt != null ? parseInt(req.body.productCnt) : 0;
    var totalPrice = req.body.totalPayPrice != null ? parseInt(req.body.totalPayPrice) : 0;
    var taxInvoiceYn = req.body.taxInvoiceYn != null ? req.body.taxInvoiceYn : ''; // 전자계산서 발행 요청여부.
    var payMethod = req.body.payMethod != null ? req.body.payMethod : '';
//console.log('pNo : ', pNo);
//console.log('payType : ', payType);
//console.log('payMethod : ', payMethod);
//console.log('productCnt : ', productCnt);
//console.log('taxInvoiceYn : ', taxInvoiceYn);
//console.log('totalPrice : ', totalPrice);

    var arrOpt1No = [];
    var arrOpt1Name = [];
    var arrOpt1Price = [];
    var arrOpt1Gigan = [];
    var arrOpt1PayPrice = [];

    var arrOpt2No = [];
    var arrOpt2Name = [];
    var arrOpt2Price = [];
    var arrOpt2Gigan = [];
    var arrOpt2PayPrice = [];

    var arrOpt3No = [];
    var arrOpt3Name = [];
    var arrOpt3Price = [];
    var arrOpt3Gigan = [];
    var arrOpt3PayPrice = [];

    var arrOpt1To = [];
    var arrOpt2To = [];
    var arrOpt3To = [];

    var paramBaseServiceYn = [];
    var paramBaseServiceRemainDays = [];
    var paramPno = [];
    var paramPname = [];
    var paramPprice = [];
    var paramPayDateType = [];
    var paramOpt1UseYn = [];
    var paramOpt2UseYn = [];
    var paramOpt3UseYn = [];
    var paramOpt4UseYn = [];
    var paramOpt5UseYn = [];
    var paramPayPrice = [];
    var paramPdcPrice = [];
    var paramUseMonthCnt = [];
    var paramOptionCnt = [];
    var paramServiceUseType = [];
    var paramUsedSrvcPayNo = [];
    var paramSrvcSumPrice = [];
    var paramOpt1PlusMonth = [];
    var paramOpt2PlusMonth = [];
    var paramOpt3PlusMonth = [];
    var paramOpt1RemainDays = [];
    var paramOpt2RemainDays = [];
    var paramOpt3RemainDays = [];
    var toDt; var gOptionCnt; var gPno; var gOpt1UseYn; var gOpt2UseYn; var gOpt3UseYn; var gPayPrice;
    var gOpt1No; var gOpt1Name; var gOpt1Price; var gOpt1Gigan; var gOpt1PayPrice; var gOpt1To;
    var gOpt2No; var gOpt2Name; var gOpt2Price; var gOpt2Gigan; var gOpt2PayPrice; var gOpt2To;
    var gOpt3No; var gOpt3Name; var gOpt3Price; var gOpt3Gigan; var gOpt3PayPrice; var gOpt3To;

    var pNo = req.body['pNo'] != null ? req.body['pNo'] : '';
    var pName = req.body['rSrvcName'] !=null ? req.body['rSrvcName'] : '';
    var pPrice = req.body['pPrice'] !=null ? req.body['pPrice'] : '';
    var payDateType = req.body['payDateType'] !=null ? req.body['payDateType'] : '';
    var opt1UseYn = req.body['opt1UseYn'] != null ? req.body['opt1UseYn'] : '';
    var opt2UseYn = req.body['opt2UseYn'] != null ? req.body['opt2UseYn'] : '';
    var opt3UseYn = req.body['opt3UseYn'] != null ? req.body['opt3UseYn'] : '';
    var opt4UseYn = req.body['opt4UseYn'] != null ? req.body['opt4UseYn'] : '';
    var opt5UseYn = req.body['opt5UseYn'] != null ? req.body['opt5UseYn'] : '';
    var payPrice = req.body['payPrice'] !=null ? req.body['payPrice'] : '';
    var pDcPrice = req.body['pDcPrice'] !=null ? req.body['pDcPrice'] : '';
    var useMonthCnt = req.body['useMonthCnt'] !=null ? req.body['useMonthCnt'] : '';
    var optionCnt = req.body['optionCnt'] !=null ? req.body['optionCnt'] : 0;
    var serviceUseType = req.body['serviceUseType'] !=null ? req.body['serviceUseType'] : '';
    var usedSrvcPayNo = req.body['usedSrvcPayNo'] !=null ? req.body['usedSrvcPayNo'] : '';
    var srvcSumPrice = req.body['srvcSumPrice'] !=null ? req.body['srvcSumPrice'] : '';
    var baseServiceYn = req.body['baseServiceYn'] !=null ? req.body['baseServiceYn'] : '';
    var baseSrvcRemainDays = req.body['baseSrvcDays'] !=null ? req.body['baseSrvcDays'] : '';

    option1PlusMonth = req.body['option1PlusMonth'] !=null ? req.body['option1PlusMonth'] : '';
    option2PlusMonth = req.body['option2PlusMonth'] !=null ? req.body['option2PlusMonth'] : '';
    option3PlusMonth = req.body['option3PlusMonth'] !=null ? req.body['option3PlusMonth'] : '';
    opt1RemainDays = req.body['opt1RemainDays'] !=null ? req.body['opt1RemainDays'] : '';
    opt2RemainDays = req.body['opt2RemainDays'] !=null ? req.body['opt2RemainDays'] : '';
    opt3RemainDays = req.body['opt3RemainDays'] !=null ? req.body['opt3RemainDays'] : '';

//console.log('pNo.length : ', pNo.length);
    for(var z = 0; z < pNo.length; z++) {

        (function() {
            var idx = z;

        paramPno[idx] = pNo[idx] != null ? pNo[idx] : '';
        paramPname[idx] = pName[idx] != null ? pName[idx] : '';
        paramPprice[idx] = pPrice[idx] != null ? pPrice[idx] : '';
        paramPayDateType[idx] = payDateType[idx] != null ? payDateType[idx] : '';
        paramOpt1UseYn[idx] = opt1UseYn[idx] != null ? opt1UseYn[idx] : '';
        paramOpt2UseYn[idx] = opt2UseYn[idx] != null ? opt2UseYn[idx] : '';
        paramOpt3UseYn[idx] = opt3UseYn[idx] != null ? opt3UseYn[idx] : '';
        paramOpt4UseYn[idx] = opt4UseYn[idx] != null ? opt4UseYn[idx] : '';
        paramOpt5UseYn[idx] = opt5UseYn[idx] != null ? opt5UseYn[idx] : '';
        paramPayPrice[idx] = payPrice[idx] != null ? payPrice[idx] : 0;
        paramPdcPrice[idx] = pDcPrice[idx] != null ? pDcPrice[idx] : 0;
        paramUseMonthCnt[idx] = useMonthCnt[idx] != null ? useMonthCnt[idx] : 0;
        paramOptionCnt[idx] = optionCnt[idx] != null ? parseInt(optionCnt[idx]) : 0;
        paramServiceUseType[idx] = serviceUseType[idx] !=null ? serviceUseType[idx] : '';
        paramUsedSrvcPayNo[idx] =  usedSrvcPayNo[idx] !=null ? usedSrvcPayNo[idx] : '';
        paramSrvcSumPrice[idx] = srvcSumPrice[idx] !=null ? srvcSumPrice[idx] : 0;
        paramOpt1PlusMonth[idx] = option1PlusMonth[idx] !=null ? option1PlusMonth[idx] : 0;
        paramOpt2PlusMonth[idx] = option2PlusMonth[idx] !=null ? option2PlusMonth[idx] : 0;
        paramOpt3PlusMonth[idx] = option3PlusMonth[idx] !=null ? option3PlusMonth[idx] : 0;
        paramOpt1RemainDays[idx] = opt1RemainDays[idx] !=null ? opt1RemainDays[idx] : 0;
        paramOpt2RemainDays[idx] = opt2RemainDays[idx] !=null ? opt2RemainDays[idx] : 0;
        paramOpt3RemainDays[idx] = opt3RemainDays[idx] !=null ? opt3RemainDays[idx] : 0;
        paramBaseServiceYn[idx] = baseServiceYn[idx] !=null ? baseServiceYn[idx] : '';
        paramBaseServiceRemainDays[idx] = baseSrvcRemainDays[idx] !=null ? baseSrvcRemainDays[idx] : 0;
        toDt = dateAdd(paramUseMonthCnt[idx], '-');
/*
console.log('paramPno : ', paramPno[idx]);
console.log('paramPname : ', paramPname[idx]);
console.log('paramPprice : ', paramPprice[idx]);
console.log('paramPayDateType : ', paramPayDateType[idx]);
console.log('paramOpt1UseYn : ', paramOpt1UseYn[idx]);
console.log('paramOpt2UseYn : ', paramOpt2UseYn[idx]);
console.log('paramOpt3UseYn : ', paramOpt3UseYn[idx]);
console.log('paramOpt4UseYn : ', paramOpt4UseYn[idx]);
console.log('paramOpt5UseYn : ', paramOpt5UseYn[idx]);
console.log('paramPayPrice : ', paramPayPrice[idx]);
console.log('paramPdcPrice : ', paramPdcPrice[idx]);
console.log('paramUseMonthCnt : ', paramUseMonthCnt[idx]);
console.log('paramOptionCnt : ', paramOptionCnt[idx]);
console.log('paramServiceUseType : ', paramServiceUseType[idx]);
console.log('paramUsedSrvcPayNo : ', paramUsedSrvcPayNo[idx]);
console.log('paramSrvcSumPrice : ', paramSrvcSumPrice[idx]);
console.log('paramOpt1PlusMonth : ', paramOpt1PlusMonth[idx]);
console.log('paramOpt2PlusMonth : ', paramOpt2PlusMonth[idx]);
console.log('paramOpt3PlusMonth : ', paramOpt3PlusMonth[idx]);
console.log('paramOpt1RemainDays : ', paramOpt1RemainDays[idx]);
console.log('paramOpt2RemainDays : ', paramOpt2RemainDays[idx]);
console.log('paramOpt3RemainDays : ', paramOpt3RemainDays[idx]);
console.log('paramBaseServiceYn : ', paramBaseServiceYn[idx]);
console.log('paramBaseServiceRemainDays : ', paramBaseServiceRemainDays[idx]);
console.log('toDt : ', toDt);
*/
        paramOpt1UseYn[idx] = paramOpt1UseYn[idx] != 'undefined' ? paramOpt1UseYn[idx] : '';
        paramOpt2UseYn[idx] = paramOpt2UseYn[idx] != 'undefined' ? paramOpt2UseYn[idx] : '';
        paramOpt3UseYn[idx] = paramOpt3UseYn[idx] != 'undefined' ? paramOpt3UseYn[idx] : '';
        paramOpt4UseYn[idx] = paramOpt4UseYn[idx] != 'undefined' ? paramOpt4UseYn[idx] : '';
        paramOpt5UseYn[idx] = paramOpt5UseYn[idx] != 'undefined' ? paramOpt5UseYn[idx] : '';

        // 옵션 파라미터 취득.
        var arrOpt1UseYn = req.body['opt1UseYn'] !=null ? req.body['opt1UseYn'] : '';
        var arrOpt2UseYn = req.body['opt2UseYn'] !=null ? req.body['opt2UseYn'] : '';
        var arrOpt3UseYn = req.body['opt3UseYn'] !=null ? req.body['opt3UseYn'] : '';
//console.log('arrOpt1UseYn : ', arrOpt1UseYn[idx]);
//console.log('arrOpt2UseYn : ', arrOpt2UseYn[idx]);
//console.log('arrOpt3UseYn : ', arrOpt3UseYn[idx]);
        if (arrOpt1UseYn[idx] == "Y") {
            var arrayOpt1No = req.body['opt1No'] != null ? req.body['opt1No'] : '';
            var arrayOpt1Name = req.body['opt1Name'] != null ? req.body['opt1Name'] : '';
            var arrayOpt1Price = req.body['opt1Price'] != null ? req.body['opt1Price'] : '';
            var arrayOpt1Gigan = req.body['opt1Gigan'] != null ? req.body['opt1Gigan'] : '';
            var arrayOpt1PayPrice = req.body['opt1PayPrice'] != null ? req.body['opt1PayPrice'] : '';
            var arryOpt1Gigan = arrayOpt1Gigan[idx] != null ? arrayOpt1Gigan[idx] : 0;
//console.log('arryOpt1Gigan length : ', arryOpt1Gigan.length);

            if (paramOpt1RemainDays[idx] > 0 && arrayOpt1Gigan[idx] == '1' && arrayOpt1No[idx] == 'op1') {
                var arrGigan1 = parseInt(arryOpt1Gigan[idx]) + parseInt(paramOpt1PlusMonth[idx]);
console.log('arrGigan1 : ', arrGigan1);
                arrOpt1To[idx] = dateAdd(arrGigan1, '-');
console.log('1. arrOpt1To[idx] : ', arrOpt1To[idx]);
            } else {
                arrOpt1To[idx] = dateAdd(arryOpt1Gigan, '-');
console.log('2. arrOpt1To[idx] : ', arrOpt1To[idx]);
            }
            arrOpt1No[idx] = arrayOpt1No[idx] != null ? arrayOpt1No[idx] : '';
            arrOpt1Name[idx] = arrayOpt1Name[idx] != null ? arrayOpt1Name[idx] : '';
            arrOpt1Price[idx] = arrayOpt1Price[idx] != null ? parseInt(arrayOpt1Price[idx]) : 0;
            arrOpt1Gigan[idx] = arrayOpt1Gigan[idx] != null ? arrayOpt1Gigan[idx] : '';
            arrOpt1PayPrice[idx] = arrayOpt1PayPrice[idx] != null ? parseInt(arrayOpt1PayPrice[idx]) : 0;
            arrOpt1To[idx] = arrOpt1To[idx] != null ? arrOpt1To[idx] : '';

            console.log("arrOpt1No[" + idx + "] : ", arrOpt1No[idx]);
            console.log("arrOpt1Name[" + idx + "] : ", arrOpt1Name[idx]);
            console.log("arrOpt1Price[" + idx + "] : ", arrOpt1Price[idx]);
            console.log("arrOpt1Gigan[" + idx + "] : ", arrOpt1Gigan[idx]);
            console.log("arrOpt1PayPrice[" + idx + "] : ", arrOpt1PayPrice[idx]);
            console.log("arrOpt1To[" + idx + "] : ", arrOpt1To[idx]);

        }
        if (arrOpt2UseYn[idx] == "Y") {
            var arrayOpt2No = req.body['opt2No'] != null ? req.body['opt2No'] : '';
            var arrayOpt2Name = req.body['opt2Name'] != null ? req.body['opt2Name'] : '';
            var arrayOpt2Price = req.body['opt2Price'] != null ? req.body['opt2Price'] : '';
            var arrayOpt2Gigan = req.body['opt2Gigan'] != null ? req.body['opt2Gigan'] : '';
            var arrayOpt2PayPrice = req.body['opt2PayPrice'] != null ? req.body['opt2PayPrice'] : '';
            var arryOpt2Gigan = arrayOpt2Gigan[idx] != null ? arrayOpt2Gigan[idx] : 0;

            if (paramOpt2RemainDays[idx] > 0 && arrayOpt2Gigan[idx] == '1'  && arrayOpt2No[idx] == 'op2') {
                var arrGigan2 = parseInt(arryOpt2Gigan[idx]) + parseInt(paramOpt2PlusMonth[idx]);
console.log('arrGigan2 : ', arrGigan2);
                arrOpt2To[idx] = dateAdd(arrGigan2, '-');
console.log('1. arrOpt2To[idx] : ', arrOpt1To[idx]);
            } else {
                arrOpt2To[idx] = dateAdd(arryOpt2Gigan, '-');
console.log('2. arrOpt2To[idx] : ', arrOpt1To[idx]);
            }

            arrOpt2No[idx] = arrayOpt2No[idx] != null ? arrayOpt2No[idx] : '';
            arrOpt2Name[idx] = arrayOpt2Name[idx] != null ? arrayOpt2Name[idx] : '';
            arrOpt2Price[idx] = arrayOpt2Price[idx] != null ? parseInt(arrayOpt2Price[idx]) : 0;
            arrOpt2Gigan[idx] = arrayOpt2Gigan[idx] != null ? arrayOpt2Gigan[idx] : '';
            arrOpt2PayPrice[idx] = arrayOpt2PayPrice[idx] != null ? parseInt(arrayOpt2PayPrice[idx]) : 0;
            arrOpt2To[idx] = arrOpt2To[idx] != null ? arrOpt2To[idx] : '';

            console.log("arrOpt2No[" + idx + "] : ", arrOpt2No[idx]);
            console.log("arrOpt2Name[" + idx + "] : ", arrOpt2Name[idx]);
            console.log("arrOpt2Price[" + idx + "] : ", arrOpt2Price[idx]);
            console.log("arrOpt2Gigan[" + idx + "] : ", arrOpt2Gigan[idx]);
            console.log("arrOpt2PayPrice[" + idx + "] : ", arrOpt2PayPrice[idx]);
            console.log("arrOpt2To[" + idx + "] : ", arrOpt2To[idx]);

        }
        if (arrOpt3UseYn[idx] == "Y") {
            var arrayOpt3No = req.body['opt3No'] != null ? req.body['opt3No'] : '';
            var arrayOpt3Name = req.body['opt3Name'] != null ? req.body['opt3Name'] : '';
            var arrayOpt3Price = req.body['opt3Price'] != null ? req.body['opt3Price'] : '';
            var arrayOpt3Gigan = req.body['opt3Gigan'] != null ? req.body['opt3Gigan'] : '';
            var arrayOpt3PayPrice = req.body['opt3PayPrice'] != null ? req.body['opt3PayPrice'] : '';
            var arryOpt3Gigan = arrayOpt3Gigan[idx] != null ? arrayOpt3Gigan[idx] : 0;

            if (paramOpt3RemainDays[idx] > 0 && arrayOpt3Gigan[idx] == '1' &&  arrayOpt3No[idx] == 'op3') {
                var arrGigan3 = parseInt(arryOpt3Gigan[idx]) + parseInt(paramOpt3PlusMonth[idx]);
                arrOpt3To[idx] = dateAdd(arrGigan3, '-');
            } else {
                arrOpt3To[idx] = dateAdd(arryOpt3Gigan, '-');
            }

            arrOpt3No[idx] = arrayOpt3No[idx] != null ? arrayOpt3No[idx] : '';
            arrOpt3Name[idx] = arrayOpt3Name[idx] != null ? arrayOpt3Name[idx] : '';
            arrOpt3Price[idx] = arrayOpt3Price[idx] != null ? parseInt(arrayOpt3Price[idx]) : 0;
            arrOpt3Gigan[idx] = arrayOpt3Gigan[idx] != null ? arrayOpt3Gigan[idx] : '';
            arrOpt3PayPrice[idx] = arrayOpt3PayPrice[idx] != null ? parseInt(arrayOpt3PayPrice[idx]) : 0;
            arrOpt3To[idx] = arrOpt3To[idx] != null ? arrOpt3To[idx] : '';
            /*
             console.log("arrayOpt3No[" + idx + "] : ", arrayOpt3No[idx]);
             console.log("arrayOpt3Name[" + idx + "] : ", arrayOpt3Name[idx]);
             console.log("arrayOpt3Price[" + idx + "] : ", arrayOpt3Price[idx]);
             console.log("arrayOpt3Gigan[" + idx + "] : ", arrayOpt3Gigan[idx]);
             console.log("arrayOpt3PayPrice[" + idx + "] : ", arrayOpt3PayPrice[idx]);
             console.log("arrOpt3To[" + idx + "] : ", arrOpt3To[idx]);
             */
            console.log("arrOpt3No[" + idx + "] : ", arrOpt3No[idx]);
            console.log("arrOpt3Name[" + idx + "] : ", arrOpt3Name[idx]);
            console.log("arrOpt3Price[" + idx + "] : ", arrOpt3Price[idx]);
            console.log("arrOpt3Gigan[" + idx + "] : ", arrOpt3Gigan[idx]);
            console.log("arrOpt3PayPrice[" + idx + "] : ", arrOpt3PayPrice[idx]);
            console.log("arrOpt3To[" + idx + "] : ", arrOpt3To[idx]);
        }
        // 저장 처리.
        async.waterfall([
            function(callback){
                // Global 변수 선언.
                gOptionCnt = paramOptionCnt[idx];
                gPayPrice = paramPayPrice[idx];
                gPno = paramPno[idx];
                gOpt1UseYn = arrOpt1UseYn[idx];
                gOpt2UseYn = arrOpt2UseYn[idx];
                gOpt3UseYn = arrOpt3UseYn[idx];
                gOpt1No = arrOpt1No[idx];
                gOpt1Name = arrOpt1Name[idx];
                gOpt1Price = arrOpt1Price[idx];
                gOpt1Gigan = arrOpt1Gigan[idx];
                gOpt1PayPrice = arrOpt1PayPrice[idx];
                gOpt1To = arrOpt1To[idx];
                gOpt2No = arrOpt2No[idx];
                gOpt2Name = arrOpt2Name[idx];
                gOpt2Price = arrOpt2Price[idx];
                gOpt2Gigan = arrOpt2Gigan[idx];
                gOpt2PayPrice = arrOpt2PayPrice[idx];
                gOpt2To = arrOpt2To[idx];
                gOpt3No = arrOpt3No[idx];
                gOpt3Name = arrOpt3Name[idx];
                gOpt3Price = arrOpt3Price[idx];
                gOpt3Gigan = arrOpt3Gigan[idx];
                gOpt3PayPrice = arrOpt3PayPrice[idx];
                gOpt3To = arrOpt3To[idx];


                // 서비스가 신규인 경우.
                if(serviceUseType[idx]!=null&&serviceUseType[idx]=="NEW") {

                    // 결제 테이블에 저장하기 처리.
//console.log('신규 결제 테이블 저장처리1 ['+idx+']');
                    var conn = mysql.createConnection(config);
                    conn.connect();
                    conn.query('INSERT INTO pay_inf_tbl(c_no, c_id, pno, pname, pprice, pdc_price, from_dt, to_dt, pay_date_type, use_month_cnt, opt_use_cnt,'
                        + ' opt1_use_yn, opt2_use_yn, opt3_use_yn, opt4_use_yn, opt5_use_yn, pay_price, total_pay_price, pay_method, pay_date, pay_result, tax_invoice_req_yn, expire_yn, insert_dt, insert_usr,'
                        + ' update_dt, update_usr) VALUES(?, ?, ?, ?, ?, ?, now(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), "wait", ?, "Y", now(), ?, now(), ?);'
                        + ' SELECT MAX(pay_no) as payNo FROM pay_inf_tbl WHERE c_no = ? AND pno = ? AND pay_result = "wait" AND expire_yn = "Y";',
                        [
                            ss.usrNo, ss.usrId, paramPno[idx], paramPname[idx], paramPprice[idx], paramPdcPrice[idx], toDt, paramPayDateType[idx], paramUseMonthCnt[idx], paramOptionCnt[idx],
                            paramOpt1UseYn[idx], paramOpt2UseYn[idx], paramOpt3UseYn[idx], paramOpt4UseYn[idx], paramOpt5UseYn[idx],
                            paramPayPrice[idx], paramPayPrice[idx], payType, taxInvoiceYn, ss.usrId, ss.usrId, ss.usrNo, paramPno[idx]
                        ],
                        function (err2, results2) {
                            if (err2) {
                                console.log(err2);
                            } else {
                                console.dir(results2);
                                console.log('results.payNo : ', results2[1][0].payNo);
                                var retPayNo = results2[1][0].payNo;
                                global.gPayNo = retPayNo;
                                callback(null, global.gPayNo, '');
                            }
                        }
                    );
                    conn.commit();
                    conn.end();
                } else {
//console.log('>>> PLUS 추가 서비스 실행 <<< \n');
                    // 재연장서비스인 경우.
                    var pCno = "";
                    var pCid = "";
                    var pPno = "";
                    var pPname = "";
                    var pPprice = 0;
                    var pPdcPrice = 0;
                    var pFromDt = "";
                    var pToDt = "";
                    var pPayDateType = "";
                    var pUseMonthCnt = 0;
                    var pOptUseCnt = 0;
                    var pOpt1UseYn = "Y";
                    var pOpt2UseYn = "";
                    var pOpt3UseYn = "";
                    var pOpt4UseYn = "";
                    var pOpt5UseYn = "";
                    var pPayPrice = 0;
                    var pPayMethod = "";
                    var pPayDate = "";
                    var pTaxInvoiceReqYn = "";

                    // 기존 데이타 서비스 데이타 조회해서 저장.

                    var conn = mysql.createConnection(config);
                    conn.connect();
                    conn.query('SELECT c_no as cNo, c_id as cId, pno as pno, pname as pname, pprice as pprice, pdc_price as pdcPrice,'
                        + ' from_dt as fromDt, to_dt as toDt, pay_date_type as payDateType, use_month_cnt as useMonthCnt,'
                        + ' opt_use_cnt as optUseCnt, opt1_use_yn as opt1UseYn, opt2_use_yn as opt2UseYn, opt3_use_yn as opt3UseYn,'
                        + ' opt4_use_yn as opt4UseYn, opt5_use_yn as opt5UseYn, pay_price as payPrice, pay_method as payMethod, pay_date as payDate,'
                        + ' pay_result as payResult, tax_invoice_req_yn as taxInvoiceReqYn, expire_yn as expireYn FROM pay_inf_tbl WHERE pay_no = ?',
                        [paramUsedSrvcPayNo[idx]],
                        function (err5, results5) {
                            if (err5) {
                                console.log('err5 : ', err5);
                            } else {
                                if(results5.length > 0) {
                                    pCno = results5[0].cNo;
                                    pCid = results5[0].cId;
                                    pPno = results5[0].pno;
                                    pPname = results5[0].pname;
                                    pPprice = results5[0].pprice;
                                    pPdcPrice = results5[0].pdcPrice;
                                    pFromDt = results5[0].fromDt;
                                    pToDt = results5[0].toDt;
                                    pPayDateType = results5[0].payDateType;
                                    pUseMonthCnt = results5[0].useMonthCnt;
                                    pOptUseCnt = results5[0].optUseCnt !=null ? results5[0].optUseCnt : 0;
//console.log('pOptUseCnt : ', pOptUseCnt);
                                    //paramOptionCnt = parseInt(paramOptionCnt) + parseInt(pOptUseCnt);
                                    paramOptionCnt[idx] = parseInt(paramOptionCnt[idx]);

                                    if (paramOpt1UseYn[idx] == "Y") {
                                        pOpt1UseYn = "Y";
                                    } else {
                                        pOpt1UseYn = results5[0].opt1UseYn;
                                    }
                                    if (paramOpt2UseYn[idx] == "Y") {
                                        pOpt2UseYn = "Y";
                                    } else {
                                        pOpt2UseYn = results5[0].opt2UseYn;
                                    }
                                    if (paramOpt3UseYn[idx] == "Y") {
                                        pOpt3UseYn = "Y";
                                    } else {
                                        pOpt3UseYn = results5[0].opt3UseYn;
                                    }
                                    if (paramOpt4UseYn[idx] == "Y") {
                                        pOpt4UseYn = "Y";
                                    } else {
                                        pOpt4UseYn = results5[0].opt4UseYn;
                                    }
                                    if (paramOpt5UseYn[idx] == "Y") {
                                        pOpt5UseYn = "Y";
                                    } else {
                                        pOpt5UseYn = results5[0].opt5UseYn;
                                    }
                                    pPayPrice = results5[0].payPrice;
                                    pPayMethod = results5[0].payMethod;
                                    pPayDate = results5[0].payDate;
                                    //var pPayResult = results5[0].payResult;
                                    pTaxInvoiceReqYn = results5[0].taxInvoiceReqYn;
                                    //callback(null, results5[0]);
                                    // 1년 저장 처리.
                                    if(paramUseMonthCnt[idx] == 12) {
//console.log('결제 테이블 저장처리2');
//console.log('>>> 12');
//console.log('>>> paramOptionCnt[idx] : ', paramOptionCnt[idx]);
//console.log('>>> paramUseMonthCnt[idx] : ', paramUseMonthCnt[idx]);
                                        if(paramPdcPrice[idx] != null && paramPdcPrice[idx] != '') {
//console.log('paramPdcPrice['+idx+'] : ', paramPdcPrice[idx] + '\n');
                                            if(paramPdcPrice[idx] != "0") {
                                                pPdcPrice = paramPdcPrice[idx];
                                            }
//console.log('pPdcPrice['+idx+']', pPdcPrice + "\n");
                                        }

                                        var conn = mysql.createConnection(config);
                                        conn.connect();
                                        conn.query('INSERT INTO pay_inf_tbl(c_no, c_id, pno, pname, pprice, pdc_price, from_dt, to_dt, pay_date_type, use_month_cnt, opt_use_cnt,'
                                            + ' opt1_use_yn, opt2_use_yn, opt3_use_yn, opt4_use_yn, opt5_use_yn, pay_price, total_pay_price, pay_method, pay_date, pay_result, tax_invoice_req_yn, expire_yn, insert_dt, insert_usr,'
                                            + ' update_dt, update_usr) VALUES(?, ?, ?, ?, ?, ?, now(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "wait", ?, "Y", now(), ?, now(), ?);'
                                            + ' SELECT LAST_INSERT_ID() as payNo;',
                                            [
                                                pCno, pCid, pPno, pPname, pPprice, pPdcPrice, toDt, pPayDateType, paramUseMonthCnt[idx], paramOptionCnt[idx],
                                                pOpt1UseYn, pOpt2UseYn, pOpt3UseYn, pOpt4UseYn, pOpt5UseYn,
                                                pPayPrice, paramPayPrice[idx], pPayMethod, pPayDate, pTaxInvoiceReqYn, ss.usrId, ss.usrId
                                            ],
                                            function (err6, results6) {
                                                if (err6) {
                                                    console.log(err6);
                                                }
                                                console.dir(results6);
//console.log('results.payNo : ', results6[1].payNo);
//console.log('results.payNo - : ', JSON.stringify(results6));
                                                var addSQL1 = ""; var addSQL2 = ""; var addSQL3 = "";
                                                var retPayNo = results6[1][0].payNo;
                                                //console.log('>>> get2 retPayNo : ', retPayNo);
                                                //console.log('LAST_INSERT_ID : ', results7[1].LAST_INSERT_ID);
                                                console.log('>>> get2 retPayNo : ', retPayNo);
                                                global.gPayNo = retPayNo;
                                                // arg1는 '하나'고, arg2는 '둘'이다.
                                                callback(null, global.gPayNo, pToDt);
                                                console.log('>>> INSERT global.gPayNo : ', global.gPayNo);
//console.log(' sOptUseCnt paramOptionCnt[idx] : ', paramOptionCnt[idx] + '\n');
                                                var sOptUseCnt = 0;
//console.log('sOptUseCnt init : ', sOptUseCnt + '\n');
                                                var sOptCnt = 0;
                                                if(arrOpt1UseYn[idx] == "Y") {
                                                    addSQL1 = 'opt1_use_yn = "Y", ';
                                                    sOptCnt += 1;
                                                }
                                                if(arrOpt2UseYn[idx] == "Y") {
                                                    addSQL2 = 'opt2_use_yn = "Y", ';
                                                    sOptCnt += 1;
                                                }
                                                if(arrOpt3UseYn[idx] == "Y") {
                                                    addSQL3 = 'opt3_use_yn = "Y", ';
                                                    sOptCnt += 1;
                                                }
                                                if(sOptCnt == 3) {
                                                    sOptUseCnt = sOptCnt;
//console.log('sOptUseCnt 3 : ', sOptUseCnt + '\n');
                                                } else {
//console.log('sOptUseCnt else : ', sOptUseCnt + '\n');
                                                    sOptUseCnt = pOptUseCnt + paramOptionCnt[idx];
                                                }

                                            if(paramBaseServiceYn[idx] == 'Y' && paramBaseServiceRemainDays[idx] <= 0 || paramBaseServiceRemainDays[idx] <= 30) {
//console.log('-0----------> 1 \n');
                                                // 결제테이블 업데이트 처리.
                                                var conn = mysql.createConnection(config);
                                                conn.connect();
                                                conn.query('UPDATE pay_inf_tbl SET pdc_price = ?, pay_date_type = ?, from_dt = now(), to_dt = ?, use_month_cnt = ?, opt_use_cnt = ?,'
                                                    + addSQL1 + addSQL2 + addSQL3
                                                    + ' pay_price = ?, pay_method = ?, pay_date = now(), tax_invoice_yn = ?,'
                                                    + ' total_pay_price = ? WHERE pay_no = ?',
                                                    [
                                                        pPdcPrice, paramPayDateType[idx], toDt, paramUseMonthCnt[idx], sOptUseCnt,
                                                        paramPayPrice[idx], payMethod, taxInvoiceYn, paramSrvcSumPrice[idx], retPayNo
                                                    ],
                                                    function (err, results) {
                                                        if (err) {
                                                            console.log('err : ', err);
                                                        } else {
                                                            console.dir(results);
                                                        }
                                                    });
                                                conn.commit();
                                                conn.end();
                                            } else {
//console.log('-0----------> 2 \n');
                                                // 결제테이블 업데이트 처리.
                                                var conn = mysql.createConnection(config);
                                                conn.connect();
                                                conn.query('UPDATE pay_inf_tbl SET pdc_price = ?, pay_date_type = ?, from_dt = ?, to_dt = ?, use_month_cnt = ?, opt_use_cnt = ?,'
                                                    + addSQL1 + addSQL2 + addSQL3
                                                    + ' pay_price = ?, pay_method = ?, pay_date = now(), tax_invoice_yn = ?,'
                                                    + ' total_pay_price = ? WHERE pay_no = ?',
                                                    [
                                                        pPdcPrice, paramPayDateType[idx], pFromDt, pToDt, paramUseMonthCnt[idx], sOptUseCnt,
                                                        paramPayPrice[idx], payMethod, taxInvoiceYn, paramSrvcSumPrice[idx], retPayNo
                                                    ],
                                                    function (err, results) {
                                                        if (err) {
                                                            console.log('err : ', err);
                                                        } else {
                                                            console.dir(results);
                                                        }
                                                    });
                                                conn.commit();
                                                conn.end();
                                            }


                                            }
                                        );
                                        conn.commit();
                                        conn.end();
                                    // 1개월 저장 처리.
                                    } else if(paramUseMonthCnt[idx] == 1) {
//console.log('결제 테이블 저장처리2-1 \n');
//console.log('>>> 1 <<<');
                                        var conn = mysql.createConnection(config);
                                        conn.connect();
                                        conn.query('INSERT INTO pay_inf_tbl(c_no, c_id, pno, pname, pprice, pdc_price, from_dt, to_dt, pay_date_type, use_month_cnt, opt_use_cnt,'
                                            + ' opt1_use_yn, opt2_use_yn, opt3_use_yn, opt4_use_yn, opt5_use_yn, pay_price, total_pay_price, pay_method, pay_date, pay_result, tax_invoice_req_yn, expire_yn, insert_dt, insert_usr,'
                                            + ' update_dt, update_usr) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "wait", ?, "Y", now(), ?, now(), ?);'
                                            + ' SELECT LAST_INSERT_ID() as payNo;',
                                            [
                                                pCno, pCid, pPno, pPname, pPprice, pPdcPrice, pFromDt, pToDt, pPayDateType, pUseMonthCnt, paramOptionCnt[idx],
                                                pOpt1UseYn, pOpt2UseYn, pOpt3UseYn, pOpt4UseYn, pOpt5UseYn,
                                                pPayPrice, paramPayPrice[idx], pPayMethod, pPayDate, pTaxInvoiceReqYn, ss.usrId, ss.usrId
                                            ],
                                            function (err6, results6) {
                                                if (err6) {
                                                    console.log(err6);
                                                }
                                                console.dir(results6);
                                                console.log('results.payNo : ', results6[1][0].payNo);
                                                var retPayNo = results6[1][0].payNo;
                                                //console.log('>>> get2 retPayNo : ', retPayNo);
                                                //console.log('LAST_INSERT_ID : ', results7[1].LAST_INSERT_ID);
                                                console.log('>>> get2 retPayNo : ', retPayNo);
                                                global.gPayNo = retPayNo;
                                                // arg1는 '하나'고, arg2는 '둘'이다.
                                                callback(null, global.gPayNo);
                                                console.log('>>> INSERT global.gPayNo : ', global.gPayNo);
                                                var sOptUseCnt = pOptUseCnt + paramOptionCnt[idx];

                                                // 결제테이블 업데이트 처리.
                                                var conn = mysql.createConnection(config);
                                                conn.connect();
                                                conn.query('UPDATE pay_inf_tbl SET pdc_price = ?, pay_date_type = ?, use_month_cnt = ?, opt_use_cnt = ?,'
                                                    + ' pay_price = ?, pay_method = ?, pay_date = now(), tax_invoice_yn = ?,'
                                                    + ' total_pay_price = ? WHERE pay_no = ?',
                                                    [
                                                        pPdcPrice, paramPayDateType[idx], paramUseMonthCnt[idx], sOptUseCnt,
                                                        paramSrvcSumPrice[idx], payMethod, taxInvoiceYn, paramSrvcSumPrice[idx], retPayNo
                                                    ],
                                                    function(err, results) {
                                                        if(err) {
                                                            console.log('err : ', err);
                                                        } else {
                                                            console.dir(results);
                                                        }
                                                    });
                                                conn.commit();
                                                conn.end();


                                            }
                                        );
                                        conn.commit();
                                        conn.end();
                                    }
                                }
                            }
                        });
                    conn.end();

                }
            },
            function(retVal, retVal2, callback) {


//console.log('옵션 저장 준비 ! Option Save Start !!! ['+idx+']');
                if(paramUseMonthCnt[idx] == 12) {
//console.log('사용기간이 12개월인 경우 옵션 저장처리.');
                    var conn = mysql.createConnection(config);
                    conn.connect();
                    // 이전 옵션 업데이트 처리.
                    conn.query('SELECT COUNT(x.pay_no) as cnt, y.opt1_use_yn as opt1UseYn, y.opt2_use_yn as opt2UseYn, y.opt3_use_yn as opt3UseYn'
                        + ' FROM pay_opt_inf_tbl x, pay_inf_tbl y WHERE x.pay_no = y.pay_no AND x.opt_pay_result = "paid"'
                        + ' AND x.opt_expire_yn = "N" AND x.pay_no = ?',
                        [paramUsedSrvcPayNo[idx]],
                        function (err5, results5) {
                            if (err5) {
                                console.log('err20 : ', err5);
                            } else {
                                if (results5[0].cnt > 0) {
                                    // 이전 조회
                                    var conn = mysql.createConnection(config);
                                    conn.connect();
                                    conn.query('INSERT INTO pay_opt_inf_tbl (pay_no, pno, opt_no, opt_name, opt_price, opt_gigan,'
                                        + ' opt_from, opt_to, opt_pay_price, opt_pay_method, opt_pay_date, opt_pay_result,'
                                        + ' opt_expire_yn, opt_refund_yn, opt_refund_price, opt_refund_date, opt_refund_req_yn,'
                                        + ' opt_refund_req_date, insert_dt, insert_usr, update_dt, update_usr)'
                                        + ' SELECT ' + retVal + ', pno, opt_no, opt_name, opt_price, opt_gigan, opt_from, opt_to,'
                                        + ' opt_pay_price, opt_pay_method, opt_pay_date, opt_pay_result,'
                                        + ' opt_expire_yn, opt_refund_yn, opt_refund_price, opt_refund_date, opt_refund_req_yn,'
                                        + ' opt_refund_req_date, insert_dt, insert_usr, update_dt, update_usr'
                                        + ' FROM pay_opt_inf_tbl WHERE opt_pay_result = "paid" AND opt_expire_yn = "N" AND pay_no = ?',
                                        [paramUsedSrvcPayNo[idx]],
                                        function (err6, results6) {
                                            if (err6) {
                                                console.log('err6 : ', err6);
                                            } else {
                                                console.log('>>>>>>>>>>>>>>>>>> result 6 : <<<<<<<<<<<<<<<<<<<<<<<<<');
                                                console.dir(results6);
                                            }
                                        }
                                    );
                                    conn.commit();
                                    conn.end();
                                }
                            }
                        }
                    );
                    conn.end();

                    // OPTION 저장 처리.
                    if (paramOptionCnt[idx] > 0) {

                        if(arrOpt1UseYn[idx] == 'Y') {
//console.log('arrayOpt1No.length : ', arrayOpt1No.length);
                            /*
                                arrOpt1No[idx] = arrOpt1No[idx] != null ? arrOpt1No[idx] : '';
                                arrOpt1Name[idx] = arrayOpt1Name[idx] != null ? arrayOpt1Name[idx] : '';
                                arrOpt1Price[idx] = arrOpt1Price[idx] != null ? parseInt(arrOpt1Price[idx]) : 0;
                                arrOpt1Gigan[idx] = arrOpt1Gigan[idx] != null ? arrOpt1Gigan[idx] : '';
                                arrOpt1PayPrice[idx] = arrOpt1PayPrice[idx] != null ? parseInt(arrOpt1PayPrice[idx]) : 0;
                                arrOpt1To = arrOpt1To[idx] != null ? arrOpt1To[idx] : '';
                            */
                                // 자동 서비스 종료 처리 부분.
                                var conn = mysql.createConnection(config);
                                conn.connect();
                                conn.query('UPDATE pay_opt_inf_tbl SET opt_pay_result = "end", opt_expire_yn = "Y" WHERE pno = ?'
                                    + ' AND opt_no = ? AND pay_no = ?',
                                    [paramPno[idx], arrOpt1No[idx], paramUsedSrvcPayNo[idx]],
                                    function (err5, results5) {
                                        console.log('result5 : ', JSON.stringify(results5));
                                        if (err5) {
                                            console.log('err', err5);
                                        } else {
                                            console.log('>>>>>>>>>>>>> result5 : <<<<<<<<<<<<<<<<<<<<<<');
                                            console.dir(results5);
                                            //callback(null);
                                        }
                                    }
                                );
                                conn.commit();


                            var opt1To;
                            if(option1PlusMonth == 0 && paramOpt1RemainDays[idx] > 0) {
                                opt1To = retVal2;
//console.log('1. opt1To['+idx+'] : ', opt1To + ' \n');
                            } else {
                                opt1To = arrOpt1To[idx];
//console.log('2. opt1To['+idx+'] : ', opt1To + ' \n');
                            }

                                var conn = mysql.createConnection(config);
                                conn.connect();
                                conn.query('INSERT INTO pay_opt_inf_tbl(pay_no, pno, opt_no, opt_name, opt_price, opt_gigan, opt_from, opt_to, opt_pay_price,'
                                    + ' opt_pay_method, opt_pay_date, opt_pay_result, insert_dt, insert_usr, update_dt, update_usr)'
                                    + ' VALUES(?, ?, ?, ?, ?, ?, now(), ?, ?, ?, now(), "wait", now(), ?, now(), ?);',
                                    [retVal, paramPno[idx], arrOpt1No[idx], arrOpt1Name[idx], arrOpt1Price[idx], arrOpt1Gigan[idx], opt1To, arrOpt1PayPrice[idx], payType, ss.usrId, ss.usrId],
                                    function (err3, results3) {
                                        console.log('result3 : ', JSON.stringify(results3));
                                        if (err3) {
                                            console.log('err', err3);
                                        } else {
                                            console.dir(results3);
                                            //callback(null);
                                        }
                                    }
                                );
                                conn.commit();
                                conn.end();
                        }
                        if(arrOpt2UseYn[idx] == 'Y') {
//console.log('arrayOpt2No.length : ', arrayOpt2No.length);
                            /*
                                arrOpt2No[idx] = arrOpt2No[idx] != null ? arrOpt2No[idx] : '';
                                arrOpt2Name[idx] = arrayOpt2Name[idx] != null ? arrayOpt2Name[idx] : '';
                                arrOpt2Price[idx] = arrOpt2Price[idx] != null ? parseInt(arrOpt2Price[idx]) : 0;
                                arrOpt2Gigan[idx] = arrOpt2Gigan[idx] != null ? arrOpt2Gigan[idx] : '';
                                arrOpt2PayPrice[idx] = arrOpt2PayPrice[idx] != null ? parseInt(arrOpt2PayPrice[idx]) : 0;
                                arrOpt2To = arrOpt2To[idx] != null ? arrOpt2To[idx] : '';
                            */
                                // 자동 서비스 종료 처리 부분.
                                var conn = mysql.createConnection(config);
                                conn.connect();
                                conn.query('UPDATE pay_opt_inf_tbl SET opt_pay_result = "end", opt_expire_yn = "Y" WHERE pno = ?'
                                    + ' AND opt_no = ? AND pay_no = ?',
                                    [paramPno[idx], arrOpt2No[idx], paramUsedSrvcPayNo[idx]],
                                    function (err5, results5) {
                                        console.log('result5 : ', JSON.stringify(results5));
                                        if (err5) {
                                            console.log('err', err5);
                                        } else {
                                            console.log('>>>>>>>>>>>>> result5 : <<<<<<<<<<<<<<<<<<<<<<');
                                            console.dir(results5);
                                            //callback(null);
                                        }
                                    }
                                );
                                conn.commit();

                            var opt2To;
                            if(option2PlusMonth[idx] == 0 && paramOpt2RemainDays[idx] > 0) {
                                opt2To = retVal2;
//console.log('1. opt1To['+idx+'] : ', opt2To + ' \n');
                            } else {
                                opt2To = arrOpt2To[idx];
//console.log('2. opt2To['+idx+'] : ', opt2To + ' \n');
                            }

                                var conn = mysql.createConnection(config);
                                conn.connect();
                                conn.query('INSERT INTO pay_opt_inf_tbl(pay_no, pno, opt_no, opt_name, opt_price, opt_gigan, opt_from, opt_to, opt_pay_price,'
                                    + ' opt_pay_method, opt_pay_date, opt_pay_result, insert_dt, insert_usr, update_dt, update_usr)'
                                    + ' VALUES(?, ?, ?, ?, ?, ?, now(), ?, ?, ?, now(), "wait", now(), ?, now(), ?);',
                                    [retVal, paramPno[idx], arrOpt2No[idx], arrOpt2Name[idx], arrOpt2Price[idx], arrOpt2Gigan[idx], opt2To, arrOpt2PayPrice[idx], payType, ss.usrId, ss.usrId],
                                    function (err3, results3) {
                                        console.log('result3 : ', JSON.stringify(results3));
                                        if (err3) {
                                            console.log('err', err3);
                                        } else {
                                            console.dir(results3);
                                            //callback(null);
                                        }
                                    }
                                );
                                conn.commit();
                                conn.end();
                        }
                        if(arrOpt3UseYn[idx] == 'Y') {
//console.log('arrayOpt3No.length : ', arrayOpt3No.length);
                            /*
                                arrOpt3No[idx] = arrOpt3No[idx] != null ? arrOpt3No[idx] : '';
                                arrOpt3Name[idx] = arrayOpt3Name[idx] != null ? arrayOpt3Name[idx] : '';
                                arrOpt3Price[idx] = arrOpt3Price[idx] != null ? parseInt(arrOpt3Price[idx]) : 0;
                                arrOpt3Gigan[idx] = arrOpt3Gigan[idx] != null ? arrOpt3Gigan[idx] : '';
                                arrOpt3PayPrice[idx] = arrOpt3PayPrice[idx] != null ? parseInt(arrOpt3PayPrice[idx]) : 0;
                                arrOpt3To = arrOpt3To[idx] != null ? arrOpt3To[idx] : '';
                            */

                                // 자동 서비스 종료 처리 부분.
                                var conn = mysql.createConnection(config);
                                conn.connect();
                                conn.query('UPDATE pay_opt_inf_tbl SET opt_pay_result = "end", opt_expire_yn = "Y" WHERE pno = ?'
                                    + ' AND opt_no = ? AND pay_no = ?',
                                    [paramPno[idx], arrOpt3No[idx], paramUsedSrvcPayNo[idx]],
                                    function (err5, results5) {
                                        console.log('result5 : ', JSON.stringify(results5));
                                        if (err5) {
                                            console.log('err', err5);
                                        } else {
                                            console.log('>>>>>>>>>>>>> result5 : <<<<<<<<<<<<<<<<<<<<<<');
                                            console.dir(results5);
                                            //callback(null);
                                        }
                                    }
                                );
                                conn.commit();

                            var opt3To;
                            if(option3PlusMonth[idx] == 0 && paramOpt3RemainDays[idx] > 0) {
                                opt3To = retVal2;
//console.log('1. opt3To['+idx+'] : ', opt3To + ' \n');
                            } else {
                                opt3To = arrOpt3To[idx];
//console.log('2. opt3To['+idx+'] : ', opt3To + ' \n');
                            }

                                var conn = mysql.createConnection(config);
                                conn.connect();
                                conn.query('INSERT INTO pay_opt_inf_tbl(pay_no, pno, opt_no, opt_name, opt_price, opt_gigan, opt_from, opt_to, opt_pay_price,'
                                    + ' opt_pay_method, opt_pay_date, opt_pay_result, insert_dt, insert_usr, update_dt, update_usr)'
                                    + ' VALUES(?, ?, ?, ?, ?, ?, now(), ?, ?, ?, now(), "wait", now(), ?, now(), ?);',
                                    [retVal, paramPno[idx], arrOpt3No[idx], arrOpt3Name[idx], arrOpt3Price[idx], arrOpt3Gigan[idx], opt3To, arrOpt3PayPrice[idx], payType, ss.usrId, ss.usrId],
                                    function (err3, results3) {
                                        console.log('result3 : ', JSON.stringify(results3));
                                        if (err3) {
                                            console.log('err', err3);
                                        } else {
                                            console.dir(results3);
                                            //callback(null);
                                        }
                                    }
                                );
                                conn.commit();
                                conn.end();
                        }

                    }
                } else {
//console.log('사용기간이 1개월인 경우 옵션 저장처리. ['+idx+']');
                    var conn = mysql.createConnection(config);
                    conn.connect();
                    // 이전 옵션 업데이트 처리.
                    conn.query('SELECT COUNT(pay_no) as cnt FROM pay_opt_inf_tbl WHERE opt_pay_result = "paid"'
                        + ' AND opt_expire_yn = "N" AND pay_no = ?',
                        [paramUsedSrvcPayNo[idx]],
                        function (err5, results5) {
                            if (err5) {
                                console.log('err20 : ', err);
                            } else {
                                if (results5[0].cnt > 0) {
                                    var conn = mysql.createConnection(config);
                                    conn.connect();
                                    conn.query('INSERT INTO pay_opt_inf_tbl (pay_no, pno, opt_no, opt_name, opt_price, opt_gigan,'
                                        + ' opt_from, opt_to, opt_pay_price, opt_pay_method, opt_pay_date, opt_pay_result,'
                                        + ' opt_expire_yn, opt_refund_yn, opt_refund_price, opt_refund_date, opt_refund_req_yn,'
                                        + ' opt_refund_req_date, insert_dt, insert_usr, update_dt, update_usr)'
                                        + ' SELECT ' + retVal + ', pno, opt_no, opt_name, opt_price, opt_gigan, opt_from, opt_to,'
                                        + ' opt_pay_price, opt_pay_method, opt_pay_date, opt_pay_result,'
                                        + ' opt_expire_yn, opt_refund_yn, opt_refund_price, opt_refund_date, opt_refund_req_yn,'
                                        + ' opt_refund_req_date, insert_dt, insert_usr, update_dt, update_usr'
                                        + ' FROM pay_opt_inf_tbl WHERE opt_pay_result = "paid" AND opt_expire_yn = "N" AND pay_no = ?',
                                        [paramUsedSrvcPayNo[idx]],
                                        function (err6, results6) {
                                            if (err6) {
                                                console.log('err6 : ', err6);
                                            } else {
                                                console.dir(results6);
                                            }
                                        }
                                    );
                                    conn.commit();
                                    conn.end();
                                }
                            }
                        }
                    );
                    conn.end();
                // OPTION 저장 처리.
                if (paramOptionCnt[idx] > 0) {
                    
                    if(arrOpt1UseYn[idx] == 'Y') {
//console.log('arrayOpt1No length : ', arrayOpt1No.length);
                        /*
                            arrOpt1No[idx] = arrOpt1No[idx] != null ? arrOpt1No[idx] : '';
                            arrOpt1Name[idx] = arrayOpt1Name[idx] != null ? arrayOpt1Name[idx] : '';
                            arrOpt1Price[idx] = arrOpt1Price[idx] != null ? parseInt(arrOpt1Price[idx]) : 0;
                            arrOpt1Gigan[idx] = arrOpt1Gigan[idx] != null ? arrOpt1Gigan[idx] : '';
                            arrOpt1PayPrice[idx] = arrOpt1PayPrice[idx] != null ? parseInt(arrOpt1PayPrice[idx]) : 0;
                            arrOpt1To = arrOpt1To[idx] != null ? arrOpt1To[idx] : '';
                        */
                            var conn = mysql.createConnection(config);
                            conn.connect();
                            conn.query('INSERT INTO pay_opt_inf_tbl(pay_no, pno, opt_no, opt_name, opt_price, opt_gigan, opt_from, opt_to, opt_pay_price,'
                                + ' opt_pay_method, opt_pay_date, opt_pay_result, insert_dt, insert_usr, update_dt, update_usr)'
                                + ' VALUES(?, ?, ?, ?, ?, ?, now(), ?, ?, ?, now(), "wait", now(), ?, now(), ?);',
                                [retVal, paramPno[idx], arrOpt1No[idx], arrOpt1Name[idx], arrOpt1Price[idx], arrOpt1Gigan[idx], arrOpt1To[idx], arrOpt1PayPrice[idx], payType, ss.usrId, ss.usrId],
                                function (err3, results3) {
                                    console.log('result3 : ', JSON.stringify(results3));
                                    if (err3) {
                                        console.log('err', err3);
                                    } else {
                                        console.dir(results3);
                                        //callback(null);
                                    }
                                }
                            );
                            conn.commit();
                            conn.end();
                    }
                    if(arrOpt2UseYn[idx] == 'Y') {
                        /*
                            arrOpt2No[idx] = arrOpt2No[idx] != null ? arrOpt2No[idx] : '';
                            arrOpt2Name[idx] = arrayOpt2Name[idx] != null ? arrayOpt2Name[idx] : '';
                            arrOpt2Price[idx] = arrOpt2Price[idx] != null ? parseInt(arrOpt2Price[idx]) : 0;
                            arrOpt2Gigan[idx] = arrOpt2Gigan[idx] != null ? arrOpt2Gigan[idx] : '';
                            arrOpt2PayPrice[idx] = arrOpt2PayPrice[idx] != null ? parseInt(arrOpt2PayPrice[idx]) : 0;
                            arrOpt2To = arrOpt2To[idx] != null ? arrOpt2To[idx] : '';
                        */
                            var conn = mysql.createConnection(config);
                            conn.connect();
                            conn.query('INSERT INTO pay_opt_inf_tbl(pay_no, pno, opt_no, opt_name, opt_price, opt_gigan, opt_from, opt_to, opt_pay_price,'
                                + ' opt_pay_method, opt_pay_date, opt_pay_result, insert_dt, insert_usr, update_dt, update_usr)'
                                + ' VALUES(?, ?, ?, ?, ?, ?, now(), ?, ?, ?, now(), "wait", now(), ?, now(), ?);',
                                [retVal, paramPno[idx], arrOpt2No[idx], arrOpt2Name[idx], arrOpt2Price[idx], arrOpt2Gigan[idx], arrOpt2To[idx], arrOpt2PayPrice[idx], payType, ss.usrId, ss.usrId],
                                function (err3, results3) {
                                    console.log('result3 : ', JSON.stringify(results3));
                                    if (err3) {
                                        console.log('err', err3);
                                    } else {
                                        console.dir(results3);
                                        //callback(null);
                                    }
                                }
                            );
                            conn.commit();
                            conn.end();
                        }
                        if (arrOpt3UseYn[idx] == 'Y') {
                            /*
                                arrOpt3No[idx] = arrOpt3No[idx] != null ? arrOpt3No[idx] : '';
                                arrOpt3Name[idx] = arrayOpt3Name[idx] != null ? arrayOpt3Name[idx] : '';
                                arrOpt3Price[idx] = arrOpt3Price[idx] != null ? parseInt(arrOpt3Price[idx]) : 0;
                                arrOpt3Gigan[idx] = arrOpt3Gigan[idx] != null ? arrOpt3Gigan[idx] : '';
                                arrOpt3PayPrice[idx] = arrOpt3PayPrice[idx] != null ? parseInt(arrOpt3PayPrice[idx]) : 0;
                                arrOpt3To = arrOpt3To[idx] != null ? arrOpt3To[idx] : '';
                            */
                                var conn = mysql.createConnection(config);
                                conn.connect();
                                conn.query('INSERT INTO pay_opt_inf_tbl(pay_no, pno, opt_no, opt_name, opt_price, opt_gigan, opt_from, opt_to, opt_pay_price,'
                                    + ' opt_pay_method, opt_pay_date, opt_pay_result, insert_dt, insert_usr, update_dt, update_usr)'
                                    + ' VALUES(?, ?, ?, ?, ?, ?, now(), ?, ?, ?, now(), "wait", now(), ?, now(), ?);',
                                    [retVal, paramPno[idx], arrOpt3No[idx], arrOpt3Name[idx], arrOpt3Price[idx], arrOpt3Gigan[idx], arrOpt3To[idx], arrOpt3PayPrice[idx], payType, ss.usrId, ss.usrId],
                                    function (err3, results3) {
                                        console.log('result3 : ', JSON.stringify(results3));
                                        if (err3) {
                                            console.log('err', err3);
                                        } else {
                                            console.dir(results3);
                                            //callback(null);
                                        }
                                    }
                                );
                                conn.commit();
                                conn.end();
                        }


                    } // end for
                } // end if
                //callback(null);
        } // end function

        ], function (err, result) {
            // result에는 '끝'이 담겨 온다.
            console.log(' async result : ', result);
        });

        })(); // end function

    } // end product cnt


    // 무통장 입금인 경우
    if(payType=='bank' || payType=='escro') {

        // 메일 발송
        var usrEmail = ss.usrEmail !=null ? ss.usrEmail : '';
        var compNm = ss.usrCompNm !=null ? ss.usrCompNm : '';
        var content = '<dd>Assist Pro 서비스 이용 신청해주셔서 감사합니다.</dd>';
        content += '<dd>* 아래의 계좌정보로 입금해주시면 확인하시고 이용처리 해드립니다. </dd>';
        content += '<dd>* 입금 계좌 은행 : 농협 </dd>';
        content += '<dd>* 예금계좌번호 : 농협 302-9992-3210-21</dd>';
        content += '<dd>* 예금주명:  황경록(제이티랩(JTLAB)) </dd>';

        // 관리자에게 이메일 전송처리.
        sendMail(usrEmail, compNm, content);

        // 안내 페이지로 이동.
        res.render('./pay/announce', {'payPrice' : totalPrice, 'session' : ss});

    } else if(payType=='card') {
        // 그 외 결제방법.(페이팔)
        var conn = mysql.createConnection(config);
        conn.connect();
        conn.query('select c_no, c_id, c_pwd, c_name, c_addr1, c_addr2, c_postno, c_email, c_sex, c_birth,  c_jumin_no,'
            + ' c_tel_no, c_tel_no1, c_tel_no2, c_tel_no3, c_cell_no, c_cell_no1, c_cell_no2, c_cell_no3, c_comp_nm,'
            + ' c_comp_tel_no, c_comp_addr1, c_comp_addr2, c_comp_postno, c_saup_no from c_inf_tbl'
            + ' where c_no = ?',
            [usrNo],
            function(err, results) {
                if(err) {
                    console.log('error : ', err.message);
                    res.render('error', {message: err.message, error: err, session: ss});
                } else {
                    //console.log(">>> 사용자 정보 조회 : " + JSON.stringify(results[0]));
                    var usrEmail = results[0].c_email;
                    var usrName = results[0].c_name;
                    var usrTelNo = results[0].c_tel_no1 + "-" + results[0].c_tel_no2 + "-" + results[0].c_tel_no3;
                    var usrCellNo = results[0].c_cell_no1 + "-" + results[0].c_cell_no2 + "-" + results[0].c_cell_no3;
                    var usrAddress = results[0].c_addr1 + "" + results[0].c_addr2;
                    var usrPostNo = results[0].c_postno;
//console.log('result -> gPayNo : ' , gPayNo);
                    var payData = {
                        payNo : gPayNo,
                        //payPgNm : 'html5_inicis',
                        payPgNm : 'kcp',
                        //payMethod : req.body.payMethod,
                        payMethod : payType,
                        orderNo : orderNo,
                        payName : 'JTLAB 서비스 결제',
                        amount : totalPrice,
                        //email : req.body.email,
                        email : usrEmail,
                        //name : req.body.name,
                        name : usrName,
                        //telno : req.body.telno,
                        telno : usrTelNo,
                        //address : req.body.address,
                        address : usrAddress,
                        //postno : req.body.postno
                        postno : usrPostNo
                    };
                    res.render('./pay/pgCall', {data : payData});
                }
            });
        conn.end();
    } else if(payType=='paypal') {
        // 그 외 결제방법.(페이팔)
        var conn = mysql.createConnection(config);
        conn.connect();
        conn.query('select c_no, c_id, c_pwd, c_name, c_addr1, c_addr2, c_postno, c_email, c_sex, c_birth,  c_jumin_no,'
            + ' c_tel_no, c_tel_no1, c_tel_no2, c_tel_no3, c_cell_no, c_cell_no1, c_cell_no2, c_cell_no3, c_comp_nm,'
            + ' c_comp_tel_no, c_comp_addr1, c_comp_addr2, c_comp_postno, c_saup_no from c_inf_tbl'
            + ' where c_no = ?',
            [usrNo],
            function(err, results) {
                if(err) {
                    console.log('error : ', err.message);
                    res.render('error', {message: err.message, error: err, session: ss});
                } else {
                    //console.log(">>> 사용자 정보 조회 : " + JSON.stringify(results[0]));
                    var usrEmail = results[0].c_email;
                    var usrName = results[0].c_name;
                    var usrTelNo = results[0].c_tel_no1 + "-" + results[0].c_tel_no2 + "-" + results[0].c_tel_no3;
                    var usrCellNo = results[0].c_cell_no1 + "-" + results[0].c_cell_no2 + "-" + results[0].c_cell_no3;
                    var usrAddress = results[0].c_addr1 + "" + results[0].c_addr2;
                    var usrPostNo = results[0].c_postno;
//console.log('result -> gPayNo : ' , gPayNo);
                    var payData = {
                        payNo : gPayNo,
                        //payPgNm : 'html5_inicis',
                        payPgNm : 'paypal',
                        //payMethod : req.body.payMethod,
                        payMethod : payType,
                        orderNo : orderNo,
                        payName : 'JTLAB 서비스 결제',
                        amount : totalPrice,
                        //email : req.body.email,
                        email : usrEmail,
                        //name : req.body.name,
                        name : usrName,
                        //telno : req.body.telno,
                        telno : usrTelNo,
                        //address : req.body.address,
                        address : usrAddress,
                        //postno : req.body.postno
                        postno : usrPostNo
                    };
                    res.render('./pay/pgCall', {data : payData});
                }
            });
        conn.end();
    // 그외 결제인(금액이 0인) 경우
    } else {
        // 메일 발송
        var usrEmail = ss.usrEmail !=null ? ss.usrEmail : '';
        var compNm = ss.usrCompNm !=null ? ss.usrCompNm : '';
        var content = '<dd>Assist Pro 서비스 이용 신청해주셔서 감사합니다.</dd>';
        content += '<dd>* 4시간 이내 확인하고 서비스 이용처리 해드리겠습니다. </dd>';

        // 관리자에게 이메일 전송처리.
        sendMail(usrEmail, compNm, content);

        // 안내 페이지로 이동.
        res.render('./pay/announce', {'payPrice' : paramPayPrice, 'session' : ss});
    }


});


// PG 대행사 처리 조회.
router.post('/getPayList', function(req, res) {
    var ss = req.session;
console.log(">>> req.body: " + JSON.stringify(req.body));
    //var merchantUid = req.body.merchant_uid !=null ? req.body.merchant_uid : "";
    var usrId = ss.usrId;
    var payNo = req.body.payNo !=null ? req.body.payNo : "";
    var orderNo = req.body.orderNo !=null ? req.body.orderNo : "";

    //아임포트 고유 아이디로 결제 정보를 조회
    iamport.payment.getByImpUid({
        //imp_uid: 'imp11226682'
        imp_uid: req.body.imp_uid
    }).then(function(result){
        console.log(">>> getPayList result : " + JSON.stringify(result));
        // 조회후 결과를 업데이트 처리함.
        if(result.status=="paid" || result.status == "ready" || result.status=="failed") {
            // DB 인서트 처리.
            conn.query('UPDATE lab_pay_info_tbl SET pay_method = ?, pay_result = ? WHERE pay_code = ? AND usr_id = ?;'
                + 'UPDATE lab_order_inf_tbl SET pay_result = ? WHERE order_no = ?;',
                [result.pay_method, result.status, payNo, usrId, result.status, orderNo],
                function (err) {
                    if (err) {
                        console.log('error : ', err.message);
                        res.render('error', {message: err.message, error: err, session: ss});
                    } else {
                        res.json({status: result.status, impUid : result.imp_uid, merchantUid : result.merchant_uid, name : result.name, paidAt : result.paid_at,
                            payMethod : result.pay_method, pgProvider : result.pg_provider, cardName : result.card_name, receiptUrl : result.receipt_url,
                            amount : result.amount, failReason : result.fail_reason,
                            cancelAmount : result.cancel_amount, cancelReason : result.cancel_reason});
                    }
                }
            );
        }

    }).catch(function(error){
        console.log(">>> error result : " + error);
        res.json({errMsg : error});
    });
});


// 결과  처리.
router.get('/result', function(req, res) {
    console.log('routes 결제 결과 화면 호출.');
    var ss = req.session;
    var data = {};
console.log('result req.query : ', JSON.stringify(req.query) + '\n');

    var payNo = req.query.payNo !=null ? req.query.payNo : "";
    var orderNo = req.query.orderNo !=null ? req.query.orderNo : "";
    var impUid = req.query.imp_uid != null ? req.query.imp_uid : '';
    var mechantUid = req.query.merchant_uid != null ? req.query.merchant_uid : '';
    var impSucess = req.query.imp_success != null ? req.query.imp_success : '';
    if(impSucess == 'true') {
        impSucess = 'paid';
    } else if(impSucess == 'false') {
        impSucess = 'failed';
    }
    var errorMsg = req.query.error_msg != null ? req.query.error_msg : '';
    console.log(">>> impSucess : " + impSucess);
    console.log(">>> errorMsg : " + errorMsg);
    if(impSucess=='false') {
        data = {
            impUid : impUid,
            merchantUid : mechantUid,
            msg : errorMsg
        }
    } else {
        data = {
            impUid : impUid,
            merchantUid : mechantUid,
            msg : '결제 완료 처리되었습니다.'
        }
    }
    // 업데이트 처리.
    // DB 인서트 처리.
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query('UPDATE lab_pay_info_tbl SET pay_method = ?, pay_result = ? WHERE pay_code = ? AND usr_id = ?;'
        + 'UPDATE lab_order_inf_tbl SET pay_result = ? WHERE order_no = ?;',
        [req.query.pay_method, impSucess, payNo, ss.usrId, impSucess, orderNo],
        function (err) {
            if (err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error: err, session: ss});
            } else {
                res.render('./pay/payResult', {data : data, session : ss});
            }
        }
    );
    conn.end();
});

// 결과 처리.
router.post('/result', function(req, res) {
    console.log('routes 결제 결과 화면 호출.');
    var ss = req.session;
    console.log(">>>> msg : " + req.body.rstMsg);

    var data = {
        msg : req.body.rstMsg
    };
    res.render('./pay/payResult', {data : data, session : ss});
});

/**
 * 이메일 발송 모듈.
 * @param senderEmail
 * @param sender
 * @param content
 */
function sendMail(receiverEmail, receiver, content) {

    var title = '[JT-LAB] AssistPro 결제 안내';
    var fromEmail = '[JT-LAB] AssistPro < jtlab.notifier@gmail.com >';
    var toEmail = '['+ receiver+'] '+ '< ' + receiverEmail +' >';
    var ccEmail = '< logger@jt-lab.co.kr >';
    var fromName = '[JT-LAB]AssistPro';
    var toName = receiver;

    var template = new EmailTemplate(path.join(templateDir, 'newsletter'));
    // HTML 에 들어갈 문자 변수 셋팅.
    var locals = {
        title : title,
        fromEmail : fromEmail,
        toEmail : toEmail,
        fromName : fromName,
        toName : toName,
        content : content
    };
    template.render(locals, function(err, results) {
        if(err) {
            return console.log(err);
        }
        console.log('results : ', JSON.stringify(results));

        smtpTransport.sendMail({
            from : fromEmail,
            to : toEmail,
            bc : ccEmail,
            subject: title,
            html : results.html
        }, function(err, responseStatus) {
            if(err) {
                console.error(err);
                //res.send('error');
            } else {
                console.log(responseStatus.message);
                //res.end('sent');
            }
        })
    });

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

function getNowDate(str) {
    var nowDate = new Date();
    var year = nowDate.getFullYear();
    var month = nowDate.getMonth()+1;
    var date = nowDate.getDate();

    if (month < 10) month = "0" + month;
    if (date < 10) date = "0" + date;

    return year + str + month + str + date;
}


// 날짜 구하기.
function dateAdd(addDay, str) {

    var nowDate = new Date();
    var nowYear = nowDate.getFullYear();
    var nowMonth = nowDate.getMonth()+1;
    var nowDay = nowDate.getDate();
    if (nowMonth < 10) {
        nowMonth = "0" + nowMonth
    }
    if (nowDay < 10) {
        nowDay = "0" + nowDay
    }
    var todayDate = nowYear + str + nowMonth + str + nowDay;
    var dateArray = todayDate.split(str);
    var tmpDate = new Date(dateArray[0], dateArray[1], dateArray[2]);
    tmpDate.setMonth(tmpDate.getMonth() + (parseInt(addDay) - 1));
    nowDate.setTime(tmpDate);
    var y = nowDate.getFullYear();
    var m = nowDate.getMonth() + 1;
    var d;
    if(addDay=='12') {
        d = nowDate.getDate();
    } else {
        d = nowDate.getDate() - 1;
    }
    if (m < 10) m = "0" + m;
    if (d < 10) d = "0" + d;
    var retVal = y + str + m + str + d;

//console.log(">> addDays() -> retDate : " + retVal);

    return retVal;
}

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

module.exports = router;