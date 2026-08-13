/**
 * pipState.ts — numbered lab-card markers, as pure data.
 *
 * Jumping back remounts that card so the learner can review or re-answer.
 * Later outcomes and the furthest reached index are kept. Refresh resumes
 * at furthest, not at a card they had jumped back to.
 *
 * Visual kind is independent of selection: the selected pip keeps its
 * inactive fill/stroke and gains an offset ring in the runner.
 */

export type CardOutcome = 'right' | 'wrong';

export type PipKind = 'upcoming' | 'right' | 'wrong' | 'visited';

export function emptyOutcomes(stepCount: number): (CardOutcome | null)[] {
	return Array.from({ length: Math.max(0, stepCount) }, () => null);
}

export function reviveOutcomes(raw: unknown, stepCount: number): (CardOutcome | null)[] {
	const out = emptyOutcomes(stepCount);
	if (!Array.isArray(raw) || stepCount <= 0) return out;
	for (let i = 0; i < Math.min(raw.length, stepCount); i++) {
		if (raw[i] === 'right' || raw[i] === 'wrong') out[i] = raw[i];
	}
	return out;
}

export function pipKind(
	i: number,
	outcomes: readonly (CardOutcome | null)[],
	furthest: number
): PipKind {
	if (i > furthest) return 'upcoming';
	const outcome = outcomes[i];
	if (outcome === 'right' || outcome === 'wrong') return outcome;
	return 'visited';
}

export function pipIsJumpTarget(kind: PipKind): boolean {
	switch (kind) {
		case 'right':
		case 'wrong':
		case 'visited':
			return true;
		case 'upcoming':
			return false;
		default: {
			const _exhaustive: never = kind;
			return _exhaustive;
		}
	}
}

export function pipLabel(
	kind: PipKind,
	cardNumber: number,
	selected = false
): string {
	switch (kind) {
		case 'right':
			return selected
				? `Card ${cardNumber}, correct, current`
				: `Card ${cardNumber}, correct, go to card`;
		case 'wrong':
			return selected
				? `Card ${cardNumber}, incorrect, current`
				: `Card ${cardNumber}, incorrect, go to card`;
		case 'visited':
			return selected
				? `Card ${cardNumber}, in progress`
				: `Card ${cardNumber}, started, go to card`;
		case 'upcoming':
			return `Card ${cardNumber}, not yet attempted`;
		default: {
			const _exhaustive: never = kind;
			return _exhaustive;
		}
	}
}

/** Furthest card the learner may stand on — never shrinks when jumping back. */
export function holdFurthest(furthest: number, index: number, settled: boolean, stepCount: number): number {
	const reached = settled ? index + 1 : index;
	return Math.min(stepCount, Math.max(furthest, reached));
}
