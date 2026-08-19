/**
 * labRunnerSession.ts — restore / persist decisions for an in-progress lab.
 *
 * LabRunner used to inline this next to DOM focus and pip-rail scroll.
 * The rules are pure: given saved place and the current sitting flags,
 * decide what to hydrate and whether a leave should write.
 */

import { emptyOutcomes, type CardOutcome } from './pipState';
import type { LabProgress } from './labSession';

export interface HydratedLabRunner {
	firstTry: number;
	elapsedMs: number;
	outcomes: (CardOutcome | null)[];
	furthest: number;
	index: number;
	showResumeNote: boolean;
	shouldFinish: boolean;
}

export function hydrateLabRunner(
	saved: LabProgress | undefined,
	stepCount: number
): HydratedLabRunner {
	if (!saved) {
		return {
			firstTry: 0,
			elapsedMs: 0,
			outcomes: emptyOutcomes(stepCount),
			furthest: 0,
			index: 0,
			showResumeNote: false,
			shouldFinish: false
		};
	}
	const shouldFinish = saved.finished || saved.nextIndex >= stepCount;
	return {
		firstTry: saved.firstTry,
		elapsedMs: saved.elapsedMs,
		outcomes: saved.outcomes.slice(),
		furthest: saved.nextIndex,
		index: shouldFinish ? 0 : saved.nextIndex,
		showResumeNote: !shouldFinish && saved.nextIndex > 0,
		shouldFinish
	};
}

export function shouldPersistOnLeave(input: {
	ready: boolean;
	finished: boolean;
	settled: boolean;
	furthest: number;
	firstTry: number;
	outcomes: readonly (CardOutcome | null)[];
}): boolean {
	if (!input.ready || input.finished || input.settled) return false;
	if (input.furthest === 0 && input.firstTry === 0 && input.outcomes.every((o) => o == null)) {
		return false;
	}
	return true;
}

export function placeAfterCorrectSettle(
	isLast: boolean,
	furthest: number,
	stepCount: number
): { nextIndex: number; finished: boolean } {
	if (isLast) return { nextIndex: stepCount, finished: true };
	return { nextIndex: furthest, finished: false };
}

export function sittingElapsedMinutes(elapsedMs: number): number {
	return Math.max(1, Math.round(elapsedMs / 60_000));
}

export function labProgressFromRunner(input: {
	nextIndex: number;
	firstTry: number;
	elapsedMs: number;
	finished: boolean;
	outcomes: readonly (CardOutcome | null)[];
}): LabProgress {
	return {
		nextIndex: input.nextIndex,
		firstTry: input.firstTry,
		elapsedMs: input.elapsedMs,
		finished: input.finished,
		outcomes: input.outcomes.slice()
	};
}
