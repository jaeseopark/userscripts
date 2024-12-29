// ==UserScript==
// @name           Hide clutter
// @namespace      www.redflagdeals.com
// @description    Hides misc elements and ads
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

hide("#header_billboard_bottom");
hide("#site_header");
hide("#site_footer");

hide(".thread_display_options_container");
hide(".forums_page_header_container");
hide(".sidebar_content");
hide(".forum_content");

hide(".forums_nav");

$('.primary_content').css({ 'padding-right': '10px' });
$('#site_container').css({ 'margin-bottom': 0 });
$('#site_content').css({ 'max-width': '1280px' });
