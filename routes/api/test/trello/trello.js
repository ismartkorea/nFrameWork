var express = require('express');
var router = express.Router();

var sprintf = require('sprintf-js').sprintf;
var vsprintf = require('sprintf-js').vsprintf;

router.get('/', function(req, res, next) {
    console.log("GET /api/test/trello");
    res.send('hello trello');
    //res.render('api/io/test');

    // -----

    var Trello = require("node-trello");
    var t = new Trello("1abd5a71d7384da71a6f276398ebaa1d", "f9e38bc237d3cb58bbc2f4dc848e5c2098e9d9a9ace013a1150403499b256bf2");

    t.get("/1/members/me/boards", function(err, data) {
        if (err) throw err;
        //console.log(data);
        //console.log(data[0].name);

        // * 보드 정보 확인
        data.forEach(function(board) {
            //console.log(board.name + '(' + board.idOrganization + '-' + board.id + ')');
            /*
            if (! board.closed && board.idOrganization == '56af6977feb7b6af6196ffb1') {
                console.log(board.name + '(' + board.idOrganization + '-' + board.id + ')');

                if (board.id == '56af69da641cdc90c481339f') {
                    t.get("/1/boards/56af69da641cdc90c481339f/lists", function(err, lists) {
                        if (err) throw err;
                        console.log(lists);

                        t.get("/1/boards/56af69da641cdc90c481339f/cards", function(err, cards) {
                            if (err) throw err;
                            //console.log(cards);
                            var listId = '56b1d044a3647e768fe1cc06';
                            cards.forEach(function(card){
                                if (card.idList == listId) {
                                    console.log(card.name);
                                }

                            })

                        });

                    });
                }
            }
            */
        });

        // JTMOTORS(569da09c63298a1d789e72ae-569da138c0295613546f1afe)

        // * JTMOTORS 보드 - 리스트 확인
        t.get("/1/boards/569da138c0295613546f1afe/lists", function(err, lists) {
            if (err) throw err;
            console.log(lists);

            // 출고준비 리스트 - 56a04950a898047335984cfa
            // 입고후 진행대기차량 - 57e9b4a74a67a80560293386
        });

        t.get("/1/boards/569da138c0295613546f1afe/cards", function(err, cards) {
            if (err) throw err;
            //console.log(cards);
            var listId = '56a04950a898047335984cfa';
            cards.forEach(function(card){
                if (card.idList == listId) {
                    //console.log(card);
/*                    console.log("name: " + card.name);
                    console.log("desc: " + card.desc);
                    console.log("due: " + card.due);
                    var labels = card.labels;
                    labels.forEach(function(label) {
                        console.log(label);
                    });*/

/*
                    var queryListName = sprintf("/1/lists/%1$s/name", card.idList);

                    t.get(queryListName, function(err, name) {
                        if (err) throw err;
                        console.log(name);
                    });

                    console.log("-----");

*/

                }

            });

        });

    });


    //GET  -
    // URL arguments are passed in as an object.
    /*
    t.get("/1/members/me", { cards: "open" }, function(err, data) {
        if (err) throw err;
        console.log(data);
    });
    */

    // -----

});

module.exports = router;
