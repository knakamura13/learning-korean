/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from 'vitest';
import { armSkipLanding, disarmSkipLanding } from './skipLanding';

afterEach(() => {
	document.body.replaceChildren();
});

function landmark(): HTMLElement {
	const main = document.createElement('main');
	main.id = 'main';
	document.body.appendChild(main);
	return main;
}

describe('skip landing', () => {
	it('arms a temporary tabindex, marks the skip landing, and focuses the landmark', () => {
		const main = landmark();
		armSkipLanding(main);
		expect(main.getAttribute('tabindex')).toBe('-1');
		expect(main.hasAttribute('data-skip-landed')).toBe(true);
		expect(document.activeElement).toBe(main);
	});

	it('drops the temporary tabindex and skip mark on blur so a later click is quiet', () => {
		const main = landmark();
		armSkipLanding(main);
		disarmSkipLanding(main);
		expect(main.hasAttribute('tabindex')).toBe(false);
		expect(main.hasAttribute('data-skip-landed')).toBe(false);
	});
});
