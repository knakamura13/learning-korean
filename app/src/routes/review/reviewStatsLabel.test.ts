import { describe, expect, it } from 'vitest';
import src from './+page.svelte?raw';

describe('review stats label', () => {
	it('shows reviewed instead of started for stats.seen', () => {
		expect(src).toMatch(/<span>reviewed<\/span>/);
		expect(src).not.toMatch(/<span>started<\/span>/);
	});

	/**
	 * The second-helping button used to read "Check for more", which hid how
	 * big the next helping was — the same omission the badge made in reverse.
	 * It names the count now (`load.moreAction`).
	 */
	it('offers another sitting, and its size, only when leftover cards are due', () => {
		expect(src).toMatch(/reviewBody\(/);
		expect(src).toMatch(/body === 'check-for-more'/);
		expect(src).toMatch(/body === 'clear'/);
		expect(src).toMatch(/<button class="btn" onclick=\{start\}>\{load\.moreAction\}<\/button>/);
		expect(src).not.toMatch(/Check for more/);
	});

	it('labels the first stat as the sitting rather than the whole pile', () => {
		expect(src).toMatch(/<span>this sitting<\/span>/);
		expect(src).not.toMatch(/<span>to review<\/span>/);
	});
});
