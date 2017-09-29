/*
    https://www.npmjs.com/package/sprintf-js
*/
var sprintf = require('sprintf-js').sprintf;
var vsprintf = require('sprintf-js').vsprintf;

var express = require('express');
var router = express.Router();

var multiparty = require('multiparty');
var fs = require('fs');

var parts_data = require('./parts_price.json');

/* GET users listing. */
router.get('/', function(req, res, next) {
    console.log("/api/parts/price");
    //res.send('/api/parts/price');
    res.render('api/parts/price/price');
});

/* ===================================================================
    아이템 삭제
 */

router.get('/delete', function(req, res, next) {
    console.log("GET /api/parts/price/delete");

    res.render('api/parts/price/delete');
});

router.post('/delete', function(req, res, next) {
    console.log("POST /api/parts/price/delete");

    console.log("partsNo: " + req.body.partsNo);

    if ("" == req.body.partsNo) {
        console.log("key parameter error!");
        //res.send("{}");
        res.send("{ 'result': false, 'desc': 'key filed is not defined' }");
        return ;
    }

    var mysql = require('mysql');
    var conn = mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '0o0o!!!',
        insecureAuth: true
        //database: 'jtlab'
    });
    conn.connect();
    conn.query("USE jtlab");

    var itemno = "";
    if (undefined == req.body.partsNo) {
        console.log("exception : req.body.partsNo is undefined");
        return ;
    }
    itemno = req.body.partsNo.toString();

    var queryStr = "delete from parts";
    queryStr += " where no='" + itemno + "'";

    console.log("query str : " + queryStr);

    var query = conn.query(queryStr, queryResult);
    function queryResult(err, rows, fields) {
        if (! err) {
            console.log("the solution is: ", rows);
            //res.json(rows);
            if (rows.affectedRows) {
                res.send("{ 'result': true }");
            }
            else {
                res.send("{ 'result': false, 'desc': 'item no is invalid' }");
            }
        }
        else {
            console.log("error while performing query.");
            console.log(err.stack);
            //res.send("database error!!!");
            res.send("{ 'result': false, 'desc': 'query failed' }");
        }
    }

    //console.log(query);
    conn.end();
});

/* ===================================================================
    아이템 추가
 */

router.get('/insert', function(req, res, next) {
    console.log("GET /api/parts/price/insert");

    res.render('api/parts/price/insert');
});

router.post('/insert', function(req, res, next) {
    console.log("POST /api/parts/price/insert");

    console.log("brand: " + req.body.brand);
    console.log("partsNo: " + req.body.partsNo);
    console.log("partsName: " + req.body.partsName);
    console.log("partsPrice: " + req.body.partsPrice);
    console.log("partsInPrice: " + req.body.partsInPrice);
    console.log("partsCompNo: " + req.body.partsCompNo);

    if ("" == req.body.partsNo) {
        console.log("key parameter error!");
        //res.send("{}");
        res.send("{ 'result': false, 'desc': 'key filed is not defined' }");
        return ;
    }

    var isParamErr = false;
    if (! (("" != req.body.brand) ||
        ("" != req.body.partsName) ||
        ("" != req.body.partsPrice) ||
        ("" != req.body.partsInPrice) ||
        ("" != req.body.partsCompNo))) {
        console.log("data parameter error!");
        isParamErr = true;
        //res.send("{}");
        res.send("{ 'result': false, 'desc': 'value validation failed' }");
        return ;
    }

    var mysql = require('mysql');
    var conn = mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '0o0o!!!',
        insecureAuth: true
        //database: 'jtlab'
    });
    conn.connect();
    conn.query("USE jtlab");

    var itemno = "";
    if (undefined == req.body.partsNo) {
        console.log("exception : req.body.partsNo is undefined");
        return ;
    }
    itemno = req.body.partsNo.toString();

    function isNumber(n) { return /^-?[\d.]+(?:e-?\d+)?$/.test(n); }

    var price = 0;
    if (undefined != req.body.partsPrice) {
        if (isNumber(req.body.partsPrice)) {
            price = req.body.partsPrice;
        }
    }

    var inprice = 0;
    if (undefined != req.body.partsInPrice) {
        if (isNumber(req.body.partsInPrice)) {
            inprice = req.body.partsInPrice;
        }
    }

    var brand = "unknown";
    if (undefined != req.body.brand) {
        brand = req.body.brand.toLowerCase()
    }

    function replaceAll(str, searchStr, replaceStr) {
        return str.split(searchStr).join(replaceStr);
    }
    var partsname = "undefined";
    if (undefined != req.body.partsName) {
        partsname = req.body.partsName.toString().replace(/\n/gi, " ");
        //partsname = req.body.partsName.toString().replace(/'/gi, "\'");
        partsname = replaceAll(partsname, "'", "\\'");
    }

    var compno = "";
    if (undefined != req.body.partsCompNo) {
        compno = req.body.partsCompNo.toString().replace(/\n/gi, " ");
        //compno = req.body.partsCompNo.toString().replace(/'/gi, "\'");
        compno = replaceAll(compno, "'", "\\'");
    }

    /*
     var queryStr = sprintf("insert into parts (brand, no, name, price, inprice, compno) values('%1$s', '%2$s', '%3$s', %4$s, %5$s, '%6$s') " +
     "on duplicate key update brand='%1$s', no='%2$s', name='%3$s', price=%4$s, inprice=%5$s, compno='%6$s'",
     brand, itemno, partsname, price, inprice, compno);
     /*/
    var queryStr = sprintf("insert into parts (brand, no, name, price, inprice, compno) values('%1$s', '%2$s', '%3$s', %4$s, %5$s, '%6$s')",
        brand, itemno, partsname, price, inprice, compno);
    //*/

    console.log("query str : " + queryStr);

    var query = conn.query(queryStr, queryResult);
    function queryResult(err, rows, fields) {
        if (! err) {
            console.log("the solution is: ", rows);
            //res.json(rows);
            res.send("{ 'result': true }");
        }
        else {
            console.log("error while performing query.");
            console.log(err.stack);
            //res.send("database error!!!");
            res.send("{ 'result': false, 'desc': 'query failed' }");
        }
    }

    //console.log(query);
    conn.end();
});

/* ===================================================================
    아이템 업데이트
 */

router.get('/update', function(req, res, next) {
    console.log("/api/parts/price/update");
    //console.log(req);
    //console.log(req.headers);
    //console.log(req.header('host'));
    //console.log(req.header('user-agent'));
    //console.log(req.query);

    //console.log(req.query.brand);
    //console.log(req.query.no);

    //if (req.query.brand == undefined && req.query.no == undefined) {
    //if (req.query.no == undefined) {
    //    res.render('api/parts/price/search');
    //
    //    return ;
    //}

    res.render('api/parts/price/update');
});

router.post('/update', function(req, res, next) {
    console.log("POST /api/parts/price/update");

    console.log("brand: " + req.body.brand);
    console.log("partsNo: " + req.body.partsNo);
    console.log("partsName: " + req.body.partsName);
    console.log("partsPrice: " + req.body.partsPrice);
    console.log("partsInPrice: " + req.body.partsInPrice);
    console.log("partsCompNo: " + req.body.partsCompNo);

    if ("" == req.body.partsNo) {
        console.log("key parameter error!");
        res.send("{ 'result': false, 'desc': 'key filed is not defined' }");
        return ;
    }

    var isParamErr = false;
    if (! (("" != req.body.brand) ||
        ("" != req.body.partsName) ||
        ("" != req.body.partsPrice) ||
        ("" != req.body.partsInPrice) ||
        ("" != req.body.partsCompNo))) {
        console.log("data parameter error!");
        isParamErr = true;
        res.send("{ 'result': false, 'desc': 'value validation failed' }");
        return ;
    }

    var mysql = require('mysql');
    var conn = mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '0o0o!!!',
        insecureAuth: true
        //database: 'jtlab'
    });
    conn.connect();
    conn.query("USE jtlab");

    var prefixFieldSet = false;
    var queryStr = "update parts set ";
    if ("" != req.body.brand) {
        queryStr += sprintf("brand='%1$s'", req.body.brand);
        prefixFieldSet = true
    }
    if ("" != req.body.partsName) {
        if (prefixFieldSet) {
            queryStr += ", "
        }
        queryStr += sprintf("name='%1$s'", req.body.partsName);
        prefixFieldSet = true
    }
    if ("" != req.body.partsPrice) {
        if (prefixFieldSet) {
            queryStr += ", "
        }
        queryStr += sprintf("price='%1$s'", req.body.partsPrice);
        prefixFieldSet = true
    }
    if ("" != req.body.partsInPrice) {
        if (prefixFieldSet) {
            queryStr += ", "
        }
        queryStr += sprintf("inprice='%1$s'", req.body.partsInPrice);
        prefixFieldSet = true
    }
    if ("" != req.body.partsCompNo) {
        if (prefixFieldSet) {
            queryStr += ", "
        }
        queryStr += sprintf("compno='%1$s'", req.body.partsCompNo);
        prefixFieldSet = true
    }
    queryStr += " where no='" + req.body.partsNo + "'";

    console.log("query str : " + queryStr);

    var query = conn.query(queryStr, queryResult);
    function queryResult(err, rows, fields) {
        if (! err) {
            console.log("the solution is: ", rows);

            //res.json(rows);
            res.send("{ 'result': true }");
        }
        else {
            console.log("error while performing query.");
            console.log(err.stack);
            //res.send("database error!!!");
            res.send("{ 'result': false, 'desc': 'query failed' }");
        }
    }

    //console.log(query);
    conn.end();
});

/* ===================================================================
    이이템 서치
*/

router.get('/search', function(req, res, next) {
    console.log("/api/parts/price/search");
    //console.log(req);
    //console.log(req.headers);
    //console.log(req.header('host'));
    //console.log(req.header('user-agent'));
    console.log(req.query);

    //console.log(req.query.brand);
    console.log(req.query.no);

    //if (req.query.brand == undefined && req.query.no == undefined) {
    if (req.query.no == undefined) {
        res.render('api/parts/price/search');

        return ;
    }

    var match_partsNo = false;
    if (req.query.match != undefined) {
        if (req.query.match == "true") {
            match_partsNo = true;
        }
    }

    var mysql = require('mysql');
    var conn = mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '0o0o!!!',
        insecureAuth: true
        //database: 'jtlab'
    });
    conn.connect();
    conn.query("USE jtlab");
/*
    var queryStr = sprintf("SELECT * from parts where brand = '%1$s' and no = '%2$s'",
        req.query.brand, req.query.no);
*/
/*
    var queryStr = "select * from parts where brand='" + req.query.brand + "' and no like '"
        + req.query.no + "%'"
*/
    //var queryStr = "select * from parts where no like '%" + req.query.no + "%' limit 30"
    var queryStr;
    if (match_partsNo) {
        queryStr = "select * from parts where no = '" + req.query.no + "' limit 1"
    }
    else {
        queryStr = "select * from parts where no like '" + req.query.no + "%' limit 30"
    }


    var query = conn.query(queryStr, queryResult);
    function queryResult(err, rows, fields) {
        if (! err) {
            //console.log("the solution is: ", rows);

            res.json(rows);
        }
        else {
            console.log("error while performing query.");
            console.log(err.stack);
            res.send("database error!!!");
        }
    }

    //console.log(query);
    conn.end();
});

router.post('/search', function(req, res, next) {
    console.log("POST /api/parts/price/search");
    //console.log(req.body.brand);
    console.log(req.body.partsNo);

    //res.send("/api/parts/price/search_data");

    var mysql = require('mysql');
    var conn = mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '0o0o!!!',
        insecureAuth: true
        //database: 'jtlab'
    });
    conn.connect();
    conn.query("USE jtlab");
/*
    var queryStr = sprintf("SELECT * from parts where brand = '%1$s' and no = '%2$s'",
        req.body.brand, req.body.partsNo);
*/
/*
    var queryStr = "select * from parts where brand='" + req.body.brand + "' and no like '"
        + req.body.partsNo + "%'"
*/
    var queryStr = "select * from parts where no like '%" + req.body.partsNo + "%'";

    var query = conn.query(queryStr, queryResult);
    function queryResult(err, rows, fields) {
        if (! err) {
            console.log("the solution is: ", rows);

            res.json(rows);
        }
        else {
            console.log("error while performing query.");
            console.log(err.stack);
            res.send("database error!!!");
        }
    }

    //console.log(query);
    conn.end();
});

/* ===================================================================
    리스트 출력
*/

router.get('/list', function(req, res, next) {
    console.log("/api/parts/price/list");
    //console.log(req);
    //console.log(req.headers);
    //console.log(req.header('host'));
    //console.log(req.header('user-agent'));
    console.log(req.query);

    console.log(req.query.brand);
    console.log(req.query.filter);
    console.log(req.query.cnt);

    var cnt = req.query.cnt;
    if (cnt == undefined) {
        cnt = 30;
    }

    var mysql = require('mysql');
    var conn = mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '0o0o!!!',
        insecureAuth: true
        //database: 'jtlab'
    });
    conn.connect();
    conn.query("USE jtlab");
    var queryStr = sprintf("SELECT * from parts where brand = '%1$s' limit %2$s",
        req.query.brand, cnt);
    var query = conn.query(queryStr, queryResult);
    function queryResult(err, rows, fields) {
        if (! err) {
            //console.log("the solution is: ", rows);
            res.render('api/parts/price/list', {
                brand: req.query.brand,
                data1: rows
            });
        }
        else {
            console.log("error while performing query.");
            console.log(err.stack);

            res.send("database error!!!");
        }
    }

    //console.log(query);
    conn.end();

});

/* ===================================================================
    데이터 업로드 파트
*/

router.get('/upload', function(req, res, next) {
    console.log("GET /api/parts/price/upload");

    res.render('api/parts/price/upload');
});

router.post('/upload', function(req, res, next) {
    console.log("POST /api/parts/price/upload");

    var form = new multiparty.Form();

    // get field name & value
    form.on('field', function(name, value){
        console.log('normal field / name = '+ name +' , value = ' + value);
    });

    // file upload handling
    form.on('part', function(part) {
        var filename;
        var size;
        if (part.filename) {
            filename = part.filename;
            size = part.byteCount;
        }
        else {
            part.resume();
        }

        console.log("Write Streaming file :" + filename);
        var writeFilePFN = sprintf("%1$s%2$s_%3$s", './tmp/', Date.now(), filename);
        var writeStream = fs.createWriteStream(writeFilePFN);
        writeStream.filename = filename;
        part.pipe(writeStream);
        writeStream.on('close', function() {
            console.log("writeStream close");

            // xls 처리부분
            // https://www.npmjs.com/package/xlsx

            var xlsx = require('xlsx');
            try {
                var workbook = xlsx.readFile(writeFilePFN);
                var sheet_name_list = workbook.SheetNames;
                sheet_name_list.forEach(function(sheet_name) {
                    var worksheet = workbook.Sheets[sheet_name];
                    var headers = { };
                    var data = [ ];
                    for(cell in worksheet) {
                        if (cell[0] === '!')
                            continue;
                        //parse out the column, row, and value
                        var temp = 0;
                        for (var i = 0; i < cell.length; i++) {
                            if (! isNaN(cell[i])) {
                                temp = i;
                                break;
                            }
                        }
                        var col = cell.substring(0, temp);
                        var row = parseInt(cell.substring(temp));
                        var value = worksheet[cell].v;
                        //console.log(row + " " + col + " " + value);

                        //store header names
                        if (row == 1 && value) {
                            headers[col] = value;
                            continue;
                        }

                        if (! data[row]) {
                            data[row] = { };
                            //console.log("row : " + row);
                        }

                        data[row][headers[col]] = value;
                    }
                    //drop those first two rows which are empty
                    data.shift();
                    data.shift();
                    //console.log(data);

                    var mysql = require('mysql');
                    var conn = mysql.createConnection({
                        host: 'localhost',
                        port: 3306,
                        user: 'root',
                        password: '0o0o!!!',
                        insecureAuth: true
                        //database: 'jtlab'
                    });
                    conn.connect();
                    data.forEach(function(item) {
                        var echo_data = sprintf("brand: %1$s, no: %2$s, name: %3$s, price: %4$s"
                            , item.brand, item.no, item.name, item.price);
                        //console.log(echo_data);

                        var itemno = "";
                        if (undefined == item.no) {
                            console.log("exception : item.no is undefined");
                            return ;
                        }
                        itemno = item.no.toString();

                        function isNumber(n) { return /^-?[\d.]+(?:e-?\d+)?$/.test(n); }

                        var price = 0;
                        if (undefined != item.price) {
                            if (isNumber(item.price)) {
                                price = item.price;
                            }
                        }

                        var brand = "unknown";
                        if (undefined != item.brand) {
                            brand = item.brand.toLowerCase()
                        }

                        function replaceAll(str, searchStr, replaceStr) {
                            return str.split(searchStr).join(replaceStr);
                        }
                        var partsname = "undefined";
                        if (undefined != item.name) {
                            partsname = item.name.toString().replace(/\n/gi, " ");
                            //partsname = item.name.toString().replace(/'/gi, "\'");
                            partsname = replaceAll(partsname, "'", "\\'");
                        }

                        var inprice = 0;
                        var compno = "";

                        conn.query("USE jtlab");
//*
                        var queryStr = sprintf("insert into parts (brand, no, name, price, inprice, compno) values('%1$s', '%2$s', '%3$s', %4$s, %5$s, '%6$s') " +
                            "on duplicate key update brand='%1$s', no='%2$s', name='%3$s', price=%4$s, inprice=%5$s, compno='%6$s'",
                            brand, itemno, partsname, price, inprice, compno);
/*/
                        var queryStr = sprintf("insert into parts (brand, no, name, price, inprice, compno) values('%1$s', '%2$s', '%3$s', %4$s, %5$s, '%6$s')",
                            brand, itemno, partsname, price, inprice, compno);
//*/
                        var query = conn.query(queryStr, queryResult);
                        function queryResult(err, rows, fields) {
                            if (! err) {
                                //console.log("the solution is: ", rows);
                            }
                            else {
                                console.log("item no:" + itemno + " error while performing query.");
                                console.log(err.stack);
                            }
                        }

                        //console.log(query);
                    });
                    conn.end();
                });

                res.send("{ 'result': true, 'desc': 'success' }");
            }
            catch (exception) {
                console.log(exception);
                res.send(sprintf("{ 'result': false, 'desc': '%1$s' }", exception));
            }

        });

        part.on('data', function(chunk) {
            console.log(filename + ' read ' + chunk.length + 'bytes');
        });

        part.on('end', function() {
            console.log(filename + ' Part read complete');
            writeStream.end();

        });
    });

    // all uploads are completed
    form.on('close', function() {
        console.log("form 'close'");

        //res.status(200).send('Upload complete');
        //res.redirect('/api/parts/price/search');

        //res.redirect('/api/parts/price/upload');
    });

    // track progress
    form.on('progress', function(byteRead, byteExpected) {
        console.log('Reading total  ' + byteRead + '/' + byteExpected);
    });

    form.parse(req);
});

router.get('/upload/v2', function(req, res, next) {
    console.log("GET /api/parts/price/upload/v2");

    res.render('api/parts/price/upload_v2');
});

router.post('/upload/v2', function(req, res, next) {
    console.log("POST /api/parts/price/upload/v2");

    var form = new multiparty.Form();

    // get field name & value
    form.on('field', function(name, value){
        console.log('normal field / name = '+ name +' , value = ' + value);
    });

    // file upload handling
    form.on('part', function(part) {
        var filename;
        var size;
        if (part.filename) {
            filename = part.filename;
            size = part.byteCount;
        }
        else {
            part.resume();
        }

        console.log("Write Streaming file :" + filename);
        var writeFilePFN = sprintf("%1$s%2$s_%3$s", './tmp/', Date.now(), filename);
        var writeStream = fs.createWriteStream(writeFilePFN);
        writeStream.filename = filename;
        part.pipe(writeStream);
        writeStream.on('close', function() {
            console.log("writeStream close");

            // 파일을 다 읽고 라인단위로 데이터를 읽어서 데이터베이스에 입력

            try {
                var mysql = require('mysql');
                var conn = mysql.createConnection({
                    host: 'localhost',
                    port: 3306,
                    user: 'root',
                    password: '0o0o!!!',
                    insecureAuth: true
                    //database: 'jtlab'
                });
                conn.connect();

                fs.readFileSync(writeFilePFN).toString().split('\n').forEach(function (line) {
                    //console.log(line);
                    if (line == "") {
                        console.log("empty line");
                        return ;
                    }

                    var vData = line.split('|');
                    //console.log(vData[0]);
                    var item = { };
                    item.brand = vData[0].toString().toLowerCase().trim();
                    if (0 == item.brand.localeCompare("아우디")) {
                        item.brand = "audi";
                    } else if (0 == item.brand.localeCompare("벤틀리")) {
                        item.brand = "bentley";
                    } else if (0 == item.brand.localeCompare("벤츠")) {
                        item.brand = "benz";
                    } else if (0 == item.brand.localeCompare("BMW")) {
                        item.brand = "bmw";
                    } else if (0 == item.brand.localeCompare("크라이슬러")) {
                        item.brand = "chrysler";
                    } else if (0 == item.brand.localeCompare("피아트")) {
                        item.brand = "fiat";
                    } else if (0 == item.brand.localeCompare("포드")) {
                        item.brand = "ford";
                    } else if (0 == item.brand.localeCompare("혼다")) {
                        item.brand = "honda";
                    } else if (0 == item.brand.localeCompare("인피니티")) {
                        item.brand = "infiniti";
                    } else if (0 == item.brand.localeCompare("재규어")) {
                        item.brand = "jaguar";
                    } else if (0 == item.brand.localeCompare("지프")) {
                        item.brand = "jeep";
                    } else if (0 == item.brand.localeCompare("랜드로버")) {
                        item.brand = "landrover";
                    } else if (0 == item.brand.localeCompare("렉서스")) {
                        item.brand = "lexus";
                    } else if (0 == item.brand.localeCompare("닛산")) {
                        item.brand = "nissan";
                    } else if (0 == item.brand.localeCompare("푸조")) {
                        item.brand = "peugeot";
                    } else if (0 == item.brand.localeCompare("토요타")) {
                        item.brand = "toyota";
                    } else if (0 == item.brand.localeCompare("볼보")) {
                        item.brand = "volvo";
                    } else if (0 == item.brand.localeCompare("폭스바겐")) {
                        item.brand = "vw";
                    } else if (0 == item.brand.localeCompare("현대")) {
                        item.brand = "hyundai";
                    } else if (0 == item.brand.localeCompare("기아")) {
                        item.brand = "kia";
                    }
                    item.no = vData[1].toString().trim();
                    item.name = vData[2].toString().trim().replace(/ +/g, " ");
                    item.ename = vData[3].toString().trim().replace(/ +/g, " ");
                    if (item.name != item.ename) {
                        item.name = item.name + " (" + item.ename + ")";
                    }
                    item.price = vData[4].toString().trim();
                    //console.log(item.brand + ", " + item.no + ", " + item.name + ", " + item.ename + ", " + item.price);

                    var echo_data = sprintf("brand: %1$s, no: %2$s, name: %3$s, price: %4$s"
                        , item.brand, item.no, item.name, item.price);
                    console.log(echo_data);

                    //return ;

                    var itemno = "";
                    if (undefined == item.no) {
                        console.log("exception : item.no is undefined");
                        return ;
                    }
                    itemno = item.no.toString();

                    function isNumber(n) { return /^-?[\d.]+(?:e-?\d+)?$/.test(n); }

                    var price = 0;
                    if (undefined != item.price) {
                        if (isNumber(item.price)) {
                            price = item.price;
                        }
                    }

                    var brand = "unknown";
                    if (undefined != item.brand) {
                        brand = item.brand.toLowerCase()
                    }

                    function replaceAll(str, searchStr, replaceStr) {
                        return str.split(searchStr).join(replaceStr);
                    }
                    var partsname = "undefined";
                    if (undefined != item.name) {
                        partsname = item.name.toString().replace(/\n/gi, " ");
                        //partsname = item.name.toString().replace(/'/gi, "\'");
                        partsname = replaceAll(partsname, "'", "\\'");
                    }

                    var inprice = 0;
                    var compno = "";

                    conn.query("USE jtlab");

                    var existOnUpdate = true;
                    var queryStr;
                    if (existOnUpdate) {
                        queryStr = sprintf("insert into parts (brand, no, name, price, inprice, compno) values('%1$s', '%2$s', '%3$s', %4$s, %5$s, '%6$s') " +
                            "on duplicate key update brand='%1$s', no='%2$s', name='%3$s', price=%4$s, inprice=%5$s, compno='%6$s'",
                            brand, itemno, partsname, price, inprice, compno);
                    }
                    else {
                        queryStr = sprintf("insert into parts (brand, no, name, price, inprice, compno) values('%1$s', '%2$s', '%3$s', %4$s, %5$s, '%6$s')",
                            brand, itemno, partsname, price, inprice, compno);

                    }

                    var query = conn.query(queryStr, queryResult);
                    function queryResult(err, rows, fields) {
                        if (! err) {
                            //console.log("the solution is: ", rows);
                        }
                        else {
                            console.log("item no:" + itemno + " error while performing query.");
                            console.log(err.stack);
                        }
                    }

                    //console.log(query);
                });

                conn.end();

                res.send("{ 'result': true, 'desc': 'success' }");
            }
            catch (exception) {
                console.log(exception);
                res.send(sprintf("{ 'result': false, 'desc': '%1$s' }", exception));
            }

        });

        part.on('data', function(chunk) {
            console.log(filename + ' read ' + chunk.length + 'bytes');
        });

        part.on('end', function() {
            console.log(filename + ' Part read complete');
            writeStream.end();

        });
    });

    // all uploads are completed
    form.on('close', function() {
        console.log("form 'close'");

        //res.status(200).send('Upload complete');
        //res.redirect('/api/parts/price/search');

        //res.redirect('/api/parts/price/upload');
    });

    // track progress
    form.on('progress', function(byteRead, byteExpected) {
        console.log('Reading total  ' + byteRead + '/' + byteExpected);
    });

    form.parse(req);
});

module.exports = router;
