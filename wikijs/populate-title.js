// ==UserScript==
// @name         Wiki.js Title Populator
// @namespace    https://github.com/jaeseopark/userscripts
// @version      0.4
// @description  Add an opt-in button to the path field that populates the title from the last path segment.
// @author       You
// @match        https://sample.domain/e/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

const BUTTON_CLASS = 'populate-title-button';
const WRAPPER_CLASS = 'populate-title-button-wrap';
const ENHANCED_ATTR = 'data-title-populator-enhanced';

;(function () {
	'use strict'

	function toTitleWord(word) {
		if (!word) return ''

		if (/^\d+$/.test(word)) {
			return word
		}

		return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
	}

	function populateTitle(value) {
		return value
			.trim()
			.replace(/-+/g, ' ')
			.replace(/\s+/g, ' ')
			.split(' ')
			.map(toTitleWord)
			.join(' ')
	}

	function findLabeledTextInput(labelText) {
		const labels = Array.from(document.querySelectorAll('.v-text-field__slot > label.v-label'))
		const expected = labelText.trim().toLowerCase()

		for (const label of labels) {
			if (label.textContent.trim().toLowerCase() !== expected) continue

			const field = label.closest('.v-input.v-text-field')
			let input = null

			const forId = label.getAttribute('for')
			if (forId) {
				input = document.getElementById(forId)
			}

			if (!input && field) {
				input = field.querySelector('input[type="text"]')
			}

			if (input) return input
		}

		return null
	}

	function getLastPathSegment(pathValue) {
		const parts = pathValue
			.split('/')
			.map(part => part.trim())
			.filter(Boolean)

		return parts.length ? parts[parts.length - 1] : ''
	}

	function ensureStyles() {
		if (document.querySelector('#populate-title-style')) return

		const style = document.createElement('style')
		style.id = 'populate-title-style'
		style.textContent = `
			.${WRAPPER_CLASS} {
				position: absolute;
				right: 10px;
				top: 50%;
				transform: translateY(-50%);
				display: inline-flex;
				align-items: center;
				z-index: 3;
			}

			.${BUTTON_CLASS} {
				appearance: none;
				border: 0;
				border-radius: 4px;
				padding: 2px 8px;
				font-size: 12px;
				line-height: 1.4;
				cursor: pointer;
				background: #e0f2f1;
				color: #00695c;
			}

			.${BUTTON_CLASS}:hover {
				background: #b2dfdb;
			}

			.${BUTTON_CLASS}:focus {
				outline: 2px solid #26a69a;
				outline-offset: 1px;
			}
		`
		document.head.appendChild(style)
	}

	function addPopulateButton() {
		const pathInput = findLabeledTextInput('Path')
		if (!pathInput) return

		if (pathInput.getAttribute(ENHANCED_ATTR) === 'true') return

		const field = pathInput.closest('.v-input.v-text-field')
		if (!field) return

		const slot = field.querySelector('.v-input__slot')
		if (!slot) return
		slot.style.position = 'relative'

		let appendInner = slot.querySelector(`.${WRAPPER_CLASS}`)
		if (!appendInner) {
			appendInner = document.createElement('div')
			appendInner.className = WRAPPER_CLASS
			slot.appendChild(appendInner)
		}

		let button = appendInner.querySelector(`.${BUTTON_CLASS}`)
		if (!button) {
			button = document.createElement('button')
			button.type = 'button'
			button.className = BUTTON_CLASS
			button.textContent = 'Populate'
			button.title = 'Populate title from the last path segment'

			button.addEventListener('click', () => {
				const titleInput = findLabeledTextInput('Title')
				if (!titleInput) return

				const lastSegment = getLastPathSegment(pathInput.value)
				const populated = populateTitle(lastSegment)
				titleInput.value = populated
				titleInput.dispatchEvent(new Event('input', { bubbles: true }))
				titleInput.dispatchEvent(new Event('change', { bubbles: true }))
			})

			appendInner.appendChild(button)
		}

		pathInput.setAttribute(ENHANCED_ATTR, 'true')
	}

	ensureStyles()
	addPopulateButton()

	const observer = new MutationObserver(() => {
		addPopulateButton()
	})

	observer.observe(document.body, { childList: true, subtree: true })
})()
