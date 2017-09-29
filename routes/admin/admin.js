/*
 * 모듈명  : admin.js
 * 설명    : 관리자화면 에 대한 모듈.
 * 작성일  : 2016년 11월 1일
 * author  : HiBizNet
 * copyright : JT-LAB
 * version : 1.0
 */
var express = require('express');
var engine = require('ejs-locals');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var flash = require('connect-flash');
var router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));
router.use(methodOverride("_method"));
router.use(flash());

router.use('ejs', engine);

var conn = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    database : 'jtlab',
    user: 'jtlab',
    password: 'jtlab9123',
    insecureAuth: true,
    multipleStatements: true
});

// 게시글 리스트 호출.
router.get('/', function(req, res) {
    var ss = req.session;
    // 오늘 날짜
    var nowDate = new Date();
    var nowYear = nowDate.getFullYear();
    var nowMonth = nowDate.getMonth()+1;
    var nowDay = nowDate.getDate();
    if(nowMonth < 10) { nowMonth = "0" + nowMonth; }
    if(nowDay < 10) { nowDay = "0" + nowDay; }
    var todayDate = nowYear + "" + nowMonth + "" + nowDay;
    var nMonth = nowYear + "" + nowMonth;
    // 어제날짜
    var nowDate = new Date();
    var yesterDate = nowDate.getTime() - (1 * 24 * 60 * 60 * 1000);
    nowDate.setTime(yesterDate);
    var yesterYear = nowDate.getFullYear();
    var yesterMonth = nowDate.getMonth() + 1;
    var yesterDay = nowDate.getDate();
    if(yesterMonth < 10) { yesterMonth = "0" + yesterMonth; }
    if(yesterDay < 10) { yesterDay = "0" + yesterDay; }
    var yDate = yesterYear + "" + yesterMonth + "" + yesterDay;
    //console.log(">>> ysDate : " + yDate);
    //console.log(">>> date : " + todayDate);
    //console.log(">>> month : " + nMonth);
    //console.log(">> ss.usrLevel : " + ss.usrLevel);

    // 장기미처리 상태 건수 조회 및 업데이트 처리.
    // assist_qna_comment_tbl 에서 해당 미처리 건수가 있는 지 조회.
    conn.query('SELECT req_no as reqNo FROM assist_qna_tbl WHERE process_status = "prc" AND upd_dt <= date_sub(DATE_FORMAT(now(), "%Y-%m-%d"), interval 14 day);',
        [],
        function(err, results) {
            if(err) {
                console.log("err : " + err.message);
            } else {
                console.log(">>> 미처리 건수 조회");
                console.dir(results);
                if(results.length > 0) {
                    results.forEach(function (item, index) {
                        conn.query('UPDATE assist_qna_tbl SET process_status = "nop" WHERE req_no = ?;',
                            [item.reqNo],
                            function (err, results2) {
                                if (err) {
                                    console.log("err : " + err.message);
                                } else {
                                    console.log("장기미처리 건수 업데이트 처리.");
                                    console.dir(results2);
                                }
                            }
                        );
                    });
                }
            }
        }
    );
    /*
    conn.query('SELECT x.req_no as reqNo FROM assist_qna_tbl x, assist_qna_comment_tbl y'
        + ' WHERE x.process_status = "prc" AND x.upd_dt <= date_sub(DATE_FORMAT(now(), "%Y-%m-%d"), interval 7 day)'
        + ' AND x.req_no = y.req_no AND y.cm_div = "C" AND y.writer_ins_date <= date_sub(DATE_FORMAT(now(), "%Y-%m-%d"), interval 7 day);', [],
        function(err, results) {
            if(err) {
                console.log("err : " + err.message);
            } else {
                console.log("미처리건수 조회 처리");
                console.dir(results);

                if(results.length > 0) {
                    results.forEach(function (item, index) {
                        conn.query('UPDATE assist_qna_tbl SET process_status = "nop" WHERE req_no = ?;',
                            [item.reqNo],
                            function(err, results1) {
                                if(err) {
                                    console.log("err : " + err.message);
                                } else {
                                    console.log("장기미처리 건수 업데이트 처리2.");
                                    console.dir(results1);
                                }
                            }
                        );
                    });
                    //  건수가 없으면 assist_qna_tbl 에서 조회하여 처리.
                } else {
                    conn.query('SELECT req_no as reqNo FROM assist_qna_tbl WHERE process_status = "prc" AND upd_dt <= date_sub(DATE_FORMAT(now(), "%Y-%m-%d"), interval 14 day);',
                        [],
                        function(err, results2) {
                            if(err) {
                                console.log("err : " + err.message);
                            } else {
                                console.log(">>> 미처리 건수 조회");
                                console.dir(results2);
                                if(results2.length > 0) {
                                    results2.forEach(function (item2, index) {
                                        conn.query('UPDATE assist_qna_tbl SET process_status = "nop" WHERE req_no = ?;',
                                            [item2.reqNo],
                                            function (err, results3) {
                                                if (err) {
                                                    console.log("err : " + err.message);
                                                } else {
                                                    console.log("장기미처리 건수 업데이트 처리.");
                                                    console.dir(results3);
                                                }
                                            }
                                        );
                                    });
                                }
                            }
                        }
                    );
                }
            }
        });
    */
    //  장기간 미처리중 최신댓글이 달린 경우 처리로 수정함.
    /*
    conn.query('SELECT x.req_no as reqNo FROM assist_qna_tbl x, assist_qna_comment_tbl y'
        + ' WHERE x.process_status = "nop" AND x.upd_dt <= date_sub(DATE_FORMAT(now(), "%Y-%m-%d"), interval 7 day)'
        + ' AND x.req_no = y.req_no AND y.cm_div = "C" AND y.writer_ins_date > date_sub(DATE_FORMAT(now(), "%Y-%m-%d"), interval 7 day);', [],
        function(err, results5) {
            if (err) {
                console.log("err : " + err.message);
            } else {
                console.log("미처리건수 조회중 최신댓글이 있는 경우 진행처리");
                console.dir(results5);

                if (results5.length > 0) {
                    results5.forEach(function (itemX, index) {
                        conn.query('UPDATE assist_qna_tbl SET process_status = "prc", upd_dt = now(), upd_usr_id = ?, upd_usr_nm = ? WHERE req_no = ?;',
                            [ss.usrId, ss.usrName, itemX.reqNo],
                            function (err, results6) {
                                if (err) {
                                    console.log("err : " + err.message);
                                } else {
                                    console.log("장기미처리 건수 업데이트 처리2.");
                                    console.dir(results6);
                                }
                            }
                        );
                    });
                }
            }
        }
    );
    */

    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {

        // 일일 접속자 수 조회
        conn.query('select name, total_count, today_count, date from counter_inf_tbl where name = "visitors";'
            + ' select count(*) as todayCnt from c_inf_tbl where date_format(insert_dt, "%Y%m%d") = ?;'
            + ' select count(*) as yesdayCnt from c_inf_tbl where date_format(insert_dt, "%Y%m%d") = ?;'
            + ' select count(*) as monthCnt from c_inf_tbl where date_format(insert_dt, "%Y%m") = ?;'
            + ' select @rownum:=@rownum+1 as num, qno, name, title from qna_inf_tbl, (SELECT @rownum:=0) TMP'
            + ' where reply_yn = "N" and date_format(ins_dt, "%Y%m%d") = ?;',
            [todayDate, yDate, nMonth, todayDate],
            function(err, results) {
                if(err) {
                    console.log("err : " + err.message);
                } else {
                    res.render('./admin/dashboard', {result0 : results[0],
                        result1: results[1][0], result2: results[2][0], result3: results[3][0], result4: results[4], session : ss});
                }
            });

    } else {
        res.redirect('/admin/login');
    }

});

// 공지사항 리스트 호출.
router.get('/announces', function(req, res) {

    var ss = req.session;
    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {

        res.redirect('/admin/announce');

    } else {

        res.redirect('/admin/login');
    }


});

// 회원관리 리스트 호출.
router.get('/members', function(req, res) {
    var ss = req.session;
    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {

        res.redirect('/admin/member');

    } else {

        res.redirect('/admin/login');

    }

});

// 게시판 관리 화면 호출.
router.get('/boards', function(req, res) {
    var ss = req.session;

    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {

        res.render('./admin/boards');

    } else {

        res.redirect('/admin/login');

    }
});

// 문의 관리 화면 호출.
router.get('/qnas', function(req, res) {
    var ss = req.session;

    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {

        res.redirect('/admin/qna');

    }  else {

        res.redirect('/admin/login');

    }
});

// 결제 관리 화면 호출.
router.get('/pays', function(req, res) {

    var ss = req.session;
    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {
        res.redirect('/admin/pay');
    } else {
        res.redirect('/admin/login');
    }

});

// 공통코드 관리 화면 호출.
router.get('/commoncds', function(req, res) {

    var ss = req.session;
    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {

        res.redirect('/admin/commoncd');

    } else {

        res.redirect('/admin/login');
    }
});

// AssistPro 관리 화면 호출.
router.get('/assists', function(req, res) {

    var ss = req.session;
    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {
        res.redirect('/admin/assist');
    } else {
        res.redirect('/admin/login');
    }
});

// 접속 관리 화면 호출.
router.get('/visits', function(req, res) {

    var ss = req.session;
    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {
        res.redirect('/admin/visit');
    } else {
        res.redirect('/admin/login');
    }
});

// 코드 관리 화면 호출.
router.get('/codes', function(req, res) {

    var ss = req.session;
    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {

        res.redirect('/admin/code');

    } else {

        res.redirect('/admin/login');
    }
});

// 로그인 세션 관리 화면 호출.
router.get('/sessions', function(req, res) {

    var ss = req.session;
    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {

        res.redirect('/admin/session');

    } else {

        res.redirect('/admin/login');
    }
});

// 매니져 관리 화면 호출.
router.get('/managers', function(req, res) {

    var ss = req.session;
    if(ss.usrLevel == '000' || ss.usrLevel == '002') {

        res.redirect('/admin/manager');

    } else {

        res.redirect('/admin/login');
    }
});

// 쿠폰 관리 화면 호출.
router.get('/coupons', function(req, res) {

    var ss = req.session;
    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {

        res.redirect('/admin/coupon');

    } else {

        res.redirect('/admin/login');
    }
});

// 어드민 공지사항 게시판 관리 화면 호출.
router.get('/notifications', function(req, res) {
    var ss = req.session;

    if(ss.usrLevel == '000' || ss.usrLevel == '002') {

        res.redirect('/admin/notification');

    } else {

        res.redirect('/admin/login');

    }
});

// 개발자 공지사항 메시지 호출.
router.post('/getNotification', function(req, res) {
    var ss = req.session;

    // 공지사항
    conn.query('SELECT title as title, content as content, DATE_FORMAT(ins_date, "%Y년%m월%m일 %H시%m분") as date'
        + ' FROM admin_notice_inf_tbl where ins_date = (SELECT MAX(ins_date) FROM admin_notice_inf_tbl'
        + ' WHERE ins_date > DATE_SUB(now(),interval 1 DAY))',
        [],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.json({'result' : 'OK', 'info' : results});
            }
        }
    );

});

// 신규 접수 카운트 호출.
router.post('/getNewQnaCount', function(req, res) {
    var ss = req.session;

    // 공지사항
    conn.query('SELECT count(req_no) as cnt'
        + ' FROM assist_qna_tbl WHERE ins_view_yn = "N" AND process_status NOT IN ("cmp","nop","sav","tmp","") AND DATE_FORMAT(ins_dt,"%Y-%m-%d") >= DATE_FORMAT(now(),"%Y-%m-%d");'
        + ' SELECT req_no as reqNo, writer_nm as writerNm, CONCAT(LEFT(tro_stat_desc,6),"...") as troStatDesc, tro_stat_desc as troStatDesc2,'
        + ' tech_check_stat_desc as techCheckStatDesc, DATE_FORMAT(ins_dt, "%H:%m") as date, reply_view_yn as replyViewYn'
        + ' FROM assist_qna_tbl WHERE ins_view_yn = "N" AND process_status NOT IN ("cmp","nop","sav","tmp","") AND DATE_FORMAT(ins_dt,"%Y-%m-%d") >= DATE_FORMAT(now(),"%Y-%m-%d");',
        [],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                var newCnt = results[0][0].cnt;

                res.json({'result' : 'OK', 'count' : newCnt, 'rList1' : results[1], 'session' : ss});
            }
        }
    );

});

// 신규 댓글 카운트 호출.
router.post('/getNewCommentCount', function(req, res) {
    var ss = req.session;

    conn.query('SELECT count(rno) as cnt'
        + ' FROM assist_qna_comment_tbl WHERE view_yn = "N" AND cm_div = "C" AND DATE_FORMAT(writer_ins_date,"%Y-%m-%d") >= DATE_FORMAT(now(),"%Y-%m-%d");'
        + ' SELECT req_no as reqNo, writer_nm as writerNm, writer_comment as writerComment, DATE_FORMAT(writer_ins_date, "%H:%m") as date,'
        + ' view_yn as viewYn FROM assist_qna_comment_tbl WHERE view_yn = "N" AND cm_div = "C"'
        + ' AND DATE_FORMAT(writer_ins_date,"%Y-%m-%d") >= DATE_FORMAT(now(),"%Y-%m-%d");',
        [],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                var newCnt = results[0][0].cnt;

                res.json({'result' : 'OK', 'count' : newCnt, 'rList2' : results[1], 'session' : ss});
            }
        }
    );

});

// 어드민 메일 관리 화면 호출.
router.get('/emails', function(req, res) {
    var ss = req.session;

    if(ss.usrLevel == '000' || ss.usrLevel == '002') {

        res.redirect('/admin/email');

    } else {

        res.redirect('/admin/login');

    }
});

module.exports = router;