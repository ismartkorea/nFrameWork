/*
 * 모듈명  : product.js
 * 설명    : 관리자화면 '상품 관리' 에 대한 모듈.
 * 작성일  : 2016년 11월 1일
 * author  : HiBizNet
 * copyright : JT-LAB
 * version : 1.0
 */
var express = require('express');
var mysql = require('mysql');
var session = require('express-session');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var flash = require('connect-flash');
var util = require('util');
var fs = require('fs');
var os = require('os');
var multer = require('multer');
var utils = require('../common/utils');
var router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:true}));
router.use(methodOverride("_method"));
router.use(flash());
router.use(session({
    secret: 'test!@$#!',
    resave: false,
    saveUninitialized: false
}));
// MYSQL setting
var conn = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    database : 'jtlab',
    user: 'jtlab',
    password: 'jtlab9123',
    insecureAuth: true,
    multipleStatements: true
});

var i=0; // 첨부파일명 구분용 숫자.
var maxFileCount = 4;  // 첨부파일 허용 갯수.
var maxFileSize = 1 * 1000 * 1000; // 첨부 가능한 최대 파일 사이즈 설정.
//var filePath = 'C:/devs/workspace/public/images/product';
//var filePath = '/usr/local/devs/jtlab/ikapa/rev.0/public/images/product';
var setPath = '';
// os별 path setting
if(os.platform()=='win32') {
    setPath = './public/images/product';
} else {
    setPath = '/usr/local/devs/jtlab/ikapa/rev.1/public/images/product';
}

var storage = multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, setPath);
            //callback(null, './public/images/product');
        },
        filename: function (req, file, callback) {
            i++;
            callback(null, file.originalname);
            if (maxFileCount == i) {
                i = 0;
            }
        }
});
// 유틸 초기화.
var Utils = new utils();

// 게시글 리스트 호출.
router.get('/', function(req, res) {

    var ss = req.session;

    if(ss.usrLevel == '000' || ss.usrLevel == '001' || ss.usrLevel == '002') {

        var srchType = req.query.srchType != null ? req.query.srchType : "";
        var srchText = req.query.srchText != null ? req.query.srchText : "";
console.log(">>> srchType : " + srchType);
        var addSQL = "";
        if (srchType == "no") {
            addSQL = ' where x.p_code = ?';
        } else if (srchType == "nm") {
            addSQL = ' where x.p_nm like concat(?,"%")';
        }
        // 페이징 처리.
        var reqPage = req.query.page ? parseInt(req.query.page) : 0;
        //console.log(">>> reqPage = " + reqPage);
        var offset = 3;
        var page = Math.max(1, reqPage);
        //console.log(">>> page = " + page);
        var limit = 10;
        var skip = (page - 1) * limit;

        // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
        conn.query('SELECT count(*) as cnt FROM product_lab_info_tbl x' + addSQL
            + '; SELECT @rownum:=@rownum+1 as num, x.p_no as pNo, x.p_code as pCode, x.p_nm as pNm,'
            + ' (select comm_nm from commcd_inf_tbl where p_comm_cd = "P000" and comm_cd = x.p_type) as pType,'
            + ' concat(FORMAT(x.p_price,0), " (원)") as pPrice,'
            + ' case when x.p_display_yn = "y" then "예" when x.p_display_yn = "n" then "아니오" else "" end as displayYn,'
            + ' (select b.comm_nm from commcd_inf_tbl b where b.p_comm_cd = "SD00" and b.comm_cd = x.p_gubun_cd) as srcGubun,'
            + ' x.sort_no as sortNo, DATE_FORMAT(x.insert_dt, "%Y-%m-%d") as wDt,'
            + ' insert_usr as wNm, DATE_FORMAT(x.update_dt, "%Y-%m-%d") as uDt,'
            + ' update_usr as uNm FROM product_lab_info_tbl x, (SELECT @rownum:=' + skip + ') TMP' + addSQL
            + ' order by x.p_no desc limit ' + skip + ', ' + limit + ";",
            [srchText, srchText],
            function (err, results) {
                if (err) {
                    console.log('error : ', err.message);
                } else {
                    var count = results[0][0].cnt;
                    var maxPage = Math.ceil(count / limit);

                    res.render('./admin/product/list', {
                        product: results[1],
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

// 게시글 리스트 호출(post).
router.post('/search', function(req, res) {

    var ss = req.session;

    var srchType = req.body.srchType != null ? req.body.srchType : "";
    var srchText = req.body.srchText != null ? req.body.srchText : "";
console.log(">>> srchType : " + srchType);
console.log(">>> srchText : " + srchText);
    var addSQL = "";
    if(srchType=="no") {
        addSQL =  ' where x.p_code = ?';
    } else if(srchType=="nm") {
        addSQL =  ' where x.p_nm like concat("%", ?,"%")';
    }
    // 페이징 처리.
    var reqPage = req.query.page ? parseInt(req.query.page) : 0;
    //console.log(">>> reqPage = " + reqPage);
    var offset = 3;
    var page = Math.max(1,reqPage);
    //console.log(">>> page = " + page);
    var limit = 10;
    var skip = (page-1)*limit;

    //conn.connect();

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    conn.query('SELECT count(*) as cnt from product_lab_info_tbl x' + addSQL
        + '; SELECT @rownum:=@rownum+1 as num, x.p_no as pNo, x.p_code as pCode, x.p_nm as pNm,'
        + ' (select comm_nm from commcd_inf_tbl where p_comm_cd = "P000" and comm_cd = x.p_type) as pType,'
        + ' concat(FORMAT(x.p_price,0), " (원)") as pPrice,'
        + ' case when x.p_display_yn = "y" then "예" when x.p_display_yn = "n" then "아니오" else "" end as displayYn,'
        + ' (select b.comm_nm from commcd_inf_tbl b where b.p_comm_cd = "SD00" and b.comm_cd = x.p_gubun_cd) as srcGubun,'
        + ' x.sort_no as sortNo, DATE_FORMAT(x.insert_dt, "%Y-%m-%d") as wDt,'
        + ' insert_usr as wNm, DATE_FORMAT(x.update_dt, "%Y-%m-%d") as uDt,'
        + ' update_usr as uNm FROM product_lab_info_tbl x, (SELECT @rownum:='+skip+') TMP' + addSQL
        + ' ORDER BY x.p_no DESC limit '+ skip + ', ' + limit + ";",
        [srchText, srchText],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
            } else {
                var count = results[0][0].cnt;
                var maxPage = Math.ceil(count/limit);

                res.render('./admin/product/list', {product : results[1], srchType: srchType, srchText : srchText, page : page, maxPage: maxPage, offset: offset, session : ss});
            }
        });

    //conn.end();
});

// 상품 입력 화면 호출.
router.get('/new', function(req, res) {
    console.log('routes 게시글 작성 화면 호출');
    var ss = req.session;

    conn.query('SELECT comm_cd as commCd, comm_nm as commNm FROM commcd_inf_tbl WHERE p_comm_cd = "SD00";'
        + ' SELECT @rownum:=@rownum+1 as num, s.cateNo as cateNo, s.cateName as cateName FROM (SELECT t1.category_no as cateNo,'
        + ' t1.name as cateName FROM product_category_inf_tbl AS t1'
        + ' WHERE t1.parent_no is null GROUP BY t1.name ORDER BY t1.name ASC) s, (SELECT @rownum:=0) TMP;',
        [],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.render('./admin/product/new', {'cList' : results[0], 'cList2' : results[1], 'session' : ss});
            }
    });
});

// 상품 입력 처리.
router.post('/insert', function(req, res) {
    console.log('routes 상품 추가 처리');
    var ss = req.session;

    var pNm = req.body.pNm !=null ? req.body.pNm : '';
    var pCode = req.body.pCode !=null ? req.body.pCode : '';
    var pUniqCode = req.body.pUniqCode !=null ? req.body.pUniqCode : '';
    var pDiv = req.body.pDiv !=null ? req.body.pDiv : '';
    var pPrice = req.body.pPrice !=null ? req.body.pPrice : '';
    var pSmmry = req.body.pSmmry !=null ? req.body.pSmmry : '';
    var pDesc = req.body.pDesc !=null ? req.body.pDesc : '';
    var pDisplayYn = req.body.pDisplayYn !=null ? req.body.pDisplayYn : '';
    var pImage = req.body.attImg !=null ? req.body.attImg : '';
    var pImageUrl = req.body.attImgUrl !=null ? req.body.attImgUrl : '';
    var sortNo = req.body.sortNo !=null ? req.body.sortNo : '';
    var optBtnDispYn = req.body.optBtnDispYn !=null ? req.body.optBtnDispYn : 'Y';
    var pGubun = req.body.pGubun !=null ? req.body.pGubun : '';
    var pGubunCd = req.body.pGubunCd !=null ? req.body.pGubunCd : '';
    var pType = req.body.pType !=null ? req.body.pType : '';
    var category1 = req.body.pCategory1 !=null ? req.body.pCategory1 : '';
    var category2 = req.body.pCategory2 !=null ? req.body.pCategory2 : '';
    var category3 = req.body.pCategory3 !=null ? req.body.pCategory3 : '';
    var displayOrderNo = req.body.pDispOrderNo !=null ? req.body.pDispOrderNo : '';
    var pStockCnt = req.body.pStockCnt !=null ? req.body.pStockCnt : 0;

    conn.query('insert into product_lab_info_tbl(p_nm, p_code, p_div, p_opt_btn_dis_yn, p_type, p_gubun, p_gubun_cd, p_price,'
        + ' p_smmry, p_desc, p_display_yn, p_image, p_image_url, p_uniq_code, category1, category2, category3, p_stock_count,'
        + ' sort_no, display_order_no, insert_dt, insert_usr, update_dt, update_usr)'
        + ' values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), ?, now(), ?)',
        [pNm, pCode, pDiv, optBtnDispYn, pType, pGubun, pGubunCd, pPrice, pSmmry, pDesc, pDisplayYn, pImage,
            pImageUrl, pUniqCode, category1, category2, category3, pStockCnt, sortNo, displayOrderNo, ss.usrId, ss.usrId],
        function(err) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.json({'result' : 'OK'});
            }
        });
    conn.commit();
});

// 수정 화면 호출.
router.get('/edit/:no', function(req, res) {

    var ss = req.session;
    var no = req.params.no !=null ? req.params.no : '';

    console.log("수정 화면 호출처리.");
    conn.query('SELECT p_no as pNo, p_code as pCode, p_div as pDiv, p_opt_btn_dis_yn as pOptBtnDisYn, p_nm as pNm,'
        + ' p_price as pPrice, p_smmry as pSmmry, p_desc as pDesc, p_gubun as pGubun, p_gubun_cd as pGubunCd, p_type as pType, p_display_yn as pDisplayYn,'
        + ' p_image as pImage, p_image_url as pImageUrl, p_uniq_code as pUniqCode, p_pair_code_yn as pPairCodeYn, p_pair_code as pPairCode, sort_no as sortNo,'
        + ' display_order_no as pDispOrderNo, category1 as pCate1, category2 as pCate2, category3 as pCate3, p_stock_count as pStockCount,'
        + ' DATE_FORMAT(insert_dt, "%Y-%m-%d") as w_dt, insert_usr as w_nm, DATE_FORMAT(update_dt, "%Y-%m-%d") as u_dt,'
        + ' update_usr as u_nm FROM product_lab_info_tbl WHERE p_no = ?;'
        + ' select comm_cd as commCd, comm_nm as commNm from commcd_inf_tbl where p_comm_cd = "SD00";'
        + ' SELECT @rownum:=@rownum+1 as num, s.cateNo as cateNo, s.cateName as cateName FROM (SELECT t1.category_no as cateNo,'
        + ' t1.name as cateName FROM product_category_inf_tbl AS t1'
        + ' WHERE t1.parent_no is null GROUP BY t1.name ORDER BY t1.name ASC) s, (SELECT @rownum:=0) TMP;',
        [no],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.log('routes product Edit View !!!');
                res.render('./admin/product/edit', {'result' : results[0][0], 'cList' : results[1], 'cList2' : results[2], 'session' : ss});
            }
        });
});

// 게시글 상세 화면 호출.
router.get('/view/:no', function(req, res) {
    console.log("상세 화면 호출처리.");

    var ss = req.session;

    // 리스트 조회 처리.
    conn.query('SELECT p_no as pNo, p_code as pCode, p_div as pDiv, p_nm as pNm, p_price as pPrice, p_smmry as pSmmry, p_desc as pDesc,'
        + ' p_display_yn as pDisplayYn, p_image as pImage, p_uniq_code as pUniqCode, sort_no as sortNo,'
        + ' DATE_FORMAT(insert_dt, "%Y-%m-%d") as w_dt, insert_usr as w_nm, DATE_FORMAT(update_dt, "%Y-%m-%d") as u_dt,'
        + ' update_usr as u_nm FROM product_lab_info_tbl WHERE p_no = ?;'
        + ' select comm_cd as commCd, comm_nm as commNm from commcd_inf_tbl where p_comm_cd = "SD00";',
        [req.params.pNo],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                console.log('routes product view Result !!!');
                res.render('./admin/product/view', {result : results[0], cList : results[1], session : ss});
            }
        });
});

// 게시글 수정 처리.
router.post('/edit/do', function(req, res) {
    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.

    var ss = req.session;
    var pNo = req.body.pNo !=null ? req.body.pNo : '';
    var pNm = req.body.pNm !=null ? req.body.pNm : '';
    var pCode = req.body.pCode !=null ? req.body.pCode : '';
    var pDiv = req.body.pDiv !=null ? req.body.pDiv : '';
    var pPrice = req.body.pPrice !=null ? req.body.pPrice : '';
    var pDesc = req.body.pDesc !=null ? req.body.pDesc : '';
    var pSmmry = req.body.pSmmry !=null ? req.body.pSmmry : '';
    var pDisplayYn = req.body.pDisplayYn !=null ? req.body.pDisplayYn : '';
    var pImage = req.body.pImage !='null' ? req.body.pImage : '';
    var pImageUrl = req.body.pImageUrl !='null' ? req.body.pImageUrl : '';
    var pUniqCode = req.body.pUniqCode !=null ? req.body.pUniqCode : '';
    var optBtnDispYn = req.body.optBtnDispYn !=null ? req.body.optBtnDispYn : 'Y';
    var pType = req.body.pType !=null ? req.body.pType : '';
    var pGubun = req.body.pGubun !=null ? req.body.pGubun : '';
    var pGubunCd = req.body.pGubunCd !=null ? req.body.pGubunCd : '';
    var pPaireCodeYn = req.body.pPaireCodeYn !=null ? req.body.pPaireCodeYn : 'N';
    var pPaireCode = req.body.pPaireCode !=null ? req.body.pPaireCode : '';
    var sortNo = req.body.sortNo !=null ? req.body.sortNo : '';
    var displayOrderNo = req.body.pDispOrderNo !=null ? req.body.pDispOrderNo : '';
    var category1 = req.body.pCategory1 !=null ? req.body.pCategory1 : '';
    var category2 = req.body.pCategory2 !=null ? req.body.pCategory2 : '';
    var category3 = req.body.pCategory3 !=null ? req.body.pCategory3 : '';
    var pStockCnt = req.body.pStockCnt !=null ? req.body.pStockCnt : 0;
/*
console.log('pNo : ', pNo + '\n');
console.log('pNm : ', pNm);
console.log('pCode : ', pCode);
console.log('pDiv : ', pDiv);
console.log('pPrice : ', pPrice);
console.log('pDesc : ', pDesc);
console.log('pDisplayYn : ', pDisplayYn);
console.log('pImage : ', pImage);
console.log('pUniqCode : ', pUniqCode);
console.log('optBtnDispYn : ', optBtnDispYn);
console.log('pType : ', pType);
console.log('pGubun : ', pGubun);
console.log('pGubunCd : ', pGubunCd);
console.log('pPaireCodeYn : ', pPaireCodeYn);
console.log('pPaireCode : ', pPaireCode);
console.log('sortNo : ', sortNo + '\n');
*/
    console.log("상품 관리 수정 처리");
    conn.query('UPDATE product_lab_info_tbl SET p_code = ?, p_pair_code_yn = ?, p_pair_code = ?, p_div = ?,'
        + ' p_opt_btn_dis_yn = ?, p_type = ?, p_gubun = ?, p_gubun_cd = ?, p_nm = ?, p_price = ?, p_smmry = ?, p_desc = ?, p_display_yn = ?, p_image = ?,'
        + ' p_image_url = ?, p_uniq_code = ?, sort_no = ?, display_order_no = ?, category1 = ?, category2 = ?, category3 = ?, p_stock_count = ?,'
        + ' insert_dt = now(), insert_usr = ?, update_dt = now(), update_usr = ? WHERE p_no = ?',
        [pCode, pPaireCodeYn, pPaireCode, pDiv, optBtnDispYn, pType, pGubun, pGubunCd, pNm, pPrice, pSmmry, pDesc,
            pDisplayYn, pImage, pImageUrl, pUniqCode, sortNo, displayOrderNo, category1, category2, category3, pStockCnt, ss.usrId, ss.usrId, pNo],
        function(err) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.json({'result' : 'OK'});
            }
        });
    conn.commit();
});

// 게시글 삭제.(get)
router.get('/delete/:no', function(req, res) {

    var ss = req.session;

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log("게시글 삭제 처리");
    conn.query('delete from product_lab_info_tbl where p_no = ?',
        [req.params.pNo],
        function(err) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.redirect('/admin/product');
            }
        });
    conn.commit();
});


// 게시글 삭제.(post)
router.post('/delete', function(req, res) {

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log("게시글 삭제 처리");

    var ss = req.session;
    var params = req.body['dataList'];

    for (var i = 0; i < params.length; i++) {
        console.log(">>> get params[" + i + "] =" + params[i]);
        conn.query('delete from product_lab_info_tbl where p_no = ?',
            [params[i]],
            function (err) {
                if (err) {
                    console.log('error : ', err.message);
                    res.render('error', {message: err.message, error : err, session: ss});
                }
            });
        conn.commit();
    }

    res.json({'result' : 'OK'});
});

// 상품 배너 관리
router.get('/banner', function(req, res, next) {
    console.log('배너 관리 화면 호출');
    var ss =req.session;
    var SQL = '';
    SQL = 'SELECT banner_img_url as imgUrl, banner_img_width as imgWidth, banner_img_height as imgHeight,'
        + ' banner_btn1_link_url as btn1LinkUrl, banner_btn1_link_nm as btn1LinkNm, banner_btn2_link_url as btn2LinkUrl,'
        + ' banner_btn2_link_nm as btn2LinkNm, banner_btn3_link_url as btn3LinkUrl, banner_btn3_link_nm as btn3LinkNm,'
        + ' banner_btn4_link_url as btn4LinkUrl, banner_btn4_link_nm as btn4LinkNm, banner_btn5_link_url as btn5LinkUrl,'
        + ' banner_btn5_link_nm as btn5LinkNm, banner_img_file_url as imgFileUrl, banner_img_file_nm as imgFileNm'
        + ' FROM product_banner_inf_tbl';

    conn.query(SQL, [], function(err, results) {
        if(err) {
            console.log('err : ', err);
        } else {
            console.log('call banner ');
            console.log('results : ', JSON.stringify(results) + '\n');
            res.status(200).render('./admin/product/banner/view', {'result' : results[0], 'session' : ss});
        }
    })

});

// 상품 배너 관리 수정화면 호출.
router.get('/banner/edit', function(req, res, next) {
    console.log('배너 관리 수정 화면 호출');
    var ss =req.session;
    var SQL = '';
    SQL = 'SELECT banner_img_url as imgUrl, banner_img_width as imgWidth, banner_img_height as imgHeight,'
        + ' banner_btn1_link_url as btn1LinkUrl, banner_btn1_link_nm as btn1LinkNm, banner_btn2_link_url as btn2LinkUrl,'
        + ' banner_btn2_link_nm as btn2LinkNm, banner_btn3_link_url as btn3LinkUrl, banner_btn3_link_nm as btn3LinkNm,'
        + ' banner_btn4_link_url as btn4LinkUrl, banner_btn4_link_nm as btn4LinkNm, banner_btn5_link_url as btn5LinkUrl,'
        + ' banner_btn5_link_nm as btn5LinkNm, banner_img_file_url as imgFileUrl, banner_img_file_nm as imgFileNm'
        + ' FROM product_banner_inf_tbl';

    conn.query(SQL, [], function(err, results) {
        if(err) {
            console.log('err : ', err);
        } else {
            console.log('call banner ');
            console.log('results : ', JSON.stringify(results) + '\n');
            res.status(200).render('./admin/product/banner/edit', {'result' : results[0], 'session' : ss});
        }
    })

});

// 상품 배너 관리 수정화면 호출.
router.post('/banner/edit/save', function(req, res, next) {
    console.log('배너 관리 수정 화면 호출');
    var ss =req.session;
    var imgUrl = req.body.imgUrl !=null ? req.body.imgUrl : '';
    var imgWidth = req.body.imgWidth !=null ? req.body.imgWidth : 0;
    var imgHeight = req.body.imgHeight !=null ? req.body.imgHeight : 0;
    var btn1LinkUrl = req.body.btn1LinkUrl !=null ? req.body.btn1LinkUrl : '';
    var btn1LinkNm = req.body.btn1LinkNm !=null ? req.body.btn1LinkNm : '';
    var btn2LinkUrl = req.body.btn2LinkUrl !=null ? req.body.btn2LinkUrl : '';
    var btn2LinkNm = req.body.btn2LinkNm !=null ? req.body.btn2LinkNm : '';
    var btn3LinkUrl = req.body.btn3LinkUrl !=null ? req.body.btn3LinkUrl : '';
    var btn3LinkNm = req.body.btn3LinkNm !=null ? req.body.btn3LinkNm : '';
    var btn4LinkUrl = req.body.btn4LinkUrl !=null ? req.body.btn4LinkUrl : '';
    var btn4LinkNm = req.body.btn4LinkNm !=null ? req.body.btn4LinkNm : '';
    var btn5LinkUrl = req.body.btn5LinkUrl !=null ? req.body.btn5LinkUrl : '';
    var btn5LinkNm = req.body.btn5LinkNm !=null ? req.body.btn5LinkNm : '';
    var imgFileUrl = req.body.imgFileUrl !=null ? req.body.imgFileUrl : '';
    var imgFileNm = req.body.imgFileNm !=null ? req.body.imgFileNm : '';

    var SQL = '';
    SQL = 'UPDATE product_banner_inf_tbl SET banner_img_url = ?, banner_img_width = ?, banner_img_height = ?,'
        + ' banner_btn1_link_url = ?, banner_btn1_link_nm = ?, banner_btn2_link_url = ?,'
        + ' banner_btn2_link_nm = ?, banner_btn3_link_url = ?, banner_btn3_link_nm = ?,'
        + ' banner_btn4_link_url = ?, banner_btn4_link_nm = ?, banner_btn5_link_url = ?,'
        + ' banner_btn5_link_nm = ?, banner_img_file_url = ?, banner_img_file_nm = ?';

    conn.query(SQL,
        [imgUrl, imgWidth, imgHeight, btn1LinkUrl, btn1LinkNm, btn2LinkUrl, btn2LinkNm, btn3LinkUrl, btn3LinkNm,
        btn4LinkUrl, btn4LinkNm, btn5LinkUrl, btn5LinkNm, imgFileUrl, imgFileNm],
        function(err, results) {
        if(err) {
            console.log('err : ', err);
        } else {
            console.dir(results);
            res.status(200).json({'result' : 'OK', 'session' : ss});
        }
    })

});

/**
 * 전시상품번호 사용여부 체크.
 */
router.post('/getDisplayNoYn', function(req, res) {
    var ss = req.session;
    var displayOrderNo = req.body.pDispOrderNo !=null ? req.body.pDispOrderNo : '';
    var SQL = 'SELECT p_code as pCode, p_nm as pNm FROM product_lab_info_tbl WHERE p_div = "M" AND  p_display_yn = "Y"'
        + ' AND display_order_no = ?';

    conn.query(SQL,
        [displayOrderNo],
        function(err, results) {
            if(err) {
                console.log('err : ', err);
            } else {
                var cnt = results.length;

                res.status(200).json({'count' : cnt, 'list' : results, 'session' : ss});
            }
        }
    );

});

/**
 * 고유번호 사용여부 체크.
 */
router.post('/getUniqCdUseYn', function(req, res) {
    var ss = req.session;
    var pUniqCd = req.body.pUniqCd !=null ? req.body.pUniqCd : '';
    var SQL = 'SELECT p_code as pCode, p_nm as pNm, p_uniq_code as pUniqCode FROM product_lab_info_tbl WHERE p_div = "M"'
        + ' AND p_uniq_code = ?';

    conn.query(SQL,
        [pUniqCd],
        function(err, results) {
            if(err) {
                console.log('err : ', err);
            } else {
                var cnt = results.length;

                res.status(200).json({'count' : cnt, 'list' : results, 'session' : ss});
            }
        }
    );

});

/**
 * 상품코드 자동생성.
 */
router.post('/getAutoProductNo', function(req, res) {
    var ss = req.session;
    var productNo = '';
    // 상품코드 번호(13자리) 자동 생성처리.
    // 'APP' + '년월일' + 난수(3자리)
    var randNo = Utils.randomString(3, 'A');
    var date = Utils.getNowDate2();
    var productNo = 'APP' + date + randNo;
console.log('productNo : ', productNo);

    res.status(200).json({'no' : productNo, 'session' : ss});
});


// 카테고리(대) 관리 화면 호출
router.get('/category', function(req, res) {
    var ss = req.session;

    conn.query('SELECT @rownum:=@rownum+1 as num, s.cateNo, s.cateName from (SELECT t1.category_no as cateNo,'
        + ' t1.name as cateName FROM product_category_inf_tbl AS t1'
        + ' WHERE t1.parent_no is null group by t1.name order by t1.name asc) s, (SELECT @rownum:=0) TMP',
        [],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.render('./admin/product/category/list', {rList : results, session : ss});
            }
        }
    );

});

// 카테고리(대) 관리 저장 처리.
router.post('/category/insert', function(req, res) {
    var ss = req.session;

    conn.query('INSERT INTO product_category_inf_tbl(`name`) values( ? );',
        [req.body.cateName],
        function(err) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.redirect('/admin/product/category');
            }
        });
});

// 카테고리(대) 관리 삭제 처리.
router.post('/category/delete', function(req, res) {

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log("삭제 처리");

    var ss = req.session;

    var params = req.body['dataList'];

    for (var i = 0; i < params.length; i++) {
        //console.log(">>>> params[" + i + "] = " + params[i]);
        conn.query('delete from product_category_inf_tbl where category_no = ?;'
            + ' delete from product_category_inf_tbl where parent_no = ?;',
            [params[i], params[i]],
            function (err) {
                if (err) {
                    console.log('error : ', err.message);
                    res.render('error', {message: err.message, error : err, session: ss});
                }
            });
    }

    res.json({'result' : 'OK'});
});

// 카테고리(중) 관리 화면 호출
router.get('/category2', function(req, res) {
    var ss = req.session;

    conn.query('SELECT @rownum:=@rownum+1 as num, s.cateName1, s.cateName2, s.cateNo FROM ('
        + 'SELECT t1.name as cateName1, t2.name as cateName2, t2.category_no as cateNo FROM product_category_inf_tbl AS t1'
        + ' LEFT JOIN product_category_inf_tbl as t2 ON t1.category_no = t2.parent_no WHERE t1.parent_no is null'
        + ' group by t1.name, t2.name order by t1.name, t1.order_no, t2.order_no asc) s, (SELECT @rownum:=0) TMP;'
        + 'SELECT t3.category_no as cateNo3, t3.name as cateName3 FROM product_category_inf_tbl t3 WHERE t3.parent_no is null'
        + ' group by t3.name order by t3.name asc;',
        [],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.render('./admin/product/category/listM', {rList : results[0], rList2 : results[1], session : ss});
            }
        }
    );

});

// 카테고리(중) 관리 저장 처리.
router.post('/category2/insert', function(req, res) {
    var ss = req.session;
    var cateName = req.body.cateName !=null ? req.body.cateName : '';
    var cateSelBox = req.body.cateSelBox !=null ? req.body.cateSelBox : '';

console.log('cateName : ', cateName);
console.log('cateSelBox : ', cateSelBox);

    conn.query('INSERT INTO product_category_inf_tbl(`name`, `parent_no`) values(?, ?);',
        [cateName, cateSelBox],
        function(err) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.redirect('/admin/product/category2');
            }
        });
});

// 카테고리(중) 관리 삭제 처리.
router.post('/category2/delete', function(req, res) {

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log("삭제 처리");

    var ss = req.session;
    var params = req.body['dataList'];

    for (var i = 0; i < params.length; i++) {
        console.log(">>>> params[" + i + "] = " + params[i]);
        conn.query('delete from product_category_inf_tbl where category_no = ?;',
            [params[i]],
            function (err) {
                if (err) {
                    console.log('error : ', err.message);
                    res.render('error', {message: err.message, error : err, session: ss});
                }
            });
    }

    res.json({'result' : 'OK'});
});

// 카테고리(소) 관리 화면 호출
router.get('/category3', function(req, res) {
    var ss = req.session;

    var srchCategory1 = req.body.category1 != null ? req.body.category1 : "";
    var srchCategory2 = req.body.category2 != null ? req.body.category2 : "";

    conn.query('SELECT @rownum:=@rownum+1 as num, s.cateName1, s.cateName2, s.cateName3, s.cateNo FROM ('
        + 'SELECT t1.name AS cateName1, t2.name as cateName2, t3.name as cateName3, t3.category_no as cateNo'
        + ' FROM product_category_inf_tbl AS t1 LEFT JOIN product_category_inf_tbl AS t2 ON t2.parent_no = t1.category_no'
        + ' LEFT JOIN product_category_inf_tbl AS t3 ON t3.parent_no = t2.category_no WHERE t1.parent_no is null'
        + ' group by t1.name, t2.name, t3.name order by t1.name, t2.order_no, t3.order_no) s, (SELECT @rownum:=0) TMP;'
        + ' SELECT t2.name as cateName3, t2.category_no as cateNo3 FROM product_category_inf_tbl AS t1'
        + ' LEFT JOIN product_category_inf_tbl as t2 ON t1.category_no = t2.parent_no WHERE t2.category_no IS NOT NULL;'
        + ' SELECT t1.category_no as cateNo, t1.name as cateName FROM product_category_inf_tbl AS t1'
        + ' WHERE t1.parent_no is null group by t1.name order by t1.name asc;',
        [],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.render('./admin/product/category/listS', {rList : results[0], rList2 : results[1], cList : results[2], srchCategory1 : srchCategory1 , srchCategory2 : srchCategory2, session : ss});
            }
        }
    );

});

// 카테고리(소) 관리 저장 처리.
router.post('/category3/insert', function(req, res) {
    var ss = req.session;

    conn.query('INSERT INTO product_category_inf_tbl(`name`, `parent_no`) values(?, ?);',
        [req.body.cateName, req.body.category2],
        function(err) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.redirect('/admin/product/category3');
            }
        });
});

// 카테고리(소) 관리 삭제 처리.
router.post('/category3/delete', function(req, res) {

    // 전체 데이타를 조회한 후 결과를 'results' 매개변수에 저장.
    console.log("삭제 처리");

    var ss = req.session;

    var params = req.body['dataList'];

    for (var i = 0; i < params.length; i++) {
        console.log(">>>> params[" + i + "] = " + params[i]);
        conn.query('delete from product_category_inf_tbl where category_no = ?;',
            [params[i]],
            function (err) {
                if (err) {
                    console.log('error : ', err.message);
                    res.render('error', {message: err.message, error : err, session: ss});
                }
            });
    }

    res.json({'result' : 'OK'});
});

// 카테고리2(중분류) 리스트 조회
router.post('/getcate2', function(req, res) {
    var ss = req.session;
    var getDataVal = req.body.setDataVal !=null ? req.body.setDataVal : '';

console.log(">>>> getcate2 getDataVal : " + getDataVal);

    conn.query('SELECT t2.name as cateName2, t2.category_no as cateNo2 FROM product_category_inf_tbl AS t1'
        + ' LEFT JOIN product_category_inf_tbl AS t2 ON t2.parent_no = t1.category_no WHERE t1.category_no = ?;',
        [getDataVal],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.json({'count' : results.length, 'list' : results, 'session' : ss});
            }
        }
    );
});

// 카테고리3(소분류) 리스트 조회
router.post('/getcate3', function(req, res) {
    var ss = req.session;
    var getDataVal = req.body.setDataVal !=null ? req.body.setDataVal : '';

    console.log(">>>> getcate3 getDataVal : " + getDataVal);

    conn.query('SELECT t3.name as cateName3, t3.category_no as cateNo3 FROM product_category_inf_tbl AS t2'
        + ' LEFT JOIN product_category_inf_tbl AS t3 ON t3.parent_no = t2.category_no WHERE t2.category_no = ?;',
        [getDataVal],
        function(err, results) {
            if(err) {
                console.log('error : ', err.message);
                res.render('error', {message: err.message, error : err, session: ss});
            } else {
                res.json({'count' : results.length, 'list' : results, session : ss});
            }
        }
    );
});


// 파일업로드 처리.
var upload = multer({storage : storage, limits: {fileSize: maxFileSize}}).array('imgFile', maxFileCount);
router.post('/upload', function(req, res) {
    upload(req, res, function(err) {
       console.log("req.body : ", req.body);
        //var fileList = {};
        var file1 = "";
        var file2 = "";
        var file3 = "";
        var primaryImage = "";
        var files = req.files;
        var fileCount = files.length;
        for(var i=0; i<fileCount; i++) {
            var originalFileNm = files[i].originalname;
            var savedFileNm = files[i].filename;
            var fileSize = files[i].size;
            console.log("originalFileNm : '%s', savedFile : '%s', size : '%s'", originalFileNm, savedFileNm, fileSize);
            if(i==0) {
                primaryImage = savedFileNm;
                console.log(">>> primaryImage = " + primaryImage);
            }
            if(i==1) {
                file1 = savedFileNm;
            }
            if(i==2) {
                file2 = savedFileNm;
            }
            if(i==3) {
                file3 = savedFileNm;
            }
        }

        var fileList = {
            'img' : primaryImage,
            'imgFile1' : file1,
            'imgFile2' : file2,
            'imgFile3' : file3,
            'filePath' : setPath
        };

        if(err) {
            return res.send(err);
        } else {
            return res.json({result : 'OK', fileList : fileList});
        }
    });

});


module.exports = router;