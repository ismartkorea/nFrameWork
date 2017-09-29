var utils = function (){};


// 콤마 추가.
utils.prototype.comma = function(num) {
    var reg = /(^[+-]?\d+)(\d{3})/;
    num += '';
    while(reg.test(num)) {
        num = num.replace(reg, '$1' + ',' + '$2');
    }
    return num;
};

// 콤마 제거
utils.prototype.unComma = function(num) {
    return (num.replace(/\,/g,""));
};


/**
 * 잔여 일수 계산
 * @param starDt
 * @param endDt
 */
util.prototype.fncRemainDay = function(endDt) {
    var day = 1000 * 60 * 60 * 24;
    var month = day * 30;
    var year = month * 12;
    var remainDay = 0;

    console.log('endDt : ', endDt);
    if(endDt !=null) {
        // 현재날짜
        var dt = new Date();
        var nowYear = dt.getFullYear();
        var nowMonth = (dt.getMonth() + 1) > 9 ? '' + (dt.getMonth() + 1) : '0' + (dt.getMonth() + 1);
        var nowDay = dt.getDate() > 9 ? '' + dt.getDate() : '0' + dt.getDate();
        var nowDate = nowYear.toString() + "" + nowMonth.toString() + "" + nowDay.toString();

        //var startDate = new Date(startDt.substr(0,4), startDt.substr(4,2)-1, startDt.substr(6,2));
        var endDate = new Date(endDt.substr(0, 4), endDt.substr(4, 2) - 1, endDt.substr(6, 2));
        var nDate = new Date(nowDate.substr(0, 4), nowDate.substr(4, 2) - 1, nowDate.substr(6, 2));

        var interval = endDate - nDate;

        //var remainYear = parseInt(interval / year);
        //var remainMonth = parseInt(interval / month);
        remainDay = parseInt(interval / day);
    }

    return remainDay;
};

/**
 * 잔여 월수 계산 함수.
 * @param endDt
 * @returns {Number}
 */
utils.prototype.fncRemainMonth = function(endDt) {
    var day = 1000 * 60 * 60 * 24;
    var month = day * 30;
    var year = month * 12;
    var remainMonth = 0;

    if(endDt != null) {
        // 현재날짜
        var dt = new Date();
        var nowYear = dt.getFullYear();
        var nowMonth = (dt.getMonth() + 1) > 9 ? '' + (dt.getMonth() + 1) : '0' + (dt.getMonth() + 1);
        var nowDay = dt.getDate() > 9 ? '' + dt.getDate() : '0' + dt.getDate();
        var nowDate = nowYear.toString() + "" + nowMonth.toString() + "" + nowDay.toString();

        //var startDate = new Date(startDt.substr(0,4), startDt.substr(4,2)-1, startDt.substr(6,2));
        var endDate = new Date(endDt.substr(0, 4), endDt.substr(4, 2) - 1, endDt.substr(6, 2));
        var nDate = new Date(nowDate.substr(0, 4), nowDate.substr(4, 2) - 1, nowDate.substr(6, 2));

        var interval = endDate - nDate;

        //var remainYear = parseInt(interval / year);
        remainMonth = parseInt(interval / month);
        //var remainDay = parseInt(interval / day);
    }

    return remainMonth;
};

/**
 * 월을 일로 변환 처리.
 * @param month
 * @returns {number}
 */
util.prototype.monthToDay = function(month) {
    var day = 30;
    var retVal = 0;
    if(month != null) {
        retVal = parseInt(month) * day;
    }
    return retVal;
};

module.exports = utils;