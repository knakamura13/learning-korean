import { describe, expect, it } from 'vitest';
import { reviewAnswerPlaceholder, reviewChrome } from './reviewChrome';

describe('reviewChrome', () => {
	it('hides backup and stats on a first visit with nothing to save', () => {
		expect(
			reviewChrome({ ready: true, durable: true, unlocked: 0, inSession: false })
		).toEqual({
			showStandfirst: true,
			showStats: false,
			showBackup: false,
			backupFirst: false
		});
	});

	it('puts the card first once a sitting is underway', () => {
		expect(
			reviewChrome({ ready: true, durable: true, unlocked: 19, inSession: true })
		).toEqual({
			showStandfirst: false,
			showStats: false,
			showBackup: true,
			backupFirst: false
		});
	});

	it('keeps backup above the card when storage is not durable', () => {
		expect(
			reviewChrome({ ready: true, durable: false, unlocked: 19, inSession: true })
		).toEqual({
			showStandfirst: false,
			showStats: false,
			showBackup: true,
			backupFirst: true
		});
	});

	it('restores explanation, stats, and backup after the sitting', () => {
		expect(
			reviewChrome({ ready: true, durable: true, unlocked: 19, inSession: false })
		).toEqual({
			showStandfirst: true,
			showStats: true,
			showBackup: true,
			backupFirst: false
		});
	});

	it('shows nothing client-specific until ready', () => {
		expect(
			reviewChrome({ ready: false, durable: true, unlocked: 0, inSession: false })
		).toEqual({
			showStandfirst: true,
			showStats: false,
			showBackup: false,
			backupFirst: false
		});
	});
});

describe('reviewAnswerPlaceholder', () => {
	it('uses spoken-form examples for pronunciation cards', () => {
		expect(reviewAnswerPlaceholder('pron')).toBe('han-gu-geo or 한구거');
	});

	it('hints letter answers without the word romanization', () => {
		expect(reviewAnswerPlaceholder('consonant')).toBe('e.g. g, eo, silent');
		expect(reviewAnswerPlaceholder('vowel')).toBe('e.g. g, eo, silent');
	});
});
