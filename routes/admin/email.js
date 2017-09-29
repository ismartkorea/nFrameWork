/*
 * 모듈명  : visit.js
 * 설명    : 관리자화면 '이메일전송 관리' 에 대한 모듈.
 * 작성일  : 2017년 5월 19일
 * author  : HiBizNet
 * copyright : JT-LAB
 * version : 1.0
 */
var express = require('express');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var flash = require('connect-flash');
var nodeEmail =require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
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


var smtpTransport = nodeEmail.createTransport(smtpTransport({
    host : 'smtp.gmail.com',
    secureConnection : false,
    port : 465,
    auth : {
        user : 'jtlab.notifier@gmail.com',
        pass : '0o0o!!!@'
    }
}));

// 게시글 리스트 호출.
router.get('/', function(req, res) {

    var ss = req.session;
    //console.log(">>> userId = " + ss.usrId);
    //console.log(">>> userName = " + ss.usrName);
    console.log(">>> usrLevel = " + ss.usrLevel);

    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {

        var srchType = req.query.srchType != null ? req.query.srchType : "";
        var srchText = req.query.srchText != null ? req.query.srchText : "";
        console.log(">>> srchType : " + srchType);
        var addSQL = "";
        if (srchType == "title") {
            addSQL = ' WHERE title LIKE concat("%", ?, "%")';
        } else if (srchType == "writer") {
            addSQL = ' WHERE writer LIKE concat(?,"%")';
        }
        // 페이징 처리.
        var reqPage = req.query.page ? parseInt(req.query.page) : 0;
        //console.log(">>> reqPage = " + reqPage);
        var offset = 3;
        var page = Math.max(1, reqPage);
        //console.log(">>> page = " + page);
        var limit = 10;
        var skip = (page - 1) * limit;

        conn.connect();
        // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
        conn.query('SELECT count(*) as cnt from sendemail_inf_tbl' + addSQL
            + '; SELECT @rownum:=@rownum+1 as no, from_usr_nm as fromUsrNm, from_usr_email as fromUsrEmail, to_usr_nm as toUsrNm,'
            + ' to_usr_email as toUsrEmail, service_nm as serviceNm, content as content, send_yn as sendYn,'
            + ' send_result as sendResult, error_desc as errorDesc,'
            + ' DATE_FORMAT(send_date, "%Y-%m-%d %H:%m") as sendDate, DATE_FORMAT(ins_dt, "%Y-%m-%d") as insDt,'
            + ' DATE_FORMAT(upd_dt, "%Y-%m-%d") as updDt FROM sendemail_inf_tbl, (SELECT @rownum:=0) TEMP' + addSQL
            + ' ORDER BY sendDate DESC LIMIT ' + skip + ', ' + limit + ";",
            [srchText, srchText],
            function (err, results) {
                if (err) {
                    console.log('error : ', err.message);
                } else {
                    var count = results[0][0].cnt;
                    var maxPage = Math.ceil(count / limit);

                    res.render('./admin/email/list', {
                        rList: results[1],
                        srchType: srchType,
                        srchText: srchText,
                        page: page,
                        maxPage: maxPage,
                        offset: offset,
                        session: ss
                    });
                    conn.end();
                }
            });
    } else {
        res.redirect('/admin');
    }
});
/**
 *
 */
router.post('/search', function(req, res) {
    console.log('routes 게시글 검색 처리 호출');
    var ss = req.session;
    console.log(">>> search type = " + req.body.srchType);
    console.log(">>> search word = " + req.body.srchText);
    var srchType = req.body.srchType != null ? req.body.srchType : "";
    var srchText = req.body.srchText != null ? req.body.srchText : "";
    console.log(">>> srchType : " + srchType);
    var addSQL = "";

    if(srchType=="title") {
        addSQL =  ' where title like concat("%", ?, "%")';
    } else if(srchType=="writer") {
        addSQL =  ' where writer like concat(?,"%")';
    }
    // 페이징 처리.
    var reqPage = req.query.page ? parseInt(req.query.page) : 0;
    //console.log(">>> reqPage = " + reqPage);
    var offset = 3;
    var page = Math.max(1,reqPage);
    //console.log(">>> page = " + page);
    var limit = 10;
    var skip = (page-1)*limit;

    conn.connect();
    conn.query('SELECT count(*) as cnt from sendemail_inf_tbl' + addSQL
        + '; SELECT @rownum:=@rownum+1 as no, from_usr_nm as fromUsrNm, from_usr_email as fromUsrEmail, to_usr_nm as toUsrNm,'
        + ' to_usr_email as toUsrEmail, service_nm as serviceNm, content as content, send_yn as sendYn,'
        + ' send_result as sendResult, error_desc as errorDesc,'
        + ' DATE_FORMAT(send_date, "%Y-%m-%d %H:%m") as sendDate, DATE_FORMAT(ins_dt, "%Y-%m-%d") as insDt,'
        + ' DATE_FORMAT(upd_dt, "%Y-%m-%d") as updDt FROM sendemail_inf_tbl, (SELECT @rownum:=0) TEMP' + addSQL
        + ' ORDER BY sendDate DESC LIMIT ' + skip + ', ' + limit + ";",
        [srchText, srchText],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                var count = results[0][0].cnt;
                var maxPage = Math.ceil(count/limit);

                res.render('./admin/visit/list', {rList : results[1], srchType: srchType, srchText : srchText, page : page, maxPage: maxPage, offset: offset, session : ss});
            }
        });
    conn.end();
});

/**
 * 메일 전송 처리.
 */
router.post('/send', function(req, res, next) {
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
        sender = 'JT-LAB < jtlab.tech2@gmail.com > ';
        senderName = '관리자';
        receiver = usrEmail;
        receiverName = usrName;
    } else {
        sender = usrEmail;
        senderName = usrName;
        receiver =  'JT-LAB < jtlab.tech2@gmail.com > ';
        receiverName = '관리자';
    }
    var title = "[JT-LAB] AssistPro 서비스 진행상태 알림 안내";
    // mail 콘텐츠 셋팅.
    var mailOptions = {
        from : sender,
        to : receiver,
        subject : title,
        text : mailTemplete(title, sender,receiver, senderName, receiverName, content)
    };

    smtpTransport.sendMail(mailOptions, function(err, info) {
        if(err) {
            console.log(err);
            //res.end("error");
        } else {
            console.log('accepted : ', info.accepted);
            console.log('envelope : ', info.envelope);
            console.log('messageId : ', info.messageId);
            console.log('response : ', info.response.toString());
            console.log('Message Sent : ' + JSON.stringify(info));
            //res.end("sent");
        }
    });

});

// templte
var mailTemplete = function(title, fromEmail, toEmail, fromName, toName, content) {

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