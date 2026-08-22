import { describe, it, expect } from 'vitest';
import { lastReviewedAt, mergeLabSessions, mergeSrsState } from './merge';
import {
	AGAIN,
	DAY_MS,
	EASY,
	GOOD,
	RELEARN_MS,
	emptyState,
	grade,
	reviveState,
	unlock,
	type CardState,
	type SrsState
} from './srs';
import { emptySessions, type LabProgress, type LabSessions } from './labSession';

/** Local noon so calendar-day arithmetic does not depend on the host timezone. */
const T0 = new Date(2026, 2, 1, 12, 0, 0).getTime();

function card(overrides: Partial<CardState> = {}): CardState {
	return { ease: 2.5, ivl: 3, reps: 2, lapses: 0, due: T0 + 3 * DAY_MS, ...overrides };
}

function docWith(overrides: Partial<SrsState>): SrsState {
	return reviveState({ ...emptyState(), ...overrides });
}

function progress(overrides: Partial<LabProgress> = {}): LabProgress {
	return { nextIndex: 4, firstTry: 3, elapsedMs: 60_000, finished: false, outcomes: [], ...overrides };
}

describe('lastReviewedAt', () => {
	it('recovers the review instant from a graded card', () => {
		const graded = grade(emptyState(), 'c0', GOOD, T0);
		expect(lastReviewedAt(graded.card)).toBe(T0);
	});

	it('recovers the review instant from a missed card', () => {
		const missed = grade(emptyState(), 'c0', AGAIN, T0);
		expect(missed.card.ivl).toBe(0);
		expect(missed.card.due).toBe(T0 + RELEARN_MS);
		expect(lastReviewedAt(missed.card)).toBe(T0);
	});
});

describe('mergeSrsState — cards', () => {
	it('is identity against an empty document, both orders', () => {
		const real = docWith({
			unlocked: ['lab01'],
			cards: { c0: card() },
			days: { '2026-03-01': 4 },
			newDate: '2026-03-01',
			newCount: 2,
			newIds: ['c9']
		});
		expect(mergeSrsState(real, emptyState())).toEqual(real);
		expect(mergeSrsState(emptyState(), real)).toEqual(real);
	});

	it('is idempotent on identical documents', () => {
		const doc = docWith({ unlocked: ['lab01'], cards: { c0: card() } });
		expect(mergeSrsState(doc, doc)).toEqual(doc);
	});

	it('unions disjoint cards', () => {
		const a = docWith({ cards: { c0: card() } });
		const b = docWith({ cards: { c1: card({ due: T0 + DAY_MS }) } });
		const merged = mergeSrsState(a, b);
		expect(Object.keys(merged.cards).sort()).toEqual(['c0', 'c1']);
	});

	it('keeps the later-reviewed card regardless of argument order', () => {
		// Same card reviewed on two devices: phone at T0 (EASY), laptop a day
		// later (GOOD). The laptop's schedule must win in both directions.
		const phone = grade(emptyState(), 'c0', EASY, T0).state;
		const laptop = grade(emptyState(), 'c0', GOOD, T0 + DAY_MS).state;
		const ab = mergeSrsState(phone, laptop);
		const ba = mergeSrsState(laptop, phone);
		expect(ab.cards.c0).toEqual(laptop.cards.c0);
		expect(ba.cards.c0).toEqual(laptop.cards.c0);
	});

	it('an AGAIN after a success wins over the earlier success', () => {
		const success = grade(emptyState(), 'c0', GOOD, T0).state;
		const laterMiss = grade(success, 'c0', AGAIN, T0 + 2 * DAY_MS).state;
		const merged = mergeSrsState(success, laterMiss);
		expect(merged.cards.c0).toEqual(laterMiss.cards.c0);
		expect(merged.cards.c0.ivl).toBe(0);
	});

	it('breaks same-instant ties on activity, then due, deterministically', () => {
		// Same inferred review time: one side has an extra lapse behind it.
		const busy = card({ reps: 2, lapses: 3 });
		const quiet = card({ reps: 2, lapses: 0 });
		const a = docWith({ cards: { c0: busy } });
		const b = docWith({ cards: { c0: quiet } });
		expect(mergeSrsState(a, b).cards.c0).toEqual(busy);
		expect(mergeSrsState(b, a).cards.c0).toEqual(busy);
	});
});

describe('mergeSrsState — unlocks, days, pin', () => {
	it('unions unlocked tiers and opened labs by membership', () => {
		const a = docWith({ unlocked: ['lab01', 'lab02'], openedLabs: ['0003'] });
		const b = docWith({ unlocked: ['lab02', 'lab03'], openedLabs: ['0004'] });
		const merged = mergeSrsState(a, b);
		expect(merged.unlocked).toEqual(['lab01', 'lab02', 'lab03']);
		expect(merged.openedLabs.sort()).toEqual(['0003', '0004']);
		expect(mergeSrsState(b, a).unlocked.sort()).toEqual(merged.unlocked.slice().sort());
	});

	it('takes the max per day, never the sum', () => {
		const a = docWith({ days: { '2026-03-01': 10, '2026-03-02': 3 } });
		const b = docWith({ days: { '2026-03-01': 4, '2026-03-03': 7 } });
		expect(mergeSrsState(a, b).days).toEqual({
			'2026-03-01': 10,
			'2026-03-02': 3,
			'2026-03-03': 7
		});
	});

	it('the later newDate carries its whole pin triple', () => {
		const stale = docWith({ newDate: '2026-02-28', newCount: 9, newIds: ['x1', 'x2'] });
		const today = docWith({ newDate: '2026-03-01', newCount: 2, newIds: ['y1'] });
		for (const merged of [mergeSrsState(stale, today), mergeSrsState(today, stale)]) {
			expect(merged.newDate).toBe('2026-03-01');
			expect(merged.newCount).toBe(2);
			expect(merged.newIds).toEqual(['y1']);
		}
	});

	it('an unpinned document ("" date) loses to any pinned one', () => {
		const fresh = docWith({});
		const pinned = docWith({ newDate: '2026-03-01', newCount: 1, newIds: ['c3'] });
		expect(mergeSrsState(fresh, pinned).newDate).toBe('2026-03-01');
		expect(mergeSrsState(pinned, fresh).newIds).toEqual(['c3']);
	});

	it('equal newDate takes max count and the union of pinned ids', () => {
		const a = docWith({ newDate: '2026-03-01', newCount: 2, newIds: ['c1', 'c2'] });
		const b = docWith({ newDate: '2026-03-01', newCount: 5, newIds: ['c2', 'c3'] });
		const merged = mergeSrsState(a, b);
		expect(merged.newCount).toBe(5);
		expect(merged.newIds).toEqual(['c1', 'c2', 'c3']);
	});

	it('output is revived: day keys prune to the newest 400', () => {
		const packed: Record<string, number> = {};
		const start = Date.UTC(2020, 0, 1);
		for (let i = 0; i < 250; i++) {
			packed[new Date(start + i * DAY_MS).toISOString().slice(0, 10)] = 1;
		}
		const later: Record<string, number> = {};
		for (let i = 250; i < 500; i++) {
			later[new Date(start + i * DAY_MS).toISOString().slice(0, 10)] = 1;
		}
		const merged = mergeSrsState(docWith({ days: packed }), docWith({ days: later }));
		expect(Object.keys(merged.days).length).toBe(400);
		expect(merged.days['2020-01-01']).toBeUndefined();
	});

	it('a foreign document degraded to empty by reviveState merges as a no-op', () => {
		// Callers revive before merging; a wrong-version remote becomes empty.
		const local = unlock(docWith({ cards: { c0: card() } }), ['lab01']);
		const remote = reviveState({ version: 99, cards: { evil: card() } });
		expect(mergeSrsState(local, remote)).toEqual(local);
	});
});

describe('mergeLabSessions', () => {
	const steps = (labs: Record<string, LabProgress>): LabSessions => ({ version: 1, labs });

	it('is identity against empty, both orders', () => {
		const real = steps({ '0001': progress() });
		expect(mergeLabSessions(real, emptySessions())).toEqual(real);
		expect(mergeLabSessions(emptySessions(), real)).toEqual(real);
	});

	it('unions disjoint labs', () => {
		const merged = mergeLabSessions(
			steps({ '0001': progress() }),
			steps({ '0002': progress({ nextIndex: 1 }) })
		);
		expect(Object.keys(merged.labs).sort()).toEqual(['0001', '0002']);
	});

	it('finished beats an unfinished sitting that is further by index', () => {
		const done = progress({ nextIndex: 17, finished: true, outcomes: ['right'] });
		const midway = progress({ nextIndex: 12, outcomes: ['wrong'] });
		expect(mergeLabSessions(steps({ '0001': done }), steps({ '0001': midway })).labs['0001']).toEqual(done);
		expect(mergeLabSessions(steps({ '0001': midway }), steps({ '0001': done })).labs['0001']).toEqual(done);
	});

	it('greater nextIndex wins and keeps its whole outcome record', () => {
		const far = progress({ nextIndex: 9, outcomes: ['right', 'right'] });
		const near = progress({ nextIndex: 4, outcomes: ['wrong'] });
		const merged = mergeLabSessions(steps({ '0001': near }), steps({ '0001': far }));
		expect(merged.labs['0001']).toEqual(far);
		// Never element-wise mixed: the winner's outcomes array is untouched.
		expect(merged.labs['0001'].outcomes).toBe(far.outcomes);
	});

	it('ties fall through elapsedMs then firstTry then the first argument', () => {
		const longer = progress({ elapsedMs: 90_000 });
		const shorter = progress({ elapsedMs: 60_000 });
		expect(mergeLabSessions(steps({ '0001': shorter }), steps({ '0001': longer })).labs['0001']).toEqual(longer);

		const cleaner = progress({ firstTry: 4 });
		const rougher = progress({ firstTry: 2 });
		expect(mergeLabSessions(steps({ '0001': rougher }), steps({ '0001': cleaner })).labs['0001']).toEqual(cleaner);

		const a = progress();
		const b = progress();
		expect(mergeLabSessions(steps({ '0001': a }), steps({ '0001': b })).labs['0001']).toBe(a);
	});

	it('is idempotent', () => {
		const doc = steps({ '0001': progress(), '0002': progress({ finished: true, nextIndex: 16 }) });
		expect(mergeLabSessions(doc, doc)).toEqual(doc);
	});
});
