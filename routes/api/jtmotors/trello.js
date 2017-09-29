var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    console.log("GET /api/jtmotors/trello");
    //res.send('hello jtmotors');
    // https://github.com/puikinsh/gentelella
    //res.render('api/jtmotors/trello/dashboard/index');


    {
        var data1 = {};

        var http = require('http');
        var options = {
            host: 'localhost',
            path: '/api/jtmotors/trello/getdata_r1',
            port: '18080',
        };
        http.request(options, function(response){
            var serverData = '';
            response.on('data', function (chunk) {
                serverData += chunk;
            });
            response.on('end', function () {
                try {
                    //console.log("Response Status:", response.statusCode);
                    //console.log("Response Headers:", response.headers);
                    //console.log("Response Data:", serverData);
                    data1 = JSON.parse(serverData);
                    //console.log(data1);
                    res.render('api/jtmotors/trello/dashboard/index',
                        { data1: data1 });
                } catch (exception) {
                    res.send("{'error': '관리자에게 연락바랍니다.'}");
                }
            });
        }).end();
    }

    return ;

    var async = require('async');

    var data1 = {};

    async.waterfall([
        function (cb) {
            var http = require('http');
            var options = {
                host: 'localhost',
                path: '/api/jtmotors/trello/today',
                port: '18080',
            };
            http.request(options, function(response){
                var serverData = '';
                response.on('data', function (chunk) {
                    serverData += chunk;
                });
                response.on('end', function () {
                    try {
                        console.log("Response Status:", response.statusCode);
                        console.log("Response Headers:", response.headers);
                        console.log("Response Data:", serverData);
                        data1.today = JSON.parse(serverData);
                        console.log("today --> " + data1.today.count);
                    } catch (exception) {

                    }
                    cb(null);
                });
            }).end();
        },
        function (cb) {
            var http = require('http');
            var options = {
                host: 'localhost',
                path: '/api/jtmotors/trello/warehousing',
                port: '18080',
            };
            http.request(options, function(response){
                var serverData = '';
                response.on('data', function (chunk) {
                    serverData += chunk;
                });
                response.on('end', function () {
                    try {
                        console.log("Response Status:", response.statusCode);
                        console.log("Response Headers:", response.headers);
                        console.log(serverData);
                        data1.warehousing = JSON.parse(serverData);
                        console.log("data --> " + data1.warehousing.count);
                    } catch (exception) {

                    }
                    cb(null);
                });
            }).end();
        },
        function (cb) {
            var http = require('http');
            var options = {
                host: 'localhost',
                path: '/api/jtmotors/trello/accident',
                port: '18080',
            };
            http.request(options, function(response){
                var serverData = '';
                response.on('data', function (chunk) {
                    serverData += chunk;
                });
                response.on('end', function () {
                    try {
                        console.log("Response Status:", response.statusCode);
                        console.log("Response Headers:", response.headers);
                        console.log(serverData);
                        data1.accident = JSON.parse(serverData);
                        console.log("data --> " + data1.accident.count);
                    } catch (exception) {

                    }
                    cb(null);
                });
            }).end();
        },
        function (cb) {
            var http = require('http');
            var options = {
                host: 'localhost',
                path: '/api/jtmotors/trello/waiting',
                port: '18080',
            };
            http.request(options, function(response){
                var serverData = '';
                response.on('data', function (chunk) {
                    serverData += chunk;
                });
                response.on('end', function () {
                    try {
                        console.log("Response Status:", response.statusCode);
                        console.log("Response Headers:", response.headers);
                        console.log(serverData);
                        data1.waiting = JSON.parse(serverData);
                        console.log("data --> " + data1.waiting.count);
                    } catch (exception) {

                    }
                    cb(null);
                });
            }).end();
        },
        function (cb) {
            var http = require('http');
            var options = {
                host: 'localhost',
                path: '/api/jtmotors/trello/completion',
                port: '18080',
            };
            http.request(options, function(response){
                var serverData = '';
                response.on('data', function (chunk) {
                    serverData += chunk;
                });
                response.on('end', function () {
                    try {
                        console.log("Response Status:", response.statusCode);
                        console.log("Response Headers:", response.headers);
                        console.log(serverData);
                        data1.completion = JSON.parse(serverData);
                        console.log("data --> " + data1.completion.count);
                    } catch (exception) {

                    }
                    cb(null);
                });
            }).end();
        },
        function (cb) {
            console.log('--> render <--');
            res.render('api/jtmotors/trello/dashboard/index',
                { data1: data1 });
        }

    ]);

    return ;

    //var data1 = [10, 20, 30, 40, 50];
    var data1 = [];
    var item1 = {'count': 99};
    data1.push(item1);

    res.render('api/jtmotors/trello/dashboard/index',
        { data1: data1 });
    return ;

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

        // * 라벨 확인
        t.get("/1/boards/569da138c0295613546f1afe/labels", function(err, labels) {
            if (err) throw err;
            console.log(labels);

            // 입고완료 - 569da138fb396fe7066aa554
            // 사고차 - 569da138fb396fe7066aa555

        });

        // JTMOTORS(569da09c63298a1d789e72ae-569da138c0295613546f1afe)

        // * JTMOTORS 보드 - 리스트 확인
        // t.get("/1/boards/569da138c0295613546f1afe/lists", function(err, lists) {
        //     if (err) throw err;
        //     //console.log(lists);
        //
        //     // 출고준비 리스트 - 56a04950a898047335984cfa
        //     // 입고후 진행대기차량 - 57e9b4a74a67a80560293386
        // });

        // t.get("/1/boards/569da138c0295613546f1afe/cards", function(err, cards) {
        //     if (err) throw err;
        //     //console.log(cards);
        //     var listId = '56a04950a898047335984cfa';
        //     cards.forEach(function(card){
        //         if (card.idList == listId) {
        //             //console.log(card);
        //             console.log("name: " + card.name);
        //             console.log("desc: " + card.desc);
        //             console.log("due: " + card.due);
        //             var labels = card.labels;
        //             labels.forEach(function(label) {
        //                 console.log(label);
        //             });
        //             console.log("-----");
        //         }
        //
        //     });
        //
        // });

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

router.get('/test', function(req, res, next) {
    console.log("GET /api/jtmotors/trello/test");
    res.send('/api/jtmotors/trello/test');

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

        // * 라벨 확인
        // t.get("/1/boards/569da138c0295613546f1afe/labels", function(err, labels) {
        //     if (err) throw err;
        //     console.log(labels);
        //
        //     // 입고완료 - 569da138fb396fe7066aa554
        //     // 사고차 - 569da138fb396fe7066aa555
        //
        // });

        // JTMOTORS(569da09c63298a1d789e72ae-569da138c0295613546f1afe)

        // * JTMOTORS 보드 - 리스트 확인
        // t.get("/1/boards/569da138c0295613546f1afe/lists", function(err, lists) {
        //     if (err) throw err;
        //     //console.log(lists);
        //
        //     // 출고준비 리스트 - 56a04950a898047335984cfa
        //     // 입고후 진행대기차량 - 57e9b4a74a67a80560293386
        // });

        // * 카드 확인
        t.get("/1/boards/569da138c0295613546f1afe/cards", function(err, cards) {
            if (err) throw err;
            //console.log(cards);
            cards.forEach(function(card){
                console.log(card);
            });
        });

        // t.get("/1/boards/569da138c0295613546f1afe/cards", function(err, cards) {
        //     if (err) throw err;
        //     //console.log(cards);
        //     var listId = '56a04950a898047335984cfa';
        //     cards.forEach(function(card){
        //         if (card.idList == listId) {
        //             //console.log(card);
        //             console.log("name: " + card.name);
        //             console.log("desc: " + card.desc);
        //             console.log("due: " + card.due);
        //             var labels = card.labels;
        //             labels.forEach(function(label) {
        //                 console.log(label);
        //             });
        //             console.log("-----");
        //         }
        //
        //     });
        //
        // });

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

//// 한방에 데이터 가져오기
////
router.get('/getdata', function(req, res, next) {
    console.log("GET /api/jtmotors/trello/getdata");
    //res.send('api: today');

    var Trello = require("node-trello");
    var t = new Trello("1abd5a71d7384da71a6f276398ebaa1d", "f9e38bc237d3cb58bbc2f4dc848e5c2098e9d9a9ace013a1150403499b256bf2");

    var ret = {};

    var today_data = {};
    var today_cards = [];
    var today_count = 0;

    var warehousing_data = {};
    var warehousing_cards = [];
    var warehousing_count = 0;

    var accident_data = {};
    var accident_cards = [];
    var accident_count = 0;

    var waiting_data = {};
    var waiting_cards = [];
    var waiting_count = 0;

    var completion_data = {};
    var completion_cards = [];
    var completion_count = 0;

    // JTMOTORS(569da09c63298a1d789e72ae-569da138c0295613546f1afe)

    t.get("/1/boards/569da138c0295613546f1afe/cards", function(err, cards) {
        try {
            if (err) throw err;
            //console.log(cards);
            var now = new Date();
            //console.log(now);
            var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            //console.log(today);
            var warehousingLabelId = '569da138fb396fe7066aa554';
            var accidentLabelId = '569da138fb396fe7066aa555';
            var waitingListId = '57e9b4a74a67a80560293386';
            var completionListId = '56a04950a898047335984cfa';
            cards.forEach(function(card) {
                // --> get today
                if (card.due) {
                    var due = new Date(card.due);
                    //console.log(due);
                    var dueDate = new Date(due.getFullYear(), due.getMonth(), due.getDate());
                    //console.log(dueDate);
                    var diffRet = today.getTime() - dueDate.getTime();
                    //console.log(diffRet);
                    if (0 == diffRet) {
                        //console.log(cards);
                        //console.log("name: " + card.name);
                        //console.log("desc: " + card.desc);
                        //console.log("due: " + card.due);
                        //console.log("-----");
                        var item = { };
                        item.name = card.name;
                        item.desc = card.desc;
                        item.due = card.due;
                        item.shortUrl = card.shortUrl;
                        today_count = today_cards.push(item);
                    }
                }
                // --> get warehousing and accident
                var warehousingLabels = card.labels;
                warehousingLabels.forEach(function(label) {
                    if (label.id == warehousingLabelId) {
                        //console.log("name: " + card.name);
                        //console.log("desc: " + card.desc);
                        //console.log("due: " + card.due);
                        //console.log("-----");
                        var item = { };
                        item.name = card.name;
                        item.desc = card.desc;
                        item.due = card.due;
                        item.shortUrl = card.shortUrl;
                        warehousing_count = warehousing_cards.push(item);
                    }
                    else if (label.id == accidentLabelId) {
                        //console.log("name: " + card.name);
                        //console.log("desc: " + card.desc);
                        //console.log("due: " + card.due);
                        //console.log("-----");
                        var item = { };
                        item.name = card.name;
                        item.desc = card.desc;
                        item.due = card.due;
                        item.shortUrl = card.shortUrl;
                        accident_count = accident_cards.push(item);
                    }
                });
                // --> get waiting and completion
                if (card.idList == waitingListId) {
                    //console.log(card);
                    //console.log("name: " + card.name);
                    //console.log("desc: " + card.desc);
                    //console.log("due: " + card.due);
                    // var labels = card.labels;
                    // labels.forEach(function(label) {
                    //     console.log(label);
                    // });
                    var item = { };
                    item.name = card.name;
                    item.desc = card.desc;
                    item.due = card.due;
                    item.shortUrl = card.shortUrl;
                    waiting_count = waiting_cards.push(item);
                }
                else if (card.idList == completionListId) {
                    //console.log(card);
                    //console.log("name: " + card.name);
                    //console.log("desc: " + card.desc);
                    //console.log("due: " + card.due);
                    // var labels = card.labels;
                    // labels.forEach(function(label) {
                    //     console.log(label);
                    // });
                    var item = { };
                    item.name = card.name;
                    item.desc = card.desc;
                    item.due = card.due;
                    item.shortUrl = card.shortUrl;
                    completion_count = completion_cards.push(item);
                }

            });

            today_data.count = today_count;
            console.log(today_cards);
            today_cards.sort(function(a, b) {
               return new Date(a.due) - new Date(b.due);
            });
            console.log(today_cards);
            today_data.cards = today_cards;
            ret.today = today_data;

            warehousing_data.count = warehousing_count;
            warehousing_data.cards = warehousing_cards;
            ret.warehousing = warehousing_data;

            accident_data.count = accident_count;
            accident_data.cards = accident_cards;
            ret.accident = accident_data;

            waiting_data.count = waiting_count;
            waiting_data.cards = waiting_cards;
            ret.waiting = waiting_data;

            completion_data.count = completion_count;
            completion_data.cards = completion_cards;
            ret.completion = completion_data;

            res.send(ret);
        }
        catch (exception) {
            res.send(ret);
        }
    });
});

//// 한방에 데이터 가져오기
////
router.get('/getdata_r1', function(req, res, next) {
    console.log("GET /api/jtmotors/trello/getdata_r1");
    //res.send('api: today');

    var Trello = require("node-trello");
    var t = new Trello("1abd5a71d7384da71a6f276398ebaa1d", "f9e38bc237d3cb58bbc2f4dc848e5c2098e9d9a9ace013a1150403499b256bf2");

    var ret = {};

    var today_data = {};
    var today_cards = [];
    var today_count = 0;

    var warehousing_data = {};
    var warehousing_cards = [];
    var warehousing_count = 0;

    var accident_data = {};
    var accident_cards = [];
    var accident_count = 0;

    var waiting_data = {};
    var waiting_cards = [];
    var waiting_count = 0;

    var completion_data = {};
    var completion_cards = [];
    var completion_count = 0;

    var async = require('async');

    var dictLists = {};

    async.waterfall([
        function (cb) {
            // 보드의 리스트의 정보를 읽어서 저장한다. 이 데이터는 나중에 보드의 카드를 열거할 때
            // 카드가 어느 리스트에 속해 있는지 알아보기 위함

            //console.log("callback 1");

            // JTMOTORS(569da09c63298a1d789e72ae-569da138c0295613546f1afe)

            t.get("/1/boards/569da138c0295613546f1afe/lists", function(err, lists) {
                try {
                    if (err) throw err;
                    //console.log(lists);

                    lists.forEach(function(list) {
                        dictLists[list.id] = list.name;
                    });

/*                    for (var key in dictLists) {
                        console.log("key : " + key + ", value : " + dictLists[key]);
                    }*/
                }
                catch (exception) {
                    console.log("error get list")
                }
                cb(null);
            });
        },
        function (cb) {
            //console.log("callback 2");

            cb(null);
        },
        function (cb) {
            //console.log("callback 3");

            cb(null);
        },
        function (cb) {
            //console.log("callback 4");

            cb(null);
        },
        function (cb) {
            // JTMOTORS(569da09c63298a1d789e72ae-569da138c0295613546f1afe)

            //console.log("callback 5");

            t.get("/1/boards/569da138c0295613546f1afe/cards", function(err, cards) {
                try {
                    if (err) throw err;
                    //console.log(cards);
                    var now = new Date();
                    //console.log(now);
                    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    //console.log(today);
                    var warehousingLabelId = '569da138fb396fe7066aa554';
                    var accidentLabelId = '569da138fb396fe7066aa555';
                    var waitingListId = '57e9b4a74a67a80560293386';
                    var completionListId = '56a04950a898047335984cfa';
                    cards.forEach(function(card) {
                        // --> get today
                        if (card.due) {
                            var due = new Date(card.due);
                            //console.log(due);
                            var dueDate = new Date(due.getFullYear(), due.getMonth(), due.getDate());
                            //console.log(dueDate);
                            var diffRet = today.getTime() - dueDate.getTime();
                            //console.log(diffRet);
                            if (0 == diffRet) {
                                //console.log(cards);
                                //console.log("name: " + card.name);
                                //console.log("desc: " + card.desc);
                                //console.log("due: " + card.due);
                                //console.log("-----");
                                var item = { };
                                item.name = card.name;
                                item.listname = dictLists[card.idList];
                                item.desc = card.desc;
                                item.due = card.due;
                                item.shortUrl = card.shortUrl;
                                today_count = today_cards.push(item);
                            }
                        }
                        // --> get warehousing and accident
                        var warehousingLabels = card.labels;
                        warehousingLabels.forEach(function(label) {
                            if (label.id == warehousingLabelId) {
                                //console.log("name: " + card.name);
                                //console.log("desc: " + card.desc);
                                //console.log("due: " + card.due);
                                //console.log("-----");
                                var item = { };
                                item.name = card.name;
                                item.listname = dictLists[card.idList];
                                item.desc = card.desc;
                                item.due = card.due;
                                item.shortUrl = card.shortUrl;
                                warehousing_count = warehousing_cards.push(item);
                            }
                            else if (label.id == accidentLabelId) {
                                //console.log("name: " + card.name);
                                //console.log("desc: " + card.desc);
                                //console.log("due: " + card.due);
                                //console.log("-----");
                                var item = { };
                                item.name = card.name;
                                item.listname = dictLists[card.idList];
                                item.desc = card.desc;
                                item.due = card.due;
                                item.shortUrl = card.shortUrl;
                                accident_count = accident_cards.push(item);
                            }
                        });
                        // --> get waiting and completion
                        if (card.idList == waitingListId) {
                            //console.log(card);
                            //console.log("name: " + card.name);
                            //console.log("desc: " + card.desc);
                            //console.log("due: " + card.due);
                            // var labels = card.labels;
                            // labels.forEach(function(label) {
                            //     console.log(label);
                            // });
                            var item = { };
                            item.name = card.name;
                            item.listname = dictLists[card.idList];
                            item.desc = card.desc;
                            item.due = card.due;
                            item.shortUrl = card.shortUrl;
                            waiting_count = waiting_cards.push(item);
                        }
                        else if (card.idList == completionListId) {
                            //console.log(card);
                            //console.log("name: " + card.name);
                            //console.log("desc: " + card.desc);
                            //console.log("due: " + card.due);
                            // var labels = card.labels;
                            // labels.forEach(function(label) {
                            //     console.log(label);
                            // });
                            var item = { };
                            item.name = card.name;
                            item.listname = dictLists[card.idList];
                            item.desc = card.desc;
                            item.due = card.due;
                            item.shortUrl = card.shortUrl;
                            completion_count = completion_cards.push(item);
                        }

                    });

                    today_data.count = today_count;
                    //console.log(today_cards);
                    today_cards.sort(function(a, b) {
                        return new Date(a.due) - new Date(b.due);
                    });
                    //console.log(today_cards);
                    today_data.cards = today_cards;
                    ret.today = today_data;

                    warehousing_data.count = warehousing_count;
                    warehousing_data.cards = warehousing_cards;
                    ret.warehousing = warehousing_data;

                    accident_data.count = accident_count;
                    accident_data.cards = accident_cards;
                    ret.accident = accident_data;

                    waiting_data.count = waiting_count;
                    waiting_data.cards = waiting_cards;
                    ret.waiting = waiting_data;

                    completion_data.count = completion_count;
                    completion_data.cards = completion_cards;
                    ret.completion = completion_data;

                    res.send(ret);
                }
                catch (exception) {
                    res.send(ret);
                }
                cb(null);
            });
        },
        function (cb) {
            //console.log("callback 6");

        }

    ]);


});

//// 당일 예약 현황
//// JTMOTORS 보드 내에 due-date 가 오늘 날짜인 카드에서 추출
//// 시간 / 차량번호 / 차종 / 내용
////
router.get('/today', function(req, res, next) {
    console.log("GET /api/jtmotors/trello/today");
    //res.send('api: today');

    var Trello = require("node-trello");
    var t = new Trello("1abd5a71d7384da71a6f276398ebaa1d", "f9e38bc237d3cb58bbc2f4dc848e5c2098e9d9a9ace013a1150403499b256bf2");

    var ret = {};
    var data = [];
    var itemcount = 0;

    // JTMOTORS(569da09c63298a1d789e72ae-569da138c0295613546f1afe)

    t.get("/1/boards/569da138c0295613546f1afe/cards", function(err, cards) {
        try {
            if (err) throw err;
            //console.log(cards);
            var now = new Date();
            //console.log(now);
            var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            //console.log(today);
            cards.forEach(function(card) {
                if (card.due) {
                    var due = new Date(card.due);
                    //console.log(due);
                    var dueDate = new Date(due.getFullYear(), due.getMonth(), due.getDate());
                    //console.log(dueDate);
                    var diffRet = today.getTime() - dueDate.getTime();
                    //console.log(diffRet);
                    if (0 == diffRet) {
                        //console.log(cards);
                        //console.log("name: " + card.name);
                        //console.log("desc: " + card.desc);
                        //console.log("due: " + card.due);
                        //console.log("-----");

                        var item = { };
                        item.name = card.name;
                        item.desc = card.desc;
                        item.due = card.due;
                        item.shortUrl = card.shortUrl;
                        itemcount = data.push(item);
                    }
                }
            });

            ret.count = itemcount;
            ret.data = data;

            if (itemcount) {
                res.send(ret);
            }
        }
        catch (exception) {
            if (0 == itemcount) {
                ret.count = 0;
                res.send(ret);
            }
        }
    });
});

//// 현재 입고 현황 (예약을 한 차량이 실제 들어와서 접수 완료)
//// JTMOTORS 보드 - 카드
//// 카드라벨에 '입고완료' 붙은 것을 추출
////
router.get('/warehousing', function(req, res, next) {
    console.log("GET /api/jtmotors/trello/warehousing");
    //res.send('api: warehousing');

    var Trello = require("node-trello");
    var t = new Trello("1abd5a71d7384da71a6f276398ebaa1d", "f9e38bc237d3cb58bbc2f4dc848e5c2098e9d9a9ace013a1150403499b256bf2");

    // JTMOTORS(569da09c63298a1d789e72ae-569da138c0295613546f1afe)

    var ret = {};
    var data = [];
    var itemcount = 0;

    // var item = {};
    // item.name = "aaaa";
    // item.desc = "1111";
    //
    // itemcount = data.push(item);

    t.get("/1/boards/569da138c0295613546f1afe/cards", function(err, cards) {
        try {
            if (err) throw err;
            //console.log(cards);
            // 입고완료 라벨 - 569da138fb396fe7066aa554
            var targetLabelId = '569da138fb396fe7066aa554';
            cards.forEach(function(card){
                //console.log(card);
                var labels = card.labels;
                labels.forEach(function(label) {
                    if (label.id == targetLabelId) {
                        console.log("name: " + card.name);
                        //console.log("desc: " + card.desc);
                        //console.log("due: " + card.due);
                        console.log("-----");
                        var item = { };
                        item.name = card.name;
                        item.desc = card.desc;
                        item.due = card.due;
                        item.shortUrl = card.shortUrl;
                        itemcount = data.push(item);
                        return true;
                    }
                });
            });

            ret.count = itemcount;
            ret.data = data;

            if (itemcount) {
                res.send(ret);
            }

        }
        catch (exception) {
            if (0 == itemcount) {
                ret.count = 0;
                res.send(ret);
            }

        }
    });

});

//// 사고차량 입고 현황
//// 카드라벨에 '사고차량' 붙은 것은 추출
////
router.get('/accident', function(req, res, next) {
    console.log("GET /api/jtmotors/trello/accident");
    //res.send('api: accident');

    var Trello = require("node-trello");
    var t = new Trello("1abd5a71d7384da71a6f276398ebaa1d", "f9e38bc237d3cb58bbc2f4dc848e5c2098e9d9a9ace013a1150403499b256bf2");

    var ret = {};
    var data = [];
    var itemcount = 0;

    // JTMOTORS(569da09c63298a1d789e72ae-569da138c0295613546f1afe)

    t.get("/1/boards/569da138c0295613546f1afe/cards", function(err, cards) {
        try {
            if (err) throw err;
            //console.log(cards);
            // 사고차 라벨 - 569da138fb396fe7066aa555
            var targetLabelId = '569da138fb396fe7066aa555';
            cards.forEach(function(card){
                //console.log(card);
                var labels = card.labels;
                labels.forEach(function(label) {
                    if (label.id == targetLabelId) {
                        console.log("name: " + card.name);
                        //console.log("desc: " + card.desc);
                        //console.log("due: " + card.due);
                        console.log("-----");
                        var item = { };
                        item.name = card.name;
                        item.desc = card.desc;
                        item.due = card.due;
                        item.shortUrl = card.shortUrl;
                        itemcount = data.push(item);
                        return true;
                    }
                });
            });

            ret.count = itemcount;
            ret.data = data;

            if (itemcount) {
                res.send(ret);
            }
        }
        catch (exception) {
            if (0 == itemcount) {
                ret.count = 0;
                res.send(ret);
            }
        }
    });
});

//// 입고 후 진행대기차량
//// 입고후 진행대기차량 리스트에 있는 카드를 추출
////
router.get('/waiting', function(req, res, next) {
    console.log("GET /api/jtmotors/trello/waiting");
    //res.send('api: waiting');

    var Trello = require("node-trello");
    var t = new Trello("1abd5a71d7384da71a6f276398ebaa1d", "f9e38bc237d3cb58bbc2f4dc848e5c2098e9d9a9ace013a1150403499b256bf2");

    var ret = {};
    var data = [];
    var itemcount = 0;

    // JTMOTORS(569da09c63298a1d789e72ae-569da138c0295613546f1afe)

    t.get("/1/boards/569da138c0295613546f1afe/cards", function(err, cards) {
        try {
            if (err) throw err;
            //console.log(cards);
            // 입고후 진행대기차량 - 57e9b4a74a67a80560293386
            var targetListId = '57e9b4a74a67a80560293386';
            cards.forEach(function(card){
                if (card.idList == targetListId) {
                    //console.log(card);
                    console.log("name: " + card.name);
                    //console.log("desc: " + card.desc);
                    //console.log("due: " + card.due);
                    // var labels = card.labels;
                    // labels.forEach(function(label) {
                    //     console.log(label);
                    // });
                    var item = { };
                    item.name = card.name;
                    item.desc = card.desc;
                    item.due = card.due;
                    item.shortUrl = card.shortUrl;
                    itemcount = data.push(item);

                    console.log("-----");
                }
            });

            ret.count = itemcount;
            ret.data = data;

            if (itemcount) {
                res.send(ret);
            }
        } catch (exception) {
            if (0 == itemcount) {
                ret.count = 0;
                res.send(ret);
            }
        }
    });
});

//// 출고 준비(작업완료) 현황
//// 출고준비 리스트에 있는 카드를 추출
////
router.get('/completion', function(req, res, next) {
    console.log("GET /api/jtmotors/trello/completion");
    //res.send('api: completion');

    var Trello = require("node-trello");
    var t = new Trello("1abd5a71d7384da71a6f276398ebaa1d", "f9e38bc237d3cb58bbc2f4dc848e5c2098e9d9a9ace013a1150403499b256bf2");

    var ret = {};
    var data = [];
    var itemcount = 0;

    // JTMOTORS(569da09c63298a1d789e72ae-569da138c0295613546f1afe)

    t.get("/1/boards/569da138c0295613546f1afe/cards", function(err, cards) {
        try {
            if (err) throw err;
            //console.log(cards);
            // 출고준비 리스트 - 56a04950a898047335984cfa
            var targetListId = '56a04950a898047335984cfa';
            cards.forEach(function(card){
                if (card.idList == targetListId) {
                    //console.log(card);
                    console.log("name: " + card.name);
                    //console.log("desc: " + card.desc);
                    //console.log("due: " + card.due);
                    // var labels = card.labels;
                    // labels.forEach(function(label) {
                    //     console.log(label);
                    // });
                    var item = { };
                    item.name = card.name;
                    item.desc = card.desc;
                    item.due = card.due;
                    item.shortUrl = card.shortUrl;
                    itemcount = data.push(item);

                    console.log("-----");
                }
            });

            ret.count = itemcount;
            ret.data = data;

            if (itemcount) {
                res.send(ret);
            }
        }
        catch (exception) {
            if (0 == itemcount) {
                ret.count = 0;
                res.send(ret);
            }
        }
    });
});

module.exports = router;
