import { describe, expect, it } from 'vitest';
import { reviewAnswerPlaceholder, reviewChrome } from './reviewChrome';

describe('reviewChrome', () => {
	it('hides stats on a first visit with nothing to save', () => {
		expect(
			reviewChrome({ ready: true, unlocked: 0, inSession: false })
		).toEqual({
			showStandfirst: true,
			showStats: false
		});
	});

	it('puts the card first once a sitting is underway', () => {
		expect(
			reviewChrome({ ready: true, unlocked: 19, inSession: true })
		).toEqual({
			showStandfirst: false,
			showStats: false
		});
	});

	it('restores explanation and stats after the sitting', () => {
		expect(
			reviewChrome({ ready: true, unlocked: 19, inSession: false })
		).toEqual({
			showStandfirst: true,
			showStats: true
		});
	});

	it('shows nothing client-specific until ready', () => {
		expect(
			reviewChrome({ ready: false, unlocked: 0, inSession: false })
		).toEqual({
			showStandfirst: true,
			showStats: false
		});
	});
});

describe('reviewAnswerPlaceholder', () => {
	it('uses spoken-form examples for pronunciation cards', () => {
		expect(reviewAnswerPlaceholder('pron')).toBe('han-gu-geo or 한구거');
	});

	it('hints letter answers without the word romanization', () => {
		expect(reviewAnswerPlaceholder('consonant')).toBe('g, eo, silent');
		expect(reviewAnswerPlaceholder('vowel')).toBe('g, eo, silent');
	});
});
