/*
 * 모듈명  : mypage.js
 * 설명    : JT-LAB 화면 '마이페이지' 에 대한 모듈.
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
var router = express.Router();

//var sprintf = require('sprintf-js').sprintf;
//var vsprintf = require('sprintf-js').vsprintf;
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));
router.use(methodOverride("_method"));
router.use(flash());


/* GET home page. */
router.get('/', function(req, res, next) {
    var ss = req.session;

    console.log('마이페이지 조회 SQL 처리');
    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    // 로그인 처리 SQL
    conn.query('SELECT @rownum:=@rownum+1 as num, x.order_no as orderNo, y.service_nm as svcNm,'
        + ' FORMAT(x.p_total_price,0) as totalPayPrice,'
        + ' case when x.pay_method = "card" then "카드" when x.pay_method = "trans" then "계좌이체" when x.pay_method = "phone" then "휴대폰소액결제"'
        + ' when x.pay_method = "bank" then "무통장입금" when x.pay_method = "escro" then "농협에스크로"'
        + ' when x.pay_method = "paypal" then "페이팔" else "" end as payMethod,'
        + ' DATE_FORMAT(x.pay_date,"%Y-%m-%d") as payDate, x.pay_result as payResult,'
        + ' case when x.pay_result = "paid" and x.refund_req_yn = "N" then "결제완료" when x.pay_result = "ready" then "미결제"'
        + ' when x.pay_result = "cancelled" then "결제취소" when x.pay_result = "failed" then "결제실패"'
        + ' when x.pay_result = "wait" then "승인대기" when x.pay_result = "refunded" then "환불완료"'
        + ' when x.pay_result = "paid" and x.refund_req_yn = "Y" then "환불요청중"'
        + ' when x.pay_result = "end" then "서비스이용종료" else "" end as payStatus,'
        + ' case when x.refund_yn = "Y" then "있음" when x.refund_yn = "N" then "없음" else "" end as refundYn,'
        + ' x.refund_req_yn as refundReqYn, x.use_term_days as useTermDays, DATE_FORMAT(x.use_end_date, "%Y-%m-%d") as useEndDate'
        + ' FROM lab_pay_info_tbl x, lab_order_his_inf_tbl y, (SELECT @rownum:=0) TMP WHERE x.order_no = y.order_no AND x.usr_id = y.usr_id'
        + ' AND x.usr_id = ? ORDER BY x.pay_date DESC, x.insert_dt DESC, x.update_dt DESC;'
        + 'SELECT @rownum:=@rownum+1 as num, x.pay_code as payCode, x.order_no as orderNo, y.service_nm as svcNm,'
        + ' FORMAT(x.p_total_price,0) as totalPayPrice,'
        + ' case when x.pay_method = "card" then "카드" when x.pay_method = "trans" then "계좌이체" when x.pay_method = "phone" then "휴대폰소액결제"'
        + ' when x.pay_method = "bank" then "무통장입금" when x.pay_method = "escro" then "농협에스크로"'
        + ' when x.pay_method = "paypal" then "페이팔" else "" end as payMethod,'
        + ' DATE_FORMAT(x.pay_date,"%Y-%m-%d") as payDate, x.pay_result as payResult,'
        + ' case when x.pay_result = "paid" and x.refund_req_yn = "N" then "결제완료" when x.pay_result = "ready" then "미결제"'
        + ' when x.pay_result = "cancelled" then "결제취소" when x.pay_result = "failed" then "결제실패"'
        + ' when x.pay_result = "wait" then "승인대기" when x.pay_result = "refunded" then "환불완료"'
        + ' when x.pay_result = "paid" and x.refund_req_yn = "Y" then "환불요청중"'
        + ' when x.pay_result = "end" then "서비스이용종료" else "" end as payStatus,'
        + ' case when x.refund_yn = "Y" then "있음" when x.refund_yn = "N" then "없음" else "" end as refundYn,'
        + ' x.refund_req_yn as refundReqYn, x.use_term_days as useTermDays, DATE_FORMAT(x.use_end_date,"%Y-%m-%d") as useEndDate'
        + ' FROM lab_pay_info_tbl x, lab_order_inf_tbl y, (SELECT @rownum:=0) TMP WHERE x.order_no = y.order_no AND x.usr_id = y.usr_id'
        + ' AND x.usr_id = ? GROUP BY x.pay_code ORDER BY x.pay_date DESC, x.insert_dt DESC, x.update_dt DESC;',
        [ss.usrId, ss.usrId, ss.usrId],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('routes mypage View Result !!!');
                res.render('./mypage', {'title': '마이 페이지', 'rList' : results[0], 'rList1' : results[1], 'session' : ss});
            }
        });
    conn.end();

});

/**
 * 구매내역 상세 조회.
 */
router.get('/paid/view/:payCode', function(req, res) {
    console.log('마이페이지 구매 상세 조회 SQL 처리');
    var ss = req.session;
    var payCode = req.params.payCode !=null ? req.params.payCode : '';
    var usrId = ss.usrId !=null ? ss.usrId : '';

    var SQL = 'SELECT @rownum:=@rownum+1 as num, x.pay_code as payCode, x.order_no as orderNo, y.service_nm as svcNm,'
    + ' FORMAT(x.p_sum_price,0) as totalPayPrice, z.p_type as pType,'
    + ' case when z.p_type = "SVC" then "서비스" when z.p_type = "HDW" then "하드웨어" else "" end as pTypeNm,'
    + ' case when x.pay_method = "card" then "카드" when x.pay_method = "trans" then "계좌이체" when x.pay_method = "phone" then "휴대폰소액결제"'
    + ' when x.pay_method = "bank" then "무통장입금" when x.pay_method = "escro" then "농협에스크로"'
    + ' when x.pay_method = "paypal" then "페이팔" else "" end as payMethod,'
    + ' DATE_FORMAT(x.pay_date,"%Y-%m-%d") as payDate, x.pay_result as payResult,'
    + ' case when x.pay_result = "paid" and x.refund_req_yn = "N" then "결제완료" when x.pay_result = "ready" then "미결제"'
    + ' when x.pay_result = "cancelled" then "결제취소" when x.pay_result = "failed" then "결제실패"'
    + ' when x.pay_result = "wait" then "승인대기" when x.pay_result = "refunded" then "환불완료"'
    + ' when x.pay_result = "paid" and x.refund_req_yn = "Y" then "환불요청중"'
    + ' when x.pay_result = "end" then "서비스이용종료" else "" end as payStatus,'
    + ' case when x.refund_yn = "Y" then "있음" when x.refund_yn = "N" then "없음" else "" end as refundYn,'
    + ' x.refund_req_yn as refundReqYn, x.use_term_days as useTermDays, DATE_FORMAT(x.use_end_date,"%Y-%m-%d") as useEndDate'
    + ' FROM lab_pay_info_tbl x, lab_order_inf_tbl y, lab_order_detail_inf_tbl z, (SELECT @rownum:=0) TMP WHERE x.order_no = y.order_no'
    + ' AND x.usr_id = y.usr_id AND y.order_no = z.order_no AND y.usr_id = z.usr_id'
    + ' AND x.pay_code = ? AND x.usr_id = ? GROUP BY x.order_no ORDER BY x.pay_date DESC, x.insert_dt DESC, x.update_dt DESC;';

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query(SQL, [payCode, usrId], function(err, results) {
        if(err) {
            console.log('err : ', err);
        } else {
            res.status(200).render('./mypagePayDetailPopup', {'rList' : results, 'session' : ss});
        }
    });
    conn.end();

});

// 서비스 이력 상세 조회
router.get('/service/his/view/:orderNo', function(req, res, next) {
    var ss = req.session;
    var orderNo = req.params.orderNo !=null ? req.params.orderNo : '';

    console.log('routes 주문 상세보기 SQL 처리');

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query('SELECT @rownum:=@rownum+1 as num, x.p_code as pCode, x.p_nm as pNm, x.p_div as pDiv,'
        + ' CASE WHEN x.p_div = "M" THEN "기본" WHEN x.p_div = "O" THEN "옵션" ELSE "" END as pDivNm, FORMAT(x.p_price, 0) as pPrice'
        + ' FROM lab_order_detail_his_inf_tbl x, (SELECT @rownum:=0) TMP WHERE x.order_no = ? ORDER BY x.p_code ASC, sort_no ASC',
        [orderNo],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('routes mypage Detail View Result !!!');
                res.render('./mypageDetailPopup', {title: '마이 서비스 상세 조회', rList : results, session : ss});
            }
        });
    conn.end();

});

// 서비스 상세 조회 (이용중인 서비스)
router.get('/service/use/view/:orderNo', function(req, res, next) {
    var ss = req.session;
    var orderNo = req.params.orderNo;

    console.log('routes 주문 상세보기 SQL 처리');

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query('SELECT @rownum:=@rownum+1 as num, x.p_code as pCode, x.p_nm as pNm, x.p_div as pDiv, x.p_type as pType,'
        + ' CASE WHEN x.p_div = "M" THEN "기본" WHEN x.p_div = "O" THEN "옵션" ELSE "" END as pDivNm, FORMAT(x.p_price, 0) as pPrice'
        + ' FROM lab_order_detail_inf_tbl x, (SELECT @rownum:=0) TMP WHERE x.order_no = ? ORDER BY x.p_code ASC, sort_no ASC',
        [orderNo],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('routes mypage Detail View Result !!!');
                res.render('./mypageDetailPopup', {title: '마이 서비스 상세 조회', rList : results, session : ss});
            }
        });
    conn.end();
});

// 상품 상세 조회 (이용중인 서비스)
router.get('/service/view3/:orderNo', function(req, res, next) {
    var ss = req.session;
    var orderNo = req.params.orderNo;

    console.log('routes 주문 상세보기 SQL 처리');

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query('SELECT @rownum:=@rownum+1 as num, x.p_code as pCode, x.p_nm as pNm, x.p_div,'
        + ' CASE WHEN x.p_div = "M" THEN "기본" WHEN x.p_div = "O" THEN "옵션" ELSE "" END as pDivNm, FORMAT(x.p_price, 0) as pPrice'
        + ' FROM lab_order_detail_inf_tbl x, (SELECT @rownum:=0) TMP WHERE x.order_no = ? ORDER BY x.p_code ASC, sort_no ASC',
        [orderNo],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('routes mypage Detail View Result !!!');
                res.render('./mypageDetailPopup3', {title: '마이 서비스 상세 조회', rList : results, session : ss});
            }
        });
    conn.end();

});

// 환불 팝업 호출.
router.get('/service/refund/view/:orderNo', function(req, res, next) {
    var ss = req.session;
    var orderNo = req.params.orderNo;
    console.log('>>> orderNo : ', orderNo);

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query('SELECT order_no as orderNo, FORMAT(p_total_price, 0) as totalPayPrice, DATE_FORMAT(pay_date, "%Y-%m-%d") as payDate'
        + ' FROM lab_pay_info_tbl WHERE order_no = ? AND usr_id = ?;'
        + 'SELECT x.order_no as orderNo, y.p_code as pNo, y.p_nm as pName, FORMAT(y.p_price,0) as pPrice,'
        + ' y.p_div as pDiv, CASE WHEN y.p_div = "M" THEN "기본" WHEN y.p_div = "O" THEN "옵션" ELSE "" END as pDivNm'
        + ' FROM lab_pay_info_tbl x, lab_order_detail_inf_tbl y'
        + ' WHERE x.order_no = y.order_no AND x.order_no = ? ORDER BY p_div ASC;',
        [orderNo, ss.usrId, orderNo],
        function(err, results) {
            if(err) {
                console.log('err : ', err);
            } else {
//console.log('result : ', JSON.stringify(results));
                res.render('./mypageRefundPopup', {'result' : results[0][0], 'rList' : results[1], 'session' : ss});
            }
        }
    );
    conn.end();

});

// 환불 요청 처리.
router.post('/service/refund/request', function(req, res, next) {
    var ss = req.session;
    var orderNo = req.body.orderNo !=null ? req.body.orderNo : '';
    var memo = req.body.memo !=null ? req.body.memo : '';
console.log('>>> orderNo : ', orderNo);
console.log('>>> memo : ', memo);

    console.log('환불신청 조회 처리.');
    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query('SELECT a.cnt as cnt FROM (SELECT @rownum:=@rownum+1 as num, COUNT(order_no) as cnt FROM lab_pay_info_tbl,'
        + ' (SELECT @rownum:=0) TMP WHERE pay_result = "wait" ORDER BY order_no DESC) a WHERE num = 1;'
        + 'SELECT COUNT(order_no) as cnt FROM lab_pay_info_tbl WHERE refund_req_yn = "Y" AND order_no = ?;',
        [orderNo],
        function(err, results) {
            if(err) {
                console.log('err : ', err);
            } else {
//console.log('results : ', JSON.stringify(results));
//console.log('results[0].cnt : ', results[0][0].cnt);
//console.log('results[1].cnt : ', results[1][0].cnt);
                if(results[0][0].cnt > 0) {
//console.log('승인대기중 건수 있음.');
                    res.status(200).json({'result' : 'wait', 'session' : ss});
                } else if(results[1][0].cnt > 0) {
//console.log('환불신청된 건수 있음.');
                    res.status(200).json({'result': 'refunded', 'session': ss});
                } else if(results[0][0].cnt > 0 && results[0][1].cnt > 0) {
//console.log('환불/승인 건수 다 있음');
                    res.status(200).json({'result': 'w&r', 'session': ss});
                } else {
                    console.log('환불신청 처리.');
                    conn.query('UPDATE lab_pay_info_tbl SET refund_req_yn = "Y", refund_req_date = now(), update_dt = now(),'
                        + ' update_usr = ?, refund_req_memo = ? WHERE order_no = ?;',
                        [ss.usrId, memo, orderNo],
                        function(err1, results1) {
                            if(err1) {
                                console.log('err1 : ', err1);
                            } else {
                                console.dir(results1);
                                res.status(200).json({'result' : 'OK', 'session' : ss});
                            }
                        }
                    );
                }
            }
        }
    );
    conn.commit();
    conn.end();

});

// 1:1 문의 게시물 조회.
router.get('/qna', function(req, res, next) {
    var ss = req.session;
    var usrNo = ss.usrNo !=null ? ss.usrNo : "";

    console.log('routes 1:1 문의 정보 조회 처리');

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query('select @rownum:=@rownum+1 as num, qno as qNo, name as name, usr_no as usrNo, email as email, telno as telNo,'
        + ' title as title, content as content, DATE_FORMAT(ins_dt, "%Y-%m-%d") as insDt,'
        + ' case when reply_yn = "Y" then "있음" when reply_yn = "N" then "없음" else "" end as replyYn,'
        + ' DATE_FORMAT(reply_ins_dt,"%Y-%m-%d") as replyInsDt'
        + ' from qna_inf_tbl, (SELECT @rownum:=0) TMP where usr_no = ?',
        [usrNo],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('routes myqna list Result !!!');
                res.render('myqna', {title: '1:1문의', rList : results, session : ss});
            }
        }
    );
    conn.end();
});

// 문의 상세 조회.
router.get('/qna/view/:qNo', function(req, res, next) {
    var ss = req.session;
    var usrNo = ss.usrNo !=null ? ss.usrNo : "";
    var qNo = req.params.qNo;

    console.log('routes 1:1 문의 정보 조회 처리');

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query('select qno as qNo, name as name, usr_no as usrNo, email as email, telno as telNo,'
        + ' title as title, content as content, DATE_FORMAT(ins_dt, "%Y-%m-%d") as insDt, reply_yn as replyYn,'
        + ' case when reply_yn = "Y" then "있음" when reply_yn = "N" then "없음" else "" end as replyyn, reply_name as replynm, reply_comment as reply,'
        + ' reply_name as replyName, reply_comment as replyComment, DATE_FORMAT(reply_ins_dt, "%Y-%m-%d") as replyInsDt'
        + ' from qna_inf_tbl where qNo = ? and usr_no = ?',
        [qNo, usrNo],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('routes myqna view Result !!!');
                res.render('./myqnaDetailPopup', {title: '1:1문의 상세', result : results[0], session : ss});
            }
        }
    );
    conn.end();
});

module.exports = router;
