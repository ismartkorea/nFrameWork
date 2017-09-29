/*
 * 모듈명  : assist.js
 * 설명    : 'Assist Pro' 에 대한 모듈.
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
var nodeEmail =require('nodemailer');
var EmailTemplate = require('email-templates').EmailTemplate;
var path = require('path');
var templateDir = path.resolve(__dirname, 'templates');
var smtpTransport = require('nodemailer-smtp-transport');
var mongoose = require('mongoose');
var async = require('async');
var login = require('./common/loginCheck');
var router = express.Router();
var SessionSchema = require('./common/SessionSchema.js');
var Login = new login();
//var sprintf = require('sprintf-js').sprintf;
//var vsprintf = require('sprintf-js').vsprintf;
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));
router.use(methodOverride("_method"));
router.use(flash());
// Mysql setting
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

var i=0; // 첨부파일명 구분용 숫자.
var maxFileCount = 6;  // 첨부파일 허용 갯수.
var setPath = '';
// os별 path setting
if(os.platform()=='win32') {
    setPath = './tmp/attachFiles/';
} else {
    //setPath = '../tmp/attachFiles/';
    setPath = './tmp/attachFiles/';
}

// storage setting
var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        var stat = null;
        var dateTimeStamp = Date.now();

        try {
            stat = fs.statSync(setPath+dateTimeStamp);
        } catch (err) {
            console.log("sync err : " + JSON.stringify(err));
            fs.mkdirSync(setPath+dateTimeStamp);
        }
        if(stat && !stat.isDirectory()) {
            throw new Error('Directory cannot be created');
        }
        callback(null, setPath+dateTimeStamp);
    },
    filename: function (req, file, callback) {
        i++;
        callback(null, file.originalname);
        if (maxFileCount == i) {
            i = 0;
        }
    }
});

/**
 * AssistPro 메인 인덱스 화면 호출.
 */
router.get('/', function(req, res) {
    var ss = req.session;
    if(ss.usrId == null) {
        console.log("Assist PRO index 화면 호출");
        /**
         * 자료실 5개 게시물 조회.
         * select @rownum:=@rownum+1 as num, dno as dNo, data_nm as dataNm, maker_nm as makerNm,
         * model_no as modelNo, model_nm as modelNm, auth_level as authLevel from data_inf_tbl,
         * (SELECT @rownum:=0) TMP order by ins_date desc limit 5;
         * 공지사항 5개 게시물 조회.
         * select @rownum:=@rownum+1 as num, title as title, DATE_FORMAT(date, "%Y-%m-%d") as date FROM assist_announce_inf_tbl,
         * (SELECT @rownum:=0) TMP order by date desc limit 5;
         */
        conn.query('SELECT @rownum:=@rownum+1 as num, x.dno as dNo, x.data_nm as dataNm, x.model_no as modelNo,'
            + ' (select name from car_cate_inf_tbl where parent_no is null and category_no = x.maker_nm) as makerNm,'
            + ' (select name from car_cate_inf_tbl where parent_no is not null and category_no = x.model_nm) as modelNm,'
            + ' x.auth_level as authLevel FROM data_inf_tbl x, (SELECT @rownum:=0) TMP ORDER BY x.ins_date desc LIMIT 5;'
            + ' select @rownum:=@rownum+1 as num, title as title, DATE_FORMAT(date, "%Y-%m-%d") as date FROM assist_announce_inf_tbl,'
            + ' (SELECT @rownum:=0) TMP order by date desc limit 5;',
            [],
            function(err, results) {
                if (err) {
                    console.log('error : ', err.message);
                    res.render('error', {message: err.message, error : err, session: ss});
                } else {
                    res.render('./assist/index', { count : 0, tCount : 0, nList : '', cList : results[0], cResult : '',
                        dResult : '', eResult : '', aList : results[1], session : ss});
                }
            }
        );
    } else {
        console.log(" Assist PRO 사용 정보 조회");
        var usrId = ss.usrId;

        conn.query('SELECT count(x.order_no) as count from pay_info_tbl x, order_detail_inf_tbl y'
            + ' WHERE x.order_no = y.order_no AND y.p_code = "APP170109ASS"'
            + ' AND x.pay_result = "paid" AND x.expire_yn = "N" AND x.usr_id = ?;'
            + ' SELECT x.order_no as payNo, y.p_code as pNo, y.p_nm as pName,'
            + ' (SELECT COUNT(a.order_no) FROM order_detail_inf_tbl a, pay_info_tbl b WHERE a.order_no = b.order_no AND a.p_uniq_code = "ASS1" AND a.p_div = "O" AND b.pay_result = "paid" AND b.expire_yn = "N" AND b.usr_id = ?) as optUseCnt,'
            + ' (SELECT CASE WHEN COUNT(a.order_no) = 0 THEN "N" WHEN COUNT(a.order_no) > 0 THEN "Y" ELSE "N" END  FROM order_detail_inf_tbl a, pay_info_tbl b WHERE a.order_no = b.order_no AND a.p_code = "APP170109ASS1" AND a.p_div = "O" AND b.pay_result = "paid" AND b.expire_yn = "N" AND b.usr_id = ?) as opt1UseYn,'
            + ' (SELECT CASE WHEN COUNT(a.order_no) = 0 THEN "N" WHEN COUNT(a.order_no) > 0 THEN "Y" ELSE "N" END  FROM order_detail_inf_tbl a, pay_info_tbl b WHERE a.order_no = b.order_no AND a.p_code = "APP170109ASS2" AND a.p_div = "O" AND b.pay_result = "paid" AND b.expire_yn = "N" AND b.usr_id = ?) as opt2UseYn,'
            + ' (SELECT CASE WHEN COUNT(a.order_no) = 0 THEN "N" WHEN COUNT(a.order_no) > 0 THEN "Y" ELSE "N" END  FROM order_detail_inf_tbl a, pay_info_tbl b WHERE a.order_no = b.order_no AND a.p_code = "APP170109ASS3" AND a.p_div = "O" AND b.pay_result = "paid" AND b.expire_yn = "N" AND b.usr_id = ?) as opt3UseYn,'
            + ' x.expire_yn as expireYn'
            + ' FROM pay_info_tbl x, order_detail_inf_tbl y WHERE x.order_no = y.order_no AND y.p_code = "APP170109ASS"'
            + ' AND x.pay_result = "paid" AND x.expire_yn = "N" AND x.usr_id = ? ORDER BY x.insert_dt DESC;',
            [usrId, usrId, usrId, usrId, usrId, usrId],
            function(err, results) {
            if (err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error: err, session: ss});
            } else {
                if(results[0][0].count > 0) {
                    ss.useAppYn = 'Y';
                }
                if(results[1].length > 0) {
                    ss.payNo = results[1][0].payNo;
                    ss.pNo = results[1][0].pNo;
                    ss.pName = results[1][0].pName;
                    ss.optUseCnt = results[1][0].optUseCnt;
                    ss.opt1UseYn = results[1][0].opt1UseYn;
                    ss.opt2UseYn = results[1][0].opt2UseYn;
                    ss.opt3UseYn = results[1][0].opt3UseYn;
                    ss.opt4UseYn = '';
                    ss.opt5UseYn = '';
                    ss.expireYn = results[1][0].expireYn;
                } else {
                    ss.payNo = '';
                    ss.pNo = '';
                    ss.pName = '';
                    ss.optUseCnt = '';
                    ss.opt1UseYn = '';
                    ss.opt2UseYn = '';
                    ss.opt3UseYn = '';
                    ss.opt4UseYn = '';
                    ss.opt5UseYn = '';
                    ss.expireYn = '';
                }
            }
        });

        /**
         * 사용자가 확인하지 않은 갯수 조회.
         * select count(req_no) as cnt from assist_qna_tbl where ins_usr_id = '' and view_yn = "N" and process_status NOT IN ("") order by upd_dt desc;
         * 총 갯수 조회.
         * select count(req_no) as tCnt from assist_qna_tbl where process_status NOT IN ("") and ins_usr_id = ? order by upd_dt desc;
         * 리스트 조회.
         * select req_no as reqNo, case when process_status = "tmp" then "임시저장" when process_status = "prc" then "진행중"
         * when process_status = "sav" then "임시저장" when process_status = "mts" then "답변작성중" when process_status = "rct" then "진행대기"
         * when process_status = "cmp" then "완료" when process_status = "nop" then "장기미처리" else "" end as processStatus,
         * DATE_FORMAT(ins_dt,"%Y년%m월%d일 %H시%i분") as insDt, ins_usr_nm as insUsrNm,
         * DATE_FORMAT(upd_dt,"%Y-%m-%d") as updDt, upd_usr_nm as updUsrNm from assist_qna_tbl
         * where view_yn = "N" and process_status NOT IN ("") and ins_usr_id = '' order by upd_dt desc limit 5;
         * 자료실 게시물 조회.
         * select @rownum:=@rownum+1 as num, x.dno as dNo, x.data_nm as dataNm, x.model_no as modelNo,
         * (select name from car_cate_inf_tbl where parent_no is null and category_no = x.maker_nm) as makerNm,
         * (select name from car_cate_inf_tbl where parent_no is not null and category_no = x.model_nm) as modelNm,
         * x.auth_level as authLevel from data_inf_tbl x, (SELECT @rownum:=0) TMP order by x.ins_date desc limit 5;
         * 접속이력테이블 조회.
         * select DATE_FORMAT(MAX(cin_date), "%Y년%m월%d일 %H:%i") as inDate from conn_his_tbl where cid = '';
         * 결제이력테이블 조회.
         * select TO_DAYS(to_date) - TO_DAYS(from_date) as totalDays, TO_DAYS(to_date) - TO_DAYS(now()) as leftDays
         * from pay_his_inf_tbl a, pay_his_detail_inf_tbl b where a.pay_no = b.pay_no and c_no = ? and b.pno = "APP170109ASS";
         * 임시저장/접수/완료 갯수 조회.
         * select (select count(req_no) from assist_qna_tbl where process_status in ("prc","mts") and ins_usr_id = ?) as prcCnt,
         * (select count(req_no) from assist_qna_tbl where process_status = "rct" and ins_usr_id = ?) as rctCnt,
         * (select count(req_no) from assist_qna_tbl where process_status = "cmp" and ins_usr_id = ?) as cmpCnt from dual;
         * 공지사항 정보 조회.
         * select @rownum:=@rownum+1 as num, title as title, DATE_FORMAT(date, "%Y-%m-%d") as date FROM assist_announce_inf_tbl,
         * (SELECT @rownum:=0) TMP order by date desc limit 5;
         */
        conn.query('select count(req_no) as cnt from assist_qna_tbl where ins_usr_id = ? and view_yn = "N" and process_status NOT IN ("") order by upd_dt desc;'
            + ' select count(req_no) as tCnt from assist_qna_his_tbl where process_status NOT IN ("") and ins_usr_id = ?;'
            + ' select req_no as reqNo, case when process_status = "tmp" then "임시저장" when process_status = "prc" then "진행중"'
            + ' when process_status = "sav" then "임시저장" when process_status = "mts" then "답변작성중" when process_status = "rct" then "진행대기"'
            + ' when process_status = "cmp" then "완료" when process_status = "nop" then "장기미처리" else "" end as processStatus,'
            + ' DATE_FORMAT(ins_dt,"%Y년%m월%d일 %H시%i분") as insDt, ins_usr_nm as insUsrNm,'
            + ' DATE_FORMAT(upd_dt,"%Y-%m-%d") as updDt, upd_usr_nm as updUsrNm from assist_qna_tbl'
            + ' where view_yn = "N" and process_status NOT IN ("") and ins_usr_id = ? order by upd_dt desc limit 5;'
            + ' select @rownum:=@rownum+1 as num, x.dno as dNo, x.data_nm as dataNm, x.model_no as modelNo,'
            + ' (select name from car_cate_inf_tbl where parent_no is null and category_no = x.maker_nm) as makerNm,'
            + ' (select name from car_cate_inf_tbl where parent_no is not null and category_no = x.model_nm) as modelNm,'
            + ' x.auth_level as authLevel from data_inf_tbl x, (SELECT @rownum:=0) TMP order by x.ins_date desc limit 5;'
            + ' select DATE_FORMAT(MAX(cin_date), "%Y년%m월%d일 %H:%i") as inDate from conn_his_tbl where cid = ?;'
            + ' SELECT MAX(x.pay_date), use_term_days as totalDays, @rDays:=use_term_days,'
            + ' DATEDIFF(adddate(pay_date, @rDays), now()) as leftDays FROM pay_info_tbl x, order_detail_inf_tbl y'
            + ' WHERE x.order_no = y.order_no AND y.p_code = "APP170109ASS" AND x.pay_result = "paid" AND x.expire_yn = "N" AND x.usr_id = ?;'
            + ' select (select count(req_no) from assist_qna_tbl where process_status in ("prc","mts") and ins_usr_id = ?) as prcCnt,'
            + ' (select count(req_no) from assist_qna_tbl where process_status = "rct" and ins_usr_id = ?) as rctCnt,'
            + ' (select count(req_no) from assist_qna_tbl where process_status = "cmp" and ins_usr_id = ?) as cmpCnt from dual;'
            + ' select @rownum:=@rownum+1 as num, title as title, DATE_FORMAT(date, "%Y-%m-%d") as date FROM assist_announce_inf_tbl,'
            + ' (SELECT @rownum:=0) TMP order by date desc limit 5;',
            [usrId, usrId, usrId, usrId, usrId, usrId, usrId, usrId, usrId],
            function(err, results) {
                if (err) {
                    console.log('error : ', err.message);
                    res.render('error', {message: err.message, error : err, session: ss});
                } else {
                    var count = results[0][0].cnt;
                    var tCount = results[1][0].tCnt;

                    res.render('./assist/index', { count : count, tCount : tCount, nList : results[2], cList : results[3], cResult : results[4][0],
                        dResult : results[5][0], eResult : results[6][0], aList : results[7], session : ss});
                }
            }
        );
    }
});
/**
 * 사용되고 있지 않음.
 */
router.get('/list', function(req, res) {
    var ss = req.session;
    var usrId = ss.usrId;

    console.log("뷰 조회.");
    // 조회.
    conn.query('select @rownum:=@rownum+1 as num, req_no as reqNo, when process_status = "tmp" then "임시저장" case when process_status = "sav" then "임시저장" when process_status = "prc" then "진행중"'
        + ' when process_status = "rct" then "진행대기" when process_status = "mts" then "답변작성중" when process_status = "cmp" then "완료" when process_status = "nop" then "장기미처리" else "" end as processStatus,'
        + ' DATE_FORMAT(ins_dt,"%Y-%m-%d") as insDt, ins_usr_nm as insUsrNm,'
        + ' DATE_FORMAT(upd_dt,"%Y-%m-%d") as updDt, upd_usr_nm as updUsrNm from assist_qna_tbl, (SELECT @rownum:=0) TMP'
        + ' where ins_usr_id = ? and process_status not in ("tmp", "");'
        + ' select count(req_no) as cnt from assist_qna_tbl where ins_usr_id = ? and view_yn = "N" and process_status not in ("mts", "");'
        + ' select req_no as reqNo, case when process_status = "sav" then "임시저장" when process_status = "prc" then "진행중" when process_status = "mts" then "답변작성중"'
        + ' when process_status = "rct" then "진행대기" when process_status = "cmp" then "완료" when process_status = "nop" then "장기미처리" else "" end as processStatus,'
        + ' DATE_FORMAT(ins_dt,"%Y년%m월%d일 %H시%i분") as insDt, ins_usr_nm as insUsrNm,'
        + ' DATE_FORMAT(upd_dt,"%Y-%m-%d") as updDt, upd_usr_nm as updUsrNm from assist_qna_tbl'
        + ' where ins_usr_id = ? and view_yn = "N" and process_status not in ("tmp", "");',
        [usrId, usrId, usrId],
        function(err, results) {
            if (err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                var count = results[1][0].cnt;
                res.render('./assist/list', {rList : results[0], count : count, nList : results[2], session : ss});
            }
        }
    );
});

// 알림 이력 조회
router.get('/alarm/list', function(req, res, next) {
    var ss = req.session;
    var usrId = ss.usrId !=null ? ss.usrId : '';

    // paging 처리.
    var reqPage = req.query.page ? parseInt(req.query.page) : 0;
    var offset = 3;
    var page = Math.max(1,reqPage);
    var limit = 10;
    var skip = (page-1)*limit;

    console.log('routes 알람 SQL 처리');
    // 로그인 처리 SQL
    conn.query('SELECT COUNT(req_no) as cnt FROM assist_qna_his_tbl WHERE ins_usr_id = ?;'
        + ' SELECT @rownum:=@rownum+1 as num, req_no as reqNo, car_maker_nm as carMakerNm, vin_no as vinNo,'
        + ' case when process_status = "tmp" then "임시저장" when process_status = "prc" then "진행중" when process_status = "mts" then "답변작성중"'
        + ' when process_status = "sav" then "임시저장" when process_status = "rct" then "진행대기" when process_status = "cmp" then "완료" when process_status = "nop" then "장기미처리" else "" end as processStatus,'
        + ' CONCAT(LEFT(title,"5"),"...") as title, close_yn, DATE_FORMAT(ins_date, "%Y-%m-%d %h:%m") as insDate, ins_usr_id as insUsrId,'
        + ' ins_usr_nm as insUsrNm, reply_yn as replyYn, DATE_FORMAT(reply_date, "%Y-%m-%d %H:%i") as replyDate, reply_manager_id as replyManagerId,'
        + ' reply_manager_nm as replyManagerNm FROM assist_qna_his_tbl, (SELECT @rownum:=' + skip + ') TMP WHERE ins_usr_id = ? ORDER BY ins_date DESC, reply_date DESC LIMIT '+ skip + ', ' + limit + ';',
        [usrId, usrId],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error: err, session: ss});
            } else {
                console.log('routes alarm history list !!!');
                var count = results[0][0].cnt;
                var maxPage = Math.ceil(count / limit);
                res.render('./assist/alarmListPopup', {title: '알림 이력 조회', rList : results[1], page : page, maxPage : maxPage, offset : offset, session : ss});
            }
        });

});


router.post('/alarm/delete', function(req, res, next) {
    console.log("알림 이력조회 삭제 처리");

    var ss = req.session;

    var params = req.body['dataList'];
    for (var i = 0; i < params.length; i++) {
        console.log(">>>> params[" + i + "] = " + params[i]);
        conn.query('DELETE FROM assist_qna_his_tbl WHERE req_no = ?',
            [params[i]],
            function (err) {
                if (err) {
                    console.log('error : ', err.message);
                    res.status(500).json({message: err.message, error : err, session: ss});
                }
            }
        );
    }

    res.status(200).json({'result' : 'OK'});
});

/**
 * 서비스 소개 화면 호출.
 */
router.get('/about', function(req, res) {

    var ss = req.session;
    var usrId = ss.usrId;
    var usrNo = ss.usrNo !=null ? ss.usrNo : "";

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    conn.query('select count(req_no) as cnt from assist_qna_tbl where process_status NOT IN ("") and ins_usr_id = ? and view_yn = "N" order by upd_dt desc;'
        + ' select count(req_no) as tCnt from assist_qna_his_tbl where ins_usr_id = ? and process_status not in ("");'
        + ' select req_no as reqNo, case when process_status = "sav" then "임시저장" when process_status = "prc" then "진행중"'
        + ' when process_status = "mts" then "답변작성중" when process_status = "rct" then "진행대기"'
        + ' when process_status = "cmp" then "완료" when process_status = "nop" then "장기미처리" else "" end as processStatus,'
        + ' DATE_FORMAT(ins_dt,"%Y년%m월%d일 %H시%i분") as insDt, ins_usr_nm as insUsrNm,'
        + ' DATE_FORMAT(upd_dt,"%Y-%m-%d") as updDt, upd_usr_nm as updUsrNm from assist_qna_tbl'
        + ' where view_yn = "N" and process_status not in ("") and ins_usr_id = ? order by upd_dt desc limit 5;',
        [usrId, usrId, usrId],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                var count = results[0][0].cnt;
                var tCount = results[1][0].tCnt;
                res.render('./assist/about', {count : count, tCount : tCount, nList : results[2], rList : results[3], session : ss});
            }
        });

});

// 문의요청폼 호출.
router.get('/request', function(req, res) {
    var ss = req.session;

    if(ss.usrId == null) {
        res.redirect('../');
    } else {
        console.log("AssistPRO 화면 호출");
        var usrId = ss.usrId;
        var usrNo = ss.usrNo;
        conn.query('select count(req_no) as cnt from assist_qna_tbl where view_yn = "N" and ins_usr_id = ? and process_status NOT IN ("") order by upd_dt desc;'
            + ' select count(req_no) as tCnt from assist_qna_his_tbl where process_status NOT IN ("") and ins_usr_id = ?;'
            + ' select req_no as reqNo, case when process_status = "tmp" then "임시저장" when process_status = "prc" then "진행중" when process_status = "mts" then "답변작성중"'
            + ' when process_status = "sav" then "임시저장" when process_status = "rct" then "진행대기" when process_status = "cmp" then "완료" when process_status = "nop" then "장기미처리" else "" end as processStatus,'
            + ' DATE_FORMAT(ins_dt,"%Y년%m월%d일 %H시%i분") as insDt, ins_usr_nm as insUsrNm,'
            + ' DATE_FORMAT(upd_dt,"%Y-%m-%d") as updDt, upd_usr_nm as updUsrNm from assist_qna_tbl'
            + ' where view_yn = "N" and process_status NOT IN ("") and ins_usr_id = ? order by upd_dt desc limit 5;'
            + ' select req_no as reqNo, comp_nm as compNm, car_maker_nm as carMakerNm, vin_no as vinNo, mileage as mileage, title as title, process_status as processStatus,'
            + ' DATE_FORMAT(ins_dt,"%Y년%m월%d일") as insDt, ins_usr_nm as insUsrNm,'
            + ' DATE_FORMAT(upd_dt,"%Y-%m-%d") as updDt, upd_usr_nm as updUsrNm from assist_qna_tbl'
            + ' where process_status not in ("tmp", "sav") and ins_usr_id = ? order by ins_dt desc limit 5;'
            + ' select req_no as reqNo, comp_nm as compNm, car_maker_nm as carMakerNm, vin_no as vinNo,'
            + ' DATE_FORMAT(ins_dt,"%Y.%m.%d") as insDt, DATE_FORMAT(ins_dt, "%H:%i") as insDt2 from assist_qna_tbl'
            + ' where process_status in ("tmp", "sav") and ins_usr_id = ?;',
            [usrId, usrId, usrId, usrId, usrId],
            function (err, results) {
                if (err) {
                    console.log('error : ', err.message);
                    res.render('error', {message: err.message, error: err, session: ss});
                } else {
                    var count = results[0][0].cnt;
                    var tCount = results[1][0].tCnt;
                    var datas = {
                        reqNo : '', compNm : '', writerNm : '', writerEmail : '', writerTelNo : '', writerCellNo : '', carMakerNm : '', carModelNm : '',
                        vinNo : '', carNum : '', mileage : '', title : '', troStatDesc : '', techCheckStatDesc : '', processStatus : '', attchFileUrl1 : '',
                        attchFileNm1 : '', attchFileUrl2 : '', attchFileNm2 : '', attchFileUrl3 : '', attchFileNm3 : '',
                        attchFileUrl4 : '', attchFileNm4 : ''
                    };
                    //console.log(">>>> count : " + count);
                    res.render('./assist/new', {
                        count: count, tCount: tCount, nList : results[2], sList : results[3], tList : results[4], vList: datas, tabDiv : 'new', tempReqNo : '', session: ss
                    });
                }
            }
        );
    }
});

// 문의요청 저장 처리.
/**
 *  임시 저장시 순서
 *  1. "임시저장" 버튼 클릭시, formStatus가 "TEMP"로 설정되면 REQNO 신규 생성 하여 저장한다.
 *  2. "작성확인 후 전송하기" 버튼 클릭시, formStatus가 "SAVED" 상태이면 데이타를 업데이트 처리하고
 *     "NEW" 이면 신규로 저장 처리한다.
 */
router.post('/request/save', function(req, res) {
    var ss = req.session;
    var procStat = req.body.processStatus;
    var formStatus = req.body.formStatus;
    var mileage = req.body.mileage !=null ? req.body.mileage : '';
    //console.log('mileage : ', mileage);

    if(ss.usrId == null) {
        res.redirect('../');
    } else {
        var usrId = ss.usrId;
    }

    var today = new Date();
    var year = today.getFullYear().toString();
    var month = today.getMonth()+1;
    var day = today.getDay();
    if(month<10) {
        month = '0' + month;
    }
    if(day<10) {
        day = '0' + day;
    }
    var cDate = year + "" + month + "" + day;
    var reqNo = "REQ" + cDate + randomString(6,"N");

    // 임시 저장된 것 업데이트 처리.
    if(formStatus=="SAVED") {
        console.log(">>> 업데이트 처리");
        var tmpReqNo = req.body.tmpReqNo != null ? req.body.tmpReqNo : '';
        console.log(">>> tmpReqNo : " + tmpReqNo);

        conn.query('update assist_qna_tbl set comp_nm = ?, writer_nm = ?, writer_email = ?, writer_tel_no = ?, writer_cell_no = ?,'
            + ' car_maker_nm = ?, car_model_nm = ?, car_num = ?, vin_no = ?, mileage = ?, title = ?, tro_stat_desc = ?, tech_check_stat_desc = ?, process_status = ?,'
            + ' attch_file_url1 = ?, attch_file_nm1 = ?, attch_file_url2 = ?, attch_file_nm2 = ?, attch_file_url3 = ?, attch_file_nm3 = ?,'
            + ' attch_file_url4 = ?, attch_file_nm4 = ?, attch_file_url7 = ?, attch_file_nm7 = ?, attch_file_url8 = ?, attch_file_nm8 = ?,'
            + ' attch_file_url9 = ?, attch_file_nm9 = ?, attch_file_url10 = ?, attch_file_nm10 = ?, attch_file_url11 = ?, attch_file_nm11 = ?,'
            + ' attch_file_url12 = ?, attch_file_nm12 = ?, upd_dt = now(), upd_usr_id = ?, upd_usr_nm = ? where req_no = ? and ins_usr_id = ?;'
            + ' INSERT INTO assist_qna_his_tbl(req_no, car_maker_nm, vin_no, mileage, title, process_status, ins_date, ins_usr_id,'
            + ' ins_usr_nm) VALUES(?, ?, ?, ?, ?, "sav", now(), ?, ?);',
            [req.body.compNm, req.body.writerNm, req.body.writerEmail, req.body.writerTelNo, req.body.writerCellNo,
                req.body.carMakerNm, req.body.carModelNm, req.body.carNum, req.body.vinNo, mileage, req.body.title, req.body.troStatDesc, req.body.techCheckStatDesc,
                req.body.processStatus, req.body.attchFileUrl1, req.body.attchFileNm1, req.body.attchFileUrl2, req.body.attchFileNm2,
                req.body.attchFileUrl3, req.body.attchFileNm3, req.body.attchFileUrl4, req.body.attchFileNm4, req.body.attchFileUrl5, req.body.attchFileNm5,
                req.body.attchFileUrl6, req.body.attchFileNm6, req.body.attchFileUrl7, req.body.attchFileNm7, req.body.attchFileUrl8, req.body.attchFileNm8,
                req.body.attchFileUrl9, req.body.attchFileNm9, req.body.attchFileUrl10, req.body.attchFileNm10,
                ss.usrId, ss.usrName, tmpReqNo, ss.usrId, tmpReqNo, req.body.carMakerNm, req.body.vinNo, mileage, req.body.title, ss.usrId, ss.usrName
            ],
            function (err) {
                if (err) {
                    console.log('error : ', err.message);
                    console.log('err save');
                    res.status(500).json({message: err.message, error: err, session: ss});
                } else {
                    res.json({result:'OK', reqNo : tmpReqNo, session : ss});
                }
            });
        // 임시 작성인 경우 처리.
    } else if(formStatus=="TEMP"){
        // 쿼리 처리.
        conn.query('insert into assist_qna_tbl(req_no, comp_nm, writer_nm, writer_email, writer_tel_no,'
            + ' writer_cell_no, car_maker_nm, car_model_nm, car_num, vin_no, mileage, title, tro_stat_desc, tech_check_stat_desc, process_status,'
            + ' attch_file_url1, attch_file_nm1, attch_file_url2, attch_file_nm2, '
            + ' attch_file_url3,  attch_file_nm3, attch_file_url4,  attch_file_nm4, attch_file_url7,  attch_file_nm7,'
            + ' attch_file_url8,  attch_file_nm8, attch_file_url9,  attch_file_nm9, attch_file_url10,  attch_file_nm10,'
            + ' attch_file_url11,  attch_file_nm11, attch_file_url12,  attch_file_nm12,'
            + ' ins_dt, ins_usr_id, ins_usr_nm, upd_dt, upd_usr_id, upd_usr_nm)'
            + ' values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), ?, ?, now(), ?, ?);'
            + ' insert into temp_assist_qna_tbl(req_no, comp_nm, writer_nm, writer_email, writer_tel_no,'
            + ' writer_cell_no, car_maker_nm, car_model_nm, car_num, vin_no, mileage, title, tro_stat_desc, tech_check_stat_desc, '
            + ' attch_file_url1, attch_file_nm1, attch_file_url2, attch_file_nm2,'
            + ' attch_file_url3,  attch_file_nm3, attch_file_url4,  attch_file_nm4, attch_file_url7,  attch_file_nm7,'
            + ' attch_file_url8,  attch_file_nm8, attch_file_url9,  attch_file_nm9, attch_file_url10,  attch_file_nm10,'
            + ' attch_file_url11,  attch_file_nm11, attch_file_url12,  attch_file_nm12,'
            + ' ins_dt, ins_usr_id, ins_usr_nm, upd_dt, upd_usr_id, upd_usr_nm)'
            + ' values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), ?, ?, now(), ?, ?);'
            + ' INSERT INTO assist_qna_his_tbl(req_no, car_maker_nm, vin_no, mileage, title, process_status, ins_date, ins_usr_id,'
            + ' ins_usr_nm) VALUES(?, ?, ?, ?, ?, "tmp", now(), ?, ?);',
            [reqNo, req.body.compNm, req.body.writerNm, req.body.writerEmail, req.body.writerTelNo, req.body.writerCellNo,
                req.body.carMakerNm, req.body.carModelNm, req.body.carNum, req.body.vinNo, mileage, req.body.title, req.body.troStatDesc, req.body.techCheckStatDesc, req.body.processStatus,
                req.body.attchFileUrl1, req.body.attchFileNm1, req.body.attchFileUrl2, req.body.attchFileNm2, req.body.attchFileUrl3,
                req.body.attchFileNm3, req.body.attchFileUrl4, req.body.attchFileNm4, req.body.attchFileUrl5, req.body.attchFileNm5, req.body.attchFileUrl6, req.body.attchFileNm6,
                req.body.attchFileUrl7, req.body.attchFileNm7, req.body.attchFileUrl8, req.body.attchFileNm8, req.body.attchFileUrl9, req.body.attchFileNm9,
                req.body.attchFileUrl10, req.body.attchFileNm10, ss.usrId, ss.usrName, ss.usrId, ss.usrName,
                reqNo, req.body.compNm, req.body.writerNm, req.body.writerEmail, req.body.writerTelNo, req.body.writerCellNo,
                req.body.carMakerNm, req.body.carModelNm, req.body.carNum, req.body.vinNo, mileage, req.body.title, req.body.troStatDesc, req.body.techCheckStatDesc,
                req.body.attchFileUrl1, req.body.attchFileNm1, req.body.attchFileUrl2, req.body.attchFileNm2, req.body.attchFileUrl3,
                req.body.attchFileNm3, req.body.attchFileUrl4, req.body.attchFileNm4, req.body.attchFileUrl5, req.body.attchFileNm5, req.body.attchFileUrl6, req.body.attchFileNm6,
                req.body.attchFileUrl7, req.body.attchFileNm7, req.body.attchFileUrl8, req.body.attchFileNm8, req.body.attchFileUrl9, req.body.attchFileNm9,
                req.body.attchFileUrl10, req.body.attchFileNm10, ss.usrId, ss.usrName, ss.usrId, ss.usrName,
                reqNo, req.body.carMakerNm, req.body.vinNo, mileage, req.body.title, ss.usrId, ss.usrName
            ],
            function (err, results) {
                if (err) {
                    console.log('error : ', err.message);
                    console.log('err temp');
                    res.status(500).json({message: err.message, error: err, session: ss});
                } else {
                    //console.log(">>> result : " + results);
                    res.json({result:'OK', reqNo : reqNo, session : ss});
                }
            });
    }

});

// 문의요청 저장 처리.
/**
 *  임시 저장시 순서
 *  1. "임시저장" 버튼 클릭시, formStatus가 "TEMP"로 설정되면 REQNO 신규 생성 하여 저장한다.
 *  2. "작성확인 후 전송하기" 버튼 클릭시, formStatus가 "SAVED" 상태이면 데이타를 업데이트 처리하고
 *     "NEW" 이면 신규로 저장 처리한다.
 */
router.post('/request/insert', function(req, res) {
    var ss = req.session;
    var procStat = req.body.processStatus;
    var formStatus = req.body.formStatus !=null ? req.body.formStatus : '';
    var tempReqNo = req.body.tempSaveReqNo != null ? req.body.tempSaveReqNo : '';

    if(ss.usrId == null) {
        res.redirect('../');
    } else {
        var usrId = ss.usrId;
    }

    var today = new Date();
    var year = today.getFullYear().toString();
    var month = today.getMonth()+1;
    var day = today.getDay();
    if(month<10) {
        month = '0' + month;
    }
    if(day<10) {
        day = '0' + day;
    }
    var cDate = year + "" + month + "" + day;
    var reqNo = "REQ" + cDate + randomString(6,"N");

    // 임시 저장된 것 업데이트 처리.
    if(formStatus=="SAVED") {
        console.log(">>> 업데이트 처리");

        conn.query('update assist_qna_tbl set comp_nm = ?, writer_nm = ?, writer_email = ?, writer_tel_no = ?, writer_cell_no = ?,'
                + ' car_maker_nm = ?, car_model_nm = ?, car_num = ?, vin_no = ?, mileage = ?, title = ?, tro_stat_desc = ?, tech_check_stat_desc = ?, process_status = ?,'
                + ' attch_file_url1 = ?, attch_file_nm1 = ?, attch_file_url2 = ?, attch_file_nm2 = ?, attch_file_url3 = ?, attch_file_nm3 = ?,'
                + ' attch_file_url4 = ?, attch_file_nm4 = ?, attch_file_url7 = ?, attch_file_nm7 = ?, attch_file_url8 = ?, attch_file_nm8 = ?,'
                + ' attch_file_url9 = ?, attch_file_nm9 = ?, attch_file_url10 = ?, attch_file_nm10 = ?, attch_file_url11 = ?, attch_file_nm11 = ?,'
                + ' attch_file_url12 = ?, attch_file_nm12 = ?,'
                + ' upd_dt = now(), upd_usr_id = ?, upd_usr_nm = ? where req_no = ? and ins_usr_id = ?;',
                [req.body.compNm, req.body.writerNm, req.body.writerEmail, req.body.writerTelNo, req.body.writerCellNo,
                    req.body.carMakerNm, req.body.carModelNm, req.body.carNum, req.body.vinNo, req.body.mileage, req.body.title, req.body.troStatDesc, req.body.techCheckStatDesc,
                    req.body.processStatus, req.body.attchFileUrl1, req.body.attchFileNm1, req.body.attchFileUrl2, req.body.attchFileNm2,
                    req.body.attchFileUrl3, req.body.attchFileNm3, req.body.attchFileUrl4, req.body.attchFileNm4, req.body.attchFileUrl5, req.body.attchFileNm5,
                    req.body.attchFileUrl6, req.body.attchFileNm6,  req.body.attchFileUrl7, req.body.attchFileNm7,  req.body.attchFileUrl8, req.body.attchFileNm8,
                    req.body.attchFileUrl9, req.body.attchFileNm9,  req.body.attchFileUrl10, req.body.attchFileNm10,
                    ss.usrId, ss.usrName, req.body.tmpReqNo, ss.usrId
                ],
            function (err) {
                if (err) {
                    console.log('error : ', err.message);
                    res.render('error', {message: err.message, error: err, session: ss});
                } else {
                    conn.commit();
                    conn.query('select count(req_no) as cnt from assist_qna_tbl where view_yn = "N" and ins_usr_id = ? and process_status NOT IN ("") order by upd_dt desc;'
                        + ' select count(req_no) as tCnt from assist_qna_his_tbl where process_status NOT IN ("") and ins_usr_id = ?;'
                        + ' select req_no as reqNo, case when process_status = "tmp" then "임시저장" when process_status = "prc" then "진행중" when process_status = "mts" then "답변작성중"'
                        + ' when process_status = "sav" then "임시저장" when process_status = "rct" then "진행대기" when process_status = "cmp" then "완료" when process_status = "nop" then "장기미처리" else "" end as processStatus,'
                        + ' DATE_FORMAT(ins_dt,"%Y년%m월%d일 %H시%i분") as insDt, ins_usr_nm as insUsrNm,'
                        + ' DATE_FORMAT(upd_dt,"%Y-%m-%d") as updDt, upd_usr_nm as updUsrNm from assist_qna_tbl'
                        + ' where view_yn = "N" and process_status NOT IN ("") and ins_usr_id = ? order by upd_dt desc limit 5;'
                        + ' select req_no as reqNo, comp_nm as compNm, car_maker_nm as carMakerNm, vin_no as vinNo, process_status as processStatus,'
                        + ' DATE_FORMAT(ins_dt,"%Y년%m월%d일") as insDt, ins_usr_nm as insUsrNm,'
                        + ' DATE_FORMAT(upd_dt,"%Y-%m-%d") as updDt, upd_usr_nm as updUsrNm from assist_qna_tbl'
                        + ' where process_status not in ("tmp","sav") and ins_usr_id = ? order by ins_dt desc limit 5;'
                        + ' select req_no as reqNo, comp_nm as compNm, car_maker_nm as carMakerNm, vin_no as vinNo,'
                        + ' DATE_FORMAT(MAX(ins_dt),"%Y.%m.%d") as insDt, DATE_FORMAT(MAX(ins_dt), "%H:%i") as insDt2 from assist_qna_tbl'
                        + ' where process_status in ("tmp","sav") and ins_usr_id = ?;'
                        + ' select req_no as reqNo, comp_nm as compNm, writer_nm as writerNm, writer_email as writerEmail, writer_tel_no as writerTelNo, writer_cell_no as writerCellNo,'
                        + ' car_maker_nm as carMakerNm, car_model_nm as carModelNm, car_num as carNum, vin_no as vinNo, mileage as mileage, title as title, tro_stat_desc as troStatDesc,'
                        + ' tech_check_stat_desc as techCheckStatDesc, process_status as processStatus, attch_file_url1 as attchFileUrl1,'
                        + ' attch_file_nm1 as attchFileNm1, attch_file_url2 as attchFileUrl2, attch_file_nm2 as attchFileNm2,'
                        + ' attch_file_url3 as attchFileUrl3, attch_file_nm3 as attchFileNm3, attch_file_url4 as attchFileUrl4, attch_file_nm4 as attchFileNm4,'
                        + ' attch_file_url7 as attchFileUrl5, attch_file_nm7 as attchFileNm5, attch_file_url8 as attchFileUrl6, attch_file_nm8 as attchFileNm6,'
                        + ' attch_file_url9 as attchFileUrl7, attch_file_nm9 as attchFileNm7, attch_file_url10 as attchFileUrl8, attch_file_nm10 as attchFileNm8,'
                        + ' attch_file_url11 as attchFileUrl9, attch_file_nm11 as attchFileNm9, attch_file_url12 as attchFileUrl10, attch_file_nm12 as attchFileNm10'
                        + ' from assist_qna_tbl where req_no = ?',
                        [usrId, usrId, usrId, usrId, usrId, req.body.tmpReqNo],
                        function (err, results) {
                            if (err) {
                                console.log('error : ', err.message);
                                res.render('error', {message: err.message, error: err, session: ss});
                            } else {
                                var count = results[0][0].cnt;
                                var tCount = results[1][0].tCnt;
                                //console.log(">>>> count : " + count);
                                res.render('./assist/new', {
                                    count: count,
                                    tCount: tCount,
                                    nList: results[2],
                                    sList: results[3],
                                    tList: results[4],
                                    vList: results[5][0],
                                    tabDiv: 'view',
                                    tempReqNo : tempReqNo,
                                    session: ss
                                });
                            }
                        }
                    );
                }
            });
    // 임시 작성인 경우 처리.
    } else {
        // 쿼리 처리.
        conn.query('insert into assist_qna_tbl(req_no, comp_nm, writer_nm, writer_email, writer_tel_no,'
            + ' writer_cell_no, car_maker_nm, car_model_nm, car_num, vin_no, mileage, title, tro_stat_desc, tech_check_stat_desc,'
            + ' process_status, attch_file_url1, attch_file_nm1, attch_file_url2, attch_file_nm2, '
            + ' attch_file_url3,  attch_file_nm3, attch_file_url4,  attch_file_nm4, attch_file_url7,  attch_file_nm7,'
            + ' attch_file_url8,  attch_file_nm8, attch_file_url9,  attch_file_nm9, attch_file_url10,  attch_file_nm10,'
            + ' attch_file_url11,  attch_file_nm11, attch_file_url12, attch_file_nm12,'
            + ' ins_dt, ins_usr_id, ins_usr_nm, upd_dt, upd_usr_id, upd_usr_nm)'
            + ' values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), ?, ?, now(), ?, ?);',
            [reqNo, req.body.compNm, req.body.writerNm, req.body.writerEmail, req.body.writerTelNo, req.body.writerCellNo,
                req.body.carMakerNm, req.body.carModelNm, req.body.carNum, req.body.vinNo, req.body.mileage, req.body.title, req.body.troStatDesc, req.body.techCheckStatDesc, req.body.processStatus,
                req.body.attchFileUrl1, req.body.attchFileNm1, req.body.attchFileUrl2, req.body.attchFileNm2, req.body.attchFileUrl3,
                req.body.attchFileNm3, req.body.attchFileUrl4, req.body.attchFileNm4, req.body.attchFileUrl5, req.body.attchFileNm5, req.body.attchFileUrl6, req.body.attchFileNm6,
                req.body.attchFileUrl7, req.body.attchFileNm7, req.body.attchFileUrl8, req.body.attchFileNm8, req.body.attchFileUrl9, req.body.attchFileNm9,
                req.body.attchFileUrl10, req.body.attchFileNm10, ss.usrId, ss.usrName, ss.usrId, ss.usrName
            ],
            function (err) {
                if (err) {
                    console.log('error : ', err.message);
                    res.render('error', {message: err.message, error: err, session: ss});
                } else {
                    conn.commit();
                    conn.query('select count(req_no) as cnt from assist_qna_tbl where view_yn = "N" and ins_usr_id = ? and process_status NOT IN ("") order by upd_dt desc;'
                        + ' select count(req_no) as tCnt from assist_qna_his_tbl where process_status NOT IN ("") and ins_usr_id = ?;'
                        + ' select req_no as reqNo, case when process_status = "tmp" then "임시저장" when process_status = "prc" then "진행중" when process_status = "mts" then "답변작성중"'
                        + ' when process_status = "sav" then "임시저장" when process_status = "rct" then "진행대기" when process_status = "cmp" then "완료" when process_status = "nop" then "장기미처리" else "" end as processStatus,'
                        + ' DATE_FORMAT(ins_dt,"%Y년%m월%d일 %H시%i분") as insDt, ins_usr_nm as insUsrNm,'
                        + ' DATE_FORMAT(upd_dt,"%Y-%m-%d") as updDt, upd_usr_nm as updUsrNm from assist_qna_tbl'
                        + ' where view_yn = "N" and process_status NOT IN ("") and ins_usr_id = ? order by upd_dt desc limit 5;'
                        + ' select req_no as reqNo, comp_nm as compNm, car_maker_nm as carMakerNm, vin_no as vinNo, process_status as processStatus,'
                        + ' DATE_FORMAT(ins_dt,"%Y년%m월%d일") as insDt, ins_usr_nm as insUsrNm,'
                        + ' DATE_FORMAT(upd_dt,"%Y-%m-%d") as updDt, upd_usr_nm as updUsrNm from assist_qna_tbl'
                        + ' where process_status not in ("tmp","sav") and ins_usr_id = ? order by ins_dt desc limit 5;'
                        + ' select req_no as reqNo, comp_nm as compNm, car_maker_nm as carMakerNm, vin_no as vinNo,'
                        + ' DATE_FORMAT(ins_dt,"%Y.%m.%d") as insDt, DATE_FORMAT(ins_dt, "%H:%i") as insDt2 from assist_qna_tbl'
                        + ' where process_status in ("tmp", "sav") and ins_usr_id = ?;'
                        + ' select req_no as reqNo, comp_nm as compNm, writer_nm as writerNm, writer_email as writerEmail, writer_tel_no as writerTelNo, writer_cell_no as writerCellNo,'
                        + ' car_maker_nm as carMakerNm, car_model_nm as carModelNm, car_num as carNum, vin_no as vinNo, mileage as mileage, title, tro_stat_desc as troStatDesc,'
                        + ' tech_check_stat_desc as techCheckStatDesc, process_status as processStatus, attch_file_url1 as attchFileUrl1,'
                        + ' attch_file_nm1 as attchFileNm1, attch_file_url2 as attchFileUrl2, attch_file_nm2 as attchFileNm2,'
                        + ' attch_file_url3 as attchFileUrl3, attch_file_nm3 as attchFileNm3, attch_file_url4 as attchFileUrl4, attch_file_nm4 as attchFileNm4,'
                        + ' attch_file_url7 as attchFileUrl5, attch_file_nm7 as attchFileNm5, attch_file_url8 as attchFileUrl6, attch_file_nm8 as attchFileNm6,'
                        + ' attch_file_url9 as attchFileUrl7, attch_file_nm9 as attchFileNm7, attch_file_url10 as attchFileUrl8, attch_file_nm10 as attchFileNm8,'
                        + ' attch_file_url11 as attchFileUrl9, attch_file_nm11 as attchFileNm9, attch_file_url12 as attchFileUrl10, attch_file_nm12 as attchFileNm10'
                        + ' from assist_qna_tbl where req_no = ?',
                        [usrId, usrId, usrId, usrId, usrId, reqNo],
                        function (err, results) {
                            if (err) {
                                console.log('error : ', err.message);
                                res.render('error', {message: err.message, error: err, session: ss});
                            } else {
                                var count = results[0][0].cnt;
                                var tCount = results[1][0].tCnt;
                                //console.log(">>>> count : " + count);
                                res.render('./assist/new', {
                                    count: count,
                                    tCount: tCount,
                                    nList: results[2],
                                    sList: results[3],
                                    tList: results[4],
                                    vList: results[5][0],
                                    tabDiv: 'view',
                                    tempReqNo : tempReqNo,
                                    session: ss
                                });
                            }
                        }
                    );
                }
            });
    }

});

// 상세 화면 호출.
router.get('/request/view/:no', function(req, res) {

    var ss = req.session;

    console.log("뷰 조회.");
    // 조회.
    conn.query('select req_no as reqNo, comp_nm as compNm, writer_nm as writerNm, writer_email as writerEmail,'
        + ' writer_tel_no as writerTelNo, writer_tel_no1 as writerTelNo1, writer_tel_no2 as writerTelNo2, writer_tel_no3 as writerTelNo3,'
        + ' writer_cell_no as writerCellNo, writer_cell_no1 as writerCellNo1, writer_cell_no2 as writerCellNo2, writer_cell_no3 as writerCellNo3, car_maker_nm as carMakerNm, car_num as carNum,'
        + ' vin_no as vinNo, mileage as mileage, title as title, tro_stat_desc as troStatDesc, tech_check_stat_desc as techCheckStatDesc, running_work_desc as runningWorkDesc,'
        + ' reply_manager_id as replyManagerId, reply_manager_nm as replyManagerNm, reply_desc as replyDesc,'
        + ' process_status as processStatus, attch_file_url1 as attchFileUrl1, attch_file_nm1 as attchFileNm1,'
        + ' attch_file_url2 as attchFileUrl2, attch_file_nm2 as attchFileNm2, attch_file_url3 as attchFileUrl3, attch_file_nm3 as attchFileNm3,'
        + ' attch_file_url4 as attchFileUrl4, attch_file_nm4 as attchFileNm4, attch_file_url7 as attchFileUrl5, attch_file_nm7 as attchFileNm5,'
        + ' attch_file_url8 as attchFileUrl6, attch_file_nm8 as attchFileNm6, attch_file_url9 as attchFileUrl7, attch_file_nm9 as attchFileNm7,'
        + ' attch_file_url10 as attchFileUrl8, attch_file_nm10 as attchFileNm8, attch_file_url11 as attchFileUrl9, attch_file_nm11 as attchFileNm9,'
        + ' attch_file_url12 as attchFileUrl10, attch_file_nm12 as attchFileNm10, attch_file_url5 as attchFileUrl11, attch_file_nm5 as attchFileNm11,'
        + ' attch_file_url6 as attchFileUrl12, attch_file_nm6 as attchFileNm12, attch_file_url13 as attchFileUrl13, attch_file_nm13 as attchFileNm13,'
        + ' attch_file_url14 as attchFileUrl14, attch_file_nm14 as attchFileNm14, attch_file_url15 as attchFileUrl15, attch_file_nm15 as attchFileNm15,'
        + ' attch_file_url16 as attchFileUrl16, attch_file_nm16 as attchFileNm16, attch_file_url17 as attchFileUrl17, attch_file_nm17 as attchFileNm17,'
        + ' attch_file_url18 as attchFileUrl18, attch_file_nm18 as attchFileNm18, attch_file_url19 as attchFileUrl19, attch_file_nm19 as attchFileNm19,'
        + ' attch_file_url20 as attchFileUrl20, attch_file_nm20 as attchFileNm20,'
        + ' DATE_FORMAT(ins_dt,"%Y-%m-%d") as insDt, ins_usr_nm as insUsrNm,'
        + ' DATE_FORMAT(upd_dt,"%Y-%m-%d") as updDt, upd_usr_nm as updUsrNm from assist_qna_tbl where req_no = ?',
        [req.params.no],
        function(err, results) {
            if (err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.render('./assist/view', {result : results[0], session : ss});
            }
        }
    );

});

// 문의요청 수정폼 호출.
router.get('/request/edit/:no', function(req, res) {
    var ss = req.session;

    console.log("뷰 조회.");
    // 조회.
    conn.query('select req_no as reqNo, comp_nm as compNm, writer_nm as writerNm, writer_email as writerEmail,'
        + ' writer_tel_no as writerTelNo, writer_tel_no1 as writerTelNo1, writer_tel_no2 as writerTelNo2, writer_tel_no3 as writerTelNo3,'
        + ' writer_cell_no as writerCellNo, writer_cell_no1 as writerCellNo1, writer_cell_no2 as writerCellNo2, writer_cell_no3 as writerCellNo3, car_maker_nm as carMakerNm, car_num as carNum,'
        + ' vin_no as vinNo, mileage as mileage, title as title, tro_stat_desc as troStatDesc, tech_check_stat_desc as techCheckStatDesc, running_work_desc as runningWorkDesc,'
        + ' reply_manager_id as replyManagerId, reply_manager_nm as replyManagerNm, reply_desc as replyDesc,'
        + ' process_status as processStatus, attch_file_url1 as attchFileUrl1, attch_file_nm1 as attchFileNm1,'
        + ' attch_file_url2 as attchFileUrl2, attch_file_nm2 as attchFileNm2, attch_file_url3 as attchFileUrl3, attch_file_nm3 as attchFileNm3,'
        + ' attch_file_url4 as attchFileUrl4, attch_file_nm4 as attchFileNm4, attch_file_url7 as attchFileUrl5, attch_file_nm7 as attchFileNm5,'
        + ' attch_file_url8 as attchFileUrl6, attch_file_nm8 as attchFileNm6, attch_file_url9 as attchFileUrl7, attch_file_nm9 as attchFileNm7,'
        + ' attch_file_url10 as attchFileUrl8, attch_file_nm10 as attchFileNm8, attch_file_url11 as attchFileUrl9, attch_file_nm11 as attchFileNm9,'
        + ' attch_file_url12 as attchFileUrl10, attch_file_nm12 as attchFileNm10, attch_file_url5 as attchFileUrl11, attch_file_nm5 as attchFileNm11,'
        + ' attch_file_url6 as attchFileUrl12, attch_file_nm6 as attchFileNm12, attch_file_url13 as attchFileUrl13, attch_file_nm13 as attchFileNm13,'
        + ' attch_file_url14 as attchFileUrl14, attch_file_nm14 as attchFileNm14, attch_file_url15 as attchFileUrl15, attch_file_nm15 as attchFileNm15,'
        + ' attch_file_url16 as attchFileUrl16, attch_file_nm16 as attchFileNm16, attch_file_url17 as attchFileUrl17, attch_file_nm17 as attchFileNm17,'
        + ' attch_file_url18 as attchFileUrl18, attch_file_nm18 as attchFileNm18, attch_file_url19 as attchFileUrl19, attch_file_nm19 as attchFileNm19,'
        + ' attch_file_url20 as attchFileUrl20, attch_file_nm20 as attchFileNm20,'
        + ' DATE_FORMAT(ins_dt,"%Y-%m-%d") as insDt, ins_usr_nm as insUsrNm,'
        + ' DATE_FORMAT(upd_dt,"%Y-%m-%d") as updDt, upd_usr_nm as updUsrNm from assist_qna_tbl where req_no = ?',
        [req.params.no],
        function(err, results) {
            if (err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.render('./assist/edit', {result : results[0], session : ss});
            }
        }
    );
});

// 수정 처리.
router.post('/request/edit', function(req, res) {
    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    var ss = req.session;

    console.log("수정 처리");
    conn.query('update assist_qna_tbl set comp_nm = ?, writer_nm = ?, writer_email = ?, writer_tel_no = ?, writer_tel_no1 = ?,'
        + ' writer_tel_no2 = ?, writer_tel_no3 = ?, writer_cell_no = ?, writer_cell_no1 = ?, writer_cell_no2 = ?, writer_cell_no3 = ?,'
        + ' car_maker_nm = ?, car_num = ?, vin_no = ?, mileage = ?, title = ?, tro_stat_desc = ?, tech_check_stat_desc = ?,'
        + ' attch_file_url1 = ?, attch_file_nm1 = ?, attch_file_url2 = ?, attch_file_nm2 = ?, attch_file_url3 = ?, attch_file_nm3 = ?,'
        + ' attch_file_url4 = ?, attch_file_nm4 = ?, attch_file_url7 = ?, attch_file_nm7 = ?, attch_file_url8 = ?, attch_file_nm8 = ?,'
        + ' attch_file_url9 = ?, attch_file_nm9 = ?, attch_file_url10 = ?, attch_file_nm10 = ?, attch_file_url11 = ?, attch_file_nm11 = ?,'
        + ' attch_file_url12 = ?, attch_file_nm12 = ?,'
        + ' upd_dt = now(), upd_usr_id = "tester", upd_usr_nm = "테스터" where req_no = ? and ins_usr_id = "tester"',
        [req.body.compNm, req.body.writerNm, req.body.writerEmail, req.body.writerTelNo, req.body.writerTelNo1, req.body.writerTelNo2,
         req.body.writerTelNo3, req.body.writerCellNo, req.body.writerCellNo1, req.body.writerCellNo2, req.body.writerCellNo3,
         req.body.carMakerNm, req.body.carNum, req.body.vinNo, req.body.mileage, req.body.title, req.body.troStatDesc, req.body.techCheckStatDesc,
         req.body.attchFileUrl1, req.body.attchFileNm1, req.body.attchFileUrl2, req.body.attchFileNm2, req.body.attchFileUrl3,
         req.body.attchFileNm3, req.body.attchFileUrl4, req.body.attchFileNm4, req.body.attchFileUrl5, req.body.attchFileNm5,
         req.body.attchFileUrl6, req.body.attchFileNm6, req.body.attchFileUrl7, req.body.attchFileNm7, req.body.attchFileUrl8,
         req.body.attchFileNm8, req.body.attchFileUrl9, req.body.attchFileNm9, req.body.attchFileUrl10, req.body.attchFileNm10,
         req.body.reqNo
        ],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.log(">>> results = " + results);
                res.redirect("/assist/request/view/"+req.body.reqNo);
            }
        });
});

// 마이 서비스 현황 조회 처리.
/**
 * processStatus 처리상태
 * "sav" then "임시저장"
 * "rct" then "진행대기"
 * "prc" then "진행중"
 * "cmp" then "완료"
 * "mts" then "답변작성중"
 * "nop" then "장기미처리"
 * "" then "기타"
 */
router.get('/service', function(req, res) {
    var ss = req.session;
    // 리스트 화면에서 펼쳐볼 요청번호 화면을 셋팅하기 위해 파라미터 받음.
    var setReqNo = req.query.setReqNo !=null ? req.query.setReqNo : '';
    // 세션 아이디 체크.
    if(ss.usrId == null) {
        res.redirect('../');
    } else {
        var usrId = ss.usrId;
        var usrNo = ss.usrNo;
        console.log("화면 호출");
        var fromDate = req.body.fromDate != null ? req.body.fromDate : '';
        var toDate = req.body.toDate != null ? req.body.toDate : '';
        var srchCarNo = req.body.carNo !=null ? req.body.carNo : '';
        var srchMakerNm = req.body.carMakerNm !=null ? req.body.carMakerNm : '';
        var setDateCheckBox = 'false';

        // 조회.
        conn.query('select count(req_no) as cnt from assist_qna_tbl where view_yn = "N" and ins_usr_id = ? and process_status NOT IN ("") order by upd_dt desc;'
            + ' select count(req_no) as tCnt from assist_qna_his_tbl where process_status NOT IN ("") and ins_usr_id = ?;'
            + ' select req_no as reqNo, case when process_status = "tmp" then "임시저장" when process_status = "prc" then "진행중" when process_status = "mts" then "답변작성중"'
            + ' when process_status = "sav" then "임시저장" when process_status = "rct" then "진행대기" when process_status = "cmp" then "완료" when process_status = "nop" then "장기미처리" else "" end as processStatus,'
            + ' DATE_FORMAT(ins_dt,"%Y년%m월%d일 %H시%i분") as insDt, ins_usr_nm as insUsrNm,'
            + ' DATE_FORMAT(upd_dt,"%Y-%m-%d") as updDt, upd_usr_nm as updUsrNm from assist_qna_tbl'
            + ' where view_yn = "N" and process_status NOT IN ("") and ins_usr_id = ? order by upd_dt desc limit 5;'
            + ' select LEFT(title, 15) as title, brand_nm as brandNm, model_nm as modelNm, summary, LEFT(content,20) as content,'
            + ' thumb_img_url as thumbImgUrl, thumb_img_nm as thumbImgNm, DATE_FORMAT(date, "%Y년%m월%d일") as date,'
            + ' DATEDIFF(now(), date) as pasted_date_cnt from assist_content_tbl order by date desc;'
            + ' select DATE_FORMAT(MAX(cin_date), "%Y년%m월%d일 %H:%i") as inDate from conn_his_tbl where cid = ?;'
            + ' SELECT MAX(x.pay_date), use_term_days as totalDays, @rDays:=use_term_days,'
            + ' DATEDIFF(adddate(pay_date, @rDays), now()) as leftDays FROM pay_info_tbl x, order_detail_inf_tbl y'
            + ' WHERE x.order_no = y.order_no AND y.p_code = "APP170109ASS" AND x.pay_result = "paid" AND x.expire_yn = "N" AND x.usr_id = ?;'
            + ' select (select count(req_no) from assist_qna_tbl where process_status in ("prc","mts") and ins_usr_id = ?) as prcCnt,'
            + ' (select count(req_no) from assist_qna_tbl where process_status = "rct" and ins_usr_id = ?) as rctCnt,'
            + ' (select count(req_no) from assist_qna_tbl where process_status = "cmp" and ins_usr_id = ?) as cmpCnt'
            + ' from dual;'
            + ' select req_no as reqNo, comp_nm as compNm, car_maker_nm as carMakerNm, vin_no as vinNo,'
            + ' DATE_FORMAT(ins_dt,"%Y.%m.%d") as insDt, DATE_FORMAT(ins_dt, "%H:%i") as insDt2 from assist_qna_tbl'
            + ' where process_status in ("tmp", "sav") and ins_usr_id = ?;'
            + ' SELECT @rownum:=@rownum+1 as num, a.* FROM (SELECT @rownum:="0") TMP, ( SELECT z.* FROM ('
            + ' SELECT x.req_no as reqNo, x.comp_nm as compNm, x.writer_nm as writerNm, x.writer_email as writerEmail,'
            + ' x.writer_tel_no as writerTelNo, x.writer_cell_no as writerCellNo, x.car_maker_nm as carMakerNm, x.car_model_nm as carModelNm,'
            + ' x.car_num as carNum, x.vin_no as vinNo, x.mileage as mileage, x.title as title, x.tro_stat_desc as troStatDesc, x.tech_check_stat_desc as techCheckStatDesc,'
            + ' x.process_status as processStatus, case when x.process_status = "prc" then "진행중" when x.process_status = "rct" then "진행대기"'
            + ' when x.process_status = "mts" then "답변작성중" when x.process_status = "cmp" then "완료" when process_status = "nop" then "장기미처리" else "" end as processStatusNm,'
            + ' x.reply_manager_id as replyManagerId, x.reply_manager_nm as replyManagerNm, x.reply_desc as replyDesc,'
            + ' x.view_yn as viewYn, x.ins_view_yn as insViewYn, x.reply_view_yn as replyViewYn, y.writer_view_yn as writerViewYn, y.reply_yn as replyYn, y.replyer_view_yn as replyerViewYn,'
            + ' x.ins_dt, x.reply_date, y.writer_ins_date, y.reply_ins_date, y.cm_div as cmDiv, y.view_yn as cmtViewYn,'
            + ' x.attch_file_url1 as attchFileUrl1, x.attch_file_nm1 as attchFileNm1, x.attch_file_url2 as attchFileUrl2, x.attch_file_nm2 as attchFileNm2,'
            + ' x.attch_file_url3 as attchFileUrl3, x.attch_file_nm3 as attchFileNm3, x.attch_file_url4 as attchFileUrl4, x.attch_file_nm4 as attchFileNm4,'
            + ' x.attch_file_url7 as attchFileUrl5, x.attch_file_nm7 as attchFileNm5, x.attch_file_url8 as attchFileUrl6, x.attch_file_nm8 as attchFileNm6,'
            + ' x.attch_file_url9 as attchFileUrl7, x.attch_file_nm9 as attchFileNm7, x.attch_file_url10 as attchFileUrl8, x.attch_file_nm10 as attchFileNm8,'
            + ' x.attch_file_url11 as attchFileUrl9, x.attch_file_nm11 as attchFileNm9, x.attch_file_url12 as attchFileUrl10, x.attch_file_nm12 as attchFileNm10,'
            + ' x.attch_file_url5 as attchFileUrl11, x.attch_file_nm5 as attchFileNm11, x.attch_file_url6 as attchFileUrl12, x.attch_file_nm6 as attchFileNm12,'
            + ' x.attch_file_url13 as attchFileUrl13, x.attch_file_nm13 as attchFileNm13, x.attch_file_url14 as attchFileUrl14, x.attch_file_nm14 as attchFileNm14,'
            + ' x.attch_file_url15 as attchFileUrl15, x.attch_file_nm15 as attchFileNm15, x.attch_file_url16 as attchFileUrl16, x.attch_file_nm16 as attchFileNm16,'
            + ' x.attch_file_url17 as attchFileUrl17, x.attch_file_nm17 as attchFileNm17, x.attch_file_url18 as attchFileUrl18, x.attch_file_nm18 as attchFileNm18,'
            + ' x.attch_file_url19 as attchFileUrl19, x.attch_file_nm19 as attchFileNm19, x.attch_file_url20 as attchFileUrl20, x.attch_file_nm20 as attchFileNm20,'
            + ' DATE_FORMAT(x.ins_dt,"%Y년%m월%d일") as insDt, x.ins_usr_nm as insUsrNm, DATE_FORMAT(x.upd_dt,"%Y년%m월%d일") as updDt, x.upd_usr_nm as updUsrNm'
            + ' FROM assist_qna_tbl x LEFT OUTER JOIN assist_qna_comment_tbl y ON x.req_no = y.req_no'
            + ' WHERE x.process_status NOT IN ("tmp", "sav", "") AND x.ins_usr_id = ?'
            + ' ORDER BY (CASE WHEN x.ins_dt is not null AND x.reply_date is not null AND y.writer_ins_date is not null AND y.reply_ins_date is null THEN y.writer_ins_date'
            + ' WHEN x.ins_dt is not null AND x.reply_date is not null  AND y.writer_ins_date is not null AND y.reply_ins_date is not null THEN y.reply_ins_date'
            + ' WHEN x.ins_dt is not null AND x.reply_date is not null  AND y.writer_ins_date is null AND y.reply_ins_date is null THEN x.reply_date'
            + ' WHEN x.ins_dt is not null AND x.reply_date is null AND y.writer_ins_date is null AND y.reply_ins_date is null THEN x.ins_dt END) DESC'
            + ' ) z GROUP BY reqNo'
            + ' ORDER BY (CASE WHEN ins_dt is not null AND reply_date is not null AND writer_ins_date is not null AND reply_ins_date is null THEN writer_ins_date'
            + ' WHEN ins_dt is not null AND reply_date is not null AND writer_ins_date is not null AND reply_ins_date is not null THEN reply_ins_date'
            + ' WHEN ins_dt is not null AND reply_date is not null AND writer_ins_date is null AND reply_ins_date is null THEN reply_date'
            + ' WHEN ins_dt is not null AND reply_date is null AND writer_ins_date is null AND reply_ins_date is null THEN ins_dt END) DESC) a;'
            + ' SELECT comm_cd as commCd, comm_nm as commNm FROM commcd_inf_tbl WHERE p_comm_cd = "C000" ORDER BY comm_nm ASC;',
            [usrId, usrId, usrId, usrId, usrId, usrId, usrId, usrId, usrId, usrId, usrId],
            function(err, results) {
                if (err) {
                    console.log('error : ', err.message);
                    res.render('error', {message: err.message, error : err, session: ss});
                } else {
                    var count = results[0][0].cnt;
                    var tCount = results[1][0].tCnt;
                    if(fromDate != '' && toDate != '') {
                        var fromDate1 = fromDate.substr(0, 4);
                        var fromDate2 = fromDate.substr(4, 2);
                        var fromDate3 = fromDate.substr(6, 2);
                        //console.log(fromDate1 + " " + fromDate2 + " " + fromDate3);
                        var toDate1 = toDate.substr(0, 4);
                        var toDate2 = toDate.substr(4, 2);
                        var toDate3 = toDate.substr(6, 2);
                        //console.log(toDate1 + " " + toDate2 + " " + toDate3);
                        fromDate = fromDate1 + "/" + fromDate2 + "/" + fromDate3;
                        toDate = toDate1 + "/" + toDate2 + "/" + toDate3;
                    }
                    //console.log(">>>> count : " + count);
                    res.render('./assist/service', { count : count, tCount : tCount, nList : results[2], cList : results[3], cResult : results[4][0],
                        dResult : results[5][0], eResult : results[6][0], tList : results[7], xList : results[8], comList: results[9], checkAll : '',
                        gigan : '', checkVal1 : '', checkVal2 : '', checkVal3 : '', setReqNo : setReqNo,
                        fromDate : fromDate, toDate : toDate, setDateCheckBox : setDateCheckBox, srchCarNo : srchCarNo, srchMakerNm : srchMakerNm, session : ss
                        }
                    );
                }
            }
        );
    }
});

// 마이 서비스 현황 조회 처리 (검색부분).
/**
 * processStatus 처리상태
 * "sav" then "임시저장"
 * "rct" then "진행대기"
 * "prc" then "진행중"
 * "cmp" then "완료"
 * "mts" then "답변작성중"
 * "nop" then "장기미처리"
 * "" then "기타"
 */
router.post('/service/search', function(req, res) {

    var ss = req.session;
    if(ss.usrId == null) {
        res.redirect('../');
    } else {
        var usrId = ss.usrId;
        var usrNo = ss.usrNo;
        console.log("화면 호출");

        var addSQL1 = "";
        var addSQL2 = "";
        var addSQL3 = "";
        var addSQL4 = "";
        var addSQL5 = "";
        var addVals = "";
        //var srchVinNo = req.body.srchVinNo != null ? req.body.srchVinNo : "";
        var checkAll = req.body.checkBtnAll !=null ? req.body.checkBtnAll : "";
        var checkVal1 = req.body.chkBtnProcRpt !=null ? req.body.chkBtnProcRpt : "";
        var checkVal2 = req.body.chkBtnProcPrc !=null ? req.body.chkBtnProcPrc : "";
        var checkVal3 = req.body.chkBtnProcCmp !=null ? req.body.chkBtnProcCmp : "";
        var getGigan = req.body.setGigan !=null ? req.body.setGigan : "";
        var fromDate = req.body.fromDate != null ? req.body.fromDate : '';
        var toDate = req.body.toDate != null ? req.body.toDate : '';
        var srchCarNo = req.body.carNo !=null ? req.body.carNo : '';
        var srchMakerNm = req.body.carMakerNm !=null ? req.body.carMakerNm : '';
        var setDateCheckBox = 'false';
        //console.log(">>>> srchVinNo : " + srchVinNo);
        //console.log(">>>> checkAll : " + checkAll);
        //console.log(">>>> checkVal1 : " + checkVal1);
        //console.log(">>>> checkVal2 : " + checkVal2);
        //console.log(">>>> checkVal3 : " + checkVal3);
        //console.log(">>>> getGigan : " + getGigan);
/*
        if(srchVinNo!="") {
            addSQL1 = ' and vin_no = "'+ srchVinNo + '"';
        }
*/
        if(checkAll != "all") {
            if(checkVal2!="") {
                addVals = '"' + checkVal2 + '"' + ', "mts"';
                addSQL2 = ' and x.process_status in ("'+checkVal1+'",'+addVals+',"'+checkVal3+'")';
            } else {
                addSQL2 = ' and x.process_status in ("'+checkVal1+'", "'+addVals+'","'+checkVal3+'")';
            }
        }
        //console.log(">>> addSQL2 : " + addSQL2);
        if(getGigan != "all") {
            if(getGigan == "3") {
                addSQL3 = ' and x.ins_dt between DATE_ADD(now(), INTERVAL - 3 MONTH) and now()';
            } else if(getGigan == "6") {
                addSQL3 = ' and x.ins_dt between DATE_ADD(now(), INTERVAL - 6 MONTH) and now()';
            } else if(getGigan == "12") {
                addSQL3 = ' and x.ins_dt between DATE_ADD(now(), INTERVAL - 12 MONTH) and now()';
            }
        }
        // 날짜 검색 처리.
        var dateSQL = "";
        if(fromDate != '' && toDate != '') {
            setDateCheckBox = 'true';
            dateSQL = ' AND x.ins_dt >= DATE_FORMAT('+ fromDate +',"%Y-%m-%d") AND x.ins_dt < DATE_FORMAT('+ toDate +', "%Y-%m-%d") + interval 1 day';
        }
        // 메이커 검색 처리.
        if(srchMakerNm != '') {
            addSQL4 = ' AND x.car_maker_nm = "'+ srchMakerNm + '"';
        }
        // 차량번호 검색 처리.
        if(srchCarNo != '') {
            addSQL5 = ' AND x.car_num LIKE CONCAT("'+ srchCarNo + '","%")';
        }

        // 조회.
        conn.query('select count(req_no) as cnt from assist_qna_tbl where ins_usr_id = ? and view_yn = "N" and process_status NOT IN ("") order by upd_dt desc;'
            + ' select count(req_no) as tCnt from assist_qna_his_tbl where process_status NOT IN ("") and ins_usr_id = ?;'
            + ' select req_no as reqNo, case when process_status = "tmp" then "임시저장" when process_status = "prc" then "진행중" when process_status = "mts" then "답변작성중"'
            + ' when process_status = "sav" then "임시저장" when process_status = "rct" then "진행대기" when process_status = "cmp" then "완료" when process_status = "nop" then "장기미처리" else "" end as processStatus,'
            + ' DATE_FORMAT(ins_dt,"%Y년%m월%d일 %H시%i분") as insDt, ins_usr_nm as insUsrNm,'
            + ' DATE_FORMAT(upd_dt,"%Y-%m-%d") as updDt, upd_usr_nm as updUsrNm from assist_qna_tbl'
            + ' where view_yn = "N" and process_status NOT IN ("") and ins_usr_id = ? order by upd_dt desc limit 5;'
            + ' select LEFT(title, 15) as title, brand_nm as brandNm, model_nm as modelNm, summary, LEFT(content,20) as content,'
            + ' thumb_img_url as thumbImgUrl, thumb_img_nm as thumbImgNm, DATE_FORMAT(date, "%Y년%m월%d일") as date,'
            + ' DATEDIFF(now(), date) as pasted_date_cnt from assist_content_tbl order by date desc;'
            + ' select DATE_FORMAT(MAX(cin_date), "%Y년%m월%d일 %H:%i") as inDate from conn_his_tbl where cid = ?;'
            + ' SELECT MAX(x.pay_date), use_term_days as totalDays, @rDays:=use_term_days,'
            + ' DATEDIFF(adddate(pay_date, @rDays), now()) as leftDays FROM pay_info_tbl x, order_detail_inf_tbl y'
            + ' WHERE x.order_no = y.order_no AND y.p_code = "APP170109ASS" AND x.pay_result = "paid" AND x.expire_yn = "N" AND x.usr_id = ?;'
            + ' select (select count(req_no) from assist_qna_tbl where process_status in ("tmp","sav") and ins_usr_id = ?) as savCnt,'
            + ' (select count(req_no) from assist_qna_tbl where process_status in ("prc","mts") and ins_usr_id = ?) as prcCnt,'
            + ' (select count(req_no) from assist_qna_tbl where process_status = "rct" and ins_usr_id = ?) as rctCnt,'
            + ' (select count(req_no) from assist_qna_tbl where process_status = "cmp" and ins_usr_id = ?) as cmpCnt'
            + ' from dual;'
            + ' select @rownum:=@rownum+1 as num, req_no as reqNo, comp_nm as compNm, car_maker_nm as carMakerNm, vin_no as vinNo,'
            + ' process_status as processStatus, DATE_FORMAT(ins_dt,"%Y년%m월%d일") as insDt, ins_usr_nm as insUsrNm,'
            + ' DATE_FORMAT(upd_dt,"%Y-%m-%d") as updDt, upd_usr_nm as updUsrNm from assist_qna_tbl, (SELECT @rownum:=0) TMP'
            + ' where process_status not in ("tmp","sav", "") and ins_usr_id = ?  order by ins_dt desc limit 5;'
            + ' select @rownum:=@rownum+1 as num, req_no as reqNo, comp_nm as compNm, car_maker_nm as carMakerNm, vin_no as vinNo,'
            + ' DATE_FORMAT(ins_dt,"%Y.%m.%d") as insDt, DATE_FORMAT(ins_dt, "%H:%i") as insDt2 from assist_qna_tbl, (SELECT @rownum:=0) TMP'
            + ' where process_status in ("tmp","sav") and ins_usr_id = ?;'
            + ' SELECT @rownum:=@rownum+1 as num, a.* FROM (SELECT @rownum:="0") TMP, ( SELECT z.* FROM ('
            + ' SELECT x.req_no as reqNo, x.comp_nm as compNm, x.writer_nm as writerNm, x.writer_email as writerEmail,'
            + ' x.writer_tel_no as writerTelNo, x.writer_cell_no as writerCellNo, x.car_maker_nm as carMakerNm, x.car_model_nm as carModelNm,'
            + ' x.car_num as carNum, x.vin_no as vinNo, x.mileage as mileage, x.title as title, x.tro_stat_desc as troStatDesc, x.tech_check_stat_desc as techCheckStatDesc,'
            + ' x.process_status as processStatus, case when x.process_status = "prc" then "진행중" when x.process_status = "rct" then "진행대기"'
            + ' when x.process_status = "mts" then "답변작성중" when x.process_status = "cmp" then "완료" when process_status = "nop" then "장기미처리" else "" end as processStatusNm,'
            + ' x.reply_manager_id as replyManagerId, x.reply_manager_nm as replyManagerNm, x.reply_desc as replyDesc,'
            + ' x.view_yn as viewYn, x.ins_view_yn as insViewYn, x.reply_view_yn as replyViewYn, y.writer_view_yn as writerViewYn, y.reply_yn as replyYn, y.replyer_view_yn as replyerViewYn,'
            + ' x.ins_dt, x.reply_date, y.writer_ins_date, y.reply_ins_date, y.cm_div as cmDiv, y.view_yn as cmtViewYn,'
            + ' x.attch_file_url1 as attchFileUrl1, x.attch_file_nm1 as attchFileNm1, x.attch_file_url2 as attchFileUrl2, x.attch_file_nm2 as attchFileNm2,'
            + ' x.attch_file_url3 as attchFileUrl3, x.attch_file_nm3 as attchFileNm3, x.attch_file_url4 as attchFileUrl4, x.attch_file_nm4 as attchFileNm4,'
            + ' x.attch_file_url7 as attchFileUrl5, x.attch_file_nm7 as attchFileNm5, x.attch_file_url8 as attchFileUrl6, x.attch_file_nm8 as attchFileNm6,'
            + ' x.attch_file_url9 as attchFileUrl7, x.attch_file_nm9 as attchFileNm7, x.attch_file_url10 as attchFileUrl8, x.attch_file_nm10 as attchFileNm8,'
            + ' x.attch_file_url11 as attchFileUrl9, x.attch_file_nm11 as attchFileNm9, x.attch_file_url12 as attchFileUrl10, x.attch_file_nm12 as attchFileNm10,'
            + ' x.attch_file_url5 as attchFileUrl11, x.attch_file_nm5 as attchFileNm11, x.attch_file_url6 as attchFileUrl12, x.attch_file_nm6 as attchFileNm12,'
            + ' x.attch_file_url13 as attchFileUrl13, x.attch_file_nm13 as attchFileNm13, x.attch_file_url14 as attchFileUrl14, x.attch_file_nm14 as attchFileNm14,'
            + ' x.attch_file_url15 as attchFileUrl15, x.attch_file_nm15 as attchFileNm15, x.attch_file_url16 as attchFileUrl16, x.attch_file_nm16 as attchFileNm16,'
            + ' x.attch_file_url17 as attchFileUrl17, x.attch_file_nm17 as attchFileNm17, x.attch_file_url18 as attchFileUrl18, x.attch_file_nm18 as attchFileNm18,'
            + ' x.attch_file_url19 as attchFileUrl19, x.attch_file_nm19 as attchFileNm19, x.attch_file_url20 as attchFileUrl20, x.attch_file_nm20 as attchFileNm20,'
            + ' DATE_FORMAT(x.ins_dt,"%Y년%m월%d일") as insDt, x.ins_usr_nm as insUsrNm, DATE_FORMAT(x.upd_dt,"%Y년%m월%d일") as updDt, x.upd_usr_nm as updUsrNm'
            + ' FROM assist_qna_tbl x LEFT OUTER JOIN assist_qna_comment_tbl y ON x.req_no = y.req_no'
            + ' WHERE x.process_status NOT IN ("tmp", "sav", "") and x.ins_usr_id = ?' + addSQL1 + addSQL2 + addSQL3 + addSQL4 + addSQL5 + dateSQL
            + ' ORDER BY (CASE WHEN x.ins_dt is not null AND x.reply_date is not null AND y.writer_ins_date is not null AND y.reply_ins_date is null THEN y.writer_ins_date'
            + ' WHEN x.ins_dt is not null AND x.reply_date is not null  AND y.writer_ins_date is not null AND y.reply_ins_date is not null THEN y.reply_ins_date'
            + ' WHEN x.ins_dt is not null AND x.reply_date is not null  AND y.writer_ins_date is null AND y.reply_ins_date is null THEN x.reply_date'
            + ' WHEN x.ins_dt is not null AND x.reply_date is null AND y.writer_ins_date is null AND y.reply_ins_date is null THEN x.ins_dt END) DESC'
            + ' ) z GROUP BY reqNo'
            + ' ORDER BY (CASE WHEN ins_dt is not null AND reply_date is not null AND writer_ins_date is not null AND reply_ins_date is null THEN writer_ins_date'
            + ' WHEN ins_dt is not null AND reply_date is not null AND writer_ins_date is not null AND reply_ins_date is not null THEN reply_ins_date'
            + ' WHEN ins_dt is not null AND reply_date is not null AND writer_ins_date is null AND reply_ins_date is null THEN reply_date'
            + ' WHEN ins_dt is not null AND reply_date is null AND writer_ins_date is null AND reply_ins_date is null THEN ins_dt END) DESC) a;'
            + ' SELECT comm_cd as commCd, comm_nm as commNm FROM commcd_inf_tbl WHERE p_comm_cd = "C000" ORDER BY comm_nm ASC;',
            [usrId, usrId, usrId, usrId, usrId, usrId, usrId, usrId, usrId, usrId, usrId, usrId],
            function(err, results) {
                if (err) {
                    console.log('error : ', err.message);
                    res.render('error', {message: err.message, error : err, session: ss});
                } else {
                    var count = results[0][0].cnt;
                    var tCount = results[1][0].tCnt;
                    //console.log(">>>> count : " + count);
                    if(fromDate != '' && toDate != '') {
                        var fromDate1 = fromDate.substr(0, 4);
                        var fromDate2 = fromDate.substr(4, 2);
                        var fromDate3 = fromDate.substr(6, 2);
                        //console.log(fromDate1 + " " + fromDate2 + " " + fromDate3);
                        var toDate1 = toDate.substr(0, 4);
                        var toDate2 = toDate.substr(4, 2);
                        var toDate3 = toDate.substr(6, 2);
                        //console.log(toDate1 + " " + toDate2 + " " + toDate3);
                        fromDate = fromDate1 + "/" + fromDate2 + "/" + fromDate3;
                        toDate = toDate1 + "/" + toDate2 + "/" + toDate3;
                    }
                    res.render('./assist/service', { count : count, tCount : tCount, nList : results[2], cList : results[3], cResult : results[4][0],
                        dResult : results[5][0], eResult : results[6][0], sList : results[7], tList : results[8], xList : results[9], comList: results[10], checkAll : checkAll,
                        gigan : getGigan, checkVal1 : checkVal1, checkVal2: checkVal2, checkVal3 : checkVal3,
                        setReqNo : '', fromDate : fromDate, toDate : toDate, setDateCheckBox : setDateCheckBox, srchCarNo : srchCarNo, srchMakerNm : srchMakerNm, session : ss
                        }
                    );
                }
            }
        );
    }

});

// 요청 댓글 리스트 조회.
/**
 * 삭젝되는 컬럼 있음 차후에 정리할것! 2017/05/11
 */
router.post('/service/reply', function(req, res) {
    var ss = req.session;

    var pReqNo = req.body.reqNo != null ? req.body.reqNo : '';
    console.log(">>> pReqNo : " + pReqNo);

    conn.query('SELECT count(rno) as cnt FROM assist_qna_comment_tbl WHERE req_no = ?;'
        + ' SELECT @rownum:=@rownum+1 as num, rno as rNo, req_no as reqNo, writer_comment as writeComment,'
        + ' writer_nm as writerNm, DATE_FORMAT(writer_ins_date, "%Y-%m-%d") as writerInsDate, writer_ins_id as writerInsId,'
        + ' writer_attch_file_url1 as wAttchFileUrl1, writer_attch_file_nm1 as wAttchFileNm1,'
        + ' writer_attch_file_url2 as wAttchFileUrl2, writer_attch_file_nm2 as wAttchFileNm2,'
        + ' reply_yn as replyYn, reply_comment as replyComment, DATE_FORMAT(reply_ins_date,"%Y-%m-%d") as replyInsDate,'
        + ' reply_ins_id as replyInsId, reply_ins_nm as replyInsNm, reply_attch_file_url1 as replyAttchFileUrl1,'
        + ' reply_attch_file_nm1 as replyAttchFileNm1, reply_attch_file_url2 as replyAttchFileUrl2,'
        + ' reply_attch_file_nm2 as replyAttchFileNm2 FROM assist_qna_comment_tbl, (SELECT @rownum:=0) TMP'
        + ' WHERE req_no = ? ORDER BY writer_ins_date DESC;',
        [pReqNo, pReqNo],
        function(err, results) {
            if(err) {
                console.log('error : ', JSON.stringify(err));
            } else {
                var count = results[0][0].cnt;
                res.json({count : count, rList : results[1], session : ss});
            }
        }
    );
});

// 요청 댓글 처리.
/**
 *
 */
router.post('/service/reply/insert', function(req, res) {
    var ss = req.session;
    var usrId = ss.usrId !=null ? ss.usrId : '';
    var pReqNo = req.body.reqNo != null ? req.body.reqNo : '';
    var pWriterComment = req.body.replyComment !=null ? req.body.replyComment : '';
    var pWriterAttchFileUrl1 = req.body.attchFileUrl1 !=null ? req.body.attchFileUrl1 : '';
    var pWriterAttchFileNm1 = req.body.attchFileNm1 !=null ? req.body.attchFileNm1 : '';
    var pWriterAttchFileUrl2 = req.body.attchFileUrl2 !=null ? req.body.attchFileUrl2 : '';
    var pWriterAttchFileNm2 = req.body.attchFileNm2 !=null ? req.body.attchFileNm2 : '';

    conn.query('insert into assist_qna_comment_tbl(req_no, writer_comment, writer_nm, writer_ins_date, writer_ins_id,'
        + ' writer_attch_file_url1, writer_attch_file_nm1, writer_attch_file_url2, writer_attch_file_nm2, writer_view_yn, cm_div)'
        + ' values(?, ?, ?, now(), ?, ?, ?, ?, ?, "N", "C");',
        [pReqNo, pWriterComment, ss.usrName, ss.usrId, pWriterAttchFileUrl1, pWriterAttchFileNm1, pWriterAttchFileUrl2, pWriterAttchFileNm2],
        function(err, results) {
            if(err) {
                console.log('error : ', JSON.stringify(err));
                conn.rollback();
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.log('results : ' + JSON.stringify(results));
                conn.commit();
                conn.query('SELECT count(rno) as cnt FROM assist_qna_comment_tbl WHERE req_no = ?;'
                    + ' SELECT @rownum:=@rownum+1 as num, rno as rNo, req_no as reqNo, writer_comment as writeComment, writer_nm as writerNm,'
                    + ' DATE_FORMAT(writer_ins_date, "%Y-%m-%d") as writerInsDate, writer_ins_id as writerInsId,'
                    + ' writer_attch_file_url1 as wAttchFileUrl1, writer_attch_file_nm1 as wAttchFileNm1,'
                    + ' writer_attch_file_url2 as wAttchFileUrl2, writer_attch_file_nm2 as wAttchFileNm2,'
                    + ' reply_yn as replyYn, reply_comment as replyComment, DATE_FORMAT(reply_ins_date,"%Y-%m-%d") as replyInsDate,'
                    + ' reply_ins_id as replyInsId, reply_ins_nm as replyInsNm, reply_attch_file_url1 as replyAttchFileUrl1,'
                    + ' reply_attch_file_nm1 as replyAttchFileNm1, reply_attch_file_url2 as replyAttchFileUrl2,'
                    + ' reply_attch_file_nm2 as replyAttchFileNm2, cm_div as cmDiv FROM assist_qna_comment_tbl, (SELECT @rownum:=0) TMP'
                    + ' WHERE req_no = ? order by writer_ins_date desc, reply_ins_date desc;',
                    [pReqNo, pReqNo],
                    function(err, results2) {
                        if(err) {
                            console.log('error : ', JSON.stringify(err));
                        } else {
                            var count = results2[0][0].cnt;
                            // 댓글 이메일 전송 처리.
                            var content = '<b>* 접수번호 : ' + pReqNo + '</b><br/>';
                            content += '<b>* 댓글자명 : ' + ss.usrName + '</b><br/>';
                            content += '<b>* 댓글내용 : ' + pWriterComment + '</b><br/>';
                            content += '<a href="http://www.jt-lab.co.kr/admin">Assist Pro</a><br/>';
console.log(">>> userEmail ", ss.usrEmail);

                            // 관리자에게 이메일 전송처리.
                            sendMail(ss.usrEmail, ss.usrName, content);

                            res.json({count : count, rList : results2[1], session : ss});
                        }
                    }
                );
            }
        }
    );
});

// 서비스 게시글 확인 처리.
router.post('/service/viewyn', function(req, res) {
    var ss = req.session;
    var reqNo = req.body.reqNo !=null ? req.body.reqNo : "";
    var replyViewYn = req.body.replyViewYn !=null ? req.body.replyViewYn : '';
    var cmtViewYn = req.body.cmtViewYn !=null ? req.body.cmtViewYn : '';
    //var cmmtCount = 0;
    console.log(">>> 게시글 확인 처리.");

    console.log(">>> replyViewYn : ", replyViewYn);
    console.log(">>> cmtViewYn : ", cmtViewYn);

    // 코멘트 카운트 조회.
    conn.query('SELECT count(rno) as cnt FROM assist_qna_comment_tbl WHERE req_no = ?;'
        + ' SELECT @rownum:=@rownum+1 as num, rno as rNo, req_no as reqNo, writer_comment as writeComment,'
        + ' writer_nm as writerNm, DATE_FORMAT(writer_ins_date, "%Y-%m-%d") as writerInsDate, writer_ins_id as writerInsId,'
        + ' writer_attch_file_url1 as wAttchFileUrl1, writer_attch_file_nm1 as wAttchFileNm1,'
        + ' writer_attch_file_url2 as wAttchFileUrl2, writer_attch_file_nm2 as wAttchFileNm2,'
        + ' reply_yn as replyYn, reply_comment as replyComment, DATE_FORMAT(reply_ins_date,"%Y-%m-%d") as replyInsDate,'
        + ' reply_ins_id as replyInsId, reply_ins_nm as replyInsNm, reply_attch_file_url1 as replyAttchFileUrl1,'
        + ' reply_attch_file_nm1 as replyAttchFileNm1, reply_attch_file_url2 as replyAttchFileUrl2,'
        + ' reply_attch_file_nm2 as replyAttchFileNm2, cm_div as cmDiv, view_yn as cmtViewYn'
        + ' FROM assist_qna_comment_tbl, (SELECT @rownum:=0) TMP WHERE req_no = ? ORDER BY writer_ins_date DESC;',
        [reqNo, reqNo],
        function (err, results) {
            if (err) {
                console.log('error : ', JSON.stringify(err));
            } else {
                var count = results[0][0].cnt;
                if(replyViewYn!="" && replyViewYn=="N") {
                    console.log("업데이트 assist_qna_tbl 답변업데이트 처리.");
                    conn.query('UPDATE assist_qna_tbl SET reply_view_yn = "Y" WHERE req_no = ? AND ins_usr_id = ?',
                        [reqNo, ss.usrId],
                        function (err) {
                            if (err) {
                                console.log('error : ', err.message);
                                res.render('error', {message: err.message, error: err, session: ss});
                            } else {
                                res.json({count : count, rList : results[1], 'session': ss});
                            }
                        }
                    );
                } else if(replyViewYn!="" && replyViewYn=="Y" && cmtViewYn!="" && cmtViewYn=="N") {
                    console.log("업데이트 assist_qna_comment_tbl 뷰 처리.");
                    conn.query('UPDATE assist_qna_comment_tbl SET view_yn = "Y" WHERE cm_div = "M" AND req_no = ?',
                        [reqNo],
                        function (err) {
                            if (err) {
                                console.log('error : ', err.message);
                                res.render('error', {message: err.message, error: err, session: ss});
                            } else {
                                res.json({count : count, rList : results[1], 'session': ss});
                            }
                        }
                    );
                } else {
                    res.json({count : count, rList : results[1], 'session': ss});
                }
            }
        }
    );

});

//  서비스 완료 처리
router.post('/service/complete', function(req, res) {
    var ss = req.session;
    var usrId = ss.usrId != null ? ss.usrId : '';
    var usrName = ss.usrName != null ? ss.usrName : '';
    var reqNo = req.body.reqNo !=null ? req.body.reqNo : '';

    conn.query('UPDATE assist_qna_tbl SET process_status = "cmp", ins_view_yn = "N", ins_dt = now(), ins_usr_id = ?, ins_usr_nm = ?,'
        + 'upd_dt = now(), upd_usr_id = ?, upd_usr_nm = ? WHERE req_no = ? AND ins_usr_id = ?',
        [usrId, usrName, usrId, usrName, reqNo, usrId],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error: err, session: ss});
            } else {
                console.dir(results);
                var content = '<b>* 접수번호 : ' + reqNo + '</b><br/>';
                content += '<b>* 접수자명 : ' + ss.usrName + '</b><br/>';
                content += '<b>* 진행상태 : 완료 요청' + '</b><br/>';
                content += '<a href="http://www.jt-lab.co.kr/admin">Assist Pro</a><br/>';

                // 관리자에게 이메일 전송처리.
                sendMail(ss.usrEmail, ss.usrName, content);

                res.json({'result' : 'OK', 'reqNo' : reqNo, 'session' : ss});
            }
        }
    );

});

// 저장변경 처리 호출.
router.post('/request/update', function(req, res) {
    var ss = req.session;

    console.log(">>>>> reqNo : " + req.body.reqNo);

    // 조회.
    console.log("저장 처리");
    conn.query('insert into temp_assist_qna_tbl(req_no, comp_nm, writer_nm, writer_email, writer_tel_no,'
        + ' writer_cell_no, car_maker_nm, car_model_nm, car_num, vin_no, mileage, title, tro_stat_desc, tech_check_stat_desc, '
        + ' attch_file_url1, attch_file_nm1, attch_file_url2, attch_file_nm2, '
        + ' attch_file_url3,  attch_file_nm3, attch_file_url4,  attch_file_nm4,'
        + ' attch_file_url7,  attch_file_nm7, attch_file_url8,  attch_file_nm8,'
        + ' attch_file_url9,  attch_file_nm9, attch_file_url10,  attch_file_nm10,'
        + ' attch_file_url11,  attch_file_nm11, attch_file_url2,  attch_file_nm12,'
        + ' ins_dt, ins_usr_id, ins_usr_nm, upd_dt, upd_usr_id, upd_usr_nm)'
        + ' values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), ?, ?, now(), ?, ?);'
        + ' update assist_qna_tbl set process_status = "sav",'
        + ' ins_dt = now(), ins_usr_id = ?, ins_usr_nm = ?, upd_dt = now(), upd_usr_id = ?, upd_usr_nm = ? where req_no = ?',
        [req.body.reqNo, req.body.compNm, req.body.writerNm, req.body.writerEmail, req.body.writerTelNo, req.body.writerCellNo,
         req.body.carMakerNm, req.body.carModelNm, req.body.carNum, req.body.vinNo, req.body.mileage, req.body.title, req.body.troStatDesc, req.body.techCheckStatDesc,
         req.body.attchFileUrl1, req.body.attchFileNm1, req.body.attchFileUrl2, req.body.attchFileNm2, req.body.attchFileUrl3,
         req.body.attchFileNm3, req.body.attchFileUrl4, req.body.attchFileNm4, req.body.attchFileUrl5, req.body.attchFileNm5,
         req.body.attchFileUrl6, req.body.attchFileNm6, req.body.attchFileUrl7, req.body.attchFileNm7,
         req.body.attchFileUrl8, req.body.attchFileNm8, req.body.attchFileUrl9, req.body.attchFileNm9,
         req.body.attchFileUrl10, req.body.attchFileNm10, ss.usrId, ss.usrName, ss.usrId, ss.usrName,
         ss.usrId, ss.usrName, ss.usrId, ss.usrName, req.body.reqNo],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.log(">>> results = " + results);
                res.json({result:'OK', session : ss});
            }
        });
});

// 진행 처리 호출.
router.post('/request/process', function(req, res) {
    var ss = req.session;
    var reqNo = req.body.reqNo !=null ? req.body.reqNo : '';
    var tempReqNo = req.body.tempReqNo !=null ? req.body.tempReqNo : '';
    console.log(">>>>> reqNo : " + reqNo);
    console.log(">>>>> 임시reqNo : " + tempReqNo);

    // 임시목록 삭제 처리후 업데이트 처리.
    console.log("진행 처리");
    conn.query('SELECT car_maker_nm as makerNm, vin_no as vinNo, mileage as mileage, title as title FROM assist_qna_tbl WHERE req_no = ?;',
        [reqNo],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                var carMakerNm = results[0].makerNm;
                var vinNo = results[0].vinNo;
                var mileage = results[0].mileage;
                var title = results[0].title;
                conn.query('UPDATE assist_qna_tbl SET process_status = "rct",'
                    + ' ins_dt = now(), ins_usr_id = ?, ins_usr_nm = ?, upd_dt = now(), upd_usr_id = ?, upd_usr_nm = ? WHERE req_no = ?;'
                    + ' INSERT INTO assist_qna_his_tbl(req_no, car_maker_nm, vin_no, mileage, title, process_status, ins_date,'
                    + ' ins_usr_id, ins_usr_nm) VALUES(?, ?, ?, ?, ?, "rct", now(), ?, ?);'
                    + ' DELETE FROM assist_qna_tbl WHERE process_status IN ("sav", "tmp") AND ins_usr_id = ? AND req_no = ?;'
                    + ' DELETE FROM temp_assist_qna_tbl WHERE ins_usr_id = ? AND req_no = ?;',
                    [ss.usrId, ss.usrName, ss.usrId, ss.usrName, reqNo, reqNo, carMakerNm, vinNo, mileage, title, ss.usrId, ss.usrName, ss.usrId, tempReqNo, ss.usrId, reqNo],
                    function(err, results2) {
                        if(err) {
                            console.log('error : ', JSON.stringify(err));
                            res.render('error', {message: err.message, error : err, session: ss});
                        } else {
                            console.log(">>> results = " + results2);
                            var content = '<b>* 접수번호 : ' + reqNo + '</b><br/>';
                            content += '<b>* 접수자명 : ' + ss.usrName + '</b><br/>';
                            content += '<b>* 진행상태 : 접수대기' + '</b><br/>';
                            content += '<b>* 제목 : ' + title + '</b><br/>';
                            content += '<b>* Assist Pro : http://www.jt-lab.co.kr/admin';
                            content += '<a href="http://www.jt-lab.co.kr/admin">Assist Pro</a><br/>';

                            // 관리자에게 이메일 전송처리.
                            sendMail(ss.usrEmail, ss.usrName, content);

                            res.json({result:'OK', session : ss});
                        }
                    });
            }
        }
    );
});

// 알림팝업 조회시 조회완료 업데이트 처리.
router.post('/checked', function(req, res) {
    var ss = req.session;
    console.log(">>>>> reqNo : " + req.body.reqNo);

    conn.query('update assist_qna_tbl set view_yn = "Y",'
        + ' ins_dt = now(), ins_usr_id = ?, ins_usr_nm = ?, upd_dt = now(), upd_usr_id = ?, upd_usr_nm = ? where req_no = ?;'
        + ' select count(req_no) as cnt from assist_qna_tbl where process_status NOT IN ("") and ins_usr_id = ? and view_yn = "N" order by upd_dt desc;',
        [ss.usrId, ss.usrName, ss.usrId, ss.usrName, req.body.reqNo, ss.usrId],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.log(">>> results = " + results);
                res.json({result:'OK', rCount : results[1][0].cnt, session : ss});
            }
        });
});

// 최근 저장된 qna 내용 갖고 오기.
router.post('/getRecentSave', function(req, res) {
    var ss = req.session;
    console.log(">>>>> reqNo : " + req.body.reqNo);

    conn.query('select req_no as reqNo, comp_nm as compNm, writer_nm as writerNm, writer_email as writerEmail, writer_tel_no as writerTelNo,'
        + ' writer_tel_no1 as writerTelNo1, writer_tel_no2 as writerTelNo2, writer_tel_no3 as writerTelNo3, writer_cell_no as writerCellNo,'
        + ' writer_cell_no1 as writerCellNo1, writer_cell_no2 as writerCellNo2, writer_cell_no3 as writerCellNo3,'
        + ' car_maker_nm as carMakerNm, car_model_nm as carModelNm, car_num as carNum, vin_no as vinNo, mileage as mileage, title as title, tro_stat_desc as troStatDesc,'
        + ' tech_check_stat_desc as techCheckStatDesc, running_work_desc as runningWorkDesc, process_status as processStatus,'
        + ' attch_file_url1 as attchFileUrl1, attch_file_nm1 as attchFileNm1, attch_file_url2 as attchFileUrl2, attch_file_nm2 as attchFileNm2,'
        + ' DATE_FORMAT(ins_dt,"%Y.%m.%d") as insDt, ins_usr_nm as insUsrNm,'
        + ' DATE_FORMAT(upd_dt,"%Y-%m-%d") as updDt, upd_usr_nm as updUsrNm from assist_qna_tbl'
        + ' where process_status not in ("tmp","sav") and req_no = ?  and ins_usr_id = ?;',
        [req.body.reqNo, ss.usrId],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.log(">>> results = " + results);
                res.json({result:'OK', rData : results[0], session : ss});
            }
        });
});

// 임시 저장된 qna 내용 갖고 오기.
router.post('/getTempSave', function(req, res) {
    var ss = req.session;
    console.log(">>>>> reqNo : " + req.body.reqNo);

    conn.query('select req_no as reqNo, comp_nm as compNm, writer_nm as writerNm, writer_email as writerEmail, writer_tel_no as writerTelNo,'
        + ' writer_tel_no1 as writerTelNo1, writer_tel_no2 as writerTelNo2, writer_tel_no3 as writerTelNo3, writer_cell_no as writerCellNo,'
        + ' writer_cell_no1 as writerCellNo1, writer_cell_no2 as writerCellNo2, writer_cell_no3 as writerCellNo3,'
        + ' car_maker_nm as carMakerNm, car_model_nm as carModelNm, car_num as carNum, vin_no as vinNo, mileage as mileage, title as title, tro_stat_desc as troStatDesc,'
        + ' tech_check_stat_desc as techCheckStatDesc, running_work_desc as runningWorkDesc, process_status as processStatus,'
        + ' attch_file_url1 as attchFileUrl1, attch_file_nm1 as attchFileNm1, attch_file_url2 as attchFileUrl2, attch_file_nm2 as attchFileNm2,'
        + ' attch_file_url3 as attchFileUrl3, attch_file_nm3 as attchFileNm3, attch_file_url4 as attchFileUrl4, attch_file_nm4 as attchFileNm4,'
        + ' attch_file_url7 as attchFileUrl5, attch_file_nm7 as attchFileNm5, attch_file_url8 as attchFileUrl6, attch_file_nm8 as attchFileNm6,'
        + ' attch_file_url9 as attchFileUrl7, attch_file_nm9 as attchFileNm7, attch_file_url10 as attchFileUrl8, attch_file_nm10 as attchFileNm8,'
        + ' attch_file_url11 as attchFileUrl9, attch_file_nm11 as attchFileNm9, attch_file_url12 as attchFileUrl10, attch_file_nm12 as attchFileNm10,'
        + ' DATE_FORMAT(ins_dt,"%Y.%m.%d") as insDt, ins_usr_nm as insUsrNm,'
        + ' DATE_FORMAT(upd_dt,"%Y-%m-%d") as updDt, upd_usr_nm as updUsrNm from assist_qna_tbl'
        + ' where process_status in ("tmp","sav") and req_no = ? and ins_usr_id = ?',
        [req.body.reqNo, ss.usrId],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.log(">>> results = " + results);
                res.json({result:'OK', rData : results[0], session : ss});
            }
        });
});

// 1:1 문의 게시물 조회.
router.get('/qna', function(req, res) {
    var ss = req.session;
    var usrId = ss.usrId;
    var usrNo = ss.usrNo !=null ? ss.usrNo : "";

    console.log('routes 1:1 문의 정보 조회 처리');
    conn.query('select count(req_no) as cnt from assist_qna_tbl where process_status NOT IN ("") and ins_usr_id = ? and view_yn = "N" order by upd_dt desc;'
        + ' select count(req_no) as tCnt from assist_qna_his_tbl where ins_usr_id = ? and process_status not in ("");'
        + ' select req_no as reqNo, case when process_status = "sav" then "임시저장" when process_status = "prc" then "진행중"'
        + ' when process_status = "mts" then "답변작성중" when process_status = "rct" then "진행대기"'
        + ' when process_status = "cmp" then "완료" when process_status = "nop" then "장기미처리" else "" end as processStatus,'
        + ' DATE_FORMAT(ins_dt,"%Y년%m월%d일 %H시%i분") as insDt, ins_usr_nm as insUsrNm,'
        + ' DATE_FORMAT(upd_dt,"%Y-%m-%d") as updDt, upd_usr_nm as updUsrNm from assist_qna_tbl'
        + ' where view_yn = "N" and process_status not in ("") and ins_usr_id = ? order by upd_dt desc limit 5;'
        + ' select @rownum:=@rownum+1 as num, qno as qNo, name as name, usr_no as usrNo, email as email, telno as telNo,'
        + ' title as title, content as content, DATE_FORMAT(ins_dt, "%Y-%m-%d") as insDt, reply_yn as replyYn,'
        + ' reply_name as replyNm, reply_comment as replyComment, DATE_FORMAT(reply_ins_dt, "%Y-%m-%d") as replyDt'
        + ' from qna_inf_tbl, (SELECT @rownum:=0) TMP where usr_no = ? and category = "AssistPro" order by ins_dt desc;',
        [usrId, usrId, usrId, usrNo],
        function(err, results) {
            if(err) {
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                var count = results[0][0].cnt;
                var tCount = results[1][0].tCnt;
                res.render('./assist/myqna', {count : count, tCount : tCount, nList : results[2], rList : results[3], session : ss});
            }
        }
    );
});

// 문의 내용 저장 처리.
router.post('/qna/insert', function(req, res) {
    console.log('routes 게시글 작성 처리');
    var ss = req.session;

    conn.query('insert into qna_inf_tbl(name, usr_no, email, telno, title, content, category, ins_dt) values(?, ?, ?, ?, ?, ?, ?, now());',
        [req.body.name, req.body.usrNo, req.body.email, req.body.telNo, req.body.title, req.body.content, 'AssistPro'],
        function(err, results) {
            if(err) {
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                conn.commit();
                res.redirect('/assist/qna');
            }
        });
});

// 공지사항 조회
router.get('/announce', function(req, res) {

    var ss = req.session;
    var usrId = ss.usrId;
    var usrNo = ss.usrNo !=null ? ss.usrNo : "";

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    conn.query('select count(req_no) as cnt from assist_qna_tbl where process_status NOT IN ("") and ins_usr_id = ? and view_yn = "N" order by upd_dt desc;'
        + ' select count(req_no) as tCnt from assist_qna_his_tbl where ins_usr_id = ? and process_status not in ("");'
        + ' select req_no as reqNo, case when process_status = "sav" then "임시저장" when process_status = "prc" then "진행중"'
        + ' when process_status = "mts" then "답변작성중" when process_status = "rct" then "진행대기"'
        + ' when process_status = "cmp" then "완료" when process_status = "nop" then "장기미처리" else "" end as processStatus,'
        + ' DATE_FORMAT(ins_dt,"%Y년%m월%d일 %H시%i분") as insDt, ins_usr_nm as insUsrNm,'
        + ' DATE_FORMAT(upd_dt,"%Y-%m-%d") as updDt, upd_usr_nm as updUsrNm from assist_qna_tbl'
        + ' where view_yn = "N" and process_status not in ("") and ins_usr_id = ? order by upd_dt desc limit 5;'
        + ' SELECT @rownum:=@rownum+1 as num, no, title, content, DATE_FORMAT(date, "%Y-%m-%d") as date, writer'
        + ' FROM assist_announce_inf_tbl, (SELECT @rownum:=0) TMP ORDER BY date DESC;',
        [usrId, usrId, usrId, usrNo],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                var count = results[0][0].cnt;
                var tCount = results[1][0].tCnt;
                res.render('./assist/announce', {count : count, tCount : tCount, nList : results[2], rList : results[3], session : ss});
            }
        });

});

// 업데이트 뉴스 조회 처리.
router.get('/news', function(req, res) {
    var ss = req.session;
    if(ss.usrId == null) {
        console.log("화면 호출");
        conn.query(' select @rownum:=@rownum+1 as num, LEFT(title, 15) as title, brand_nm as brandNm, model_nm as modelNm,'
            + ' summary, content as content, writer, thumb_img_url as thumbImgUrl, thumb_img_nm as thumbImgNm,'
            + ' DATE_FORMAT(date, "%Y년%m월%d일") as date, DATEDIFF(now(), date) as pasted_date_cnt'
            + ' from assist_content_tbl, (SELECT @rownum:=0) TMP order by date desc',
            [],
            function(err, results) {
                if (err) {
                    console.log('error : ', err.message);
                    res.render('error', {message: err.message, error : err, session: ss});
                } else {
                    res.render('./assist/updatenews', { count : 0, tCount : 0, nList : '', cList : results, eList : '', session : ss});
                }
            }
        );
    } else {
        var usrId = ss.usrId;
        var usrNo = ss.usrNo;
        console.log("화면 호출");
        // 조회.
        conn.query('select count(req_no) as cnt from assist_qna_tbl where process_status NOT IN ("") and ins_usr_id = ? and view_yn = "N" order by upd_dt desc;'
            + ' select count(req_no) as tCnt from assist_qna_his_tbl where ins_usr_id = ? and process_status not in ("");'
            + ' select req_no as reqNo, case when process_status = "sav" then "임시저장" when process_status = "prc" then "진행중"'
            + ' when process_status = "mts" then "답변작성중" when process_status = "rct" then "진행대기"'
            + ' when process_status = "cmp" then "완료" when process_status = "nop" then "장기미처리" else "" end as processStatus,'
            + ' DATE_FORMAT(ins_dt,"%Y년%m월%d일 %H시%i분") as insDt, ins_usr_nm as insUsrNm,'
            + ' DATE_FORMAT(upd_dt,"%Y-%m-%d") as updDt, upd_usr_nm as updUsrNm from assist_qna_tbl'
            + ' where process_status not in ("") and ins_usr_id = ? order by upd_dt desc limit 5;'
            + ' select @rownum:=@rownum+1 as num, LEFT(title, 15) as title, brand_nm as brandNm, model_nm as modelNm,'
            + ' summary, content as content, writer, thumb_img_url as thumbImgUrl, thumb_img_nm as thumbImgNm,'
            + ' DATE_FORMAT(date, "%Y년%m월%d일") as date, DATEDIFF(now(), date) as pasted_date_cnt,'
            + ' writer from assist_content_tbl, (SELECT @rownum:=0) TMP order by date desc;',
            [usrId, usrId, usrId],
            function(err, results) {
                if (err) {
                    console.log('error : ', err.message);
                    res.render('error', {message: err.message, error : err, session: ss});
                } else {
                    var count = results[0][0].cnt;
                    var tCount = results[1][0].tCnt;
                    res.render('./assist/updatenews', { count : count, tCount : tCount, nList : results[2], cList : results[3], session : ss});
                }
            }
        );
    }
});

// 자료실 호출.
router.get('/data', function(req, res) {
    var ss = req.session;

    if(ss.usrId == null) {
        res.redirect('../');
    } else {
        var usrId = ss.usrId;
        var usrNo = ss.usrNo;

        // 기간 검색 조회
        //var srchGigan = req.query.srchGigan != null ? req.query.srchGigan : "";
        // 메이커별 검색 조회
        var srchMakerNm = req.query.srchMakerNm != null ? req.query.srchMakerNm : "";
        // 카테고리 검색 조회
        var srchCategory1 = req.query.srchCategory1 != null ? req.query.srchCategory1 : "";
        var srchCategory2 = req.query.srchCategory2 != null ? req.query.srchCategory2 : "";
        var srchCategory3 = req.query.srchCategory3 != null ? req.query.srchCategory3 : "";

        // 검색어 검색 조회.
        var srchType1 = req.query.srchType1 != null ? req.query.srchType1 : "";
        var srchText1 = req.query.srchText1 != null ? req.query.srchText1 : "";
        var addSQL = ""; var addSQL1 = "";

        if(srchType1=="srchDataNm") {
            addSQL1 =  'where data_nm like concat("%", ?, "%")';
        } else if(srchType1=="srchMakerNm") {
            addSQL1 =  'where maker_nm like concat(?,"%")';
        } else if(srchType1=="srchModelNm") {
            addSQL1 =  'where model_nm like concat(?,"%")';
        } else if(srchType1=="srchModelNo") {
            addSQL1 =  'where model_no like concat(?,"%")';
        }
        if(srchCategory1 != "") {
            addSQL1 += ' and category1 = ' + srchCategory1;
        } else if(srchCategory2 != "") {
            addSQL1 += ' and category2 = ' + srchCategory2;
        } else if(srchCategory3 != "") {
            addSQL1 += ' and category3 = ' + srchCategory3;
        }
        // SQL 확인.
        //console.log(">>> addSQL : " + addSQL);
        //console.log(">>> addSQL1 : " + addSQL1);

        // page
        var reqPage = req.query.page ? parseInt(req.query.page) : 0;
        var offset = 3;
        var page = Math.max(1,reqPage);
        var limit = 10;
        var skip = (page-1)*limit;

        console.log("화면 호출");
        conn.query('SELECT t1.category_no as cateNo, t1.name as cateName FROM category_inf_tbl AS t1'
            + ' WHERE t1.parent_no is null group by t1.name order by t1.name asc;'
            + ' select count(req_no) as cnt from assist_qna_tbl where process_status NOT IN ("") and ins_usr_id = ? and view_yn = "N" order by upd_dt desc;'
            + ' select count(req_no) as tCnt from assist_qna_his_tbl where ins_usr_id = ? and process_status not in ("");'
            + ' select req_no as reqNo, case when process_status = "tmp" then "임시저장" when process_status = "prc" then "진행중"'
            + ' when process_status = "sav" then "임시저장" when process_status = "mts" then "답변작성중" when process_status = "rct" then "진행대기"'
            + ' when process_status = "cmp" then "완료" when process_status = "nop" then "장기미처리" else "" end as processStatus,'
            + ' DATE_FORMAT(ins_dt,"%Y년%m월%d일 %H시%i분") as insDt, ins_usr_nm as insUsrNm,'
            + ' DATE_FORMAT(upd_dt,"%Y-%m-%d") as updDt, upd_usr_nm as updUsrNm from assist_qna_tbl'
            + ' where view_yn = "N" and process_status not in ("") and ins_usr_id = ? order by upd_dt desc limit 5;'
            + ' select count(dno) as dCnt from data_inf_tbl;'
            + ' SELECT MAX(x.pay_date), use_term_days as totalDays, @rDays:=use_term_days,'
            + ' DATEDIFF(adddate(pay_date, @rDays), now()) as leftDays FROM pay_info_tbl x, order_detail_inf_tbl y'
            + ' WHERE x.order_no = y.order_no AND y.p_code = "APP170109ASS1" AND x.pay_result = "paid" AND x.expire_yn = "N" AND x.usr_id = ?;'
            + ' select count(no) as mCnt from my_data_inf_tbl where usr_id = ?;'
            + ' select count(a.dno) as xCnt from data_inf_tbl a, my_data_inf_tbl b where a.dNo = b.data_no and b.usr_id = ? order by a.ins_date desc;'
            + ' select @rownum:=@rownum+1 as num, a.dno as dNo, a.data_nm as dataNm, a.data_smmr as dataSmmr, a.data_desc as dataDesc,'
            + ' (select name from car_cate_inf_tbl where parent_no is null and category_no = a.maker_nm) as makerNm, a.model_no as modelNo, a.model_no2 as modelNo2,'
            + ' (select name from car_cate_inf_tbl where category_no = a.model_nm) as modelNm, a.open_yn as openYn, a.memo as memo,'
            + ' a.category1, a.category2, a.category3, a.attch_url1 as attchUrl1, a.attch_file1 as attchFile1,'
            + ' a.attch_url2 as attchUrl2, a.attch_file2 as attchFile2, a.attch_url3 as attchUrl3, attch_file3 as attchFile3,'
            + ' DATE_FORMAT(a.ins_date,"%Y-%m-%d") as insDate, a.ins_usr_id as insUsrId, a.ins_usr_nm as insUsrNm,'
            + ' DATE_FORMAT(a.upd_date,"%Y-%m-%d") as updDate, a.upd_usr_id as updUsrId, a.upd_usr_nm as updUsrNm'
            + ' from data_inf_tbl a, my_data_inf_tbl b, (SELECT @rownum:=0) TMP where a.dNo = b.data_no and b.usr_id = ? order by b.ins_date asc;'
            + ' select count(dno) as rCnt from data_inf_tbl '+ addSQL1 + ' order by ins_date desc;'
            + ' select @rownum:=@rownum+1 as num, x.dno as dNo, x.data_nm as dataNm, x.data_smmr as dataSmmr, x.data_desc as dataDesc,'
            + ' (select name from car_cate_inf_tbl where parent_no is null and category_no = x.maker_nm) as makerNm, x.model_no as modelNo, x.model_no2 as modelNo2,'
            + ' (select name from car_cate_inf_tbl where category_no = x.model_nm) as modelNm, (SELECT name FROM category_inf_tbl WHERE category_no=x.category1) as category1,'
            + ' (SELECT t2.name as cateName FROM category_inf_tbl AS t1 LEFT JOIN category_inf_tbl AS t2 ON t2.parent_no = t1.category_no'
            + ' WHERE t2.category_no = x.category2) as category2, (SELECT t3.name AS cateName FROM category_inf_tbl AS t1'
            + ' LEFT JOIN category_inf_tbl AS t2 ON t2.parent_no = t1.category_no LEFT JOIN category_inf_tbl AS t3 ON t3.parent_no = t2.category_no'
            + ' WHERE t3.category_no = x.category3) as category3, x.attch_url1 as attchUrl1,'
            + ' x.attch_file1 as attchFile1, x.attch_url2 as attchUrl2, x.attch_file2 as attchFile2, x.attch_url3 as attchUrl3, x.attch_file3 as attchFile3,'
            + ' (select comm_nm as commNm FROM commcd_inf_tbl where comm_cd = x.auth_level) as authLevel, x.open_yn as openYn, x.memo as memo,'
            + ' DATE_FORMAT(x.ins_date,"%Y.%m.%d") as insDate, x.ins_usr_id as insUsrId, x.ins_usr_nm as insUsrNm,'
            + ' DATE_FORMAT(x.upd_date,"%Y.%m.%d") as updDate, x.upd_usr_id as updUsrId, x.upd_usr_nm as updUsrNm from data_inf_tbl x,'
            + ' (SELECT @rownum:='+skip+') TMP '+ addSQL1 + ' order by x.ins_date desc limit '+ skip + ', ' + limit + ";"
            + ' SELECT s.cateNo as cateNo, s.cateName as cateName FROM (SELECT t1.category_no as cateNo,'
            + ' t1.name as cateName FROM car_cate_inf_tbl AS t1 WHERE t1.parent_no is null GROUP BY t1.name ORDER BY t1.name asc) s;',
            [usrId, usrId, usrId, usrId, usrId, usrId, usrId, srchText1, srchText1],
            function(err, results) {
                if (err) {
                    console.log('error : ', err.message);
                    res.render('error', {message: err.message, error : err, session: ss});
                } else {

                    var rCnt = results[9][0].rCnt;
                    var maxPage = Math.ceil(rCnt/limit);
//console.log('results[5] : ', JSON.stringify(results[5]) + '\n');
//console.log('results[5].leftDays : ', JSON.stringify(results[5].leftDays) + '\n');
//console.log('results[5][0].leftDays : ', results[5][0].leftDays + '\n');
                    var leftDays = 0;
//console.log('results[5].length : ', results[5].length + '\n');
                    if(results[5].length > 0) {
                        if (results[5][0].leftDays != null) {
                            leftDays = results[5][0].leftDays;
                        } else {
                            leftDays = 0;
                        }
                    } else {
                        leftDays = 0;
                    }

                    res.render('./assist/jtdata', {
                        cList : results[0]
                        , count : results[1][0].cnt
                        , tCount : results[2][0].tCnt
                        , nList : results[3]
                        , dCount : results[4][0].dCnt
                        //, leftDayCnt : results[5].leftDays !=null ? results[5][0].leftDays : 0
                        , leftDayCnt : leftDays
                        , mCount : results[6][0].mCnt
                        , xCount : results[7][0].xCnt
                        , xList : results[8]
                        , rCount : rCnt
                        , rList : results[10]
                        , dList : results[11]
                        , srchType1 : srchType1
                        , srchText1 : srchText1
                        , srchCategory1 : srchCategory1
                        , srchCategory2 : srchCategory2
                        , srchCategory3 : srchCategory3
                        , selCarMakerNm : ''
                        , page : page
                        , maxPage: maxPage
                        , offset: offset
                        , cList2 : ''
                        , cList3 : ''
                        , session : ss
                    });
                }
            }
        );
    }

});

// 자료열람 검색 처리.
router.post('/data/search', function(req, res) {
    var ss = req.session;

    if(ss.usrId == null) {
        res.redirect('../');
    } else {
        var usrId = ss.usrId;
        var usrNo = ss.usrNo;

        // 기간 검색 조회
        //var srchGigan = req.query.srchGigan != null ? req.query.srchGigan : "";
        // 메이커별 검색 조회
        var srchMakerNm = req.body.srchMakerNm != null ? req.body.srchMakerNm : "";
        console.log(">>> srchMakerNm : " + srchMakerNm);
        // 카테고리 검색 조회
        var srchCategory1 = req.body.category1 != null ? req.body.category1 : "";
        var srchCategory2 = req.body.category2 != null ? req.body.category2 : "";
        var srchCategory3 = req.body.category3 != null ? req.body.category3 : "";
        console.log(">>> srchCategory1 : " + srchCategory1);
        console.log(">>> srchCategory2 : " + srchCategory2);
        console.log(">>> srchCategory3 : " + srchCategory3);

        // 검색어 검색 조회.
        var srchType1 = req.body.srchType1 != null ? req.body.srchType1 : "";
        var srchText1 = req.body.srchText1 != null ? req.body.srchText1 : "";
        var selCarMakerNm = req.body.selCarMakerNm != null ? req.body.selCarMakerNm : "";
        var srchMakerNmBox = req.body.srchMakerNmBox != null ? req.body.srchMakerNmBox : "";
        var srchModelNmBox1 = req.body.srchModelNmBox1 != null ? req.body.srchModelNmBox1 : "";
        var srchModelNmBox2 = req.body.srchModelNmBox2 != null ? req.body.srchModelNmBox2 : "";
        var srchModelNoBox = req.body.srchModelNoBox != null ? req.body.srchModelNoBox : "";

        var addSQL = ""; var addSQL1 = "";
        console.log(">>> srchType1 : " + srchType1);
        console.log(">>> srchText1 : " + srchText1);
        console.log(">>> selCarMakerNm : " + selCarMakerNm);
        console.log(">>>> srchMakerNmBox : " + srchMakerNmBox);
        console.log(">>>> srchModelNmBox2 : " + srchModelNmBox2);
        console.log(">>>> srchModelNoBox : " + srchModelNoBox);
        // 나의 자료목록 메이커별자료 검색
        if(selCarMakerNm!="") {
            addSQL = 'and a.maker_nm = "' + selCarMakerNm + '"';
        }

        if (srchType1 == "srchDataNm") {
            addSQL1 = 'where data_nm like concat("%", ?, "%")';
        } else if (srchType1 == "srchMakerNm") {
            addSQL1 = 'where maker_nm like concat(' + srchMakerNmBox + ',"%")';
        } else if (srchType1 == "srchModelNm") {
            addSQL1 = 'where model_nm like concat(' + srchModelNmBox2 + ',"%")';
        } else if (srchType1 == "srchModelNo") {
            addSQL1 = 'where model_no = "' + srchModelNoBox + '"';
        } else if (srchType1 == "srchCategory") {
            if(srchCategory1 != "") {
                addSQL1 += ' where category1 = "' + srchCategory1 + '"';
            } else if(srchCategory2 != "") {
                addSQL1 += ' where category2 = "' + srchCategory2  + '"';
            } else if(srchCategory3 != "") {
                addSQL1 += ' where category3 = "' + srchCategory3  + '"';
            }
        }

        //console.log(">>> addSQL : " + addSQL);
        //console.log(">>> addSQL1 : " + addSQL1);

        // page
        var reqPage = req.query.page ? parseInt(req.query.page) : 0;
        var offset = 3;
        var page = Math.max(1,reqPage);
        var limit = 10;
        var skip = (page-1)*limit;

        console.log("화면 호출");

        conn.query('SELECT t1.category_no as cateNo, t1.name as cateName FROM category_inf_tbl AS t1'
            + ' WHERE t1.parent_no is null group by t1.name order by t1.name asc;'
            + ' SELECT t2.category_no as cateNo2, t2.name as cateName2 FROM category_inf_tbl AS t1'
            + ' LEFT JOIN category_inf_tbl as t2 ON t1.category_no = t2.parent_no WHERE t2.category_no IS NOT NULL;'
            + ' SELECT t3.category_no as cateNo3, t3.name as cateName3 FROM category_inf_tbl AS t1'
            + ' LEFT JOIN category_inf_tbl as t2 ON t1.category_no = t2.parent_no'
            + ' LEFT JOIN category_inf_tbl as t3 ON t3.parent_no = t2.category_no WHERE t3.category_no IS NOT NULL;'
            + ' select count(req_no) as cnt from assist_qna_tbl where process_status NOT IN ("") and ins_usr_id = ? and view_yn = "N" order by upd_dt desc;'
            + ' select count(req_no) as tCnt from assist_qna_his_tbl where process_status not in ("") and ins_usr_id = ?;'
            + ' select req_no as reqNo, case when process_status = "tmp" then "임시저장" when process_status = "prc" then "진행중"'
            + ' when process_status = "sav" then "임시저장" when process_status = "mts" then "답변작성중" when process_status = "rct" then "진행대기"'
            + ' when process_status = "cmp" then "완료" when process_status = "nop" then "장기미처리" else "" end as processStatus,'
            + ' DATE_FORMAT(ins_dt,"%Y년%m월%d일 %H시%i분") as insDt, ins_usr_nm as insUsrNm,'
            + ' DATE_FORMAT(upd_dt,"%Y-%m-%d") as updDt, upd_usr_nm as updUsrNm from assist_qna_tbl'
            + ' where view_yn = "N" and process_status not in ("") and ins_usr_id = ? order by upd_dt desc limit 5;'
            + ' select count(dno) as dCnt from data_inf_tbl;'
            + ' SELECT MAX(x.pay_date), use_term_days as totalDays, @rDays:=use_term_days,'
            + ' DATEDIFF(adddate(pay_date, @rDays), now()) as leftDays FROM pay_info_tbl x, order_detail_inf_tbl y'
            + ' WHERE x.order_no = y.order_no AND y.p_code = "APP170109ASS1" AND x.pay_result = "paid" AND x.expire_yn = "N" AND x.usr_id = ?;'
            + ' select count(no) as mCnt from my_data_inf_tbl where usr_id = ?;'
            + ' select count(a.dno) as xCnt from data_inf_tbl a, my_data_inf_tbl b where a.dNo = b.data_no and b.usr_id = ? order by a.ins_date desc;'
            + ' select @rownum:=@rownum+1 as num, a.dno as dNo, a.data_nm as dataNm, a.data_smmr as dataSmmr, a.data_desc as dataDesc,'
            + ' (select name from car_cate_inf_tbl where parent_no is null and category_no = a.maker_nm) as makerNm, a.model_no as modelNo, a.model_no2 as modelNo2,'
            + ' (select name from car_cate_inf_tbl where category_no = a.model_nm) as modelNm, a.open_yn as openYn, a.memo as memo,'
            + ' a.category1, a.category2, a.category3, a.attch_url1 as attchUrl1,'
            + ' a.attch_file1 as attchFile1, a.attch_url2 as attchUrl2, a.attch_file2 as attchFile2, a.attch_url3 as attchUrl3, attch_file3 as attchFile3,'
            + ' DATE_FORMAT(a.ins_date,"%Y-%m-%d") as insDate, a.ins_usr_id as insUsrId, a.ins_usr_nm as insUsrNm,'
            + ' DATE_FORMAT(a.upd_date,"%Y-%m-%d") as updDate, a.upd_usr_id as updUsrId, a.upd_usr_nm as updUsrNm'
            + ' from data_inf_tbl a, my_data_inf_tbl b, (SELECT @rownum:=0) TMP where a.dNo = b.data_no and b.usr_id = ? '+ addSQL + ' order by b.ins_date asc;'
            + ' select count(dno) as rCnt from data_inf_tbl ' + addSQL1 + ' order by ins_date desc;'
            + ' select @rownum:=@rownum+1 as num, x.dno as dNo, x.data_nm as dataNm, x.data_smmr as dataSmmr, x.data_desc as dataDesc,'
            + ' (select name from car_cate_inf_tbl where parent_no is null and category_no = x.maker_nm) as makerNm, x.model_no as modelNo, x.model_no2 as modelNo2,'
            + ' (select name from car_cate_inf_tbl where category_no = x.model_nm) as modelNm, (SELECT name FROM category_inf_tbl WHERE category_no=x.category1) as category1,'
            + ' (SELECT t2.name as cateName FROM category_inf_tbl AS t1 LEFT JOIN category_inf_tbl AS t2 ON t2.parent_no = t1.category_no'
            + ' WHERE t2.category_no = x.category2) as category2, (SELECT t3.name AS cateName FROM category_inf_tbl AS t1'
            + ' LEFT JOIN category_inf_tbl AS t2 ON t2.parent_no = t1.category_no LEFT JOIN category_inf_tbl AS t3 ON t3.parent_no = t2.category_no'
            + ' WHERE t3.category_no = x.category3) as category3, x.attch_url1 as attchUrl1,'
            + ' x.attch_file1 as attchFile1, x.attch_url2 as attchUrl2, x.attch_file2 as attchFile2, x.attch_url3 as attchUrl3, x.attch_file3 as attchFile3,'
            + ' (select comm_nm as commNm FROM commcd_inf_tbl where comm_cd = x.auth_level) as authLevel, x.open_yn as openYn, x.memo as memo,'
            + ' DATE_FORMAT(x.ins_date,"%Y.%m.%d") as insDate, x.ins_usr_id as insUsrId, x.ins_usr_nm as insUsrNm,'
            + ' DATE_FORMAT(x.upd_date,"%Y.%m.%d") as updDate, x.upd_usr_id as updUsrId, x.upd_usr_nm as updUsrNm from data_inf_tbl x,'
            + ' (SELECT @rownum:='+skip+') TMP '+ addSQL1 + ' order by x.ins_date desc limit '+ skip + ', ' + limit + ";"
            + ' SELECT s.cateNo as cateNo, s.cateName as cateName FROM (SELECT t1.category_no as cateNo,'
            + ' t1.name as cateName FROM car_cate_inf_tbl AS t1 WHERE t1.parent_no is null GROUP BY t1.name ORDER BY t1.name asc) s;',
            [usrId, usrId, usrId, usrId, usrId, usrId, usrId, srchText1, srchText1],
            function(err, results) {
                if (err) {
                    console.log('error : ', err.message);
                    res.render('error', {message: err.message, error : err, session: ss});
                } else {

                    var rCnt = results[11][0].rCnt;
                    var maxPage = Math.ceil(rCnt/limit);

                    var leftDays = 0;
                    if(results[5].length > 0) {
                        if (results[5][0].leftDays != null) {
                            leftDays = results[5][0].leftDays;
                        } else {
                            leftDays = 0;
                        }
                    } else {
                        leftDays = 0;
                    }

                    res.render('./assist/jtdata', {
                        cList : results[0]
                        , cList2 : results[1]
                        , cList3 : results[2]
                        , count : results[3][0].cnt
                        , tCount : results[4][0].tCnt
                        , nList : results[5]
                        , dCount : results[6][0].dCnt
                        //, leftDayCnt : results[7][0].leftDays
                        , leftDayCnt : leftDays
                        , mCount : results[8][0].mCnt
                        , xCount : results[9][0].xCnt
                        , xList : results[10]
                        , rCount : rCnt
                        , rList : results[12]
                        , dList : results[13]
                        , srchType1 : srchType1
                        , srchText1 : srchText1
                        , srchCategory1 : srchCategory1
                        , srchCategory2 : srchCategory2
                        , srchCategory3 : srchCategory3
                        , selCarMakerNm : selCarMakerNm
                        , page : page
                        , maxPage: maxPage
                        , offset: offset
                        , session : ss
                    });
                }
            }
        );
    }

});

// 자료실 북마크 기능 (마이데이타 저장처리)
router.post('/data/mydata/insert', function(req, res) {

    var ss = req.session;
    var dataNo = req.body.dataNo !=null ? req.body.dataNo : '';
    console.log("dataNo : " + dataNo);

    // 조회 처리.
    console.log("이전 데이타 가 있는 지 확인 조회.");
    //
    conn.query('SELECT COUNT(data_no) as dCnt FROM my_data_inf_tbl WHERE usr_id = ? AND data_no = ?',
        [ss.usrId, dataNo],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                var cnt = results[0].dCnt;
                console.log(">>> cnt = " + cnt);
                if(cnt > 0) {
                    res.json({'result' : 'FAIL', 'session' : ss});
                } else {
                    // 북마크 기능 처리.
                    conn.query('INSERT INTO my_data_inf_tbl(data_no, usr_id, ins_date, ins_usr_id, ins_usr_nm)'
                        + ' VALUES(?, ?, now(), ?, ?);',
                        [dataNo, ss.usrId, ss.usrId, ss.usrName],
                        function(err) {
                            if(err) {
                                console.log('error : ', err.message);
                            } else {
                                res.json({'result' : 'OK', 'session' : ss});
                            }
                        }
                    );
                }
            }
        }
    )

});

// 나의 자료목록 삭제 처리.
router.post('/data/mydata/delete', function(req, res) {

    var ss = req.session;
    var dataNo = req.body.dataNo != null ? req.body.dataNo : '';
    console.log(">>> Delete DataNO : " + dataNo);

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log("자료글 삭제 처리");
    conn.query('DELETE FROM my_data_inf_tbl WHERE data_no = ? AND usr_id = ?;',
        [dataNo, ss.usrId],
        function(err) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.log("화면 호출처리.");
                res.json({result : 'OK'});
            }
        });
});

// 카테고리2(중분류) 리스트 조회
router.post('/data/getcate2', function(req, res) {
    var ss = req.session;

    //console.log(">>>> setDataVal : " + req.body.setDataVal);

    conn.query('SELECT t2.name as cateName2, t2.category_no as cateNo2 FROM category_inf_tbl AS t1'
        + ' LEFT JOIN category_inf_tbl AS t2 ON t2.parent_no = t1.category_no WHERE t1.category_no = ?;',
        [req.body.setDataVal],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.json({result : 'OK', rList : results, session : ss});
            }
        }
    );
});

// 카테고리3(소분류) 리스트 조회
router.post('/data/getcate3', function(req, res) {
    var ss = req.session;

    //console.log(">>>> setDataVal2 : " + req.body.setDataVal);

    conn.query('SELECT t3.name as cateName3, t3.category_no as cateNo3 FROM category_inf_tbl AS t1'
        + ' LEFT JOIN category_inf_tbl AS t2 ON t2.parent_no = t1.category_no'
        + ' LEFT JOIN category_inf_tbl AS t3 ON t3.parent_no = t2.category_no WHERE t2.category_no = ?;',
        [req.body.setDataVal],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.json({result : 'OK', rList : results, session : ss});
            }
        }
    );
});

// 자동차 모델(코드) 리스트 조회
router.post('/data/getModel', function(req, res) {
    var ss = req.session;

    //console.log(">>>> setDataVal : " + req.body.setDataVal);

    conn.query('SELECT t2.name as cateName2, t2.category_no as cateNo2 FROM car_cate_inf_tbl AS t1'
        + ' LEFT JOIN car_cate_inf_tbl AS t2 ON t2.parent_no = t1.category_no WHERE t1.category_no = ?;',
        [req.body.setDataVal],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.json({result : 'OK', mList : results, session : ss});
            }
        }
    );
});

// 임시저장 목록 삭제
router.post('/request/temp/delete', function(req, res) {
    var ss = req.session;
    var reqNo = req.body.tempReqNo != null ? req.body.tempReqNo : "";
    console.log("tempReqNo : " + reqNo);

    // 삭제 처리.
    conn.query('DELETE FROM assist_qna_tbl WHERE process_status IN ("tmp", "sav") AND ins_usr_id = ? AND req_no = ?;'
        + ' DELETE FROM temp_assist_qna_tbl WHERE ins_usr_id = ? AND req_no = ?;',
        [ss.usrId, reqNo, ss.usrId, reqNo],
        function(err) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.json({result : 'OK', session : ss});
            }
        }
    );
});

// 프린터 처리.
router.get('/request/view/print/:no', function(req, res) {
    var ss = req.session;
    var reqNo = req.params.no !=null ? req.params.no : "";

    console.log("프린터 출력 처리 호출.");
    conn.query('select req_no as reqNo, comp_nm as compNm, writer_nm writerNm, writer_email as writerEmail, writer_tel_no as writerTelNo,'
        + ' writer_tel_no1 as writerTelNo1, writer_tel_no2 as writerTelNo2, writer_tel_no3 as writerTelNo3, writer_cell_no as writerCellNo,'
        + ' writer_cell_no1 as writerCellNo1, writer_cell_no2 as writerCellNo2, writer_cell_no3 as writerCellNo3, car_maker_nm as carMakerNm,'
        + ' car_model_nm as carModelNm, car_num as carNum, vin_no as vinNo, mileage as mileage, title as title, tro_stat_desc as troStatDesc, tech_check_stat_desc as techCheckStatDesc,'
        + ' running_work_desc as runningWorkDesc, reply_manager_id as replyManagerId, reply_manager_nm as replyManagerNm, reply_desc as replyDesc,'
        + ' process_status as processStatus, attch_file_url1 as attchFileUrl1, attch_file_nm1 as attchFileNm1, attch_file_url2 as attchFileUrl2,'
        + ' attch_file_nm2 as attchFileNm2, attch_file_url3 as attchFileUrl3, attch_file_nm3 as attchFileNm3, attch_file_url4 as attchFileUrl4,'
        + ' attch_file_nm4 as attchFileNm4, attch_file_url7 as attchFileUrl5, attch_file_nm7 as attchFileNm5, attch_file_url8 as attchFileUrl6,'
        + ' attch_file_nm8 as attchFileNm6, attch_file_url9 as attchFileUrl7, attch_file_nm9 as attchFileNm7, attch_file_url10 as attchFileUrl8,'
        + ' attch_file_nm10 as attchFileNm8, attch_file_url11 as attchFileUrl9, attch_file_nm11 as attchFileNm9, attch_file_url12 as attchFileUrl10,'
        + ' attch_file_nm12 as attchFileNm10, attch_file_url5 as attchFileUrl11, attch_file_nm5 as attchFileNm11, attch_file_url6 as attchFileUrl12,'
        + ' attch_file_nm6 as attchFileNm12, attch_file_url13 as attchFileUrl13, attch_file_nm13 as attchFileNm13, attch_file_url14 as attchFileUrl14,'
        + ' attch_file_nm14 as attchFileNm14, attch_file_url15 as attchFileUrl15, attch_file_nm15 as attchFileNm15, attch_file_url16 as attchFileUrl16,'
        + ' attch_file_nm16 as attchFileNm16, attch_file_url17 as attchFileUrl17, attch_file_nm17 as attchFileNm17, attch_file_url18 as attchFileUrl18,'
        + ' attch_file_nm18 as attchFileNm18, attch_file_url19 as attchFileUrl19, attch_file_nm19 as attchFileNm19, attch_file_url20 as attchFileUrl20,'
        + ' attch_file_nm20 as attchFileNm20, view_yn as viewYn, ins_dt as insDt, ins_usr_id as insUsrId, ins_usr_nm as insUsrNm, upd_dt as updDt,'
        + ' upd_usr_id as updUsrId, upd_usr_nm as updUsrNm from assist_qna_tbl where req_no = ?',
        [reqNo],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.render('./assist/newPrint', {result : results[0], session : ss});
            }
        }
    );
});

/**
 * Assist 로그인 처리.
 */
router.post('/login/loginProcess', function(req, res) {

    var ss = req.session;

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
console.log(">>> AssistPro ipAddress = " + ipAddress);

    // mongodb 세션 조회 처리.
    var sm = mongoose.model('session', SessionSchema);
    sm.find({},function(err, results) {
        if(err) console.log(err);
console.log('mongo session length : ', results.length);
console.log('mongo session : ' , results);
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
            // 세션에 중복 아이디가 있는 경우 처리.
            if(resultId.length > 0) {
                res.status(200).json({'result' : 'DUPLICATION'});
            } else {
                // 공통 로그인 처리
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
    });
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
    // 공통 로그인 처리.
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

    // 삭제처리.
    conn.query('insert into conn_his_tbl(cview, cpage, cid, cin_date, cout_date, cip) values("AssistPro", "index", ?,'
        + ' now(), now(), ?);',
        [ss.usrId, ss.usrIp],
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
                });
                res.redirect('/assist');
            }
        }
    );
});

// 가입 화면 호출.
router.get('/signup', function(req, res) {
    console.log('routes 로그인 화면 호출.');
    res.render('./assist/signupForm', {title: 'JT-LAB 로그인 화면'});
});

/**
 * 모바일용 임시저장 처리 모듈 화면.
 * 임시저장목록에서 임시저장 업로드 할 수 있도록.
 */
router.get('/mobile', function(req, res) {
    var ss = req.session;
    var usrId = ss.usrId != null ? ss.usrId : '';

    if(ss.usrId == null) {
        res.render('./assist/mobile/loginView', {'session' : ss});
    } else {
        console.log('routes 모바일용 접수 화면 호출.');
        conn.query('SELECT @rownum:=@rownum+1 as num, req_no as reqNo, comp_nm as compNm, car_maker_nm as carMakerNm, car_num as carNum, vin_no as vinNo, mileage as mileage,'
            + ' CONCAT(LEFT(title,5),"...") as title, DATE_FORMAT(ins_dt,"%Y.%m.%d") as insDt, DATE_FORMAT(ins_dt, "%H:%i") as insDt2,'
            + ' DATE_FORMAT(upd_dt,"%Y.%m.%d") as updDt, DATE_FORMAT(upd_dt, "%H:%i") as updDt2'
            + ' FROM assist_qna_tbl, (SELECT @rownum:=0) TMP'
            + ' WHERE process_status in ("tmp", "sav") AND ins_usr_id = ?;'
            + ' SELECT @rownum:=@rownum+1 as num, z.* FROM ('
            + ' SELECT x.req_no as reqNo, x.car_maker_nm as carMakerNm, x.mileage as mileage, CONCAT(LEFT(x.title,5),"...") as title,'
            + ' x.car_num as carNum, x.ins_dt, x.upd_dt, x.reply_date, y.writer_ins_date FROM assist_qna_tbl x, assist_qna_comment_tbl y'
            + ' WHERE x.process_status not in ("tmp", "sav", "") AND x.req_no = y.req_no AND ins_usr_id = ? GROUP BY x.req_no'
            + ' ) z, (SELECT @rownum:=0) TMP ORDER BY z.ins_dt DESC, z.upd_dt DESC, z.reply_date DESC, z.writer_ins_date DESC;',
            [usrId, usrId],
            function(err, results) {
                if(err) {
                    console.log('error : ', err.message);
                    res.render('error', {message: err.message, error : err, session: ss});
                } else {

                    res.render('./assist/mobile/index', {'rList' : results[0], 'rList2' : results[1], 'session' : ss});
                }
        });
    }

});

/**
 * 모바일용 접수 상세내용 호출 화면.
 */
router.get('/mobile/view/:reqNo', function(req, res) {
    var ss = req.session;
    var usrId = ss.usrId !=null ? ss.usrId : '';
    var reqNo = req.params.reqNo !=null ? req.params.reqNo : '';

    if(ss.usrId == null) {
        res.render('./assist/mobile/loginView', {'session' : ss});
    } else {
        console.log('routes 모바일용 접수 상세 화면 호출.');
        conn.query('SELECT x.req_no as reqNo, x.comp_nm as compNm, x.car_maker_nm as carMakerNm, x.vin_no as vinNo, x.mileage as mileage, x.title as title,'
            + ' DATE_FORMAT(ins_dt,"%Y.%m.%d") as insDt, DATE_FORMAT(ins_dt, "%H:%i") as insDt2,'
            + ' DATE_FORMAT(upd_dt,"%Y.%m.%d") as updDt, DATE_FORMAT(upd_dt, "%H:%i") as updDt2'
            + ' FROM assist_qna_tbl x, assist_qna_comment_tbl y WHERE x.process_status not in ("tmp", "sav", "") AND x.req_no = ? AND x.ins_usr_id = ?;'
            + ' SELECT @rownum:=@rownum+1 as num, writer_comment as writerComment, writer_nm as writerNm, DATE_FORMAT(writer_ins_date, "%Y-%m-%d %H:%i") as writerInsDate,'
            + ' writer_ins_id as writerInsId, writer_attch_file_url1 as writerAttchFileUrl1, writer_attch_file_nm1 as writerAttchFileNm1,'
            + ' writer_attch_file_url2 as writerAttchFileUrl2, writer_attch_file_nm2 as writerAttchFileNm2,'
            + ' cm_div as cmDiv, view_yn as viewYn FROM assist_qna_comment_tbl, (SELECT @rownum:=0) TMP WHERE req_no = ? ORDER BY writer_ins_date DESC;',
            [reqNo, usrId, reqNo],
            function(err, results) {
                if(err) {
                    console.log('error : ', err.message);
                    res.render('error', {message: err.message, error : err, session: ss});
                } else {
                    //console.dir(results);
                    res.render('./assist/mobile/listDetailView', {'result' : results[0][1], 'rList' : results[1], 'session' : ss});
                }
            }
        );
    }

});

/**
 * 모바일용 임시저장 상세내용 호출 화면.
 */
router.get('/mobile/tempview/:reqNo', function(req, res) {
    var ss = req.session;
    var usrId = ss.usrId !=null ? ss.usrId : '';
    var reqNo = req.params.reqNo !=null ? req.params.reqNo : '';

    if(ss.usrId == null) {
        res.render('./assist/mobile/loginView', {'session' : ss});
    } else {
        console.log('routes 모바일용 접수(임시저장) 상세 화면 호출.');
        conn.query('SELECT req_no as reqNo, comp_nm as compNm, car_maker_nm as carMakerNm, vin_no as vinNo, mileage as mileage,'
            + ' DATE_FORMAT(ins_dt,"%Y.%m.%d") as insDt, DATE_FORMAT(ins_dt, "%H:%i") as insDt2,'
            + ' DATE_FORMAT(upd_dt,"%Y.%m.%d") as updDt, DATE_FORMAT(upd_dt, "%H:%i") as updDt2, attch_file_url1 as attchFileUrl1,'
            + ' attch_file_nm1 as attchFileNm1, attch_file_url2 as attchFileUrl2, attch_file_nm2 as attchFileNm2, attch_file_url3 as attchFileUrl3,'
            + ' attch_file_nm3 as attchFileNm3, attch_file_url4 as attchFileUrl4, attch_file_nm4 as attchFileNm4, attch_file_url7 as attchFileUrl5,'
            + ' attch_file_nm7 as attchFileNm5, attch_file_url8 as attchFileUrl6, attch_file_nm8 as attchFileNm6, attch_file_url9 as attchFileUrl7,'
            + ' attch_file_nm9 as attchFileNm7, attch_file_url10 as attchFileUrl8, attch_file_nm10 as attchFileNm8, attch_file_url11 as attchFileUrl9,'
            + ' attch_file_nm11 as attchFileNm9, attch_file_url12 as attchFileUrl10, attch_file_nm12 as attchFileNm10'
            + ' FROM assist_qna_tbl WHERE process_status in ("tmp", "sav") AND req_no = ? AND ins_usr_id = ?;',
            [reqNo, usrId],
            function(err, results) {
                if(err) {
                    console.log('error : ', err.message);
                    res.render('error', {message: err.message, error : err, session: ss});
                } else {
                    //console.dir(results);
                    res.render('./assist/mobile/listTempDetailView', {'result' : results[0], 'session' : ss});
                }
            }
        );
    }

});

// 모바일 접수 댓글 업데이트 처리.
router.post('/mobile/reply/update', function(req, res) {
    var ss = req.session;
    var usrId = ss.usrId !=null ? ss.usrId : '';
    var usrName = ss.usrName !=null ? ss.usrName : '';
    var reqNo = req.body.reqNo !=null ? req.body.reqNo : '';
    var replyComment = req.body.replyComment !=null ? req.body.replyComment : '';
    var attchFileUrl1 = req.body.attchFileUrl1 != null ? req.body.attchFileUrl1 : '';
    var attchFileNm1 = req.body.attchFileNm1 != null ? req.body.attchFileNm1 : '';
    var attchFileUrl2 = req.body.attchFileUrl2 != null ? req.body.attchFileUrl2 : '';
    var attchFileNm2 = req.body.attchFileNm2 != null ? req.body.attchFileNm2 : '';

    console.log(">>>> replyComment : ", replyComment);
    console.log(">>>> attchFileUrl1 : ", attchFileUrl1);
    console.log(">>>> attchFileNm1 : ", attchFileNm1);
    console.log(">>>> attchFileUrl2 : ", attchFileUrl2);
    console.log(">>>> attchFileNm2 : ", attchFileNm2);

    // SQL
    conn.query('INSERT INTO assist_qna_comment_tbl(req_no, writer_comment, writer_nm, writer_ins_date, writer_ins_id,'
        + ' writer_attch_file_url1, writer_attch_file_nm1, writer_attch_file_url2, writer_attch_file_nm2, cm_div)'
        + ' VALUES(?, ?, ?, now(), ?, ?, ?, ?, ?, "C")',
        [reqNo, replyComment, usrName, usrId, attchFileUrl1, attchFileNm1, attchFileUrl2, attchFileNm2],
        function(err, results) {
            if(err) {
                console.log('error : ', JSON.stringify(err));
                //res.status(500).json({'err' : err, 'session' : ss});
            } else {
                console.dir(results);
                res.status(200).json({'result' : 'OK', 'session' : ss});
            }
        }
    );

});

// 모바일 임시저장 업데이트 처리.
router.post('/mobile/temp/update', function(req, res) {
    var ss = req.session;
    var usrId = ss.usrId !=null ? ss.usrId : '';
    var usrName = ss.usrName !=null ? ss.usrName : '';
    var reqNo = req.body.reqNo !=null ? req.body.reqNo : '';
    var attchFileUrl1 = req.body.attchFileUrl1 != null ? req.body.attchFileUrl1 : '';
    var attchFileNm1 = req.body.attchFileNm1 != null ? req.body.attchFileNm1 : '';
    var attchFileUrl2 = req.body.attchFileUrl2 != null ? req.body.attchFileUrl2 : '';
    var attchFileNm2 = req.body.attchFileNm2 != null ? req.body.attchFileNm2 : '';
    var attchFileUrl3 = req.body.attchFileUrl3 != null ? req.body.attchFileUrl3 : '';
    var attchFileNm3 = req.body.attchFileNm3 != null ? req.body.attchFileNm3 : '';
    var attchFileUrl4 = req.body.attchFileUrl4 != null ? req.body.attchFileUrl4 : '';
    var attchFileNm4 = req.body.attchFileNm4 != null ? req.body.attchFileNm4 : '';
    var attchFileUrl5 = req.body.attchFileUrl5 != null ? req.body.attchFileUrl5 : '';
    var attchFileNm5 = req.body.attchFileNm5 != null ? req.body.attchFileNm5 : '';
    var attchFileUrl6 = req.body.attchFileUrl6 != null ? req.body.attchFileUrl6 : '';
    var attchFileNm6 = req.body.attchFileNm6 != null ? req.body.attchFileNm6 : '';
    var attchFileUrl7 = req.body.attchFileUrl7 != null ? req.body.attchFileUrl7 : '';
    var attchFileNm7 = req.body.attchFileNm7 != null ? req.body.attchFileNm7 : '';
    var attchFileUrl8 = req.body.attchFileUrl8 != null ? req.body.attchFileUrl8 : '';
    var attchFileNm8 = req.body.attchFileNm8 != null ? req.body.attchFileNm8 : '';
    var attchFileUrl9 = req.body.attchFileUrl9 != null ? req.body.attchFileUrl9 : '';
    var attchFileNm9 = req.body.attchFileNm9 != null ? req.body.attchFileNm9 : '';
    var attchFileUrl10 = req.body.attchFileUrl10 != null ? req.body.attchFileUrl10 : '';
    var attchFileNm10 = req.body.attchFileNm10 != null ? req.body.attchFileNm10 : '';

    console.log(">>>> attchFileUrl1 : ", attchFileUrl1);
    console.log(">>>> attchFileNm1 : ", attchFileNm1);
    console.log(">>>> attchFileUrl2 : ", attchFileUrl2);
    console.log(">>>> attchFileNm2 : ", attchFileNm2);
    console.log(">>>> attchFileUrl3 : ", attchFileUrl3);
    console.log(">>>> attchFileNm3 : ", attchFileNm3);
    console.log(">>>> attchFileUrl4 : ", attchFileUrl4);
    console.log(">>>> attchFileNm4 : ", attchFileNm4);
    console.log(">>>> attchFileUrl5 : ", attchFileUrl5);
    console.log(">>>> attchFileNm5 : ", attchFileNm5);
    console.log(">>>> attchFileUrl6 : ", attchFileUrl6);
    console.log(">>>> attchFileNm6 : ", attchFileNm6);
    console.log(">>>> attchFileUrl7 : ", attchFileUrl7);
    console.log(">>>> attchFileNm7 : ", attchFileNm7);
    console.log(">>>> attchFileUrl8 : ", attchFileUrl8);
    console.log(">>>> attchFileNm8 : ", attchFileNm8);
    console.log(">>>> attchFileUrl9 : ", attchFileUrl9);
    console.log(">>>> attchFileNm9 : ", attchFileNm9);
    console.log(">>>> attchFileUrl10 : ", attchFileUrl10);
    console.log(">>>> attchFileNm10 : ", attchFileNm10);


    // SQL
    conn.query('UPDATE assist_qna_tbl SET attch_file_url1 = ?, attch_file_nm1 = ?, attch_file_url2 = ?, attch_file_nm2 = ?,'
        + ' attch_file_url3 = ?, attch_file_nm3 = ?, attch_file_url4 = ?, attch_file_nm4 = ?, attch_file_url7 = ?,'
        + ' attch_file_nm7 = ?, attch_file_url8 = ?, attch_file_nm8 = ?, attch_file_url9 = ?, attch_file_nm9 = ?,'
        + ' attch_file_url10 = ?, attch_file_nm10 = ?, attch_file_url11 = ?, attch_file_nm11 = ?, attch_file_url12 = ?,'
        + ' attch_file_nm12 =  ?, upd_dt = now(), upd_usr_id = ?, upd_usr_nm = ? WHERE req_no = ? AND ins_usr_id = ?',
        [attchFileUrl1, attchFileNm1, attchFileUrl2, attchFileNm2, attchFileUrl3, attchFileNm3, attchFileUrl4, attchFileNm4,
         attchFileUrl5, attchFileNm5, attchFileUrl6, attchFileNm6, attchFileUrl7, attchFileNm7, attchFileUrl8, attchFileNm8,
         attchFileUrl9, attchFileNm9, attchFileUrl10, attchFileNm10, usrId, usrName, reqNo, usrId],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.dir(results);
                res.json({'result' : 'OK', 'session' : ss});
            }
        }
    );

});

/**
 * mobile login 처리.
 */
router.post('/mobile/login/loginProcess', function(req, res) {

    var ss = req.session;
    var usrId = req.body.usrId != null ? req.body.usrId : '';
    var usrPwd = req.body.usrPwd != null ? req.body.usrPwd : '';

    var ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (ipAddress.length < 15) {
        ipAddress = ipAddress;
    } else {
        var nyIP = ipAddress.slice(7);
        ipAddress = nyIP;
    }

    var rTitle = 'JT-LAB 로그인 화면';
    var rRet = ''; var rUsrId = '';

    console.log(">>> ipAddress = " + ipAddress);

    // 조회 처리.
    // 로그인 처리 SQL
    conn.query('select c_id as id, AES_DECRYPT(UNHEX(c_pwd),"jtlab") as pwd, c_no as no,'
        + ' c_name as name, c_email as email, c_tel_no as telNo, c_cell_no as cellNo,'
        + ' c_user_tp as type, c_auth_level as level, c_comp_nm as compNm,'
        + ' c_saup_no as saupNo from c_inf_tbl where c_id = ?'
        + ' and AES_DECRYPT(UNHEX(c_pwd),"jtlab") = ?',
        [usrId, usrPwd],
        function(err, results) {
            //console.log(">>>> result size = " + results.length);
            if(err) {
                console.log('error2 : ', JSON.stringify(err));
            } else {
                if(results.length > 0) {
                    console.log(">>>> result-pwd = " + results[0].pwd);
                    if(usrId != results[0].id) {
                        rRet = 'err0';
                    } else if(usrPwd != results[0].pwd) {
                        rRet = 'err1';
                    } else {
                        // 접속 이력 테이블 저장 처리.
                        conn.query('insert into conn_his_tbl(cview, cpage, cid, cin_date, cip)'
                            + ' values("AssistPro", "index", ?, now(), ?);',
                            [results[0].id, ipAddress],
                            function(err) {
                                if(err) {
                                    console.log('>>>> err3 : ' + JSON.stringify(err));
                                    //res.render('error3', {message: err.message, error : err});
                                }
                            }
                        );
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
                        ss.usrIp = ipAddress;
                        rUsrId = results[0].id;
                        rRet = 'OK';
                    }
                } else {
                    rRet = 'NO';
                }
            }
            res.json({title : rTitle, result : rRet,  session : ss});
        }
    );

});

// 모바일 로그아웃처리.
router.get('/mobile/logout', function(req, res) {
    var ss = req.session;

    // 삭제처리.
    conn.query('insert into conn_his_tbl(cview, cpage, cid, cin_date, cout_date, cip) values("AssistPro", "index", ?,'
        + ' now(), now(), ?);',
        [ss.usrId, ss.usrIp],
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
                });
                //res.redirect('/assist/mobile');
                res.render('./assist/mobile/loginView', {'session' : ss});
            }
        }
    );
});


// 파일업로드 처리.
//var upload1 = multer({storage : storage, limits: {fileSize: maxFileSize}}).single('attchFile');
var upload1 = multer({storage : storage}).single('attchFile');
router.post('/request/upload', function(req, res) {
    console.log(">>>>> request upload ");
    try {
        upload1(req, res, function() {
            console.log("req.body : ", req.body);
            var file = req.file;
            var originalFileNm = file.originalname;
            var savedFileNm = file.filename;
            var fileFullPath = file.destination.replace('./', 'https://www.jt-lab.co.kr/');
            var fileSize = file.size;
                console.log("originalFileNm : '%s', savedFile: '%s', size : '%s'", originalFileNm, savedFileNm, fileSize);
                console.log(">>> savedFileNm = " + savedFileNm);
    /*        if(err) {
                return res.send(err);
            } else {
                return res.json({result : 'OK', fileName : savedFileNm, fileFullPath : fileFullPath, fileSize : fileSize});
            }*/
            return res.json({result : 'OK', fileName : savedFileNm, fileFullPath : fileFullPath, fileSize : fileSize});
        });
    } catch(err){
        console.log("filupload err : " + JSON.stringify(err));
        return res.send(err);
    }
});

// 파일 다운로드 모듈
router.post('/request/download', function(req, res) {
    console.log('파일 다운로드 개시');
    //console.log('fileName : ' + req.body.fileName.replace('https://www.jt-lab.co.kr/', './'));
    var file = req.body.fileName.replace('https://www.jt-lab.co.kr/', './');
    //console.log(" file : " + file);
    //res.download(file, encodeURIComponent(path.basename(file)));
    res.download(file, path.basename(file));
});


// 파일 다운로드 모듈
router.post('/data/download', function(req, res) {
    var ss = req.session;

    console.log('파일 다운로드 개시');
    //console.log('fileName : ' + req.body.fileName.replace('http://localhost:18080/', './'));
    var file = req.body.fileName.replace('https://www.jt-lab.co.kr/', './');
    var ext = file.split('.').pop().toLowerCase();
    console.log("ext = " + ext);
    if(ext=='pdf' || ext=='PDF') {
        file = file.replace('tmp/', '../../');
        //console.log(" file : " + file);
        // 프린트 호출.
        //res.redirect('/library/pdf/viewer.html?file='+encodeURIComponent(file));
        res.redirect('/library/pdf/viewer.html?file='+file);
    } else {
        //console.log(" file : " + file);
        //res.download(file, encodeURIComponent(path.basename(file)));
        res.download(file, path.basename(file));
    }
});
/**
 * 메일 전송 처리 함수.
 * @param receiverEmail
 * @param receiver
 * @param content
 */
function sendMail(senderEmail, sender, content) {

console.log('sendMail senderEmail', senderEmail);

    var title = '[JT-LAB] AssistPro 서비스 진행상태 알림 안내';
    //var fromEmail = '['+ sender+'] '+ '< ' + senderEmail +' >';
    var fromEmail = '[JT-LAB] AssistPro'+ '< ' + senderEmail +' >';
    var toEmail = '[관리자] < yongwoo.lee@jt-lab.co.kr >; [관리자] < jtlab.tech2@gmail.com >';
    var bcEmail = '< logger@jt-lab.co.kr >';
    var fromName = sender;
    var toName = '어시스트프로';

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
            bc : bcEmail,
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
        });
    });

}

/**
 * 메일 정보 셋팅.
 * @param session
 */
/*
function sendMail(session, content) {
        var sender = 'JT-LAB < jtlab.tech2@gmail.com >';
        var senderName = '관리자';
        var receiver =  session.usrName + ' < '+ session.usrEmail + '> ';
        var receiverName = session.usrName;

    var title = "[JT-LAB] AssistPro 서비스 진행상태 알림 안내";
    var message = {
        text : mainContent(title, sender,receiver, senderName, receiverName, content),
        from : sender,
        to : receiver,
        subject : title
    };
    emailServer.send(message, function(err, message) {
        if(err) {
            console.log('email send err : ', err);
        } else {
            console.log(">>> 메일 발송 처리 정상 처리 !!! <<<");
            console.log('email message :, ', message);
        }
    });
}
*/
/**
 * 이메일 발송 모듈.
 * @param senderEmail
 * @param sender
 * @param content
 */
/*
function sendMail(senderEmail, sender, content) {

    var title = '[JT-LAB] AssistPro 서비스 진행상태 알림 안내';
    var fromEmail = '['+ sender+'] '+ '< ' + senderEmail +' >';
    var toEmail = '[JT-LAB] < jtlab.notifier@gmail.com >; [관리자] < yongwoo.lee@jt-lab.co.kr >; [관리자] < jtlab.tech2@gmail.com >';
    var ccEmail = '< logger@jt-lab.co.kr >';
    var fromName = sender;
    var toName = '관리자';

    var mailOptions = {
        from : fromEmail,
        to : toEmail,
        cc : ccEmail,
        subject : title,
        text : mainContent(title, fromEmail, toEmail, fromName, toName, content)
    };

    smtpTransport.sendMail(mailOptions, function(err, info) {
        if(err) {
            console.log(err);
            //res.end();
        } else {
            //console.log('accepted : ', info.accepted);
            //console.log('envelope : ', info.envelope);
            //console.log('messageId : ', info.messageId);
            //console.log('response : ', info.response.toString());
            console.log('Message Sent : ' + JSON.stringify(info));
            //res.end();
        }
    });
}
*/
/**
 * 메일 템플릿
 * @param title
 * @param fromEmail
 * @param toEmail
 * @param fromName
 * @param toName
 * @param content
 * @returns {string}
 */
function  mainContent(title, fromEmail, toEmail, fromName, toName, content) {

    /*var html = "<!DOCTYPE html><html lang='ko'><meta charset='utf-8'><meta http-equiv='X-UA-Compatible' content='IE=edge'<meta name='viewport' content='width=device-width, initial-scale=1'>";
    html += "<head><title>JT-LAB Email</title>";
    html += "<!--[if lt IE 9]><script src='https://oss.maxcdn.com/libs/html5shiv/3.7.0/html5shiv.js'></script><script src='https://oss.maxcdn.com/libs/respond.js/1.4.2/respond.min.js'></script><![endif]-->";
    html += "</head><body><div></div><div><h3>JT-LAB 메일공지</h3></div><div>보내는 분 ("+ fromName +") : "+ fromEmail +"</div><div>받는 분 ("+ toName +") : "+ toEmail +"</div>";
    html += "<div>제목 : " + title + "</div>";
    html += "<div>" + content + "</div>";
    html += "</body></html>";*/

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


module.exports = router;