import { describe, expect, it } from 'vitest';
import src from './+page.svelte?raw';

describe('review stats label', () => {
	it('shows reviewed instead of started for stats.seen', () => {
		expect(src).toMatch(/<span>reviewed<\/span>/);
		expect(src).not.toMatch(/<span>started<\/span>/);
	});

	it('offers Check for more only when leftover cards are due', () => {
		expect(src).toMatch(/reviewBody\(/);
		expect(src).toMatch(/body === 'check-for-more'/);
		expect(src).toMatch(/body === 'clear'/);
		expect(src).toMatch(/<button class="btn" onclick=\{start\}>Check for more<\/button>/);
	});
});
