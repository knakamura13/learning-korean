import { describe, expect, it } from 'vitest';
import { millEligible, millMissingLab, millPool, misreadings, pronTrial, pronTrialSource } from './pronMill';
import { normalizePron } from './deck';
import { OPTION_COUNT, answerRoundFrom, startRoundFrom } from './sprint';

const ALL_PRON_TIERS = ['lab06', 'lab07', 'lab08', 'lab09'];

/** Deterministic rng cycling a fixed sequence. */
function seq(values: number[]): () => number {
	let i = 0;
	return () => values[i++ % values.length];
}

describe('mill pool and eligibility', () => {
	it('draws only unlocked pron cards', () => {
		expect(millPool([])).toEqual([]);
		expect(millPool(['lab01', 'lab02'])).toEqual([]);
		const one = millPool(['lab06']);
		expect(one.length).toBe(10);
		expect(one.every((c) => c.kind === 'pron' && c.tier === 'lab06')).toBe(true);
		expect(millPool(ALL_PRON_TIERS).length).toBe(40);
	});

	it('is eligible from the first pron tier and points at Lab 06 before that', () => {
		expect(millEligible(['lab06'])).toBe(true);
		expect(millEligible(['lab01', 'lab05'])).toBe(false);
		expect(millMissingLab(['lab01'])).toEqual({ id: '0006', number: 6 });
		expect(millMissingLab(ALL_PRON_TIERS)).toBeNull();
	});
});

describe('misreadings', () => {
	it('offers derivation traps for every changing word, never an accepted answer', () => {
		for (const card of millPool(ALL_PRON_TIERS)) {
			const traps = misreadings(card);
			const accepted = new Set(card.answers.map(normalizePron));
			// A Stay card (강이) reads as spelled — its traps come from pool padding.
			const changes = !accepted.has(normalizePron(card.front));
			if (changes) expect(traps.length, card.id).toBeGreaterThanOrEqual(1);
			for (const trap of traps) {
				expect(accepted.has(normalizePron(trap)), `${card.id} trap ${trap}`).toBe(false);
			}
		}
	});

	it('includes the literal spelling for a word the rules change', () => {
		const card = millPool(['lab07']).find((c) => c.front === '학교')!;
		expect(misreadings(card)).toContain('hak-gyo');
	});

	it('excludes the l-l alternate the flow cards accept', () => {
		const card = millPool(['lab09']).find((c) => c.front === '신라')!;
		const traps = misreadings(card);
		expect(traps).not.toContain('sil-la');
		expect(traps).not.toContain('sil-ra');
		expect(traps).toContain('sin-ra');
	});
});

describe('pron trials', () => {
	const pool = millPool(ALL_PRON_TIERS);

	it('builds a four-option trial with exactly one correct answer for every card', () => {
		for (const card of pool) {
			const trial = pronTrial(card, pool, seq([0.1, 0.5, 0.9, 0.3]));
			expect(trial, card.id).not.toBeNull();
			expect(trial!.options.length, card.id).toBe(OPTION_COUNT);
			expect(new Set(trial!.options).size, card.id).toBe(OPTION_COUNT);
			expect(trial!.options[trial!.answerIndex], card.id).toBe(card.answers[0]);
			const accepted = new Set(card.answers.map(normalizePron));
			const rightLooking = trial!.options.filter((o) => accepted.has(normalizePron(o)));
			expect(rightLooking, card.id).toEqual([card.answers[0]]);
		}
	});

	it('drives the shared round machinery and avoids repeating a word', () => {
		const source = pronTrialSource(pool);
		const rng = seq([0.3, 0.7, 0.15, 0.85, 0.45]);
		let round = startRoundFrom(1000, source, rng);
		expect(round.phase).toBe('running');
		const first = round.trial!.block;
		round = answerRoundFrom(round, round.trial!.answerIndex, 2000, source, rng);
		expect(round.phase).toBe('running');
		expect(round.correct).toBe(1);
		expect(round.correctMs).toEqual([1000]);
		expect(round.trial!.block).not.toBe(first);
	});

	it('goes idle when the pool cannot sustain a round', () => {
		const source = pronTrialSource(pool.slice(0, 1));
		expect(startRoundFrom(1000, source, seq([0.5])).phase).toBe('idle');
	});
});
