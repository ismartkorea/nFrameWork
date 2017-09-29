/*
 * 모듈명  : delivery.js
 * 설명    : 배송관리 에 대한 모듈.
 * 작성일  : 2017년 09월 15일
 * author  : HiBizNet
 * copyright : JT-COMPANY
 * version : 1.0
 */
var express = require('express');
var mysql = require('mysql');
var session = require('express-session');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var flash = require('connect-flash');
var util = require('util');
var router = express.Router();
// DB Connect 설정.
var config = require('../common/dbconfig');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:true}));
router.use(methodOverride("_method"));
router.use(flash());
router.use(session({
    secret: 'test!@$#!',
    resave: false,
    saveUninitialized: false
}));


// 관리 화면 호출.
router.get('/', function(req, res) {

    var ss = req.session;

    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {

        var srchType = req.query.srchType != null ? req.query.srchType : "";
        var srchText = req.query.srchText != null ? req.query.srchText : "";
console.log(">>> srchType : " + srchType);
        var addSQL = "";

        if (srchType == "payCode") {
            addSQL = ' WHERE x.pay_code = ?';
        } else if (srchType == "shippingNo") {
                addSQL = ' WHERE x.shipping_no = ?';
        } else if (srchType == "orderNm") {
            addSQL = ' WHERE x.order_nm like concat(?,"%")';
        } else if (srchType == "receiverNm") {
            addSQL = ' WHERE x.addrsee_nm like concat(?,"%")';
        }

        // 페이징 처리.
        var reqPage = req.query.page ? parseInt(req.query.page) : 0;
        //console.log(">>> reqPage = " + reqPage);
        var offset = 3;
        var page = Math.max(1, reqPage);
        //console.log(">>> page = " + page);
        var limit = 10;
        var skip = (page - 1) * limit;

        var SQL1 = 'SELECT COUNT(*) as cnt FROM lab_shipping_inf_tbl x';
        var SQL2 = 'SELECT @rownum:=@rownum+1 as num, x.pay_code as payCode, x.order_usr_id as orderUsrId, x.order_nm as orderNm, x.order_addr1 as orderAddr1,'
            + ' x.order_addr2 as orderAddr2, x.order_postno as orderPostno, x.order_tel_no as orderTelNo, x.order_tel_no1 as orderTelNo1,'
            + ' x.order_tel_no2 as orderTelNo2, x.order_tel_no3 as orderTelNo3, x.order_cell_no as orderCellNo, x.order_cell_no1 as orderCellNo1,'
            + ' x.order_cell_no2 as orderCellNo2, x.order_cell_no3 as orderCellNo3, x.addrsee_nm as addrseeNm, x.addrsee_usr_id as addrseeUsrId,'
            + ' x.addrsee_addr1 as addrseeAddr1, x.addrsee_addr2 as addrseeAddr2, x.addrsee_postno as addrseePostno, x.addrsee_tel_no as addrseeTelNo,'
            + ' x.addrsee_tel_no1 as addrseeTelNo1, x.addrsee_tel_no2 as addrseeTelNo2, x.addrsee_tel_no3 as addrseeTelNo3, x.addrsee_cell_no as addrseeCellNo,'
            + ' x.addrsee_cell_no1 as addrseeCellNo1, x.addrsee_cell_no2 as addrseeCellNo2, x.addrsee_cell_no3 as addrseeCellNo3,'
            + ' CASE WHEN x.shipping_price_type = "DS00" THEN "무료" WHEN x.shipping_price_type = "DS01" THEN "선불" WHEN x.shipping_price_type = "DS02" THEN "착불" ELSE "" END as shippingPriceTypeNm,'
            + ' x.shipping_price_type as shippingPriceType, IFNULL(x.shipping_price,0) as shippingPrice, x.shipping_status as shippingStatus,'
            + ' CASE WHEN x.shipping_status = "DTF1" THEN "배송준비중" WHEN x.shipping_status = "DTF2" THEN "배송처리완료" WHEN x.shipping_status = "DTF3" THEN "배송도착완료" ELSE "" END as shippingStatusNm,'
            + ' x.shipping_comp_nm as shippingCompNm, IFNULL(x.shipping_no,"없음") as shippingNo, DATE_FORMAT(IFNULL(x.shipping_send_date,"00000000"), "%Y-%m-%d") as shippingSendDate, DATE_FORMAT(IFNULL(x.shipping_receive_date,"00000000"),"%Y-%m-%d") as shippingReceiveDate,'
            + ' x.manager_ins_id as managerInsId, IFNULL(x.manager_ins_nm,"없음") as managerInsNm, DATE_FORMAT(x.manager_ins_date, "%Y-%m-%d") as manager_ins_date,'
            + ' x.manager_upd_id as managerUpdId, x.manager_upd_nm as manager_upd_nm, DATE_FORMAT(x.manager_upd_date, "%Y-%m-%d") as managerUpdDate'
            + ' FROM lab_shipping_inf_tbl x, (SELECT @rownum:=' + skip + ') TMP' + addSQL
            + ' ORDER BY x.ins_date DESC LIMIT ';

        // MySQL Connect
        var conn = mysql.createConnection(config);
        conn.connect();
        conn.query(SQL1 + addSQL + '; ' + SQL2  + skip + ', ' + limit + ";",
            [srchText, srchText],
            function (err, results) {
                if (err) {
                    console.log('error : ', err.message);
                } else {
                    var count = results[0][0].cnt;
                    var maxPage = Math.ceil(count / limit);

                    res.render('./admin/delivery/list', {
                        rList: results[1],
                        srchType: srchType,
                        srchText: srchText,
                        page: page,
                        maxPage: maxPage,
                        offset: offset,
                        session: ss
                    });
                }
            });
    } else {
        res.redirect('/admin');
    }
});

/**
 * 배송 정보 검색 처리.
 */
router.post('/search', function(req, res) {

    var ss = req.session;

    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {

        var srchType = req.body.srchType != null ? req.body.srchType : "";
        var srchText = req.body.srchText != null ? req.body.srchText : "";
console.log(">>> srchType : " + srchType);
console.log(">>> srchType : " + srchText);
        var addSQL = "";

        if (srchType == "payCode") {
            addSQL = ' WHERE x.pay_code = ?';
        } else if (srchType == "shippingNo") {
            addSQL = ' WHERE x.shipping_no = ?';
        } else if (srchType == "orderNm") {
            addSQL = ' WHERE x.order_nm like concat(?,"%")';
        } else if (srchType == "receiverNm") {
            addSQL = ' WHERE x.addrsee_nm like concat(?,"%")';
        }

        // 페이징 처리.
        var reqPage = req.query.page ? parseInt(req.query.page) : 0;
        //console.log(">>> reqPage = " + reqPage);
        var offset = 3;
        var page = Math.max(1, reqPage);
        //console.log(">>> page = " + page);
        var limit = 10;
        var skip = (page - 1) * limit;

        var SQL1 = 'SELECT COUNT(*) as cnt FROM lab_shipping_inf_tbl x';
        var SQL2 = 'SELECT @rownum:=@rownum+1 as num, x.pay_code as payCode, x.order_usr_id as orderUsrId, x.order_nm as orderNm, x.order_addr1 as orderAddr1,'
            + ' x.order_addr2 as orderAddr2, x.order_postno as orderPostno, x.order_tel_no as orderTelNo, x.order_tel_no1 as orderTelNo1,'
            + ' x.order_tel_no2 as orderTelNo2, x.order_tel_no3 as orderTelNo3, x.order_cell_no as orderCellNo, x.order_cell_no1 as orderCellNo1,'
            + ' x.order_cell_no2 as orderCellNo2, x.order_cell_no3 as orderCellNo3, x.addrsee_nm as addrseeNm, x.addrsee_usr_id as addrseeUsrId,'
            + ' x.addrsee_addr1 as addrseeAddr1, x.addrsee_addr2 as addrseeAddr2, x.addrsee_postno as addrseePostno, x.addrsee_tel_no as addrseeTelNo,'
            + ' x.addrsee_tel_no1 as addrseeTelNo1, x.addrsee_tel_no2 as addrseeTelNo2, x.addrsee_tel_no3 as addrseeTelNo3, x.addrsee_cell_no as addrseeCellNo,'
            + ' x.addrsee_cell_no1 as addrseeCellNo1, x.addrsee_cell_no2 as addrseeCellNo2, x.addrsee_cell_no3 as addrseeCellNo3,'
            + ' CASE WHEN x.shipping_price_type = "DS00" THEN "무료" WHEN x.shipping_price_type = "DS01" THEN "선불" WHEN x.shipping_price_type = "DS02" THEN "착불" ELSE "" END as shippingPriceTypeNm,'
            + ' x.shipping_price_type as shippingPriceType, IFNULL(x.shipping_price,0) as shippingPrice, x.shipping_status as shippingStatus,'
            + ' CASE WHEN x.shipping_status = "DTF1" THEN "배송준비중" WHEN x.shipping_status = "DTF2" THEN "배송처리완료" WHEN x.shipping_status = "DTF3" THEN "배송도착완료" ELSE "" END as shippingStatusNm,'
            + ' x.shipping_comp_nm as shippingCompNm, IFNULL(x.shipping_no,"없음") as shippingNo, DATE_FORMAT(IFNULL(x.shipping_send_date,"00000000"), "%Y-%m-%d") as shippingSendDate, DATE_FORMAT(IFNULL(x.shipping_receive_date,"00000000"),"%Y-%m-%d") as shippingReceiveDate,'
            + ' x.manager_ins_id as managerInsId, IFNULL(x.manager_ins_nm,"없음") as managerInsNm, DATE_FORMAT(x.manager_ins_date, "%Y-%m-%d") as manager_ins_date,'
            + ' x.manager_upd_id as managerUpdId, x.manager_upd_nm as manager_upd_nm, DATE_FORMAT(x.manager_upd_date, "%Y-%m-%d") as managerUpdDate'
            + ' FROM lab_shipping_inf_tbl x, (SELECT @rownum:=' + skip + ') TMP' + addSQL
            + ' ORDER BY x.ins_date DESC LIMIT ';

        // MySQL Connect
        var conn = mysql.createConnection(config);
        conn.connect();
        conn.query(SQL1 + addSQL + '; ' + SQL2  + skip + ', ' + limit + ";",
            [srchText, srchText],
            function (err, results) {
                if (err) {
                    console.log('error : ', err.message);
                } else {
                    var count = results[0][0].cnt;
                    var maxPage = Math.ceil(count / limit);

                    res.render('./admin/delivery/list', {
                        rList: results[1],
                        srchType: srchType,
                        srchText: srchText,
                        page: page,
                        maxPage: maxPage,
                        offset: offset,
                        session: ss
                    });
                }
            });
    } else {
        res.redirect('/admin');
    }

});




module.exports = router;