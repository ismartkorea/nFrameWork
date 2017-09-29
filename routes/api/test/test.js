var express = require('express');
var router = express.Router();

var multiparty = require('multiparty');
var fs = require('fs');

var sprintf = require('sprintf-js').sprintf;
var vsprintf = require('sprintf-js').vsprintf;

router.get('/', function(req, res, next) {
    console.log("/api/test");
    res.send("/api/test")
});

router.get('/textarea/crlf', function(req, res, next) {
    console.log("/api/test/textarea/crlf");
    res.render('api/test/textarea/crlf');
});

function d2h(d) {return d.toString(16);}
function h2d(h) {return parseInt(h,16);}

function Str2Hex(src) {
    var tmp = src;
    var str = '';
    for (var i=0; i<tmp.length; i++) {
        c = tmp.charCodeAt(i);
        str += d2h(c) + ' ';
    }
    return str;
}
function Hex2Str(src) {
    var tmp = src;
    var arr = tmp.split(' ');
    var str = '';
    for (var i=0; i<arr.length; i++) {
        c = String.fromCharCode(h2d(arr[i]));
        str += c;
    }
    return str;
}

router.post('/textarea/crlf', function(req, res, next) {
    console.log("POST /api/test/textarea/crlf");

    if ("" == req.body.contents) {
        console.log("contents empty");
        res.send("{ 'result': false, 'desc': 'contents field is not defined' }");
        return ;
    }

    console.log("contents: " + req.body.contents);
    var contents = req.body.contents.toString();
    console.log(Str2Hex(contents));

    var data = contents.replace(/\r\n/gi, "<br />");
    var res_html = "<html><body><div>" + data + "</div></body></html>";

    res.send(res_html);

    



});

module.exports = router;