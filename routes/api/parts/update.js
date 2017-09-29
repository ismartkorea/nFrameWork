var express = require('express');
var router = express.Router();

var fs = require('fs');

var sprintf = require('sprintf-js').sprintf;
var vsprintf = require('sprintf-js').vsprintf;

var mime = require('mime');

function replaceAll(str, searchStr, replaceStr) {
    return str.split(searchStr).join(replaceStr);
}

router.get('/', function(req, res, next) {
    console.log("GET /api/parts/update");
    res.render('api/parts/update/update');
});

router.get('/check', function(req, res, next) {
    console.log("GET /api/parts/update");
    res.render('api/parts/update/check');
});

router.post('/check', function(req, res, next) {
    console.log("POST /api/parts/update/check");

    console.log("userid: " + req.body.userid);
    console.log("userpwd: " + req.body.userpwd);

    // 아이디와 비밀번호 체크해서 새로운 버전을 다운받을 수 있는 사용자인지 판별한다.
    // > parts_update
    // masterId - 마스터 아이디
    // partsVersion - 다운로드 가능한 버전
    // expDate - 다운로드 가능한 날짜

    // 승인된 사용자인 경우에 최신버전의 정보를 되돌려주고 새 버전을 다운로드 할지는 사용자가
    // 선택할 수 있도록 한다.

    // parts_version 테이블에는
    // version - 버전
    // location - 파일 위치
    // files - 파일 리스트('|'으로 구분한다.)
    // /api/parts/update/download 메서드에서 요청된 version 을 다운로드 시켜줄 때 사용한다.

    var downloadUrl = "https://www.jt-lab.co.kr/api/parts/update/download";

    var resObj = {
        result: true,
        newerVersion: "1.0.0.0",
        url: downloadUrl
    };

    var resStr = JSON.stringify(resObj);

    res.setHeader('Content-type', 'application/json');

    res.send(resStr);
});

router.get('/download', function(req, res, next) {
    console.log("GET /api/parts/update/download");

    var file = './files/parts/setup/partscli-setup.zip';
    var mimetype = mime.lookup(file);
    //console.log(mimetype);

    res.setHeader('Content-disposition', 'attachment; filename=partscli-setup.zip');
    res.setHeader('Content-type', mimetype);

//	res.attachment(file);
	res.download(file);
    /*
    var fstream = fs.createReadStream(file);
    fstream.pipe(res);
    var had_error = false;
    fstream.on('error', function(err) {
        had_error = true;
    });
    fstream.on('close', function() {
        //if (! had_error) fs.unlink(file);
    });
    /*/ /*
    var filePath = './files/parts/setup';
    var fileName = 'partscli-setup.exe';
    res.download(filePath, fileName)
    //*/
});

router.post('/download', function(req, res, next) {
    console.log("POST /api/parts/update/download");

    console.log("userid: " + req.body.userid);
    console.log("userpwd: " + req.body.userpwd);
    console.log("version: " + req.body.version);

    var file = './files/parts/setup/partscli-setup.zip';
    var mimetype = mime.lookup(file);
    //console.log(mimetype);

    res.setHeader('Content-disposition', 'attachment; filename=partscli-setup.zip');
    res.setHeader('Content-type', mimetype);

	res.download(file);
	/*
    var fstream = fs.createReadStream(file);
    var had_error = false;
    fstream.on('error', function(err) {
        had_error = true;
    });
    fstream.on('close', function() {
        //if (! had_error) fs.unlink(file);
    });
	*/
});

module.exports = router;
