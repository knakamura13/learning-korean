import { describe, expect, it } from 'vitest';
import { DECK } from './deck';
import { RELEARN_MS } from './srs';
import {
	MAX_SITTING_LENGTH,
	REVIEW_ANSWER_MAX_LENGTH,
	reviewAnswerPlaceholder,
	reviewBody,
	reviewChrome,
	reviewIntervalCopy,
	sittingQueueAfterGrade
} from './reviewChrome';

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

	it('shows the Review pile until the learner starts the sitting', () => {
		expect(reviewBody({ ...sitting, begun: false })).toBe('pile');
	});

	it('shows the card while a sitting is underway', () => {
		expect(reviewBody({ ...sitting, begun: true })).toBe('sitting');
	});

	it('offers check for more only when the scheduler still has due cards', () => {
		expect(reviewBody({ ...sitting, index: 5, remainingDue: 3, begun: true })).toBe(
			'check-for-more'
		);
	});

	it('goes straight to Review is clear when the sitting is done and nothing is due', () => {
		expect(reviewBody({ ...sitting, index: 5, remainingDue: 0, begun: true })).toBe('clear');
	});

	it('shows Review is clear on load when the queue is empty', () => {
		expect(
			reviewBody({
				ready: true,
				unlocked: 19,
				sittingLength: 0,
				index: 0,
				remainingDue: 0,
				begun: false
			})
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

describe('reviewIntervalCopy', () => {
	it('names the relearn window from RELEARN_MS, not a handwritten 10 minutes', () => {
		const minutes = Math.round(RELEARN_MS / 60_000);
		expect(reviewIntervalCopy(0)).toBe(`again in ${minutes} minutes`);
	});

	it('uses day language once the card has left the sitting', () => {
		expect(reviewIntervalCopy(1)).toBe('again in 1 day');
		expect(reviewIntervalCopy(1.9)).toBe('again in 1 day');
		expect(reviewIntervalCopy(2)).toBe('again in 2 days');
		expect(reviewIntervalCopy(3.4)).toBe('again in 3 days');
	});
});

describe('sittingQueueAfterGrade', () => {
	const a = { id: 'a' };
	const b = { id: 'b' };

	it('appends a miss to the end of this sitting once', () => {
		expect(sittingQueueAfterGrade([a, b], 0, true)).toEqual([a, b, a]);
	});

	it('does not append an earlier miss that already has a later copy', () => {
		expect(sittingQueueAfterGrade([a, b, a], 0, true)).toEqual([a, b, a]);
	});

	it('appends again when the miss is the last copy in the sitting', () => {
		expect(sittingQueueAfterGrade([a, b, a], 2, true)).toEqual([a, b, a, a]);
	});

	it('leaves the queue alone on a correct answer', () => {
		const queue = [a, b];
		expect(sittingQueueAfterGrade(queue, 0, false)).toBe(queue);
	});

	it('stops growing once the sitting hits the cap', () => {
		const queue = Array.from({ length: MAX_SITTING_LENGTH }, (_, i) => ({ id: String(i) }));
		expect(sittingQueueAfterGrade(queue, 0, true)).toBe(queue);
	});
});

describe('REVIEW_ANSWER_MAX_LENGTH', () => {
	it('is longer than every accepted deck answer, including Hangul pronunciations', () => {
		expect(REVIEW_ANSWER_MAX_LENGTH).toBeGreaterThanOrEqual(32);
		for (const card of DECK) {
			for (const answer of card.answers) {
				expect(answer.length, `${card.id} / ${answer}`).toBeLessThan(REVIEW_ANSWER_MAX_LENGTH);
			}
		}
	});
});
