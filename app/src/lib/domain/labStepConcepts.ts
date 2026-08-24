/**
 * labStepConcepts.ts — map a lab step to review-deck card ids.
 *
 * Lab steps do not carry SRS ids. Glyphs and words on the step are matched to
 * deck fronts so flagging a lab card can enqueue the related review concepts.
 */

import type { Step } from '$lib/content/types';
import { DECK } from './deck';

const HANGUL = /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7A3]+/g;

function pushUnique(into: string[], value: string | undefined) {
	if (!value) return;
	if (!into.includes(value)) into.push(value);
}

/** Collect Hangul tokens a step teaches or shows. */
export function stepGlyphs(step: Step): string[] {
	const out: string[] = [];
	switch (step.type) {
		case 'mouth':
			pushUnique(out, step.jamo);
			for (const solved of step.solved ?? []) pushUnique(out, solved.jamo);
			break;
		case 'choice':
			for (const item of step.stage ?? []) pushUnique(out, item.glyph);
			for (const option of step.options) {
				for (const match of option.match(HANGUL) ?? []) pushUnique(out, match);
			}
			break;
		case 'build':
			pushUnique(out, step.start);
			pushUnique(out, step.target);
			break;
		case 'assemble':
			pushUnique(out, step.target);
			for (const c of step.consonants) pushUnique(out, c);
			for (const v of step.vowels) pushUnique(out, v);
			for (const f of step.finals ?? []) pushUnique(out, f);
			break;
		case 'vowel':
			pushUnique(out, step.target);
			break;
		case 'fusion':
			pushUnique(out, step.target);
			for (const part of step.first) pushUnique(out, part);
			for (const part of step.second) pushUnique(out, part);
			break;
		case 'cluster':
			pushUnique(out, step.word);
			pushUnique(out, step.cluster);
			pushUnique(out, step.pron);
			break;
		case 'liaison':
		case 'contact':
		case 'hmerge':
		case 'flow':
			pushUnique(out, step.word);
			break;
		case 'read':
			for (const block of step.blocks) pushUnique(out, block.block);
			break;
		default: {
			const _exhaustive: never = step;
			return _exhaustive;
		}
	}
	return out;
}

/**
 * Review card ids that share a front with the step's glyphs.
 * Prefer the lab's unlock tier, then any unlocked match, then any match.
 */
export function conceptsForStep(step: Step, preferredTier: readonly string[] = []): string[] {
	const glyphs = new Set(stepGlyphs(step));
	if (glyphs.size === 0) return [];

	const preferred = new Set(preferredTier);
	const matches = DECK.filter((card) => glyphs.has(card.front));
	if (matches.length === 0) {
		// Longer fronts (words) that contain a taught cluster, or vice versa.
		const loose = DECK.filter(
			(card) =>
				[...glyphs].some((g) => g.length > 0 && (card.front.includes(g) || g.includes(card.front)))
		);
		return rank(loose, preferred);
	}
	return rank(matches, preferred);
}

function rank(
	cards: { id: string; tier: string }[],
	preferred: Set<string>
): string[] {
	const scored = cards.map((card) => ({
		id: card.id,
		rank: preferred.has(card.tier) ? 0 : 1
	}));
	scored.sort((a, b) => a.rank - b.rank || a.id.localeCompare(b.id));
	const ids: string[] = [];
	for (const row of scored) {
		if (!ids.includes(row.id)) ids.push(row.id);
	}
	return ids;
}
