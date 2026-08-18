import { describe, expect, it } from 'vitest';
import src from './+page.svelte?raw';

describe('review stats label', () => {
	it('shows reviewed instead of started for stats.seen', () => {
		expect(src).toMatch(/<span>reviewed<\/span>/);
		expect(src).not.toMatch(/<span>started<\/span>/);
	});
});
