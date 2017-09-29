var express = require('express');
var router = express.Router();

var MongoClient = require('mongodb').MongoClient;
var MongoServer = require('mongodb').Server;


/* api/mongodb/test */
router.get('/', function(req, res, next) {
    var ss = req.session;
    console.log("session " + ss.userid);

    ////
    var mongourl = "mongodb://localhost:27017/session";
    MongoClient.connect(mongourl, function(err, db){
        try {
            db.collection('sessions').findOne({}, function(err, doc){
                if (err) throw err;

                console.log(doc);
                db.close();
            });
        }
        catch (e) {
            console.log(e);
        }
    });

    res.send('api/mongodb/test');
});

module.exports = router;