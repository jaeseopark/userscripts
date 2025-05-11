// ==UserScript==
// @name         Clone and Style <p> with 3+ <img> in elementor-widget-container (Delayed Button)
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Clone and style paragraphs with multiple images in Elementor container after a delay, via a button click. Does not alter original elements or image height.
// @author       You
// @match        https://matrix.pillarnine.com/*
// @grant        none
// ==/UserScript==

(function($) {
    'use strict';

    function findPtagsWithImages() {
        const matchingPs = [];
        $('.elementor-widget-container').each(function() {
            $(this).find('p').each(function() {
                const $p = $(this);
                const $imgs = $p.find('img');
                if ($imgs.length >= 3) {
                    matchingPs.push($p);
                }
            });
        });
        return matchingPs;
    }

    function applyStyling() {
        const $ptags = findPtagsWithImages();
        console.log("Number of <p> tags with at least 3 <img>:", $ptags.length);

        $ptags.forEach(function($p) {
            const $clone = $p.clone();

            // Remove <br> from the clone
            $clone.find('br').remove();

            // Apply grid styling to the clone
            const $imgs = $clone.find('img');
            $clone.css({
                'display': 'grid',
                'gap': '4px',
                'grid-template-columns': `repeat(${Math.min(5, Math.max(3, $imgs.length))}, 1fr)`
            });

            // Create a new <div> container for the clone
            const $divWrapper = $('<div>').addClass('styled-clone-wrapper');

            // Append the styled clone <p> to the new <div>
            $divWrapper.append($clone);

            // Insert the new <div> after the original <p>
            $p.after($divWrapper);

            // Hide the original <p> by setting display: none;
            $p.css('display', 'none');
        });
    }

    $(document).ready(function() {
        setTimeout(applyStyling, 1500);
    });

})(jQuery);
