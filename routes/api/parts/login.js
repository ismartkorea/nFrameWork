var express = require('express');
var router = express.Router();

var multiparty = require('multiparty');
var fs = require('fs');

var sprintf = require('sprintf-js').sprintf;
var vsprintf = require('sprintf-js').vsprintf;

router.get('/', function(req, res, next) {
    console.log("/api/parts/login");
    res.render('api/parts/login/login');
});

//// 사용자 로그인
////
router.get('/user', function(req, res, next) {
    console.log("GET /api/parts/login/user");
    res.render('api/parts/login/user');
});

router.post('/user', function(req, res, next) {
    console.log("POST /api/parts/login/user");

    console.log("userid: " + req.body.userid);
    console.log("userpwd: " + req.body.userpwd);

    if ("" == req.body.userid) {
        console.log("userid parameter empty");
        res.send("{ 'result': false, 'desc': 'userid field is not defined' }");
        return ;
    }

    if ("" == req.body.userpwd) {
        console.log("userpwd parameter empty");
        res.send("{ 'result': false, 'desc': 'userpwd field is not defined' }");
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

    var queryStr = "select * from parts_user";
    queryStr += " where id='" + req.body.userid + "'";
    console.log("query str : " + queryStr);

    var query = conn.query(queryStr, queryResult);
    function queryResult(err, rows, fields) {
        if (! err) {
            console.log("query res : ", rows);
            //res.json(rows);

            if (0 == rows.length) {
                res.send("{ 'result': false, 'desc': 'id not found' }")
            }
            else if (req.body.userpwd == rows[0].pwd) {
                res.send("{ 'result': true }");
            }
            else {
                res.send("{ 'result': false, 'desc': 'password not match' }")
            }
        }
        else {
            console.log("error while performing query.");
            console.log(err.stack);
            res.send("{ 'result': false, 'desc': 'query failed' }");
        }
    }

    conn.end();
});

//// 마스터 사용자 로그인
////
//// jt-lab.co.kr 회원 테이블에 직접 접근해서 아이디 비번을 인증하기 위해 임시(?)로
//// 만듬 / 원래는 jt-lab.co.kr 회원에 대한 인증은 http call 을 통해 해야함
////
//// 아이디/비번 로그인 요청이 들어오면
//// 1. parts_user db 에 masterid-id 와 pwd 를 검사하고 있으면 로그인 성공
//// 2. parts_user db 에 masterid-id 정보가 없으면 c_inf_tbl 을 사용해서 로그인 검증, 검증 실패면 로그인 실패
//// c_inf_tbl 에서 로그인 정보가 검증이 되면 parts_user db 에 로그인 정보를 복사하고 로그인 성공
////
////
router.get('/master', function(req, res, next) {
    console.log("GET /api/parts/login/master");
    res.render('api/parts/login/master');
});

router.post('/master', function(req, res, next) {
    console.log("POST /api/parts/login/master");

    console.log("userid: " + req.body.userid);
    console.log("userpwd: " + req.body.userpwd);

    if ("" == req.body.userid) {
        console.log("userid parameter empty");
        res.send("{ 'result': false, 'desc': 'userid field is not defined' }");
        return ;
    }

    if ("" == req.body.userpwd) {
        console.log("userpwd parameter empty");
        res.send("{ 'result': false, 'desc': 'userpwd field is not defined' }");
        return ;
    }

    var mysql = require('mysql');
    var conn = mysql.createConnection({ host: 'localhost', port: 3306, user: 'root',
        password: '0o0o!!!', insecureAuth: true, database: 'jtlab' });
    conn.connect();
    //conn.query("USE jtlab");

    var queryStr = "select * from parts_user";
    queryStr += " where id='" + req.body.userid + "'";
    console.log("query str : " + queryStr);

    var query = conn.query(queryStr, function(err, rows, fields) {
        if (! err) {
            console.log("query res : ", rows);
            //res.json(rows);

            if (0 == rows.length) {
                //res.send("{ 'result': false, 'desc': 'id not found' }")
                console.log("{ 'result': false, 'desc': 'id not found' }");
                var conn = mysql.createConnection({ host: 'localhost', port: 3306, user: 'root',
                    password: '0o0o!!!', insecureAuth: true, database: 'jtlab' });
                conn.connect();
                var queryStr = "select AES_DECRYPT(UNHEX(c_pwd),\"jtlab\") as pwd, c_id, c_email from c_inf_tbl";
                queryStr += " where c_id='" + req.body.userid + "'";
                console.log("query str : " + queryStr);

                var query = conn.query(queryStr, function(err, rows, fields) {
                    if (! err) {
                        console.log("query res : ", rows);
                        //res.json(rows);

                        if (0 == rows.length) {
                            res.send("{ 'result': false, 'desc': '가입되지 않은 아이디 입니다.' }")
                        }
                        else if (req.body.userpwd == rows[0].pwd) {
                            console.log("req.body.userpwd == rows[0].pwd");
                            var masterid = rows[0].c_id;
                            var masterpwd = rows[0].pwd;
                            var conn = mysql.createConnection({ host: 'localhost', port: 3306, user: 'root',
                                password: '0o0o!!!', insecureAuth: true, database: 'jtlab' });
                            conn.connect();
                            var queryStr = "insert into parts_user (masterid, id, pwd, authlev)";
                            queryStr = queryStr + " values('" + masterid + "', '" + masterid + "', '" + masterpwd + "', '100')";
                            console.log("query str : " + queryStr);

                            var query = conn.query(queryStr, function(err, rows, fields) {
                                if (! err) {
                                    console.log("query res : ", rows);
                                }
                                else {
                                    console.log("error while performing query.");
                                    console.log(err.stack);
                                }

                            });
                            conn.end();
                            res.send("{ 'result': true }");
                        }
                        else {
                            res.send("{ 'result': false, 'desc': '비밀번호가 틀립니다.' }")
                        }
                    }
                    else {
                        console.log("error while performing query.");
                        console.log(err.stack);
                        res.send("{ 'result': false, 'desc': 'query failed' }");
                    }
                });
                conn.end();
            }
            else if (req.body.userpwd == rows[0].pwd) {
                res.send("{ 'result': true }");
            }
            else {
                res.send("{ 'result': false, 'desc': 'password not match' }")
            }
        }
        else {
            console.log("error while performing query.");
            console.log(err.stack);
            res.send("{ 'result': false, 'desc': 'query failed' }");
        }
    });
    conn.end();
});

module.exports = router;