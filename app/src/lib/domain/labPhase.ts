import type { LabPhase } from '$lib/content/types';

function cardCount(phases: readonly LabPhase[]): number {
	return phases.reduce((sum, phase) => sum + phase.count, 0);
}

export function phaseIndexAt(phases: readonly LabPhase[], cardIndex: number): number {
	const n = cardCount(phases);
	if (!Number.isInteger(cardIndex) || cardIndex < 0 || cardIndex >= n) {
		throw new RangeError(`cardIndex ${cardIndex} is out of range 0..${n - 1}`);
	}
	let start = 0;
	for (let i = 0; i < phases.length; i++) {
		const end = start + phases[i].count;
		if (cardIndex < end) return i;
		start = end;
	}
	throw new RangeError(`cardIndex ${cardIndex} is out of range 0..${n - 1}`);
}

export function phaseAt(phases: readonly LabPhase[], cardIndex: number): LabPhase {
	return phases[phaseIndexAt(phases, cardIndex)];
}

export function phaseBounds(
	phases: readonly LabPhase[],
	phaseIndex: number
): { start: number; end: number } {
	if (!Number.isInteger(phaseIndex) || phaseIndex < 0 || phaseIndex >= phases.length) {
		throw new RangeError(`phaseIndex ${phaseIndex} is out of range 0..${phases.length - 1}`);
	}
	let start = 0;
	for (let i = 0; i < phaseIndex; i++) start += phases[i].count;
	return { start, end: start + phases[phaseIndex].count };
}

export function cardInActivePhase(
	phases: readonly LabPhase[],
	cardIndex: number,
	currentIndex: number
): boolean {
	const { start, end } = phaseBounds(phases, phaseIndexAt(phases, currentIndex));
	return cardIndex >= start && cardIndex < end;
}
