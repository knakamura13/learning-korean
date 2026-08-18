import { describe, expect, it } from 'vitest';
import { reviewAnswerPlaceholder, reviewBody, reviewChrome } from './reviewChrome';

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

describe('reviewBody', () => {
	const sitting = {
		ready: true,
		unlocked: 19,
		sittingLength: 5,
		index: 0,
		remainingDue: 5
	};

	it('waits until the client is ready', () => {
		expect(reviewBody({ ...sitting, ready: false, unlocked: 0, sittingLength: 0, remainingDue: 0 })).toBe(
			'loading'
		);
	});

	it('keeps labs as the door when nothing is unlocked', () => {
		expect(
			reviewBody({ ready: true, unlocked: 0, sittingLength: 0, index: 0, remainingDue: 0 })
		).toBe('locked');
	});

	it('shows the card while a sitting is underway', () => {
		expect(reviewBody(sitting)).toBe('sitting');
	});

	it('offers check for more only when the scheduler still has due cards', () => {
		expect(reviewBody({ ...sitting, index: 5, remainingDue: 3 })).toBe('check-for-more');
	});

	it('goes straight to Review is clear when the sitting is done and nothing is due', () => {
		expect(reviewBody({ ...sitting, index: 5, remainingDue: 0 })).toBe('clear');
	});

	it('shows Review is clear on load when the queue is empty', () => {
		expect(
			reviewBody({ ready: true, unlocked: 19, sittingLength: 0, index: 0, remainingDue: 0 })
		).toBe('clear');
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
