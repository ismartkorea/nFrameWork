/*
 * 모듈명  : ascenter.js
 * 설명    : JT-LAB 화면 '고객센터' 에 대한 모듈.
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
// DB Config
var config = require('./common/dbconfig');


router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));
router.use(methodOverride("_method"));
router.use(flash());


/**
 * 고객센터 메인 화면 호출 처리.
 */
router.get('/', function(req, res) {
    var ss = req.session;
    var usrId = ss.usrId !=null ? ss.usrId : '';
    var srchType1 = req.query.srchType1 != null ? req.query.srchType1 : '';
    var srchText1 = req.query.srchText1 != null ? req.query.srchText1 : '';
    var srchCategory1 = req.query.category1 != null ? req.query.category1 : '';

    console.log(">>> srchType : " + srchType1);
    console.log(">>> srchCategory1 : " + srchCategory1);

    var addSQL = "";

    // 검색 조건 셋팅.
    if (srchType1 == "srchDataNm") {
        addSQL = ' WHERE data_nm LIKE concat("'+srchText1+'","%")';
    } else if (srchType1 == "srchCategory") {
        addSQL = ' WHERE category_code = "'+srchCategory1+'"';
    }

    var SQL1 = 'SELECT COUNT(*) as cnt FROM lab_data_inf_tbl';
    var SQL2 = 'SELECT @rownum:=@rownum+1 as num, dno as dNo, data_nm as dataNm, data_smmr as dataSmmr, data_desc as dataDesc,'
        + ' category_code as categoryCode, category_nm as categoryNm, attch_url1 as attchUrl1, attch_file1 as attchFile1,'
        + ' attch_url2 as attchUrl2, attch_file1 as attchFile2, attch_url3 as attchUrl3, attch_file3 as attchFile3,'
        + ' attch_url4 as attchUrl4, attch_file4 as attchFile4, attch_url5 as attchUrl5, attch_file5 as attchFile5,'
        + ' attch_url6 as attchUrl6, attch_file6 as attchFile6, attch_url7 as attchUrl7, attch_file7 as attchFile7,'
        + ' attch_url8 as attchUrl8, attch_file8 as attchFile8, attch_url9 as attchUrl9, attch_file9 as attchFile9,'
        + ' attch_url10 as attchUrl10, attch_file10 as attchFile10, open_yn as openYn, DATE_FORMAT(ins_date, "%Y-%m-%d") as insDate,'
        + ' ins_usr_id as insUsrId, DATE_FORMAT(upd_date,"%Y-%m-%d") as updDate, upd_usr_id as updUsrId'
        + ' FROM lab_data_inf_tbl, (SELECT @rownum:=0) TMP';
    var SQL3 = 'SELECT comm_cd as cateCd, comm_nm as cateNm FROM commcd_inf_tbl WHERE p_comm_cd = "LDC0";';

    // page
    var reqPage = req.query.page ? parseInt(req.query.page) : 0;
    var offset = 3;
    var page = Math.max(1,reqPage);
    var limit = 10;
    var skip = (page-1)*limit;

    // MySQL Connect
    var conn = mysql.createConnection(config);
    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    conn.connect();
    conn.query(SQL1 + addSQL + '; ' + SQL2 + addSQL + ' ORDER BY ins_date DESC LIMIT ' + skip + ', ' + limit + ";" + SQL3,
        [],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                var rCnt = results[0][0].cnt;
                var maxPage = Math.ceil(rCnt/limit);

                res.render('./dataLab', {
                    'rList' : results[1],
                    'srchType1' : srchType1,
                    'srchText1' : srchText1,
                    'srchCategory1' : srchCategory1,
                    'page' : page,
                    'maxPage' : maxPage,
                    'offset' : offset,
                    'sList' : results[2],
                    'session' : ss
                });
            }
        });
    conn.end();
});

/**
 * 고객센터 메인 화면 호출 처리.
 */
router.post('/search', function(req, res) {
    var ss = req.session;
    var usrId = ss.usrId !=null ? ss.usrId : '';
    var srchType1 = req.body.srchType1 != null ? req.body.srchType1 : "";
    var srchText1 = req.body.srchText1 != null ? req.body.srchText1 : "";
    var srchCategory1 = req.body.category1 != null ? req.body.category1 : '';

    console.log(">>> srchType : " + srchType1);
    console.log(">>> srchCategory1 : " + srchCategory1);

    var addSQL = "";

    // 검색 조건 셋팅.
    if (srchType1 == "srchDataNm") {
        addSQL = ' WHERE data_nm LIKE concat("'+srchText1+'","%")';
    } else if (srchType1 == "srchCategory") {
        addSQL = ' WHERE category_code = "'+srchCategory1+'"';
    }

    var SQL1 = 'SELECT COUNT(*) as cnt FROM lab_data_inf_tbl';
    var SQL2 = 'SELECT @rownum:=@rownum+1 as num, dno as dNo, data_nm as dataNm, data_smmr as dataSmmr, data_desc as dataDesc,'
        + ' category_code as categoryCode, category_nm as categoryNm, attch_url1 as attchUrl1, attch_file1 as attchFile1,'
        + ' attch_url2 as attchUrl2, attch_file1 as attchFile2, attch_url3 as attchUrl3, attch_file3 as attchFile3,'
        + ' attch_url4 as attchUrl4, attch_file4 as attchFile4, attch_url5 as attchUrl5, attch_file5 as attchFile5,'
        + ' attch_url6 as attchUrl6, attch_file6 as attchFile6, attch_url7 as attchUrl7, attch_file7 as attchFile7,'
        + ' attch_url8 as attchUrl8, attch_file8 as attchFile8, attch_url9 as attchUrl9, attch_file9 as attchFile9,'
        + ' attch_url10 as attchUrl10, attch_file10 as attchFile10, open_yn as openYn, DATE_FORMAT(ins_date, "%Y-%m-%d") as insDate,'
        + ' ins_usr_id as insUsrId, DATE_FORMAT(upd_date,"%Y-%m-%d") as updDate, upd_usr_id as updUsrId'
        + ' FROM lab_data_inf_tbl, (SELECT @rownum:=0) TMP';
    var SQL3 = 'SELECT comm_cd as cateCd, comm_nm as cateNm FROM commcd_inf_tbl WHERE p_comm_cd = "LDC0";';

    // page
    var reqPage = req.query.page ? parseInt(req.query.page) : 0;
    var offset = 3;
    var page = Math.max(1,reqPage);
    var limit = 10;
    var skip = (page-1)*limit;

    // MySQL Connect
    var conn = mysql.createConnection(config);
    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    conn.connect();
    conn.query(SQL1 + addSQL + '; ' + SQL2 + addSQL + ' ORDER BY ins_date DESC LIMIT ' + skip + ', ' + limit + ";" + SQL3,
        [],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                var rCnt = results[0][0].cnt;
                var maxPage = Math.ceil(rCnt/limit);

                res.render('./dataLab', {
                    'rList' : results[1],
                    'srchType1' : srchType1,
                    'srchText1' : srchText1,
                    'srchCategory1' : srchCategory1,
                    'page' : page,
                    'maxPage' : maxPage,
                    'offset' : offset,
                    'sList' : results[2],
                    'session' : ss
                });
            }
        });
    conn.end();
});

/**
 * 상세 보기 화면 호출.
 */
router.get('/view/:dataNo', function(req, res) {
    var ss = req.session;
    var dataNo = req.params.dataNo !=null ? req.params.dataNo : '';
console.log('>>> dataNo : ', dataNo + '\n');

    var SQL = 'SELECT dno as dNo, data_nm as dataNm, data_smmr as dataSmmr, data_desc as dataDesc,'
        + ' category_code as categoryCode, category_nm as categoryNm, attch_url1 as attchUrl1, attch_file1 as attchFile1,'
/*
        + ' attch_url2 as attchUrl2, attch_file1 as attchFile2, attch_url3 as attchUrl3, attch_file3 as attchFile3,'
        + ' attch_url4 as attchUrl4, attch_file4 as attchFile4, attch_url5 as attchUrl5, attch_file5 as attchFile5,'
        + ' attch_url6 as attchUrl6, attch_file6 as attchFile6, attch_url7 as attchUrl7, attch_file7 as attchFile7,'
        + ' attch_url8 as attchUrl8, attch_file8 as attchFile8, attch_url9 as attchUrl9, attch_file9 as attchFile9,'
        + ' attch_url10 as attchUrl10, attch_file10 as attchFile10, open_yn as openYn, DATE_FORMAT(ins_date, "%Y-%m-%d") as insDate,'
*/
        + ' open_yn as openYn, DATE_FORMAT(ins_date, "%Y-%m-%d") as insDate,'
        + ' ins_usr_id as insUsrId, DATE_FORMAT(upd_date,"%Y-%m-%d") as updDate, upd_usr_id as updUsrId'
        + ' FROM lab_data_inf_tbl WHERE dno = ?';

    // MySQL Connect
    var conn = mysql.createConnection(config);
    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    conn.connect();
    conn.query(SQL,
        [dataNo],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {

                res.render('./dataLabView', {
                    'result' : results[0],
                    'session' : ss
                });
            }
        });
    conn.end();
});


/**
 * 1:1 문의 요청 화면 호출.
 */
router.get('/inquire', function(req, res) {
    var ss = req.session;

    // MySQL Connect
    var conn = mysql.createConnection(config);

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    conn.connect();
    conn.query('SELECT @rownum:=@rownum+1 as num, no, title, content, DATE_FORMAT(date, "%Y-%m-%d") as date, writer, count'
        + ' FROM announce_inf_tbl, (SELECT @rownum:=0) TMP',
        [],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.render('./ascenter', { rList : results, session : ss});
            }
        });
    conn.end();
});

/**
 *
 */
router.get('/inquire/view/:no', function(req, res) {
    console.log("상세 화면 호출처리.");

    var ss = req.session;

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query('update announce_inf_tbl set count = (select * from (select count+1 from announce_inf_tbl where no = ?) as tmp) where no = ?',
        [req.params.no,req.params.no],
        function(err, results) {
            if (err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {

                // 리스트 조회 처리.
                // MySQL Connect
                var conn = mysql.createConnection(config);
                conn.connect();
                conn.query('SELECT no, title, content, DATE_FORMAT(date, "%Y-%m-%d") as date, writer, count FROM announce_inf_tbl WHERE no = ?',
                    [req.params.no],
                    function(err, results) {
                        if(err) {
                            console.log('error : ', err.message);
                            res.render('error', {message: err.message, error : err, session: ss});
                        } else {
                            console.log('routes view Result !!!');
                            console.dir(results);

                            res.render('./ascenterPopup', {title : "공지사항 상세", result : results[0], session : ss});
                        }
                    });
                conn.end();
            }
        }
    );
    conn.end();


});

// 문의 내용 저장 처리.
router.post('/insert', function(req, res) {
    console.log('routes 게시글 작성 처리');
    var ss = req.session;

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query('INSERT INTO qna_inf_tbl(name, usr_no, email, telno, title, content, ins_dt) VALUES(?, ?, ?, ?, ?, ?, now())',
        [req.body.name, req.body.usrNo, req.body.email, req.body.telNo, req.body.title, req.body.content],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.dir(results);
                res.json({result : 'OK', session: ss});
            }
        });
    conn.end();
});

// 파일 다운로드 모듈
router.post('/download', function(req, res) {
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
 * FnQ 화면 호출 처리.
 */
router.get('/fnq', function(req, res) {
console.log('F&Q 화면 호출 처리.');
    var ss = req.session;


    res.status(200).render('./fnq', {'session' : ss});
});

module.exports = router;
