import { describe, expect, it } from 'vitest';
import { TRAY_SIZE, composeTrial } from './blockCompose';
import { compose, decompose, isCluster } from './hangul';
import { blockInventory } from './blockDeck';

function seq(values: number[]): () => number {
	let i = 0;
	return () => values[i++ % values.length];
}

const rng = () => seq([0.13, 0.57, 0.91, 0.34, 0.78, 0.02]);

describe('composeTrial', () => {
	it('always includes the correct part in each tray', () => {
		for (const tier of ['lab02', 'lab03', 'lab04', 'lab05'] as const) {
			const unlocked = ['lab01', 'lab02', 'lab03', 'lab04', 'lab05'].slice(
				0,
				['lab02', 'lab03', 'lab04', 'lab05'].indexOf(tier) + 2
			);
			for (const block of blockInventory(tier).slice(0, 8)) {
				const trial = composeTrial(block, unlocked, rng());
				const parts = decompose(block)!;
				expect(trial, block).not.toBeNull();
				expect(trial!.leads, block).toContain(parts.lead);
				expect(trial!.vowels, block).toContain(parts.vowel);
				expect(trial!.leads.length, block).toBe(TRAY_SIZE);
				expect(new Set(trial!.leads).size, block).toBe(TRAY_SIZE);
				if (parts.final === '') {
					expect(trial!.finals, block).toBeNull();
				} else {
					expect(trial!.finals, block).toContain(parts.final);
					expect(trial!.finals!.length, block).toBe(TRAY_SIZE);
				}
				// The trays can rebuild the target.
				expect(
					compose(parts.lead, parts.vowel, parts.final),
					block
				).toBe(block);
			}
		}
	});

	it('never offers a compound vowel before lab03 or a cluster before lab05', () => {
		for (const block of blockInventory('lab02').slice(0, 10)) {
			const trial = composeTrial(block, ['lab01', 'lab02'], rng())!;
			const basic = new Set(['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ']);
			for (const v of trial.vowels) expect(basic.has(v), `${block} vowel ${v}`).toBe(true);
		}
		for (const block of blockInventory('lab04').slice(0, 10)) {
			const trial = composeTrial(block, ['lab01', 'lab02', 'lab03', 'lab04'], rng())!;
			for (const f of trial.finals ?? []) {
				expect(isCluster(f), `${block} final ${f}`).toBe(false);
			}
		}
	});

	it('returns null for a non-syllable', () => {
		expect(composeTrial('ㄱ', ['lab01', 'lab02'], rng())).toBeNull();
	});
});
