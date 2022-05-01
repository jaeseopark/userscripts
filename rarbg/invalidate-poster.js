// ==UserScript==
// @name         Invalidate Poster
// @namespace    https://rarbg.to/
// @version      0.1
// @author       Jaeseo Park
// @description  Invalidate Poster
// @match        https://rarbg.to/torrent/*
// @grant        none
// ==/UserScript==

function apply(xpath, callback) {
  const result = document.evaluate(
    xpath,
    document,
    null,
    XPathResult.ANY_TYPE,
    null
  );

  const nodes = [];
  let node;
  while ((node = result.iterateNext())) {
    nodes.push(node);
  }

  nodes.forEach((node) => callback(node));
}

const invalidate = (node) => {
  node.setAttribute("src", "");
};

function main() {
  apply("//tr/td[2]/img", invalidate);
}

main();
