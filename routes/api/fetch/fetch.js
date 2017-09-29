var express = require('express');
var router = express.Router();

var debug = require("../common/debug");
var d = new debug();

var util = require("../common/util");
var u = new util();

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

// --> /api/fetch/
router.get('/', function(req, res, next) {
  d.log("/api/fetch");
  res.send('/api/fetch');
});

//// fetch 정보
////
router.get('/info', function(req, res, next) {
  d.log("GET /api/fetch/info");

  var api_res = {
    result: true,
    errno: 0,
    desc: 'success'
  };

  if ((req.query.name == undefined) ||
    (req.query.type == undefined) ||
    (req.query.class == undefined) ||
    (req.query.rel == undefined)
    ) {
    api_res.result = false;
    api_res.errno = 302;
    api_res.desc = "parameter error";
    res.send(api_res);
    return ;
  }
  d.log('name: ' + req.query.name);
  d.log('type: ' + req.query.type);
  d.log('class: ' + req.query.class);
  d.log('rel: ' + req.query.rel);

  var p_name = req.query.name;
  var p_type = req.query.type;
  var p_class = req.query.class;
  var p_rel = req.query.rel;

  if ((p_name == "") || (p_type == "")) {
    api_res.result = false;
    api_res.errno = 302;
    api_res.desc = "parameter error";
    res.send(api_res);
    return ;
  }

  var pool = conn.pool();

  var query;

  query = u.sqlpf("select * from fetch_pkgs where name=? and type=? and class=? and rel>? order by rel asc limit 1", [p_name, p_type, p_class, p_rel]);
  d.log(query);
  pool.query(query, function (err, rows, fields) {
    try {
      if (err) throw err;
      d.log(rows);
      api_res.result = true;
      api_res.datacnt = rows.length;
      api_res.data = rows;
    }
    catch (e) {
      d.err(e);
      api_res.result = false;
      api_res.errno = e.errno;
      api_res["desc"] = u.stdpf("{0}", e.code);
    }

    res.send(api_res);
  });
});

/* /api/vehicle/tracker/init_vdt_vins */
router.get('/init_fetch_pkgs', function (req, res, next) {
  d.log('/api/fetch/init_fetch_pkgs');

  // socket 정보 확인
  var extip = req.connection.remoteAddress;
  d.log('extip : ' + extip);
  extip = extip.slice(7);
  d.log('extip : ' + extip);

  ////

  var pool = conn.pool();

  var api_res = {
    result: false,
    errno: 0,
    desc: "-",
  };

  var query;

  var async = require('async');
  async.waterfall([
    function (cb) {
      query =
        "CREATE TABLE fetch_pkgs( \
        no int(11) not null auto_increment, \
        name varchar(32) not null, \
        type varchar(32) not null, \
        class varchar(32) not null, \
        rel int(11), \
        url varchar(255) not null, \
        updatedate varchar(8) not null, \
        updatetime datetime, \
        primary key(no,rel) \
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8;";

      pool.query(query, function (err, rows, fields) {
        try {
          if (err) throw err;
          d.log(rows);
          api_res.result = true;
        }
        catch (e) {
          d.err(e);
          api_res.result = false;
          api_res.errno = e.errno;
          api_res["desc"] = u.stdpf("{0}", e.code);
        }
        cb(null);
      });
    },
    function (cb) {
      if (!api_res.result) {
        cb(null);
        return;
      }

      query = "create trigger fetch_pkgs_insert before insert on fetch_pkgs for each row set new.updatetime = now();";

      pool.query(query, function (err, rows, fields) {
        try {
          if (err) throw err;
          d.log(rows);
          api_res.result = true;
        }
        catch (e) {
          d.err(e);
          api_res.result = false;
          api_res.errno = e.errno;
          api_res["desc"] = u.stdpf("{0}", e.code);
        }
        cb(null);
      });
    },
    function (cb) {
      res.send(api_res);
    }
  ]);
});

module.exports = router;