/*
 * 모듈명  : index.js
 * 설명    : JT-LAB 화면 인덱스 에 대한 모듈.
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

//var sprintf = require('sprintf-js').sprintf;
//var vsprintf = require('sprintf-js').vsprintf;
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));
router.use(methodOverride("_method"));
router.use(flash());


// 카운터 처리.
router.use(countVisitors);

var conn = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  database : 'jtlab',
  user: 'jtlab',
  password: 'jtlab9123',
  insecureAuth: true,
  multipleStatements: true
});


/* GET home page. */
router.get('/', function(req, res, next) {
console.log('index 화면 호출');

  var ss = req.session;
  var SQL1 = 'SELECT p_code as pCode, p_uniq_code as pUniqCode, p_div as pDiv, p_nm as pNm FROM product_lab_info_tbl'
      + ' WHERE p_div = "M" AND p_display_yn = "Y" ORDER BY insert_dt ASC LIMIT 0, 5;';
  var SQL2 = ' SELECT @rownum:=@rownum+1 as num, no as no, title as title FROM announce_inf_tbl, (SELECT @rownum:=0) TMP'
      + ' ORDER BY date DESC LIMIT 0, 5;';

  var hostName = req.hostname;

  // 상품(서비스) 목록 & 공지사항 조회.
  conn.query(SQL1+SQL2, [],
      function(err, results) {
        if(err) {
          console.log('err : ', err);
        } else {

          if(hostName=='www.jt-lab.co.kr') {

            res.render('./index', { 'title' : 'jt-lab.co.kr', 'rList' : results[0], 'rList1' : results[1], 'loginYn' : 'N', 'session' : ss});
          } else if(hostName=='www.assistpro.co.kr'){

            res.redirect('./assist');
          } else {

            res.render('./index', { 'title' : 'localhost', 'rList' : results[0], 'rList1' : results[1], 'loginYn' : 'N', 'session' : ss});
          }

        }
  });


});


// 카운터 쿠키
function countVisitors(req, res, next) {
  //console.log(">>>>>>>>>>>>> counter visitors start <<<<<<<<<<<<<<<<<<<<");
  //console.log(">>>> req.cookies.count : " + req.cookies.count);
  //console.log(">>>> req.cookies['connect.sid] : " + req.cookies['connect.sid']);
  if(!req.cookies.count&&req.cookies['connect.sid']){
    res.cookie('count', "", { maxAge:3600000, httpOnly:true});
    var totalCount = 0;
    var todayCount = 0;
    var getDate = "";
    var now = new Date();
    var date = now.getFullYear() + "/" + now.getMonth() + "/" + now.getDate();
    if(date != req.cookies.countDate) {
      //console.log(">>>>>>>>>>>>> counter process <<<<<<<<<<<<<<<<<<<<");
      res.cookie('countDate', date, { maxAge: 86400000, httpOnly: true});
      // 쿠키 정보 조회.
      conn.query('select name, total_count, today_count, date from counter_inf_tbl where name = "visitors"',
          [],
          function(err, results) {
            //console.log(">>> results : " + JSON.stringify(results));
            if(err) return next();
            if(results==null || results=="") {
              totalCount = 1;
              todayCount = 1;
              conn.query('insert into counter_inf_tbl(name, total_count, today_count, date) values("visitors", ?, ?, ?)',
                  [totalCount, todayCount, date],
                  function(err, resultInsert) {
                    //console.log(">>> resultInsert : " + JSON.stringify(resultInsert));
                    if(err) {
                      console.log(err.message);
                    }
                  });
              conn.commit();
            } else {
              //console.log(">>>> results : " + JSON.stringify(results));
              getDate = results[0].date;
              totalCount = results[0].total_count;
              todayCount = results[0].today_count;
              totalCount++;
              if(date == getDate) {
                todayCount++;
              } else {
                todayCount = 1;
                date = getDate;
              }
              conn.query('update counter_inf_tbl set total_count = ?, today_count = ?, date =? where name = "visitors"',
              //conn.query('insert into counter_inf_tbl(name, total_count, today_count, date) values("visitors", ?, ?, ?)',
                  [totalCount, todayCount, date],
                  function(err, resultUpdate) {
                    //console.log(">>>> resultUpdate : " + JSON.stringify(resultUpdate));
                    if(err) {
                      console.log(err.message);
                    }
                  });
              conn.commit();
            }
          });
    }
    //console.log(">>>>>>>>>>>>> counter visitors process end <<<<<<<<<<<<<<<<<<<<");
  }
  //console.log(">>>>>>>>>>>>> counter visitors end <<<<<<<<<<<<<<<<<<<<");

  return next();
}

module.exports = router;
