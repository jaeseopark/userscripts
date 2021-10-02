// ==UserScript==
// @name           RFD Forum Vote Filter
// @namespace      www.redflagdeals.com
// @description    RFD Forum Vote Filter
// @include        https://forums.redflagdeals.com/*
// @require        https://code.jquery.com/jquery-3.6.0.slim.min.js
// ==/UserScript==

const THRESHOLD = 50;

function addGlobalStyle(css) {
    var head, style;
    head = document.getElementsByTagName('head')[0];
    if (!head) { return; }
    style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    head.appendChild(style);
}

function hideElement(selector) {
    $(selector).css({ 'display': 'none' });
    //addGlobalStyle(selector + " { display:none; } ");
}

$("li.topic").each(function () {
    let vote = 0;
    try {
        vote = parseInt($(this).find(".total_count").text());
    } catch { }
    if (vote < THRESHOLD) {
        $(this).css({ "display": "none" });
    }
});
