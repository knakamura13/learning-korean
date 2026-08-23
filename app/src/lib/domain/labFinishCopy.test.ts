import { describe, expect, it } from 'vitest';
import { labFinishCopy } from './labFinishCopy';

describe('labFinishCopy', () => {
	it('does not claim a replay unlocked anything', () => {
		expect(labFinishCopy(0, { sitting: 10, backlog: 0, newLeft: 10, unseen: 9 })).toEqual({
			lead: 'These cards are already in Review.',
			detail: 'Your next sitting is 10 cards.'
		});
	});

	it('separates just-unlocked cards from the daily cap that holds them back', () => {
		expect(labFinishCopy(11, { sitting: 10, backlog: 0, newLeft: 10, unseen: 20 })).toEqual({
			lead: '11 cards unlocked.',
			detail:
				'Your next sitting is 10 cards — new cards enter 10 a day, so the rest arrive as the cap allows.'
		});
	});

	it('says plainly when today’s cap is full and nothing is due', () => {
		expect(labFinishCopy(11, { sitting: 0, backlog: 0, newLeft: 0, unseen: 20 })).toEqual({
			lead: '11 cards unlocked.',
			detail:
				'Nothing is due right now — new cards enter 10 a day, so the rest arrive as the cap allows.'
		});
	});

	it('treats a small unlock that fits today’s allowance as the whole sitting', () => {
		expect(labFinishCopy(5, { sitting: 5, backlog: 0, newLeft: 10, unseen: 5 })).toEqual({
			lead: '5 cards unlocked.',
			detail: 'Your next sitting is 5 cards.'
		});
	});

	/**
	 * The regression this file exists for: a returning learner used to be told
	 * "162 are due today (daily new-card cap of 10)" — a sentence that
	 * contradicted itself and quoted six sittings as one.
	 */
	it('never quotes the backlog as the sitting', () => {
		const copy = labFinishCopy(10, { sitting: 25, backlog: 137, newLeft: 10, unseen: 40 });
		expect(copy.detail).toContain('Your next sitting is 25 cards');
		expect(copy.detail).toContain('137 more waiting after it');
		expect(copy.detail).not.toMatch(/\b162\b/);
		expect(copy.detail).not.toMatch(/137 (?:are |is )?due today/);
	});

	it('uses a singular card when the sitting is one', () => {
		expect(labFinishCopy(1, { sitting: 1, backlog: 0, newLeft: 10, unseen: 0 }).detail).toBe(
			'Your next sitting is 1 card.'
		);
	});
});
