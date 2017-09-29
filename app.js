var express = require('express');
//var mysql = require('mysql');
var engine = require('ejs-locals');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var mysql = require('mysql');
var mongoose = require('mongoose');
//var redis = require('redis');
//var redis = require('./routes/common/redis.js');
//var redisStore = require('connect-redis')(session);
//var client = redis.createClient();
//
var routes = require('./routes/index');
var commons = require('./routes/common');
var useAuth = require('./routes/common/auth');
var users = require('./routes/users');
var login = require('./routes/login');
var signup = require('./routes/signup');
var board = require('./routes/board');
var announce = require('./routes/announce');
var ascenter = require('./routes/ascenter');
var products = require('./routes/products');
var aboutus = require('./routes/aboutus');
var mypage = require('./routes/mypage');
var adminLogin = require('./routes/admin/login');
var admin = require('./routes/admin/admin');
var member = require('./routes/admin/members');
var qna = require('./routes/admin/qna');
var announceAdmin = require('./routes/admin/announce');
var pay = require('./routes/admin/pay');
// commonPay는 삭제예정임.
var purchase = require('./routes/purchase');
// 테스트용.
var purchase2 = require('./routes/purchase2');
var products2 = require('./routes/products2');
var commonPay = require('./routes/pay');
var coupon = require('./routes/coupon');
var commonCd = require('./routes/admin/commoncd');
var productMng = require('./routes/admin/product');
var devBoard = require('./routes/admin/board');
var code = require('./routes/admin/code');
var loginSession = require('./routes/admin/session');
var managers = require('./routes/admin/managers');
var coupons = require('./routes/admin/coupon');
var notifications = require('./routes/admin/notification');
var models = require('./routes/admin/model');
var emails = require('./routes/admin/email');
var logs = require('./routes/admin/log');
// assistPro용
//var assist = require('./routes/assist');
//var assistAdmin = require('./routes/admin/assist');
// 방문내역
var visit = require('./routes/admin/visit');
// 배송관련
var delivery = require('./routes/admin/delivery');
// 자료실 관련
var data = require('./routes/admin/data');
// 테스트용
var test = require('./routes/test');
// 이메일 전송용
var sendMail = require('./routes/sendmail');
// MySQL Connect 설정.
var config = require('./routes/common/dbconfig');
global.dbConn = mysql.createConnection(config);
handleDisconnect(global.dbConn);

// api 용
var api_users = require('./routes/api/users/users');
var api_parts_price = require('./routes/api/parts/price');
var api_parts_login = require('./routes/api/parts/login');
var api_parts_basket = require('./routes/api/parts/basket');
var api_parts_update = require('./routes/api/parts/update');
var api_appcenter_update = require('./routes/api/appcenter/update');
var api_io_test = require('./routes/api/io/test');
var api_test = require('./routes/api/test/test');
var api_test_trello = require('./routes/api/test/trello/trello');
var api_jtmotors_trello = require('./routes/api/jtmotors/trello');
var api_assistpro_user = require('./routes/api/assistpro/user');
var api_vehicle_data_tracker_user = require('./routes/api/vehicle/user');
var api_partsorder_user = require('./routes/api/partsorder/user');
var api_fetch = require('./routes/api/fetch/fetch');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
//app.use(expressLayouts);

// session setup
var mongostore = require('connect-mongo')(session);
var mongourl = "mongodb://localhost:27017/session";

// 몽구스 스토이인경우.
app.use(session({
    secret: 'test!@$#!',
    store: new mongostore({
        url:mongourl,
        ttl:60 * 60 * 1000// 1시간 설정
    }),
    resave: false,
    saveUninitialized: false,
    cookie : {
        //expires : new Date(253402300000000)
        maxAge: 1000 * 60 * 60 * 24 // 쿠키 유효기간 1시간
    }
}));

// Redius Store
/*
 app.use(session({
 store: new redisStore({
 client: redis,
 host: 'localhost',
 port: 6379,
 prefix : "session:",
 db : 0
 }),
 secret: 'test!@$#!',
 saveUninitialized: false, // don't create session until something stored,
 resave: true, // don't save session if unmodified
 cookie: { maxAge: 1000 * 60 * 60 * 24 }
 }
 ));
 */

/*
// 일반 세션 설정.
app.use(session({
  secret: 'test!@$#!',
  resave: false,
  saveUninitialized: true,
  cookie : {
    //expires : new Date(253402300000000)
    maxAge: 1000 * 60 * 60 * 24 // 쿠키 유효기간 1시간
  }
}));
*/

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ limit:'50mb', extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'tmp')));

app.use('/', routes);
app.use('/common', commons);
//
app.use('/common/useAuth', useAuth);
app.use('/users', users);
app.use('/login', login);
app.use('/signup', signup);
app.use('/board', board);
app.use('/announce', announce);
app.use('/ascenter', ascenter);
app.use('/products', products);
app.use('/aboutus', aboutus);
app.use('/mypage', mypage);
app.use('/purchase', purchase);
// 테스트용 삭제 예정.
app.use('/purchase2', purchase2);
app.use('/products2', products2);
app.use('/coupon', coupon);
app.use('/admin', admin);
app.use('/admin/login', adminLogin);
app.use('/admin/member', member);
app.use('/admin/qna', qna);
app.use('/admin/announce', announceAdmin);
app.use('/admin/pay', pay);
app.use('/pay', commonPay);
app.use('/admin/commoncd', commonCd);
app.use('/admin/product', productMng);
app.use('/admin/board',devBoard);
app.use('/admin/code', code);
app.use('/admin/session', loginSession);
app.use('/admin/manager', managers);
app.use('/admin/coupon', coupons);
app.use('/admin/notification', notifications);
app.use('/admin/model', models);
app.use('/admin/email', emails);
app.use('/admin/log', logs);
// assistpro
//app.use('/assist',assist);
//app.use('/admin/assist', assistAdmin);
// visit
app.use('/admin/visit', visit);
// delivery
app.use('/admin/delivery', delivery);
// data (자료실)
app.use('/admin/data', data);
// 테스트용
app.use('/test', test);
// 메일용
app.use('/sendmail', sendMail);
// api용
app.use('/api/users', api_users);
app.use('/api/parts/price', api_parts_price);
app.use('/api/parts/login', api_parts_login);
app.use('/api/parts/basket', api_parts_basket);
app.use('/api/parts/update', api_parts_update);
app.use('/api/appcenter/update', api_appcenter_update);
app.use('/api/io/test', api_io_test);
app.use('/api/test', api_test);
app.use('/api/test/trello', api_test_trello);
app.use('/api/jtmotors/trello', api_jtmotors_trello);
app.use('/api/assistpro/user', api_assistpro_user);
app.use('/api/vehicle/tracker/user', api_vehicle_data_tracker_user);
app.use('/api/partsorder/user', api_partsorder_user);
app.use('/api/fetch', api_fetch);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
  //res.status(err.status);
});

app.engine('ejs', engine);

// CONNECT TO MONGODB SERVER
var db = mongoose.connection;
db.on('error', console.error);
db.once('open', function(){
    // CONNECTED TO MONGODB SERVER
    console.log("Connected to mongod server");
});
mongoose.connect('mongodb://localhost:27017/session');

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    var ss = req.session;
    
    var errPage = "";
    res.status(err.status || 500);
    if(err.status == 500) {
      errPage = "500";
    } else {
      errPage = "error";
    }
    res.render(errPage, {
      message: err.message,
      error: err,
      session: ss
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  var ss = req.session;

  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {},
    session: ss
  });
});

/**
 * DB ReConnect 함수.
 * @param client
 */
function handleDisconnect(client) {
    client.on('error', function (error) {
        if (!error.fatal) return;
        if (error.code !== 'PROTOCOL_CONNECTION_LOST') throw err;
        console.error('> Re-connecting lost MySQL connection: ' + error.stack);

        // NOTE: This assignment is to a variable from an outer scope; this is extremely important
        // If this said `client =` it wouldn't do what you want. The assignment here is implicitly changed
        // to `global.mysqlClient =` in node.
        global.dbcon = mysql.createConnection(client.config);
        handleDisconnect(global.dbcon);
        global.dbcon.connect();
    });
}
module.exports = app;
