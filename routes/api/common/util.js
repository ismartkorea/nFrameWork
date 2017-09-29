var crypto = require('crypto');
var cryptlib = require('cryptlib');

var sprintf = require('sprintf-js').sprintf;
var vsprintf = require('sprintf-js').vsprintf;

var sqlstr = require('sqlstring');

var debug = require("./debug");
var d = new debug();

var util = function () {
  this.sprintf = sprintf;
  this.vsprintf = vsprintf;
  this.sqlpf = sqlstr.format;
  this.sqlesc = sqlstr.escape
};

util.prototype = {
  stdpf: function () {
    var ret = "";
    try {
      // The string containing the format items (e.g. "{0}")
      // will and always has to be the first argument.
      var ret = arguments[0];

      // start with the second argument (i = 1)
      for (var i = 1; i < arguments.length; i++) {
        // "gm" = RegEx options for Global search (more than one instance)
        // and for Multiline search
        var regEx = new RegExp("\\{" + (i - 1) + "\\}", "gm");
        ret = ret.replace(regEx, arguments[i]);
      }
    }
    catch (e) {
      d.err(e);
    }
    return ret;
  },
  replaceAll: function (str, searchStr, replaceStr) {
    return str.split(searchStr).join(replaceStr);
  },
  isNotNull: function (obj) {
    if (typeof obj !== 'undefined' && obj) {
      return true;
    }
    return false;
  },
  isNullStr: function (str) {
    if (typeof str === 'undefined' || str == '') {
      return true;
    }
    return false;
  },
  toJson: function (obj) {
    return JSON.stringify(obj);
  },
  sha256: function (str) {
    var sha256 = crypto.createHash("sha256");
    sha256.update(str, "utf8"); //utf8 here
    var result = sha256.digest("base64");
    return result;
  },
  encrypt: function (text, pwd, myiv) {
    // ref. https://www.npmjs.com/package/cryptlib
    //var iv = cryptlib.generateRandomIV(16); //16 bytes = 128 bit
    var iv = cryptlib.getHashSha256(myiv, 16);
    var key = cryptlib.getHashSha256(pwd, 32); //32 bytes = 256 bits
    return cryptlib.encrypt(text, key, iv);
    /*
     var cipher = crypto.createCipher('aes-256-cbc', this.sha256(pwd));
     cipher.update(text, 'utf8', 'base64');
     return cipher.final('base64');
     */
  },
  decrypt: function (text, pwd, myiv) {
    var iv = cryptlib.getHashSha256(myiv, 16);'iv vector used for encryption';
    var key = cryptlib.getHashSha256(pwd, 32); //32 bytes = 256 bits
    return cryptlib.decrypt(text, key, iv);
    /*
     var decipher = crypto.createDecipher('aes-256-cbc', this.sha256(pwd));
     decipher.update(text, 'base64', 'utf8');
     return decipher.final('utf8');
     */
  }

};

module.exports = util;