/*
 * 모듈명  : assist.js
 * 설명    : 관리자화면 메뉴 'Assist Pro' 에 대한 모듈.
 * 작성일  : 2016년 11월 1일
 * author  : HiBizNet
 * copyright : JT-LAB
 * version : 1.0
 */
var express = require('express');
var engine = require('ejs-locals');
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
var templateDir = path.resolve(__dirname, '../templates');
var smtpTransport = require('nodemailer-smtp-transport');
var router = express.Router();

// use
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));
router.use(methodOverride("_method"));
router.use(flash());

router.use('ejs', engine);
// mysql setting
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
var setPath2 = '';
// os별 path setting
if(os.platform()=='win32') {
    setPath = './tmp/attachFiles/';
    setPath2 = './tmp/thumbnail/';
} else {
    setPath = './tmp/attachFiles/';
    setPath2 = './tmp/thumbnail/';
}

// storage setting
var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        var stat = null;
        var dateTimeStamp = Date.now();
        try {
            stat = fs.statSync(setPath + dateTimeStamp);
        } catch (err) {
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
// storage2 setting
var storage2 = multer.diskStorage({
    destination: function (req, file, callback) {
        var stat = null;
        try {
            // OS상 경로표시가 다르기 때문에 맞춰서 설정함.
            stat = fs.statSync(setPath2);
        } catch (err) {
            fs.mkdirSync(setPath2);
        }
        if(stat && !stat.isDirectory()) {
            throw new Error('Directory cannot be created');
        }
        callback(null, setPath2);
    },
    filename: function (req, file, callback) {
        i++;
        callback(null, Date.now() + '_' + file.originalname);
        if (maxFileCount == i) {
            i = 0;
        }
    }
});

// 어시스트 메인 호출.
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
router.get('/', function(req, res) {
    var ss = req.session;

    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {

        conn.query('select @rownum:=@rownum+1 as num, req_no as reqNo, comp_nm as compNm, writer_nm as writerNm,'
            + ' car_maker_nm as carMakerNm, car_model_nm as carModelNm, car_num as carNum, vin_no as vinNo, mileage as mileage, title as title,'
            + ' case when process_status = "sav" then "임시저장" when process_status = "rct" then "진행대기" when process_status = "prc" then "진행중"'
            + ' when process_status = "cmp" then "완료" when process_status = "mts" then "답변작성중" when process_status = "nop" then "장기미처리" else "" end as processStatus,'
            + ' DATE_FORMAT(ins_dt,"%Y-%m-%d") as insDt,  ins_usr_id as insUsrId, ins_usr_nm as insUsrNm,'
            + ' DATE_FORMAT(upd_dt,"%Y-%m-%d") as updDt, upd_usr_nm as updUsrNm from assist_qna_tbl, (SELECT @rownum:=0) TMP'
            + ' WHERE process_status not in ("tmp", "") and ins_dt <= now() order by ins_dt desc, req_no asc limit 10;',
            [],
            function(err, results) {
                if(err) {
                    console.log("err : " + err.message);
                    res.render('error', {message: err.message, error: err, session: ss});
                } else {
                    console.log("assist 관리자 메인 정보 조회!");
                    console.dir(results);
                    res.render('./admin/assist/dashboard', {result: results, session : ss});
                }
            });

    } else {
        res.redirect('/admin/login');
    }
});

// 어시스트 QnA 조회.
/**
 *
 */
router.get('/request', function(req, res) {
    var ss = req.session;

    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {

        var srchText = "";
        var srchProcess = "";
        var srchCompNm = "";
        var srchMakerNm = "";
        var setDateCheckBox = 'false';
        var srchType = req.body.srchType != null ? req.body.srchType : "";
//console.log('srchType : ', srchType);
        if(srchType=="process") {
            srchText = req.body.process !=null ? req.body.process : "";
            srchProcess = req.body.process !=null ? req.body.process : "";
//console.log('srchProcess : ', srchProcess);
        } else if(srchType=="compNm") {
            srchText = req.body.compNm !=null ? req.body.compNm : "";
            srchCompNm = req.body.compNm !=null ? req.body.compNm : "";
//console.log('srchCompNm : ', srchCompNm);
        } else if(srchType=="carMakerNm") {
            srchText = req.body.carMakerNm !=null ? req.body.carMakerNm : "";
            srchMakerNm = req.body.carMakerNm !=null ? req.body.carMakerNm : "";
//console.log('srchMakerNm : ', srchMakerNm);
        } else {
            srchText = req.body.srchText != null ? req.body.srchText : "";
        }
        var fromDate = req.body.fromDate != null ? req.body.fromDate : '';
        var toDate = req.body.toDate != null ? req.body.toDate : '';

        //console.log(">>> srchType : " + srchType);
        //console.log(">>> formDate : ", fromDate);
        //console.log(">>> toDate : ", toDate);

        var addSQL = ""; var dateSQL = "";
        // 날짜 검색 처리.
        if(fromDate != '' && toDate != '') {
            setDateCheckBox = 'true';
            dateSQL = ' AND x.ins_dt >= DATE_FORMAT('+ fromDate +',"%Y-%m-%d") AND x.ins_dt < DATE_FORMAT('+ toDate +', "%Y-%m-%d") + interval 1 day';
        }
        //console.log(">>> dateSQL : " + dateSQL);

        // 검색 처리.
        if (srchType == "requestNo") {
            addSQL = ' AND x.req_no like concat("%", ?, "%")';
        } else if (srchType == "compNm") {
            addSQL = ' AND x.comp_nm like concat(?,"%")';
        } else if (srchType == "carMakerNm") {
            addSQL = ' AND x.car_maker_nm like concat(?,"%")';
        } else if (srchType == "title") {
            addSQL = ' AND x.title like concat(?,"%")';
        } else if (srchType == "memo") {
            addSQL = ' AND x.memo like concat(?,"%")';
        } else if (srchType == "process") {
            srchText = srchProcess;
            addSQL = ' AND x.process_status = LOWER(?)';
        }
        // 페이징 처리.
        var reqPage = req.query.page ? parseInt(req.query.page) : 0;
        //console.log(">>> reqPage = " + reqPage);
        var offset = 3;
        var page = Math.max(1, reqPage);
        //console.log(">>> page = " + page);
        var limit = 10;
        var skip = (page - 1) * limit;

        // 조회.
        conn.query('SELECT count(*) as cnt FROM assist_qna_tbl x WHERE x.process_status not in ("sav", "tmp", "") ' + dateSQL + addSQL + ';'
            + ' SELECT @rownum:=@rownum+1 as num, a.* FROM (SELECT @rownum:=' + skip + ') TMP, ( SELECT z.* FROM ('
            + ' SELECT x.req_no as reqNo, x.title as title, x.comp_nm as compNm, x.writer_nm as writerNm, x.car_maker_nm as carMakerNm,'
            + ' case when x.process_status = "sav" then "임시저장" when x.process_status = "rct" then "진행대기" when x.process_status = "prc" then "진행중"'
            + ' when x.process_status = "cmp" then "완료" when x.process_status = "mts" then "답변작성중" when process_status = "nop" then "장기미처리" else "" end as processStatusNm, x.process_status as processStatus,'
            + ' DATE_FORMAT(x.ins_dt,"%Y-%m-%d") as insDt,  x.ins_usr_id as insUsrId, x.ins_usr_nm as insUsrNm,'
            + ' DATE_FORMAT(x.upd_dt,"%Y-%m-%d") as updDt, x.upd_usr_nm as updUsrNm,'
            + ' (select count(rno) from assist_qna_comment_tbl where req_no = x.req_no) as cmtCnt,'
            + ' x.view_yn as viewYn, x.ins_view_yn as insViewYn, x.reply_view_yn as replyViewYn,'
            + ' y.writer_view_yn as writerViewYn, y.reply_yn as replyYn, x.ins_dt, x.reply_date, y.writer_ins_date, y.reply_ins_date, y.view_yn as cmtViewYn'
            + ' FROM assist_qna_tbl x LEFT OUTER JOIN assist_qna_comment_tbl y ON x.req_no = y.req_no'
            + ' WHERE x.process_status not in ("sav", "tmp", "")' + dateSQL + addSQL
            + ' ORDER BY (CASE WHEN x.ins_dt is not null AND x.reply_date is not null AND y.writer_ins_date is not null AND y.reply_ins_date is null THEN y.writer_ins_date'
            + ' WHEN x.ins_dt is not null AND x.reply_date is not null  AND y.writer_ins_date is not null AND y.reply_ins_date is not null THEN y.reply_ins_date'
            + ' WHEN x.ins_dt is not null AND x.reply_date is not null  AND y.writer_ins_date is null AND y.reply_ins_date is null THEN x.reply_date'
            + ' WHEN x.ins_dt is not null AND x.reply_date is null AND y.writer_ins_date is null AND y.reply_ins_date is null THEN x.ins_dt END) DESC'
            + ' ) z  GROUP BY reqNo'
            + ' ORDER BY (CASE WHEN ins_dt is not null AND reply_date is not null AND writer_ins_date is not null AND reply_ins_date is null THEN writer_ins_date'
            + ' WHEN ins_dt is not null AND reply_date is not null AND writer_ins_date is not null AND reply_ins_date is not null THEN reply_ins_date'
            + ' WHEN ins_dt is not null AND reply_date is not null AND writer_ins_date is null AND reply_ins_date is null THEN reply_date'
            + ' WHEN ins_dt is not null AND reply_date is null AND writer_ins_date is null AND reply_ins_date is null THEN ins_dt END) DESC) a LIMIT ' + skip + ', ' + limit + ';'
            + ' SELECT comm_cd as commCd, comm_nm as commNm FROM commcd_inf_tbl WHERE p_comm_cd = "P001" ORDER BY sort_no ASC;'
            + ' SELECT comm_cd as commCd2, comm_nm as commNm2 FROM commcd_inf_tbl WHERE p_comm_cd = "C000" ORDER BY comm_nm ASC;'
            + ' SELECT distinct comp_nm as compNm FROM assist_qna_tbl WHERE comp_nm is not null ORDER BY comp_nm ASC;',
            [srchText, srchText],
            function (err, results) {
                if (err) {
                    console.log('error : ', err.message);
                    res.render('error', {message: err.message, error: err, session: ss});
                } else {
                    var count = results[0][0].cnt;
                    var maxPage = Math.ceil(count / limit);
                    if(fromDate !='' && toDate != '') {
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

                    res.render('./admin/assist/list', {
                        rList: results[1],
                        srchType: srchType,
                        srchText: srchText,
                        page: page,
                        maxPage: maxPage,
                        offset: offset,
                        sList: results[2],
                        sList2: results[3],
                        sList3: results[4],
                        srchProcess : srchProcess,
                        srchCompNm : srchCompNm,
                        srchMakerNm : srchMakerNm,
                        fromDate : fromDate,
                        toDate : toDate,
                        setDateCheckBox : setDateCheckBox,
                        session: ss
                    });
                }
            }
        );
    } else {
        res.redirect('/admin');
    }

});

// 어시스트 QnA 검색 조회.
router.post('/request/search', function(req, res) {
    var ss = req.session;

    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {

        var srchText = "";
        var srchProcess = "";
        var srchCompNm = "";
        var srchMakerNm = "";
        var setDateCheckBox = 'false';
        var srchType = req.body.srchType != null ? req.body.srchType : "";
//console.log('srchType : ', srchType);
        if(srchType=="process") {
            srchText = req.body.process !=null ? req.body.process : "";
            srchProcess = req.body.process !=null ? req.body.process : "";
//console.log('srchProcess : ', srchProcess);
        } else if(srchType=="compNm") {
            srchText = req.body.compNm !=null ? req.body.compNm : "";
            srchCompNm = req.body.compNm !=null ? req.body.compNm : "";
//console.log('srchCompNm : ', srchCompNm);
        } else if(srchType=="carMakerNm") {
            srchText = req.body.carMakerNm !=null ? req.body.carMakerNm : "";
            srchMakerNm = req.body.carMakerNm !=null ? req.body.carMakerNm : "";
//console.log('srchMakerNm : ', srchMakerNm);
        } else {
            srchText = req.body.srchText != null ? req.body.srchText : "";
        }
        var fromDate = req.body.fromDate != null ? req.body.fromDate : '';
        var toDate = req.body.toDate != null ? req.body.toDate : '';

//console.log('srchText : ', srchText);
        //console.log(">>> srchType : " + srchType);
        //console.log(">>> formDate : ", fromDate);
        //console.log(">>> toDate : ", toDate);

        var addSQL = ""; var dateSQL = "";
        // 날짜 검색 처리.
        if(fromDate != '' && toDate != '') {
            setDateCheckBox = 'true';
            dateSQL = ' AND x.ins_dt >= DATE_FORMAT('+ fromDate +',"%Y-%m-%d") AND x.ins_dt < DATE_FORMAT('+ toDate +', "%Y-%m-%d") + interval 1 day';
        }
        //console.log("dateSQL : " + dateSQL);

        if (srchType == "requestNo") {
            addSQL = ' AND x.req_no like concat("%", ?, "%")';
        } else if (srchType == "compNm") {
            addSQL = ' AND x.comp_nm like concat(?,"%")';
        } else if (srchType == "carMakerNm") {
            addSQL = ' AND x.car_maker_nm like concat(?,"%")';
        } else if (srchType == "title") {
            addSQL = ' AND x.title like concat(?,"%")';
        } else if (srchType == "memo") {
            addSQL = ' AND x.memo like concat(?,"%")';
        } else if (srchType == "process") {
            addSQL = ' AND x.process_status = ?';
        }
        // 페이징 처리.
        var reqPage = req.query.page ? parseInt(req.query.page) : 0;
        //console.log(">>> reqPage = " + reqPage);
        var offset = 3;
        var page = Math.max(1, reqPage);
        //console.log(">>> page = " + page);
        var limit = 10;
        var skip = (page - 1) * limit;

        // 조회.
        conn.query('SELECT count(*) as cnt FROM assist_qna_tbl x WHERE x.process_status not in ("sav", "tmp", "") ' + dateSQL + addSQL + ';'
            + ' SELECT @rownum:=@rownum+1 as num, a.* FROM (SELECT @rownum:=' + skip + ') TMP, ( SELECT z.* FROM ('
            + ' SELECT x.req_no as reqNo, x.title as title, x.comp_nm as compNm, x.writer_nm as writerNm, x.car_maker_nm as carMakerNm,'
            + ' case when x.process_status = "sav" then "임시저장" when x.process_status = "rct" then "진행대기" when x.process_status = "prc" then "진행중"'
            + ' when x.process_status = "cmp" then "완료" when x.process_status = "mts" then "답변작성중" when process_status = "nop" then "장기미처리" else "" end as processStatusNm, x.process_status as processStatus,'
            + ' DATE_FORMAT(x.ins_dt,"%Y-%m-%d") as insDt,  x.ins_usr_id as insUsrId, x.ins_usr_nm as insUsrNm,'
            + ' DATE_FORMAT(x.upd_dt,"%Y-%m-%d") as updDt, x.upd_usr_nm as updUsrNm,'
            + ' (select count(rno) from assist_qna_comment_tbl where req_no = x.req_no) as cmtCnt,'
            + ' x.view_yn as viewYn, x.ins_view_yn as insViewYn, x.reply_view_yn as replyViewYn,'
            + ' y.writer_view_yn as writerViewYn, y.reply_yn as replyYn, x.ins_dt, x.reply_date, y.writer_ins_date, y.reply_ins_date, y.view_yn as cmtViewYn'
            + ' FROM assist_qna_tbl x LEFT OUTER JOIN assist_qna_comment_tbl y ON x.req_no = y.req_no'
            + ' WHERE x.process_status not in ("sav", "tmp", "")' + dateSQL + addSQL
            + ' ORDER BY (CASE WHEN x.ins_dt is not null AND x.reply_date is not null AND y.writer_ins_date is not null AND y.reply_ins_date is null THEN y.writer_ins_date'
            + ' WHEN x.ins_dt is not null AND x.reply_date is not null  AND y.writer_ins_date is not null AND y.reply_ins_date is not null THEN y.reply_ins_date'
            + ' WHEN x.ins_dt is not null AND x.reply_date is not null  AND y.writer_ins_date is null AND y.reply_ins_date is null THEN x.reply_date'
            + ' WHEN x.ins_dt is not null AND x.reply_date is null AND y.writer_ins_date is null AND y.reply_ins_date is null THEN x.ins_dt END) DESC'
            + ' ) z  GROUP BY reqNo'
            + ' ORDER BY (CASE WHEN ins_dt is not null AND reply_date is not null AND writer_ins_date is not null AND reply_ins_date is null THEN writer_ins_date'
            + ' WHEN ins_dt is not null AND reply_date is not null AND writer_ins_date is not null AND reply_ins_date is not null THEN reply_ins_date'
            + ' WHEN ins_dt is not null AND reply_date is not null AND writer_ins_date is null AND reply_ins_date is null THEN reply_date'
            + ' WHEN ins_dt is not null AND reply_date is null AND writer_ins_date is null AND reply_ins_date is null THEN ins_dt END) DESC) a LIMIT ' + skip + ', ' + limit + ';'
            + ' SELECT comm_cd as commCd, comm_nm as commNm FROM commcd_inf_tbl WHERE p_comm_cd = "P001" ORDER BY sort_no ASC;'
            + ' SELECT comm_cd as commCd2, comm_nm as commNm2 FROM commcd_inf_tbl WHERE p_comm_cd = "C000" ORDER BY comm_nm ASC;'
            + ' SELECT distinct comp_nm as compNm FROM assist_qna_tbl WHERE comp_nm is not null ORDER BY comp_nm ASC;',
            [srchText, srchText],
            function (err, results) {
                if (err) {
                    console.log('error : ', err.message);
                    res.render('error', {message: err.message, error: err, session: ss});
                } else {
                    var count = results[0][0].cnt;
                    var maxPage = Math.ceil(count / limit);
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

                    res.render('./admin/assist/list', {
                        rList: results[1],
                        srchType: srchType,
                        srchText: srchText,
                        page: page,
                        maxPage: maxPage,
                        offset: offset,
                        sList: results[2],
                        sList2: results[3],
                        sList3: results[4],
                        srchProcess : srchProcess,
                        srchCompNm : srchCompNm,
                        srchMakerNm : srchMakerNm,
                        fromDate : fromDate,
                        toDate : toDate,
                        setDateCheckBox : setDateCheckBox,
                        session: ss
                    });
                }
            }
        );
    } else {
        res.redirect('/admin');
    }

});

// 문의요청폼 호출.
router.get('/request/reply/:no', function(req, res) {
    var ss = req.session;

    // 조회.
    conn.query('SELECT req_no as reqNo, comp_nm as compNm, writer_nm as writerNm, writer_email as writerEmail,'
        + ' writer_tel_no as writerTelNo, writer_tel_no1 as writerTelNo1, writer_tel_no2 as writerTelNo2, writer_tel_no3 as writerTelNo3,'
        + ' writer_cell_no as writerCellNo,  writer_cell_no1 as writerCellNo1,  writer_cell_no2 as writerCellNo2,  writer_cell_no3 as writerCellNo3, car_maker_nm as carMakerNm, car_num as carNum,'
        + ' vin_no as vinNo, mileage as mileage, title as title, tro_stat_desc as troStatDesc, tech_check_stat_desc as techCheckStatDesc, running_work_desc as runningWorkDesc,'
        + ' reply_manager_id as replyManagerId, reply_manager_nm as replyManagerNm, reply_desc as replyDesc, DATE_FORMAT(reply_date, "%Y-%m-%d") as replyDate, memo as memo,'
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
        + ' DATE_FORMAT(ins_dt,"%Y-%m-%d") as insDt, ins_usr_id as insUsrId, ins_usr_nm as insUsrNm,'
        + ' DATE_FORMAT(upd_dt,"%Y-%m-%d") as updDt, upd_usr_nm as updUsrNm FROM assist_qna_tbl WHERE req_no = ?;',
        [req.params.no],
        function(err, results) {
            if (err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.render('./admin/assist/new', {result : results[0], session : ss});
            }
        }
    );

});

// 접수 관리자 답변 처리.
router.post('/request/insert', function(req, res) {
    var ss = req.session;
    //var usrLevel = ss.usrLevel !=null ? ss.usrLevel : '';
    //var writerName = '';
    //if(usrLevel=='000') { writerName = '어시스트프로'; }
    //console.log(">>>> ss.usrId : " + ss.usrId);
    //console.log(">>>> ss.usrName : " + ss.usrName);
    //console.log(">>>> req.body.replyDesc : " + JSON.stringify(req.body));

    // 쿼리 처리.
    conn.query('UPDATE assist_qna_tbl SET reply_manager_id = ?, reply_manager_nm = ?, reply_desc = ?, process_status = "mts",'
        + ' attch_file_url5 = ?, attch_file_nm5 = ?, attch_file_url6 = ?, attch_file_nm6 = ?, attch_file_url13 = ?, attch_file_nm13 = ?, attch_file_url14 = ?, attch_file_nm14 = ?,'
        + ' attch_file_url15 = ?, attch_file_nm15 = ?, attch_file_url16 = ?, attch_file_nm16 = ?, attch_file_url17 = ?, attch_file_nm17 = ?, attch_file_url18 = ?, attch_file_nm18 = ?,'
        + ' attch_file_url19 = ?, attch_file_nm19 = ?, attch_file_url20 = ?, attch_file_nm20 = ?, memo = ?, reply_date = now()'
        + ' WHERE req_no = ?',
        [ss.usrId, ss.usrName, req.body.replyDesc, req.body.attchFileUrl11, req.body.attchFileNm11, req.body.attchFileUrl12,
            req.body.attchFileNm12, req.body.attchFileUrl13, req.body.attchFileNm13, req.body.attchFileUrl14, req.body.attchFileNm14,
            req.body.attchFileUrl15, req.body.attchFileNm15, req.body.attchFileUrl16, req.body.attchFileNm16, req.body.attchFileUrl17, req.body.attchFileNm17,
            req.body.attchFileUrl18, req.body.attchFileNm18, req.body.attchFileUrl19, req.body.attchFileNm19, req.body.attchFileUrl20, req.body.attchFileNm20,
            req.body.memo, req.body.reqNo],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                //console.dir(">>> result : " + results);
                res.redirect('/admin/assist/request/view/'+req.body.reqNo);
            }
        });

});

// 상세 화면 호출.
router.get('/request/view/:no', function(req, res) {

    var ss = req.session;
    var reqNo = req.params.no !=null ? req.params.no : "";

    console.log("뷰 조회.");
    // 조회.
    conn.query('SELECT req_no as reqNo, comp_nm as compNm, writer_nm as writerNm, writer_email as writerEmail,'
        + ' writer_tel_no as writerTelNo, writer_tel_no1 as writerTelNo1, writer_tel_no2 as writerTelNo2, writer_tel_no as writerTelNo3,'
        + ' writer_cell_no as writerCellNo, writer_cell_no1 as writerCellNo1, writer_cell_no2 as writerCellNo2, writer_cell_no3 as writerCellNo3, car_maker_nm as carMakerNm, car_num as carNum,'
        + ' vin_no as vinNo, mileage as mileage, title as title, tro_stat_desc as troStatDesc, tech_check_stat_desc as techCheckStatDesc, running_work_desc as runningWorkDesc,'
        + ' reply_manager_id as replyManagerId, reply_manager_nm as replyManagerNm, reply_desc as replyDesc, DATE_FORMAT(reply_date, "%Y-%m-%d") as replyDate, memo as memo,'
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
        + ' attch_file_url20 as attchFileUrl20, attch_file_nm20 as attchFileNm20, DATE_FORMAT(ins_dt,"%Y-%m-%d") as insDt, ins_usr_id as insUsrId,'
        + ' ins_usr_nm as insUsrNm, DATE_FORMAT(upd_dt,"%Y-%m-%d") as updDt, upd_usr_nm as updUsrNm FROM assist_qna_tbl WHERE req_no = ?;'
        + ' SELECT count(rno) as cnt FROM assist_qna_comment_tbl WHERE req_no = ?;'
        + ' SELECT @rownum:=@rownum+1 as num, rno as rNo, req_no as reqNo, writer_comment as writeComment, writer_nm as writerNm,'
        + ' DATE_FORMAT(writer_ins_date, "%Y-%m-%d %H:%m") as writerInsDate, writer_ins_id as writerInsId, writer_attch_file_url1 as wAttchFileUrl1,'
        + ' writer_attch_file_nm1 as wAttchFileNm1, writer_attch_file_url2 as wAttchFileUrl2, writer_attch_file_nm2 as wAttchFileNm2, reply_yn as replyYn,'
        + ' reply_comment as replyComment, DATE_FORMAT(reply_ins_date,"%Y-%m-%d") as replyInsDate, reply_ins_nm as replyInsNm, reply_ins_id as replyInsId,'
        + ' reply_attch_file_url1 as replyAttchFileUrl1, reply_attch_file_nm1 as replyAttchFileNm1, reply_attch_file_url2 as replyAttchFileUrl2,'
        + ' reply_attch_file_nm2 as replyAttchFileNm2 FROM assist_qna_comment_tbl, (SELECT @rownum:=0) TMP WHERE req_no = ? ORDER BY writer_ins_date DESC, reply_ins_date DESC;',
        [reqNo, reqNo, reqNo],
        function(err, results) {
            if (err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                var count = results[1][0].cnt;
                res.render('./admin/assist/view', {result : results[0][0], rCount : count, rList : results[2], session : ss});
            }
        }
    );

});

// 상세 화면 호출.
router.get('/request/view/:no/:yn/:yn2', function(req, res) {

    var ss = req.session;
    var insViewYn = req.params.yn !=null ? req.params.yn : '';
    var writerViewYn = req.params.yn2 !=null ? req.params.yn2 : '';
    var reqNo = req.params.no !=null ? req.params.no : "";

    if(insViewYn != '' && insViewYn=='N') {
        console.log("조회확인(insViewYn) 업데이트 처리.");
        conn.query('UPDATE assist_qna_tbl SET ins_view_yn = "Y" WHERE req_no = ?;',
            [reqNo],
            function(err) {
                if(err) {
                    console.log('error : ', err.message);
                    res.render('error', {message: err.message, error : err, session: ss});
                }
            }
        );
    } else if(writerViewYn != '' && writerViewYn == "N") {
        console.log("조회확인(writerViewYn) 업데이트 처리.");
        conn.query('UPDATE assist_qna_comment_tbl SET view_yn = "Y" WHERE req_no = ?;',
            [reqNo],
            function(err) {
                if(err) {
                    console.log('error : ', err.message);
                    res.render('error', {message: err.message, error : err, session: ss});
                }
            }
        );
    }

    console.log("뷰 조회.");
    // 조회.
    conn.query('SELECT req_no as reqNo, comp_nm as compNm, writer_nm as writerNm, writer_email as writerEmail,'
        + ' writer_tel_no as writerTelNo, writer_tel_no1 as writerTelNo1, writer_tel_no2 as writerTelNo2, writer_tel_no as writerTelNo3,'
        + ' writer_cell_no as writerCellNo, writer_cell_no1 as writerCellNo1, writer_cell_no2 as writerCellNo2, writer_cell_no3 as writerCellNo3, car_maker_nm as carMakerNm, car_num as carNum,'
        + ' vin_no as vinNo, mileage as mileage, title as title, tro_stat_desc as troStatDesc, tech_check_stat_desc as techCheckStatDesc, running_work_desc as runningWorkDesc,'
        + ' reply_manager_id as replyManagerId, reply_manager_nm as replyManagerNm, reply_desc as replyDesc, DATE_FORMAT(reply_date, "%Y-%m-%d") as replyDate, memo as memo,'
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
        + ' attch_file_url20 as attchFileUrl20, attch_file_nm20 as attchFileNm20, DATE_FORMAT(ins_dt,"%Y-%m-%d") as insDt,  ins_usr_id as insUsrId,'
        + ' ins_usr_nm as insUsrNm, DATE_FORMAT(upd_dt,"%Y-%m-%d") as updDt, upd_usr_nm as updUsrNm FROM assist_qna_tbl WHERE req_no = ?;'
        + ' SELECT count(rno) as cnt FROM assist_qna_comment_tbl WHERE req_no = ?;'
        + ' SELECT @rownum:=@rownum+1 as num, rno as rNo, req_no as reqNo, writer_comment as writeComment, writer_nm as writerNm,'
        + ' DATE_FORMAT(writer_ins_date, "%Y-%m-%d %H:%m") as writerInsDate, writer_ins_id as writerInsId, writer_attch_file_url1 as wAttchFileUrl1,'
        + ' writer_attch_file_nm1 as wAttchFileNm1, writer_attch_file_url2 as wAttchFileUrl2, writer_attch_file_nm2 as wAttchFileNm2, reply_yn as replyYn,'
        + ' reply_comment as replyComment, DATE_FORMAT(reply_ins_date,"%Y-%m-%d") as replyInsDate, reply_ins_nm as replyInsNm, reply_ins_id as replyInsId,'
        + ' reply_attch_file_url1 as replyAttchFileUrl1, reply_attch_file_nm1 as replyAttchFileNm1, reply_attch_file_url2 as replyAttchFileUrl2,'
        + ' reply_attch_file_nm2 as replyAttchFileNm2 FROM assist_qna_comment_tbl, (SELECT @rownum:=0) TMP WHERE req_no = ? ORDER BY writer_ins_date DESC, reply_ins_date DESC;',
        [reqNo, reqNo, reqNo],
        function(err, results) {
            if (err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                var count = results[1][0].cnt;
                res.render('./admin/assist/view', {result : results[0][0], rCount : count, rList : results[2], session : ss});
            }
        }
    );

});

// 상세 화면 호출.
/**
 * 댓글 코멘트 및 접수건 상세 조회 처리.
 */
router.get('/request/view/:no/comment/:yn', function(req, res) {

    var ss = req.session;
    var viewYn = req.params.yn !=null ? req.params.yn : '';
    var reqNo = req.params.no !=null ? req.params.no : '';

    if(viewYn != '' && viewYn == "N") {
        console.log("댓글 조회확인(viewYn) 업데이트 처리.");
        conn.query('UPDATE assist_qna_comment_tbl SET view_yn = "Y" WHERE req_no = ?;',
            [reqNo],
            function(err) {
                if(err) {
                    console.log('error : ', err.message);
                    res.render('error', {message: err.message, error : err, session: ss});
                }
            }
        );
    }

    console.log("뷰 조회.");
    // 조회.
    conn.query('SELECT req_no as reqNo, comp_nm as compNm, writer_nm as writerNm, writer_email as writerEmail,'
        + ' writer_tel_no as writerTelNo, writer_tel_no1 as writerTelNo1, writer_tel_no2 as writerTelNo2, writer_tel_no as writerTelNo3,'
        + ' writer_cell_no as writerCellNo, writer_cell_no1 as writerCellNo1, writer_cell_no2 as writerCellNo2, writer_cell_no3 as writerCellNo3, car_maker_nm as carMakerNm, car_num as carNum,'
        + ' vin_no as vinNo, mileage as mileage, title as title, tro_stat_desc as troStatDesc, tech_check_stat_desc as techCheckStatDesc, running_work_desc as runningWorkDesc,'
        + ' reply_manager_id as replyManagerId, reply_manager_nm as replyManagerNm, reply_desc as replyDesc, DATE_FORMAT(reply_date, "%Y-%m-%d") as replyDate, memo as memo,'
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
        + ' attch_file_url20 as attchFileUrl20, attch_file_nm20 as attchFileNm20, DATE_FORMAT(ins_dt,"%Y-%m-%d") as insDt, ins_usr_id as insUsrId,'
        + ' ins_usr_nm as insUsrNm, DATE_FORMAT(upd_dt,"%Y-%m-%d") as updDt, upd_usr_nm as updUsrNm FROM assist_qna_tbl WHERE req_no = ?;'
        + ' SELECT count(rno) as cnt FROM assist_qna_comment_tbl WHERE req_no = ?;'
        + ' SELECT @rownum:=@rownum+1 as num, rno as rNo, req_no as reqNo, writer_comment as writeComment, writer_nm as writerNm,'
        + ' DATE_FORMAT(writer_ins_date, "%Y-%m-%d %H:%m") as writerInsDate, writer_ins_id as writerInsId, writer_attch_file_url1 as wAttchFileUrl1,'
        + ' writer_attch_file_nm1 as wAttchFileNm1, writer_attch_file_url2 as wAttchFileUrl2, writer_attch_file_nm2 as wAttchFileNm2, reply_yn as replyYn,'
        + ' reply_comment as replyComment, DATE_FORMAT(reply_ins_date,"%Y-%m-%d") as replyInsDate, reply_ins_nm as replyInsNm, reply_ins_id as replyInsId,'
        + ' reply_attch_file_url1 as replyAttchFileUrl1, reply_attch_file_nm1 as replyAttchFileNm1, reply_attch_file_url2 as replyAttchFileUrl2,'
        + ' reply_attch_file_nm2 as replyAttchFileNm2 FROM assist_qna_comment_tbl, (SELECT @rownum:=0) TMP WHERE req_no = ? ORDER BY writer_ins_date DESC, reply_ins_date DESC;',
        [reqNo, reqNo, reqNo],
        function(err, results) {
            if (err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                var count = results[1][0].cnt;
                res.render('./admin/assist/view', {result : results[0][0], rCount : count, rList : results[2], session : ss});
            }
        }
    );

});

// 문의요청 수정폼 호출.
router.get('/request/edit/:no', function(req, res) {
    var ss = req.session;

    console.log("뷰 조회.");
    // 조회.
    conn.query('SELECT req_no as reqNo, comp_nm as compNm, writer_nm as writerNm, writer_email as writerEmail,'
        + ' writer_tel_no as writerTelNo, writer_tel_no1 as writerTelNo1, writer_tel_no2 as writerTelNo2, writer_tel_no3 as writerTelNo3,'
        + ' writer_cell_no as writerCellNo, writer_cell_no1 as writerCellNo1, writer_cell_no2 as writerCellNo2, writer_cell_no3 as writerCellNo3, car_maker_nm as carMakerNm, car_num as carNum,'
        + ' vin_no as vinNo, mileage as mileage, title as title, tro_stat_desc as troStatDesc, tech_check_stat_desc as techCheckStatDesc, running_work_desc as runningWorkDesc,'
        + ' reply_manager_id as replyManagerId, reply_manager_nm as replyManagerNm, reply_desc as replyDesc, DATE_FORMAT(reply_date, "%Y-%m-%d") as replyDate, memo as memo,'
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
        + ' attch_file_url20 as attchFileUrl20, attch_file_nm20 as attchFileNm20, DATE_FORMAT(ins_dt,"%Y-%m-%d") as insDt, ins_usr_id as insUsrid,'
        + ' ins_usr_nm as insUsrNm, DATE_FORMAT(upd_dt,"%Y-%m-%d") as updDt, upd_usr_nm as updUsrNm FROM assist_qna_tbl WHERE req_no = ?',
        [req.params.no],
        function(err, results) {
            if (err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.render('./admin/assist/edit', {result : results[0], session : ss});
            }
        }
    );
});

// 수정 처리.
router.post('/request/edit', function(req, res) {
    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    var ss = req.session;
    var reqNo = req.body.reqNo !=null ? req.body.reqNo : '';
    var usrName = ss.usrName != null ? ss.usrName : '';
    var replyDesc = req.body.replyDesc !=null ? req.body.replyDesc : '';
    var memo = req.body.memo != null ? req.body.memo : '';
    var attchFileUrl11 = req.body.attchFileUrl11 != null ? req.body.attchFileUrl11 : '';
    var attchFileNm11 = req.body.attchFileNm11 != null ? req.body.attchFileNm11 : '';
    var attchFileUrl12 = req.body.attchFileUrl12 != null ? req.body.attchFileUrl12 : '';
    var attchFileNm12 = req.body.attchFileNm12 != null ? req.body.attchFileNm12 : '';
    var attchFileUrl13 = req.body.attchFileUrl13 != null ? req.body.attchFileUrl13 : '';
    var attchFileNm13 = req.body.attchFileNm13 != null ? req.body.attchFileNm13 : '';
    var attchFileUrl14 = req.body.attchFileUrl14 != null ? req.body.attchFileUrl14 : '';
    var attchFileNm14 = req.body.attchFileNm14 != null ? req.body.attchFileNm14 : '';
    var attchFileUrl15 = req.body.attchFileUrl15 != null ? req.body.attchFileUrl15 : '';
    var attchFileNm15 = req.body.attchFileNm15 != null ? req.body.attchFileNm15 : '';
    var attchFileUrl16 = req.body.attchFileUrl16 != null ? req.body.attchFileUrl16 : '';
    var attchFileNm16 = req.body.attchFileNm16 != null ? req.body.attchFileNm16 : '';
    var attchFileUrl17 = req.body.attchFileUrl17 != null ? req.body.attchFileUrl17 : '';
    var attchFileNm17 = req.body.attchFileNm17 != null ? req.body.attchFileNm17 : '';
    var attchFileUrl18 = req.body.attchFileUrl18 != null ? req.body.attchFileUrl18 : '';
    var attchFileNm18 = req.body.attchFileNm18 != null ? req.body.attchFileNm18 : '';
    var attchFileUrl19 = req.body.attchFileUrl19 != null ? req.body.attchFileUrl19 : '';
    var attchFileNm19 = req.body.attchFileNm19 != null ? req.body.attchFileNm19 : '';
    var attchFileUrl20 = req.body.attchFileUrl120 != null ? req.body.attchFileUrl120 : '';
    var attchFileNm20 = req.body.attchFileNm120 != null ? req.body.attchFileNm120 : '';

    console.log("수정 처리");
    conn.query('UPDATE assist_qna_tbl SET'
        + ' reply_manager_id = ?, reply_manager_nm = ?, reply_desc = ?, memo = ?, reply_date = now(),'
        + ' attch_file_url5 = ?, attch_file_nm5 = ?, attch_file_url6 = ?, attch_file_nm6 = ?,'
        + ' attch_file_url13 = ?, attch_file_nm13 = ?, attch_file_url14 = ?, attch_file_nm14 = ?, attch_file_url15 = ?, attch_file_nm15 = ?,'
        + ' attch_file_url16 = ?, attch_file_nm16 = ?, attch_file_url17 = ?, attch_file_nm17 = ?, attch_file_url18 = ?, attch_file_nm18 = ?,'
        + ' attch_file_url19 = ?, attch_file_nm19 = ?, attch_file_url20 = ?, attch_file_nm20 = ?'
        + ' WHERE req_no = ?',
        [   ss.usrId, usrName, replyDesc, memo,
            attchFileUrl11, attchFileNm11,
            attchFileUrl12, attchFileNm12, attchFileUrl13, attchFileNm13, attchFileUrl14, attchFileNm14,
            attchFileUrl15, attchFileNm15, attchFileUrl16, attchFileNm16, attchFileUrl17, attchFileNm17,
            attchFileUrl18, attchFileNm18, attchFileUrl19, attchFileNm19, attchFileUrl20, attchFileNm20,
            reqNo
        ],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.log(">>> results = " + results);
                res.redirect("/admin/assist/request/view/"+req.body.reqNo);
            }
        });
});

// 답변 완료 처리.
router.post('/request/process', function(req, res) {
    var ss = req.session;
    var usrLevel = ss.usrLevel !=null ? ss.usrLevel : '';
    var reqNo = req.body.reqNo != null ? req.body.reqNo : '';
    console.log(">>>>> reqNo : " + req.body.reqNo);
    var writerName = '';
    console.log('usrLevel : ', usrLevel);
    if(usrLevel=='000' || usrLevel=='100') { writerName = '어시스트프로'; }

    // 조회.
    console.log("진행 처리");
    conn.query('SELECT writer_nm as writerNm, writer_email as writerEmail, car_maker_nm as makerNm,'
        + ' vin_no as vinNo, mileage as mileage, title as title, ins_dt as insDate, ins_usr_id as insUsrId,'
        + ' reply_desc as replyDesc, ins_usr_nm as insUsrNm FROM assist_qna_tbl WHERE req_no = ?;',
        [reqNo],
        function (err, results) {
            if (err) {
                console.log('error1 : ', JSON.stringify(err));
                res.status(500).json({message: err.message, error: err, session: ss});
            } else {
                var carMakerNm = results[0].makerNm;
                var vinNo = results[0].vinNo;
                var title = results[0].title;
                var mileage = results[0].mileage;
                var insDate = results[0].insDate;
                var insUsrId = results[0].insUsrId;
                var insUsrNm = results[0].insUsrNm;
                var usrEmail = results[0].writerEmail != null ? results[0].writerEmail : '';
                var usrName = results[0].writerNm != null ? results[0].writerNm : '';
                var replyDesc = results[0].replyDesc != null ? results[0].replyDesc : '';

                conn.query('update assist_qna_tbl set process_status = "prc", view_yn = "N",'
                    + ' reply_manager_id = ?, reply_manager_nm = ?, reply_date = now() where req_no = ?;'
                    + ' INSERT INTO assist_qna_his_tbl(req_no, car_maker_nm, vin_no, mileage, title, process_status, ins_date,'
                    + ' ins_usr_id, ins_usr_nm, reply_yn, reply_date, reply_manager_id, reply_manager_nm) VALUES(?, ?, ?,'
                    + ' ?, ?, "prc", ?, ?, ?, "Y", now(), ?, ?);',
                    [ss.usrId, ss.usrName, reqNo, reqNo, carMakerNm, vinNo, mileage, title, insDate, insUsrId, insUsrNm, ss.usrId, ss.usrName],
                    function (err2, results2) {
                        if (err2) {
                            console.log('error2 : ', JSON.stringify(err2));
                            //res.render('error', {message: err.message, error: err, session: ss});
                            res.status(500).json({message: err.message, error: err, session: ss});
                        } else {
                            //console.log(">>> results = " + JSON.stringify(results2));
                            //console.log("usrEmail : ", usrEmail);
                            //console.log('usrName : ', usrName);
                            //console.log('replyDesc : ', replyDesc);
                            // 답변처리에 대한 메일 전송처리.
                            var content = '<b>* 접수번호 : ' + reqNo + '</b><br/>';
                            content += '<b>* 접수처리자명 : ' + writerName + '</b><br/>';
                            content += '<b>* 진행상태 : 답변처리 </b><br/>';
                            content += '<b>* 답변내용 : ' + replyDesc + '... </b><br/>';
                            content += '<a href="http://www.jt-lab.co.kr/assist/service?setReqNo=' + reqNo + '">Assist Pro</a><br/>';

                            // 관리자에게 이메일 전송처리.
                            sendMail(usrEmail, usrName, content);

                            res.status(200).json({result: 'OK', session: ss});
                        }
                    });
            }
        }
    );
});

/**
 * 진행 완료 처리
 */
router.post('/request/process/complete', function(req, res) {
    var ss = req.session;
    var addQuery = '';
    var reqNo = req.body.reqNo != null ? req.body.reqNo : '';
    var relyComment = req.body.replyComment != null ? req.body.replyComment : '';
    var replyAttchFileUrl1 = req.body.replyAttchFileUrl1 != null ? req.body.replyAttchFileUrl1 : '';
    var replyAttchFileNm1 = req.body.replyAttchFileNm1 != null ? req.body.replyAttchFileNm1 : '';
    var replyAttchFileUrl2 = req.body.replyAttchFileUrl2 != null ? req.body.replyAttchFileUrl2 : '';
    var replyAttchFileNm2 = req.body.replyAttchFileNm2 != null ? req.body.replyAttchFileNm2 : '';

    // 댓글 저장 처리 추가  쿼리.(CM_DIV : C:고객, M:매니저 구분)
    addQuery = 'INSERT INTO assist_qna_comment_tbl (req_no, writer_comment, writer_nm, writer_ins_date, writer_ins_id,'
        + ' writer_attch_file_url1, writer_attch_file_nm1, writer_attch_file_url2, writer_attch_file_nm2, cm_div)'
        + ' VALUES ("'+reqNo+'", "'+ relyComment + '", "' + ss.usrName + '", now(), "' + ss.usrId + '", "' + replyAttchFileUrl1 + '", "'
        + replyAttchFileNm1 + '", "' + replyAttchFileUrl2 + '", "' + replyAttchFileNm2 + '", "M");';

    console.log(">>>>> reqNo : " + req.body.reqNo);
    console.log(">>>>> relyComment : ", relyComment);
    console.log(">>>>> replyAttchFileUrl1 : ", replyAttchFileUrl1);
    console.log(">>>>> replyAttchFileNm1 : ", replyAttchFileNm1);
    console.log(">>>>> replyAttchFileUrl2 : ", replyAttchFileUrl2);
    console.log(">>>>> replyAttchFileNm2 : ", replyAttchFileNm2);
    // 조회.
    console.log("진행 완료 처리");
    conn.query('SELECT writer_email as writerEmail, writer_nm as writerNm, car_maker_nm as makerNm, vin_no as vinNo, mileage as mileage,'
        + ' title as title, ins_dt as insDate, ins_usr_id as insUsrId, ins_usr_nm as insUsrNm FROM assist_qna_tbl WHERE req_no = ?;',
        [reqNo],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                var carMakerNm = results[0].makerNm;
                var vinNo = results[0].vinNo;
                var title = results[0].title;
                var mileage = results[0].mileage;
                var insDate = results[0].insDate;
                var insUsrId = results[0].insUsrId;
                var insUsrNm = results[0].insUsrNm;
                conn.query('update assist_qna_tbl set process_status = "cmp", view_yn = "N",'
                    + ' reply_manager_id = ?, reply_manager_nm = ?, reply_date = now() where req_no = ?;'+addQuery
                    + ' INSERT INTO assist_qna_his_tbl(req_no, car_maker_nm, vin_no, mileage, title, process_status, ins_date,'
                    + ' ins_usr_id, ins_usr_nm, reply_yn, reply_date, reply_manager_id, reply_manager_nm) VALUES(?, ?, ?,'
                    + ' ?, ?, "cmp", ?, ?, ?, "Y", now(), ?, ?);',
                    [ss.usrId, ss.usrName, reqNo, reqNo, carMakerNm, vinNo, mileage, title, insDate, insUsrId, insUsrNm, ss.usrId, ss.usrName],
                    function(err, results2) {
                        if(err) {
                            console.log('error : ', err.message);
                            res.render('error', {message: err.message, error : err, session: ss});
                        } else {
                            console.log(">>> results = " + JSON.stringify(results2));

                            var usrEmail = results[0].writerEmail !=null ? results[0].writerEmail : '';
                            var usrName = results[0].writerNm !=null ? results[0].writerNm : '';
                            var content = '<b>* 접수번호 : ' + reqNo + '</b><br/>';
                            content += '<b>* 진행상태 : 진행완료' + '</b><br/>';
                            if(relyComment!=null&&relyComment!="") {
                                content += '<b>* 댓글내용 : ' + relyComment.substr(0, 10) + '... </b><br/>';
                            }
                            content += '<a href="http://www.jt-lab.co.kr/assist/service?setReqNo='+reqNo+'">Assist Pro</a><br/>';

                            // 사용자에게 이메일 전송처리.
                            sendMail(usrEmail, usrName, content);

                            res.json({result:'OK', session : ss});
                        }
                    });
            }
        }
    );
});

// 댓글 답변글 저장 처리
router.post('/request/view/reply/insert', function(req, res) {
    var ss = req.session;
    var usrLevel = ss.usrLevel !=null ? ss.usrLevel : '';
    var reqNo = req.body.reqNo != null ? req.body.reqNo : '';
    var rComment = req.body.replyComment != null ? req.body.replyComment : '';
    var attchFileUrl1 = req.body.replyAttchFileUrl1 != null ? req.body.replyAttchFileUrl1 : '';
    var attchFileNm1 = req.body.replyAttchFileNm1 != null ? req.body.replyAttchFileNm1 : '';
    var attchFileUrl2 = req.body.replyAttchFileUrl2 != null ? req.body.replyAttchFileUrl2 : '';
    var attchFileNm2 = req.body.replyAttchFileNm2 != null ? req.body.replyAttchFileNm2 : '';
    var writerName = '';
    console.log('usrLevel : ', usrLevel);
    if(usrLevel=='000' || usrLevel=='100') { writerName = '어시스트프로'; }

    console.log(">>> reqNo : " + reqNo);
    console.log(">>> rComment : " + rComment);

    conn.query('insert into assist_qna_comment_tbl(req_no, writer_comment, writer_nm, writer_ins_date, writer_ins_id,'
        + ' writer_attch_file_url1, writer_attch_file_nm1, writer_attch_file_url2, writer_attch_file_nm2, writer_view_yn, cm_div)'
        + ' values(?, ?, ?, now(), ?, ?, ?, ?, ?, "N", "M");',
        [reqNo, rComment, writerName, ss.usrId, attchFileUrl1, attchFileNm1, attchFileUrl2, attchFileNm2],
        function(err) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                // 답변처리에 대한 메일 전송처리.
                conn.query('SELECT comp_nm as compNm, writer_nm as writerNm, writer_email as writerEmail'
                    + ' FROM assist_qna_tbl WHERE req_no = ?',
                    [reqNo],
                    function(err, results) {
                        if(err) {
                            console.log('err : ', err);
                            res.render('error', {message: err.message, error : err, session: ss});
                        } else {
                            var usrEmail = results[0].writerEmail !=null ? results[0].writerEmail : '';
//console.log('>>> usrEmail : ', usrEmail);
                            //var usrName = results[0].writerNm !=null ? results[0].writerNm : '';
                            var compNm = results[0].compNm !=null ? results[0].compNm : '';
                            var content = '<b>* 접수번호 : ' + reqNo + '</b><br/>';
                            content += '<b>* 댓글자명 : ' + writerName + '</b><br/>';
                            content += '<b>* 댓글내용 : ' + rComment.substr(0, 10) + '... </b><br/>';
                            //content += '<a href="http://www.jt-lab.co.kr/assist/service?setReqNo='+reqNo+'">Assist Pro</a><br/>';

                            // 관리자에게 이메일 전송처리.
                            sendMail(usrEmail, compNm, content);

                            res.redirect('/admin/assist/request/view/'+reqNo);
                        }
                    });
            }
        }
    );

});

// 상세 화면 호출.
router.get('/request/memo/:no', function(req, res) {

    var ss = req.session;
    var reqNo = req.params.no !=null ? req.params.no : "";

    console.log("메모 에디트 뷰 조회.");
    // 조회.
    conn.query('SELECT req_no as reqNo, comp_nm as compNm, writer_nm as writerNm, writer_email as writerEmail,'
        + ' writer_tel_no as writerTelNo, writer_tel_no1 as writerTelNo1, writer_tel_no2 as writerTelNo2, writer_tel_no as writerTelNo3,'
        + ' writer_cell_no as writerCellNo, writer_cell_no1 as writerCellNo1, writer_cell_no2 as writerCellNo2, writer_cell_no3 as writerCellNo3, car_maker_nm as carMakerNm, car_num as carNum,'
        + ' vin_no as vinNo, mileage as mileage, title as title, tro_stat_desc as troStatDesc, tech_check_stat_desc as techCheckStatDesc, running_work_desc as runningWorkDesc,'
        + ' reply_manager_id as replyManagerId, reply_manager_nm as replyManagerNm, reply_desc as replyDesc, DATE_FORMAT(reply_date, "%Y-%m-%d") as replyDate, memo as memo,'
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
        + ' attch_file_url20 as attchFileUrl20, attch_file_nm20 as attchFileNm20, DATE_FORMAT(ins_dt,"%Y-%m-%d") as insDt, ins_usr_id as insUsrId,'
        + ' ins_usr_nm as insUsrNm, DATE_FORMAT(upd_dt,"%Y-%m-%d") as updDt, upd_usr_nm as updUsrNm FROM assist_qna_tbl WHERE req_no = ?;'
        + ' SELECT count(rno) as cnt FROM assist_qna_comment_tbl WHERE req_no = ?;'
        + ' SELECT @rownum:=@rownum+1 as num, rno as rNo, req_no as reqNo, writer_comment as writeComment, writer_nm as writerNm,'
        + ' DATE_FORMAT(writer_ins_date, "%Y-%m-%d %H:%m") as writerInsDate, writer_ins_id as writerInsId, writer_attch_file_url1 as wAttchFileUrl1,'
        + ' writer_attch_file_nm1 as wAttchFileNm1, writer_attch_file_url2 as wAttchFileUrl2, writer_attch_file_nm2 as wAttchFileNm2, reply_yn as replyYn,'
        + ' reply_comment as replyComment, DATE_FORMAT(reply_ins_date,"%Y-%m-%d") as replyInsDate, reply_ins_nm as replyInsNm, reply_ins_id as replyInsId,'
        + ' reply_attch_file_url1 as replyAttchFileUrl1, reply_attch_file_nm1 as replyAttchFileNm1, reply_attch_file_url2 as replyAttchFileUrl2,'
        + ' reply_attch_file_nm2 as replyAttchFileNm2 FROM assist_qna_comment_tbl, (SELECT @rownum:=0) TMP WHERE req_no = ? ORDER BY writer_ins_date DESC, reply_ins_date DESC;',
        [reqNo, reqNo, reqNo],
        function(err, results) {
            if (err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                var count = results[1][0].cnt;
                res.render('./admin/assist/memoEdit', {result : results[0][0], rCount : count, rList : results[2], session : ss});
            }
        }
    );

});

// 에디트 뷰.
router.post('/request/memo/edit', function(req, res) {
    var ss = req.session;
    var memo = req.body.memo !=null ? req.body.memo : '';
    var reqNo = req.body.reqNo !=null ? req.body.reqNo : '';

    // SQL 처리.
    conn.query('UPDATE assist_qna_tbl SET memo = ? WHERE req_no = ?',
        [memo, reqNo],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.dir(results);
                res.redirect('/admin/assist/request/view/'+reqNo);
            }
        }
    );

});

// 콘텐츠 리스트
router.get('/news', function(req, res) {
    var ss = req.session;

    console.log(">>> usrLevel = " + ss.usrLevel);

    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {

        var srchType = req.query.srchType != null ? req.query.srchType : "";
        var srchText = req.query.srchText != null ? req.query.srchText : "";
        console.log(">>> srchType : " + srchType);
        var addSQL = "";
        if (srchType == "title") {
            addSQL = ' where title like concat("%", ?, "%")';
        } else if (srchType == "writer") {
            addSQL = ' where writer like concat(?,"%")';
        }
        // 페이징 처리.
        var reqPage = req.query.page ? parseInt(req.query.page) : 0;
        //console.log(">>> reqPage = " + reqPage);
        var offset = 3;
        var page = Math.max(1, reqPage);
        //console.log(">>> page = " + page);
        var limit = 10;
        var skip = (page - 1) * limit;

        // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
        conn.query('select count(*) as cnt from assist_content_tbl' + addSQL
            + '; select @rownum:=@rownum+1 as num, no, title, brand_nm as brandNm, model_nm as modelNm, content,'
            + ' DATE_FORMAT(date, "%Y-%m-%d") as date, writer, count from assist_content_tbl, (SELECT @rownum:=' + skip + ') TMP' + addSQL
            + ' order by no desc limit ' + skip + ', ' + limit + ";",
            [srchText, srchText],
            function (err, results) {
                if (err) {
                    console.log('error : ', err.message);
                } else {
                    var count = results[0][0].cnt;
                    var maxPage = Math.ceil(count / limit);

                    res.render('./admin/assist/news/list', {
                        board: results[1],
                        srchType: srchType,
                        srchText: srchText,
                        page: page,
                        maxPage: maxPage,
                        offset: offset,
                        session: ss
                    });
                }
            });

    } else {
        res.redirect('/admin');
    }

});

// 콘텐츠 리스트 검색
router.post('/news/search', function(req, res) {
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

    conn.query('select count(*) as cnt from assist_content_tbl' + addSQL
        + '; select @rownum:=@rownum+1 as num, no, title, brand_nm as brandNm, model_nm as modelNm, content,'
        + '  DATE_FORMAT(date, "%Y-%m-%d") as date, writer, count from assist_content_tbl, (SELECT @rownum:='+skip+') TMP'+ addSQL
        + ' order by no desc limit '+ skip + ', ' + limit + ";",
        [srchText, srchText],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                var count = results[0][0].cnt;
                var maxPage = Math.ceil(count/limit);

                res.render('./admin/assist/news/list', {board : results[1], srchType: srchType, srchText : srchText, page : page, maxPage: maxPage, offset: offset, session : ss});
            }
        });
});

// 업데이트뉴스 작성.
router.get('/news/new', function(req, res) {
    console.log('routes 게시글 작성 화면 호출');
    var ss = req.session;
    res.render('./admin/assist/news/new', {session : ss});
});

// 업데이트뉴스 저장 처리.
router.post('/news/insert', function(req, res) {
    console.log('routes 게시글 작성 처리');
    var ss = req.session;
    // 저장처리.
    conn.query('insert into assist_content_tbl(title, brand_nm, model_nm, summary, content, date, writer, thumb_img_url,'
        + ' thumb_img_nm, attch_file_url1, attch_file_nm1, attch_file_url2, attch_file_nm2) values(?, ?, ?, ?, ?, now(), ?, ?, ?, ?, ?, ?, ?);',
        [req.body.title, req.body.brandNm, req.body.modelNm, req.body.summry, req.body.content, req.body.writer,
            req.body.thumbUrl, req.body.thumbImg, req.body.attchFileUrl1, req.body.attchFileNm1, req.body.attchFileUrl2, req.body.attchFileNm2],
        function(err) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.redirect('/admin/assist/news/');
            }
        });
});

// 업데이트뉴스 수정 화면 호출.
router.get('/news/edit/:no', function(req, res) {

    var ss = req.session;

    console.log("수정 화면 호출처리.");
    conn.query('select @rownum:=@rownum+1 as num, no, title, brand_nm as brandNm, model_nm as modelNm, summary, content,'
        + ' DATE_FORMAT(date, "%Y-%m-%d") as date, writer, thumb_img_url as thumbImgUrl, thumb_img_nm as thumbImgNm,'
        + ' attch_file_url1 as attchFileUrl1, attch_file_nm1 as attchFileNm1, attch_file_url2 as attchFileUrl2,'
        + ' attch_file_nm2 as attchFileNm2, count from assist_content_tbl, (SELECT @rownum:=0) TMP where no = ?',
        [req.params.no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.log('routes news Edit View !!!');
                res.render('./admin/assist/news/edit', {board : results[0], session : ss});
            }
        });
});

// 게시글 상세 화면 호출.
router.get('/news/view/:no', function(req, res) {
    console.log("상세 화면 호출처리.");

    var ss = req.session;

    // 뷰 카운트 추가.
    console.log("조회업데이트");
    conn.query('update assist_content_tbl set count = (select * from (select count+1 from assist_content_tbl where no = ?) as tmp) where no = ?',
        [req.params.no,req.params.no],
        function(err) {
            if (err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            }
        }
    );

    // 리스트 조회 처리.
    conn.query('select no, title, brand_nm as brandNm, model_nm as modelNm, summary, content, DATE_FORMAT(date, "%Y-%m-%d") as date,'
        + ' writer, thumb_img_url as thumbImgUrl, thumb_img_nm as thumbImgNm, attch_file_url1 as attchFileUrl1, attch_file_nm1 as attchFileNm1,'
        + ' attch_file_url2 as attchFileUrl2, attch_file_nm2 as attchFileNm2, count from assist_content_tbl where no = ?',
        [req.params.no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.log('routes news view Result !!!');
                res.render('./admin/assist/news/view', {board : results[0], session : ss});
            }
        });
});

// 콘텐츠 수정 처리.
router.post('/news/edit/do', function(req, res) {
    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.

    var ss = req.session;

    console.log("게시글 수정 처리");
    conn.query('update assist_content_tbl set title = ?, brand_nm = ?, model_nm = ?, summary = ?, content = ?, writer = ?,'
        + ' date = now(), thumb_img_url = ?, thumb_img_nm = ?, attch_file_url1 = ?, attch_file_nm1 = ?, attch_file_url2 = ?, attch_file_nm2 = ? where no = ?',
        [req.body.title, req.body.brandNm, req.body.modelNm, req.body.summry, req.body.content, req.body.writer,
            req.body.thumbUrl, req.body.thumbImg, req.body.attchFileUrl1, req.body.attchFileNm1, req.body.attchFileUrl2, req.body.attchFileNm2, req.body.no],
        function(err) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            }
        });

    console.log("수정후 상세 화면 호출처리.");
    conn.query('select @rownum:=@rownum+1 as num, no, title, brand_nm as brandNm, model_nm as modelNm, summary, content,'
        + ' DATE_FORMAT(date, "%Y-%m-%d") as date, writer, thumb_img_url as thumbImgUrl, thumb_img_nm as thumbImgNm,'
        + ' attch_file_url1 as attchFileUrl1, attch_file_nm1 as attchFileNm1, attch_file_url2 as attchFileUrl2,'
        + ' attch_file_nm2 as attchFileNm2, count from assist_content_tbl, (SELECT @rownum:=0) TMP where no = ?',
        [req.body.no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.log('routes news View Result !!!');
                res.render('./admin/assist/news/view', {board : results[0], session : ss});
            }
        });
});


// 업데이트뉴스 삭제.(get)
router.get('/news/delete/:no', function(req, res) {

    var ss = req.session;

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log("게시글 삭제 처리");
    conn.query('delete from assist_content_tbl where no = ?',
        [req.params.no],
        function(err) {
            if(err) {
                console.log('error : ', err.message);
            }
        });
    console.log("게시글 화면 호출처리.");
    conn.query('select @rownum:=@rownum+1 as num, no, title, brand_nm as brandNm, model_nm as modelNm, summary, content,'
        + ' DATE_FORMAT(date, "%Y-%m-%d") as date, writer, thumb_img_url as thumbImgUrl, thumb_img_nm as thumbImgNm,'
        + ' attch_file_url1 as attchFileUrl1, attch_file_nm1 as attchFileNm1, attch_file_url2 as attchFileUrl2,'
        + ' attch_file_nm2 as attchFileNm2, count from assist_content_tbl, (SELECT @rownum:=0) TMP',
        [],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('routes news View Result !!!');
                //res.render('./admin/announce/list', {board : results, session : ss});
                res.redirect('/admin/assist/news/');
            }
        });
});

// 콘텐츠 삭제.(post)
router.post('/news/delete', function(req, res) {

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log("게시글 삭제 처리");

    var params = req.body['dataList'];

    for (var i = 0; i < params.length; i++) {
        console.log(">>> get params[" + i + "] =" + params[i]);
        conn.query('delete from assist_content_tbl where no = ?',
            [params[i]],
            function (err) {
                if (err) {
                    console.log('error : ', err.message);
                }
            });
    }

    res.json({'result' : 'OK'});
});

// 자료실 관리 화면 호출.
router.get('/data', function(req, res) {
    var ss = req.session;

    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {

        var srchType = req.query.srchType != null ? req.query.srchType : "";
        var srchText = req.query.srchText != null ? req.query.srchText : "";
        console.log(">>> srchType : " + srchType);
        var addSQL = "";
        if (srchType == "title") {
            addSQL = ' where x.title like concat("%", ?, "%")';
        } else if (srchType == "writer") {
            addSQL = ' where x.writer like concat(?,"%")';
        }
        // 페이징 처리.
        var reqPage = req.query.page ? parseInt(req.query.page) : 0;
        //console.log(">>> reqPage = " + reqPage);
        var offset = 3;
        var page = Math.max(1, reqPage);
        //console.log(">>> page = " + page);
        var limit = 10;
        var skip = (page - 1) * limit;

        // 조회.
        conn.query('select count(*) as cnt from data_inf_tbl' + addSQL
            + '; select @rownum:=@rownum+1 as num, x.dno as dNo, x.data_nm as dataNm,'
            + ' (select name from car_cate_inf_tbl where parent_no is null and category_no = x.maker_nm) as makerNm,'
            + ' x.model_no as modelNo, x.model_no2 as modelNo2, (select name from car_cate_inf_tbl where category_no = x.model_nm) as modelNm,'
            + ' x.auth_level as authLevel, x.open_yn as openYn, x.memo as memo, DATE_FORMAT(x.ins_date, "%Y-%m-%d") as insDate, x.ins_usr_id as insUsrId,'
            + ' x.ins_usr_nm as insUsrNm, DATE_FORMAT(x.upd_date, "%Y-%m-%d") as updDate, x.upd_usr_id as updUsrId,'
            + ' x.upd_usr_nm as updUsrNm from data_inf_tbl x, (SELECT @rownum:=' + skip + ') TMP' + addSQL
            + ' order by x.ins_date desc limit ' + skip + ', ' + limit + ";",
            [srchText, srchText],
            function (err, results) {
                if (err) {
                    console.log('error : ', err.message);
                    res.render('error', {message: err.message, error: err, session: ss});
                } else {
                    var count = results[0][0].cnt;
                    var maxPage = Math.ceil(count / limit);

                    res.render('./admin/assist/data/list', {
                        rList: results[1],
                        srchType: srchType,
                        srchText: srchText,
                        page: page,
                        maxPage: maxPage,
                        offset: offset,
                        session: ss
                    });
                }
            }
        );
    } else {
        res.redirect('/admin');
    }
});

// 자료 검색 처리.
router.post('/data/search', function(req, res) {
    console.log('routes 게시글 검색 처리 호출');
    var ss = req.session;
    console.log(">>> search type = " + req.body.srchType);
    console.log(">>> search word = " + req.body.srchText);
    var srchType = req.body.srchType != null ? req.body.srchType : "";
    var srchText = req.body.srchText != null ? req.body.srchText : "";
    console.log(">>> srchType : " + srchType);
    var addSQL = "";

    if(srchType=="title") {
        addSQL =  ' where x.title like concat("%", ?, "%")';
    } else if(srchType=="writer") {
        addSQL =  ' where x.writer like concat(?,"%")';
    }
    // 페이징 처리.
    var reqPage = req.query.page ? parseInt(req.query.page) : 0;
    //console.log(">>> reqPage = " + reqPage);
    var offset = 3;
    var page = Math.max(1,reqPage);
    //console.log(">>> page = " + page);
    var limit = 10;
    var skip = (page-1)*limit;

    conn.query('select count(*) as cnt from data_inf_tbl' + addSQL
        + '; select @rownum:=@rownum+1 as num, x.data_nm as dataNm,'
        + ' (select name from car_cate_inf_tbl where parent_no is null and category_no = x.maker_nm) as makerNm,'
        + ' x.model_no as modelNo, x.model_no2 as modelNo2, (select name from car_cate_inf_tbl where category_no = x.model_nm) as modelNm,'
        + ' x.auth_level as authLevel, x.open_yn as openYn, x.memo as memo, DATE_FORMAT(x.ins_date, "%Y-%m-%d") as insDate, x.ins_usr_id as insUsrId,'
        + ' x.ins_usr_nm as insUsrNm, DATE_FORMAT(x.upd_date, "%Y-%m-%d") as updDate, x.upd_usr_id as updUsrId,'
        + ' x.upd_usr_nm as updUsrNm from data_inf_tbl x, (SELECT @rownum:=' + skip + ') TMP' + addSQL
        + ' order by x.ins_date desc limit ' + skip + ', ' + limit + ";",
        [srchText, srchText],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                var count = results[0][0].cnt;
                var maxPage = Math.ceil(count/limit);

                res.render('./admin/assist/data/list', {
                    rList : results[1],
                    srchType: srchType,
                    srchText : srchText,
                    page : page,
                    maxPage: maxPage,
                    offset: offset,
                    session : ss
                });
            }
        });
});

// 자료 신규 화면 호출.
router.get('/data/new', function(req, res) {
    console.log('routes 자료실 작성 화면 호출');
    var ss = req.session;

    conn.query('SELECT t1.category_no as cateNo, t1.name as cateName FROM category_inf_tbl AS t1'
        + ' WHERE t1.parent_no is null group by t1.name order by t1.name asc;'
        + ' SELECT comm_cd as commCd, comm_nm as commNm FROM commcd_inf_tbl WHERE p_comm_cd = "D000";'
        + ' SELECT t1.category_no as cateNo, t1.name as cateName FROM car_cate_inf_tbl AS t1'
        + ' WHERE t1.parent_no is null group by t1.name order by t1.name asc;',
        [],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.render('./admin/assist/data/new', {rList : results[0], dList : results[1], cList : results[2], session : ss});
            }
        }
    );
});

// 자료실 신규 처리.
router.post('/data/insert', function(req, res) {
    var ss = req.session;
    console.log('routes 자료 작성 처리');

    conn.query('insert into data_inf_tbl(data_nm, data_smmr, data_desc,'
        + ' maker_nm, model_nm, model_no, model_no2, category1, category2, category3,'
        + ' attch_url1, attch_file1, attch_url2, attch_file2, attch_url3, attch_file3, auth_level,'
        + ' open_yn, memo,'
        + ' ins_date, ins_usr_id, ins_usr_nm, upd_date, upd_usr_id, upd_usr_nm)'
        + ' values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), ?, ?, now(), ?, ?)',
        [req.body.dataName, req.body.dataSummary, req.body.dataDesc,
            req.body.makerName, req.body.modelName, req.body.modelNo, req.body.modelNo2, req.body.category1, req.body.category2,
            req.body.category3, req.body.attchUrl1, req.body.attchFileNm1, req.body.attchUrl2, req.body.attchFileNm2,
            req.body.attchUrl3, req.body.attchFileNm3, req.body.authLevel, req.body.openYn, req.body.memo, ss.usrId,
            ss.usrName, ss.usrId, ss.usrName
        ],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.redirect('/admin/assist/data');
            }
        });
});

// 자료실글 수정 화면 호출.
router.get('/data/edit/:no', function(req, res) {

    var ss = req.session;

    console.log("수정 화면 호출처리.");
    conn.query('SELECT t1.category_no as cateNo, t1.name as cateName FROM category_inf_tbl AS t1'
        + ' WHERE t1.parent_no is null group by t1.name order by t1.name asc; '
        + 'SELECT t2.category_no as cateNo2, t2.name as cateName2 FROM category_inf_tbl AS t1'
        + ' LEFT JOIN category_inf_tbl as t2 ON t1.category_no = t2.parent_no WHERE t2.category_no IS NOT NULL; '
        + 'SELECT t3.category_no as cateNo3, t3.name as cateName3 FROM category_inf_tbl AS t1'
        + ' LEFT JOIN category_inf_tbl as t2 ON t1.category_no = t2.parent_no'
        + ' LEFT JOIN category_inf_tbl as t3 ON t3.parent_no = t2.category_no WHERE t3.category_no IS NOT NULL; '
        + 'select x.dno as dNo, x.data_nm as dataNm, x.data_smmr as dataSmmr,'
        + ' x.data_desc as dataDesc, x.maker_nm as makerNm, x.model_no as modelNo, x.model_no2 as modelNo2,'
        + ' x.model_nm as modelNm, x.category1, x.category2, x.category3, x.category4, x.category5,'
        + ' x.attch_url1 as attchUrl1, x.attch_file1 as attchFileNm1, x.attch_url2 as attchUrl2,'
        + ' x.attch_file2 as attchFileNm2, x.attch_url3 as attchUrl3, x.attch_file3 as attchFileNm3, x.auth_level as authLevel,'
        + ' x.open_yn as openYn, x.memo as memo,'
        + ' DATE_FORMAT(x.ins_date,"%Y-%m-%d") as insDate, x.ins_usr_id as insUsrId,'
        + ' x.ins_usr_nm as insUsrNm, DATE_FORMAT(x.upd_date, "%Y-%m-%d") as updDate,'
        + ' x.upd_usr_id as updUsrId, x.upd_usr_nm as updUsrNm from data_inf_tbl x where dno = ?;'
        + ' SELECT comm_cd as commCd, comm_nm as commNm FROM commcd_inf_tbl WHERE p_comm_cd = "D000";'
        + ' SELECT t1.category_no as cateNo, t1.name as cateName FROM car_cate_inf_tbl AS t1'
        + ' WHERE t1.parent_no is null group by t1.name order by t1.name asc;'
        + ' SELECT t1.category_no as cateNo, t1.name as cateName FROM car_cate_inf_tbl t1, data_inf_tbl s'
        + ' where t1.parent_no = s.maker_nm group by t1.name order by t1.name asc;',
        [req.params.no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.log('routes data Edit View !!!');
                res.render('./admin/assist/data/edit', {rList1 : results[0], rList2 : results[1], rList3 : results[2],
                    result : results[3][0], dList : results[4], cList : results[5], cList2 : results[6], session : ss});
            }
        });
});

// 자료실글 상세 화면 호출.
router.get('/data/view/:no', function(req, res) {
    console.log("상세 화면 호출처리.");

    var ss = req.session;

    // 뷰 카운트 추가.
    console.log("조회업데이트");
    conn.query('select x.dno as dNo, x.data_nm as dataNm, x.data_smmr as dataSmmr,'
        + ' x.data_desc as dataDesc, (select name from car_cate_inf_tbl where parent_no is null and category_no = x.maker_nm) as makerNm,'
        + ' x.model_no as modelNo, x.model_no2 as modelNo2, (select name from car_cate_inf_tbl where category_no = x.model_nm) as modelNm,'
        + ' (SELECT name FROM category_inf_tbl WHERE category_no=x.category1) as category1,'
        + ' (SELECT t2.name as cateName FROM category_inf_tbl AS t1 LEFT JOIN category_inf_tbl AS t2 ON t2.parent_no = t1.category_no'
        + ' WHERE t2.category_no = x.category2) as category2, (SELECT t3.name AS cateName FROM category_inf_tbl AS t1'
        + ' LEFT JOIN category_inf_tbl AS t2 ON t2.parent_no = t1.category_no LEFT JOIN category_inf_tbl AS t3 ON t3.parent_no = t2.category_no'
        + ' WHERE t3.category_no = x.category3) as category3,'
        + ' x.attch_url1 as attchUrl1, x.attch_file1 as attchFileNm1, x.attch_url2 as attchUrl2,'
        + ' x.attch_file2 as attchFileNm2, x.attch_url3 as attchUrl3, x.attch_file3 as attchFileNm3,'
        + ' (select comm_nm as commNm from commcd_inf_tbl where comm_cd = x.auth_level) as authLevel,'
        + ' CASE WHEN x.open_yn = "Y" THEN "공개" WHEN x.open_yn = "N" THEN "비공개" ELSE "" END as openYn, x.memo as memo,'
        + ' DATE_FORMAT(x.ins_date,"%Y-%m-%d") as insDate, x.ins_usr_id as insUsrId,'
        + ' x.ins_usr_nm as insUsrNm, DATE_FORMAT(x.upd_date, "%Y-%m-%d") as updDate,'
        + ' x.upd_usr_id as updUsrId, x.upd_usr_nm as updUsrNm from data_inf_tbl x where x.dno = ?',
        [req.params.no],
        function(err, results) {
            if (err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.render('./admin/assist/data/view', {result : results[0], session : ss});
            }
        }
    );
});

// 자료실글 수정 처리.
router.post('/data/edit/do', function(req, res) {
    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log('/data/edit/do req.body : ' ,JSON.stringify(req.body));

    var ss = req.session;

    console.log("자료글 수정 처리");
    conn.query('update data_inf_tbl set data_nm = ?, data_smmr = ?, data_desc = ?,'
        + ' maker_nm = ?, model_no = ?, model_no2 = ?, model_nm = ?, category1 = ?, category2 = ?,'
        + ' category3 = ?, category4 = ?, category5 = ?, attch_url1 = ?, attch_file1 = ?,'
        + ' attch_url2 = ?, attch_file2 = ?, attch_url3 = ?, attch_file3 = ?, ins_date = now(), auth_level = ?,'
        + ' open_yn = ?, memo = ?,'
        + ' ins_usr_id = ?, ins_usr_nm = ?, upd_date = now(), upd_usr_id = ?,'
        + ' upd_usr_nm = ? where dno = ?',
        [req.body.dataName, req.body.dataSummary, req.body.dataDesc, req.body.makerName,
            req.body.modelNo, req.body.modelNo2, req.body.modelName, req.body.category1, req.body.category2,
            req.body.category3, req.body.category4, req.body.category5, req.body.attchUrl1,
            req.body.attchFileNm1, req.body.attchUrl2, req.body.attchFileNm2, req.body.attchUrl3,
            req.body.attchFileNm3, req.body.authLevel, req.body.openYn, req.body.memo,
            ss.usrId, ss.usrName, ss.usrId, ss.usrName, req.body.dNo
        ],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.redirect('/admin/assist/data/view/'+req.body.dNo);
            }
        });
});

// 자료글 삭제.
router.get('/data/delete/:no', function(req, res) {

    var ss = req.session;

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log("자료글 삭제 처리");
    conn.query('delete from data_inf_tbl where dno = ?',
        [req.params.no],
        function(err) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.log("게시글 화면 호출처리.");
                res.redirect('/admin/assist/data');
            }
        });
});

// 자료글 복수 삭제.
router.post('/data/delete', function(req, res) {

    var ss = req.session;

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log("자료글 삭제 처리");

    var params = req.body['dataList'];

    for (var i = 0; i < params.length; i++) {
        console.log(">>> get params[" + i + "] =" + params[i]);
        conn.query('delete from data_inf_tbl where dno = ?',
            [params[i]],
            function (err) {
                if (err) {
                    console.log('error : ', err.message);
                    res.render('error', {message: err.message, error : err, session: ss});
                }
            });
    }

    res.json({'result' : 'OK'});
});

// 나의 자료목록 삭제 처리.
router.post('/data/mydata/delete', function(req, res) {

    var ss = req.session;

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log("자료글 삭제 처리");
    conn.query('delete from my_data_inf_tbl where data_no = ? and usr_id = ?;',
        [req.body.dataNo, ss.usrid],
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

// 공지사항 리스트 호출.
router.get('/announce', function(req, res) {

    var ss = req.session;

    var srchType = req.query.srchType != null ? req.query.srchType : "";
    var srchText = req.query.srchText != null ? req.query.srchText : "";
    console.log(">>> srchType : " + srchType);
    var addSQL = "";
    if (srchType == "title") {
        addSQL = ' where title like concat("%", ?, "%")';
    } else if (srchType == "writer") {
        addSQL = ' where writer like concat(?,"%")';
    }
    // 페이징 처리.
    var reqPage = req.query.page ? parseInt(req.query.page) : 0;
    //console.log(">>> reqPage = " + reqPage);
    var offset = 3;
    var page = Math.max(1, reqPage);
    //console.log(">>> page = " + page);
    var limit = 10;
    var skip = (page - 1) * limit;

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    conn.query('select count(*) as cnt from announce_inf_tbl' + addSQL
        + '; select @rownum:=@rownum+1 as num, category, no, title, content, DATE_FORMAT(date, "%Y-%m-%d") as date,'
        + ' writer, count from assist_announce_inf_tbl, (SELECT @rownum:=' + skip + ') TMP' + addSQL
        + ' order by no desc limit ' + skip + ', ' + limit + ";",
        [srchText, srchText],
        function (err, results) {
            if (err) {
                console.log('error : ', err.message);
            } else {
                var count = results[0][0].cnt;
                var maxPage = Math.ceil(count / limit);

                res.render('./admin/assist/announce/list', {
                    board: results[1],
                    srchType: srchType,
                    srchText: srchText,
                    page: page,
                    maxPage: maxPage,
                    offset: offset,
                    session: ss
                });
            }
        });
});

// 공지사항 게시판 검색 처리.
router.post('/announce/search', function(req, res) {
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

    conn.query('select count(*) as cnt from announce_inf_tbl' + addSQL
        + '; select @rownum:=@rownum+1 as num, no, category, title, content, DATE_FORMAT(date, "%Y-%m-%d") as date,'
        + ' writer, count from assist_announce_inf_tbl, (SELECT @rownum:='+skip+') TMP'+ addSQL
        + ' order by no desc limit '+ skip + ', ' + limit + ";",
        [srchText, srchText],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                var count = results[0][0].cnt;
                var maxPage = Math.ceil(count/limit);

                res.render('./admin/assist/announce/list', {board : results[1], srchType: srchType, srchText : srchText, page : page, maxPage: maxPage, offset: offset, session : ss});
            }
        });
});

// 공지사항 새글 작성 화면 호출.
router.get('/announce/new', function(req, res) {
    console.log('routes 작성 화면 호출');
    var ss = req.session;
    res.render('./admin/assist/announce/new', {session : ss});
});

// 공지사항 새글 저장 처리.
router.post('/announce/insert', function(req, res) {
    console.log('routes 게시글 작성 처리');

    conn.query('insert into assist_announce_inf_tbl(title, content, date, writer, category) values(?, ?, now(), ?, ?)',
        [req.body.title, req.body.content, req.body.writer, req.body.ctg],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                res.redirect('/admin/assist/announce/');
            }
        });
});

// 수정 화면 호출.
router.get('/announce/edit/:no', function(req, res) {

    var ss = req.session;

    console.log("수정 화면 호출처리.");
    conn.query('select @rownum:=@rownum+1 as num, category, no, title, content, DATE_FORMAT(date, "%Y-%m-%d") as date,'
        + ' writer, count from assist_announce_inf_tbl, (SELECT @rownum:=0) TMP where no = ?',
        [req.params.no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('routes announce Edit View !!!');
                res.render('./admin/assist/announce/edit', {board : results[0], session : ss});
            }
        });
});

// 게시글 상세 화면 호출.
router.get('/announce/view/:no', function(req, res) {
    console.log("상세 화면 호출처리.");

    var ss = req.session;

    // 뷰 카운트 추가.
    console.log("조회업데이트");

    // 리스트 조회 처리.
    conn.query('select no, title, content, DATE_FORMAT(date, "%Y-%m-%d") as date, writer, count, category from assist_announce_inf_tbl where no = ?',
        [req.params.no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('routes board view Result !!!');
                res.render('./admin/assist/announce/view', {board : results[0], session : ss});
            }
        });
});

// 공지사항 수정 처리.
router.post('/announce/edit/do', function(req, res) {
    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.

    var ss = req.session;

    console.log("게시글 수정 처리");
    conn.query('update assist_announce_inf_tbl set title = ?, content = ?, writer = ?, date = now(),  category = ? where no = ?',
        [req.body.title, req.body.content, req.body.writer, req.body.ctg, req.body.no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                res.redirect('/admin/assist/announce/view/'+req.body.no);
            }
        });
});

// 공지사항 삭제 처리.(get)
router.get('/announce/delete/:no', function(req, res) {

    var ss = req.session;

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log("게시글 삭제 처리");
    conn.query('delete from assist_announce_inf_tbl where no = ?',
        [req.params.no],
        function(err) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                res.redirect('/admin/assist/announce');
            }
        });
});

// 공지사항 삭제.(post)
router.post('/announce/delete', function(req, res) {

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log("게시글 삭제 처리");

    var params = req.body['dataList'];

    for (var i = 0; i < params.length; i++) {
        console.log(">>> get params[" + i + "] =" + params[i]);
        conn.query('delete from assist_announce_inf_tbl where no = ?',
            [params[i]],
            function (err) {
                if (err) {
                    console.log('error : ', err.message);
                }
            });
    }

    res.json({'result' : 'OK'});
});

// 고객번호로 정보 조회.
router.get('/user/view/:id', function(req, res) {

    var ss = req.session;
    var usrId = req.params.id != null ? req.params.id : "";
//console.log(">>>> usrId : " + usrId);

    conn.query('SELECT x.c_no as cNo, x.c_id as cId, x.c_name as cName, x.c_email as cEmail, x.c_sex as cSex, x.c_tel_no as cTelNo,'
        + ' x.c_cell_no as cCellNo, x.c_comp_nm as cCompNm, x.c_comp_tel_no as cCompTelNo, x.c_saup_no as cSaupNo,'
        + ' (select comm_nm from commcd_inf_tbl where p_comm_cd = "U000" and comm_cd = x.c_user_tp) as cUserTp,'
        + ' (select comm_nm from commcd_inf_tbl where p_comm_cd = "M000" and comm_cd = x.c_auth_level) as cAuthLevel'
        + ' from c_inf_tbl x where c_id = ?;'
        + ' SELECT y.p_code as pNo, y.p_nm as pName, x.use_term_days as termDays,'
        + ' DATE_FORMAT(adddate(x.pay_date, x.use_term_days), "%Y-%m-%d") as toDate, x.expire_yn as expireYn,'
        + ' CASE WHEN x.expire_yn = "N" THEN "사용중" WHEN x.expire_yn = "Y" THEN "사용안함" ELSE "" END as expireYnNm'
        + ' FROM pay_info_tbl x, order_detail_inf_tbl y WHERE x.order_no = y.order_no'
        + ' AND x.pay_result = "paid" AND x.expire_yn = "N" AND x.usr_id = ? ORDER BY y.p_uniq_code ASC, y.sort_no ASC;',
        [usrId, usrId],
        function(err, results) {
            if(err) {
                console.log('error : ', err);
            } else {
                console.log('results[0] : ', JSON.stringify(results[0]));


                res.render('./admin/assist/userView', {'result' : results[0][0], 'rList1': results[1], 'session' : ss});
            }
        });
});


// 파일업로드 처리.
//var upload1 = multer({storage : storage, limits: {fileSize: maxFileSize}}).single('attchFile');
var upload1 = multer({storage : storage}).single('attchFile');
router.post('/request/upload', function(req, res) {
    console.log(">>>>> request upload ");
    upload1(req, res, function(err) {
        console.log("req.body : ", req.body);
        var file = req.file;
        var originalFileNm = file.originalname;
        var savedFileNm = file.filename;
        var fileFullPath = file.destination.replace('./','https://www.jt-lab.co.kr/');
        var fileSize = file.size;
        console.log("originalFileNm : '%s', savedFile: '%s', size : '%s'", originalFileNm, savedFileNm, fileSize);
        console.log(">>> savedFileNm = " + savedFileNm);
        if(err) {
            return res.send(err);
        } else {
            return res.json({result : 'OK', fileName : savedFileNm, fileFullPath : fileFullPath, fileSize : fileSize});
        }
    });
});

// 콘텐츠 파일업로드 처리.
//var upload2 = multer({storage : storage2, limits: {fileSize: maxFileSize}}).single('imageFile');
var upload2 = multer({storage : storage2}).single('imageFile');
router.post('/news/upload', function(req, res) {
    console.log(">>>>> request news upload ");
    upload2(req, res, function(err) {
        console.log("req.body : ", req.body);
        var file = req.file;
        var originalFileNm = file.originalname;
        var realUrl = '/thumbnail';
        var savedFileNm = file.filename;
        var fileSize = file.size;
        //var fileFullPath = file.destination.replace('./','https://www.jt-lab.co.kr/');
        console.log("originalFileNm : '%s', savedFile: '%s', size : '%s'", originalFileNm, savedFileNm, fileSize);
        console.log(">>> savedFileNm = " + savedFileNm);
        console.log(">>> fileFullPath = " + realUrl);
        if(err) {
            return res.send(err);
        } else {
            return res.json({result : 'OK', fileName : savedFileNm, filePath : realUrl, fileSize : fileSize});
        }
    });
});

// Data 파일업로드 처리.
var upload3 = multer({storage : storage}).single('attchFile');
router.post('/data/upload', function(req, res) {
    console.log(">>>>> request upload ");
    upload3(req, res, function(err) {
        console.log("req.body : ", req.body);
        var file = req.file;
        var originalFileNm = file.originalname;
        var savedFileNm = file.filename;
        var fileFullPath = file.destination.replace('./','https://www.jt-lab.co.kr/');
        var fileSize = file.size;
        console.log("originalFileNm : '%s', savedFile: '%s', size : '%s'", originalFileNm, savedFileNm, fileSize);
        console.log(">>> savedFileNm = " + savedFileNm);
        console.log(">>> fileFullPath = " + fileFullPath);
        if(err) {
            return res.send(err);
        } else {
            return res.json({result : 'OK', fileName : savedFileNm, fileFullPath : fileFullPath, fileSize : fileSize});
        }
    });
});

// 파일 다운로드 모듈
router.post('/request/download', function(req, res) {
    console.log('파일 다운로드 개시');
    //console.log('fileName : ' + req.body.fileName.replace('http://localhost:18080/', './'));
    var file = req.body.fileName.replace('https://www.jt-lab.co.kr/', './');
    console.log(" file : " + file);
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
 * 이메일 발송 모듈.
 * @param senderEmail
 * @param sender
 * @param content
 */
/*
 function sendMail(receiverEmail, receiver, content) {

 var title = '[JT-LAB] AssistPro 서비스 진행상태 알림 안내';
 var fromEmail = '[JT-LAB] AssistPro < jtlab.notifier@gmail.com >';
 var toEmail = '['+ receiver+'] '+ '< ' + receiverEmail +' >';
 var ccEmail = '< logger@jt-lab.co.kr >';
 var fromName = '[JT-LAB]AssistPro';
 var toName = receiver;

 var mailOptions = {
 from : fromEmail,
 to : toEmail,
 cc : ccEmail,
 subject : title,
 text : mainContent(title, fromEmail, toEmail, fromName, toName, content)
 };

 smtpTransport.sendMail(mailOptions, function(err, info) {
 if(err) {
 console.log('Error : ' , JSON.stringify(err));
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
    msg += "From : " + fromEmail + " , To : " + toEmail +"\n";
    msg += "========================================================================================================\n";
    msg += " 본 메일은 AssistPro 서비스에 대한 진행상황 알림 메일 입니다.\n";
    msg += " 본 메일은 발신 전용 메일이므로 답변메일을 보내지 않으셔도 됩니다.\n";
    msg += " PC / 모바일웹을 통해 접속하여 아래의 변동 사항을 확인하여 주세요!\n";
    msg += "========================================================================================================\n";
    msg += content+"\n";
    msg += "========================================================================================================\n";
    msg += " Copyright by JT-LAB, Assist PRO\n";
    msg += "==========================================================================================================";

    return msg;
}

module.exports = router;
