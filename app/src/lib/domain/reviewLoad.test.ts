import { describe, expect, it } from 'vitest';
import { reviewLoadCopy } from './reviewLoad';

describe('reviewLoadCopy', () => {
	it('leads with the sitting and says nothing about a backlog when there is none', () => {
		const copy = reviewLoadCopy({ sitting: 12, backlog: 0 });
		expect(copy.action).toBe('Review 12 cards');
		expect(copy.actionAria).toBe('Review 12 cards');
		expect(copy.navAria).toBe('Review, 12 cards in this sitting');
		expect(copy.backlogNote).toBeNull();
	});

	it('names the backlog as context and explains why it is held back', () => {
		const copy = reviewLoadCopy({ sitting: 25, backlog: 137 }, 10);
		expect(copy.action).toBe('Review 25 cards');
		expect(copy.backlogNote).toBe(
			'137 more are waiting — a sitting takes 10 reviews at a time, so a gap never turns into a long day.'
		);
	});

	/**
	 * The whole point: a returning learner used to be shown 162 where the
	 * sitting was 25. No visible label may quote the pile as the commitment.
	 */
	it('never puts the pile total in an action label', () => {
		const copy = reviewLoadCopy({ sitting: 25, backlog: 137 }, 10);
		for (const label of [copy.action, copy.moreAction]) {
			expect(label).toContain('25');
			expect(label).not.toContain('137');
			expect(label).not.toContain('162');
		}
	});

	it('keeps the visible label a substring of the accessible name (WCAG 2.5.3)', () => {
		for (const load of [
			{ sitting: 1, backlog: 0 },
			{ sitting: 25, backlog: 137 }
		]) {
			const copy = reviewLoadCopy(load);
			expect(copy.actionAria.startsWith(copy.action)).toBe(true);
		}
		expect(reviewLoadCopy({ sitting: 4, backlog: 9 }).navAria.startsWith('Review')).toBe(true);
	});

	it('carries both numbers into the accessible names so nothing is hidden', () => {
		const copy = reviewLoadCopy({ sitting: 25, backlog: 137 }, 10);
		expect(copy.actionAria).toBe('Review 25 cards — 137 more waiting for a later sitting');
		expect(copy.navAria).toBe('Review, 25 cards in this sitting, 137 more waiting');
	});

	it('agrees in number for one card and one waiting card', () => {
		const one = reviewLoadCopy({ sitting: 1, backlog: 1 }, 1);
		expect(one.action).toBe('Review 1 card');
		expect(one.moreAction).toBe('Review 1 more');
		expect(one.backlogNote).toBe(
			'1 more is waiting — a sitting takes 1 review at a time, so a gap never turns into a long day.'
		);
	});

	it('quotes the account per-sitting cap, not the compiled default', () => {
		expect(reviewLoadCopy({ sitting: 25, backlog: 4 }, 25).backlogNote).toContain(
			'a sitting takes 25 reviews at a time'
		);
	});
});
