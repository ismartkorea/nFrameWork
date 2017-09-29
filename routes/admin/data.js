/*
 * 모듈명  : qna.js
 * 설명    : 관리자화면 '1:1문의 관리' 에 대한 모듈.
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
var fs = require('fs');
var os = require('os');
var path = require('path');
var multer = require('multer');
var router = express.Router();

// DB Config
var config = require('../common/dbconfig');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));
router.use(methodOverride("_method"));
router.use(flash());
var i=0; // 첨부파일명 구분용 숫자.
var maxFileCount = 10;  // 첨부파일 허용 갯수.
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


/**
 * 자료실 관리 화면 호출.
 */
router.get('/', function(req, res) {

    var ss = req.session;

    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {

        var srchType = req.query.srchType1 != null ? req.query.srchType1 : "";
        var srchText = req.query.srchText1 != null ? req.query.srchText1 : "";
        var category = req.query.category1 != null ? req.query.category1 : '';
console.log(">>> srchType : " + srchType);
        var addSQL = "";

        // 검색 조건 셋팅.
        if (srchType == "srchDataNm") {
            addSQL = ' AND data_nm LIKE concat("'+srchText+'","%")';
        } else if (srchType == "code") {
            addSQL = ' AND category_code = "'+category+'"';
        }
        // SQL 셋팅.
        var SQL1 = 'SELECT count(*) as cnt FROM lab_data_inf_tbl';
        var SQL2 = 'SELECT @rownum:=@rownum+1 as num, dno as dNo, data_nm as dataNm,'
            + ' category_code as categoryCode, category_nm as categoryNm,'
            + ' open_yn as openYn, DATE_FORMAT(ins_date, "%Y-%m-%d") as insDate,'
            + ' ins_usr_id as insUsrId, DATE_FORMAT(upd_date,"%Y-%m-%d") as updDate, upd_usr_id as updUsrId'
            + ' FROM lab_data_inf_tbl, (SELECT @rownum:=0) TM WHERE open_yn = "Y"';

        // 페이징 처리.
        var reqPage = req.query.page ? parseInt(req.query.page) : 0;
        //console.log(">>> reqPage = " + reqPage);
        var offset = 3;
        var page = Math.max(1, reqPage);
        //console.log(">>> page = " + page);
        var limit = 10;
        var skip = (page - 1) * limit;

        // MySQL Connect
        var conn = mysql.createConnection(config);
        conn.connect();
        // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
        conn.query(SQL1 + addSQL + '; ' + SQL2 + addSQL + ' ORDER BY ins_date DESC LIMIT ' + skip + ', ' + limit + ";",
            [],
            function (err, results) {
                if (err) {
                    console.log('error : ', err.message);
                } else {
                    var count = results[0][0].cnt;
                    var maxPage = Math.ceil(count / limit);

                    res.render('./admin/data/list', {
                        'rList' : results[1],
                        'srchType' : srchType,
                        'srchText' : srchText,
                        'category' : category,
                        'page' : page,
                        'maxPage' : maxPage,
                        'offset' : offset,
                        'session' : ss
                    });
                }
            });
        conn.end();
    } else {
        res.redirect('/admin');
    }
});

/**
 * 자료실 관리 화면 호출.
 */
router.post('/search', function(req, res) {

    var ss = req.session;

    var srchType = req.body.srchType1 != null ? req.body.srchType1 : '';
    var srchText = req.body.srchText1 != null ? req.body.srchText1 : '';
    var category = req.body.category1 != null ? req.body.category1 : '';
console.log(">>> srchType : " + srchType);
    var addSQL = "";

    // 검색 조건 셋팅.
    if (srchType == "srchDataNm") {
        addSQL = ' AND data_nm LIKE concat("' + srchText + '","%")';
    } else if (srchType == "srchCategory") {
        addSQL = ' AND category_code = "' + category + '"';
    }
    // SQL 셋팅.
    var SQL1 = 'SELECT count(*) as cnt FROM lab_data_inf_tbl';
    var SQL2 = 'SELECT @rownum:=@rownum+1 as num, dno as dNo, data_nm as dataNm,'
        + ' category_code as categoryCode, category_nm as categoryNm,'
        + ' open_yn as openYn, DATE_FORMAT(ins_date, "%Y-%m-%d") as insDate,'
        + ' ins_usr_id as insUsrId, DATE_FORMAT(upd_date,"%Y-%m-%d") as updDate, upd_usr_id as updUsrId'
        + ' FROM lab_data_inf_tbl, (SELECT @rownum:=0) TMP WHERE open_yn = "Y"';

    // 페이징 처리.
    var reqPage = req.query.page ? parseInt(req.query.page) : 0;
    //console.log(">>> reqPage = " + reqPage);
    var offset = 3;
    var page = Math.max(1, reqPage);
    //console.log(">>> page = " + page);
    var limit = 10;
    var skip = (page - 1) * limit;

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    conn.query(SQL1 + addSQL + '; ' + SQL2 + addSQL + ' ORDER BY ins_date DESC LIMIT ' + skip + ', ' + limit + ";",
        [],
        function (err, results) {
            if (err) {
                console.log('error : ', err.message);
            } else {
                var count = results[0][0].cnt;
                var maxPage = Math.ceil(count / limit);

                res.render('./admin/data/list', {
                    'rList' : results[1],
                    'srchType' : srchType,
                    'srchText' : srchText,
                    'category' : category,
                    'page' : page,
                    'maxPage' : maxPage,
                    'offset' : offset,
                    'session' : ss
                });
            }
        });
    conn.end();
});

/**
 * 자료실 신규 화면 호출.
 */
router.get('/new', function(req, res) {
    console.log('routes data 작성 화면 호출');
    var ss = req.session;
    var SQL = 'SELECT comm_cd as cateCd, comm_nm as cateNm FROM commcd_inf_tbl WHERE p_comm_cd = "LDC0";';

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query(SQL, [], function(err, results) {
        if(err) {
            console.log('/new err : ', err);
        } else {

            res.render('./admin/data/new', {'sList' : results, 'session' : ss});
        }
    });
});

/**
 * 자료실 신규 작성 처리.
 */
router.post('/save', function(req, res) {
    console.log('routes 작성 처리');
    console.log('req.body : ', JSON.stringify(req.body));

    var ss = req.session;
    var usrId = ss.usrId !=null ? ss.usrId : '';
    // request 파라미터 값 취득.
    var dataNm = req.body.dataNm !=null ? req.body.dataNm : '';
    var dataSmmr = req.body.dataSmmr !=null ? req.body.dataSmmr : '';
    var dataDesc = req.body.dataDesc !=null ? req.body.dataDesc : '';
    var categoryCode = req.body.categoryCode !=null ? req.body.categoryCode : '';
    var categoryNm = req.body.categoryNm !=null ? req.body.categoryNm : '';
    var dataOpenYn = req.body.openYn !=null ? req.body.openYn : '';
    var attchUrl1 = req.body.attchFileUrl1 !=null ? req.body.attchFileUrl1 : '';
    var attchFile1 = req.body.attchFileNm1 !=null ? req.body.attchFileNm1 : '';
/*
    var attchUrl2 = req.body.attchUrl2 !=null ? req.body.attchUrl2 : '';
    var attchFile2 = req.body.attchFile2 !=null ? req.body.attchFile2 : '';
    var attchUrl3 = req.body.attchUrl3 !=null ? req.body.attchUrl3 : '';
    var attchFile3 = req.body.attchFile3 !=null ? req.body.attchFile3 : '';
    var attchUrl4 = req.body.attchUrl4 !=null ? req.body.attchUrl4 : '';
    var attchFile4 = req.body.attchFile4 !=null ? req.body.attchFile4 : '';
    var attchUrl5 = req.body.attchUrl5 !=null ? req.body.attchUrl5 : '';
    var attchFile5 = req.body.attchFile5 !=null ? req.body.attchFile5 : '';
    var attchUrl6 = req.body.attchUrl6 !=null ? req.body.attchUrl6 : '';
    var attchFile6 = req.body.attchFile6 !=null ? req.body.attchFile6 : '';
    var attchUrl7 = req.body.attchUrl7 !=null ? req.body.attchUrl7 : '';
    var attchFile7 = req.body.attchFile7 !=null ? req.body.attchFile7 : '';
    var attchUrl8 = req.body.attchUrl8 !=null ? req.body.attchUrl8 : '';
    var attchFile8 = req.body.attchFile8 !=null ? req.body.attchFile8 : '';
    var attchUrl9 = req.body.attchUrl9 !=null ? req.body.attchUrl9 : '';
    var attchFile9 = req.body.attchFile9 !=null ? req.body.attchFile9 : '';
    var attchUrl10 = req.body.attchUrl10 !=null ? req.body.attchUrl10 : '';
    var attchFile10 = req.body.attchFile10 !=null ? req.body.attchFile10 : '';
*/
    // SQL 조회.
    var SQL = 'INSERT INTO lab_data_inf_tbl(data_nm, data_smmr, data_desc, category_code, category_nm, open_yn, attch_url1, attch_file1,'
        + ' ins_date, ins_usr_id, upd_date, upd_usr_id) VALUES(?, ?, ?, ?, ?, ?, ?, ?, now(), ?, now(), ?)';


    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query(SQL,
        [
            dataNm, dataSmmr, dataDesc, categoryCode, categoryNm, dataOpenYn, attchUrl1, attchFile1, usrId, usrId
        ],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.dir(results);

                res.redirect('/admin/data');
            }
        });
    conn.commit();
    conn.end();
});

/**
 * 상세 화면 조회 처리.
 */
router.get('/view/:no', function(req, res) {
    console.log("상세 화면 호출처리. /admin/qna/view");

    var ss = req.session;
    var dNo = req.params.no !=null ? req.params.no : '';
    var SQL = 'SELECT dno as dNo, data_nm as dataNm, data_smmr as dataSmmr, data_desc as dataDesc,'
        + ' category_code as categoryCode, category_nm as categoryNm, attch_url1 as attchUrl1, attch_file1 as attchFile1,'
        + ' attch_url2 as attchUrl2, attch_file1 as attchFile2, attch_url3 as attchUrl3, attch_file3 as attchFile3,'
        + ' attch_url4 as attchUrl4, attch_file4 as attchFile4, attch_url5 as attchUrl5, attch_file5 as attchFile5,'
        + ' attch_url6 as attchUrl6, attch_file6 as attchFile6, attch_url7 as attchUrl7, attch_file7 as attchFile7,'
        + ' attch_url8 as attchUrl8, attch_file8 as attchFile8, attch_url9 as attchUrl9, attch_file9 as attchFile9,'
        + ' attch_url10 as attchUrl10, attch_file10 as attchFile10, open_yn as openYn, DATE_FORMAT(ins_date, "%Y-%m-%d") as insDate,'
        + ' ins_usr_id as insUsrId, DATE_FORMAT(upd_date,"%Y-%m-%d") as updDate, upd_usr_id as updUsrId'
        + ' FROM lab_data_inf_tbl WHERE dno = ?;';
    var SQL2 = 'SELECT comm_cd as cateCd, comm_nm as cateNm FROM commcd_inf_tbl WHERE p_comm_cd = "LDC0";';

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query(SQL + SQL2,
        [dNo],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('routes View Result !!!');

                res.render('./admin/data/view', {
                    'title' : '자료실 관리 페이지',
                    'result' : results[0][0],
                    'sList' : results[1],
                    'session' : ss
                });
            }
        });
    conn.end();
});

// 게시글 수정 화면 호출.
router.get('/edit/:no', function(req, res) {
    console.log("수정 화면 호출처리.");

    var ss = req.session;
    var dNo = req.params.no !=null ? req.params.no : '';
    var SQL = 'SELECT dno as dNo, data_nm as dataNm, data_smmr as dataSmmr, data_desc as dataDesc,'
        + ' category_code as categoryCode, category_nm as categoryNm, attch_url1 as attchFileUrl1, attch_file1 as attchFileNm1,'
        + ' open_yn as openYn, DATE_FORMAT(ins_date, "%Y-%m-%d") as insDate,'
        + ' ins_usr_id as insUsrId, DATE_FORMAT(upd_date,"%Y-%m-%d") as updDate, upd_usr_id as updUsrId'
        + ' FROM lab_data_inf_tbl WHERE dno = ?;';
    var SQL2 = 'SELECT comm_cd as cateCd, comm_nm as cateNm FROM commcd_inf_tbl WHERE p_comm_cd = "LDC0";';

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query(SQL + SQL2,
        [dNo],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('routes View Result !!!');

                res.render('./admin/data/edit', {
                    'title' : '자료실 관리 페이지',
                    'result' : results[0][0],
                    'sList' : results[1],
                    'session' : ss
                });
            }
        });
    conn.end();
});

/**
 * 수정 처리.
 */
router.post('/edit/do', function(req, res) {
    console.log("게시글 수정 처리");
console.log('req.body : ', req.body);

    var ss = req.session;
    var usrId = ss.usrId !=null ? ss.usrId : '';
    // request 파라미터 값 취득.
    var dataNo = req.body.dataNo !=null ? req.body.dataNo : '';
    var dataNm = req.body.dataNm !=null ? req.body.dataNm : '';
    var dataSmmr = req.body.dataSmmr !=null ? req.body.dataSmmr : '';
    var dataDesc = req.body.dataDesc !=null ? req.body.dataDesc : '';
    var categoryCode = req.body.categoryCode !=null ? req.body.categoryCode : '';
    var categoryNm = req.body.categoryNm !=null ? req.body.categoryNm : '';
    var attchUrl1 = req.body.attchFileUrl1 !=null ? req.body.attchFileUrl1 : '';
    var attchFile1 = req.body.attchFileNm1 !=null ? req.body.attchFileNm1 : '';
/*
    var attchUrl2 = req.body.attchUrl2 !=null ? req.body.attchUrl2 : '';
    var attchFile2 = req.body.attchFile2 !=null ? req.body.attchFile2 : '';
    var attchUrl3 = req.body.attchUrl3 !=null ? req.body.attchUrl3 : '';
    var attchFile3 = req.body.attchFile3 !=null ? req.body.attchFile3 : '';
    var attchUrl4 = req.body.attchUrl4 !=null ? req.body.attchUrl4 : '';
    var attchFile4 = req.body.attchFile4 !=null ? req.body.attchFile4 : '';
    var attchUrl5 = req.body.attchUrl5 !=null ? req.body.attchUrl5 : '';
    var attchFile5 = req.body.attchFile5 !=null ? req.body.attchFile5 : '';
    var attchUrl6 = req.body.attchUrl6 !=null ? req.body.attchUrl6 : '';
    var attchFile6 = req.body.attchFile6 !=null ? req.body.attchFile6 : '';
    var attchUrl7 = req.body.attchUrl7 !=null ? req.body.attchUrl7 : '';
    var attchFile7 = req.body.attchFile7 !=null ? req.body.attchFile7 : '';
    var attchUrl8 = req.body.attchUrl8 !=null ? req.body.attchUrl8 : '';
    var attchFile8 = req.body.attchFile8 !=null ? req.body.attchFile8 : '';
    var attchUrl9 = req.body.attchUrl9 !=null ? req.body.attchUrl9 : '';
    var attchFile9 = req.body.attchFile9 !=null ? req.body.attchFile9 : '';
    var attchUrl10 = req.body.attchUrl10 !=null ? req.body.attchUrl10 : '';
    var attchFile10 = req.body.attchFile10 !=null ? req.body.attchFile10 : '';
*/

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query('UPDATE lab_data_inf_tbl SET data_nm = ?, data_smmr = ?, data_desc = ?, category_code = ?, category_nm = ?,'
        + ' attch_url1 = ?, attch_file1 = ?, ins_date = now(), ins_usr_id = ?, upd_date = now(), upd_usr_id = ? WHERE dno = ?;',
        [
            dataNm, dataSmmr, dataDesc, categoryCode, categoryNm, attchUrl1, attchFile1, usrId, usrId, dataNo
        ],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.dir(results);

                //res.status(200).json({'result' : 'OK', 'session' : ss});
                res.redirect('/admin/data');
            }
        });
});

/**
 * 삭제 처리.
 */
router.get('/delete/:no', function(req, res) {
    console.log("삭제 처리");
    var ss = req.session;
    var dNo = req.params.no !=null ? req.params.no : '';

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query('DELETE FROM lab_data_inf_tbl WHERE dno = ?',
        [dNo],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.dir(results);

                res.json({'result' : 'OK', 'session' : ss});
                //res.redirect('/admin/data');
            }
        });
    conn.commit();
    conn.end();
});

/**
 * 자료실 삭제 처리. (다건)
 */
router.post('/delete', function(req, res) {
    console.log("삭제 다건 처리");
    console.log('req.body : ', JSON.stringify(req.body));

    var ss = req.session;
    var params = req.body['dataList'];
console.log('params : ', params);

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    for (var i = 0; i < params.length; i++) {
        //console.log(">>>> params[" + i + "] = " + params[i]);
        conn.query('DELETE FROM lab_data_inf_tbl WHERE dno = ?',
            [params[i]],
            function (err, results) {
                if (err) {
                    console.log('error : ', err.message);
                } else {
                    console.dir(results);
                    //res.redirect('/admin/data');
                }
            }
        );
    }
    conn.commit();
    conn.end();

    res.status(200).json({'result' : 'OK', 'session' : ss});

});


router.get('/category', function(req, res) {
    var ss = req.session;

    var SQL = 'SELECT @rownum:=@rownum+1 as num, comm_cd as cateCd, comm_nm as cateNm,'
        + ' DATE_FORMAT(insert_dt,"%Y-%m-%d") as insertDt, insert_usr as insertUsr'
        + ' FROM commcd_inf_tbl, (SELECT @rownum:=0) TMP WHERE p_comm_cd = "LDC0"';

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query(SQL, [], function(err, results) {
            if(err) {
                console.log('/category err : ', err);
            } else {

                res.status(200).render('./admin/data/popup/cateAddPopup', {'rList' : results, 'session' : ss});
            }
        }
    );
    conn.end();

});

/**
 * 카테고리 팝업 저장 처리
 */
router.post('/category/save', function(req, res) {
    console.log('카테고리 팝업 저장 처리.');

   var ss = req.session;
   var usrId = ss.usrId !=null ? ss.usrId : '';
    // form request 파라미티 취득.
   var cateCd = req.body.cateCode !=null ? req.body.cateCode : '';
   var cateCdNm = req.body.cateCodeNm !=null ? req.body.cateCodeNm : '';
    // SQL문
   var SQL = 'INSERT INTO commcd_inf_tbl(`comm_cd`, `p_comm_cd`, `comm_nm`, `desc`, `insert_dt`, `insert_usr`, `update_dt`, `update_usr`)'
       + ' VALUES(?, "LDC0", ?, "LAB 자료실 카테고리", now(), ?, now(), ?);';
   var SQL2 = 'SELECT comm_cd as cateCd, comm_nm as cateNm'
       + ' FROM commcd_inf_tbl WHERE p_comm_cd = "LDC0";';

    // MySQL Connect
    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query(SQL, [cateCd, cateCdNm, usrId, usrId],
        function(err, results) {
            if(err) {
                console.log('/category/insert err : ', err);
            } else {
                console.dir(results);
                // MySQL Connect
                var conn = mysql.createConnection(config);
                conn.connect();
                conn.query(SQL2, [], function(err, results2) {
                    if(err) {
                        console.log('select err : ', err);
                    } else {

                        res.status(200).json({'result' : 'OK', 'sList' : results2, 'session' : ss});
                    }
                });
                conn.end();
            }
        }
    );
    conn.commit();
    conn.end();

});


// Data 파일업로드 처리.
var upload = multer({storage : storage}).single('attchFile');
router.post('/upload', function(req, res) {
    console.log(">>>>> request upload ");
    upload(req, res, function(err) {
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
        res.redirect('/library/pdf/viewer.html?file='+encodeURIComponent(file));
        //res.redirect('/library/pdf/viewer.html?file='+file);
    } else {
        //console.log(" file : " + file);
        res.download(file, encodeURIComponent(path.basename(file)));
        //res.download(file, path.basename(file));
    }
});

module.exports = router;