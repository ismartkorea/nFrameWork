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

// --> /api/partsorder/user
router.get('/', function(req, res, next) {
  d.log("/api/partsorder/user");
  res.send('/api/partsorder/user');
});

//// 파츠 오더 시스템 사용자 권한 체크
////
router.get('/auth/service', function(req, res, next) {
  d.log("GET /api/partsorder/user/auth/service");
  res.render('api/partsorder/user/auth_service');
});

router.post('/auth/service', function(req, res, next) {
  d.log("POST /api/partsorder/user/auth/service");

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
    desc: "해당 사용자는 공업사 부품 주문 서비스 이용중입니다."
  };

  let usr_data = {};
  usr_data.userid = cid;

  let pool = conn.pool();

  let async = require('async');
  let tasks = [
    function (cb) {
      let pid = 'APP170911VDT';
      let query = u.sqlpf("select pay_no, pno, pay_result, to_dt, c_id, opt1_use_yn, opt2_use_yn from pay_inf_tbl where c_id = ? and pno = ? order by pay_no desc limit 1;", [cid, pid]);
      d.log(query);
      pool.query(query, function (err, rows, fields) {
        try {
          if (err) throw err;
          d.log(rows);
          if (0 != rows.length) {

            if (rows[0].pay_result == 'paid') {

            }
            else if (rows[0].pay_result == 'wait') {
              api_res.code = 302;
              cb(new Error('결제 대기중입니다.'));
              return;
            }
            else {
              api_res.code = 500;
              cb(new Error('서비스 이용을 할 수 없는 상태입니다.'));
              return;
            }

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
      d.log("[error] /api/partsorder/user/auth/service : " + err.message);
      api_res.success = false;
      api_res.desc = err.message;
      res.send(api_res);
    }
    else {
      d.log('[done] /api/partsorder/user/auth/service');
      res.send(api_res);
    }
  });
});

module.exports = router;