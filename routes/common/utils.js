var Util = function Util() {};
/**
 * 잔여 일수 계산
 * @param starDt
 * @param endDt
 */
Util.prototype.fncRemainDay = function(endDt) {
    var day = 1000 * 60 * 60 * 24;
    var month = day * 30;
    var year = month * 12;
    // 현재날짜
    var dt = new Date();
    var nowYear = dt.getFullYear();
    var nowMonth = (dt.getMonth()+1)>9 ? ''+(dt.getMonth()+1) : '0'+(dt.getMonth()+1);
    var nowDay = dt.getDate()>9 ? ''+dt.getDate() : '0'+ dt.getDate();
    var nowDate = nowYear.toString() + "" + nowMonth.toString() + "" + nowDay.toString();

    //var startDate = new Date(startDt.substr(0,4), startDt.substr(4,2)-1, startDt.substr(6,2));
    var endDate = new Date(endDt.substr(0,4), endDt.substr(4,2)-1, endDt.substr(6,2));
    var nDate = new Date(nowDate.substr(0,4), nowDate.substr(4,2)-1, nowDate.substr(6,2));

    var interval = endDate - nDate;

    //var remainYear = parseInt(interval / year);
    //var remainMonth = parseInt(interval / month);
    var remainDay = parseInt(interval / day);

    return remainDay;
};

/**
 * 잔여 월수 계산 함수.
 * @param endDt
 * @returns {Number}
 */
Util.prototype.fncRemainMonth = function(endDt) {
    var day = 1000 * 60 * 60 * 24;
    var month = day * 30;
    var year = month * 12;
    // 현재날짜
    var dt = new Date();
    var nowYear = dt.getFullYear();
    var nowMonth = (dt.getMonth()+1)>9 ? ''+(dt.getMonth()+1) : '0'+(dt.getMonth()+1);
    var nowDay = dt.getDate()>9 ? ''+dt.getDate() : '0'+ dt.getDate();
    var nowDate = nowYear.toString() + "" + nowMonth.toString() + "" + nowDay.toString();

    //var startDate = new Date(startDt.substr(0,4), startDt.substr(4,2)-1, startDt.substr(6,2));
    var endDate = new Date(endDt.substr(0,4), endDt.substr(4,2)-1, endDt.substr(6,2));
    var nDate = new Date(nowDate.substr(0,4), nowDate.substr(4,2)-1, nowDate.substr(6,2));

    var interval = endDate - nDate;

    //var remainYear = parseInt(interval / year);
    //var remainMonth = parseInt(interval / month);
    var remainDay = parseInt(interval / day);

    return remainDay;
};

/*
 * RANDOM STRING GENERATOR
 *
 * Info:      http://stackoverflow.com/a/27872144/383904
 * Use:       randomString(length [,"A"] [,"N"] );
 * Default:   return a random alpha-numeric string
 * Arguments: If you use the optional "A", "N" flags:
 *            "A" (Alpha flag)   return random a-Z string
 *            "N" (Numeric flag) return random 0-9 string
 */
Util.prototype.randomString = function(len, an){
    an = an&&an.toLowerCase();
    var str="", i=0, min=an=="a"?10:0, max=an=="n"?10:62;
    for(;i++<len;){
        var r = Math.random()*(max-min)+min <<0;
        str += String.fromCharCode(r+=r>9?r<36?55:61:48);
    }
    return str;
};

/**
 * 현재 날짜(년월일) 셋팅.
 * @param str
 * @returns {*}
 */
Util.prototype.getNowDate = function(str) {
    var nowDate = new Date();
    var year = nowDate.getFullYear();
    var month = nowDate.getMonth()+1;
    var date = nowDate.getDate();

    if (month < 10) month = "0" + month;
    if (date < 10) date = "0" + date;

    return year + str + month + str + date;
};

/**
 * 현재 날짜(년월일) 셋팅.
 * 년도 길이 셋팅해서 반환.
 * @returns {*}
 */
Util.prototype.getNowDate2 = function() {
    var nowDate = new Date();
    var year = nowDate.getFullYear();
    var month = nowDate.getMonth()+1;
    var date = nowDate.getDate();
    year = year.toString().substring(2, 4);

    if (month < 10) month = "0" + month;
    if (date < 10) date = "0" + date;

    return year + month + date;
};

/**
 * 날짜 구해서 추가 셋팅.
 * @param addDay
 * @param str
 * @returns {*}
 */
Util.prototype.dateAdd = function(addDay, str) {

    var nowDate = new Date();
    var nowYear = nowDate.getFullYear();
    var nowMonth = nowDate.getMonth()+1;
    var nowDay = nowDate.getDate();
    if (nowMonth < 10) {
        nowMonth = "0" + nowMonth
    }
    if (nowDay < 10) {
        nowDay = "0" + nowDay
    }
    var todayDate = nowYear + str + nowMonth + str + nowDay;
    var dateArray = todayDate.split(str);
    var tmpDate = new Date(dateArray[0], dateArray[1], dateArray[2]);
    tmpDate.setMonth(tmpDate.getMonth() + (parseInt(addDay) - 1));
    nowDate.setTime(tmpDate);
    var y = nowDate.getFullYear();
    var m = nowDate.getMonth() + 1;
    var d;
    if(addDay=='12') {
        d = nowDate.getDate();
    } else {
        d = nowDate.getDate() - 1;
    }
    if (m < 10) m = "0" + m;
    if (d < 10) d = "0" + d;
    var retVal = y + str + m + str + d;

//console.log(">> addDays() -> retDate : " + retVal);

    return retVal;
};

/**
 * 콤마(,) 붙이기
 * @param num
 * @returns {string}
 */
Util.prototype.fnComma = function(num) {
    var reg = /(^[+-]?\d+)(\d{3})/;
    num += '';
    while(reg.test(num)) {
        num = num.replace(reg, '$1' + ',' + '$2');
    }
    return num;
};

/**
 * 콤마 제거 하기
 * @param num
 * @returns {*}
 */
Util.prototype.fnUnComma = function(num) {
    if(num !=null) {
        return (num.replace(/\,/g,""));
    } else {
        return num;
    }

};

/**
 * null 문자열 변환 처리.
 * @param Obj
 * @returns {*}
 */
Util.prototype.fnUndefined = function(Obj) {
    var obj;
    if(typeof Obj === 'undefined') {
        obj = '';
    } else {
        obj = Obj;
    }
    return obj;
};

/**
 * NullToString 문자열 변환처리.
 * @param Obj
 * @returns {*}
 */
Util.prototype.fnNull = function(Obj) {
    var obj = '';
    if(Obj == null) {
        obj = '';
    } else {
        obj = Obj;
    }
    return obj;
};

module.exports = Util;