(function (win, doc) {
    'use strict';

    var html = doc.documentElement;
    var isIE11 = doc.uniqueID && win.matchMedia && !doc.selection;

    if (isIE11) {
        html.classList.add('ie11');
    }

    html.setAttribute('data-script-enabled', 'true');
    html = null;
    isIE11 = null;
}(window, window.document));