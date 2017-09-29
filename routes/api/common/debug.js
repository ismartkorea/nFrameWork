// 현재 실행이 debug 인지 확인
var isDebugMode = typeof v8debug === 'object';

var debug = function() {

};

debug.prototype = {
  log:function(str) {
    if (isDebugMode) {
      console.log(str);
    }
  },
  err:function(err) {
    console.log('[ERROR: ' + err + ']');
  }

};

module.exports = debug;
