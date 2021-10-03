// ==UserScript==
// @name         Hide inline ads
// @namespace    http://www.kijiji.ca/
// @version      0.1
// @author       Jaeseo Park
// @description  Hides inline ads
// @match        https://www.kijiji.ca/*
// @icon         https://www.google.com/s2/favicons?domain=kijiji.ca
// @require      https://code.jquery.com/jquery-3.6.0.slim.min.js
// @grant        none
// ==/UserScript==

function hideElement(selector) {
    $(selector).css({ "display": "none" });
}

function hideAds() {
    hideElement(".sponsored-ad-container");
    hideElement(".third-party");
    hideElement(".inline-banner");
    hideElement("iframe");
}

hideAds();
hideElement("#Footer");
