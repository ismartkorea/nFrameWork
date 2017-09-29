/*
 * 모듈명  : login.js
 * 설명    : 관리자화면 '로그인처리' 에 대한 모듈.
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
var mongoose = require('mongoose');
var router = express.Router();
var SessionSchema = require('../common/SessionSchema.js');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));
router.use(methodOverride("_method"));
router.use(flash());

// login 폼 호출.
router.get('/', function(req, res) {
    console.log('routes 로그인 화면 호출.');
    var ss = req.session;

    if(ss.usrNo) {
        res.redirect('/admin');
    } else {
        res.render('./admin/loginForm', {title: 'JT-LAB 로그인 화면', result : ss});
    }

});

// login 처리.
router.post('/loginProcess', function(req, res) {

    var ss = req.session;
    var conn = mysql.createConnection({
        host: 'localhost',
        port: 3306,
        database : 'jtlab',
        user: 'jtlab',
        password: 'jtlab9123',
        insecureAuth: true,
        multipleStatements: true
    });

    var ssId = ss.id !=null ? ss.id : '';
    var usrId = req.body.usrId !=null ? req.body.usrId : '';
    var usrPwd = req.body.usrPwd !=null ? req.body.usrPwd : '';
    console.log("id : " + usrId);
    console.log("password : " + usrPwd);
    var ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (ipAddress.length < 15) {
        ipAddress = ipAddress;
    } else {
        var nyIP = ipAddress.slice(7);
        ipAddress = nyIP;
    }

    var rTitle = 'JT-LAB 로그인 화면';
    var rRet = ''; var rUsrId = '';
    var appType = req.body.appType != null ? req.body.appType : '';

    // mongodb 세션 조회 처리.
    var sm = mongoose.model('session', SessionSchema);
    sm.find({},function(err, results) {
        if (err) console.log(err);
        console.log(results.length);
        console.log(results);

        var resultId = [];
        if (results.length > 0) {
            results.forEach(function (item, idx) {
                var data = JSON.parse(item.session);
                //console.log('no : ' + idx + ' session : ' + data.usrId);
                if (data.usrId == usrId) {
                    resultId = data.usrId;
                }
            });
            if (resultId.length > 0) {
                res.status(200).json({'result': 'DUPLICATION'});
            } else {
                // 로그인 처리 SQL
                console.log('routes 로그인 SQL 처리');
                conn.connect();
                conn.query('select c_id as id, AES_DECRYPT(UNHEX(c_pwd),"jtlab") as pwd, c_no as no, c_email as email,'
                    + ' c_name as name, c_email as email, c_tel_no as telNo, c_cell_no as cellNo, c_user_tp as type, c_comp_nm as compNm,'
                    + ' c_auth_level as level, c_saup_no as saupNo from c_inf_tbl where c_id = ? and AES_DECRYPT(UNHEX(c_pwd),"jtlab") = ?'
                    + ' and (c_auth_level = "000" or c_auth_level = "001" or c_auth_level = "002")',
                    [usrId, usrPwd],
                    function (err, results) {
                        console.log(">>>> result size = " + results.length);
                        if (err) {
                            console.log('error : ', err.message);
                        } else {
                            if (results.length > 0) {
                                if (usrId != results[0].id) {
                                    rRet = 'err0';
                                } else if (usrPwd != results[0].pwd) {
                                    rRet = 'err1';
                                } else {
                                    // 세션 저장.
                                    ss.usrNo = results[0].no;
                                    ss.usrId = results[0].id;
                                    ss.usrName = results[0].name;
                                    ss.usrType = results[0].type;
                                    ss.usrLevel = results[0].level;
                                    ss.usrEmail = results[0].email;
                                    ss.usrTelNo = results[0].telNo;
                                    ss.usrCellNo = results[0].cellNo;
                                    ss.usrCompNm = results[0].compNm;
                                    ss.usrSaupNo = results[0].saupNo;
                                    rUsrId = results[0].id;
                                    ss.appType = appType;
                                    ss.usrIp = ipAddress;
                                    rRet = 'OK';
                                    // 접속 이력 테이블 저장 처리.
                                    conn.query('insert into conn_his_tbl(cview, cpage, cid, cin_date, cip)'
                                        + ' values(?, "index", ?, now(), ?);',
                                        [appType, results[0].id, ipAddress],
                                        function (err) {
                                            if (err) {
                                                console.log('>>>> err3 : ' + JSON.stringify(err));
                                                //res.render('error3', {message: err.message, error : err});
                                            }
                                        }
                                    );
                                }
                            } else {
                                rRet = 'NO';
                            }
                        }
                        conn.end();
                        res.json({title: rTitle, result: rRet, appType: appType, session: ss});
                    }
                );
            }
        } else {
            // 로그인 처리 SQL
            console.log('routes 로그인 SQL 처리');
            conn.connect();
            conn.query('select c_id as id, AES_DECRYPT(UNHEX(c_pwd),"jtlab") as pwd, c_no as no, c_email as email,'
                + ' c_name as name, c_email as email, c_tel_no as telNo, c_cell_no as cellNo, c_user_tp as type, c_comp_nm as compNm,'
                + ' c_auth_level as level, c_saup_no as saupNo from c_inf_tbl where c_id = ? and AES_DECRYPT(UNHEX(c_pwd),"jtlab") = ?'
                + ' and (c_auth_level = "000" or c_auth_level = "001" or c_auth_level = "002")',
                [usrId, usrPwd],
                function (err, results) {
                    console.log(">>>> result size = " + results.length);
                    if (err) {
                        console.log('error : ', err.message);
                    } else {
                        if (results.length > 0) {
                            if (usrId != results[0].id) {
                                rRet = 'err0';
                            } else if (usrPwd != results[0].pwd) {
                                rRet = 'err1';
                            } else {
                                // 세션 저장.
                                ss.usrNo = results[0].no;
                                ss.usrId = results[0].id;
                                ss.usrName = results[0].name;
                                ss.usrType = results[0].type;
                                ss.usrLevel = results[0].level;
                                ss.usrEmail = results[0].email;
                                ss.usrTelNo = results[0].telNo;
                                ss.usrCellNo = results[0].cellNo;
                                ss.usrCompNm = results[0].compNm;
                                ss.usrSaupNo = results[0].saupNo;
                                rUsrId = results[0].id;
                                ss.appType = appType;
                                ss.usrIp = ipAddress;
                                rRet = 'OK';
                                // 접속 이력 테이블 저장 처리.
                                conn.query('insert into conn_his_tbl(cview, cpage, cid, cin_date, cip)'
                                    + ' values(?, "index", ?, now(), ?);',
                                    [appType, results[0].id, ipAddress],
                                    function (err) {
                                        if (err) {
                                            console.log('>>>> err3 : ' + JSON.stringify(err));
                                            //res.render('error3', {message: err.message, error : err});
                                        }
                                    }
                                );
                            }
                        } else {
                            rRet = 'NO';
                        }
                    }
                    conn.end();
                    res.json({title: rTitle, result: rRet, appType: appType, session: ss});
                }
            );
        }
    });
});

// relogin 처리.
router.post('/relogin', function(req, res) {

    var ss = req.session;
    var ssId = ss.id !=null ? ss.id : '';
    var usrId = req.body.usrId !=null ? req.body.usrId : '';
    var usrPwd = req.body.usrPwd !=null ? req.body.usrPwd : '';
    console.log("id : " + usrId);
    console.log("password : " + usrPwd);
    var ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (ipAddress.length < 15) {
        ipAddress = ipAddress;
    } else {
        var nyIP = ipAddress.slice(7);
        ipAddress = nyIP;
    }

    var rTitle = 'JT-LAB 로그인 화면';
    var rRet = ''; var rUsrId = '';
    var appType = req.body.appType != null ? req.body.appType : '';

    // mongodb 세션 조회 처리.
    var sm = mongoose.model('session', SessionSchema);
    sm.find({},function(err, results) {
        if(err) console.log(err);
        // 중복된 건수 삭제처리.
        if(results.length > 0) {
            results.forEach(function(item, idx) {
                var data = JSON.parse(item.session);
                //console.log('no : ' + idx + ' session : ' + data.usrId);
                if(data.usrId == usrId) {
                    //console.log('_id : ' , item._id);
                    sm.remove({'_id':item._id}, function(err, results) {
                        if(err) console.log('delete err : ', JSON.stringify(err));
                        console.log('result : ', results.result);
                    });
                }
            });
        }
    });
    // 로그인 처리 SQL
    console.log('routes 로그인 SQL 처리');
    var conn = mysql.createConnection({
        host: 'localhost',
        port: 3306,
        database : 'jtlab',
        user: 'jtlab',
        password: 'jtlab9123',
        insecureAuth: true,
        multipleStatements: true
    });
    conn.connect();
    conn.query('select c_id as id, AES_DECRYPT(UNHEX(c_pwd),"jtlab") as pwd, c_no as no, c_email as email,'
        + ' c_name as name, c_email as email, c_tel_no as telNo, c_cell_no as cellNo, c_user_tp as type, c_comp_nm as compNm,'
        + ' c_auth_level as level, c_saup_no as saupNo from c_inf_tbl where c_id = ? and AES_DECRYPT(UNHEX(c_pwd),"jtlab") = ?'
        + ' and (c_auth_level = "000" or c_auth_level = "001" or c_auth_level = "002")',
        [usrId, usrPwd],
        function (err, results) {
            console.log(">>>> result size = " + results.length);
            if (err) {
                console.log('error : ', err.message);
            } else {
                if (results.length > 0) {
                    if (usrId != results[0].id) {
                        rRet = 'err0';
                    } else if (usrPwd != results[0].pwd) {
                        rRet = 'err1';
                    } else {
                        // 세션 저장.
                        ss.usrNo = results[0].no;
                        ss.usrId = results[0].id;
                        ss.usrName = results[0].name;
                        ss.usrType = results[0].type;
                        ss.usrLevel = results[0].level;
                        ss.usrEmail = results[0].email;
                        ss.usrTelNo = results[0].telNo;
                        ss.usrCellNo = results[0].cellNo;
                        ss.usrCompNm = results[0].compNm;
                        ss.usrSaupNo = results[0].saupNo;
                        rUsrId = results[0].id;
                        ss.appType = appType;
                        ss.usrIp = ipAddress;
                        rRet = 'OK';
                        // 접속 이력 테이블 저장 처리.
                        conn.query('insert into conn_his_tbl(cview, cpage, cid, cin_date, cip)'
                            + ' values(?, "index", ?, now(), ?);',
                            [appType, results[0].id, ipAddress],
                            function (err) {
                                if (err) {
                                    console.log('>>>> err3 : ' + JSON.stringify(err));
                                    //res.render('error3', {message: err.message, error : err});
                                }
                            }
                        );
                    }
                } else {
                    rRet = 'NO';
                }
            }
            conn.end();
            res.json({title: rTitle, result: rRet, appType: appType, session: ss});
        }
    );
});

// 로그아웃처리.
router.get('/logout', function(req, res) {
    var ss = req.session;
    var conn = mysql.createConnection({
        host: 'localhost',
        port: 3306,
        database : 'jtlab',
        user: 'jtlab',
        password: 'jtlab9123',
        insecureAuth: true,
        multipleStatements: true
    });

    var usrId = ss.usrId !=null ? ss.usrId : 'NONE';

    // 삭제처리.
    conn.connect();
    conn.query('insert into conn_his_tbl(cview, cpage, cid, cin_date, cout_date, cip) values("JTLAB", "index", ?,'
        + ' DATE_FORMAT("0000-00-00","%Y-%m-%d %H:%i:%s"), now(), ?);',
        [usrId, ss.usrIp],
        function(err){
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                // 세션 삭제.
                req.session.destroy(function(err){
                    if(err) {
                        console.log(">>> destroy err: " + err);
                        conn.rollback();
                    } else {
                        req.session;
                        conn.commit();
                    }
                    conn.end();
                });
                res.redirect('/admin/login');
            }
        }
    );

});

module.exports = router;