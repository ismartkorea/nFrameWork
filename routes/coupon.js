/*
 * 모듈명  : coupon.js
 * 설명    : JT-LAB 화면 '쿠폰' 에 대한 모듈.
 * 작성일  : 2017년 2월 10일
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

// 쿠폰 입력 화면(Popup) 호출.
router.get('/', function(req, res) {
    var ss = req.session;


    res.render('./couponUsePopup', {session : ss});
});

// 쿠폰 입력 조회 및 저장 처리
router.post('/use', function(req, res) {
    var ss = req.session;

    // 입력된 쿠폰이 있는 지 조회처리.
    conn.query('SELECT count(coupon_no) as count FROM coupon_inf_tbl WHERE coupon_status IN ("NOTUSED") AND coupon_no = ?',
        [req.body.couponNo],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                //res.render('error', {message: err.message, error: err, session: ss});
            } else {
                var cnt = results[0].count;
                console.log(">>> cnt : " + cnt);
                if(cnt == 0) {
                    // 없는 경우 처리.
                    res.json({result : 'NO', session : ss});
                } else {
                    // 있는 경우 처리.
                    conn.query('INSERT INTO coupon_use_inf_tbl(coupon_no, ins_usr_id, ins_usr_nm, ins_date)'
                        + 'VALUES(?, ?, ?, now())',
                        [req.body.couponNo, ss.usrId, ss.usrName],
                        function(err) {
                            if(err) {
                                console.log('error : ', err.message);
                                res.render('error', {message: err.message, error: err, session: ss});
                            } else {
                                res.json({result : 'OK', session : ss});
                            }
                    });
                }
            }
    });


});


module.exports = router;