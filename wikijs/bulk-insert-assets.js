// ==UserScript==
// @name         Wiki.js Multiselect Preview
// @match        https://sample.domain/e/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let filenameIndex = -1; // Index of the Filename column
    let lastClickedIndex = -1; // For Shift+click range selection

    // Function to extract file path from row (adjust based on HTML)
    function getFilePath(row) {
        const cells = row.querySelectorAll('td');
        if (filenameIndex >= 0 && cells[filenameIndex]) {
            const filenameCell = cells[filenameIndex].querySelector('strong');
            if (filenameCell) {
                const filename = filenameCell.textContent.trim();
                return `/pictures/${filename}`;
            }
        }
        return '';
    }

    // Function to update preview
    function updatePreview() {
        const checkboxes = document.querySelectorAll('.asset-checkbox:checked');
        const widthInput = document.querySelector('#image-width');
        const heightInput = document.querySelector('#image-height');
        const width = widthInput ? widthInput.value.trim() : '';
        const height = heightInput ? heightInput.value.trim() : '';
        let dimensions = '';
        if (width || height) {
            dimensions = ` =${width || ''}x${height || ''}`;
        }
        let preview = '';
        checkboxes.forEach(cb => {
            const row = cb.closest('tr');
            const path = getFilePath(row);
            if (path) {
                const alt = path.split('/').pop(); // Use filename as default alt
                const ext = alt.split('.').pop().toLowerCase();
                const isImage = ['jpg', 'jpeg', 'png', 'webp', "gif", "tif", "tiff"].includes(ext);
                const dims = isImage ? dimensions : '';
                preview += `![${alt}](${path}${dims}) `;
            }
        });
        const pre = document.querySelector('#multiselect-preview');
        if (pre) {
            pre.value = preview.trim() || 'No items selected.';
        } else {
            console.error('Preview element not found');
        }
    }

    // Function to add checkboxes to table rows
    function addCheckboxesToTable(table) {
        if (!table) return;
        // Add header if not present
        const thead = table.querySelector('thead tr');
        if (thead && !thead.querySelector('th:first-child').textContent.includes('Select')) {
            const th = document.createElement('th');
            th.textContent = 'Select';
            th.style.width = '50px'; // Limit column width
            thead.insertBefore(th, thead.firstChild);
        }
        // Find filename column index after adding header
        if (thead) {
            const headers = thead.querySelectorAll('th');
            headers.forEach((th, i) => {
                if (th.textContent.trim().includes('Filename')) {
                    filenameIndex = i;
                }
            });
        }
        const tbody = table.querySelector('tbody');
        if (!tbody) return;
        const rows = tbody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            if (row.querySelector('.asset-checkbox')) return; // Already has checkbox
            const td = document.createElement('td');
            td.style.width = '50px'; // Limit column width
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'asset-checkbox';
            checkbox.style.pointerEvents = 'none'; // Make checkbox read-only to avoid duplicate events
            td.appendChild(checkbox);
            row.insertBefore(td, row.firstChild);
            // Make row clickable to toggle checkbox
            row.addEventListener('click', (event) => {
                if (event.target.tagName === 'INPUT') return; // Ignore if clicked on checkbox
                const tbody = row.parentNode;
                const rows = Array.from(tbody.children);
                const currentIndex = rows.indexOf(row);
                // Always toggle the current row
                const cb = row.querySelector('.asset-checkbox');
                if (cb) {
                    cb.checked = !cb.checked;
                }
                const currentState = cb.checked;
                if (event.shiftKey && lastClickedIndex !== -1) {
                    // Shift+click: set range to same state as current
                    const start = Math.min(lastClickedIndex, currentIndex);
                    const end = Math.max(lastClickedIndex, currentIndex);
                    for (let i = start; i <= end; i++) {
                        if (i === currentIndex) continue; // Already set
                        const r = rows[i];
                        const cb2 = r.querySelector('.asset-checkbox');
                        if (cb2) {
                            cb2.checked = currentState;
                        }
                    }
                }
                lastClickedIndex = currentIndex;
                updatePreview();
            });
        });
    }

    // Function to setup modal enhancements
    function setupModal() {
        const modal = document.querySelector('.editor-modal-media');
        if (!modal || modal.dataset.enhanced) return; // Avoid re-enhancing
        modal.dataset.enhanced = true;

        // Add new section as sibling to existing sections (e.g., after "image alignment")
        const sectionsContainer = modal.querySelector('.flex.xs12.lg3'); // Parent of the sections
        if (sectionsContainer) {
            const lastSection = sectionsContainer.lastElementChild; // Assume last is "image alignment"
            const newSection = document.createElement('div');
            newSection.className = 'mt-3 radius-7 animated fadeInRight wait-p4s v-card v-sheet theme--light multiselect-section';
            newSection.innerHTML = `
                <div class="v-card__text pb-0">
                    <header class="radius-7 v-sheet theme--light v-toolbar v-toolbar--dense v-toolbar--flat teal lighten-5" style="height: 48px;">
                        <div class="v-toolbar__content" style="height: 48px;">
                            <i aria-hidden="true" class="v-icon notranslate mr-3 mdi mdi-checkbox-multiple-marked theme--light teal--text"></i>
                            <div class="body-2 teal--text">Multiselect Preview</div>
                        </div>
                    </header>
                    <input type="text" readonly id="multiselect-preview" style="background: #f5f5f5; padding: 10px; border: 1px solid #ddd; margin-top: 10px; width: 100%;" value="No items selected.">
                                        <div style="margin-top: 10px; display: flex; gap: 10px;">
                        <label style="flex: 1;">Width: <input type="number" id="image-width" placeholder="auto" style="width: 100%;"></label>
                        <label style="flex: 1;">Height: <input type="number" id="image-height" placeholder="auto" value="350" style="width: 100%;"></label>
                    </div>
                    <div class="v-card__actions pa-3"></div>
                </div>
            `;
            sectionsContainer.insertBefore(newSection, lastSection.nextSibling);
            // Add listeners to dimension inputs
            const widthInput = document.querySelector('#image-width');
            const heightInput = document.querySelector('#image-height');
            if (widthInput) widthInput.addEventListener('input', updatePreview);
            if (heightInput) heightInput.addEventListener('input', updatePreview);
        } else {
            console.log('Sections container not found, skipping preview section');
        }

        // Add checkbox column to table and observe for changes
        const table = modal.querySelector('table');
        if (table) {
            addCheckboxesToTable(table); // Initial add
            // Observe table for new rows (e.g., if loaded dynamically)
            const tableObserver = new MutationObserver(() => addCheckboxesToTable(table));
            tableObserver.observe(table, { childList: true, subtree: true });
        }
    }

    // Observe for modal
    const observer = new MutationObserver(() => {
        if (document.querySelector('.editor-modal-media')) {
            setupModal();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();