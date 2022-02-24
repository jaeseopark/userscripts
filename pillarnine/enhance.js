// ==UserScript==
// @name         pillarnine
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://matrix.pillarnine.com/*
// @grant        none
// ==/UserScript==

const SQFT_REGEX = /SqFt([0-9,]*)Year/g;
const PRICE_REGEX = /\$([0-9,]*).[0-9]/g;

let SQFT_THRESHOLD = 1500;
let PRICE_THRESHOLD = 600000;

const LISTINGS = [];

function htmlToElement(html) {
    var template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstChild;
}

const stripHtml = (html) => {
   let tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
};

const getIntByRegex = (div, regex) => {
    const strippedHtml = stripHtml(div.innerHTML)
    const matches = strippedHtml.match(regex);
    if (!matches) return null;

    return parseInt(matches[0].split(".")[0].replace(/\D/g,''));
}

const isTwoStorey = (div) => div.outerHTML.includes("2 Storey");
const isTooSmall = (div) => {
    const sqft = getIntByRegex(div, SQFT_REGEX);
    return sqft !== null && sqft < SQFT_THRESHOLD;;
};
const isTooExpensive = (div) => {
    const price = getIntByRegex(div, PRICE_REGEX);
    return price !== null && price > PRICE_THRESHOLD;
};

const processListing = (div) => {
    const shouldHide = !isTwoStorey(div) || isTooSmall(div) || isTooExpensive(div);
    div.style.display = shouldHide ? "none": "";
};

const discoverListings = () => {
    LISTINGS.length = 0;
    $(".multiLineDisplay").each(function () { LISTINGS.push(this); });
};

const processListings = () => {
    discoverListings();
    LISTINGS.forEach(processListing);
};

const prependFilterBar = () => {
    const sqftInput = document.createElement("input");
    sqftInput.type = "number";
    sqftInput.value = SQFT_THRESHOLD;
    sqftInput.addEventListener('change', (event) => {
        SQFT_THRESHOLD = event.target.valueAsNumber;
    });

    const priceInput = htmlToElement("<input type='number' />");
    priceInput.value = PRICE_THRESHOLD;
    priceInput.addEventListener('change', (event) => {
        PRICE_THRESHOLD = event.target.valueAsNumber;
    });

    const applyButton = htmlToElement("<button>Apply</button>");
    applyButton.addEventListener('click', processListings);

    const resetButton = htmlToElement("<button>Cancel</button>");
    resetButton.addEventListener('click', () => {
        LISTINGS.forEach((div) => { div.style.display = ""; });
    });

    const filterBar = document.createElement("div");
    filterBar.style.backgroundColor = "white";
    filterBar.style.zIndex = 1;
    filterBar.style.position = "fixed";

    filterBar.prepend(resetButton);
    filterBar.prepend(applyButton);
    filterBar.prepend(priceInput);
    filterBar.prepend(htmlToElement("<label>Price</label>"));
    filterBar.prepend(sqftInput);
    filterBar.prepend(htmlToElement("<label>Sqft</label>"));
    document.body.prepend(filterBar);
};

// ------------- Start of script -------------

prependFilterBar();
