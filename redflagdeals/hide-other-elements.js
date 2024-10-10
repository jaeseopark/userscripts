// ==UserScript==
// @name           Hide other elements
// @namespace      www.redflagdeals.com
// @description    Hides misc elements.
// @include        https://forums.redflagdeals.com/*
// @require        https://code.jquery.com/jquery-3.6.0.slim.min.js
// ==/UserScript==

const hide = (path) => {
    $(path).each(function () {
    $(this).css({ "display": "none" });
});
}

hide("div#header_leaderboard");
hide("li.sticky");
hide("li.ad_box");
