/**
 * merge.ts — deterministic reconciliation of two progress documents.
 *
 * Sync is login-and-load: the server stores one document per account, and two
 * devices can each carry real reviews before either pushes. Losing a sitting
 * would be the worst failure this app can have — the scheduler silently
 * forgets — so conflicts are resolved by merging, never by asking the learner
 * to pick a save point.
 *
 * Both functions are pure, idempotent, and symmetric in effect: the same
 * winners fall out regardless of argument order (array *order* follows the
 * first argument, but membership and per-card winners do not). Callers pass
 * already-revived documents; the SRS merge additionally re-runs its result
 * through `reviveState` so the output is valid by construction.
 */

import { DAY_MS, RELEARN_MS, reviveState, type CardState, type SrsState } from './srs';
import { LAB_SESSION_VERSION, type LabProgress, type LabSessions } from './labSession';

/**
 * The instant a card was last graded, recovered from its schedule. A graded
 * card's `due` is always `reviewTime + interval`: `ivl` days on success, or
 * `RELEARN_MS` after a miss (which zeroes `ivl`). Cards only enter the
 * document through grading, so this is total.
 */
export function lastReviewedAt(card: CardState): number {
	return card.due - (card.ivl > 0 ? card.ivl * DAY_MS : RELEARN_MS);
}

/** Later review wins; ties break on activity (reps+lapses), then due, then `a`. */
function winningCard(a: CardState, b: CardState): CardState {
	const at = lastReviewedAt(a);
	const bt = lastReviewedAt(b);
	if (at !== bt) return at > bt ? a : b;
	const aActivity = a.reps + a.lapses;
	const bActivity = b.reps + b.lapses;
	if (aActivity !== bActivity) return aActivity > bActivity ? a : b;
	if (a.due !== b.due) return a.due > b.due ? a : b;
	return a;
}

/** Order-stable union: `a`'s order first, then `b`'s additions. */
function unionIds(a: string[], b: string[]): string[] {
	const have = new Set(a);
	return [...a, ...b.filter((id) => !have.has(id))];
}

export function mergeSrsState(a: SrsState, b: SrsState): SrsState {
	const cards: Record<string, CardState> = { ...a.cards };
	for (const [id, card] of Object.entries(b.cards)) {
		const mine = cards[id];
		cards[id] = mine ? winningCard(mine, card) : card;
	}

	const days: Record<string, number> = { ...a.days };
	for (const [iso, count] of Object.entries(b.days)) {
		days[iso] = Math.max(days[iso] ?? 0, count);
	}

	// A pin triple travels together: mixing one day's count with another
	// day's ids would let a stale device re-draw past its daily cap. ISO dates
	// compare lexically and '' sorts before every date. Each track's triple
	// merges independently.
	function mergedPin(
		aPin: { date: string; count: number; ids: string[] },
		bPin: { date: string; count: number; ids: string[] }
	): { date: string; count: number; ids: string[] } {
		if (aPin.date !== bPin.date) return aPin.date > bPin.date ? aPin : bPin;
		return {
			date: aPin.date,
			count: Math.max(aPin.count, bPin.count),
			ids: unionIds(aPin.ids, bPin.ids)
		};
	}

	const pin = mergedPin(
		{ date: a.newDate, count: a.newCount, ids: a.newIds },
		{ date: b.newDate, count: b.newCount, ids: b.newIds }
	);
	const vocabPin = mergedPin(
		{ date: a.vocabNewDate, count: a.vocabNewCount, ids: a.vocabNewIds },
		{ date: b.vocabNewDate, count: b.vocabNewCount, ids: b.vocabNewIds }
	);

	return reviveState({
		version: 1,
		unlocked: unionIds(a.unlocked, b.unlocked),
		openedLabs: unionIds(a.openedLabs, b.openedLabs),
		flagged: unionIds(a.flagged, b.flagged),
		cards,
		days,
		newDate: pin.date,
		newCount: pin.count,
		newIds: pin.ids,
		vocabNewDate: vocabPin.date,
		vocabNewCount: vocabPin.count,
		vocabNewIds: vocabPin.ids
	});
}

/**
 * Whole-sitting-wins per lab. Outcomes are index-aligned to one specific run,
 * so element-wise mixing would fabricate a sitting that never happened — the
 * further-along document keeps its entire record instead.
 */
function furtherAlong(a: LabProgress, b: LabProgress): LabProgress {
	if (a.finished !== b.finished) return a.finished ? a : b;
	if (a.nextIndex !== b.nextIndex) return a.nextIndex > b.nextIndex ? a : b;
	if (a.elapsedMs !== b.elapsedMs) return a.elapsedMs > b.elapsedMs ? a : b;
	if (a.firstTry !== b.firstTry) return a.firstTry > b.firstTry ? a : b;
	return a;
}

export function mergeLabSessions(a: LabSessions, b: LabSessions): LabSessions {
	const labs: Record<string, LabProgress> = { ...a.labs };
	for (const [id, progress] of Object.entries(b.labs)) {
		const mine = labs[id];
		labs[id] = mine ? furtherAlong(mine, progress) : progress;
	}
	return { version: LAB_SESSION_VERSION, labs };
}
