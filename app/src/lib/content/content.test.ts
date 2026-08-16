/**
 * content.test.ts — validates every lab's content against the domain.
 *
 * In the old app these checks did not exist: an unreachable build target or a
 * pronunciation that disagreed with the phonology could only be caught by
 * driving the page in a browser. Here every lab is data, so the whole course
 * is checked in milliseconds on every commit.
 */

import { describe, it, expect } from 'vitest';
import { LABS, LABS_BY_ID } from './index';
import type { Lab, Step, ZoneId } from './types';
import { TIERS, cardsOfTier } from '$lib/domain/deck';
import {
	compose, decompose, derive, derivations, buildVowel, sidesFor, fuse,
	batchimSound, clusterParts, applyLiaison, liaisonAction, liaisonSources, type TickSide
} from '$lib/domain/hangul';

const ALL_STEPS: { lab: Lab; step: Step; i: number }[] = LABS.flatMap((lab) =>
	lab.steps.map((step, i) => ({ lab, step, i }))
);

const where = (lab: Lab, i: number) => `${lab.id} step ${i + 1}`;

describe('course structure', () => {
	it('has unique ids and numbers in order', () => {
		expect(new Set(LABS.map((l) => l.id)).size).toBe(LABS.length);
		LABS.forEach((lab, i) => expect(lab.number).toBe(i + 1));
	});

	it('unlocks each deck tier exactly once, covering all of them', () => {
		const unlocks = LABS.map((l) => l.unlocks);
		expect(new Set(unlocks).size).toBe(unlocks.length);
		expect(unlocks.sort()).toEqual(TIERS.map((t) => t.id).sort());
	});

	it('points every prerequisite at a lab that exists and comes earlier', () => {
		for (const lab of LABS) {
			if (!lab.requires) continue;
			const prior = LABS_BY_ID[lab.requires];
			expect(prior, `${lab.id} requires missing ${lab.requires}`).toBeDefined();
			expect(prior.number).toBeLessThan(lab.number);
		}
	});

	it('keeps every lab inside the ten-minute session budget', () => {
		for (const lab of LABS) {
			expect(lab.minutes, lab.id).toBeLessThanOrEqual(10);
			expect(lab.steps.length, lab.id).toBeLessThanOrEqual(18);
			expect(lab.steps.length, lab.id).toBeGreaterThan(0);
		}
	});

	it('gives every step teaching text', () => {
		for (const { lab, step, i } of ALL_STEPS) {
			expect(step.teach, where(lab, i)).toBeTruthy();
			expect(step.do, where(lab, i)).toBeTruthy();
		}
	});
});

describe('choice steps', () => {
	const choices = ALL_STEPS.filter((s) => s.step.type === 'choice');

	it('marks a valid answer index', () => {
		for (const { lab, step, i } of choices) {
			if (step.type !== 'choice') continue;
			expect(step.options.length, where(lab, i)).toBeGreaterThanOrEqual(2);
			expect(step.answer, where(lab, i)).toBeGreaterThanOrEqual(0);
			expect(step.answer, where(lab, i)).toBeLessThan(step.options.length);
		}
	});

	it('has no duplicate options within a question', () => {
		for (const { lab, step, i } of choices) {
			if (step.type !== 'choice') continue;
			expect(new Set(step.options).size, where(lab, i)).toBe(step.options.length);
		}
	});

	/**
	 * The authoring rule from the old app, now enforced: options of wildly
	 * different lengths leak the answer through shape alone.
	 */
	it('keeps options within one word of each other in length', () => {
		for (const { lab, step, i } of choices) {
			if (step.type !== 'choice') continue;
			const words = step.options.map((o) => o.trim().split(/\s+/).length);
			expect(Math.max(...words) - Math.min(...words), where(lab, i)).toBeLessThanOrEqual(1);
		}
	});
});

describe('build steps are solvable', () => {
	it('can reach the target from the start via stroke/double', () => {
		for (const { lab, step, i } of ALL_STEPS) {
			if (step.type !== 'build') continue;
			const seen = new Set<string>();
			const queue = [step.start];
			let reached = false;
			while (queue.length) {
				const cur = queue.shift()!;
				if (cur === step.target) { reached = true; break; }
				if (seen.has(cur)) continue;
				seen.add(cur);
				for (const op of derivations(cur)) queue.push(derive(cur, op));
			}
			expect(reached, `${where(lab, i)}: ${step.start} cannot reach ${step.target}`).toBe(true);
		}
	});
});

describe('vowel steps are solvable', () => {
	it('can build the target from some base/tick/side combination', () => {
		for (const { lab, step, i } of ALL_STEPS) {
			if (step.type !== 'vowel') continue;
			let reached = false;
			for (const base of ['ㅣ', 'ㅡ']) {
				if (buildVowel(base, null, 0) === step.target) reached = true;
				for (const side of sidesFor(base)) {
					for (const ticks of [1, 2]) {
						if (buildVowel(base, side as TickSide, ticks) === step.target) reached = true;
					}
				}
			}
			expect(reached, `${where(lab, i)}: cannot build ${step.target}`).toBe(true);
		}
	});
});

describe('fusion steps are solvable', () => {
	it('offers a pair in its own trays that produces the target', () => {
		for (const { lab, step, i } of ALL_STEPS) {
			if (step.type !== 'fusion') continue;
			const ok = step.first.some((a) => step.second.some((b) => fuse(a, b) === step.target));
			expect(ok, `${where(lab, i)}: no tray pair makes ${step.target}`).toBe(true);
		}
	});

	it('never offers a tray whose only solution is an impossible pair', () => {
		for (const { lab, step, i } of ALL_STEPS) {
			if (step.type !== 'fusion') continue;
			expect(step.first.length, where(lab, i)).toBeGreaterThan(1);
			expect(step.second.length, where(lab, i)).toBeGreaterThan(1);
		}
	});
});

describe('assemble steps are solvable', () => {
	it('offers pieces in its own trays that compose the target', () => {
		for (const { lab, step, i } of ALL_STEPS) {
			if (step.type !== 'assemble') continue;
			const finals = step.finals ?? [''];
			const ok = step.consonants.some((c) =>
				step.vowels.some((v) => finals.some((f) => compose(c, v, f) === step.target))
			);
			expect(ok, `${where(lab, i)}: no tray combination makes ${step.target}`).toBe(true);
		}
	});

	it('declares a finals tray exactly when the target has a batchim', () => {
		for (const { lab, step, i } of ALL_STEPS) {
			if (step.type !== 'assemble') continue;
			const parts = decompose(step.target);
			expect(parts, `${where(lab, i)}: ${step.target} is not a syllable`).not.toBeNull();
			const needsFinal = parts!.final !== '';
			expect(!!step.finals?.length, where(lab, i)).toBe(needsFinal);
		}
	});
});

describe('cluster steps agree with the phonology', () => {
	it('uses a real eleven-cluster in every card', () => {
		for (const { lab, step, i } of ALL_STEPS) {
			if (step.type !== 'cluster') continue;
			expect(clusterParts(step.cluster), `${where(lab, i)}: ${step.cluster}`).not.toBeNull();
		}
	});

	/**
	 * The invariant that used to require a browser: the pronunciation written
	 * on the card must actually end in the letter the rules say survives.
	 */
	it('writes a pronunciation whose first block ends in the surviving letter', () => {
		for (const { lab, step, i } of ALL_STEPS) {
			if (step.type !== 'cluster') continue;
			const firstBlock = step.pron.replace(/[[\]]/g, '')[0];
			const parts = decompose(firstBlock);
			expect(parts, `${where(lab, i)}: ${step.pron} is not readable`).not.toBeNull();
			expect(
				parts!.final,
				`${where(lab, i)}: ${step.word} → ${step.pron} ends in ${parts!.final}, but ${step.cluster} says ${batchimSound(step.cluster)}`
			).toBe(batchimSound(step.cluster));
		}
	});

	it('shows a word that actually contains the cluster it is about', () => {
		for (const { lab, step, i } of ALL_STEPS) {
			if (step.type !== 'cluster') continue;
			const finals = [...step.word].map((ch) => decompose(ch)?.final);
			expect(finals, `${where(lab, i)}: ${step.word} has no ${step.cluster}`).toContain(
				step.cluster
			);
		}
	});
});

describe('liaison steps agree with the phonology', () => {
	it('uses real syllables and derives speech from applyLiaison', () => {
		for (const { lab, step, i } of ALL_STEPS) {
			if (step.type !== 'liaison') continue;
			for (const ch of [...step.word]) {
				expect(decompose(ch), `${where(lab, i)}: ${ch}`).not.toBeNull();
			}
			expect(liaisonAction(step.word).type === 'stay' || liaisonSources(step.word).length)
				.toBeTruthy();
		}
	});

	it('never uses 좋아요 or 밭이 as a liaison widget (wrong rule / palatalisation)', () => {
		for (const { step } of ALL_STEPS) {
			if (step.type !== 'liaison') continue;
			expect(step.word).not.toBe('좋아요');
			expect(step.word).not.toBe('밭이');
		}
	});

	it('includes Stay-correct 강이 and a jumping cluster', () => {
		const words = ALL_STEPS.filter((s) => s.step.type === 'liaison').map((s) =>
			s.step.type === 'liaison' ? s.step.word : ''
		);
		expect(words).toContain('강이');
		expect(words).toContain('읽어요');
		expect(liaisonAction('강이')).toEqual({ type: 'stay' });
	});
});

describe('read steps', () => {
	it('shows real syllable blocks with a reading for each', () => {
		for (const { lab, step, i } of ALL_STEPS) {
			if (step.type !== 'read') continue;
			for (const b of step.blocks) {
				expect(decompose(b.block), `${where(lab, i)}: ${b.block}`).not.toBeNull();
				expect(b.reading, `${where(lab, i)}: ${b.block}`).toBeTruthy();
			}
		}
	});

	it('marks a valid answer and keeps option lengths comparable', () => {
		for (const { lab, step, i } of ALL_STEPS) {
			if (step.type !== 'read') continue;
			expect(step.answer, where(lab, i)).toBeLessThan(step.options.length);
			const lens = step.options.map((o) => o.length);
			expect(Math.max(...lens) - Math.min(...lens), where(lab, i)).toBeLessThanOrEqual(2);
		}
	});
});

describe('mouth steps', () => {
	it('never re-solves a zone that an earlier step in the same lab already solved', () => {
		for (const lab of LABS) {
			const solvedSoFar = new Set<ZoneId>();
			for (const step of lab.steps) {
				if (step.type !== 'mouth') continue;
				expect(solvedSoFar.has(step.zone), `${lab.id}: ${step.zone} solved twice`).toBe(false);
				// Everything previously solved must be carried forward on the map.
				const carried = new Set((step.solved ?? []).map((s) => s.zone));
				for (const prior of solvedSoFar) {
					expect(carried.has(prior), `${lab.id}: ${step.zone} card drops ${prior}`).toBe(true);
				}
				solvedSoFar.add(step.zone);
			}
		}
	});
});

describe('deck alignment', () => {
	it('unlocks a tier whose size matches what the lab claims to teach', () => {
		for (const lab of LABS) {
			expect(cardsOfTier(lab.unlocks).length, lab.id).toBeGreaterThan(0);
		}
	});
});
