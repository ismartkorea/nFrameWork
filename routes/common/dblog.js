var mysql = require('mysql');

var Logs = function Logs() {};

Logs.prototype.saveErrLog = function(code, errno, sqlMessage) {

    var conn = mysql.createConnection(config);
    conn.connect();
    conn.query('INSERT INTO sql_err_log_tbl(code, err_no, sql_msg, ins_date) VALUES (?, ?, ?, now());',
        [code, errno, sqlMessage],
        function(err, results) {
            if(err) {
                console.log('err : ', err);
            } else {
                console.dir(results);
            }
        }
    );
    conn.commit();
    conn.end();

};

module.exports = Logs;