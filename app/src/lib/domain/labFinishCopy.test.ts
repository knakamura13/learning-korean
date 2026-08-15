import { describe, expect, it } from 'vitest';
import { labFinishCopy } from './labFinishCopy';

describe('labFinishCopy', () => {
	it('does not claim a replay unlocked anything', () => {
		expect(labFinishCopy(0, { queue: 10, newLeft: 10, unseen: 9 })).toEqual({
			lead: 'These cards are already in your deck.',
			detail: 'You have 10 waiting.'
		});
	});

	it('separates just-unlocked cards from the daily cap already waiting', () => {
		expect(labFinishCopy(11, { queue: 10, newLeft: 10, unseen: 20 })).toEqual({
			lead: '11 cards unlocked.',
			detail: '10 are due today (daily new-card cap of 10). The rest enter as the cap allows.'
		});
	});

	it('says when today’s cap is full and nothing is due', () => {
		expect(labFinishCopy(11, { queue: 0, newLeft: 0, unseen: 20 })).toEqual({
			lead: '11 cards unlocked.',
			detail: '0 are due today (daily new-card cap of 10). The rest enter as the cap allows.'
		});
	});

	it('treats a small unlock that fits today’s allowance as waiting now', () => {
		expect(labFinishCopy(5, { queue: 5, newLeft: 10, unseen: 5 })).toEqual({
			lead: '5 cards unlocked.',
			detail: 'You have 5 waiting.'
		});
	});
});
