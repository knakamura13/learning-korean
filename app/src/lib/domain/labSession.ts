/**
 * labSession.ts — in-progress lab place, as pure data.
 *
 * The runner used to keep index / first-try / elapsed time only in component
 * memory. The sticky nav is one tap from a 17-card lab, and a refresh or a
 * Review peek wiped the sitting. Persistence is a port (see storage.ts); this
 * file only validates and updates the payload.
 */

import { reviveOutcomes, type CardOutcome } from './pipState';

export const LAB_SESSION_VERSION = 1;

export interface LabProgress {
	nextIndex: number;
	firstTry: number;
	elapsedMs: number;
	finished: boolean;
	/** Index-aligned; null means this card has no recorded settle yet. */
	outcomes: (CardOutcome | null)[];
}

export interface LabSessions {
	version: typeof LAB_SESSION_VERSION;
	labs: Record<string, LabProgress>;
}

export function emptySessions(): LabSessions {
	return { version: LAB_SESSION_VERSION, labs: {} };
}

function asInt(value: unknown): number | null {
	return typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : null;
}

function reviveOne(raw: unknown, stepCount: number): LabProgress | null {
	if (!raw || typeof raw !== 'object') return null;
	const rec = raw as Record<string, unknown>;
	const nextIndex = asInt(rec.nextIndex);
	const firstTry = asInt(rec.firstTry);
	const elapsedMs = asInt(rec.elapsedMs);
	if (nextIndex === null || firstTry === null || elapsedMs === null) return null;
	if (stepCount <= 0) return null;
	if (nextIndex < 0 || nextIndex > stepCount) return null;
	if (firstTry < 0 || firstTry > stepCount) return null;
	if (elapsedMs < 0) return null;

	const finished = rec.finished === true || nextIndex >= stepCount;
	return {
		nextIndex: finished ? stepCount : nextIndex,
		firstTry,
		elapsedMs,
		finished,
		outcomes: reviveOutcomes(rec.outcomes, stepCount)
	};
}

/**
 * Accept a stored payload (or anything else) and keep only labs whose ids
 * still exist and whose indexes still fit. Unknown shapes become empty —
 * never throw, never invent a place the learner has not been.
 */
export function reviveSessions(raw: unknown, stepCounts: Record<string, number>): LabSessions {
	if (!raw || typeof raw !== 'object') return emptySessions();
	const rec = raw as Record<string, unknown>;
	const source =
		rec.labs && typeof rec.labs === 'object'
			? (rec.labs as Record<string, unknown>)
			: rec.version === undefined && rec.labs === undefined
				? rec
				: {};

	const labs: Record<string, LabProgress> = {};
	for (const [id, value] of Object.entries(source)) {
		const count = stepCounts[id];
		if (count === undefined) continue;
		const progress = reviveOne(value, count);
		if (progress) labs[id] = progress;
	}
	return { version: LAB_SESSION_VERSION, labs };
}

export function upsertLab(
	sessions: LabSessions,
	labId: string,
	progress: LabProgress,
	stepCount: number
): LabSessions {
	const revived = reviveOne(progress, stepCount);
	if (!revived) return sessions;
	if (sessions.labs[labId] && shallowEqual(sessions.labs[labId], revived)) return sessions;
	return {
		version: LAB_SESSION_VERSION,
		labs: { ...sessions.labs, [labId]: revived }
	};
}

export function clearLab(sessions: LabSessions, labId: string): LabSessions {
	if (!(labId in sessions.labs)) return sessions;
	const labs = { ...sessions.labs };
	delete labs[labId];
	return { version: LAB_SESSION_VERSION, labs };
}

/** In-progress only — finished leftovers are not a homepage "resume". */
export function resumable(progress: LabProgress | undefined, stepCount: number): LabProgress | null {
	if (!progress || progress.finished) return null;
	if (progress.nextIndex <= 0 || progress.nextIndex >= stepCount) return null;
	return progress;
}

function sameOutcomes(a: (CardOutcome | null)[], b: (CardOutcome | null)[]): boolean {
	if (a.length !== b.length) return false;
	return a.every((value, i) => value === b[i]);
}

function shallowEqual(a: LabProgress, b: LabProgress): boolean {
	return (
		a.nextIndex === b.nextIndex &&
		a.firstTry === b.firstTry &&
		a.elapsedMs === b.elapsedMs &&
		a.finished === b.finished &&
		sameOutcomes(a.outcomes, b.outcomes)
	);
}
