var express = require('express');
var router = express.Router();

var multiparty = require('multiparty');
var fs = require('fs');

var sprintf = require('sprintf-js').sprintf;
var vsprintf = require('sprintf-js').vsprintf;

function replaceAll(str, searchStr, replaceStr) {
    return str.split(searchStr).join(replaceStr);
}

router.get('/', function(req, res, next) {
    console.log("/api/parts/basket");
    res.render('api/parts/basket/basket');
});

//// 장바구니 저장
////
router.get('/save', function(req, res, next) {
    console.log("GET /api/parts/basket/save");
    res.render('api/parts/basket/save');
});

router.post('/save', function(req, res, next) {
    console.log("POST /api/parts/basket/save");

    console.log("uid: " + req.body.masterid);
    console.log("uid: " + req.body.uid);
    console.log("carNo: " + req.body.carNo);
    console.log("vin: " + req.body.vin);
    //console.log("basketdata: " + req.body.basketdata);

    if ("" == req.body.masterid) {
        console.log("masterid parameter empty");
        res.send("{ 'result': false, 'desc': 'masterid field is not defined' }");
        return ;
    }

    if ("" == req.body.uid) {
        console.log("uid parameter empty");
        res.send("{ 'result': false, 'desc': 'uid field is not defined' }");
        return ;
    }

    if ("" == req.body.carNo && "" == req.body.vin) {
        console.log("carNo and vin parameter empty");
        res.send("{ 'result': false, 'desc': 'carNo and vin field is not defined' }");
        return ;
    }

    if ("" == req.body.basketdata) {
        console.log("basketdata parameter empty");
        res.send("{ 'result': false, 'desc': 'basketdata field is not defined' }");
        return ;
    }

    var mysql = require('mysql');
    var conn = mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '0o0o!!!',
        insecureAuth: true
        //database: 'jtlab'
    });
    conn.connect();
    conn.query("USE jtlab");

    var masterid = req.body.masterid;
    var uid = req.body.uid;
    var id = (new Date()).toISOString().replace(/[^0-9]/g, "");
    id = uid + "-" + id;
    var carno = req.body.carNo;
    var vin = req.body.vin;
    var data = req.body.basketdata;
    data = data.toString().replace(/\n/gi, " ");
    data = data.toString().replace(/\r/gi, " ");
    data = replaceAll(data, "'", "\\'");

    /*
    var queryStr = sprintf("insert into parts_basket (id, masterid, uid, carno, vin, data) values('%1$s', '%2$s', '%3$s', '%4$s', '%5$s', '%6$s') " +
        "on duplicate key update id='%1$s', masterid='%2$s', uid='%3$s', carno='%4$s', vin='%5$s', data='%6$s'",
         id, masterid, uid, carno, vin, data);
    /*/
    var queryStr = sprintf("insert into parts_basket (id, masterid, uid, carno, vin, data) values('%1$s', '%2$s', '%3$s', '%4$s', '%5$s', '%6$s')",
        id, masterid, uid, carno, vin, data);
    //*/

    //console.log("query str : " + queryStr);

    var query = conn.query(queryStr, queryResult);
    function queryResult(err, rows, fields) {
        if (! err) {
            //console.log("query res : ", rows);
            //res.json(rows);
            var res_data = sprintf("{ 'result': true, 'basketid': '%1$s' }", id);
            //res.send("{ 'result': true }");
            res.send(res_data);
        }
        else {
            console.log("error while performing query.");
            console.log(err.stack);
            //res.send("database error!!!");
            res.send("{ 'result': false, 'desc': 'query failed' }");
        }
    }

    conn.end();
});

router.post('/update', function(req, res, next) {
    console.log("POST /api/parts/basket/update");

    console.log("basketid: " + req.body.basketid);
    //console.log("basketdata: " + req.body.basketdata);

    if ("" == req.body.basketid) {
        console.log("basketid parameter empty");
        res.send("{ 'result': false, 'desc': 'basketid field is not defined' }");
        return ;
    }

    if ("" == req.body.basketdata) {
        console.log("basketdata parameter empty");
        res.send("{ 'result': false, 'desc': 'basketdata field is not defined' }");
        return ;
    }

    var mysql = require('mysql');
    var conn = mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '0o0o!!!',
        insecureAuth: true
        //database: 'jtlab'
    });
    conn.connect();
    conn.query("USE jtlab");

    var basketid = req.body.basketid;
    var data = req.body.basketdata;
    data = data.toString().replace(/\n/gi, " ");
    data = data.toString().replace(/\r/gi, " ");
    data = replaceAll(data, "'", "\\'");

     var queryStr = sprintf("update parts_basket set data='%1$s'", data);
    queryStr += " where id='" + basketid + "'";

    //console.log("query str : " + queryStr);

    var query = conn.query(queryStr, queryResult);
    function queryResult(err, rows, fields) {

        if (! err) {
            //console.log("query res : ", rows);
            //res.json(rows);

            if (rows.affectedRows) {
                var res_data = sprintf("{ 'result': true, 'basketid': '%1$s' }", basketid);
                //res.send("{ 'result': true }");
                res.send(res_data);
            }
            else {
                res.send("{ 'result': false, 'desc': 'basketid not found' }")
            }

        }
        else {
            console.log("error while performing query.");
            console.log(err.stack);
            //res.send("database error!!!");
            res.send("{ 'result': false, 'desc': 'query failed' }");
        }
    }

    conn.end();
});

router.get('/list', function(req, res, next) {
    console.log("/api/parts/basket/list");
    //console.log(req);
    //console.log(req.headers);
    //console.log(req.header('host'));
    //console.log(req.header('user-agent'));
    console.log(req.query);

    console.log(req.query.masterid);
    console.log(req.query.uid);

    var mysql = require('mysql');
    var conn = mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '0o0o!!!',
        insecureAuth: true
        //database: 'jtlab'
    });
    conn.connect();
    conn.query("USE jtlab");

    //var masterid = "admin@jt-lab.co.kr"
    var masterid = req.query.masterid;
    var queryStr = sprintf("SELECT * from parts_basket where masterid = '%1$s'",
        masterid);
    var query = conn.query(queryStr, queryResult);
    function queryResult(err, rows, fields) {
        if (! err) {
            //console.log("the solution is: ", rows);
            res.render('api/parts/basket/list', {
                masterid: req.query.masterid,
                data1: rows
            });
        }
        else {
            console.log("error while performing query.");
            console.log(err.stack);

            res.send("database error!!!");
        }
    }

    //console.log(query);
    conn.end();

});

router.post('/list', function(req, res, next) {
    console.log("POST /api/parts/basket/list");
    //console.log(req);
    //console.log(req.headers);
    //console.log(req.header('host'));
    //console.log(req.header('user-agent'));

    console.log(req.body.masterid);

    var mysql = require('mysql');
    var conn = mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '0o0o!!!',
        insecureAuth: true
        //database: 'jtlab'
    });
    conn.connect();
    conn.query("USE jtlab");

    var masterid = req.body.masterid;
    var queryStr = sprintf("SELECT * from parts_basket where masterid = '%1$s'",
        masterid);
    var query = conn.query(queryStr, queryResult);
    function queryResult(err, rows, fields) {
        if (! err) {
            //console.log("the solution is: ", rows);
            res.json(rows);
        }
        else {
            console.log("error while performing query.");
            console.log(err.stack);

            res.send("[]");
        }
    }

    //console.log(query);
    conn.end();

});

router.post('/delete', function(req, res, next) {
    console.log("POST /api/parts/basket/delete");

    console.log("basketid: " + req.body.basketid);

    if ("" == req.body.basketid) {
        console.log("key parameter error!");
        //res.send("{}");
        res.send("{ 'result': false, 'desc': 'key filed is not defined' }");
        return ;
    }

    var mysql = require('mysql');
    var conn = mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '0o0o!!!',
        insecureAuth: true
        //database: 'jtlab'
    });
    conn.connect();
    conn.query("USE jtlab");

    var basketid = "";
    if (undefined == req.body.basketid) {
        console.log("exception : req.body.basketid is undefined");
        return ;
    }
    basketid = req.body.basketid.toString();

    var queryStr = "delete from parts_basket";
    queryStr += " where id='" + basketid + "'";

    console.log("query str : " + queryStr);

    var query = conn.query(queryStr, queryResult);
    function queryResult(err, rows, fields) {
        if (! err) {
            //console.log("the solution is: ", rows);
            //res.json(rows);
            if (rows.affectedRows) {
                res.send("{ 'result': true }");
            }
            else {
                res.send("{ 'result': false, 'desc': 'id is invalid' }");
            }
        }
        else {
            console.log("error while performing query.");
            console.log(err.stack);
            //res.send("database error!!!");
            res.send("{ 'result': false, 'desc': 'query failed' }");
        }
    }

    //console.log(query);
    conn.end();
});

module.exports = router;