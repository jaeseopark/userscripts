// ==UserScript==
// @name         Show relative time
// @namespace    http://www.kijiji.ca/
// @version      0.1
// @author       Jaeseo Park
// @description  Shows timestamps in relative format instead of DD/MM/YYYY
// @match        https://www.kijiji.ca/*
// @icon         https://www.google.com/s2/favicons?domain=kijiji.ca
// @require      https://code.jquery.com/jquery-3.6.0.slim.min.js
// @require      https://momentjs.com/downloads/moment.min.js
// @grant        none
// ==/UserScript==

function processDate(datePostedElement) {
    const datePostedText = datePostedElement.text();

    if (datePostedText.includes("/")) {
        let date = moment(datePostedText, "DD/MM/YYYY");
        datePostedElement.text(date.fromNow());
    }
}

function processListing(div) {
    const cls = $(div).attr("class");
    if (cls.includes("search-item") && !cls.includes("third-party")) {
        processDate($(div).find(".date-posted"));
    } else {
        $(div).css({ "display": "none" });
    }
}

function processSearchResult(div) {
    $(div).children().each(function () {
        processListing(this);
    });
};

configureTagStyling();
$(".container-results").each(function () {
    processSearchResult(this);
});
