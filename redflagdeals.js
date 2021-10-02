// ==UserScript==
// @name           RFD
// @namespace      www.redflagdeals.com
// @description    RFD
// @include        https://forums.redflagdeals.com/*
// @require        https://code.jquery.com/jquery-3.6.0.slim.min.js
// ==/UserScript==

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
    addGlobalStyle(selector + " { display:none; } ");
}

function highlightVotes() {
    $('.post_voting').each(function () {
        let votes = 0;
        try {
            votes = parseInt($(this).attr('data-total'));
        } catch {
            return;
        }

        let backgroundColor = 'transparent';
        let foregroundColor = 'unset';

        if (votes >= 50) {
            backgroundColor = 'crimson';
            foregroundColor = 'white';
        } else if (votes < 0) {
            backgroundColor = 'black';
            foregroundColor = 'white';
        }
        $(this).css({ 'background-color': backgroundColor, 'color': foregroundColor, 'font-size': 'large' });
    });
}

hideElement("#header_billboard_bottom");
hideElement("#site_header");
hideElement("#site_footer");

hideElement(".thread_display_options_container");
hideElement(".forums_page_header_container");
hideElement(".sidebar_content");
hideElement(".forum_content");

hideElement(".forums_nav");

$('.primary_content').css({ 'padding-right': '10px' });
$('#site_container').css({ 'margin-bottom': 0 });
$('#site_content').css({ 'max-width': '1280px' });

highlightVotes();
