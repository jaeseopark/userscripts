// ==UserScript==
// @name           Hide low votes
// @namespace      www.redflagdeals.com
// @description    Hides threads with vote count < threshold
// @include        https://forums.redflagdeals.com/*
// @require        https://code.jquery.com/jquery-3.6.0.slim.min.js
// ==/UserScript==

const THRESHOLD = 20;

$("li.topic").each(function () {
    let vote = 0;
    try {
        vote = parseInt($(this).find(".total_count").text());
    } catch { }
    if (vote < THRESHOLD) {
        $(this).css({ "display": "none" });
    }
});
