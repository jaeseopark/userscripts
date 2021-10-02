// ==UserScript==
// @name           RFD Forum Vote Filter
// @namespace      www.redflagdeals.com
// @description    RFD Forum Vote Filter
// @include        https://forums.redflagdeals.com/*
// @require        https://code.jquery.com/jquery-3.6.0.slim.min.js
// ==/UserScript==

const THRESHOLD = 50;

$("li.topic").each(function () {
    let vote = 0;
    try {
        vote = parseInt($(this).find(".total_count").text());
    } catch { }
    if (vote < THRESHOLD) {
        $(this).css({ "display": "none" });
    }
});
