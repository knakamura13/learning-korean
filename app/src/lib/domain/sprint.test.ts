import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { compose, isCluster, romanizeSyllable } from './hangul';
import {
	BASIC_VOWELS,
	OPTION_COUNT,
	SPRINT_MS,
	answerRound,
	idleRound,
	medianMs,
	nextTrial,
	sprintEligible,
	trialForBlock,
	sprintInventory,
	sprintMissingLab,
	sprintScore,
	startRound,
	tickRound,
	type Rng
} from './sprint';

function seq(values: number[]): Rng {
	let i = 0;
	return () => values[Math.min(i++, values.length - 1)] ?? 0;
}

describe('sprintEligible', () => {
	it('requires both lab01 and lab02 unlocked, ignoring skip-ahead', () => {
		expect(sprintEligible([])).toBe(false);
		expect(sprintEligible(['lab01'])).toBe(false);
		expect(sprintEligible(['lab02'])).toBe(false);
		expect(sprintEligible(['lab01', 'lab02'])).toBe(true);
		expect(sprintEligible(['lab05'])).toBe(false);
	});
});

describe('sprintMissingLab', () => {
	it('points at Lab 01 until consonants exist, then Lab 02', () => {
		expect(sprintMissingLab([])).toEqual({ id: '0001', number: 1 });
		expect(sprintMissingLab(['lab01'])).toEqual({ id: '0002', number: 2 });
		expect(sprintMissingLab(['lab01', 'lab02'])).toBeNull();
	});
});

describe('sprintInventory', () => {
	it('is empty until eligible', () => {
		expect(sprintInventory(['lab01'])).toEqual([]);
	});

	it('builds CV blocks from lab01+lab02 only', () => {
		const blocks = sprintInventory(['lab01', 'lab02']);
		expect(blocks).toContain('가');
		expect(blocks).toContain(compose('ㅇ', 'ㅏ'));
		expect(blocks).not.toContain('개');
		expect(blocks).not.toContain('각');
		expect(blocks).not.toContain('앉');
		expect(blocks).toHaveLength(19 * 10);
		for (const block of blocks) {
			expect(block).toHaveLength(1);
			expect(romanizeSyllable(block).length).toBeGreaterThan(0);
		}
	});

	it('adds compound vowels, simple batchim, then clusters with later tiers', () => {
		expect(sprintInventory(['lab01', 'lab02', 'lab03'])).toContain('개');
		expect(sprintInventory(['lab01', 'lab02', 'lab04'])).toContain('각');
		expect(sprintInventory(['lab01', 'lab02', 'lab04'])).not.toContain('앉');
		expect(sprintInventory(['lab01', 'lab02', 'lab05'])).toContain('앉');
		expect(sprintInventory(['lab01', 'lab02', 'lab06'])).toEqual(
			sprintInventory(['lab01', 'lab02'])
		);
	});

	it('never emits a block the domain cannot compose', () => {
		const blocks = sprintInventory(['lab01', 'lab02', 'lab03', 'lab04', 'lab05']);
		expect(new Set(blocks).size).toBe(blocks.length);
		for (const block of blocks) {
			expect(romanizeSyllable(block)).not.toBe('');
		}
	});
});

describe('nextTrial', () => {
	it('builds four unique same-length derived romanizations', () => {
		const blocks = sprintInventory(['lab01', 'lab02']);
		const trial = nextTrial(blocks, seq([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
		expect(trial).not.toBeNull();
		if (!trial) return;
		expect(trial.options).toHaveLength(OPTION_COUNT);
		expect(new Set(trial.options).size).toBe(OPTION_COUNT);
		const len = trial.options[0].length;
		for (const option of trial.options) expect(option.length).toBe(len);
		expect(trial.options[trial.answerIndex]).toBe(romanizeSyllable(trial.block));
		expect(blocks).toContain(trial.block);
	});

	it('avoids the previous block when the pool allows', () => {
		const blocks = sprintInventory(['lab01', 'lab02']);
		const first = nextTrial(blocks, () => 0);
		expect(first).not.toBeNull();
		const second = nextTrial(blocks, () => 0.99, first?.block);
		expect(second).not.toBeNull();
		expect(second?.block).not.toBe(first?.block);
	});
});

describe('trialForBlock', () => {
	it('uses the given block as the target with four unique same-length readings', () => {
		const pool = sprintInventory(['lab01', 'lab02']);
		const trial = trialForBlock('가', pool, seq([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
		expect(trial).not.toBeNull();
		if (!trial) return;
		expect(trial.block).toBe('가');
		expect(trial.options).toHaveLength(OPTION_COUNT);
		expect(new Set(trial.options).size).toBe(OPTION_COUNT);
		const len = trial.options[0].length;
		for (const option of trial.options) expect(option.length).toBe(len);
		expect(trial.options[trial.answerIndex]).toBe(romanizeSyllable('가'));
	});

	it('returns null when the pool cannot supply three same-length distractors', () => {
		expect(trialForBlock('가', ['가'], () => 0)).toBeNull();
		expect(trialForBlock('가', ['가', '나', '다'], () => 0)).toBeNull();
	});
});

describe('medianMs', () => {
	it('returns null for no samples and averages the two centres when even', () => {
		expect(medianMs([])).toBeNull();
		expect(medianMs([3])).toBe(3);
		expect(medianMs([1, 3])).toBe(2);
		expect(medianMs([1, 2, 100])).toBe(2);
	});
});

describe('round', () => {
	const blocks = () => sprintInventory(['lab01', 'lab02']);
	const rng: Rng = () => 0;

	it('starts a 60s round and records only correct latencies', () => {
		const t0 = 1_000_000;
		let round = startRound(t0, blocks(), rng);
		expect(round.phase).toBe('running');
		expect(round.endsAt).toBe(t0 + SPRINT_MS);
		expect(round.trial).not.toBeNull();
		const trial = round.trial!;
		round = answerRound(round, trial.answerIndex, t0 + 240, blocks(), rng);
		expect(round.correct).toBe(1);
		expect(round.seen).toBe(1);
		expect(round.correctMs).toEqual([240]);
		round = answerRound(round, (trial.answerIndex + 1) % OPTION_COUNT, t0 + 400, blocks(), rng);
		expect(round.correct).toBe(1);
		expect(round.seen).toBe(2);
		expect(round.correctMs).toEqual([240]);
		expect(sprintScore(round).medianMs).toBe(240);
	});

	it('ends when the clock hits zero and ignores answers after that', () => {
		const t0 = 5_000;
		let round = startRound(t0, blocks(), rng);
		round = tickRound(round, t0 + SPRINT_MS);
		expect(round.phase).toBe('done');
		expect(round.trial).toBeNull();
		const after = answerRound(round, 0, t0 + SPRINT_MS + 10, blocks(), rng);
		expect(after).toBe(round);
		expect(idleRound().phase).toBe('idle');
	});
});

describe('boundaries', () => {
	it('does not import the scheduler', () => {
		const src = readFileSync(new URL('./sprint.ts', import.meta.url), 'utf8');
		expect(src).not.toMatch(/srs/);
		expect(src).not.toMatch(/progress/);
	});

	it('treats every simple lab04 final as non-cluster', () => {
		const blocks = sprintInventory(['lab01', 'lab02', 'lab04']);
		expect(blocks.some((b) => romanizeSyllable(b).endsWith('k'))).toBe(true);
		expect(isCluster('ㄱ')).toBe(false);
	});
});
