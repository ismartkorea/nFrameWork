var debug = require("./debug");
var d = new debug();

var mysql = require('mysql');

var mysqlconn = function(conncfg = null) {
  if (conncfg == null) {
    this._pool = mysql.createPool({
      host : 'localhost',
      port : 3306,
      user : 'root',
      password : '0o0o!!!',
      insecureAuth : true,
      database : 'jtlab',
      connectionLimit : 25,
      waitForConnections : true
    });
  }
  else {
    this._pool = mysql.createPool(conncfg);
  }
};

mysqlconn.prototype = {
  pool:function() {
    return this._pool;
  }
};

module.exports = mysqlconn;
