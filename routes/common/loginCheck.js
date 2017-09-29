var Login = function Login() {};

var config = require('./dbconfig');
var mysql = require('mysql');
var async = require('async');

Login.prototype.loginProcess = function(ipAddress, usrId, usrPwd, ss, cb) {

    let rUsrId = ''; let rRet = '';
    let SQL1 = 'SELECT c_id as id, AES_DECRYPT(UNHEX(c_pwd),"jtlab") as pwd, c_no as no,';
    SQL1 += ' c_name as name, c_email as email, c_tel_no as telNo, c_cell_no as cellNo,';
    SQL1 += ' c_user_tp as type, c_auth_level as level, c_comp_nm as compNm, c_saup_no as saupNo';
    SQL1 += ' FROM c_inf_tbl WHERE c_id = ?';
    SQL1 += ' AND AES_DECRYPT(UNHEX(c_pwd),"jtlab") = ?;';

    let SQL2 = ' SELECT x.order_no as payNo, y.p_code as pNo, y.p_nm as pName,';
    SQL2 += ' (SELECT COUNT(a.order_no) FROM order_detail_inf_tbl a, pay_info_tbl b WHERE a.order_no = b.order_no AND a.p_uniq_code = "ASS1" AND a.p_div = "O" AND b.pay_result = "paid" AND b.expire_yn = "N" AND b.usr_id = ?) as optUseCnt,';
    SQL2 += ' (SELECT CASE WHEN COUNT(a.order_no) = 0 THEN "N" WHEN COUNT(a.order_no) > 0 THEN "Y" ELSE "N" END  FROM order_detail_inf_tbl a, pay_info_tbl b WHERE a.order_no = b.order_no AND a.p_code = "APP170109ASS1" AND a.p_div = "O" AND b.pay_result = "paid" AND b.expire_yn = "N" AND b.usr_id = ?) as opt1UseYn,';
    SQL2 += ' (SELECT CASE WHEN COUNT(a.order_no) = 0 THEN "N" WHEN COUNT(a.order_no) > 0 THEN "Y" ELSE "N" END  FROM order_detail_inf_tbl a, pay_info_tbl b WHERE a.order_no = b.order_no AND a.p_code = "APP170109ASS2" AND a.p_div = "O" AND b.pay_result = "paid" AND b.expire_yn = "N" AND b.usr_id = ?) as opt2UseYn,';
    SQL2 += ' (SELECT CASE WHEN COUNT(a.order_no) = 0 THEN "N" WHEN COUNT(a.order_no) > 0 THEN "Y" ELSE "N" END  FROM order_detail_inf_tbl a, pay_info_tbl b WHERE a.order_no = b.order_no AND a.p_code = "APP170109ASS3" AND a.p_div = "O" AND b.pay_result = "paid" AND b.expire_yn = "N" AND b.usr_id = ?) as opt3UseYn,';
    SQL2 += ' x.expire_yn as expireYn';
    SQL2 += ' FROM pay_info_tbl x, order_detail_inf_tbl y WHERE x.order_no = y.order_no AND y.p_code = "APP170109ASS"';
    SQL2 += ' AND x.pay_result = "paid" AND x.expire_yn = "N" AND x.usr_id = ? ORDER BY x.insert_dt DESC;';

    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query(SQL1 + SQL2,
        [usrId, usrPwd, usrId, usrId, usrId, usrId, usrId, usrId],
        function (err1, results1) {
            if (err1) {
                console.log('error2 : ', JSON.stringify(err1));
                cb(err1, null);
            } else {
                if (results1[0].length > 0) {
                    // 세션 저장.
                    ss.usrNo = results1[0][0].no;
                    ss.usrId = results1[0][0].id;
                    ss.usrName = results1[0][0].name;
                    ss.usrType = results1[0][0].type;
                    ss.usrLevel = results1[0][0].level;
                    ss.usrEmail = results1[0][0].email;
                    ss.usrTelNo = results1[0][0].telNo;
                    ss.usrCellNo = results1[0][0].cellNo;
                    ss.usrCompNm = results1[0][0].compNm;
                    ss.usrSaupNo = results1[0][0].saupNo;
                    ss.usrIp = ipAddress;
                    rUsrId = results1[0][0].id;
                    if (results1[1].length > 0) {
                        ss.payNo = results1[1][0].payNo;
                        ss.pNo = results1[1][0].pNo;
                        ss.pName = results1[1][0].pName;
                        ss.optUseCnt = results1[1][0].optUseCnt;
                        ss.opt1UseYn = results1[1][0].opt1UseYn;
                        ss.opt2UseYn = results1[1][0].opt2UseYn;
                        ss.opt3UseYn = results1[1][0].opt3UseYn;
                        ss.opt4UseYn = '';
                        ss.opt5UseYn = '';
                        ss.expireYn = results1[1][0].expireYn;
                    } else {
                        ss.payNo = '';
                        ss.pNo = '';
                        ss.pName = '';
                        ss.optUseCnt = '';
                        ss.opt1UseYn = '';
                        ss.opt2UseYn = '';
                        ss.opt3UseYn = '';
                        ss.opt4UseYn = '';
                        ss.opt5UseYn = '';
                        ss.expireYn = '';
                    }

                    // 서비스 기간 체크 및 업데이트 처리 부분.
                    async.waterfall([
                        function (callback) {
                            console.log('>>> 접속 이력 테이블 저장 처리. <<< \n');
                            // 접속 이력 테이블 저장 처리.
                            var conn = mysql.createConnection(config);
                            conn.connect();
                            conn.query('insert into conn_his_tbl(cview, cpage, cid, cin_date, cip)'
                                + ' values("jtlab", "index", ?, now(), ?);',
                                [results1[0][0].id, ipAddress],
                                function (err2, results2) {
                                    if (err2) {
                                        console.log('err2 : ', err2);
                                    } else {
                                        console.dir(results2);
                                        callback(null);
                                    }
                                }
                            );
                            conn.commit();
                            conn.end();
                        },
                        function (callback) {
                            console.log('>>> 결제 테이블 업데이트 처리. <<< \n');
                            var conn = mysql.createConnection(config);
                            conn.connect();
                            // 결제 테이블 업데이트 처리.
                            conn.query('UPDATE pay_info_tbl a, (SELECT @rDays := use_term_days, DATEDIFF(ADDDATE(pay_date, @rDays), now()) as dt_cnt,'
                                + 'order_no, pay_result, expire_yn, usr_id FROM pay_info_tbl WHERE pay_result = "paid"'
                                + ' AND expire_yn = "N" AND usr_id = ?) b SET a.pay_result = "end"'
                                + ', a.expire_yn = "Y", a.update_dt = now(), a.update_usr = ?'
                                + ' WHERE a.pay_result = b.pay_result AND a.expire_yn = b.expire_yn'
                                + ' AND a.usr_id = b.usr_id AND b.dt_cnt <= 0',
                                [ss.usrId, ss.usrId], function (err3, results3) {
                                    if (err3) {
                                        console.log('err3 : ', err3);
                                    } else {
                                        console.dir(results3);
                                        callback(null);
                                    }
                                }
                            );
                            conn.commit();
                            conn.end();
                        }
                    ], function (err, result) {
                        // result에는 '끝'이 담겨 온다.
                        console.log(' async result : ', result);
                    });

                   rRet = 'OK';
                } else {
                   rRet = 'NO';
                }
            } // end else if
            conn.end();
            cb(null, rRet);
        }); // end

};

module.exports = Login;