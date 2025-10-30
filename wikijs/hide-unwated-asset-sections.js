// ==UserScript==
// @name         Wiki.js Hide Unwanted Asset Sections
// @match        https://sample.domain/e/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Function to hide sections
    function hideSections() {
        const modal = document.querySelector('.editor-modal-media');
        if (!modal) return;

        const sectionsContainer = modal.querySelector('.flex.xs12.lg3');
        if (!sectionsContainer) return;

        const sections = sectionsContainer.querySelectorAll('div');
        sections.forEach(section => {
            const header = section.querySelector('header .v-toolbar__content div');
            if (header) {
                const text = header.textContent.trim();
                if (text === 'Fetch Remote Image' || text === 'Image Alignment') {
                    section.style.display = 'none';
                }
            }
        });
    }

    // Observe for modal
    const observer = new MutationObserver(() => {
        if (document.querySelector('.editor-modal-media')) {
            hideSections();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();