/*
 * 모듈명  : log.js
 * 설명    : 관리자화면 메뉴 '로그' 에 대한 모듈.
 * 작성일  : 2017년 08월 24일
 * author  : HiBizNet
 * copyright : JT-LAB
 * version : 1.0
 */
var express = require('express');
var mysql = require('mysql');
var config = require('../common/dbconfig');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var flash = require('connect-flash');
var router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));
router.use(methodOverride("_method"));
router.use(flash());

var conn = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    database : 'jtlab',
    user: 'jtlab',
    password: 'jtlab9123',
    insecureAuth: true,
    multipleStatements: true
});

/**
 * 로그 관리 화면 호출.
 */
router.get('/sql/error', function(req, res) {
    var ss = req.session;

    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {

        var reqPage = req.query.page ? parseInt(req.query.page) : 0;
        //console.log(">>> reqPage = " + reqPage);
        var offset = 3;
        var page = Math.max(1, reqPage);
        //console.log(">>> page = " + page);
        var limit = 10;
        var skip = (page - 1) * limit;
        //console.log(">>> skip = " + skip);

        var SQL1 = 'SELECT COUNT(code) FROM sql_err_log_tbl;';
        var SQL2 = ' SELECT @rownum:=@rownum+1 as num, code as code, err_no as errNo, sql_msg as sqlMsg,';
        SQL2 += ' DATE_FORMAT(ins_date, "%Y-%m-%d") as insDate FROM sql_err_log_tbl,';
        SQL2 += ' (SELECT @rownum:=' + skip + ') TMP ORDER BY ins_date DESC LIMIT ' + skip + ', ' + limit + ";";


        var conn = mysql.createConnection(config);
        conn.connect();
        conn.query(SQL1 + SQL2, [], function (err, results) {
            if (err) {
                console.log('err : ', err);
            } else {
                var count = results[0][0].cnt;
                var maxPage = Math.ceil(count / limit);

                res.status(200).render('./admin/logs/sqlErrorList',
                    {
                        'rList': results[1],
                        'page': page,
                        'maxPage': maxPage,
                        'offset': offset,
                        'session': ss
                    }
                );
            }
        });
        conn.end();

    } else {
        res.redirect('/admin');
    }

});

module.exports = router;