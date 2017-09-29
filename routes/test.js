/*
 * 모듈명  : test.js
 * 설명    : 'TEST 용' 에 대한 모듈.
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
var util = require('util');
var fs = require('fs');
var os = require('os');
var path = require('path');
var multer = require('multer');
var sprintf = require('sprintf-js').sprintf;
var vsprintf = require('sprintf-js').vsprintf;
var email = require('emailjs');
var nodeEmail =require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var schedule = require('node-schedule');
var nodeEmail =require('nodemailer');
var EmailTemplate = require('email-templates').EmailTemplate;
var path = require('path');
var templateDir = path.resolve(__dirname, 'templates');
var config = require('./test/connect');
var uniqid = require('uniqid');
var crypto = require('crypto');
var request = require('request');
var async = require('async');
var request = require('request');
var utils = require('./common/utils');
var login = require('./common/loginCheck');
var router = express.Router();
var Login = new login();
var Util = new utils();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:true}));
router.use(methodOverride("_method"));
router.use(flash());

console.log("os.platform() : " + os.platform());

// email server
var emailServer = email.server.connect({
    user: ' jtlab.notifier@gmail.com',
    password: '0o0o!!!@',
    host: 'smtp.gmail.com',
    port: 465,
    ssl: true
});

var smtpTransport = nodeEmail.createTransport(smtpTransport({
   host : 'smtp.gmail.com',
    secureConnection : false,
    port : 465,
    auth : {
        user : 'jtlab.notifier@gmail.com',
        pass : '0o0o!!!@'
    }
}));


// multer storage setting
var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        if(os.platform()=='win32') {
            callback(null, './tmp/attachFiles');
        } else {
            callback(null, '../tmp/attachFiles');
        }
    },
    filename: function (req, file, callback) {
        callback(null, Date.now() + '_' + file.originalname);
    }
});
// multer storage2 setting
var storage2 = multer.diskStorage({
    destination: function (req, file, callback) {
        if(os.platform()=='win32') {
            callback(null, './tmp/uploads/images');
        } else {
            callback(null, '../tmp/uploads/images');
        }
    },
    filename: function (req, file, callback) {
        callback(null, Date.now() + '_' + file.originalname);
    }
});
/**
 * MySQL 접속 테스트.
 */
router.get('/', function(req, res) {
    var ss = req.session;

    // var queryStr = "select * from c_inf_tbl";
    // //queryStr += " where id='" + req.body.userid + "'";
    // console.log("query str : " + queryStr);
    //
    // var query = conn.query(queryStr, function(err, rows, fields) {
    //     if (! err) {
    //         console.log("query res : ", rows);
    //     }
    //     else {
    //         console.log("error while performing query.");
    //         console.log(err.stack);
    //     }
    // });
    //conn.connect();

    var queryStr = sprintf("SELECT * from c_inf_tbl");
    conn.query(queryStr, queryResult);
    function queryResult(err, rows, fields) {
        if (! err) {
            req.session = rows;
            console.log("the solution is: ", JSON.stringify(req.session));
        } else {
            console.log("error while performing query.");
            console.log(err.stack);

            //res.send("database error!!!");
        }
    }

    //conn.end();
    res.status(200).send('OK');
    //res.render('./test/testView', {session: ss});

});

/**
 * Mysq Connection 테스트.
 */
router.get('/connect', function(req, res) {
    var ss = req.session;

    conn.connect();

    var queryStr = sprintf("SELECT * from c_inf_tbl");
    conn.query(queryStr, [], function(err, rows) {
        if (!err) {
            req.session = rows;
            console.log("the solution is: ", JSON.stringify(req.session));
        } else {
            console.log("error while performing query.");
            console.log(err.stack);
        }
    });

    conn.end();
    res.status(200).send('OK');

});

/*
router.post('/', function(req, res) {
    var ss = req.session;

    //var queryStr = "select * from c_inf_tbl";
    //queryStr += " where id='" + req.body.userid + "'";
    //console.log("query str : " + queryStr);


    
    //res.render('./test/testResult', {session: ss})
});
*/

router.get('/board', function(req, res, next) {
    var ss = req.session;

    var conn = require('./test/connect');
    conn.query('SELECT * FROM board_inf_tbl',
        [],
        function(err, results) {
            if(err) {
                console.log(err);
                res.status(400).send(err);
            } else {
                console.log(JSON.stringify(results));
                res.status(200).send('0k');
            }
        }
    );
    conn.end();


});

// 세션 체크
router.get('/login', function(req, res) {
    var ss = req.session;

    console.log('session : ', JSON.stringify(ss));
    console.log('session : ', ss.id);

    console.log("세션 화면 호출.");

    res.render('./test/testLogin', {'session' : ss});
});

// 세션 체크
router.get('/login2', function(req, res) {
    var ss = req.session;

    console.log('session users : ', JSON.stringify(ss.users));
    console.log('session id : ', ss.id);

    console.log("세션 화면 호출.");

    res.render('./test/testLogin2', {'session' : ss});
});

// 로그인 모듈 체크.
router.get('/login3', function(req, res) {
    var ss = req.session;

    console.log('session users : ', JSON.stringify(ss.users));
    console.log('session id : ', ss.id);

    console.log("세션 화면 호출.");

    res.render('./test/testLogin3', {'session' : ss});
});

// 로그인 체크
router.post('/login/process', function(req, res) {
    var ss = req.session;

    var loginId = req.body.loginId != null ? req.body.loginId : '';
    var loginPwd = req.body.loginPwd != null ? req.body.loginPwd : '';
    var ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (ipAddress.length < 15) {
        ipAddress = ipAddress;
    } else {
        var nyIP = ipAddress.slice(7);
        ipAddress = nyIP;
    }

    console.log(">>> loginID : ", loginId);
    console.log(">>> loginPwd : ", loginPwd);
    console.log(">>> session users : ", JSON.stringify(ss.users));

    if(ss.users!=null) {
        console.log(">>>> usrIp : " + ss.usrIp);
        if(ss.usrIp != ipAddress) {
            res.json({result : 'DUPLICATION', session : ss});
        } else {
            res.json({result : 'LOGINED', session : ss});
        }
    } else {
        if (loginId != 'admin') {
            res.json({result: 'ERR0', session: ss});
        } else if (loginPwd != 'password') {
            res.json({result: 'ERR1', session: ss});
        } else {

            ss.users = {
                usrId : 'ADMIN',
                usrName : '어드민',
                usrIp : ipAddress
            };


            res.status(200).json({result: 'OK', session: ss});
            //res.render('/test/testIndex', {'session' : ss})
        }
    }
});


// 로그인 체크
router.post('/login/process2', function(req, res) {
    var ss = req.session;

    var loginId = req.body.loginId != null ? req.body.loginId : '';
    var loginPwd = req.body.loginPwd != null ? req.body.loginPwd : '';
    var ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    console.log(">>> loginID : ", loginId);
    console.log(">>> loginPwd : ", loginPwd);
    console.log(">>> session users : ", JSON.stringify(ss.users));

    if(ss.users) {
        res.json({result : 'LOGINED', session : ss});
    } else {
        if (loginId != 'admin') {
            res.json({result: 'ERR0', session: ss});
        } else if (loginPwd != 'password') {
            res.json({result: 'ERR1', session: ss});
        } else {

            ss.users = {
                usrId : 'ADMIN',
                usrName : '어드민',
                usrIp : ipAddress
            };
            res.status(200).json({result: 'OK', session: ss});
        }
    }
});


// 로그인 체크
router.post('/login/process3', function(req, res) {
    var ss = req.session;

    var loginId = req.body.loginId != null ? req.body.loginId : '';
    var loginPwd = req.body.loginPwd != null ? req.body.loginPwd : '';
    var ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    var usrId = ss.usrId !=null ? ss.usrId : loginId;
    var usrPwd = loginPwd;

    console.log(">>> loginID : ", loginId);
    console.log(">>> loginPwd : ", loginPwd);
    console.log(">>> session users : ", JSON.stringify(ss.users));

    Login.loginProcess(ipAddress, usrId, usrPwd, ss, function(err, result) {
        if(err) {
            console.log('err : ', err);
        } else {
            res.status(200).json({result: result, session: ss});
        }
    });


});

router.get('/logout', function(req, res, next) {
    var ss = req.session;

    // 세션 삭제.
    ss.destroy(function(err){
        if(err) {
            console.log(">>> destroy err: " + err);
        } else {
            ss = null;
        }
        res.redirect('/test/login2');
    });
});

router.get('/index', function(req, res, next) {
   var ss = req.session;

    console.log(JSON.stringify(ss));
    console.log(JSON.stringify(req.user));

    res.render('./test/testIndex', {'session' : ss});
});

// 에디터 호출.
router.get('/editor', function(req, res) {
    var ss = req.session;

    res.render('./test/testEditor',{session : ss});
});

// 에디터 호출.
router.get('/editor2', function(req, res) {
    var ss = req.session;

    res.render('./test/testEditor2',{session : ss});
});

// 에디터 호출.
router.get('/editor3', function(req, res) {
    var ss = req.session;

    res.render('./test/testEditor3',{session : ss});
});

// 전송처리.
router.post('/editor3/process', function(req, res) {
    var ss = req.session;

    var result = req.body.editText !=null ? req.body.editText : '';

    res.render('./test/resultEditor3',{'session' : ss, 'result' : result});
});

// TextArea 화면 호출.
router.get('/textarea', function(req, res, next) {
    var ss = req.session;

    res.render('./test/testTextArea', {'session' : ss, 'result' : ''});
});

// TextArea 화면 호출.
router.post('/textarea/process', function(req, res, next) {
    var ss = req.session;
    var result = req.body.txtarea != null ? req.body.txtarea : '';

    console.log(">>> textarea : ", result);

    res.render('./test/testTextArea', {'session' : ss, 'result' : result});
});


// 파일업로드 폼 화면 호출.
router.get('/file', function(req, res) {
    var ss = req.session;

    res.render('./test/fileUpload',{session : ss});
});

// 파일업로드 폼 화면 호출.
router.get('/file2', function(req, res) {
    var ss = req.session;

    res.render('./test/fileUpload2',{session : ss});
});

// HTML 테스트.
router.get('/html1', function(req, res, next) {
    var ss = req.session;

    res.render('./test/testDesign', {'session' : ss});
});

// jquery 모바일 테스트
router.get('/m/index', function(req, res, next) {
    var ss = req.session;

    res.render('./test/testMobileWeb', {'session' : ss});
});


// 파일업로드 처리.
var upload = multer({storage : storage2}).single('upload');
router.post('/ckedit/upload', function(req, res) {
    console.log(">>>>> request ckeditor upload ");
    upload(req, res, function(err) {
        console.log("req.body : ", req.body);
        var realUrl = '/uploads/images';
        var file = req.file;
        console.log(">>> file : " + file.originalname);
        var originalFileNm = file.originalname;
        var savedFileNm = file.filename;
        //var fileDest = file.destination;
        var fileSize = file.size;
        console.log("originalFileNm : '%s', savedFile: '%s', size : '%s'", originalFileNm, savedFileNm, fileSize);
        console.log(">>> savedFileNm = " + savedFileNm);
        //console.log(">>>> fileFullPath = " + fileDest);
        console.log(">>> req.body.CKEditorFuncNum : " + req.query.CKEditorFuncNum);
        if(err) {
            //return res.send(err);
            return res.send("<script type=text/javascript>"
                + "alert(에러 메시지 : " + JSON.stringify(err) +")"
                + "</script>");
        } else {
            //return res.json({result : 'OK', fileName : savedFileNm, fileFullPath : fileFullPath, fileSize : fileSize});
            return res.send("<script type=text/javascript>window.parent.CKEDITOR.tools.callFunction("+
                + req.query.CKEditorFuncNum
                + ",'"
                + realUrl + "/" + savedFileNm
                + "','파일을 업로드 하였습니다.'"
                + ");</script>");
        }
    });
});

// 파일 업로드
var upload2 = multer({storage : storage}).single('attchFile');
router.post('/upload', function(req, res) {
    upload2(req, res, function(err) {
        console.log(">>>>> request attach file upload !");
        var file = req.file;
        var orignFileNm = file.originalname;
        var savedFileNm = file.filename;
        var fileSize = file.size;
        var fileFullPath = req.get('host') + '/attachFiles';
        console.log('fullpath = ' + fileFullPath);
        console.log(">>> savedFileNm = " + savedFileNm);
        if (err) {
            return res.send(500);
        } else {

            return res.json({ originName : orignFileNm, fileName: savedFileNm, fileFullPath: fileFullPath, fileSize: fileSize});
        }
    });
});

// 파일 업로드
var upload3 = multer({storage : storage}).single('uploaded_file');
router.post('/android/upload', function(req, res) {
    upload3(req, res, function(err) {
        console.log(">>>>> request android file upload !");
        var file = req.file;
        var orignFileNm = file.originalname;
        var savedFileNm = file.filename;
        var fileSize = file.size;
        var fileFullPath = req.get('host') + '/attachFiles';
        console.log('fullpath = ' + fileFullPath);
        console.log(">>> savedFileNm = " + savedFileNm);
        if (err) {
            console.log(">>> 업로드 에러 : ", JSON.stringify(err));
            return res.send(500);
        } else {

            console.log(">>> 파일 업로드 성공! <<< ");
            //return res.json({ originName : orignFileNm, fileName: savedFileNm, fileFullPath: fileFullPath, fileSize: fileSize});
            return res.sendStatus(200);
        }
    });
});

// multipary 파일 업로드.
router.post('/ckedit/upload2', function(req, res, next) {

    var form = new multiparty.Form();
    //
    form.on('field', function(name, value) {
       console.log('normal field/name ='+name+', value='+value);
    });
    //
    var filename;
    var size;
    form.on('part', function(part) {
        if(part.filename) {
            filename = part.filename;
            size = part.byteCount;
        } else {
            part.resume();
        }

        console.log('Write Streaming file : ' + filename);
        var writeStream = fs.createWriteStream('./tmp/uploads/images/'+filename);
        writeStream.filename = filename;
        part.pipe(writeStream);

        part.on('data', function(chunk) {
            console.log(filename+' read'+chunk.length+'bytes');
        });

        part.on('end',function() {
            console.log(filename + ' Part read complete');
            writeStream.end();
        });
    });

    form.on('close', function() {
        res.send("<script type=text/javascript>window.parent.CKEDITOR.tools.callFunction("+
            + req.query.CKEditorFuncNum
            + ",'"
            + '/uploads/images/' + filename
            + "','파일을 업로드 하였습니다.'"
            + ");</script>");
       //res.status(200).send('Upload complete');
    });

    form.on('progress', function(byteRead, byteExpected) {
       console.log(' Reading total '+byteRead+'/'+byteExpected);
    });

    form.parse(req);

});



// 파일 다운로드
router.get('/download', function(req, res) {
    var path = req.path;
    var file = path+'/attachFiles/cbs.pdf';
    //res.download(file, encodeURIComponent(path.basename(file)));
    res.download(file, path.basename(file));
});


// email test
router.get('/email', function(req, res) {
    var ss = req.session;

    var message = {
        text : '메일 테스트입니다!',
        from : 'jtlab.notifier@gmail.com;',
        to : 'asciiworld@naver.com',
        subject : '메일 테스트이에요!!!'
    };
    emailServer.send(message, function(err, message) {
        if(err) {
            console.log("메일 전송 에러");
            console.log('email send err : ', JSON.stringify(err));
            res.status(500).send('전송에러!\n 전송 에러 메서지 : ' + JSON.stringify(err));
        } else {
            console.log("메일 전송 성공");
            console.log('email message :, ', message);
            res.status(200).send('전송성공!\n 전송 성공 메서지 : ' + message);
        }
    });

});

/**
 *
 */
router.get('/sendEmail', function(req, res, next) {
    var mailOptions = {
        from : '[JT-LAB] <jtlab.tech2@gmail.com>',
        to : '정재연 <asciiworld@naver.com>',
        subject : 'Mail Test 입니다.!',
        text : '<h1>메일 테스트이지요!2</h1>'
    };

    smtpTransport.sendMail(mailOptions, function(err, info) {
        if(err) {
            console.log(err);
            res.end("error");
        } else {
            console.log('accepted : ', info.accepted);
            console.log('envelope : ', info.envelope);
            console.log('messageId : ', info.messageId);
            console.log('response : ', info.response.toString());
            console.log('Message Sent : ' + JSON.stringify(info));
            res.end("sent");
        }
    });
});

/**
 * 스케쥴1 테스트
 */
router.get('/crone', function(req, res) {
    // 년,월,일,시,분,초
   var date = new Date(2017, 4, 19, 20, 50, 00);
    console.log('date', date);
    var j1 = schedule.scheduleJob(date, function() {
       console.log('j1 지정된 날짜 시간 ' + date + '에 실행');
        res.status(200).send('OK');
    });
    console.log('j1 준비완료!!!');
});
/**
 * 스케쥴2 테스트
 */
router.get('/crone2', function(req, res) {
   //var schedule = require('node-schedule');
    // cron 스타일로 설정
    // [MINUTE] [HOUR] [DAY OF MONTH] [MONTH OF YEAR] [DAY OF WEEK] [YEAR (optional)]
    // 분       시      일             월             요일          년
    // (0-59)   (0-23)  (1-31)        (1-12)          (0-7):0,7이  일요일
    var cronStyle = '* * * * *'; // 매분 마다 실행
    var j3 = schedule.rescheduleJob(cronStyle, function() {
       console.log('매분마다 실행');
        res.status(200).send('ok');
    });
    console.log('매분마다 실행할 준비 완료');
});

// 매시 m 분에 실행
/**
 * 스케쥴3 테스트
 */
router.get('/crone3', function(req, res) {
    var rule = new schedule.RecurrenceRule();
    var m = 0;
    rule.minute = m;
    var j2 = schedule.scheduleJob(rule, function() {
       console.log('js 매시 ' + m + '분에 실행');
        res.status(200).send('OK');
    });
    console.log('js 매시 ' + m + '분에 실행 준비 완료!!!');
});

router.get('/dynamic', function(req, res, next) {
    var ss = req.session;

    res.status(200).render('./test/testDynamic',{session : ss});
});

// 이메일 폼
router.get('/emailForm', function(req, res) {

    res.render('./test/testEmail');
});

// 이메일 템플릿 테스트.
router.post('/sendContact', function(req, res) {
console.log('email : ', req.body.email);
console.log('name : ', req.body.name);
console.log('message : ', req.body.message);

    var template = new EmailTemplate(path.join(templateDir, 'newsletter'));
    var locals = {
        email : req.body.email,
        name : req.body.name,
        message : req.body.message
    };
    template.render(locals, function(err, results) {
        if(err) {
            return console.log(err);
        }
        console.log('results : ', JSON.stringify(results));

        smtpTransport.sendMail({
          from : locals.email,
            to : 'macppc@hanmail.net',
            subject: 'Contact Request',
            html : results.html,
            text : results.text,
            css : results.css
        }, function(err, responseStatus) {
            if(err) {
                console.error(err);
                res.send('error');
            } else {
                console.log(responseStatus.message);
                res.end('sent');
            }
        })
    });

});

/**
 * 견적 테스트.
 */
router.get('/estimate', function(req, res, next) {
    var ss = req.session;
    var usrNo = ss.usrNo !=null ? ss.usrNo : '';

    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query('SELECT x.pay_no as payNo, x.pno as pNo, x.pname as pName, x.pay_price as payPrice,'
            + ' x.pay_method as payMethod, DATE_FORMAT(x.pay_date, "%Y%m%d") as payDate, x.use_month_cnt as useMonthCnt,'
            + ' DATE_FORMAT(x.from_dt, "%Y%m%d") as fromDt, DATE_FORMAT(x.to_dt, "%Y%m%d") as toDt,'
            + ' x.opt_use_cnt as optCnt, y.opt_name as optName, y.opt_price as optPrice,'
            + ' y.opt_gigan as optGigan, DATE_FORMAT(y.opt_from, "%Y%m%d") as optFrom, DATE_FORMAT(y.opt_to, "%Y%m%d") as optTo,'
            + ' x.opt1_use_yn as opt1UseYn, x.opt2_use_yn as opt2UseYn, x.opt3_use_yn as opt3UseYn'
            + ' FROM pay_inf_tbl x, pay_opt_inf_tbl y'
            + ' WHERE x.pno = y.pno AND x.expire_yn = "N" AND x.pno = "APP170109ASS" AND x.c_no = ?;',
        [usrNo],
        function(err, results) {
            if (err) {
                console.log('err', err);
            }
            res.render('./test/testEstimate', {'list' : results, 'session' : ss});
        }
    );
    conn.end();
});

// 견적 처리 테스트.
router.post('/estimate/process', function(req, res, next) {
    var ss = req.session;
    var newBasicServiceMonth = 0; var newBasicServiceDay = 0;     // 기본월, 달
    var newOptionService1Month = 0; var newOptionService1Day = 0; // 옵션1 월, 달
    var newOptionService2Month = 0; var newOptionService2Day = 0; // 옵션2 월, 달
    var newOptionService3Month = 0; var newOptionService3Day = 0; // 옵션3 월, 달
    var newOptionService4Month = 0; var newOptionService4Day = 0; // 옵션4 월, 달
    var newOptionService5Month = 0; var newOptionService5Day = 0; // 옵션5 월, 달
    var days = 0, days1 = 0, days2 = 0, days3; var remainPrice = 0;
    var basicPrice = 0; var optPrice1 = 0; var optPrice2 = 0; var optPrice3 = 0; // 기본, 옵션1,2,3 가격
    var giganUsePrice = 0; var giganPayPrice = 0; var discountGiganPayPrice = 0;  // 기간이용률, 기간결제가격, 기간할인가격
    var newBasicPayPrice = 0; var newOptPayPrice1 = 0; var newOptPayPrice2 = 0; var newOptPayPrice3 = 0; // 신규 기본결제가격, 옵션1,2,3 결제가격
    var newMonthPayPrice = 0; var newPayPrice = 0; var newGiganUsePayPrice = 0; newGiganPayPrice = 0; // 신규월이용료, 신규결제가격,  기간이용료, 신규 기간결제가격
    var newGiganDiscountPayPrice = 0; //기간 할인 금액
    var newTotalPlusPayPrice = 0; // 서비스 추가 총금액
    var newPlusPayPrice1 = 0; var newPlusPayPrice2 = 0; var newPlusPayPrice3 = 0; // 추가 가격
    var sumPlusPayPrice1 = 0; var sumPlusPayPrice2 = 0; var sumPlusPayPrice3 = 0; // 추가 합산 가격
    var newPlusDiscountPayPrice1 = 0; var newPlusDiscountPayPrice2 = 2; var newPlusDiscountPayPrice3 = 3;
    //
    var usrNo = ss.usrNo !=null ? ss.usrNo : '';
    var serviceNo = req.body.serviceNo !=null ? req.body.serviceNo : '';
    var optionYn = req.body.optionYn !=null ? req.body.optionYn : '';
    var optionCnt = req.body.optionCnt !=null ? req.body.optionCnt : 0;
    var optionType = req.body.optionType !=null ? req.body.optionType : ''; // AssistPro가 아니면 basic
    var option1CheckYn = req.body.option1CheckYn !=null ? req.body.option1CheckYn : 'N';
    var option2CheckYn = req.body.option2CheckYn !=null ? req.body.option2CheckYn : 'N';
    var option3CheckYn = req.body.option3CheckYn !=null ? req.body.option3CheckYn : 'N';
    var option4CheckYn = req.body.option4CheckYn !=null ? req.body.option4CheckYn : 'N';
    var option5CheckYn = req.body.option5CheckYn !=null ? req.body.option5CheckYn : 'N';
    var option1No = req.body.option1No !=null ? req.body.option1No : '';
    var option2No = req.body.option2No !=null ? req.body.option2No : '';
    var option3No = req.body.option3No !=null ? req.body.option3No : '';
    var option4No = req.body.option4No !=null ? req.body.option4No : '';
    var option5No = req.body.option5No !=null ? req.body.option5No : '';
    var useGiganMonth = req.body.useGiganMonth !=null ? parseInt(req.body.useGiganMonth) : 0;

    console.log('optionYn : ', optionYn);
    console.log('optionCnt :', optionCnt);
    console.log('option1CheckYn : ', option1CheckYn);
    console.log('option2CheckYn : ', option2CheckYn);
    console.log('option3CheckYn : ', option3CheckYn);
    console.log('option4CheckYn : ', option4CheckYn);
    console.log('option5CheckYn : ', option5CheckYn);
    console.log('option1No : ', option1No);
    console.log('option2No : ', option2No);
    console.log('option3No : ', option3No);
    console.log('option4No : ', option4No);
    console.log('option5No : ', option5No);
    console.log('useGiganMonth : ', useGiganMonth);

    // 사용자의 결제정보 취득.
    var conn = mysql.createConnection(config);
    conn.connect();
    if(serviceNo == 'APP170109ASS') {
        // Assist Pro 월이용료
        var basicSrcMonthAmount = 100000;
        var plusService1 = 50000; // 자료실 열람
        var plusService2 = 90000; // 로그분석및 진단지원
        var plusService3 = 35000; // 원격지원
        conn.query('SELECT COUNT(pno) as cnt FROM pay_inf_tbl WHERE expire_yn = "N" AND pno = ? AND c_no = ?;'
            + ' SELECT x.pay_no as payNo, x.pno as pNo, x.pname as pName, x.pay_price as payPrice,'
            + ' x.pay_method as payMethod, DATE_FORMAT(x.pay_date, "%Y%m%d") as payDate, x.use_month_cnt as useMonthCnt,'
            + ' DATE_FORMAT(x.from_dt, "%Y%m%d") as fromDt, DATE_FORMAT(x.to_dt, "%Y%m%d") as toDt,'
            + ' x.opt_use_cnt as optCnt, y.opt_name as optName, y.opt_price as optPrice,'
            + ' y.opt_gigan as optGigan, DATE_FORMAT(y.opt_from, "%Y%m%d") as optFrom, DATE_FORMAT(y.opt_to, "%Y%m%d") as optTo,'
            + ' x.opt1_use_yn as opt1UseYn, x.opt2_use_yn as opt2UseYn, x.opt3_use_yn as opt3UseYn FROM pay_inf_tbl x, pay_opt_inf_tbl y'
            + ' WHERE x.pno = y.pno AND x.expire_yn = "N" AND x.pno = ? AND x.c_no = ?;',
            [serviceNo, usrNo, serviceNo, usrNo],
            function(err, results) {
                if(err) {
                    console.log('err : ', err);
                } else {
                    var cnt = results[0][0].cnt;
                    console.log('기존 서비스 갯수 : ' , cnt);
                    // 기존 서비스 가 있는 지 체크.
                    if(cnt > 0) {
                        var next1 = false;
                        var next2 = false;
                        var next3 = false;
                        results[1].forEach(function(item, idx) {
                            // 기존 남은 금액
                            days = fncRemainDay(item.toDt);
                            console.log('day = ', days);
                            basicPrice = basicSrcMonthAmount * parseInt(days) / 30;
                            if(item.opt1UseYn=="Y" && next1 == false) {
                                days1 = fncRemainDay(item.optTo);
                                next1 = true;
                                console.log('days1 = ', days1);
                                optPrice1 = plusService1 * parseInt(days1) / 30;
                            }
                            if(item.opt2UseYn=="Y" && next2 == false) {
                                days2 = fncRemainDay(item.optTo);
                                console.log('days2 = ', days2);
                                optPrice2 = plusService2 * parseInt(days2) / 30;
                                next2 = true;
                            }
                            if(item.opt3UseYn=="Y" && next3 == false) {
                                days3 = fncRemainDay(item.optTo);
                                console.log('days3 = ', days3);
                                optPrice3 = plusService3 * parseInt(days3) / 30;
                                next3 = true;
                            }
                        });
                        // 기존 남은 총금액
                        remainPrice = parseInt(basicPrice) + parseInt(optPrice1) + parseInt(optPrice2) + parseInt(optPrice3);
                        console.log('기존 서비스의 남은 총금액', remainPrice);
                    }
                    console.log('optionType : ', optionType);
                    var result = {};
                    // 서비스 추가인 경우.
                    if (optionType == "plus") {
                        console.log('추가 서비스');
                        // 부가서비스 "자료실 열람" 추가인 경우
                        if (option1CheckYn == 'Y') {
                            // 추가금액 (월이용료 * 추가달수) + (월이용료 * 추가일수) / 30
                            newPlusPayPrice1 = (parseInt(plusService1) * parseInt(useGiganMonth)) + ((plusService1 * monthToDay(useGiganMonth)) / 30);
                            newPlusDiscountPayPrice1 = parseInt(newPlusPayPrice1) * (10 / 100); // 할인금액
                            sumPlusPayPrice1 = parseInt(newPlusPayPrice1) - parseInt(newPlusDiscountPayPrice1); // 정산 금액
                            console.log('추가서비스1 정산금액', sumPlusPayPrice1);
                        }
                        if (option2CheckYn == 'Y') {
                            // 추가금액 (월이용료 * 추가달수) + (월이용료 * 추가일수) / 30
                            newPlusPayPrice2 = (parseInt(plusService2) * parseInt(useGiganMonth) ) + ((parseInt(plusService2) * monthToDay(useGiganMonth)) / 30);
                            newPlusDiscountPayPrice2 = parseInt(newPlusPayPrice2) * (10 / 100); // 할인 금액
                            sumPlusPayPrice2 = parseInt(newPlusPayPrice2) - parseInt(newPlusDiscountPayPrice2); // 정산 금액
                            console.log('추가서비스2 정산금액', sumPlusPayPrice2);
                        }
                        if (option3CheckYn == 'Y') {
                            // 추가금액 (월이용료 * 추가달수) + (월이용료 * 추가일수) / 30
                            newPlusPayPrice3 = (parseInt(plusService3) * parseInt(useGiganMonth) ) + ((parseInt(plusService3) * monthToDay(useGiganMonth)) / 30);
                            newPlusDiscountPayPrice3 = parseInt(newPlusPayPrice3) * (10 / 100); // 할인 금액
                            sumPlusPayPrice3 = parseInt(newPlusPayPrice3) - parseInt(newPlusDiscountPayPrice3); // 정산금액
                            console.log('추가서비스3 정산금액', sumPlusPayPrice3);
                        }
                        // 총 할인 금액
                        var newTotalDiscountPayPrice = parseInt(newPlusDiscountPayPrice1) + parseInt(newPlusDiscountPayPrice2) + parseInt(newPlusDiscountPayPrice3);
                        console.log('추가서비스 할인 금액', newTotalPlusPayPrice);
                        newTotalPlusPayPrice = parseInt(sumPlusPayPrice1) + parseInt(sumPlusPayPrice2) + parseInt(sumPlusPayPrice3); // 총금액
                        console.log('추가서비스 총금액', newTotalPlusPayPrice);
                        var addResult = {
                            'type': 'plus',
                            'serviceNo' : serviceNo,
                            'basicPayPrice': basicSrcMonthAmount,
                            'optionYn' : optionYn,
                            'optionCnt' : optionCnt,
                            'option1CheckYn' : option1CheckYn,
                            'option2CheckYn' : option2CheckYn,
                            'option3CheckYn' : option3CheckYn,
                            'option1No' : option1No,
                            'option2No' : option2No,
                            'option3No' : option3No,
                            'optPrice1': sumPlusPayPrice1,
                            'optPrice2': sumPlusPayPrice2,
                            'optPrice3': sumPlusPayPrice3,
                            'optDcPrice1': newPlusDiscountPayPrice1,
                            'optDcPrice2': newPlusDiscountPayPrice2,
                            'optDcPrice3': newPlusDiscountPayPrice3,
                            'dcPayPrice': newTotalDiscountPayPrice,
                            'totalPayPrice': newTotalPlusPayPrice
                        };
                        console.log('>>> res !!');
                        //res.json({'result': addResult, 'session': ss});
                    }

                    // 신규인 경우 (월 결제) : DC 가격은 없음.
                    if(useGiganMonth != 12) {
                        newBasicPayPrice = parseInt(basicSrcMonthAmount)  * parseInt(monthToDay(useGiganMonth))  / 30; // 신규 금액 (월이용료 * 신규 일수/30)
                        if(optionYn=="Y") {
                            if(option1CheckYn=="Y") {
                                optPrice1 = parseInt(plusService1) * parseInt(monthToDay(useGiganMonth)) / 30; // 옵션 가격
                            }
                            if(option2CheckYn=="Y") {
                                optPrice2 = parseInt(plusService2) * parseInt(monthToDay(useGiganMonth)) / 30; // 옵션 가격
                            }
                            if(option3CheckYn=="Y") {
                                optPrice3 = parseInt(plusService3) * parseInt(monthToDay(useGiganMonth)) / 30; // 옵션 가격
                            }
                        }
                        newMonthPayPrice = parseInt(newBasicPayPrice) + parseInt(optPrice1) + parseInt(optPrice2) + parseInt(optPrice3); // 월이용료
                        newPayPrice = parseInt(newMonthPayPrice) + parseInt(remainPrice);
                        console.log('신규 월금액', newPayPrice);
                        result = {
                            'type' : 'month',
                            'serviceNo' : serviceNo,
                            'basicPayPrice' : newBasicPayPrice,
                            'optionYn' : optionYn,
                            'optionCnt' : optionCnt,
                            'option1CheckYn' : option1CheckYn,
                            'option2CheckYn' : option2CheckYn,
                            'option3CheckYn' : option3CheckYn,
                            'option1No' : option1No,
                            'option2No' : option2No,
                            'option3No' : option3No,
                            'optPrice1' : optPrice1,
                            'optPrice2' : optPrice2,
                            'optPrice3' : optPrice3,
                            'monthPayPrice' : newMonthPayPrice,
                            'totalPayPrice' : newPayPrice
                        };
                        //res.status(200).json({'result' : result, 'session' : ss});
                        // 기간인 경우 처리. (풀옵션 인경우)
                    } else if(useGiganMonth==12&&option1CheckYn=='Y'&&option2CheckYn=='Y'&&option3CheckYn=='Y') {
                        newBasicPayPrice = parseInt(basicSrcMonthAmount) * parseInt(monthToDay(useGiganMonth)) / 30; // 신규 금액 (월이용료 * 신규 일수/30)
                        if(optionYn=="Y") {
                            optPrice1 = parseInt(plusService1) * parseInt(monthToDay(useGiganMonth)) / 30;
                            optPrice2 = parseInt(plusService2) * parseInt(monthToDay(useGiganMonth)) / 30;
                            optPrice3 = parseInt(plusService3) * parseInt(monthToDay(useGiganMonth)) / 30;
                        }
                        //giganUsePrice = fullPrice * 12; // 기간 이용료
                        giganUsePrice = parseInt(newBasicPayPrice) + parseInt(optPrice1) + parseInt(optPrice2) + parseInt(optPrice3); // 월이용료
                        giganPayPrice = parseInt(giganUsePrice) - (parseInt(giganUsePrice)*(15/100) - parseInt(remainPrice)); // 결제금액
                        discountGiganPayPrice = parseInt(giganUsePrice) * (15/100); // 할인 금액
                        console.log('풀기간 할인금액', discountGiganPayPrice);
                        console.log('풀기간 총금액', giganPayPrice);
                        result = {
                            'type' : 'fullgigan',
                            'dc' : '15',
                            'serviceNo' : serviceNo,
                            'basicPayPrice' : newBasicPayPrice,
                            'optionYn' : optionYn,
                            'optionCnt' : optionCnt,
                            'option1CheckYn' : option1CheckYn,
                            'option2CheckYn' : option2CheckYn,
                            'option3CheckYn' : option3CheckYn,
                            'option1No' : option1No,
                            'option2No' : option2No,
                            'option3No' : option3No,
                            'optPrice1' : optPrice1,
                            'optPrice2' : optPrice2,
                            'optPrice3' : optPrice3,
                            'monthPayPrice' : newMonthPayPrice,
                            'payPrice' : newPayPrice,
                            'usePrice' : giganUsePrice,
                            'totalPayPrice' : giganPayPrice,
                            'dcPayPrice' : discountGiganPayPrice
                        };
                        //res.status(200).json({'result' : result, 'session' : ss});
                    } else if (useGiganMonth==12||option1CheckYn!='Y'||option2CheckYn!='Y'||option3CheckYn!='Y') { // (풀옵션이 아닌 경우,
                        newBasicPayPrice = parseInt(basicSrcMonthAmount) * parseInt(monthToDay(useGiganMonth)) / 30; // 신규 금액 (월이용료 * 신규 일수/30)
                        if(optionYn=="Y") {
                            if(option1CheckYn=="Y") {
                                optPrice1 = parseInt(plusService1) * parseInt(monthToDay(useGiganMonth)) / 30;
                            }
                            if(option2CheckYn=="Y") {
                                optPrice2 = parseInt(plusService2) * parseInt(monthToDay(useGiganMonth)) / 30;
                            }
                            if(option3CheckYn=="Y") {
                                optPrice3 = parseInt(plusService3) * parseInt(monthToDay(useGiganMonth)) / 30;
                            }
                        }
                        //giganUsePrice = fullPrice * 12; // 기간 이용료
                        giganUsePrice = parseInt(newBasicPayPrice) + parseInt(optPrice1) + parseInt(optPrice2) + parseInt(optPrice3); // 월이용료
                        giganPayPrice = parseInt(giganUsePrice) - (parseInt(giganUsePrice)*(10/100) - parseInt(remainPrice)); // 결제금액
                        discountGiganPayPrice = parseInt(giganUsePrice) * (10/100); // 할인 금액
                        console.log('기간 할인금액', discountGiganPayPrice);
                        console.log('기간 총금액', giganPayPrice);
                        result = {
                            'type' : 'gigan',
                            'dc' : '10',
                            'serviceNo' : serviceNo,
                            'basicPayPrice' : newBasicPayPrice,
                            'optionYn' : optionYn,
                            'optionCnt' : optionCnt,
                            'option1CheckYn' : option1CheckYn,
                            'option2CheckYn' : option2CheckYn,
                            'option3CheckYn' : option3CheckYn,
                            'option1No' : option1No,
                            'option2No' : option2No,
                            'option3No' : option3No,
                            'optPrice1' : optPrice1,
                            'optPrice2' : optPrice2,
                            'optPrice3' : optPrice3,
                            'monthPayPrice' : newMonthPayPrice,
                            'payPrice' : newPayPrice,
                            'usePrice' : giganUsePrice,
                            'totalPayPrice' : giganPayPrice,
                            'dcPayPrice' : discountGiganPayPrice
                        };
                        //res.status(200).json({'result' : result, 'session' : ss});
                    } // end if
                }
                res.status(200).json({'result' : result, 'session' : ss});
            }
        );
    } else {
        // 기타 서비스인 경우 처리.
        // 설정.
        var option1Price = 0; var option2Price = 0; var option3Price = 0; var option4Price = 0; var option5Price = 0;
        var sumOptionPrice = 0; var dcPayPrice = 0; var totalPrice = 0; var sumBasicPrice = 0;
        //
        var basicPrice = req.body.servicePrice !=null ? req.body.servicePrice : 0;
        var sumBasicPrice = parseInt(basicPrice) * parseInt(monthToDay(useGiganMonth)) / 30;
        console.log("basic 가격 : ", sumBasicPrice);
        console.log("sum 가격 : ", sumBasicPrice);
        var dcVal = req.body.discount !=null ? req.body.discount : 0;
        if(optionYn=="Y") {
            // 기타 서비스 인 경우 처리.
            if (option1CheckYn == 'Y') {
                option1Price = req.body.option1Price != null ? parseInt(req.body.option1Price) : 0;
            }
            if (option2CheckYn == 'Y') {
                option2Price = req.body.option2Price != null ? parseInt(req.body.option2Price) : 0;
            }
            if (option3CheckYn == 'Y') {
                option3Price = req.body.option3Price != null ? parseInt(req.body.option3Price) : 0;
            }
            if (option4CheckYn == 'Y') {
                option4Price = req.body.option4Price != null ? parseInt(req.body.option4Price) : 0;
            }
            if (option5CheckYn == 'Y') {
                option5Price = req.body.option5Price != null ? parseInt(req.body.option5Price) : 0;
            }
            console.log("basic 1옵션 가격 : ", option1Price);
            console.log("basic 2옵션 가격 : ", option2Price);
            console.log("basic 3옵션 가격 : ", option3Price);
            console.log("basic 4옵션 가격 : ", option4Price);
            console.log("basic 5옵션 가격 : ", option5Price);
        }
        // 옵션 가격 합계
        sumOptionPrice = parseInt(option1Price) + parseInt(option2Price) + parseInt(option3Price) + parseInt(option4Price) + parseInt(option5Price);
        console.log("basic 옵션 합계 : ", sumOptionPrice);
        // 할인 금액
        dcPayPrice = parseInt(sumBasicPrice) + parseInt(sumOptionPrice) * (parseInt(dcVal) / 100);
        console.log("basic 할인 합계 : ", dcPayPrice);
        // 총합계
        totalPrice = parseInt(sumBasicPrice) + parseInt(sumOptionPrice);
        console.log("basic 총합계 : ", totalPrice);

        var result = {
            'type' : 'basic',
            'serviceNo' : serviceNo,
            'basicPayPrice' : sumBasicPrice,
            'optionYn' : optionYn,
            'optionCnt' : optionCnt,
            'option1CheckYn' : option1CheckYn,
            'option2CheckYn' : option2CheckYn,
            'option3CheckYn' : option3CheckYn,
            'option4CheckYn' : option4CheckYn,
            'option5CheckYn' : option5CheckYn,
            'option1No' : option1No,
            'option2No' : option2No,
            'option3No' : option3No,
            'option4No' : option4No,
            'option5No' : option5No,
            'optPrice1' : option1Price,
            'optPrice2' : option2Price,
            'optPrice3' : option3Price,
            'optPrice4' : option4Price,
            'optPrice5' : option5Price,
            'totalPayPrice' : totalPrice,
            'dcPayPrice' : dcPayPrice
        };
        res.status(200).json({'result' : result, 'session' : ss});
    }
    conn.end();
});

// 저장 처리.
router.post('/estimate/save1', function(req, res, next) {
    var ss = req.session;

    var payNo = req.body.payNo !=null ? req.body.payNo : '';
    var cNo = req.body.cNo  !=null ? req.body.cNo : '';
    var pNo  = req.body.pNo  !=null ? req.body.pNo : '';
    var pName = req.body.pName  !=null ? req.body.pName : '';
    var pPrice = req.body.pPrice  !=null ? req.body.pPrice : '';
    var fromDt = req.body.fromDt  !=null ? req.body.fromDt : '';
    var toDt = req.body.toDt  !=null ? req.body.toDt : '';
    var payDateType = req.body.payDateType  !=null ? req.body.payDateType : '';
    var useMonthCnt = req.body.useMonthCnt  !=null ? req.body.useMonthCnt : '';
    var optUseCnt = req.body.optUseCnt  !=null ? req.body.optUseCnt : '';
    var opt1UseYn = req.body.opt1UseYn  !=null ? req.body.opt1UseYn : '';
    var opt2UseYn = req.body.opt2UseYn  !=null ? req.body.opt2UseYn : '';
    var opt3UseYn = req.body.opt3UseYn  !=null ? req.body.opt3UseYn : '';
    var opt4UseYn = req.body.opt4UseYn  !=null ? req.body.opt4UseYn : '';
    var opt5UseYn = req.body.opt5UseYn  !=null ? req.body.opt5UseYn : '';
    var payPrice = req.body.payPrice  !=null ? req.body.payPrice : '';
    var payMethod = req.body.payMethod  !=null ? req.body.payMethod : '';
    var payDate = req.body.payDate  !=null ? req.body.payDate : '';
    var payResult = req.body.payResult  !=null ? req.body.payResult : '';
    var expireYn = req.body.expireYn  !=null ? req.body.expireYn : '';

    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query('INSERT INTO pay_inf_tbl (pay_no, c_no, pno, pname, pprice, from_dt, to_dt, pay_date_type, use_month_cnt,'
        + ' opt_use_cnt, opt1_use_yn, opt2_use_yn, opt3_use_yn, opt4_use_yn, opt5_use_yn, pay_price, pay_method, pay_date,'
        + ' pay_result, expire_yn, insert_dt, insert_usr, update_dt, update_usr) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), ?, now(), ?)',
        [
            payNo, cNo, pNo, pName, pPrice, fromDt, toDt, payDateType, useMonthCnt, optUseCnt, opt1UseYn, opt2UseYn, opt3UseYn,
            opt4UseYn, opt5UseYn, payPrice, payMethod, payDate, payResult, expireYn, ss.usrId, ss.usrId
        ],
        function(err) {
            if(err) {
                console.log('err : ', err);
            }
        res.status(200).json({'session' : ss});
    });
    conn.commit();
    conn.end();

});
// 삭제처리.
router.post('/estimate/delete1', function(req, res, next) {
    var ss = req.session;

    var payNo = req.body.payNo !=null ? req.body.payNo : '';
    var cNo = req.body.cNo !=null ? req.body.cNo : '';
    var pNo  = req.body.pNo  !=null ? req.body.pNo : '';
console.log('payNo = ', payNo);
console.log('cNo = ', cNo);
console.log('pNo = ', pNo);

    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query('DELETE FROM pay_inf_tbl WHERE pay_no = ? AND c_no = ? AND pno = ?',
        [payNo, cNo, pNo],
        function(err) {
            if(err) {
                console.log('err : ', err);
            }
            res.status(200).json({'session' : ss});
        });
    conn.commit();
    conn.end();
});

// 저장 처리2
router.post('/estimate/save2', function(req, res, next) {
    var ss = req.session;
console.log('save2!!!');
    var payNo = req.body.payNo !=null ? req.body.payNo : '';
    var pNo  = req.body.pNo !=null ? req.body.pNo : '';
    var optNo = req.body.optNo !=null ? req.body.optNo : '';
    var optName = req.body.optName !=null ? req.body.optName : '';
    var optPrice  = req.body.optPrice !=null ? req.body.optPrice : '';
    var optGigan = req.body.optGigan !=null ? req.body.optGigan : '';
    var optFrom = req.body.optFrom !=null ? req.body.optFrom : '';
    var optTo = req.body.optTo !=null ? req.body.optTo : '';
    var optPayPrice  = req.body.optPayPrice !=null ? req.body.optPayPrice : '';
    var optPayMethod  = req.body.optPayMethod !=null ? req.body.optPayMethod : '';
    var optPayDate  = req.body.optPayDate !=null ? req.body.optPayDate : '';
    var optPayResult  = req.body.optPayResult !=null ? req.body.optPayResult : '';

    console.log('payNo : ', payNo);
    console.log('pNo : ', pNo);
    console.log('optNo : ', optNo);
    console.log('optName : ', optName);
    console.log('optPrice : ', optPrice);
    console.log('optGigan : ', optGigan);
    console.log('optFrom : ', optFrom);
    console.log('optTo : ', optTo);
    console.log('optPayPrice : ', optPayPrice);
    console.log('optPayMethod : ', optPayMethod);
    console.log('optPayDate : ', optPayDate);
    console.log('optPayResult : ', optPayResult);

    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query('INSERT INTO pay_opt_inf_tbl (pay_no, pno, opt_no, opt_name, opt_price, opt_gigan, opt_from, opt_to,'
        + ' opt_pay_price, opt_pay_method, opt_pay_date, opt_pay_result, insert_dt, insert_usr, update_dt, update_usr)'
        + ' VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), ?, now(), ?)',
        [payNo, pNo, optNo, optName, optPrice, optGigan, optFrom, optTo, optPayPrice, optPayMethod, optPayDate, optPayResult, ss.usrId, ss.usrId],
        function(err) {
            if(err) {
                console.log('err : ', JSON.stringify(err));
            }
            res.status(200).json({'session' : ss});
        });
    conn.commit();
    conn.end();
});
// 삭제 처리.
router.post('/estimate/delete2', function(req, res, next) {
    var ss = req.session;

    var payNo = req.body.payNo !=null ? req.body.payNo : '';
    var pNo = req.body.pNo !=null ? req.body.pNo : '';
    var optNo = req.body.optNo !=null ? req.body.optNo : '';

console.log('payNo = ', payNo);
console.log('cNo = ', cNo);
console.log('pNo = ', pNo);

    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query('DELETE FROM pay_opt_inf_tbl WHERE pay_no = ? AND pno = ?, opt_no = ?'
        [payNo, pNo, optNo],
        function(err) {
            if(err) {
                console.log('err : ', err);
            }
            res.status(200).json({'session' : ss});
        });
    conn.commit();
    conn.end();
});

// 테스트 함수 화면 호출.
router.get('/functions', function(req, res, next) {

    res.render('./test/testFuncs');
});

// 다운로드 화면 호출.
router.get('/down', function(req, res, next) {
    var ss = req.session;

    res.render('./test/testFileDownload', {'session' : ss});
});

// 파일 다운로드 모듈
router.post('/download', function(req, res) {
    var ss = req.session;
    console.log('파일 다운로드 개시');

    console.log('req.body : ', req.body);

    console.log('fileName : ' + req.body.fileName.replace('http://localhost:18080/', './'));
    //var file = req.body.fileName.replace('https://www.jt-lab.co.kr/', './');
    var file = req.body.fileName.replace('http://localhost:18080/', './');
    var ext = file.split('.').pop().toLowerCase();
    console.log("ext = " + ext);
    if(ext=='pdf' || ext=='PDF') {
        file = file.replace('tmp/', '../../');
        //console.log(" file : " + file);
        // 프린트 호출.
        //res.redirect('/library/pdf/viewer.html?file='+encodeURIComponent(file));
        res.redirect('/library/pdf/viewer.html?file='+file);
    } else {
        console.log(" file : " + file);
        //res.download(file, encodeURIComponent(path.basename(file)));
        res.download(file, path.basename(file));
    }
});

/**
 * 메일 테스트.
 */
router.get('/send/email', function(req, res, next) {

    var usrEmail = 'becyu986c@gmail.com';
    //var usrName = results[0].writerNm !=null ? results[0].writerNm : '';
    var compNm = 'Hibiznet';
    var content = '<b>* 접수번호 : 1912351231231 </b><br/>';
    content += '<b>* 댓글자명 : 백유 </b><br/>';
    content += '<b>* 댓글내용 : 좋네요..세상이..참... </b><br/>';
    content += '<a href="http://www.jt-lab.co.kr/assist/service">Assist Pro</a><br/>';

    // 관리자에게 이메일 전송처리.
    sendMail(usrEmail, compNm, content);
});

/**
 * SMS 전송 폼 호출.
 */
router.get('/smsForm', function(req, res, next) {
    var ss = req.session;
    
    
    res.render('./test/testSendSms', {'session' : ss});
});

/*
    문자 테스트.
 */
router.post('/sms', function(req, res, next) {
    var ss = req.session;

    var apiKey = "NCSTFDGR6EPGYKBO";
    var apiSecret = "QNQDFBBHFDFF0CRJWRFPMOV1VQETM6C8";
    var timestamp = Math.floor(new Date().getTime() / 1000);
    var salt = uniqid();
    var signature = crypto.createHmac("md5", apiSecret).update(timestamp + salt).digest('hex');
    var to = req.body.fromTelNo !=null ? req.body.fromTelNo : '';
    var from = req.body.toTelNo !=null ? req.body.toTelNo : '';

    console.log('to : ', to);
    console.log('from : ', from);

    var params = {
        "api_key": apiKey,
        "salt": salt,
        "signature": signature,
        "timestamp": timestamp,
        "to": to,
        "from": from,
        "text": "테스트 메시지입니다!",
        "type": "MMS",
        "image": {
            value: fs.createReadStream('./public/images/no-image.png'),
            options: {
                filename: 'no-image.png',
                contentType: 'image/png'
            }
        }
    };
    // 전송 처리.
    request.post({url:'http://api.coolsms.co.kr/sms/1.6/send', formData: params},function(err, response, body) {
        //console.log("body:", body);
        if(!err && response.statusCode == '200') {
            console.log("body:", body);
            res.json({'session' : ss, 'msg' : JSON.parse(body)});
        } else {
            //console.log('err : ', err);
            res.json({'session' : ss, 'msg' : JSON.parse(body)});
        }
    });

});

// API Test
router.get('/api/get', function(req, res, next) {

    res.status(200).json({});
});

router.post('/api/post', function(req, res, next) {

    res.status(200).json({});
});

router.delete('/api/delete', function(req, res, next) {

    res.status(200).json({});
});


router.get('/api/:id', function(req, res, next) {

    res.status(200).json({});
});

/**
 * Jquery Slide Toggle Test
 */
router.get('/slide', function(req, res, next) {

    res.render('./test/testSlideToggle');
});

/**
 * 배열 파라미터 테스트 화면 호출.
 */
router.get('/params', function(req, res, next) {

    res.render('./test/testArrayParams');
});
/**
 * Array params 처리.
 */
router.post('/arrays', function(req, res, next) {

    console.log('req.body[val1] ', req.body['val1'][0]);
    console.log('req.body[val1] ', req.body['val2'][0]);
    console.log('req.body[val1] ', req.body['val3'][0]);
    console.log('req.body[val1] ', req.body['val1'][0]);

});
/**
 * 싱크 테스트.
 */
router.get('/async', function(req, res, next) {

    var cnt = 2;

        async.waterfall([
            function(callback) {
                console.log('function 1 호출!!!');
                for(var x = 0; x < cnt; x++) {
                    console.log('x = ', x);
                }
                var z = '111';
                callback(null, z);
            },
            function(z, callback) {
                console.log('function 2 호출!!!');
                for(var x = 0; x < cnt; x++) {
                    console.log('x = ', x);
                }
                console.log('z = ', z);
                callback(null);
            }
        ], function (err) {
            console.log(err);
            // result에는 '끝'이 담겨 온다.
            //console.log(' async result : ', result);
        });


});

/**
 *  테스트.
 */
router.get('/async2', function(req, res, next) {
/*
    var arr = []
    for(var i = 0; i < 5; i++){
        arr[i] = function(id) {
            return function(){
                return id;
            }
        }(i);
    }
    for(var index in arr) {
        console.log(arr[index]());
    }
*/
    var pName = ['test1','test2'];
    var optName = ['opt1', 'opt2'];

    for(var i=0; i<pName.length; i++) {
        var conn = mysql.createConnection(config);
        conn.connect();
        conn.query('INSERT INTO test_product_tbl(pname, ins_dt) VALUES(?, now());',
            [pName[i]],
            function (err, results) {
                if (err) {
                    console.log('pName[' + i + '] : ', pName[i]);
                    console.log('err : ', err);
                } else {
                    console.dir(results);
                }
            });
        conn.commit();
        conn.end();

        /*
        var conn = mysql.createConnection(config);
        conn.connect();
        conn.query('SELECT MAX(pno) as pno FROM test_product_tbl',
            [],
            function (err, results) {
                if (err) {
                    console.log('err : ', err);
                } else {
                    console.log('opName[' + i + '] : ', optName[i]);
                    console.log('results[0].pno : ', results[0].pno);

                    var conn = mysql.createConnection(config);
                    conn.connect();
                    conn.query('INSERT INTO test_product_opt_tbl(pno, opt_nm, ins_dt) VALUES(?, ?, now());',
                        [results[0].pno, optName[i]],
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
            });
        conn.end();
        */
        var conn = mysql.createConnection(config);
        conn.connect();
        conn.query('SELECT @ret := MAX(pno) as pno FROM test_product_tbl;'
            + 'INSERT INTO test_product_opt_tbl(pno, opt_nm, ins_dt) VALUES(@ret, ?, now());',
            [optName[i]],
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
    res.status(200).send('OK');

});


/**
 *  테스트.
 */
router.get('/async3', function(req, res, next) {

    var pName = ['test1','test2'];
    var optName = ['opt1', 'opt2'];

    for(var i=0; i<pName.length; i++) {

        (function() {
            var idx = i;

        async.waterfall([
            function (callback) {

console.log('>>> No1 : ' + idx + '\n');
                var conn = mysql.createConnection(config);
                conn.connect();
                conn.query('INSERT INTO test_product_tbl(pname, ins_dt) VALUES(?, now());',
                    [pName[idx]],
                    function (err, results) {
                        if (err) {
                            console.log('pName[' + idx + '] : ', pName[idx]);
                            console.log('err : ', err);
                        } else {
                            console.dir(results);
                            var conn = mysql.createConnection(config);
                            conn.connect();
                            conn.query('SELECT MAX(pno) as pno FROM test_product_tbl;',
                                [], function(err, results) {
                                    if(err) {
                                        console.log('err : ', err);
                                    } else {
                                        var values = results[0].pno;
                                        console.log('>>> values : ', values);
                                        callback(null, values);
                                    }
                                }
                            );
                            conn.end();
                        }
                    });
                conn.commit();
                conn.end();
            }
            , function (retVal, callback) {
console.log('>>> No2 : ' + idx + '\n');
                var conn = mysql.createConnection(config);
                conn.connect();
                conn.query('INSERT INTO test_product_opt_tbl(pno, opt_nm, ins_dt) VALUES(?, ?, now());',
                    [retVal, optName[idx]],
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
            } // end function
        ], function (err, result) {
            // result에는 '끝'이 담겨 온다.
            console.log(' async result : ', result);
        });
      })();

    }

    res.status(200).send('OK');

});

/**
 * Request 모듈 테스트.
 */
router.get('/request', function(req, res, next) {

    var ss = req.session;
    var usrId = req.query.usrId !=null ? req.query.usrId : '';
console.log('usrId : ', usrId);

    request('http://localhost:18080/common/useAuth/'+usrId, function(err, results) {
        if(err) {
            console.log('err : ', err);
            res.status(500).send('서버 에러입니다.');
        } else {
            res.status(200).send(JSON.parse(results.body));
        }
    });

});


/**
 * 상품 폼 호출.
 */
router.get('/product', function(req, res, next) {

    res.render('./test/testProducts');
});

/**
 * 상품 저장 테스트.
 */
router.post('/product/save', function(req, res, next) {
    
    var pName = req.body['pName'] !=null ? req.body['pName'] : '';
    var optName = req.body['optName'] !=null ? req.body['optName'] : '';
    var aPname = []; var aOptName = [];
    var sPname; var sOptName;

    console.log('pName.length : ', pName.length);
    for(var i = 0; i < pName.length; i++) {

        aPname[i] = pName[i] !=null ? pName[i] : '';
        aOptName[i] = optName[i] !=null ? optName[i] : '';
        console.log('aPname['+i+'] : ', aPname[i]);
        console.log('aOptName['+i+'] : ', aOptName[i]);

        // 저장 처리.
        async.waterfall([
            function(callback) {
                sPname = aPname[i];
                sOptName = aOptName[i];
                var conn = mysql.createConnection(config);
                conn.connect();
                conn.query('INSERT INTO test_product_tbl(pname, ins_dt) VALUES(?, now());'
                    + 'SELECT LAST_INSERT_ID() as no;',
                        [sPname],
                    function(err, results) {
                        if(err) {
                            console.log('err : ', err);
                        } else {
                            callback(null, results[1][0].no);
                        }
                    });
                conn.commit();
                conn.end();
            },
            function(retVal, callback) {
                var conn = mysql.createConnection(config);
                conn.connect();
                conn.query('INSERT INTO test_product_opt_tbl(pno, opt_nm, ins_dt) VALUES(?, ?, now());',
                    [retVal, sOptName],
                    function(err, results) {
                        if(err) {
                            console.log('err : ', err);
                        } else {
                            console.dir(results);
                            callback(null);
                        }
                    });
                conn.commit();
                conn.end();
            } // end function

        ], function (err, result) {
            // result에는 '끝'이 담겨 온다.
            console.log(' async result : ', result);
        });
    }

    res.render('./test/testProducts');

});

/**
 * 날짜 구하기 테스트.
 */
router.get('/addDate', function(req, res, next) {

    // 월 단위로 (1, 12)
    var addDay = '1';
    var str = '-';

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
    var d = nowDate.getDate() - 1;
    if (m < 10) m = "0" + m;
    if (d < 10) d = "0" + d;
    var retVal = y + str + m + str + d;


    res.status(200).send('날짜 : ' + retVal);

});


/**
 * 상품 저장 테스트.
 */
router.post('/product/save2', function(req, res, next) {

    var pName = req.body['pName'] !=null ? req.body['pName'] : '';
    var optName = req.body['optName'] !=null ? req.body['optName'] : '';
    var aPname = []; var aOptName = [];
    var sPname; var sOptName;

    console.log('pName.length : ', pName.length);
    for(var i = 0; i < pName.length; i++) {

        aPname[i] = pName[i] !=null ? pName[i] : '';
        aOptName[i] = optName[i] !=null ? optName[i] : '';
        console.log('aPname['+i+'] : ', aPname[i]);
        console.log('aOptName['+i+'] : ', aOptName[i]);

        // 저장 처리.
        async.waterfall([
            function(callback) {
                sPname = aPname[i];
                sOptName = aOptName[i];
                var conn = mysql.createConnection(config);
                conn.connect();
                conn.query('INSERT INTO test_product_tbl(pname, ins_dt) VALUES(?, now());'
                    + 'SELECT LAST_INSERT_ID() as no;',
                    [sPname],
                    function(err, results) {
                        if(err) {
                            console.log('err : ', err);
                        } else {
                            callback(null, results[1][0].no);
                        }
                    });
                conn.commit();
                conn.end();
                async.waterfall([
                    function(callback) {
                        console.log('!!!');
                        callback(null);
                    },
                ], function (err, result) {
                    // result에는 '끝'이 담겨 온다.
                    console.log(' async result : ', result);
                });

            },
            function(retVal, callback) {
                var conn = mysql.createConnection(config);
                conn.connect();
                conn.query('INSERT INTO test_product_opt_tbl(pno, opt_nm, ins_dt) VALUES(?, ?, now());',
                    [retVal, sOptName],
                    function(err, results) {
                        if(err) {
                            console.log('err : ', err);
                        } else {
                            console.dir(results);
                            callback(null);
                        }
                    });
                conn.commit();
                conn.end();
            } // end function

        ], function (err, result) {
            // result에는 '끝'이 담겨 온다.
            console.log(' async result : ', result);
        });
    }

    res.render('./test/testProducts');

});

/**
 * 유틸 공통 함수 테스트.
 */
router.get('/util', function(req, res, next) {
    var ss = req.session;

    var data = Util.fnNull(req.query.data);
    console.log('data = ', data);
    var won = 10000;
    won = Util.fnComma(won);


    res.status(200).send('data : ' + data + ' ; won = ' + won);
});


/**
 * 잔여 일수 계산
 * fncRemainDay(20170501)
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


/**
 * 이메일 발송 모듈.
 * @param senderEmail
 * @param sender
 * @param content
 */
function sendMail(receiverEmail, receiver, content) {

    var title = '[JT-LAB] AssistPro 서비스 진행상태 알림 안내';
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

//class
class Polygon {
    // ..and an (optional) custom class constructor. If one is
    // not supplied, a default constructor is used instead:
    // constructor() { }
    constructor(height, width) {
        this.name = 'Polygon';
        this.height = height;
        this.width = width;
    }

    // Simple class instance methods using short-hand method
    // declaration
    sayName() {
        ChromeSamples.log('Hi, I am a ', this.name + '.');
    }

    sayHistory() {
        ChromeSamples.log('"Polygon" is derived from the Greek polus (many) ' +
            'and gonia (angle).');
    }

    // We will look at static and subclassed methods shortly
}



module.exports = router;

/*
 create table if not exists `test_product_tbl` (
 `pno` int(11) not null auto_increment comment '번호',
 `pname` varchar(20) null comment '상품명',
 `ins_dt` datetime null comment '작성일',
 primary key(`pno`)
 ) default charset = utf8 comment '상품테이블';

 create table `test_product_opt_tbl` (
 `opno` int(11) not null auto_increment comment '옵션번호',
 `pno` int(11) not null comment '상품번호',
 `opt_nm` varchar(20) null comment '옵션명',
 `ins_dt` datetime null comment '작성일',
 primary key(`opno`)
 ) default charset = utf8 comment '옵션테이블';

 commit;

 select * from test_product_tbl;

 select * from test_product_opt_tbl;

 delete from test_product_tbl;

 delete from test_product_opt_tbl;

 */