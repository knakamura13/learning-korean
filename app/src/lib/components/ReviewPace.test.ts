import { describe, expect, it } from 'vitest';
import src from './ReviewPace.svelte?raw';

function styleBlock(markup: string): string {
	const match = markup.match(/<style>([\s\S]*?)<\/style>/);
	if (!match) throw new Error('ReviewPace.svelte has no style block');
	return match[1];
}

describe('ReviewPace', () => {
	const css = styleBlock(src);

	it('binds aria-invalid and aria-errormessage for inline input validation', () => {
		expect(src).toMatch(/aria-invalid=\{newPerDayInvalid \? 'true' : undefined\}/);
		expect(src).toMatch(/aria-errormessage=\{newPerDayInvalid \? 'new-per-day-err' : undefined\}/);
		expect(src).toMatch(/aria-invalid=\{reviewsPerSittingInvalid \? 'true' : undefined\}/);
		expect(src).toMatch(/aria-errormessage=\{reviewsPerSittingInvalid \? 'reviews-err' : undefined\}/);
	});

	it('renders error messages with proper ids', () => {
		expect(src).toMatch(/id="new-per-day-err" class="err">Must be 0–50</);
		expect(src).toMatch(/id="reviews-err" class="err">Must be 1–100</);
	});

	it('disables submit button when form is invalid', () => {
		expect(src).toMatch(/disabled=\{saving \|\| formInvalid\}/);
	});

	it('styles aria-invalid inputs and error messages with proper accessibility rules', () => {
		expect(css).toMatch(/\.fields input\[aria-invalid='true'\]\s*\{[^}]*border-color:\s*var\(--bad\)/s);
		expect(css).toMatch(/\.err\s*\{[^}]*color:\s*var\(--bad\)/s);
		expect(css).toMatch(/@media\s*\(forced-colors:\s*active\)/);
	});
});
