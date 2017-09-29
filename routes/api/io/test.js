var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    console.log("GET /api/io/test");
    //res.send('hello io');
    res.render('api/io/test');

});

module.exports = router;
