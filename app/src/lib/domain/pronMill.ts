/**
 * pronMill.ts — the sound-change prediction mill behind /drill's second lane.
 *
 * The block sprint asks "what does this block say"; the mill asks the harder
 * question the whole course builds toward: "what does this *word* sound
 * like". It draws only from pron cards whose tier is unlocked, so it never
 * quizzes a rule the learner has not derived, and — like the sprint — it
 * never writes the review scheduler.
 *
 * Distractors are not random: they are the *plausible misreadings*. The
 * as-spelled romanization (the classic trap) and the other sound changes
 * misapplied to the same word. Every option answers the same question about
 * the same word, so option shape cannot leak the answer.
 */

import { DECK, normalizePron, type Card } from './deck';
import {
	applyContact,
	applyFlow,
	applyHMerge,
	applyLiaison,
	romanizeWord
} from './hangul';
import { OPTION_COUNT, pickIndex, shuffled, type Rng, type SprintTrial, type TrialSource } from './sprint';

/** Enough material for a round that does not repeat itself immediately. */
const MIN_POOL = 8;

export function millPool(unlocked: readonly string[]): Card[] {
	return DECK.filter((card) => card.kind === 'pron' && unlocked.includes(card.tier));
}

export function millEligible(unlocked: readonly string[]): boolean {
	return millPool(unlocked).length >= MIN_POOL;
}

/** The first pron-tier lab, for the locked state's pointer. */
export function millMissingLab(
	unlocked: readonly string[]
): { id: string; number: number } | null {
	if (millEligible(unlocked)) return null;
	return { id: '0006', number: 6 };
}

/**
 * Wrong-but-tempting romanizations of a written word: read as spelled, or
 * with the other junction rules misapplied. Anything the card would accept
 * as correct is excluded — an accepted alternate must never be a trap.
 */
export function misreadings(card: Card): string[] {
	const accepted = new Set(card.answers.map(normalizePron));
	const out: string[] = [];
	const candidates = [
		card.front,
		applyLiaison(card.front),
		applyContact(card.front),
		applyHMerge(card.front),
		applyFlow(card.front)
	];
	for (const form of candidates) {
		const roman = romanizeWord(form);
		if (!roman || accepted.has(normalizePron(roman))) continue;
		if (out.includes(roman)) continue;
		out.push(roman);
	}
	return out;
}

export function pronTrial(card: Card, pool: readonly Card[], rng: Rng): SprintTrial | null {
	const answer = card.answers[0];
	const traps = misreadings(card);
	if (traps.length < OPTION_COUNT - 1) {
		// Pad from other words' answers — still romanizations of real words.
		const accepted = new Set(card.answers.map(normalizePron));
		for (const other of shuffled(pool, rng)) {
			if (traps.length >= OPTION_COUNT - 1) break;
			if (other.id === card.id) continue;
			const roman = other.answers[0];
			if (accepted.has(normalizePron(roman)) || traps.includes(roman)) continue;
			traps.push(roman);
		}
	}
	if (traps.length < OPTION_COUNT - 1) return null;
	const options = shuffled([answer, ...traps.slice(0, OPTION_COUNT - 1)], rng);
	return { block: card.front, options, answerIndex: options.indexOf(answer) };
}

export function pronTrialSource(pool: readonly Card[]): TrialSource {
	return (rng, avoid) => {
		if (pool.length < 2) return null;
		const usable = avoid && pool.some((card) => card.front !== avoid)
			? pool.filter((card) => card.front !== avoid)
			: [...pool];
		for (let attempt = 0; attempt < 40; attempt++) {
			const card = usable[pickIndex(usable.length, rng)];
			if (!card) continue;
			const trial = pronTrial(card, pool, rng);
			if (trial) return trial;
		}
		return null;
	};
}
