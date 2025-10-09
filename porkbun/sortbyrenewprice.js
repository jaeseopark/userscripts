// ==UserScript==
// @name         Porkbun Sort by Renewal Price
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Add a button to sort domain search results by renewal price (low to high)
// @author       You
// @match        https://porkbun.com/checkout/search*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Function to extract renewal price from a domain result element
    function getRenewalPrice(domainElement) {
        const renewsAtContainer = domainElement.querySelector('.renewsAtContainer');
        if (!renewsAtContainer) {
            return Infinity; // Put domains without renewal price at the end
        }
        
        const renewsAtText = renewsAtContainer.textContent;
        const priceMatch = renewsAtText.match(/renews at \$([0-9,.]+)/);
        if (priceMatch) {
            return parseFloat(priceMatch[1].replace(',', ''));
        }
        
        return Infinity;
    }

    // Function to sort domains by renewal price
    function sortByRenewalPrice() {
        const container = document.querySelector('#searchResultsDomainContainer');
        if (!container) {
            console.log('Search results container not found');
            return;
        }

        // Get all domain result elements
        const domainElements = Array.from(container.querySelectorAll('.well'));
        
        if (domainElements.length === 0) {
            console.log('No domain results found');
            return;
        }

        // Sort domains by renewal price
        domainElements.sort((a, b) => {
            const priceA = getRenewalPrice(a);
            const priceB = getRenewalPrice(b);
            return priceA - priceB;
        });

        // Remove all existing domain elements
        domainElements.forEach(element => element.remove());

        // Re-append sorted elements
        domainElements.forEach(element => container.appendChild(element));

        console.log('Domains sorted by renewal price');
    }

    // Function to create and add the sort button
    function addSortButton() {
        // Wait for the search results container to be available
        const checkForContainer = setInterval(() => {
            const container = document.querySelector('#searchResultsContainer');
            if (container && document.querySelector('#searchResultsDomainContainer')) {
                clearInterval(checkForContainer);
                
                // Create the sort button
                const sortButton = document.createElement('button');
                sortButton.id = 'sortByRenewalPriceBtn';
                sortButton.className = 'btn btn-sm btn-default';
                sortButton.style.cssText = 'margin: 10px 0; margin-right: 10px;';
                sortButton.innerHTML = '<span class="glyphicon glyphicon-sort-by-attributes"></span> Sort by Renewal Price';
                sortButton.onclick = sortByRenewalPrice;

                // Find a good place to insert the button - before the search results
                const resultsContainer = document.querySelector('#searchResultsDomainContainer');
                if (resultsContainer && resultsContainer.parentNode) {
                    resultsContainer.parentNode.insertBefore(sortButton, resultsContainer);
                    console.log('Sort by renewal price button added');
                }
            }
        }, 500);

        // Stop checking after 10 seconds to avoid infinite loop
        setTimeout(() => clearInterval(checkForContainer), 10000);
    }

    // Initialize when the page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addSortButton);
    } else {
        addSortButton();
    }

    // Also handle dynamic content loading (in case results are loaded via AJAX)
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                const addedNodes = Array.from(mutation.addedNodes);
                if (addedNodes.some(node => 
                    node.id === 'searchResultsDomainContainer' || 
                    (node.querySelector && node.querySelector('#searchResultsDomainContainer'))
                )) {
                    // Check if button already exists
                    if (!document.querySelector('#sortByRenewalPriceBtn')) {
                        setTimeout(addSortButton, 100);
                    }
                }
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();
