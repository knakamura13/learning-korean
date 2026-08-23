import { describe, expect, it } from 'vitest';
import src from './+page.svelte?raw';

describe('review verdict live region', () => {
	it('keeps a persistent polite verdict region outside the card key', () => {
		expect(src).toMatch(/data-verdict-live[^>]*aria-live="polite"/);
		expect(src).toMatch(/data-verdict-live[^>]*aria-atomic="true"/);

		const sittingStart = src.indexOf("body === 'sitting'");
		expect(sittingStart).toBeGreaterThan(-1);
		const keyedStart = src.indexOf('{#key index}', sittingStart);
		expect(keyedStart).toBeGreaterThan(sittingStart);
		const beforeKey = src.slice(sittingStart, keyedStart);
		expect(beforeKey).toMatch(/data-verdict-live/);

		const fbMatch = src.slice(keyedStart).match(/class="fb"[\s\S]{0,400}/);
		expect(fbMatch?.[0] ?? '').toMatch(/class="fb"/);
		expect(fbMatch?.[0] ?? '').not.toMatch(/aria-live/);
	});
});
