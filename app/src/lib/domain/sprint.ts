import {
	CLUSTERS,
	FINALS,
	LEADS,
	VOWELS,
	compose,
	isCluster,
	romanizeSyllable,
	type Vowel
} from './hangul';

export const SPRINT_MS = 60_000;
export const OPTION_COUNT = 4;

export const BASIC_VOWELS: readonly Vowel[] = [
	'ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ'
];

export type Rng = () => number;

export interface SprintTrial {
	block: string;
	options: string[];
	answerIndex: number;
}

export type SprintPhase = 'idle' | 'running' | 'done';

export interface SprintRound {
	phase: SprintPhase;
	endsAt: number;
	trial: SprintTrial | null;
	trialStartedAt: number;
	correctMs: number[];
	seen: number;
	correct: number;
}

export function sprintEligible(unlocked: readonly string[]): boolean {
	return unlocked.includes('lab01') && unlocked.includes('lab02');
}

export function sprintMissingLab(
	unlocked: readonly string[]
): { id: string; number: number } | null {
	if (!unlocked.includes('lab01')) return { id: '0001', number: 1 };
	if (!unlocked.includes('lab02')) return { id: '0002', number: 2 };
	return null;
}

function vowelsFor(unlocked: readonly string[]): string[] {
	const out: string[] = [];
	if (unlocked.includes('lab02')) out.push(...BASIC_VOWELS);
	if (unlocked.includes('lab03')) {
		for (const vowel of VOWELS) {
			if (!(BASIC_VOWELS as readonly string[]).includes(vowel)) out.push(vowel);
		}
	}
	return out;
}

function leadsFor(unlocked: readonly string[]): string[] {
	return unlocked.includes('lab01') ? [...LEADS] : [];
}

function finalsFor(unlocked: readonly string[]): string[] {
	const out = [''];
	if (unlocked.includes('lab04')) {
		for (const final of FINALS) {
			if (final && !isCluster(final)) out.push(final);
		}
	}
	if (unlocked.includes('lab05')) out.push(...CLUSTERS);
	return out;
}

export function sprintInventory(unlocked: readonly string[]): string[] {
	if (!sprintEligible(unlocked)) return [];
	const blocks: string[] = [];
	for (const lead of leadsFor(unlocked)) {
		for (const vowel of vowelsFor(unlocked)) {
			for (const final of finalsFor(unlocked)) {
				const block = compose(lead, vowel, final);
				if (block) blocks.push(block);
			}
		}
	}
	return blocks;
}

function pickIndex(length: number, rng: Rng): number {
	if (length <= 0) return 0;
	return Math.min(length - 1, Math.floor(rng() * length));
}

function shuffled<T>(items: readonly T[], rng: Rng): T[] {
	const next = items.slice();
	for (let i = next.length - 1; i > 0; i--) {
		const j = pickIndex(i + 1, rng);
		[next[i], next[j]] = [next[j], next[i]];
	}
	return next;
}

const MAX_TRIAL_ATTEMPTS = 40;

export function nextTrial(
	blocks: readonly string[],
	rng: Rng,
	avoid?: string
): SprintTrial | null {
	if (blocks.length < OPTION_COUNT) return null;
	const pool = avoid && blocks.some((block) => block !== avoid)
		? blocks.filter((block) => block !== avoid)
		: blocks.slice();
	for (let attempt = 0; attempt < MAX_TRIAL_ATTEMPTS; attempt++) {
		const block = pool[pickIndex(pool.length, rng)];
		if (!block) continue;
		const answer = romanizeSyllable(block);
		if (!answer) continue;
		const distractors = new Set<string>();
		for (const other of blocks) {
			if (other === block) continue;
			const reading = romanizeSyllable(other);
			if (reading && reading !== answer && reading.length === answer.length) {
				distractors.add(reading);
			}
		}
		if (distractors.size < OPTION_COUNT - 1) continue;
		const picked: string[] = [];
		const available = [...distractors];
		while (picked.length < OPTION_COUNT - 1 && available.length > 0) {
			const index = pickIndex(available.length, rng);
			picked.push(available.splice(index, 1)[0]);
		}
		if (picked.length < OPTION_COUNT - 1) continue;
		const options = shuffled([answer, ...picked], rng);
		return { block, options, answerIndex: options.indexOf(answer) };
	}
	return null;
}

export function medianMs(samples: readonly number[]): number | null {
	if (samples.length === 0) return null;
	const sorted = [...samples].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	if (sorted.length % 2 === 1) return sorted[mid];
	return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export function idleRound(): SprintRound {
	return {
		phase: 'idle',
		endsAt: 0,
		trial: null,
		trialStartedAt: 0,
		correctMs: [],
		seen: 0,
		correct: 0
	};
}

export function startRound(now: number, blocks: readonly string[], rng: Rng): SprintRound {
	const trial = nextTrial(blocks, rng);
	if (!trial) return idleRound();
	return {
		phase: 'running',
		endsAt: now + SPRINT_MS,
		trial,
		trialStartedAt: now,
		correctMs: [],
		seen: 0,
		correct: 0
	};
}

export function tickRound(round: SprintRound, now: number): SprintRound {
	if (round.phase !== 'running') return round;
	if (now < round.endsAt) return round;
	return { ...round, phase: 'done', trial: null };
}

export function answerRound(
	round: SprintRound,
	optionIndex: number,
	now: number,
	blocks: readonly string[],
	rng: Rng
): SprintRound {
	if (round.phase !== 'running' || !round.trial) return round;
	const trial = round.trial;
	const correct = optionIndex === trial.answerIndex;
	const correctMs = correct
		? [...round.correctMs, now - round.trialStartedAt]
		: round.correctMs;
	const next: SprintRound = {
		...round,
		seen: round.seen + 1,
		correct: round.correct + (correct ? 1 : 0),
		correctMs
	};
	if (now >= round.endsAt) return { ...next, phase: 'done', trial: null };
	const following = nextTrial(blocks, rng, trial.block);
	if (!following) return { ...next, phase: 'done', trial: null };
	return { ...next, trial: following, trialStartedAt: now };
}

export function sprintScore(round: SprintRound): {
	medianMs: number | null;
	correct: number;
	seen: number;
} {
	return {
		medianMs: medianMs(round.correctMs),
		correct: round.correct,
		seen: round.seen
	};
}
