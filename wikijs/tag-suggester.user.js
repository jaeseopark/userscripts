// ==UserScript==
// @name         Wiki.js Tag Suggester
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Suggest tags for Wiki.js pages using OpenAI
// @author       You
// @match        https://wiki.sample.domain/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Check if admin button exists (bonus requirement)
    const adminButton = document.querySelector('a[href="/a"]');
    const sidebar = document.querySelector('.flex.page-col-sd');
    const shortcutsCard = sidebar.querySelector('.page-shortcuts-card');
    if (!adminButton || !shortcutsCard) {
        console.log('Admin button or shortcuts card not found, tag suggestion script not running');
        return;
    }

    // Add CSS animation for spinner
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

    // OpenAI API key placeholder
    // TODO: Replace with your actual OpenAI API key (leave empty to disable integration and suggest all available tags)
    const OPENAI_API_KEY = '';

    // Selected suggestions for batch application
    let selectedSuggestions = [];

    // Loading state for apply button
    let isApplyingTags = false;

    // Function to set apply button loading state
    const setApplyButtonLoading = (loading) => {
        const applyButton = document.querySelector('.apply-tags-btn');
        if (!applyButton) return;

        isApplyingTags = loading;

        // Get tags container and related interactive elements
        const tagsContainer = getTagsContainer();
        const suggestedTags = tagsContainer ? tagsContainer.querySelectorAll('.suggested-tag') : [];
        const pagesMatchingButton = document.querySelector('.mdi-tag-multiple')?.closest('a, button');
        const suggestButton = tagsContainer ? tagsContainer.querySelector('.analyze-btn') : null;

        if (loading) {
            // Disable apply button with spinner
            applyButton.innerHTML = '<i aria-hidden="true" class="v-icon notranslate v-icon--left mdi mdi-refresh theme--light grey--text" style="font-size: 16px; animation: spin 1s linear infinite;"></i><span class="grey--text text--darken-2">Applying...</span>';
            applyButton.style.opacity = '0.7';
            applyButton.style.pointerEvents = 'none';

            // Disable all suggested tag chips
            suggestedTags.forEach(chip => {
                chip.style.opacity = '0.5';
                chip.style.pointerEvents = 'none';
            });

            // Disable pages matching button if it exists
            if (pagesMatchingButton) {
                pagesMatchingButton.style.opacity = '0.5';
                pagesMatchingButton.style.pointerEvents = 'none';
            }

            // Disable suggest button if it exists
            if (suggestButton) {
                suggestButton.style.opacity = '0.5';
                suggestButton.style.pointerEvents = 'none';
            }
        } else {
            // Re-enable apply button
            applyButton.innerHTML = '<span class="grey--text text--darken-2">Apply Selected Tags</span>';
            // Restore normal state based on selection
            if (selectedSuggestions.length === 0) {
                applyButton.style.opacity = '0.5';
                applyButton.style.pointerEvents = 'none';
            } else {
                applyButton.style.opacity = '1';
                applyButton.style.pointerEvents = 'auto';
            }

            // Re-enable all suggested tag chips
            suggestedTags.forEach(chip => {
                chip.style.opacity = '1';
                chip.style.pointerEvents = 'auto';
            });

            // Re-enable pages matching button if it exists
            if (pagesMatchingButton) {
                pagesMatchingButton.style.opacity = '1';
                pagesMatchingButton.style.pointerEvents = 'auto';
            }

            // Re-enable suggest button if it exists
            if (suggestButton) {
                suggestButton.style.opacity = '1';
                suggestButton.style.pointerEvents = 'auto';
            }
        }
    };

    // Placeholder function for prompt generation
    // TODO: Implement proper prompt generation based on content and available tags
    const getPrompt = (normalizedPostContent, availableTags) => {
        return `Analyze the following Wiki.js page content and suggest relevant tags. Available tags: ${availableTags.join(', ')}\n\nContent:\n${normalizedPostContent}\n\nSuggest 3-5 tags as a JSON array.`;
    };

    // Function to get page content
    const getPageContent = () => {
        const contentsDiv = document.querySelector('.contents');
        return contentsDiv ? contentsDiv.textContent.trim() : '';
    };

    // Function to get available tags (placeholder - you might need to fetch from API)
    const getAvailableTags = async () => {
        try {
            const query = {
                operationName: null,
                variables: {},
                query: `
                    query {
                        pages {
                            tags {
                                tag
                                title
                            }
                        }
                    }
                `
            };

            const response = await fetch('/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(query)
            });

            const result = await response.json();
            return result.data?.pages?.tags?.map(tag => tag.title) || [];
        } catch (error) {
            console.error('Error fetching available tags:', error);
            return [];
        }
    };

    // Function to get existing tags from the page
    const getExistingTags = () => {
        // Only select actual tag links, not buttons or suggested tags
        const chips = document.querySelectorAll('.page-tags-card .pa-5 a.v-chip:not(.suggested-tag)');
        return Array.from(chips).map(chip => chip.textContent.trim()).filter(tag => tag && tag.trim().length > 0);
    };

    // Function to call OpenAI API
    const callOpenAI = async (prompt) => {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 100
            })
        });
        const data = await response.json();
        return data.choices[0].message.content;
    };

    // Function to parse OpenAI response
    const parseSuggestions = (response) => {
        try {
            return JSON.parse(response);
        } catch (e) {
            // Fallback: extract tags from text
            const matches = response.match(/["']([^"']+)["']/g);
            return matches ? matches.map(m => m.slice(1, -1)) : [];
        }
    };

    // Function to get page path from URL
    const getPagePath = () => {
        const path = window.location.pathname;
        // Remove leading / and locale if present
        return path.replace(/^\/(en\/)?/, '');
    };

    // Function to get page ID
    // lightweight graphql call to get page ID by path (to avoid fetching all pages with every content load)
    const getPageId = async (path) => {
        const query = {
            operationName: null,
            variables: {},
            query: `
                query {
                    pages {
                        list {
                            id
                            path
                            title
                        }
                    }
                }
            `
        };

        const response = await fetch('/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(query)
        });

        const result = await response.json();
        const pages = result.data?.pages?.list || [];
        const page = pages.find(p => p.path === path);
        return page ? page.id : null;
    };

    // Function to get page data via graphql
    const getPageData = async (id) => {
        try {
            console.log(`Fetching page data for ID: ${id}`);

            const query = {
                operationName: null,
                variables: { id: id },
                query: `
                    query ($id: Int!) {
                        pages {
                            single(id: $id) {
                                id
                                content
                                description
                                editor
                                isPrivate
                                isPublished
                                locale
                                path
                                publishEndDate
                                publishStartDate
                                scriptCss
                                scriptJs
                                tags {
                                    tag
                                    title
                                }
                                title
                            }
                        }
                    }
                `
            };

            const response = await fetch('/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(query)
            });

            if (!response.ok) {
                console.error(`HTTP error fetching page data for ID ${id}: ${response.status} ${response.statusText}`);
                return null;
            }

            const result = await response.json();

            if (result.errors) {
                console.error(`GraphQL errors fetching page data for ID ${id}:`, result.errors);
                return null;
            }

            const pageData = result.data?.pages?.single;
            if (!pageData) {
                console.warn(`No page data found for ID: ${id}`);
                return null;
            }

            return pageData;
        } catch (error) {
            console.error(`Unexpected error fetching page data for ID ${id}:`, error);
            return null;
        }
    };

    // Function to update tags via GraphQL
    const updateTags = async (newTags) => {
        const path = getPagePath();
        const id = await getPageId(path);
        if (!id) {
            console.error('Could not get page ID');
            return;
        }

        // Get current page data
        const pageData = await getPageData(id);
        if (!pageData) {
            console.error('Could not get page data');
            return;
        }

        // Get existing tags
        const existingTags = getExistingTags();
        console.log('Existing tags:', existingTags);

        const allTags = [...new Set([...existingTags, ...newTags])];
        console.log('Combined tags for update:', allTags);

        const mutation = {
            operationName: null,
            variables: {
                id: id,
                content: pageData.content,
                description: pageData.description,
                editor: pageData.editor,
                isPrivate: pageData.isPrivate,
                isPublished: pageData.isPublished,
                locale: pageData.locale,
                path: pageData.path,
                publishEndDate: pageData.publishEndDate,
                publishStartDate: pageData.publishStartDate,
                scriptCss: pageData.scriptCss,
                scriptJs: pageData.scriptJs,
                tags: allTags,
                title: pageData.title
            },
            query: `
                mutation ($id: Int!, $content: String, $description: String, $editor: String, $isPrivate: Boolean, $isPublished: Boolean, $locale: String, $path: String, $publishEndDate: Date, $publishStartDate: Date, $scriptCss: String, $scriptJs: String, $tags: [String], $title: String) {
                    pages {
                        update(id: $id, content: $content, description: $description, editor: $editor, isPrivate: $isPrivate, isPublished: $isPublished, locale: $locale, path: $path, publishEndDate: $publishEndDate, publishStartDate: $publishStartDate, scriptCss: $scriptCss, scriptJs: $scriptJs, tags: $tags, title: $title) {
                            responseResult {
                                succeeded
                                errorCode
                                message
                            }
                        }
                    }
                }
            `
        };

        const response = await fetch('/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Include cookies
            body: JSON.stringify(mutation)
        });

        const result = await response.json();
        if (result.data.pages.update.responseResult.succeeded) {
            console.log('Tags updated successfully');
            return true; // Indicate success
        } else {
            console.error('Failed to update tags:', result.data.pages.update.responseResult.message);
            return false;
        }
    };

    // Function to create tags section
    const createTagsSection = () => {
        if (!sidebar) return null;

        const pageTagsCard = document.createElement('div');
        pageTagsCard.className = 'page-tags-card mb-5 v-card v-sheet theme--light';

        const pa5 = document.createElement('div');
        pa5.className = 'pa-5';

        const overline = document.createElement('div');
        overline.className = 'overline teal--text pb-2';
        overline.textContent = 'Tags';

        pa5.appendChild(overline);
        pageTagsCard.appendChild(pa5);

        // Insert before the page shortcuts section (which is always present)
        if (shortcutsCard) {
            shortcutsCard.insertAdjacentElement('beforebegin', pageTagsCard);
        } else {
            // Fallback: insert as a child of sidebar
            sidebar.appendChild(pageTagsCard);
        }

        return pa5;
    };

    // Function to find or create tags section
    const getTagsContainer = () => {
        let tagsContainer = document.querySelector('.page-tags-card .pa-5');
        if (!tagsContainer) {
            tagsContainer = createTagsSection();
        }
        return tagsContainer;
    };

    // Function to add analyze button
    const addAnalyzeButton = (container) => {
        const button = document.createElement('span');
        button.className = 'mr-1 mb-1 v-chip v-chip--clickable v-chip--label theme--light v-size--default teal lighten-5 analyze-btn';
        button.innerHTML = '<span class="teal--text text--darken-2">Analyze</span>';
        button.style.cursor = 'pointer';
        button.onclick = handleAnalyze;
        container.appendChild(button);
        container.appendChild(document.createTextNode(' '));
    };

    // Function to display suggestions
    const displaySuggestions = (suggestions, container) => {
        // Remove existing suggestions
        const existingSuggestions = container.querySelector('.tag-suggestions');
        if (existingSuggestions) {
            existingSuggestions.remove();
        }

        const suggestionsDiv = document.createElement('div');
        suggestionsDiv.className = 'tag-suggestions';
        suggestionsDiv.style.display = ''; // Ensure visible when created

        suggestions.forEach(tag => {
            const chip = document.createElement('span');
            chip.className = 'mr-1 mb-1 v-chip v-chip--clickable v-chip--label theme--light v-size--default blue lighten-5 suggested-tag';
            const isSelected = selectedSuggestions.includes(tag);
            chip.innerHTML = `<i aria-hidden="true" class="v-icon notranslate v-icon--left mdi ${isSelected ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline'} theme--light blue--text" style="font-size: 16px;"></i><span class="blue--text text--darken-2">${tag}</span>`;
            chip.onclick = () => toggleSuggestion(tag, chip);
            suggestionsDiv.appendChild(chip);
            suggestionsDiv.appendChild(document.createTextNode(' '));
        });

        // Add Apply button with tag-like styling
        const applyButton = document.createElement('span');
        applyButton.className = 'mr-1 mb-1 v-chip v-chip--clickable v-chip--label theme--light v-size--default grey lighten-4 apply-tags-btn';
        applyButton.innerHTML = '<span class="grey--text text--darken-2">Apply Selected Tags</span>';
        applyButton.style.cursor = 'pointer';
        applyButton.onclick = applySelectedTags;
        if (selectedSuggestions.length === 0 || isApplyingTags) {
            applyButton.style.opacity = '0.5';
            applyButton.style.pointerEvents = 'none';
        }
        suggestionsDiv.appendChild(applyButton);

        container.appendChild(suggestionsDiv);
    };

    // Function to toggle suggestion selection
    const toggleSuggestion = (tag, chip) => {
        if (isApplyingTags) return; // Prevent toggling while applying

        const index = selectedSuggestions.indexOf(tag);
        if (index > -1) {
            selectedSuggestions.splice(index, 1);
            chip.innerHTML = `<i aria-hidden="true" class="v-icon notranslate v-icon--left mdi mdi-checkbox-blank-outline theme--light blue--text" style="font-size: 16px;"></i><span class="blue--text text--darken-2">${tag}</span>`;
        } else {
            selectedSuggestions.push(tag);
            chip.innerHTML = `<i aria-hidden="true" class="v-icon notranslate v-icon--left mdi mdi-checkbox-marked theme--light blue--text" style="font-size: 16px;"></i><span class="blue--text text--darken-2">${tag}</span>`;
        }
        // Update apply button
        const applyButton = document.querySelector('.apply-tags-btn');
        if (applyButton && !isApplyingTags) {
            if (selectedSuggestions.length === 0) {
                applyButton.style.opacity = '0.5';
                applyButton.style.pointerEvents = 'none';
            } else {
                applyButton.style.opacity = '1';
                applyButton.style.pointerEvents = 'auto';
            }
        }
    };

    // Function to apply selected tags
    const applySelectedTags = async () => {
        if (selectedSuggestions.length === 0 || isApplyingTags) return;

        // Filter out blank tags and duplicates
        const filteredTags = [...new Set(selectedSuggestions.filter(tag => tag && tag.trim().length > 0))];
        if (filteredTags.length === 0) {
            console.warn('No valid tags to apply after filtering');
            return;
        }

        // Set loading state
        setApplyButtonLoading(true);

        try {
            console.log('Applying selected tags:', filteredTags);
            const success = await updateTags(filteredTags);
            if (!success) {
                console.error('Failed to apply selected tags:', filteredTags);
                alert('Failed to update tags. Check console for details.');
                return;
            }

            console.log('Successfully applied tags, updating UI...');
            // Manually update UI
            const container = getTagsContainer();
            
            // Find the insertion point - before the mdi-tag-multiple element (Pages matching tags button)
            const pagesMatchingIcon = container.querySelector('.mdi-tag-multiple');
            const insertionPoint = pagesMatchingIcon ? pagesMatchingIcon.closest('a, button') : (container.querySelector('.analyze-btn') || container.lastChild);
            
            filteredTags.forEach(tag => {
                const chip = document.createElement('a');
                chip.href = `/t/${encodeURIComponent(tag)}`;
                chip.className = 'mr-1 mb-1 v-chip v-chip--clickable v-chip--label v-chip--link theme--light v-size--default teal lighten-5';
                chip.innerHTML = `<i aria-hidden="true" class="v-icon notranslate v-icon--left mdi mdi-tag theme--light teal--text" style="font-size: 16px;"></i><span class="teal--text text--darken-2">${tag}</span>`;
                container.insertBefore(chip, insertionPoint);
                container.insertBefore(document.createTextNode(' '), insertionPoint);
            });

            // Clear selected suggestions
            selectedSuggestions = [];
            console.log('Cleared selected suggestions');

            // Refresh suggestions to show remaining available tags
            console.log('Refreshing suggestions after successful tag application...');
            setApplyButtonLoading(false);
            handleAnalyze();
        } finally {
            // Always restore loading state
            setApplyButtonLoading(false);
        }
    };

    // Function to toggle suggestions visibility
    const toggleSuggestions = async () => {
        const container = getTagsContainer();
        const existingSuggestions = container.querySelector('.tag-suggestions');

        if (existingSuggestions) {
            // Toggle visibility
            if (existingSuggestions.style.display === 'none') {
                existingSuggestions.style.display = '';
                console.log('Suggestions shown');
            } else {
                existingSuggestions.style.display = 'none';
                console.log('Suggestions hidden');
            }
        } else {
            // No suggestions exist, create them
            console.log('No existing suggestions, creating new ones');
            await handleAnalyze();
        }
    };

    // Main analyze function
    const handleAnalyze = async () => {
        if (isApplyingTags) {
            console.log('Analysis skipped - currently applying tags');
            return;
        }

        console.log('Starting tag analysis...');
        const availableTags = await getAvailableTags();
        console.log('Available tags count:', availableTags.length);

        const existingTags = getExistingTags();
        console.log('Existing tags on page:', existingTags);

        let suggestions;

        if (OPENAI_API_KEY) {
            console.log('Using OpenAI for tag suggestions');
            const content = getPageContent();
            console.log('Page content length:', content.length, 'characters');

            const prompt = getPrompt(content, availableTags);
            console.log('Generated prompt for OpenAI');

            try {
                const response = await callOpenAI(prompt);
                console.log('OpenAI response received');
                suggestions = parseSuggestions(response);
                console.log('Parsed suggestions:', suggestions);
            } catch (error) {
                console.error('Error analyzing content with OpenAI:', error);
                console.error('Stack trace:', error.stack);
                alert('Error analyzing content. Check console for details.');
                return;
            }
        } else {
            console.log('Using all available tags as suggestions (no OpenAI key)');
            suggestions = availableTags;
        }

        // Filter out existing tags and blank tags
        suggestions = suggestions.filter(tag =>
            tag &&
            tag.trim().length > 0 &&
            !existingTags.includes(tag.trim())
        );
        console.log('Filtered suggestions (excluding existing and blank):', suggestions);

        const container = getTagsContainer();
        displaySuggestions(suggestions, container);
        console.log('Tag suggestions displayed');
    };

    // Initialize
    const init = () => {
        const tagsContainer = getTagsContainer();
        if (tagsContainer) {
            // Don't show suggestions by default - wait for user interaction
            // Look for the existing "Pages matching tags" button within our tags section
            const pagesMatchingButton = tagsContainer.querySelector('.mdi-tag-multiple')?.closest('a, button');

            if (pagesMatchingButton) {
                console.log('Found "Pages matching tags" button, modifying behavior');
                pagesMatchingButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Intercepted "Pages matching tags" button click, toggling suggestions');
                    toggleSuggestions();
                });
            } else {
                console.log('No "Pages matching tags" button found, adding fallback suggest button');
                // Fallback: add suggest button with same icon as multi-tag button
                const button = document.createElement('a');
                button.className = 'mr-1 mb-1 v-chip v-chip--clickable theme--light v-size--default teal lighten-5';
                button.innerHTML = '<i aria-hidden="true" class="v-icon notranslate mdi mdi-tag-multiple theme--light teal--text" style="font-size: 16px;"></i>';
                button.style.cursor = 'pointer';
                button.title = 'Suggest Tags';
                button.onclick = toggleSuggestions;
                tagsContainer.appendChild(button);
                tagsContainer.appendChild(document.createTextNode(' '));
            }
        }
    };

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
