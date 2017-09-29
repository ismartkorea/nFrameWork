/*
 * 모듈명  : manager.js
 * 설명    : 관리자화면 '담당자 관리' 에 대한 모듈.
 * 작성일  : 2017년 1월 10일
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

    console.log(">>>>> usrLevel : " + ss.usrLevel);
    //if(ss.usrType == null || ss.usrType != "S") {
    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {
        var srchType = req.query.srchType != null ? req.query.srchType : "";
        var srchText = req.query.srchText != null ? req.query.srchText : "";
        console.log(">>> srchType : " + srchType);
        var addSQL1 = "";
        var addSQL2 = "";

        if (srchType == "no") {
            addSQL1 = ' AND c_no = ?';
            addSQL2 = ' AND x.c_no = ?';
        } else if (srchType == "id") {
            addSQL1 = ' AND c_id like concat(?,"%")';
            addSQL2 = ' AND x.c_id like concat(?,"%")';
        } else if (srchType == "nm") {
            addSQL1 = ' AND c_name like concat(?,"%")';
            addSQL2 = ' AND x.c_name like concat(?,"%")';
        }

        var reqPage = req.query.page ? parseInt(req.query.page) : 0;
        //console.log(">>> reqPage = " + reqPage);
        var offset = 3;
        var page = Math.max(1, reqPage);
        //console.log(">>> page = " + page);
        var limit = 10;
        var skip = (page - 1) * limit;

        // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
        conn.query('select count(*) as cnt from c_inf_tbl where c_auth_level = "001"' + addSQL1
            + '; select @rownum:=@rownum+1 as num, x.c_no as no, x.c_id as id, x.c_name as name,'
            + ' (select comm_nm from commcd_inf_tbl where p_comm_cd = "M000" and comm_cd = x.c_auth_level) as level'
            + ' from c_inf_tbl x, (SELECT @rownum:=' + skip + ') TMP WHERE x.c_auth_level = "001"' + addSQL2
            + ' order by x.c_no desc limit ' + skip + ', ' + limit + ";",
            [srchText, srchText],
            function (err, results) {
                if (err) {
                    console.log('error : ', err.message);
                } else {
                    var count = results[0][0].cnt;
                    var maxPage = Math.ceil(count / limit);

                    res.render('./admin/manager/list', {
                        members: results[1],
                        srchType: srchType,
                        srchText: srchText,
                        page: page,
                        maxPage: maxPage,
                        offset: offset,
                        session: ss
                    });
                }
            })
    } else {
        res.redirect('/admin');
    }

    //conn.end();
});

// 게시글 리스트 호출(post).
router.post('/search', function(req, res) {

    var ss = req.session;
    console.log(">>> search type = " + req.body.srchType);
    console.log(">>> search word = " + req.body.srchText);
    var srchType = req.body.srchType != null ? req.body.srchType : "";
    var srchText = req.body.srchText != null ? req.body.srchText : "";
    console.log(">>> srchType : " + srchType);
    var addSQL1 = "";
    var addSQL2 = "";

    if(srchType=="no") {
        addSQL1 = ' AND c_no = ?';
        addSQL2 = ' AND x.c_no = ?';
    } else if(srchType=="id") {
        addSQL1 = ' AND c_id like concat(?,"%")';
        addSQL2 = ' AND x.c_id like concat(?,"%")';
    } else if(srchType=="nm") {
        addSQL1 =  ' AND c_name like concat(?,"%")';
        addSQL2 =  ' AND x.c_name like concat(?,"%")';
    }
    // 페이징 설정.
    var reqPage = req.query.page ? parseInt(req.query.page) : 0;
    console.log(">>> reqPage = " + reqPage);
    var offset = 3;
    var page = Math.max(1,reqPage);
    console.log(">>> page = " + page);
    var limit = 10;
    var skip = (page-1)*limit;

    //conn.connect();

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    conn.query('select count(*) as cnt from c_inf_tbl WHERE c_auth_level = "001"'+ addSQL1
        + '; select @rownum:=@rownum+1 as num, x.c_no as no, x.c_id as id, x.c_name as name,'
        + ' (select comm_nm from commcd_inf_tbl where p_comm_cd = "M000" and comm_cd = x.c_auth_level) as level, x.c_auth_cd as authcd'
        + ' from c_inf_tbl x, (SELECT @rownum:='+skip+') TMP WHERE x.c_auth_level = "001"' + addSQL2
        + ' order by x.c_no desc limit '+ skip + ', ' + limit + ";",
        [srchText, srchText],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                var count = results[0][0].cnt;
                var maxPage = Math.ceil(count/limit);

                res.render('./admin/manager/list', {members : results[1], srchType: srchType, srchText : srchText, page : page, maxPage: maxPage, offset: offset, session : ss});
            }
        });

    //conn.end();
});

// 화면 호출.
router.get('/new', function(req, res) {
    console.log('routes 작성 화면 호출');
    var ss = req.session;
    res.render('./admin/member/new', {session : ss});
});

// 멤버 작성처리.
router.post('/insert', function(req, res) {
    console.log('routes  멤버 작성 처리');

    var ss = req.session;

    conn.query('insert into c_inf_tbl(c_id, c_pwd, c_name, c_addr1, c_addr2, c_postno, c_email, c_sex, c_birth,'
        + ' c_jumin_no, c_tel_no, c_tel_no1, c_tel_no2, c_tel_no3, c_cell_no, c_cell_no1, c_cell_no2, c_cell_no3,'
        + ' c_comp_nm, c_comp_tel_no, c_comp_tel_no1, c_comp_tel_no2, c_comp_tel_no3, c_comp_addr1, c_comp_addr2, c_comp_postno,'
        + ' c_saup_no, c_email_yn, c_inf_use_yn, c_user_tp, c_auth_level, c_auth_cd, insert_dt, insert_usr, update_dt, update_usr)'
        + ' values(?, HEX(AES_ENCRYPT(?,"jtlab")), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,'
        + ' ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,"'+ randomString(16) +'", now(), ?, now(), ?)',
        [req.body.usrId, req.body.usrPwd, req.body.usrName, req.body.usrAddr1, req.body.usrAddr2, req.body.usrPostNo,
         req.body.usrEmail, req.body.usrSex, req.body.usrBirth, req.body.usrJuminNo, req.body.usrTelNo, req.body.usrTelNo1,
         req.body.usrTelNo2, req.body.usrTelNo3, req.body.usrCellNo, req.body.usrCellNo1, req.body.usrCellNo2, req.body.usrCellNo3,
         req.body.usrCompNm, req.body.usrCompTelNo, req.body.usrCompTelNo1, req.body.usrCompTelNo2, req.body.usrCompTelNo3,
         req.body.usrCompAddr1, req.body.usrCompAddr2, req.body.usrCompPostNo, req.body.usrSaupNo, req.body.usrEmailYn,
         req.body.usrInfoYn, req.body.usrType, req.body.usrAuthLvl, ss.usrName, ss.usrName],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log(">>> results : " + results);
                console.log(">>> results.length : " + results.length);
                res.json({'result' : 'OK'});
            }
        }
    );
});

// 멤버수정 화면 호출.
router.get('/view/:no', function(req, res) {

    var ss = req.session;

    console.log("상세 화면 호출처리.");
    //conn.query('select no, id, pwd, name, email, sex, age, address1, address2, postno, hobby, married, carno1, carno2, carno3, carlicen, usertype, saupno, juminno, infoyn, membertype from c_inf_tbl where no = ?',
    conn.query('select c_no as no, c_id as id, AES_DECRYPT(UNHEX(c_pwd),"jtlab") as pwd, c_name as name,'
        + ' c_addr1 as address1, c_addr2 as address2, c_postno as postno, c_email as email, c_sex as sex,'
        + ' c_saup_no as saupno, c_user_tp as usertype, c_auth_level as level, c_birth as birth, c_auth_cd as authcd,'
        + ' c_jumin_no as juminno, c_inf_use_yn as infoyn from c_inf_tbl where c_no = ?',
        [req.params.no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('routes manager View Result !!!');
                res.render('./admin/manager/view', {result : 'OK', members : results[0], session : ss});
            }
        });
});

// 멤버 수정 화면 호출.
router.get('/edit/:no', function(req, res) {
    console.log("상세 화면 호출처리.");

    var ss = req.session;
    
    conn.query('select c_no as no, c_id as id, AES_DECRYPT(UNHEX(c_pwd),"jtlab") as pwd, c_name as name,'
        + ' c_addr1 as address1, c_addr2 as address2, c_postno as postno, c_email as email, c_sex as sex,'
        + ' SUBSTRING(c_birth,1,4) as year,SUBSTRING(c_birth,5,2) as month, SUBSTRING(c_birth,7,2) as day,'
        + ' c_jumin_no as juminno, c_tel_no as telno, c_tel_no1 as telno1, c_tel_no2 as telno2, c_tel_no3 as telno3,'
        + ' c_cell_no as cellno, c_cell_no1 as cellno1, c_cell_no2 as cellno2, c_cell_no3 as cellno3, c_comp_nm as compnm,'
        + ' c_comp_tel_no as comptelno, c_comp_tel_no1 as comptelno1, c_comp_tel_no2 as comptelno2, c_comp_tel_no3 as comptelno3,'
        + ' c_comp_addr1 as compaddr1, c_comp_addr2 as compaddr2, c_comp_postno as comppostno, c_saup_no as saupno,'
        + ' c_email_yn as emailyn, c_inf_use_yn as infoyn, c_user_tp as usertype, c_auth_level as level, c_auth_cd as authcd,'
        + ' insert_dt as w_dt, insert_usr as w_nm, update_dt as u_dt, update_usr as u_nm from c_inf_tbl where c_no = ?',
        [req.params.no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('routes manager Edit Result !!!');
                res.render('./admin/manager/edit', {result : 'OK', members : results[0], session : ss});
            }
        });
});

// 멤버 수정 처리.
router.post('/edit', function(req, res) {

    var ss = req.session;

    console.log("멤버 수정 처리");
    conn.query('UPDATE c_inf_tbl SET c_id = ?, c_pwd = HEX(AES_ENCRYPT(?,"jtlab")), c_name = ?,'
        + ' c_addr1 = ?, c_addr2 = ?, c_postno = ?, c_email = ?, c_sex = ?, c_birth = ?, c_jumin_no = ?, c_tel_no = ?,'
        + ' c_tel_no1 = ?, c_tel_no2 = ?, c_tel_no3 = ?, c_cell_no = ?, c_cell_no1 = ?, c_cell_no2 = ?, c_cell_no3 = ?,'
        + ' c_comp_nm = ?, c_comp_tel_no = ?, c_comp_tel_no1 = ?, c_comp_tel_no2 = ?, c_comp_tel_no3 = ?,'
        + ' c_comp_addr1 = ?, c_comp_addr2 = ?, c_comp_postno = ?, c_saup_no = ?, c_email_yn = ?, c_inf_use_yn = ?,'
        + ' c_user_tp = ?, c_auth_level = ?, update_dt = now(), update_usr = ? WHERE c_no = ?',
        [req.body.usrId, req.body.usrPwd, req.body.usrName, req.body.usrAddr1, req.body.usrAddr2, req.body.usrPostNo,
            req.body.usrEmail, req.body.usrSex, req.body.usrBirth, req.body.usrJuminNo, req.body.usrTelNo, req.body.usrTelNo1,
            req.body.usrTelNo2, req.body.usrTelNo3, req.body.usrCellNo, req.body.usrCellNo1, req.body.usrCellNo2, req.body.usrCellNo3,
            req.body.usrCompNm, req.body.usrCompTelNo, req.body.usrCompTelNo1, req.body.usrCompTelNo2, req.body.usrCompTelNo3,
            req.body.usrCompAddr1, req.body.usrCompAddr2, req.body.usrCompPostNo, req.body.usrSaupNo, req.body.usrEmailYn,
            req.body.usrInfoYn, req.body.usrType, req.body.usrAuthLvl, ss.usrName, req.body.usrNo],
        function(err, result) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('result : ' + result.message);
                res.json({result:'OK', session : ss});
            }
        }
    );
    conn.commit();
});

// 멤버 삭제.(get)
router.get('/delete/:no', function(req, res) {

    var ss = req.session;

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log("멤버 삭제 처리");
    conn.query('delete from c_inf_tbl where c_no = ?',
        [req.params.no],
        function(err) {
            if(err) {
                console.log('error : ', err.message);
            }
        });
    console.log("멤버 화면 호출처리.");
    conn.query('select @rownum:=@rownum+1 as num, x.c_no as no, x.c_id as id, x.c_name as name,'
        + '  (select comm_nm from commcd_inf_tbl where p_comm_cd = "M000" and comm_cd = x.c_auth_level) as level'
        + '  from c_inf_tbl x, (SELECT @rownum:=0) TMP',
        [],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                console.log('routes manager list Result !!!');
                res.render('./admin/manager/list', {board : results, session : ss});
            }
        });
});


// 멤버 삭제.(post)
router.post('/delete', function(req, res) {

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log("멤버 삭제 처리");
    var params = req.body['dataList'];

    for (var i = 0; i < params.length; i++) {
        //console.log(">>> get params[" + i + "] =" + params[i]);
        conn.query('delete from c_inf_tbl where c_no = ?',
            [params[i]],
            function (err) {
                if (err) {
                    console.log('error : ', err.message);
                }
            });
    }

    res.json({'result' : 'OK'});
});

// 멤버 작성처리.
router.post('/fast/insert', function(req, res) {
    console.log('routes  멤버 작성 처리');

    var ss = req.session;

    conn.query('insert into c_inf_tbl(c_id, c_pwd, c_name, c_email, c_user_tp, c_auth_level, c_auth_cd, insert_dt, insert_usr,'
        + ' update_dt, update_usr) values(?, HEX(AES_ENCRYPT(?,"jtlab")), ?, ?, "F", "001","'+ randomString(16) +'", now(), ?, now(), ?)',
        [req.body.fUsrId, req.body.fUsrPwd, req.body.fUsrName, req.body.fUsrEmail, ss.usrName, ss.usrName],
        function(err) {
            if(err) {
                console.log('error : ', JSON.stringify(err));
            } else {
                res.redirect('/admin/manager');
            }
        }
    );
});

/*
 * RANDOM STRING GENERATOR
 *
 * Info:      http://stackoverflow.com/a/27872144/383904
 * Use:       randomString(length [,"A"] [,"N"] );
 * Default:   return a random alpha-numeric string
 * Arguments: If you use the optional "A", "N" flags:
 *            "A" (Alpha flag)   return random a-Z string
 *            "N" (Numeric flag) return random 0-9 string
 */
function randomString(len, an){
    an = an&&an.toLowerCase();
    var str="", i=0, min=an=="a"?10:0, max=an=="n"?10:62;
    for(;i++<len;){
        var r = Math.random()*(max-min)+min <<0;
        str += String.fromCharCode(r+=r>9?r<36?55:61:48);
    }
    return str;
}

module.exports = router;