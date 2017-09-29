var express = require('express');
var router = express.Router();

var fs = require('fs');
var path = require('path');

var sprintf = require('sprintf-js').sprintf;
var vsprintf = require('sprintf-js').vsprintf;

var mime = require('mime');

function replaceAll(str, searchStr, replaceStr) {
    return str.split(searchStr).join(replaceStr);
}

router.get('/', function(req, res, next) {
    console.log("GET /api/appcenter/update");
    res.render('api/appcenter/update/update');
});

router.get('/list', function(req, res, next) {
    console.log("GET /api/appcenter/update/list");

    //console.log(req.query.appcode);

    var appcode = req.query.appcode;

    var mysql = require('mysql');
    var conn = mysql.createConnection({ host: 'localhost', port: 3306,
        user: 'root', password: '0o0o!!!', insecureAuth: true, database: 'jtlab' });
    conn.connect();
    //conn.query("USE jtlab");
    var queryStr = "";
    if (undefined != appcode) {
        queryStr = "select * from appcenter_pkgs where pcode = '" + appcode + "' order by updatetime desc limit 1";
    }
    else {
        //queryStr = "select * from appcenter_pkgs order by updatetime asc";
        //queryStr = "select * from (select * from appcenter_pkgs order by updatetime desc) as res_temp group by pcode";
        queryStr = "select * from appcenter_pkgs where updatetime in (select max(updatetime) from appcenter_pkgs group by pcode)";
    }

    var query = conn.query(queryStr, queryResult);
    function queryResult(err, rows, fields) {
        if (! err) {
            //console.log("the solution is: ", rows);
            res.json(rows);
        }
        else {
            console.log("error while performing query.");
            console.log(err.stack);

            res.send("{ 'result': false, 'desc': 'database failed' }");
        }
    }

    //console.log(query);
    conn.end();

});

router.get('/info', function(req, res, next) {
    console.log("GET /api/appcenter/update/info");

    //console.log(req.query.appid);
    var appcode = req.query.appcode;

    var mysql = require('mysql');
    var conn = mysql.createConnection({ host: 'localhost', port: 3306,
        user: 'root', password: '0o0o!!!', insecureAuth: true, database: 'jtlab' });
    conn.connect();
    //conn.query("USE jtlab");
    var queryStr = "";

    if (undefined == appcode) {
        queryStr = "select * from appcenter_pkgs where id = '" + req.query.appid + "'";
    }
    else {
        queryStr = "select * from appcenter_pkgs where pcode = '" + appcode + "' order by updatetime desc limit 1";
    }

    var query = conn.query(queryStr, queryResult);
    function queryResult(err, rows, fields) {
        if (! err) {
            //console.log("the solution is: ", rows);
            //res.json(rows);

            var iteminfo = { };

            iteminfo.no = rows[0].no;
            iteminfo.id = rows[0].id;
            iteminfo.pcode = rows[0].pcode;
            iteminfo.version = rows[0].version;
            iteminfo.title = rows[0].title;
            iteminfo.dnurl = rows[0].dnurl;
            iteminfo.desc = rows[0].desc;

            res.send(iteminfo);
        }
        else {
            console.log("error while performing query.");
            console.log(err.stack);

            res.send("{ 'result': false, 'desc': 'database failed' }");
        }
    }

    //console.log(query);
    conn.end();

});

router.get('/download', function(req, res, next) {
    console.log("GET /api/appcenter/update/download");
    console.log("dirname : " + __dirname);
    console.log(path.parse(process.mainModule.filename).dir);
    res.render('api/appcenter/update/download');
});

router.post('/download', function(req, res, next) {
    console.log("POST /api/appcenter/update/download");

    console.log("appcode: " + req.body.appcode);
    console.log("appver: " + req.body.appver);

    if ("" == req.body.appcode || "" == req.body.appver) {
        res.send("{ 'result': false, 'desc': 'parameter set failed' }");
        return ;
    }

    var filename = req.body.appcode + "-" + req.body.appver + ".zip";

    //console.log("dirname : " + __dirname)
    //var file = "./files/appcenter/updates/" + req.body.appcode + "/" + filename;
    var file = path.parse(process.mainModule.filename).dir + "/../files/appcenter/updates/" + req.body.appcode + "/" + filename;

    var mimetype = mime.lookup(file);
    //console.log(mimetype);

    res.setHeader('Content-disposition', "attachment; filename=" + filename);
    res.setHeader('Content-type', mimetype);

    res.download(file)
});

module.exports = router;
