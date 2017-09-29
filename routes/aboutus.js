/*
 * 모듈명  : abouts.js
 * 설명    : JT-LAB 화면 '회사소개' 에 대한 모듈.
 * 작성일  : 2016년 11월 1일
 * author  : HiBizNet
 * copyright : JT-LAB
 * version : 1.0
 */
var express = require('express');
//var mysql = require('mysql');
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

/* GET home page. */
router.get('/', function(req, res, next) {
    var ss = req.session;
    res.render('aboutus', { title: 'About JT-LAB', session : ss});
});

module.exports = router;
