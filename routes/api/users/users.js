var express = require('express');
var mysql = require('mysql');
var router = express.Router();

var conn = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    database : 'jtlab',
    user: 'jtlab',
    password: 'jtlab9123',
    insecureAuth: true
});




// 고객번호로 정보 호출.
/*
router.get('/:no', function(req, res) {

    conn.connect();

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    conn.query('select c_no as no, c_id as id, c_pwd as pwd, c_name as name, c_email as email, c_sex as sex, c_addr1 as address1, ' +
        'c_addr2 as address2, c_postno as postno, c_bus_no as saupno, c_meb_typ as usertype, c_auth_level as level, c_birth as birth, c_auth_cd as authcd,' +
        ' c_jumin_no as juminno, c_inf_use_yn as infoyn from c_inf_tbl where c_no = ? and c_auth_cd is not null',
        [req.params.no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                res.json({members : results});
            }
        });

    conn.end();
});
*/

// 고객id, 고객pwd, 상품정보로 정보 호출.
router.get('/:id/:pwd/:pno', function(req, res) {

    console.log(">>> id = " + req.params.id);
    console.log(">>> pwd = " + req.params.pwd);
    console.log(">>> pno = " + req.params.pno);

    //conn.connect();

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.

    conn.query('select a.c_no as cno, a.c_name as name, a.c_addr1 as addr1, a.c_addr2 as addr2, a.c_postno as postno, a.c_email as email'
        + ', a.c_sex as sex, a.c_meb_typ as membertype, a.c_auth_level as level, b.pname as pname, b.fdate as fdat, b.tdate as tdate'
        + ' from c_inf_tbl a, test_pay_tbl b where a.c_no = b.no and b.pay_result = "C" and a.c_id = ? and a.c_pwd = ? and b.pno = ?',
        [req.params.id, req.params.pwd, req.params.pno],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                res.json({result : results[0]});
            }
        });

    //conn.end();

});

module.exports = router;