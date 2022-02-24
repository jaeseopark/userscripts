// ==UserScript==
// @name         pillarnine
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://matrix.pillarnine.com/*
// @grant        none
// ==/UserScript==

const SQFT_REGEX = /SqFt(.*)Year/g;
let SQFT_THRESHOLD = 1500;
const LISTINGS = [];

const stripHtml = (html) => {
   let tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
};

const isTwoStorey = (div) => div.outerHTML.includes("2 Storey");

const getSqft = (div) => {
    const strippedHtml = stripHtml(div.innerHTML)
    const firstMatch = strippedHtml.match(SQFT_REGEX)[0];
    return parseInt(firstMatch.replace(/\D/g,''));
};

const isTooSmall = (div) => {
    return getSqft(div) < SQFT_THRESHOLD;
};

const processListing = (div) => {
    const shouldHide = !isTwoStorey(div) || isTooSmall(div);
    div.style.display = shouldHide ? "none": "";
};

const processListings = () => LISTINGS.forEach(processListing);

const prependSqftInput = () => {
    const element = document.createElement("input");
    element.type = "number";
    element.value = SQFT_THRESHOLD;
    element.addEventListener('change', (event) => {
        SQFT_THRESHOLD = event.target.valueAsNumber;
        processListings();
    });

    document.body.prepend(element);
};

const discoverListings = () => {
    $(".multiLineDisplay").each(function () {
        LISTINGS.push(this);
    });
}

// ------------- Start script -------------

prependSqftInput();
discoverListings();
processListings();
