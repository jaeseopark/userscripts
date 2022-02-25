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
const DIMENSION_REGEX = /([0-9]*)`([0-9]*)"/g;

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

const discoverListings = () => {
    LISTINGS.length = 0;
    $(".multiLineDisplay").each(function () { LISTINGS.push(this); });
};

const processListing = (div) => {
    const shouldHide = !isTwoStorey(div) || isTooSmall(div) || isTooExpensive(div);
    div.style.display = shouldHide ? "none": "";
};

const processListings = () => {
    discoverListings();
    LISTINGS.forEach(processListing);
};

const toMeters = (imperial) => {
    const components = imperial.replace('"', "").split("`").map(s => parseInt(s));
    return (components[0] * 12 + components[1]) * 0.0254;
};

const convertTextToMetric = (element) => {
    const matches = element.textContent.match(DIMENSION_REGEX);
    if (!matches) return;

    let newTextContent = element.textContent;
    matches.forEach(match => {
        const meters = toMeters(match);
        const metersFormatted = meters.toFixed(2) + "m";
        newTextContent = newTextContent.replace(match, metersFormatted);
    });
    element.textContent = newTextContent;
};

const convertToMetric = () => {
    $("span").each(function () {
        if (this.children.length > 0) return;
        convertTextToMetric(this);
    });
};

const createToolbar = () => {
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

    const applyButton = htmlToElement("<button>Apply Filter</button>");
    applyButton.addEventListener('click', processListings);

    const resetButton = htmlToElement("<button>Cancel Filter</button>");
    resetButton.addEventListener('click', () => {
        LISTINGS.forEach((div) => { div.style.display = ""; });
    });

    const convertButton = htmlToElement("<button>Convert Units</button>");
    convertButton.addEventListener('click', convertToMetric);

    const toolbar = document.createElement("div");
    toolbar.style.backgroundColor = "white";
    toolbar.style.zIndex = 1;
    toolbar.style.position = "fixed";

    toolbar.prepend(convertButton);
    toolbar.prepend(resetButton);
    toolbar.prepend(applyButton);
    toolbar.prepend(priceInput);
    toolbar.prepend(htmlToElement("<label>Price</label>"));
    toolbar.prepend(sqftInput);
    toolbar.prepend(htmlToElement("<label>Sqft</label>"));
    document.body.prepend(toolbar);
};

// ------------- Start of script -------------

createToolbar();
