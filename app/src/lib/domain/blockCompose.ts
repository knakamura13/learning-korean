/**
 * blockCompose.ts — trays for answering a block card by *building* the block.
 *
 * The tap grid asked the learner to recognize a romanization; composing the
 * block from its jamo is production, the skill the mission actually wants.
 * The card front shows the sound; the learner assembles the spelling.
 *
 * Tray pools honor unlock state exactly like the sprint inventory does: a
 * learner who has not met compound vowels or clusters never sees one, even
 * as a distractor.
 */

import { CLUSTERS, FINALS, LEADS, VOWELS, decompose, isCluster } from './hangul';
import { BASIC_VOWELS, pickIndex, shuffled, type Rng } from './sprint';

export interface ComposeTrial {
	/** The block being asked for; the graded answer. */
	target: string;
	leads: string[];
	vowels: string[];
	/** Null when the target has no batchim — no tray to show. */
	finals: string[] | null;
}

export const TRAY_SIZE = 4;

function tray(correct: string, pool: readonly string[], rng: Rng): string[] | null {
	const others = pool.filter((p) => p && p !== correct);
	if (others.length < TRAY_SIZE - 1) return null;
	const picked: string[] = [];
	const available = [...others];
	while (picked.length < TRAY_SIZE - 1) {
		picked.push(available.splice(pickIndex(available.length, rng), 1)[0]);
	}
	return shuffled([correct, ...picked], rng);
}

export function composeTrial(
	block: string,
	unlocked: readonly string[],
	rng: Rng
): ComposeTrial | null {
	const parts = decompose(block);
	if (!parts) return null;

	const vowelPool = unlocked.includes('lab03') ? VOWELS : BASIC_VOWELS;
	const simpleFinals = FINALS.filter((f) => f && !isCluster(f));
	const finalPool = unlocked.includes('lab05') ? [...simpleFinals, ...CLUSTERS] : simpleFinals;

	const leads = tray(parts.lead, LEADS, rng);
	const vowels = tray(parts.vowel, vowelPool, rng);
	if (!leads || !vowels) return null;

	if (parts.final === '') return { target: block, leads, vowels, finals: null };
	const finals = tray(parts.final, finalPool, rng);
	if (!finals) return null;
	return { target: block, leads, vowels, finals };
}
