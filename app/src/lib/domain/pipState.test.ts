import { describe, expect, it } from 'vitest';
import {
	emptyOutcomes,
	holdFurthest,
	pipIsJumpTarget,
	pipKind,
	pipLabel,
	reviveOutcomes,
	type CardOutcome
} from './pipState';

const outcomes = (cells: (CardOutcome | null)[]) => cells;

describe('reviveOutcomes', () => {
	it('pads a missing payload with nulls', () => {
		expect(reviveOutcomes(undefined, 3)).toEqual([null, null, null]);
		expect(emptyOutcomes(0)).toEqual([]);
	});

	it('keeps right/wrong and drops junk', () => {
		expect(reviveOutcomes(['right', 'nope', 'wrong', 'right'], 3)).toEqual([
			'right',
			null,
			'wrong'
		]);
	});
});

describe('pipKind', () => {
	const row = outcomes(['right', 'wrong', null, null]);

	it('keeps finished marks even when that card is the one on screen', () => {
		expect(pipKind(1, row, 3)).toBe('wrong');
		expect(pipKind(0, row, 3)).toBe('right');
	});

	it('does not let the learner skip ahead of furthest', () => {
		expect(pipKind(3, row, 2)).toBe('upcoming');
		expect(pipIsJumpTarget(pipKind(3, row, 2))).toBe(false);
	});

	it('lets the learner jump to finished cards and an unfinished reached card', () => {
		expect(pipKind(0, row, 2)).toBe('right');
		expect(pipKind(1, row, 2)).toBe('wrong');
		expect(pipKind(2, row, 2)).toBe('visited');
		expect(pipIsJumpTarget('right')).toBe(true);
		expect(pipIsJumpTarget('wrong')).toBe(true);
		expect(pipIsJumpTarget('visited')).toBe(true);
		expect(pipIsJumpTarget('upcoming')).toBe(false);
	});
});

describe('pipLabel', () => {
	it('names state in words, and marks the current card', () => {
		expect(pipLabel('right', 3)).toBe('Card 3, correct, go to card');
		expect(pipLabel('wrong', 4)).toBe('Card 4, incorrect, go to card');
		expect(pipLabel('upcoming', 5)).toBe('Card 5, not yet attempted');
		expect(pipLabel('visited', 6)).toBe('Card 6, started, go to card');
		expect(pipLabel('visited', 5, true)).toBe('Card 5, in progress');
		expect(pipLabel('wrong', 4, true)).toBe('Card 4, incorrect, current');
		expect(pipLabel('right', 1, true)).toBe('Card 1, correct, current');
	});
});

describe('holdFurthest', () => {
	it('never shrinks when the learner jumps back', () => {
		expect(holdFurthest(5, 2, false, 17)).toBe(5);
		expect(holdFurthest(5, 4, true, 17)).toBe(5);
		expect(holdFurthest(5, 5, true, 17)).toBe(6);
		expect(holdFurthest(16, 16, true, 17)).toBe(17);
	});
});
