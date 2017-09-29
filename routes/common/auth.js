var express = require('express');
var methodOverride = require('method-override');
var bodyParser = require('body-parser');
var flash = require('connect-flash');
var config = require('./dbconfig');
var mysql = require('mysql');
var router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));
router.use(methodOverride("_method"));
router.use(flash());


/**
 *
 */
router.get('/:usrId', function(req, res, next) {

    var usrId = req.params.usrId !=null ? req.params.usrId : '';

    var SQL = 'SELECT x.order_no as payNo, y.p_code as pNo, y.p_nm as pName,'
        + '(SELECT COUNT(a.order_no) FROM lab_order_detail_inf_tbl a, lab_pay_info_tbl b WHERE a.order_no = b.order_no AND a.p_uniq_code = "ASS1" AND a.p_div = "O" AND b.pay_result = "paid" AND b.expire_yn = "N" AND b.usr_id = ?) as optUseCnt,'
        + '(SELECT CASE WHEN COUNT(a.order_no) = 0 THEN "N" WHEN COUNT(a.order_no) > 0 THEN "Y" ELSE "N" END  FROM lab_order_detail_inf_tbl a, lab_pay_info_tbl b WHERE a.order_no = b.order_no AND a.p_code = "APP170109ASS1" AND a.p_div = "O" AND b.pay_result = "paid" AND b.expire_yn = "N" AND b.usr_id = ?) as opt1UseYn,'
        + '(SELECT CASE WHEN COUNT(a.order_no) = 0 THEN "N" WHEN COUNT(a.order_no) > 0 THEN "Y" ELSE "N" END  FROM lab_order_detail_inf_tbl a, lab_pay_info_tbl b WHERE a.order_no = b.order_no AND a.p_code = "APP170109ASS2" AND a.p_div = "O" AND b.pay_result = "paid" AND b.expire_yn = "N" AND b.usr_id = ?) as opt2UseYn,'
        + '(SELECT CASE WHEN COUNT(a.order_no) = 0 THEN "N" WHEN COUNT(a.order_no) > 0 THEN "Y" ELSE "N" END  FROM lab_order_detail_inf_tbl a, lab_pay_info_tbl b WHERE a.order_no = b.order_no AND a.p_code = "APP170109ASS3" AND a.p_div = "O" AND b.pay_result = "paid" AND b.expire_yn = "N" AND b.usr_id = ?) as opt3UseYn,'
        + 'x.expire_yn as expireYn FROM lab_pay_info_tbl x, lab_order_detail_inf_tbl y WHERE x.order_no = y.order_no AND y.p_code = "APP170109ASS"'
        + 'AND x.pay_result = "paid" AND x.expire_yn = "N" AND x.usr_id = ? ORDER BY x.insert_dt DESC;';

    if(usrId == '') {
        res.status(404).json({'result' : 'fail', 'err' : 'No user Id'});
    } else {
        var conn = mysql.createConnection(config);
        conn.connect();
        conn.query(SQL,
            [usrId, usrId, usrId, usrId, usrId],
            function(err, results) {
                if(err) {
                    console.log('err : ', err);
                    res.status(500).json({'result' : 'fail', 'err' : err});
                } else {
                    res.status(200).json({'result' : 'success', 'count' : results.length, 'data' : JSON.stringify(results)});
                }
            }
        );
        conn.end();
    }


});

/**
 * 판독기 권한조회 처리.
 */
router.post('/vdtcli', function(req, res, next) {

  if ("" == req.body.userid) {
    console.log("userid parameter empty");
    res.json({'result': false, code: 500, 'desc': 'userid field is not defined'});
    return ;
  }

  let usrId = req.body.userid;
  console.log("userid: " + usrId);

  var SQL = 'SELECT x.order_no as payNo, y.p_code as pNo, y.p_nm as pName,'
    + '(SELECT COUNT(a.order_no) FROM lab_order_detail_inf_tbl a, lab_pay_info_tbl b WHERE a.order_no = b.order_no AND a.p_uniq_code = "ASS2" AND a.p_div = "O" AND b.pay_result = "paid" AND b.expire_yn = "N" AND b.usr_id = ?) as optUseCnt,'
    + '(SELECT CASE WHEN COUNT(a.order_no) = 0 THEN "N" WHEN COUNT(a.order_no) > 0 THEN "Y" ELSE "N" END  FROM lab_order_detail_inf_tbl a, lab_pay_info_tbl b WHERE a.order_no = b.order_no AND a.p_code = "APP170911VDT1" AND a.p_div = "O" AND b.pay_result = "paid" AND b.expire_yn = "N" AND b.usr_id = ?) as opt1UseYn,'
    + '(SELECT CASE WHEN COUNT(a.order_no) = 0 THEN "N" WHEN COUNT(a.order_no) > 0 THEN "Y" ELSE "N" END  FROM lab_order_detail_inf_tbl a, lab_pay_info_tbl b WHERE a.order_no = b.order_no AND a.p_code = "APP170911VDT2" AND a.p_div = "O" AND b.pay_result = "paid" AND b.expire_yn = "N" AND b.usr_id = ?) as opt2UseYn,'
    + '(SELECT "" as opt3_use_yn FROM dual) as opt3UseYn,'
    + 'x.expire_yn as expireYn FROM lab_pay_info_tbl x, lab_order_detail_inf_tbl y WHERE x.order_no = y.order_no AND y.p_code = "APP170911VDT"'
    + 'AND x.pay_result = "paid" AND x.expire_yn = "N" AND x.usr_id = ? ORDER BY x.insert_dt DESC;';

  var conn = mysql.createConnection(config);
  conn.connect();
  conn.query(SQL,
    [usrId, usrId, usrId, usrId],
    function (err, results) {
      if (err) {
        console.log('err : ', err);
        res.json({'result' : false, code: 404, 'desc' : 'no user id'});
      } else {
        if (results.length) {
          res.json({'result': true, code: 200, 'desc': 'success', 'data': results[0]});
        }
        else {
          res.json({'result': true, code: 302, 'desc': 'no data'});
        }
      }
    }
  );
  conn.end();

});

/**
 *
 */
router.post('/', function(req, res, next) {

    var usrId = req.body.usrId !=null ? req.body.usrId : '';

    var SQL = 'SELECT x.order_no as payNo, y.p_code as pNo, y.p_nm as pName,'
            + '(SELECT COUNT(a.order_no) FROM lab_order_detail_inf_tbl a, lab_pay_info_tbl b WHERE a.order_no = b.order_no AND a.p_uniq_code = "ASS1" AND a.p_div = "O" AND b.pay_result = "paid" AND b.expire_yn = "N" AND b.usr_id = ?) as optUseCnt,'
            + '(SELECT CASE WHEN COUNT(a.order_no) = 0 THEN "N" WHEN COUNT(a.order_no) > 0 THEN "Y" ELSE "N" END  FROM lab_order_detail_inf_tbl a, lab_pay_info_tbl b WHERE a.order_no = b.order_no AND a.p_code = "APP170109ASS1" AND a.p_div = "O" AND b.pay_result = "paid" AND b.expire_yn = "N" AND b.usr_id = ?) as opt1UseYn,'
            + '(SELECT CASE WHEN COUNT(a.order_no) = 0 THEN "N" WHEN COUNT(a.order_no) > 0 THEN "Y" ELSE "N" END  FROM lab_order_detail_inf_tbl a, lab_pay_info_tbl b WHERE a.order_no = b.order_no AND a.p_code = "APP170109ASS2" AND a.p_div = "O" AND b.pay_result = "paid" AND b.expire_yn = "N" AND b.usr_id = ?) as opt2UseYn,'
            + '(SELECT CASE WHEN COUNT(a.order_no) = 0 THEN "N" WHEN COUNT(a.order_no) > 0 THEN "Y" ELSE "N" END  FROM lab_order_detail_inf_tbl a, lab_pay_info_tbl b WHERE a.order_no = b.order_no AND a.p_code = "APP170109ASS3" AND a.p_div = "O" AND b.pay_result = "paid" AND b.expire_yn = "N" AND b.usr_id = ?) as opt3UseYn,'
            + 'x.expire_yn as expireYn FROM lab_pay_info_tbl x, lab_order_detail_inf_tbl y WHERE x.order_no = y.order_no AND y.p_code = "APP170109ASS"'
            + 'AND x.pay_result = "paid" AND x.expire_yn = "N" AND x.usr_id = ? ORDER BY x.insert_dt DESC;';

    if(usrId == '') {
        res.status(404).json({'result' : 'fail', 'err' : 'No user Id'});
    } else {
        var conn = mysql.createConnection(config);
        conn.connect();
        conn.query(SQL,
            [usrId, usrId, usrId, usrId, usrId],
            function(err, results) {
                if(err) {
                    console.log('err : ', err);
                    res.status(500).json({'result' : 'fail', 'err' : err});
                } else {
                    res.status(200).json({'result' : 'success', 'count' : results.length, 'data' : JSON.parse(results)});
                }
            }
        );
        conn.end();
    }

});

module.exports = router;