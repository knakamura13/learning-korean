import { describe, expect, it } from 'vitest';
import type { LabPhase } from '$lib/content/types';
import { cardInActivePhase, phaseAt, phaseBounds, phaseIndexAt } from './labPhase';

const LAB01: readonly LabPhase[] = [
	{ title: 'Find the five shapes', count: 5 },
	{ title: 'A stroke adds a puff of air', count: 5 },
	{ title: 'Doubling makes a tense consonant', count: 2 },
	{ title: 'Where the consonant sits in the block', count: 2 },
	{ title: 'Read from the letters alone', count: 3 }
];

describe('labPhase', () => {
	it('names Lab 01 cards from the locked inventory', () => {
		expect(phaseAt(LAB01, 0).title).toBe('Find the five shapes');
		expect(phaseAt(LAB01, 4).title).toBe('Find the five shapes');
		expect(phaseAt(LAB01, 5).title).toBe('A stroke adds a puff of air');
		expect(phaseAt(LAB01, 16).title).toBe('Read from the letters alone');
		expect(phaseIndexAt(LAB01, 0)).toBe(0);
		expect(phaseIndexAt(LAB01, 5)).toBe(1);
		expect(phaseIndexAt(LAB01, 16)).toBe(4);
	});

	it('covers 0..n with non-overlapping half-open bounds', () => {
		const n = LAB01.reduce((sum, phase) => sum + phase.count, 0);
		expect(n).toBe(17);
		let cursor = 0;
		for (let i = 0; i < LAB01.length; i++) {
			const bounds = phaseBounds(LAB01, i);
			expect(bounds.start).toBe(cursor);
			expect(bounds.end).toBe(cursor + LAB01[i].count);
			cursor = bounds.end;
		}
		expect(cursor).toBe(n);
	});

	it('marks Lab 01 card 1 as current for cards 1–5 and other for 6–17', () => {
		for (let i = 0; i < 5; i++) expect(cardInActivePhase(LAB01, i, 0)).toBe(true);
		for (let i = 5; i < 17; i++) expect(cardInActivePhase(LAB01, i, 0)).toBe(false);
	});

	it('throws on an out-of-range card index', () => {
		expect(() => phaseAt(LAB01, -1)).toThrow();
		expect(() => phaseAt(LAB01, 17)).toThrow();
		expect(() => phaseIndexAt(LAB01, 17)).toThrow();
	});
});
