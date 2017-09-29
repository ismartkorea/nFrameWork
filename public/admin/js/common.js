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