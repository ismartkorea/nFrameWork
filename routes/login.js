/*
 * 모듈명  : login.js
 * 설명    : JT-LAB 화면 '로그인' 에 대한 모듈.
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
var path = require('path');
var nodeEmail =require('nodemailer');
var EmailTemplate = require('email-templates').EmailTemplate;
var templateDir = path.resolve(__dirname, 'templates3');
var smtpTransport = require('nodemailer-smtp-transport');
var async = require('async');
var login = require('./common/loginCheck');
var config = require('./common/dbconfig');
var router = express.Router();
var SessionSchema = require('./common/SessionSchema.js');
var Login = new login();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));
router.use(methodOverride("_method"));
//router.use(session());
router.use(flash());

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

// login 폼 호출.
router.get('/', function(req, res) {
    console.log('routes 로그인 화면 호출.');
    var ss = req.session;

    var SQL1 = 'SELECT p_code as pCode, p_uniq_code as pUniqCode, p_div as pDiv, p_nm as pNm FROM product_lab_info_tbl'
        + ' WHERE p_div = "M" AND p_display_yn = "Y" ORDER BY insert_dt ASC LIMIT 0, 5;';
    var SQL2 = ' SELECT @rownum:=@rownum+1 as num, no as no, title as title FROM announce_inf_tbl, (SELECT @rownum:=0) TMP'
        + ' ORDER BY date DESC LIMIT 0, 5;';

    var hostName = req.hostname;

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query(SQL1+SQL2, [],
        function(err, results) {
            if(err) {
                console.log('err : ', err);
            } else {

                if(hostName=='www.jt-lab.co.kr') {

                    res.render('./index', { 'title' : 'jt-lab.co.kr', 'rList' : results[0], 'rList1' : results[1], 'loginYn' : 'Y', 'session' : ss});
                } else if(hostName=='www.assistpro.co.kr'){

                    res.redirect('./assist');
                } else {

                    res.render('./index', { 'title' : 'localhost', 'rList' : results[0], 'rList1' : results[1], 'loginYn' : 'Y', 'session' : ss});
                }

            }
        });
    conn.end();

    //res.render('./index', {title: 'JT-LAB 로그인 화면', session : ss});
});

// login 처리.
router.post('/loginProcess', function(req, res) {

    var ss = req.session;
    var ssId = ss.id !=null ? ss.id : '';
    var usrId = req.body.usrId !=null ? req.body.usrId : '';
    var usrPwd = req.body.usrPwd !=null ? req.body.usrPwd : '';
    var ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (ipAddress.length < 15) {
        ipAddress = ipAddress;
    } else {
        var nyIP = ipAddress.slice(7);
        ipAddress = nyIP;
    }
    var rTitle = 'JT-LAB 로그인 화면';
    var rRet = ''; var rUsrId = '';
    console.log(">>> JT-LAB 로그인 정보 조회. <<<");

    // mongodb 세션 조회 처리.
    var sm = mongoose.model('session', SessionSchema);
    sm.find({},function(err, results) {
        if(err) console.log(err);

        // 건수가 있는 경우, 루프해서 해당 건수 조회.
        // 해당 건수에서 usrId가 있는 경우 세션 id로 삭제 처리.
        // 해당 세션아이디는 배열로 넘겨줌.
        var resultId = [];
        if(results.length > 0) {
            results.forEach(function(item, idx) {
                var data = JSON.parse(item.session);
                //console.log('no : ' + idx + ' session : ' + data.usrId);
                if(data.usrId == usrId) {
                    resultId = data.usrId;
                }
            });
            if(resultId.length > 0) {
                res.status(200).json({'result' : 'DUPLICATION'});
            } else {

                // 공통 로그인 처리.
                Login.loginProcess(ipAddress, usrId, usrPwd, ss, function(err, result) {
                    if(err) {
                        console.log('err : ', err);
                    } else {
                        res.status(200).json({title : rTitle, result : result,  session : ss});
                    }
                });

            }
        } else {
            // 공통 로그인 처리.
            Login.loginProcess(ipAddress, usrId, usrPwd, ss, function(err, result) {
                if(err) {
                    console.log('err : ', err);
                } else {
                    res.status(200).json({title : rTitle, result : result,  session : ss});
                }
            });
        }
    }); // sm.find end.
});

// 재login 처리.
router.post('/relogin', function(req, res) {

    var ss = req.session;
    var ssId = ss.id !=null ? ss.id : '';
    var usrId = req.body.usrId !=null ? req.body.usrId : '';
    var usrPwd = req.body.usrPwd !=null ? req.body.usrPwd : '';
    var ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (ipAddress.length < 15) {
        ipAddress = ipAddress;
    } else {
        var nyIP = ipAddress.slice(7);
        ipAddress = nyIP;
    }
    var rTitle = 'JT-LAB 로그인 화면';
    var rRet = ''; var rUsrId = '';
    console.log(">>> JT-LAB 로그인 정보 조회. <<<");
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

    // 로그인 처리.
    Login.loginProcess(ipAddress, usrId, usrPwd, ss, function(err, result) {
        if(err) {
            console.log('err : ', err);
        } else {
            res.status(200).json({title : rTitle, result : result,  session : ss});
        }
    });

});


// 로그아웃처리.
router.get('/logout', function(req, res) {

    var ss = req.session;

    // 로그인 정보
    var usrId = ss.usrId !=null ? ss.usrId : 'NONE';
    var ssId = ss.id !=null ? ss.id : '';
    var ssUsrIp = ss.usrIp !=null ? ss.usrIp : '0.0.0.0';

    // 삭제처리.
    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query('insert into conn_his_tbl(cview, cpage, cid, cin_date, cout_date, cip) values("jtlab", "index", ?,'
        + ' now(), now(), ?);',
/*
        + ' delete from session_inf_tbl where usr_id = ? and ip = ?;',
        [usrId, ssUsrIp, usrId, ssUsrIp],
 */
        [usrId, ssUsrIp],
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
                res.redirect('/');
            }
        }
    );
    //conn.end();
});

/**
 * 아이디/패스워드 찾기 화면 호출.
 */
router.get('/findId', function(req, res, next) {
    console.log('아이디/패스워드 찾기 화면호출.');
    var ss = req.session;

    res.status(200).render('./searchIdPwd', {'sesson' : ss});
});

/**
 * 아이디 조회.
 */
router.post('/find/getid', function(req, res, next) {
    var ss = req.session;
    var usrId = req.body.usrId !=null ? req.body.usrId : '';
    var SQL = 'SELECT COUNT(c_id) as cnt FROM c_inf_tbl WHERE c_id = ?;';
    var SQL1 = ' SELECT c_id as id FROM c_inf_tbl WHERE c_id = ?;';

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query(SQL+SQL1, [usrId, usrId],
        function(err, results) {
            if(err) {
                console.log('err : ', err);
            } else {
                var count = results[0][0].cnt;
                var result = '';
                if(count > 0) {
                    var getId = results[1][0].id;
                    if (usrId == getId) {
                        result = 'OK';
                    }
                }
                res.status(200).json({'result' : result, 'session' : ss});
            }
    });
    conn.end();

});

/**
 * 아이디 찾기.
 */
router.post('/find/id', function(req, res, next) {
    var ss = req.session;
    var usrNm = req.body.usrNm !=null ? req.body.usrNm : '';
    var usrEmail = req.body.usrEmail !=null ? req.body.usrEmail : '';
    var SQL = 'SELECT COUNT(c_id) as cnt FROM c_inf_tbl WHERE c_name = ? AND c_email = ?;';
    var SQL1 = ' SELECT c_id as id FROM c_inf_tbl WHERE c_name = ? AND c_email = ?;';

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query(SQL+SQL1, [usrNm, usrEmail, usrNm, usrEmail],
        function(err, results) {
            if(err) {
                console.log('err : ', err);
            } else {
                var result = '';
                if(results[0][0].cnt > 0) {
                    var id = results[1][0].id;
                    var content = usrNm + " 님의 아이디는 '" + id + "' 입니다.";

                    // 관리자에게 이메일 전송처리.
                    sendMail(usrEmail, usrNm, content);

                    result = 'OK';
                }
                res.status(200).json({'result' : result, 'session' : ss});
            }
        });
    conn.end();

});

/**
 * 비밀번호 찾기.
 */
router.post('/find/pwd', function(req, res, next) {
    var ss = req.session;
    var usrId = req.body.usrId !=null ? req.body.usrId : '';
    var usrNm = req.body.usrNm !=null ? req.body.usrNm : '';
    var usrEmail = req.body.usrEmail !=null ? req.body.usrEmail : '';
    var SQL = 'SELECT COUNT(c_pwd) as cnt FROM c_inf_tbl WHERE c_name = ? AND c_id = ? AND c_email = ?;';
    var SQL1 = ' SELECT AES_DECRYPT(UNHEX(c_pwd),"jtlab") as pwd FROM c_inf_tbl WHERE c_name = ? AND c_id = ? AND c_email = ?;';

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query(SQL+SQL1, [usrNm, usrId, usrEmail, usrNm, usrId, usrEmail],
        function(err, results) {
            if(err) {
                console.log('err : ', err);
            } else {
                var result = '';
                if(results[0][0].cnt > 0) {
                    var pwd = results[1][0].pwd;
                    var content = usrNm + " 님의 비밀번호는 '" + pwd + "' 입니다. 확인하시고 다시 로그인 하시면 비밀번호를 변경해주세요.";

                    // 관리자에게 이메일 전송처리.
                    sendMail(usrEmail, usrNm, content);

                    result = 'OK';
                }
                res.status(200).json({'result' : result, 'session' : ss});
            }
        });
    conn.end();

});

/**
 * 이메일 발송 모듈.
 * @param senderEmail
 * @param sender
 * @param content
 */
function sendMail(receiverEmail, receiver, content) {

    var title = '[JT-LAB] 아이디/비밀번호 찾기 안내';
    var fromEmail = '[JT-LAB] < jtlab.notifier@gmail.com >';
    var toEmail = '['+ receiver+'] '+ '< ' + receiverEmail +' >';
    var ccEmail = '< logger@jt-lab.co.kr >';
    var fromName = '[JT-LAB] 관리자';
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

module.exports = router;