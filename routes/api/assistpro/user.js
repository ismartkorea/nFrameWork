var express = require('express');
var router = express.Router();

var multiparty = require('multiparty');
var fs = require('fs');

var sprintf = require('sprintf-js').sprintf;
var vsprintf = require('sprintf-js').vsprintf;

var debug = require("../common/debug");
var d = new debug();

var util = require("../common/util");
var u = new util();

var uniqid = require('uniqid');
var datediff = require('date-diff');
var crypto = require('crypto');

var mysqlconn = require("../common/mysqlconn");
var conncfg = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '0o0o!!!',
  insecureAuth: true,
  database: 'jtlab',
  connectionLimit: 25,
  waitForConnections: true
};
var conn = new mysqlconn(conncfg);
//var conn = new mysqlconn();

router.get('/', function(req, res, next) {
  d.log("/api/assistpro/user");
  res.send('/api/assistpro/user');
});

//// 어시스트 프로 사용자 권한 체크
////
router.get('/auth/service', function(req, res, next) {
  d.log("GET /api/assistpro/user/auth/service");
  //res.send('어시스트 프로 사용자의 권한을 체크합니다.');
  res.render('api/assistpro/user/auth/service');
});

router.post('/auth/service', function(req, res, next) {
  d.log("POST /api/assistpro/user/auth/service");

  if ("" == req.body.userid) {
    d.log("userid parameter empty");
    res.send("{ 'result': false, 'desc': 'userid field is not defined' }");
    return ;
  }

  let cid = req.body.userid;
  d.log("userid: " + cid);

  var api_res = {
    success: true,
    code: 200,
    desc: "해당 사용자는 어시스트 프로 서비스 이용중입니다."
  };

  let usr_data = {};
  usr_data.userid = cid;

  let pool = conn.pool();

  let async = require('async');
  let tasks = [
    function (cb) {
      let pid = 'APP170109ASS';
      let query = u.sqlpf("select pay_no, pno, pay_result, to_dt, c_id, opt1_use_yn, opt2_use_yn, opt3_use_yn from pay_inf_tbl where c_id = ? and pno = ?;", [cid, pid]);
      d.log(query);
      pool.query(query, function (err, rows, fields) {
        try {
          if (err) throw err;
          d.log(rows);
          if (0 != rows.length) {

            let to_date = new Date(rows[0].to_dt);
            d.log(to_date);

            let now_date = new Date(Date.now());
            d.log(now_date);

            let diff = new datediff(to_date, now_date);
            d.log(diff.days());

            if (diff.days() > 0) {
              usr_data.expired = false;
              usr_data.dayleft = diff.days();
              usr_data.opt1_enabled = rows[0].opt1_use_yn == 'Y' ? true : false;
              usr_data.opt2_enabled = rows[0].opt2_use_yn == 'Y' ? true : false;
              usr_data.opt3_enabled = rows[0].opt3_use_yn == 'Y' ? true : false;
            }
            else {
              usr_data.expired = true;
            }

            cb(null, rows);
            return;
          } else {
            api_res.code = 404;
            cb(new Error('해당 사용자의 결제내역을 찾을 수 없습니다.'));
            return;
          }
        }
        catch (e) {
          d.err(e);
        }
        cb(new Error('no data found'));
      });
    },
    function (data, cb) {
      let query = u.sqlpf("select opt_no, opt_name, opt_to from pay_opt_inf_tbl where pno = ? and pay_no = ?;", [data[0].pno, data[0].pay_no]);
      d.log(query);
      pool.query(query, function (err, rows, fields) {
        try {
          if (err) throw err;
          d.log(rows);
          if (0 != rows.length) {
            let now_date = new Date(Date.now());
            d.log(now_date);

            rows.forEach(function(row) {
              let opt_date = new Date(row.opt_to);
              d.log(opt_date);

              let diff = new datediff(opt_date, now_date);
              d.log(row.opt_no + " : " + diff.days());

              d.log(row.opt_no);
              if (row.opt_no == 'op1') {
                usr_data.opt1_name = row.opt_name;
                if (diff.days() > 0) {
                  usr_data.opt1_expired = false;
                  usr_data.opt1_dayleft = diff.days();
                }
                else {
                  usr_data.opt1_expired = true;
                }
              }
              else if (row.opt_no == 'op2') {
                usr_data.opt2_name = row.opt_name;
                if (diff.days() > 0) {
                  usr_data.opt2_expired = false;
                  usr_data.opt2_dayleft = diff.days();
                }
                else {
                  usr_data.opt2_expired = true;
                }
              }
              else if (row.opt_no == 'op3') {
                usr_data.opt3_name = row.opt_name;
                if (diff.days() > 0) {
                  usr_data.opt3_expired = false;
                  usr_data.opt3_dayleft = diff.days();
                }
                else {
                  usr_data.opt3_expired = true;
                }
              }
            });
          } else {
          }
        }
        catch (e) {
          d.err(e);
        }

        cb(null);
      });
    },
    function (cb) {
      /*
      */
      cb(null);
    }
  ];

  async.waterfall(tasks, function(err) {

    api_res.data = usr_data;

    if (err) {
      d.log("[error] /api/assistpro/user/auth/service : " + err.message);
      api_res.success = false;
      api_res.desc = err.message;
      res.send(api_res);
    }
    else {
      d.log('[done] /api/assistpro/user/auth/service');
      res.send(api_res);
    }
  });
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