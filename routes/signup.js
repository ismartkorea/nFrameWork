/*
 * 모듈명  : signup.js
 * 설명    : JT-LAB 화면 '회원가입' 에 대한 모듈.
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

// login 폼 호출.
router.get('/', function(req, res) {
    console.log('routes 로그인 화면 호출.');
    res.render('./signup/signupForm', {title: 'JT-LAB 로그인 화면'});
});

// login 처리.
router.post('/signupProcess', function(req, res) {

    //conn.connect();
    //conn.query("USE jtlab");

    console.log('routes 로그인 SQL 처리');
    // 로그인 처리 SQL
    conn.query('insert into c_inf_tbl(c_id, c_pwd, c_name, c_addr1, c_addr2, c_postno, c_email, c_sex, c_birth, c_jumin_no' +
        ', c_tel_no, c_tel_no1, c_tel_no2, c_tel_no3, c_cell_no, c_cell_no1, c_cell_no2, c_cell_no3, c_comp_nm' +
        ', c_comp_tel_no, c_comp_tel_no1, c_comp_tel_no2, c_comp_tel_no3, c_comp_addr1, c_comp_addr2, c_comp_postno' +
        ', c_saup_no, c_email_yn, c_inf_use_yn, c_user_tp, c_auth_level, c_auth_cd, system_div, insert_dt, insert_usr, update_dt, update_usr)' +
        ' values(?, HEX(AES_ENCRYPT(?,"jtlab")), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?' +
        ', ?, ?, ?, ?, ?, ?, "500", "'+ randomString(16) +'", "lab", now(), "user", now(), "user")',
        [req.body.usrId, req.body.usrPwd, req.body.usrName, req.body.usrAddr1, req.body.usrAddr2, req.body.usrPostNo, req.body.usrEmail, req.body.usrSex,
         req.body.usrBirth, req.body.usrJuminNo, req.body.usrTelNo, req.body.usrTelNo1, req.body.usrTelNo2, req.body.usrTelNo3,
         req.body.usrCellNo, req.body.usrCellNo1, req.body.usrCellNo2, req.body.usrCellNo3, req.body.usrCompNm,
         req.body.usrCompTelNo, req.body.usrCompTelNo1, req.body.usrCompTelNo2, req.body.usrCompTelNo3, req.body.usrCompAddr1,
         req.body.usrCompAddr2, req.body.usrCompPostNo, req.body.usrSaupNo, req.body.usrEmailYn, req.body.usrInfoYn, req.body.usrType],
        function(err) {
            if(err) {
                console.log('error : ', JSON.stringify(err));
            } else {
                res.json({title: '로그인 화면', result : 'OK'});
            }
        }
    );
    //conn.end();

});

// 가입정보 조회.
router.get('/edit/:no', function(req, res) {
    
    var ss = req.session;
    console.log("멤버 정보 조회 처리");
    conn.query('select c_no as no, c_id as id, AES_DECRYPT(UNHEX(c_pwd),"jtlab") as pwd, c_name as name,'
        + ' c_addr1 as address1, c_addr2 as address2, c_postno as postno, c_email as email, c_sex as sex,'
        + ' SUBSTRING(c_birth,1,4) as year,SUBSTRING(c_birth,5,2) as month, SUBSTRING(c_birth,7,2) as day,'
        + ' c_jumin_no as juminno, c_tel_no as telno, c_tel_no1 as telno1, c_tel_no2 as telno2, c_tel_no3 as telno3,'
        + ' c_cell_no as cellno, c_cell_no1 as cellno1, c_cell_no2 as cellno2, c_cell_no3 as cellno3, c_comp_nm as compnm,'
        + ' c_comp_tel_no as comptelno, c_comp_tel_no1 as comptelno1, c_comp_tel_no2 as comptelno2, c_comp_tel_no3 as comptelno3,'
        + ' c_comp_addr1 as compaddr1, c_comp_addr2 as compaddr2, c_comp_postno as comppostno, c_saup_no as saupno,'
        + ' c_email_yn as emailyn, c_inf_use_yn as infoyn, c_user_tp as usertype, c_auth_level as level, c_auth_cd as authcd,'
        + ' insert_dt as w_dt, insert_usr as w_nm, update_dt as u_dt, update_usr as u_nm from c_inf_tbl where c_no = ?',
        [req.params.no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('routes member Edit Result !!!');
                res.render('./signup/updateForm', {result : 'OK', info : results[0], session : ss});
            }
        });

});

// 회원정보 수정처리.
router.post('/edit', function(req, res) {

    var ss = req.session;

    console.log("멤버 수정 처리");
    conn.query('UPDATE c_inf_tbl SET c_id = ?, c_pwd = HEX(AES_ENCRYPT(?,"jtlab")), c_name = ?,'
        + ' c_addr1 = ?, c_addr2 = ?, c_postno = ?, c_email = ?, c_sex = ?, c_birth = ?, c_jumin_no = ?, c_tel_no = ?,'
        + ' c_tel_no1 = ?, c_tel_no2 = ?, c_tel_no3 = ?, c_cell_no = ?, c_cell_no1 = ?, c_cell_no2 = ?, c_cell_no3 = ?,'
        + ' c_comp_nm = ?, c_comp_tel_no = ?, c_comp_tel_no1 = ?, c_comp_tel_no2 = ?, c_comp_tel_no3 = ?,'
        + ' c_comp_addr1 = ?, c_comp_addr2 = ?, c_comp_postno = ?, c_saup_no = ?, c_email_yn = ?, c_inf_use_yn = ?,'
        + ' c_user_tp = ?, c_auth_level = ?, update_dt = now(), update_usr = ? WHERE c_no = ?',
        [req.body.usrId, req.body.usrPwd, req.body.usrName, req.body.usrAddr1, req.body.usrAddr2, req.body.usrPostNo,
            req.body.usrEmail, req.body.usrSex, req.body.usrBirth, req.body.usrJuminNo, req.body.usrTelNo, req.body.usrTelNo1,
            req.body.usrTelNo2, req.body.usrTelNo3, req.body.usrCellNo, req.body.usrCellNo1, req.body.usrCellNo2, req.body.usrCellNo3,
            req.body.usrCompNm, req.body.usrCompTelNo, req.body.usrCompTelNo1, req.body.usrCompTelNo2, req.body.usrCompTelNo3,
            req.body.usrCompAddr1, req.body.usrCompAddr2, req.body.usrCompPostNo, req.body.usrSaupNo, req.body.usrEmailYn,
            req.body.usrInfoYn, req.body.usrType, req.body.usrAuthLvl, ss.usrName, req.body.usrNo],
        function(err, result) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err});
            } else {
                console.log('result : ' + result.message);
                res.json({result:'OK', session : ss});
            }
        }
    );
    //conn.commit();
});

// app용 login 폼 호출.
router.get('/app', function(req, res) {
    console.log('routes 로그인 화면 호출.');
    res.render('./signup/appSignupForm', {title: 'JT-LAB 로그인 화면'});
});

// login 처리.
router.post('/app/signupProcess', function(req, res) {

    //conn.connect();
    //conn.query("USE jtlab");

    console.log('routes 로그인 SQL 처리');
    // 로그인 처리 SQL
    conn.query('insert into c_inf_tbl(c_id, c_pwd, c_name, c_addr1, c_addr2, c_postno, c_email, c_sex, c_birth, c_jumin_no' +
        ', c_tel_no, c_tel_no1, c_tel_no2, c_tel_no3, c_cell_no, c_cell_no1, c_cell_no2, c_cell_no3, c_comp_nm' +
        ', c_comp_tel_no, c_comp_tel_no1, c_comp_tel_no2, c_comp_tel_no3, c_comp_addr1, c_comp_addr2, c_comp_postno' +
        ', c_saup_no, c_email_yn, c_inf_use_yn, c_user_tp, c_auth_level, c_auth_cd, system_div, insert_dt, insert_usr, update_dt, update_usr)' +
        ' values(?, HEX(AES_ENCRYPT(?,"jtlab")), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?' +
        ', ?, ?, ?, ?, ?, ?, "500", "'+ randomString(16) +'", "lab", now(), "user", now(), "user")',
        [req.body.usrId, req.body.usrPwd, req.body.usrName, req.body.usrAddr1, req.body.usrAddr2, req.body.usrPostNo, req.body.usrEmail, req.body.usrSex,
            req.body.usrBirth, req.body.usrJuminNo, req.body.usrTelNo, req.body.usrTelNo1, req.body.usrTelNo2, req.body.usrTelNo3,
            req.body.usrCellNo, req.body.usrCellNo1, req.body.usrCellNo2, req.body.usrCellNo3, req.body.usrCompNm,
            req.body.usrCompTelNo, req.body.usrCompTelNo1, req.body.usrCompTelNo2, req.body.usrCompTelNo3, req.body.usrCompAddr1,
            req.body.usrCompAddr2, req.body.usrCompPostNo, req.body.usrSaupNo, req.body.usrEmailYn, req.body.usrInfoYn, req.body.usrType],
        function(err) {
            if(err) {
                console.log('error : ', JSON.stringify(err));
            } else {
                res.json({title: '로그인 화면', result : 'OK'});
            }
        }
    );
    //conn.end();

});

// 가입정보 조회.
router.get('/app/edit/:no', function(req, res) {

    var ss = req.session;
    console.log("멤버 정보 조회 처리");
    conn.query('select c_no as no, c_id as id, AES_DECRYPT(UNHEX(c_pwd),"jtlab") as pwd, c_name as name,'
        + ' c_addr1 as address1, c_addr2 as address2, c_postno as postno, c_email as email, c_sex as sex,'
        + ' SUBSTRING(c_birth,1,4) as year,SUBSTRING(c_birth,5,2) as month, SUBSTRING(c_birth,7,2) as day,'
        + ' c_jumin_no as juminno, c_tel_no as telno, c_tel_no1 as telno1, c_tel_no2 as telno2, c_tel_no3 as telno3,'
        + ' c_cell_no as cellno, c_cell_no1 as cellno1, c_cell_no2 as cellno2, c_cell_no3 as cellno3, c_comp_nm as compnm,'
        + ' c_comp_tel_no as comptelno, c_comp_tel_no1 as comptelno1, c_comp_tel_no2 as comptelno2, c_comp_tel_no3 as comptelno3,'
        + ' c_comp_addr1 as compaddr1, c_comp_addr2 as compaddr2, c_comp_postno as comppostno, c_saup_no as saupno,'
        + ' c_email_yn as emailyn, c_inf_use_yn as infoyn, c_user_tp as usertype, c_auth_level as level, c_auth_cd as authcd,'
        + ' insert_dt as w_dt, insert_usr as w_nm, update_dt as u_dt, update_usr as u_nm from c_inf_tbl where c_no = ?',
        [req.params.no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('routes member Edit Result !!!');
                res.render('./signup/appUpdateForm', {result : 'OK', info : results[0], session : ss});
            }
        });

});

// 회원정보 수정처리.
router.post('/app/edit', function(req, res) {

    var ss = req.session;

    console.log("멤버 수정 처리");
    conn.query('UPDATE c_inf_tbl SET c_id = ?, c_pwd = HEX(AES_ENCRYPT(?,"jtlab")), c_name = ?,'
        + ' c_addr1 = ?, c_addr2 = ?, c_postno = ?, c_email = ?, c_sex = ?, c_birth = ?, c_jumin_no = ?, c_tel_no = ?,'
        + ' c_tel_no1 = ?, c_tel_no2 = ?, c_tel_no3 = ?, c_cell_no = ?, c_cell_no1 = ?, c_cell_no2 = ?, c_cell_no3 = ?,'
        + ' c_comp_nm = ?, c_comp_tel_no = ?, c_comp_tel_no1 = ?, c_comp_tel_no2 = ?, c_comp_tel_no3 = ?,'
        + ' c_comp_addr1 = ?, c_comp_addr2 = ?, c_comp_postno = ?, c_saup_no = ?, c_email_yn = ?, c_inf_use_yn = ?,'
        + ' c_user_tp = ?, c_auth_level = ?, update_dt = now(), update_usr = ? WHERE c_no = ?',
        [req.body.usrId, req.body.usrPwd, req.body.usrName, req.body.usrAddr1, req.body.usrAddr2, req.body.usrPostNo,
            req.body.usrEmail, req.body.usrSex, req.body.usrBirth, req.body.usrJuminNo, req.body.usrTelNo, req.body.usrTelNo1,
            req.body.usrTelNo2, req.body.usrTelNo3, req.body.usrCellNo, req.body.usrCellNo1, req.body.usrCellNo2, req.body.usrCellNo3,
            req.body.usrCompNm, req.body.usrCompTelNo, req.body.usrCompTelNo1, req.body.usrCompTelNo2, req.body.usrCompTelNo3,
            req.body.usrCompAddr1, req.body.usrCompAddr2, req.body.usrCompPostNo, req.body.usrSaupNo, req.body.usrEmailYn,
            req.body.usrInfoYn, req.body.usrType, req.body.usrAuthLvl, ss.usrName, req.body.usrNo],
        function(err, result) {
            if(err) {
                console.log('error : ', err.message);
                res.status(500).json({message: err.message, error : err});
            } else {
                console.log('result : ' + result.message);
                res.status(200).json({result:'OK', session : ss});
            }
        }
    );
    //conn.commit();
});

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