// ==UserScript==
// @name         Porkbun Sort by Renewal Price
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Hide domains above MAX_RENEWAL_PRICE renewal price and sort by renewal price (low to high)
// @author       You
// @match        https://porkbun.com/checkout/search*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const MAX_RENEWAL_PRICE = 15.00;

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

    // Function to extract first year price from a domain result element
    function getFirstYearPrice(domainElement) {
        const priceContainer = domainElement.querySelector('.searchResultRowPrice');
        if (!priceContainer) {
            return Infinity;
        }
        
        // Look for the main price display (not struck through)
        const priceText = priceContainer.textContent;
        
        // Match patterns like "$1.13" or "$15.99" but not struck through prices
        const priceMatches = priceText.match(/\$([0-9,.]+)(?:\s*\/\s*year|\s*<)/);
        if (priceMatches) {
            return parseFloat(priceMatches[1].replace(',', ''));
        }
        
        // Fallback: look for any price that's not in a struck through element
        const priceElements = priceContainer.querySelectorAll('*');
        for (let element of priceElements) {
            if (element.tagName !== 'S' && element.textContent.includes('$')) {
                const match = element.textContent.match(/\$([0-9,.]+)/);
                if (match) {
                    return parseFloat(match[1].replace(',', ''));
                }
            }
        }
        
        return Infinity;
    }

    // Function to filter and sort domains by renewal price
    function filterAndSortByRenewalPrice() {
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

        // Filter domains by both first year and renewal price (hide those above MAX_RENEWAL_PRICE)
        const filteredDomains = domainElements.filter(element => {
            const renewalPrice = getRenewalPrice(element);
            const firstYearPrice = getFirstYearPrice(element);
            return renewalPrice <= MAX_RENEWAL_PRICE && firstYearPrice < MAX_RENEWAL_PRICE;
        });

        // Sort filtered domains by renewal price
        filteredDomains.sort((a, b) => {
            const priceA = getRenewalPrice(a);
            const priceB = getRenewalPrice(b);
            return priceA - priceB;
        });

        // Remove all existing domain elements
        domainElements.forEach(element => element.remove());

        // Re-append only filtered and sorted elements
        filteredDomains.forEach(element => container.appendChild(element));

        // Hide TLD letter boxes after filtering
        const tldLetterBoxes = document.querySelectorAll('.searchResultsTldLetterBox');
        tldLetterBoxes.forEach(box => {
            box.style.display = 'none';
        });

        // Hide sort by price buttons after filtering
        const sortByPriceButtons = document.querySelectorAll('.sortByPriceButton');
        sortByPriceButtons.forEach(button => {
            button.style.display = 'none';
        });

        const hiddenCount = domainElements.length - filteredDomains.length;
        console.log(`Filtered ${filteredDomains.length} domains (hidden ${hiddenCount} domains with first year or renewal price ≥ $${MAX_RENEWAL_PRICE}) and sorted by renewal price`);
        console.log(`Hidden ${tldLetterBoxes.length} TLD letter box(es)`);
        console.log(`Hidden ${sortByPriceButtons.length} sort by price button(s)`);
        
        // Show a message about filtered results
        if (hiddenCount > 0) {
            showFilterMessage(filteredDomains.length, hiddenCount);
        }
    }

    // Function to show filter message
    function showFilterMessage(shownCount, hiddenCount) {
        // Remove existing message if any
        const existingMessage = document.querySelector('#renewalPriceFilterMessage');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create filter message
        const messageDiv = document.createElement('div');
        messageDiv.id = 'renewalPriceFilterMessage';
        messageDiv.className = 'alert alert-info';
        messageDiv.style.cssText = 'margin: 10px 0; padding: 10px; border-radius: 4px;';
        messageDiv.innerHTML = `
            <strong>Filter Applied:</strong> Showing ${shownCount} domains with both first year and renewal price < $${MAX_RENEWAL_PRICE}.
            <span class="text-muted">(${hiddenCount} domains hidden)</span>
        `;

        // Insert message before the results container
        const resultsContainer = document.querySelector('#searchResultsDomainContainer');
        if (resultsContainer && resultsContainer.parentNode) {
            resultsContainer.parentNode.insertBefore(messageDiv, resultsContainer);
        }
    }

    // Function to check if 'show all extensions' button exists
    function hasShowAllExtensionsButton() {
        // Look for common text patterns for show all extensions button
        const buttons = document.querySelectorAll('button, a, .btn');
        for (let button of buttons) {
            const text = button.textContent.toLowerCase().trim();
            if (text.includes('show all') && text.includes('extension')) {
                return true;
            }
        }
        return false;
    }

    // Function to disable existing sort by price buttons
    function disableExistingSortButtons() {
        const buttons = document.querySelectorAll('button, a, .btn');
        let disabledCount = 0;
        
        for (let button of buttons) {
            const text = button.textContent.toLowerCase().trim();
            if ((text.includes('sort') && text.includes('price')) || 
                (text.includes('price') && text.includes('sort'))) {
                
                // Disable the button
                button.disabled = true;
                button.style.opacity = '0.5';
                button.style.cursor = 'not-allowed';
                button.style.pointerEvents = 'none';
                
                // Add a title to explain why it's disabled
                button.title = 'Disabled by Porkbun Sort by Renewal Price userscript';
                
                // Remove click handlers
                const newButton = button.cloneNode(true);
                button.parentNode.replaceChild(newButton, button);
                
                disabledCount++;
                console.log(`Disabled existing sort by price button: "${button.textContent.trim()}"`);
            }
        }
        
        if (disabledCount > 0) {
            console.log(`Disabled ${disabledCount} existing sort by price button(s)`);
        }
    }

    // Function to create and add the sort button
    function addSortButton() {
        // Wait for the search results container to be available
        const checkForContainer = setInterval(() => {
            const container = document.querySelector('#searchResultsContainer');
            if (container && document.querySelector('#searchResultsDomainContainer')) {
                clearInterval(checkForContainer);
                
                // Check if 'show all extensions' button exists - if so, don't run
                if (hasShowAllExtensionsButton()) {
                    console.log('Show all extensions button found - skipping filter script');
                    return;
                }
                
                // Disable existing sort by price buttons
                disableExistingSortButtons();
                
                // Create the filter and sort button
                const sortButton = document.createElement('button');
                sortButton.id = 'sortByRenewalPriceBtn';
                sortButton.className = 'btn btn-sm btn-primary';
                sortButton.style.cssText = 'margin: 10px 0; margin-right: 10px;';
                sortButton.innerHTML = `<span class="glyphicon glyphicon-filter"></span> Filter & Sort (<$${MAX_RENEWAL_PRICE})`;
                sortButton.onclick = filterAndSortByRenewalPrice;

                // Find a good place to insert the button - before the search results
                const resultsContainer = document.querySelector('#searchResultsDomainContainer');
                if (resultsContainer && resultsContainer.parentNode) {
                    resultsContainer.parentNode.insertBefore(sortButton, resultsContainer);
                    console.log('Filter and sort by renewal price button added');
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
                    // Check if button already exists and show all extensions button is not present
                    if (!document.querySelector('#sortByRenewalPriceBtn') && !hasShowAllExtensionsButton()) {
                        setTimeout(() => {
                            disableExistingSortButtons();
                            addSortButton();
                        }, 100);
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
