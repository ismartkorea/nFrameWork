/*
    javascript 공통함수

 */
// 공통 팝업 창
function popup_window_common(url, name, left, top, width, height, toolbar, menubar, statusbar, scrollber, resizable, location) {
    var toolbar_str = toolbar ? "yes" : "no";
    var menubar_str = menubar ? "yes" : "no";
    var statusbar_str = statusbar ? "yes" : "no";
    var scrollbar_str = scrollber ? "yes" : "no";
    var resizable_str = resizable ? "yes" : "no";
    var location_str = location ? "yes" : "no";
    var mdWindow = null;
    mdWindow = window.open(url, name, "left="+left+", top="+top+", width="+width+", height="+height+", toolbar="+toolbar_str+", menubar="+menubar_str
        +",status="+statusbar_str+", scrollbars="+scrollbar_str+", resizable="+resizable_str+", location="+location_str);
    if(!mdWindow) {
        alert("팝업차단을 해제해주세요!");
        return;
    }
    mdWindow.focus();
    return mdWindow;
}

// IE 체크
function ieCheck() {
    var word;
    var version = "N/A";
    var agent = navigator.userAgent.toLowerCase();
    var name = navigator.appName;
    
    // IE old version ( IE 10 or Lower )
    if ( name == "Microsoft Internet Explorer" ) word = "msie ";
    else {
        // IE 11
        if ( agent.search("trident") > -1 ) word = "trident/.*rv:";
        // IE 12  ( Microsoft Edge )
        else if ( agent.search("edge/") > -1 ) word = "edge/";
    }
    
    var reg = new RegExp( word + "([0-9]{1,})(\\.{0,}[0-9]{0,1})" );

    if (  reg.exec( agent ) != null  )
        version = RegExp.$1 + RegExp.$2;
    //return version;
    
    if(version < 10) {
        if(confirm("인터넷 익스플로러 10 버전 이상 또는 크롬 브라우저에 최적화되어 있습니다. \n다운로드후 사용하시겠습니까?")) {
            location.href = "https://support.microsoft.com/ko-kr/help/17621/internet-explorer-downloads";
        }
    }
}
