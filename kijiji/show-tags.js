// ==UserScript==
// @name         Show tags
// @namespace    http://www.kijiji.ca/
// @version      0.1
// @author       Jaeseo Park
// @description  Picks up predefined keywords from listing titles/descriptions
// @match        https://www.kijiji.ca/*
// @icon         https://www.google.com/s2/favicons?domain=kijiji.ca
// @require      https://code.jquery.com/jquery-3.6.0.slim.min.js
// @require      https://momentjs.com/downloads/moment.min.js
// @grant        none
// ==/UserScript==

const TAG_PRESET = [
    "dell", "lenovo", "hp", "optiplex", "elitedesk", "prodesk", "g1", "g2",
    "sff",
    "intel", "amd", "i3", "i5", "i7",
    "ssd", "hdd"
];

function addGlobalStyle(css) {
    var head, style;
    head = document.getElementsByTagName('head')[0];
    if (!head) { return; }
    style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    head.appendChild(style);
}

function configureTagStyling() {
    addGlobalStyle(".itemtag { background-color: gainsboro; padding: 3px; margin-right: 5px; font-size: large; }");
}

function processDate(datePostedElement) {
    const datePostedText = datePostedElement.text();

    if (datePostedText.includes("/")) {
        let date = moment(datePostedText, "DD/MM/YYYY");
        datePostedElement.text(date.fromNow());
    }
}

function processTags(descDiv, extraText) {
    const descText = $(descDiv).text().toLowerCase() + extraText.toLowerCase();
    let tagBuilder = "";
    for (var i = TAG_PRESET.length - 1, tag; tag = TAG_PRESET[i]; i--) {
        if (descText.includes(tag)) {
            tagBuilder += "<span class=\"itemtag\">" + tag + "</span>";
        }
    }
    $(descDiv).prepend("<div class=\"tags\">" + tagBuilder + "</div>");
}

function processListing(div) {
    const cls = $(div).attr("class");
    if (cls.includes("search-item") && !cls.includes("third-party")) {
        processDate($(div).find(".date-posted"));
        processTags($(div).find(".description"), $(div).find(".title").find("a").text());
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
