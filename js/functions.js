// browser detection
var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0; // Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
var isFirefox = typeof InstallTrigger !== 'undefined'; // Firefox 1.0+
var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0; // At least Safari 3+: "[object HTMLElementConstructor]"
var isChrome = !!window.chrome && !isOpera; // Chrome 1+
var isIE = /*@cc_on!@*/false || !!document.documentMode; // At least IE6

// Determine if the browser has a webkit core
function isWebkit() {
    var ua = window.navigator.userAgent;
    var msie = ua.indexOf("MSIE ");
    var ff = ua.toLowerCase().indexOf("firefox");

    if (ff > 0 || msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./))
        return false;
    else
        return true;
}

// Determine if the parameter is numeric
function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

$.fn.hasParent = function (e) {
    return !!$(this).closest(e).length;
}