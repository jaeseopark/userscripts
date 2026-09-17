// ==UserScript==
// @name         Home Depot Canada - Hide Cookie Banner
// @namespace    http://tampermonkey.net
// @version      1.2
// @description  Hides the OneTrust consent banner on homedepot.ca
// @author       Your Name
// @match        *://*.homedepot.ca/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const style = document.createElement('style');
    style.textContent = '#onetrust-consent-sdk { display: none !important; }';
    (document.head || document.documentElement).appendChild(style);
})();
