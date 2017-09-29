var express = require('express');
var email = require('emailjs');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var flash = require('connect-flash');
var router = express.Router();
// email server
var emailServer = email.server.connect({
    user: 'jtlab.notifier@gmail.com',
    password: '0o0o!!!@',
    host: 'smtp.gmail.com',
    port: 465,
    ssl: true
});

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));
router.use(methodOverride("_method"));
router.use(flash());

/**
 * 메일 전송 처리.
 */
router.post('/', function(req, res, next) {
    var ss = req.session;
    var sender; var receiver; var senderName; var receiverName;

    var senderType = req.body.senderType !=null ? req.body.senderType : '';
    var usrEmail = req.body.usrEmail !=null ? req.body.usrEmail : '';
    console.log("사용자 이메일 : " + usrEmail);
    var usrName = req.body.usrName !=null ? req.body.usrName : '';
    console.log("사용자명 : " + usrEmail);
    var content = req.body.content !=null ? req.body.content : '';
    console.log("내용 : " + content);

    if(senderType == "M") {
        sender = 'JT-LAB < jtlab.tech2@gmail.com >';
        senderName = '관리자';
        receiver = usrName + ' < ' + usrEmail + '> ';
        receiverName = usrName;
    } else {
        sender = usrName + ' < ' + usrEmail + ' > ';
        senderName = usrName;
        receiver = 'JT-LAB < jtlab.tech2@gmail.com >';
        receiverName = '관리자';
    }
    var title = "[JT-LAB} 알림 안내";
    var message = {
        text : mailTemplete(title, sender,receiver, senderName, receiverName, content),
        from : sender,
        to : email(receiver),
        subject : title
    };
    emailServer.send(message, function(err, message) {
        if(err) {
            console.log('email send err : ', err);
        } else {
            console.log('email message :, ', message);
        }
    });

});

// templte
var mailTemplete = function(title, fromEmail, toEmail, fromName, toName, content) {

    /*
    var html = "<!DOCTYPE html><html lang='ko'><meta charset='utf-8'><meta http-equiv='X-UA-Compatible' content='IE=edge'<meta name='viewport' content='width=device-width, initial-scale=1'>";
    html += "<head><title>JT-LAB Email</title>";
    html += "<!--[if lt IE 9]><script src='https://oss.maxcdn.com/libs/html5shiv/3.7.0/html5shiv.js'></script><script src='https://oss.maxcdn.com/libs/respond.js/1.4.2/respond.min.js'></script><![endif]-->";
    html += "</head><body><div></div><div><h3>JT-LAB 메일공지</h3></div><div>보내는 분 ("+ fromName +") : "+ fromEmail +"</div><div>받는 분 ("+ toName +") : "+ toEmail +"</div>";
    html += "<div>제목 : " + title + "</div>";
    html += "<div>" + content + "</div>";
    html += "</body></html>";
    */
    var msg = "제목 : " + title + "\n";
    msg += "========================================================================================================\n";
    msg += "From : " + fromEmail + " ("+fromName+"), To : " + toEmail + " (" + toName + ")\n";
    msg += "========================================================================================================\n";
    msg += " 본 메일은 AssistPro 고객님의 서비스에 대한 진행상황 알림 메일 입니다.\n";
    msg += " PC / 모바일웹을 통해 접속하여 아래의 변동 사항을 확인하여 주세요!\n";
    msg += "========================================================================================================\n";
    msg += content+"\n";
    msg += "========================================================================================================\n";
    msg += " Copyright by JT-LAB, Assist PRO\n";
    msg += "==========================================================================================================";

    return msg;
};

module.exports = router;