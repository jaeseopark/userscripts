// ==UserScript==
// @name         Stocktrack Styler
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Removes ads and fixes the general styling of the website.
// @author       You
// @match        https://stocktrack.ca/*
// @icon         https://www.google.com/s2/favicons?domain=stocktrack.ca
// @grant        none
// ==/UserScript==

const NAV_BAR_HEIGHT = 0;
const STORE_TABLE_WIDTH = 650;

const applyStyle = (element, newStyle) => {
    Object.keys(newStyle).forEach(k => {
        element.style[k] = newStyle[k];
    });
};

const setElementStyleByClass = (classname, newStyle) => {
    var elements = document.getElementsByClassName(classname);
    for (var i = 0; i < elements.length; i++) {
        applyStyle(elements[i], newStyle);
    }
};

const setElementStyleById = (elementId, newStyle) => {
    const element = document.getElementById(elementId);
    if (element) {
        applyStyle(element, newStyle);
    }

};

function hideById(elementId) {
    setElementStyleById(elementId, {display: "none"});
}

function hideByClass(elementId) {
    setElementStyleByClass(elementId, {display: "none"});
}

const normalizeDocHeight = () => {
    ["html", "body"].forEach(tag => {
        const element = document.getElementsByTagName(tag)[0];
        element.style.height = "100%";
    });
};

const moveElementToRootLevelByClass = (classname) => {
    var elements = document.getElementsByClassName(classname);
    for (var i = 0; i < elements.length; i++) {
        document.body.appendChild(elements[i]);
    }
};

const hideAds = () => {
    hideById("footer");
    hideById("fixedban");
    hideByClass("ftr");
    hideByClass("adsbygoogle");
};

const hideStoreAddresses = () => {
    let tr;
    const xpathResult = document.evaluate("//*[@class='objbox']//tr", document.body);
    while (tr = xpathResult.iterateNext()) {
        applyStyle(tr.childNodes[2], {display: "none"});
    }
};

const run = () => {
    normalizeDocHeight();
    hideById("layoutObj");
    moveElementToRootLevelByClass("objbox");
    moveElementToRootLevelByClass("dhx_dataview");

    // Store table styling
    setElementStyleByClass("objbox", {
        position: "fixed",
        left: 0,
        top: `${NAV_BAR_HEIGHT}px`,
        width: `${STORE_TABLE_WIDTH}px`,
        height: "100vh",
        "z-index": 1
    });

    // Product table styling
    setElementStyleByClass("dhx_dataview", {
        position: "fixed",
        left: `${STORE_TABLE_WIDTH}px`,
        top: `${NAV_BAR_HEIGHT}px`,
        width: `calc(100vw - ${STORE_TABLE_WIDTH}px)`,
        height: "100vh",
        "z-index": 1
    });
};

const repeat = () => {
    hideAds();
    hideStoreAddresses();
};

setTimeout(run, 2500);
setInterval(repeat, 500);
