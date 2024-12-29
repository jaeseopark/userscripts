// ==UserScript==
// @name           Highlight popular posts
// @namespace      www.redflagdeals.com
// @description    Colourcodes vote counters and make them larger
// @include        https://forums.redflagdeals.com/*
// @require        https://code.jquery.com/jquery-3.6.0.slim.min.js
// ==/UserScript==

const RED_THRESHOLD = 50;

function highlightByVotes() {
    $("li.topic").each(function () {
        let voteElement = null;
        let votes = 0;
        try {
            voteElement = $(this).find(".votes");
            votes = parseInt(voteElement.find("span").html());
        } catch {
            return;
        }
        
        const styleObject = {
            'background-color': 'transparent',
            'color': 'unset'
        }

        if (votes >= RED_THRESHOLD) {
            styleObject["background-color"] = 'crimson';
            styleObject["color"] = 'white';
            styleObject["font-size"] = "large";
            styleObject["padding"] = "0.5em";
        }

        voteElement.css(styleObject);
    });
}

highlightByVotes();
