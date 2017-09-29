/**
 * MySQL Conifg 모듈 정의
 * @type {{host: string, port: number, database: string, user: string, password: string, insecureAuth: boolean, multipleStatements: boolean}}
 */
var mysql = {
    host: 'localhost',
    port: 3306,
    database : 'jtlab',
    user: 'jtlab',
    password: 'jtlab9123',
    insecureAuth: true,
    multipleStatements: true
};

module.exports = mysql;