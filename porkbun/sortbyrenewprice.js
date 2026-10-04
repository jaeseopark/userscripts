// ==UserScript==
// @name         Porkbun Sort by Renewal Price
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Hide domains above custom renewal price limit and sort by renewal price (low to high)
// @author       You
// @match        https://porkbun.com/checkout/search*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let DEFAULT_MAX_RENEWAL_PRICE = 15.00;

    // Helper to get current max price limit from the input field
    function getMaxPriceLimit() {
        const input = document.querySelector('#maxRenewalPriceInput');
        if (input) {
            const val = parseFloat(input.value);
            return isNaN(val) ? DEFAULT_MAX_RENEWAL_PRICE : val;
        }
        return DEFAULT_MAX_RENEWAL_PRICE;
    }

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
        const maxPrice = getMaxPriceLimit();
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

        // Filter domains by both first year and renewal price (hide those above maxPrice)
        const filteredDomains = domainElements.filter(element => {
            const renewalPrice = getRenewalPrice(element);
            const firstYearPrice = getFirstYearPrice(element);
            return renewalPrice <= maxPrice && firstYearPrice < maxPrice;
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
        console.log(`Filtered ${filteredDomains.length} domains (hidden ${hiddenCount} domains with first year or renewal price ≥ $${maxPrice}) and sorted by renewal price`);
        console.log(`Hidden ${tldLetterBoxes.length} TLD letter box(es)`);
        console.log(`Hidden ${sortByPriceButtons.length} sort by price button(s)`);
        
        // Show a message about filtered results
        if (hiddenCount > 0) {
            showFilterMessage(filteredDomains.length, hiddenCount, maxPrice);
        }
    }

    // Function to show filter message
    function showFilterMessage(shownCount, hiddenCount, maxPrice) {
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
            <strong>Filter Applied:</strong> Showing ${shownCount} domains with both first year and renewal price < $${maxPrice}.
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
                
                button.disabled = true;
                button.style.opacity = '0.5';
                button.style.cursor = 'not-allowed';
                button.style.pointerEvents = 'none';
                button.title = 'Disabled by Porkbun Sort by Renewal Price userscript';
                
                const newButton = button.cloneNode(true);
                button.parentNode.replaceChild(newButton, button);
                
                disabledCount++;
            }
        }
    }

    // Function to create and add the price input and sort button
    function addSortControls() {
        const checkForContainer = setInterval(() => {
            const container = document.querySelector('#searchResultsContainer');
            if (container && document.querySelector('#searchResultsDomainContainer')) {
                clearInterval(checkForContainer);
                
                if (hasShowAllExtensionsButton()) {
                    console.log('Show all extensions button found - skipping filter script');
                    return;
                }
                
                disableExistingSortButtons();
                
                if (document.querySelector('#renewalPriceFilterContainer')) {
                    return;
                }

                // Create wrapper container for input + button
                const controlWrapper = document.createElement('div');
                controlWrapper.id = 'renewalPriceFilterContainer';
                controlWrapper.style.cssText = 'display: inline-flex; align-items: center; gap: 6px; margin: 10px 0;';

                // Create input element
                const input = document.createElement('input');
                input.id = 'maxRenewalPriceInput';
                input.type = 'number';
                input.value = DEFAULT_MAX_RENEWAL_PRICE;
                input.step = '1';
                input.min = '0';
                input.className = 'form-control input-sm';
                input.style.cssText = 'width: 80px; display: inline-block; text-align: center;';
                input.title = 'Maximum Price Limit ($)';

                // Create button element
                const sortButton = document.createElement('button');
                sortButton.id = 'sortByRenewalPriceBtn';
                sortButton.className = 'btn btn-sm btn-primary';
                sortButton.innerHTML = `<span class="glyphicon glyphicon-filter"></span> Filter & Sort (<$${input.value})`;
                sortButton.onclick = filterAndSortByRenewalPrice;

                // Update button text when user modifies input
                input.addEventListener('input', () => {
                    const val = input.value || '0';
                    sortButton.innerHTML = `<span class="glyphicon glyphicon-filter"></span> Filter & Sort (<$${val})`;
                });

                // Trigger filtering when pressing Enter inside input
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        filterAndSortByRenewalPrice();
                    }
                });

                controlWrapper.appendChild(input);
                controlWrapper.appendChild(sortButton);

                // Insert wrapper before domain results
                const resultsContainer = document.querySelector('#searchResultsDomainContainer');
                if (resultsContainer && resultsContainer.parentNode) {
                    resultsContainer.parentNode.insertBefore(controlWrapper, resultsContainer);
                    console.log('Filter controls added');
                }
            }
        }, 500);

        setTimeout(() => clearInterval(checkForContainer), 10000);
    }

    // Initialize when the page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addSortControls);
    } else {
        addSortControls();
    }

    // Handle dynamic content loading
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                const addedNodes = Array.from(mutation.addedNodes);
                if (addedNodes.some(node => 
                    node.id === 'searchResultsDomainContainer' || 
                    (node.querySelector && node.querySelector('#searchResultsDomainContainer'))
                )) {
                    if (!document.querySelector('#renewalPriceFilterContainer') && !hasShowAllExtensionsButton()) {
                        setTimeout(() => {
                            disableExistingSortButtons();
                            addSortControls();
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
