/*
 * 모듈명  : common.js
 * 설명    : JT-LAB 화면에 대한 공통 모듈.
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
var multiparty = require('multiparty');
var fs = require('fs');
var util = require('util');
var os = require('os');
var multer = require('multer');
var router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:true}));
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

var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        if(os.platform()=='win32') {
            callback(null, './tmp/uploads/images');
        } else {
            //callback(null, '../tmp/uploads/images');
            callback(null, './tmp/uploads/images');
        }
    },
    filename: function (req, file, callback) {
        callback(null, Date.now() + '_' + file.originalname);
    }
});

router.get('/', function(req, res) {
    console.log('공통처리 부분.');
    var ss = req.session;
    res.render('index', { title: 'jt-lab.co.kr', session : ss});
});

// 아이디 중복 검색 처리.
router.post('/idCheckProcess', function(req, res) {
    console.log('아이디 중복 체크 처리');

    conn.query('select count(c_id) as cnt from c_inf_tbl where c_id = ?',
        [req.body.usrId],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('result = ', results[0].cnt);
                res.json({result : results[0].cnt});
            }
        }
    );
});

// 이메일 중복 검색 처리.
router.post('/emailCheckProcess', function(req, res) {
    console.log('이메일 중복 체크 처리');

    conn.query('select count(c_email) as cnt from c_inf_tbl where c_email = ?;',
        [req.body.usrEmail],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('result = ', results[0].cnt);
                res.json({result : results[0].cnt});
            }
        });
});

// 파일업로드 폼 호출 (테스트용)
router.get('/uploadForm', function(req, res) {
   console.log("테스트용 업로드 폼 호출.");
    var ss = req.session;
    res.render('./test/testEditor', {title: '업로드 화면', session : ss});
});

// 파일업로드 처리.
router.post('/upload', function(req, res) {

    var form = new multiparty.Form();

    // get field name & value
    form.on('field', function(name,value) {
       console.log("normal field/name="+name+", value="+value);
    });

    // file upload handling
    form.on('part', function(part) {
       var filename;
       var size;
       if(part.filename) {
           filename = part.filename;
           size = part.byteCount;
       }  else {
           part.resume();
       }

       console.log('Write Streaming file : ' + filename);
        var writeStream = fs.createWriteStream('/tmp/'+filename);
        writeStream.filename = filename;
        part.pipe(writeStream);

        part.on('data', function(chunk) {
           console.log(filename+'read'+chunk.length+'bytes');
        });

        part.on('end', function() {
            console.log(filename+'Part read complete');
            writeStream.end();
        });

    });

    // all uploads are completed
    form.on('close', function() {
        res.status(200).send('Upload complete');
    });

    // track progress
    form.on('progress', function(byteRead, byteExpected) {
       console.log('Reading total '+byteRead+'/'+byteExpected);
    });

    form.parse(req);

});

// CKEDITOR 그림파일 파일업로드 처리.
//var upload = multer({storage : storage, limits: {fileSize: maxFileSize}}).single('upload');
var upload = multer({storage : storage}).single('upload');
router.post('/ckedit/upload', function(req, res) {
console.log(">>>>> request common ckeditor upload ");
    upload(req, res, function(err) {
console.log("req.body : ", req.body);
        var realUrl = '/uploads/images';
        var file = req.file;
        var originalFileNm = file.originalname;
        var savedFileNm = file.filename;
        //var fileDest = file.destination;
        var fileSize = file.size;
        console.log("originalFileNm : '%s', savedFile: '%s', size : '%s'", originalFileNm, savedFileNm, fileSize);
        //console.log(">>> savedFileNm = " + savedFileNm);
        //console.log(">>>> fileFullPath = " + fileDest);
        //console.log(">>> req.body.CKEditorFuncNum : " + req.query.CKEditorFuncNum);
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

module.exports = router;