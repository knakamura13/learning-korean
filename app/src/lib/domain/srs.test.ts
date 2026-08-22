import { describe, it, expect, vi } from 'vitest';
import {
	AGAIN, HARD, GOOD, EASY, DAY_MS, MATURE_DAYS, RELEARN_MS, DEFAULT_NEW_PER_DAY,
	DEFAULT_REVIEW_PER_SITTING, MAX_BACKUP_CHARS, FAST_MS, STEADY_MS,
	emptyState, reviveState, decodeStoredState, isSrsBackup, parseImportedBackup,
	unlock, isUnlocked, grade, gradeFromAttempt, attemptSpeed,
	due, pinNewForDay, nextDueAt, stats, streak, weakest, isoDay,
	tierCountLabel, tierReviewProgress,
	type SrsState, type SchedulableCard
} from './srs';

/** Local noon so calendar-day tests do not depend on the host timezone. */
const T0 = new Date(2026, 2, 1, 12, 0, 0).getTime();
const deck: SchedulableCard[] = [
	...Array.from({ length: 19 }, (_, i) => ({ id: `c${i}`, tier: 'lab01' })),
	...Array.from({ length: 10 }, (_, i) => ({ id: `v${i}`, tier: 'lab02' }))
];
/** Deterministic ordering so queue tests do not flake. */
const noShuffle = <T>(x: T[]) => x;

describe('state hygiene', () => {
	it('starts empty and locked', () => {
		const s = emptyState();
		expect(s.unlocked).toEqual([]);
		expect(due(s, deck, T0)).toEqual([]);
		expect(stats(s, deck, T0).unlocked).toBe(0);
	});

	it('survives corrupt or foreign persisted data', () => {
		expect(reviveState(null).version).toBe(1);
		expect(reviveState('nonsense').unlocked).toEqual([]);
		expect(reviveState({ version: 99 }).cards).toEqual({});
		expect(reviveState({ nope: true })).toEqual(emptyState());
		expect(reviveState({ version: 1, unlocked: ['lab01', 7] }).unlocked).toEqual(['lab01']);
	});

	it('keeps valid cards and drops entries whose fields are not finite numbers', () => {
		const revived = reviveState({
			version: 1,
			unlocked: ['lab01'],
			cards: {
				c0: { ease: 2.5, ivl: 3, reps: 2, lapses: 0, due: T0 },
				poison: { ease: 'nope', ivl: 3, reps: 2, lapses: 0, due: T0 }
			},
			days: { '2026-03-01': 12 }
		});
		expect(Object.keys(revived.cards)).toEqual(['c0']);
		expect(revived.cards.c0.ivl).toBe(3);
	});

	it('clamps revived ease and interval so a hand-edited blob cannot explode the scheduler', () => {
		const revived = reviveState({
			version: 1,
			unlocked: ['lab01'],
			cards: {
				c0: { ease: 99, ivl: 10_000, reps: 2, lapses: 0, due: T0 }
			}
		});
		expect(revived.cards.c0.ease).toBeLessThanOrEqual(2.8);
		expect(revived.cards.c0.ivl).toBeLessThanOrEqual(365);
	});

	it('drops non-numeric day counts so a later grade cannot concatenate strings', () => {
		const revived = reviveState({
			version: 1,
			unlocked: ['lab01'],
			cards: {},
			days: { '2026-03-01': '5', nope: 1, '2026-03-02': 2 }
		});
		expect(revived.days).toEqual({ '2026-03-02': 2 });
	});

	it('keeps at most 400 day keys, the most recent ones', () => {
		const packed: Record<string, number> = {};
		const start = Date.UTC(2020, 0, 1);
		for (let i = 0; i < 401; i++) {
			const iso = new Date(start + i * 86_400_000).toISOString().slice(0, 10);
			packed[iso] = 1;
		}
		const revived = reviveState({ version: 1, unlocked: [], cards: {}, days: packed });
		expect(Object.keys(revived.days)).toHaveLength(400);
		expect(revived.days['2020-01-01']).toBeUndefined();
		const last = new Date(start + 400 * 86_400_000).toISOString().slice(0, 10);
		expect(revived.days[last]).toBe(1);
	});

	it('quarantines raw JSON that does not parse, without inventing a writeable state', () => {
		expect(decodeStoredState(null)).toEqual({ state: emptyState(), corrupt: null });
		expect(decodeStoredState('')).toEqual({ state: emptyState(), corrupt: null });
		const bad = '{not json';
		expect(decodeStoredState(bad)).toEqual({ state: emptyState(), corrupt: bad });
	});

	it('quarantines parsed JSON that is not a v1 SRS document so a later persist cannot wipe it', () => {
		const future = JSON.stringify({ version: 99, unlocked: ['lab01'], cards: { c0: { ease: 2.5, ivl: 3, reps: 2, lapses: 0, due: T0 } } });
		expect(decodeStoredState(future)).toEqual({ state: emptyState(), corrupt: future });

		const foreign = JSON.stringify({ nope: true });
		expect(decodeStoredState(foreign)).toEqual({ state: emptyState(), corrupt: foreign });
	});

	it('adopts progress written by the pre-rewrite app, which used `v` not `version`', () => {
		const legacy = {
			v: 1,
			unlocked: ['lab01'],
			cards: { c0: { ease: 2.5, ivl: 3, reps: 2, lapses: 0, due: T0 } },
			days: { '2026-03-01': 12 },
			newDate: '2026-03-01',
			newCount: 10
		};
		const revived = reviveState(legacy);
		expect(revived.version).toBe(1);
		expect(revived.unlocked).toEqual(['lab01']);
		expect(Object.keys(revived.cards)).toEqual(['c0']);
		expect(revived.days['2026-03-01']).toBe(12);
		expect(revived.newCount).toBe(10);
		expect(revived.newIds).toEqual([]);
		// and the migrated state must still schedule correctly
		expect(stats(revived, deck, T0).seen).toBe(1);
	});

	it('treats a missing new-card pin as empty so old payloads still revive', () => {
		const revived = reviveState({
			version: 1,
			unlocked: ['lab01'],
			cards: {},
			days: {},
			newDate: '2026-03-01',
			newCount: 0
		});
		expect(revived.newIds).toEqual([]);
	});

	it('unlocks tiers idempotently', () => {
		let s = unlock(emptyState(), ['lab01']);
		expect(isUnlocked(s, 'lab01')).toBe(true);
		const again = unlock(s, ['lab01']);
		expect(again).toBe(s); // unchanged reference — no needless writes
		s = unlock(s, ['lab01', 'lab02']);
		expect(s.unlocked).toEqual(['lab01', 'lab02']);
	});

	it('never mutates the state it is given', () => {
		const s = unlock(emptyState(), ['lab01']);
		const snapshot = JSON.stringify(s);
		grade(s, 'c0', GOOD, T0);
		due(s, deck, T0);
		pinNewForDay(s, deck, T0);
		stats(s, deck, T0);
		expect(JSON.stringify(s)).toBe(snapshot);
	});
});

describe('backup validation', () => {
	it('rejects payloads that are not SRS backups', () => {
		expect(isSrsBackup({ nope: true })).toBe(false);
		expect(isSrsBackup({ version: 1 })).toBe(false);
		expect(isSrsBackup({ version: 1, unlocked: [], cards: [] })).toBe(false);
	});

	it('accepts v1 backups with unlocked and cards', () => {
		expect(isSrsBackup({ version: 1, unlocked: [], cards: {} })).toBe(true);
		expect(isSrsBackup({ v: 1, unlocked: ['lab01'], cards: {} })).toBe(true);
	});

	it('rejects unlocked / openedLabs / newIds that are not string arrays', () => {
		expect(isSrsBackup({ version: 1, unlocked: [1, 2], cards: {} })).toBe(false);
		expect(isSrsBackup({ version: 1, unlocked: [], openedLabs: [0], cards: {} })).toBe(false);
		expect(isSrsBackup({ version: 1, unlocked: [], cards: {}, newIds: [1] })).toBe(false);
	});

	it('parseImportedBackup fails closed on invalid input', () => {
		expect(parseImportedBackup('{"nope":true}')).toBeNull();
		expect(parseImportedBackup('not json')).toBeNull();
	});

	it('parseImportedBackup rejects a poison card instead of importing NaN intervals', () => {
		const payload = {
			version: 1,
			unlocked: ['lab01'],
			cards: { c0: { ease: 'nope', ivl: 3, reps: 2, lapses: 0, due: T0 } }
		};
		expect(isSrsBackup(payload)).toBe(false);
		expect(parseImportedBackup(JSON.stringify(payload))).toBeNull();
	});

	it('parseImportedBackup rejects non-numeric day counts', () => {
		const payload = {
			version: 1,
			unlocked: [],
			cards: {},
			days: { '2026-03-01': '5' }
		};
		expect(parseImportedBackup(JSON.stringify(payload))).toBeNull();
	});

	it('parseImportedBackup rejects oversized payloads', () => {
		expect(parseImportedBackup(`{"version":1,${'x'.repeat(MAX_BACKUP_CHARS)}}`)).toBeNull();
	});

	it('parseImportedBackup revives a valid v1 payload', () => {
		const payload = {
			version: 1,
			unlocked: ['lab01'],
			cards: { c0: { ease: 2.5, ivl: 3, reps: 2, lapses: 0, due: T0 } },
			days: { '2026-03-01': 5 },
			newDate: '2026-03-01',
			newCount: 3,
			newIds: ['c1']
		};
		const revived = parseImportedBackup(JSON.stringify(payload));
		expect(revived).not.toBeNull();
		expect(revived!.version).toBe(1);
		expect(revived!.unlocked).toEqual(['lab01']);
		expect(revived!.cards.c0.ivl).toBe(3);
		expect(revived!.days['2026-03-01']).toBe(5);
		expect(revived!.newCount).toBe(3);
		expect(revived!.newIds).toEqual(['c1']);
	});
});

describe('the interval curve', () => {
	const run = (grades: number[]) => {
		let s = unlock(emptyState(), ['lab01']);
		let now = T0;
		const out: number[] = [];
		for (const g of grades) {
			const r = grade(s, 'c0', g as never, now);
			s = r.state;
			out.push(r.card.ivl);
			now += Math.max(r.card.ivl, 0.01) * DAY_MS;
		}
		return { intervals: out, state: s, card: s.cards.c0 };
	};

	it('stretches out under repeated GOOD', () => {
		const { intervals } = run([GOOD, GOOD, GOOD, GOOD, GOOD, GOOD]);
		expect(intervals.slice(0, 3)).toEqual([1, 3, 7.5]);
		// strictly increasing thereafter
		for (let i = 1; i < intervals.length; i++) {
			expect(intervals[i]).toBeGreaterThan(intervals[i - 1]);
		}
	});

	it('collapses on a lapse and cuts ease, but keeps the lapse count', () => {
		let s = unlock(emptyState(), ['lab01']);
		let now = T0;
		for (const g of [GOOD, GOOD, GOOD]) { s = grade(s, 'c0', g, now).state; now += 5 * DAY_MS; }
		const beforeEase = s.cards.c0.ease;

		const r = grade(s, 'c0', AGAIN, now);
		expect(r.card.ivl).toBe(0);
		expect(r.card.reps).toBe(0);
		expect(r.card.lapses).toBe(1);
		expect(r.card.ease).toBeLessThan(beforeEase);
		expect(r.card.due - now).toBe(RELEARN_MS);
	});

	it('does not restore the old interval after recovering from a lapse', () => {
		let s = unlock(emptyState(), ['lab01']);
		let now = T0;
		for (const g of [GOOD, GOOD, GOOD, GOOD]) { s = grade(s, 'c0', g, now).state; now += 20 * DAY_MS; }
		const peak = s.cards.c0.ivl;
		s = grade(s, 'c0', AGAIN, now).state;
		const after = grade(s, 'c0', GOOD, now).card;
		expect(after.ivl).toBe(1);
		expect(after.ivl).toBeLessThan(peak);
	});

	it('clamps ease at both ends and caps the interval at a year', () => {
		let s = unlock(emptyState(), ['lab01']);
		for (let i = 0; i < 20; i++) s = grade(s, 'c0', AGAIN, T0).state;
		expect(s.cards.c0.ease).toBeCloseTo(1.3, 5);

		let t = unlock(emptyState(), ['lab01']);
		let now = T0;
		for (let i = 0; i < 20; i++) { t = grade(t, 'c1', EASY, now).state; now += 400 * DAY_MS; }
		expect(t.cards.c1.ease).toBeCloseTo(2.8, 5);
		expect(t.cards.c1.ivl).toBe(365);
	});

	it('treats HARD as a slower advance, not a failure', () => {
		let s = unlock(emptyState(), ['lab01']);
		const first = grade(s, 'c0', HARD, T0);
		expect(first.card.ivl).toBe(1);
		expect(first.card.lapses).toBe(0);
		expect(first.card.reps).toBe(1);
		expect(first.card.ease).toBeLessThan(2.5);
	});
});

describe('grading from an attempt', () => {
	it('maps correctness and latency onto grades', () => {
		expect(gradeFromAttempt(false, 100, false)).toBe(AGAIN);
		expect(gradeFromAttempt(false, 100, true)).toBe(AGAIN);
		expect(gradeFromAttempt(true, 1200, false)).toBe(EASY);
		expect(gradeFromAttempt(true, 6000, false)).toBe(GOOD);
		expect(gradeFromAttempt(true, 20000, false)).toBe(HARD);
	});

	it('never awards EASY to a card seen for the first time', () => {
		expect(gradeFromAttempt(true, 10, true)).toBe(GOOD);
	});

	it('shares latency bands with the Review speed labels', () => {
		expect(attemptSpeed(FAST_MS - 1)).toBe('fast');
		expect(attemptSpeed(FAST_MS)).toBe('steady');
		expect(attemptSpeed(STEADY_MS - 1)).toBe('steady');
		expect(attemptSpeed(STEADY_MS)).toBe('slow');
		expect(gradeFromAttempt(true, FAST_MS - 1, false)).toBe(EASY);
		expect(gradeFromAttempt(true, FAST_MS, false)).toBe(GOOD);
		expect(gradeFromAttempt(true, STEADY_MS, false)).toBe(HARD);
	});
});

describe('the queue', () => {
	it('schedules nothing from locked tiers', () => {
		const s = unlock(emptyState(), ['lab01']);
		const q = due(s, deck, T0, { shuffle: noShuffle });
		expect(q.every((c) => c.tier === 'lab01')).toBe(true);
	});

	it('caps new cards per day and refills the next day', () => {
		let s = unlock(emptyState(), ['lab01']);
		const first = due(s, deck, T0, { shuffle: noShuffle });
		expect(first).toHaveLength(10);

		for (const c of first) s = grade(s, c.id, GOOD, T0).state;
		expect(due(s, deck, T0, { shuffle: noShuffle })).toHaveLength(0);

		// Next day: yesterday's cards are due again, and the new allowance resets.
		const tomorrow = T0 + DAY_MS + 60_000;
		const q = due(s, deck, tomorrow, { shuffle: noShuffle });
		expect(q.length).toBeGreaterThan(10);
		expect(q.filter((c) => s.cards[c.id]).length).toBe(10); // the reviews
	});

	it('puts overdue reviews before new cards', () => {
		let s = unlock(emptyState(), ['lab01']);
		s = grade(s, 'c5', GOOD, T0).state;
		const later = T0 + 2 * DAY_MS;
		const q = due(s, deck, later, { shuffle: noShuffle });
		expect(q[0].id).toBe('c5');
	});

	it('pins today’s new cards so later due() calls do not reshuffle them', () => {
		let s = unlock(emptyState(), ['lab01']);
		const reverse = <T>(items: T[]) => items.slice().reverse();
		s = pinNewForDay(s, deck, T0, { shuffle: reverse });
		const first = due(s, deck, T0, { shuffle: noShuffle }).map((c) => c.id);
		expect(first).toHaveLength(DEFAULT_NEW_PER_DAY);
		expect(first).toEqual(
			due(s, deck, T0, { shuffle: noShuffle }).map((c) => c.id)
		);
		// A different shuffle must not replace the pin.
		expect(due(s, deck, T0, { shuffle: reverse }).map((c) => c.id)).toEqual(first);
		expect(s.newIds).toEqual(first);
	});

	it('draws a new pin on a new day, still capped', () => {
		let s = unlock(emptyState(), ['lab01', 'lab02']);
		s = pinNewForDay(s, deck, T0, { shuffle: noShuffle });
		const dayOne = due(s, deck, T0, { shuffle: noShuffle }).map((c) => c.id);
		expect(dayOne).toHaveLength(DEFAULT_NEW_PER_DAY);

		for (const id of dayOne) s = grade(s, id, GOOD, T0).state;

		const tomorrow = T0 + DAY_MS + 60_000;
		s = pinNewForDay(s, deck, tomorrow, { shuffle: noShuffle });
		const q = due(s, deck, tomorrow, { shuffle: noShuffle });
		const fresh = q.filter((c) => !s.cards[c.id]).map((c) => c.id);
		expect(fresh).toHaveLength(DEFAULT_NEW_PER_DAY);
		expect(fresh.some((id) => dayOne.includes(id))).toBe(false);
		expect(s.newDate).toBe(isoDay(tomorrow));
		expect(s.newIds).toEqual(fresh);
	});

	it('keeps the same-day pin when more cards unlock, and fills leftover room', () => {
		const tiny: SchedulableCard[] = [
			{ id: 'a', tier: 'lab01' },
			{ id: 'b', tier: 'lab01' },
			{ id: 'c', tier: 'lab02' },
			{ id: 'd', tier: 'lab02' }
		];
		let s = unlock(emptyState(), ['lab01']);
		s = pinNewForDay(s, tiny, T0, { shuffle: noShuffle, newPerDay: 3 });
		expect(s.newIds).toEqual(['a', 'b']);

		s = unlock(s, ['lab02']);
		s = pinNewForDay(s, tiny, T0, { shuffle: noShuffle, newPerDay: 3 });
		expect(s.newIds).toEqual(['a', 'b', 'c']);
		expect(due(s, tiny, T0, { shuffle: noShuffle, newPerDay: 3 }).map((c) => c.id)).toEqual([
			'a',
			'b',
			'c'
		]);
	});

	it('orders reviews by how overdue they are', () => {
		let s = unlock(emptyState(), ['lab01']);
		s = grade(s, 'c1', GOOD, T0).state;          // due T0 + 1d
		s = grade(s, 'c2', EASY, T0).state;          // due T0 + 4d
		const q = due(s, deck, T0 + 10 * DAY_MS, { shuffle: noShuffle, newPerDay: 0 });
		expect(q.map((c) => c.id)).toEqual(['c1', 'c2']);
	});

	it('caps overdue reviews per sitting and leaves the rest in stats.due', () => {
		let s = unlock(emptyState(), ['lab01', 'lab02']);
		for (const c of deck) s = grade(s, c.id, GOOD, T0).state;
		const later = T0 + 10 * DAY_MS;
		const q = due(s, deck, later, { shuffle: noShuffle, newPerDay: 0 });
		expect(q).toHaveLength(DEFAULT_REVIEW_PER_SITTING);
		expect(stats(s, deck, later, { newPerDay: 0 }).due).toBe(deck.length);
	});

	it('reports when the next card comes back', () => {
		let s = unlock(emptyState(), ['lab01']);
		expect(nextDueAt(s, deck)).toBeNull();
		s = grade(s, 'c0', GOOD, T0).state;
		expect(nextDueAt(s, deck)).toBe(T0 + DAY_MS);
	});
});

describe('stats', () => {
	it('counts a card as mature only past the retention threshold', () => {
		let s = unlock(emptyState(), ['lab01']);
		let now = T0;
		// The curve is 1 → 3 → 7.5 → 18.8 → 47 days, so maturity (21d) is
		// reached on the fifth successful review, not the third.
		const seen = () => stats(s, deck, now);

		for (let i = 0; i < 4; i++) { s = grade(s, 'c0', GOOD, now).state; now += 30 * DAY_MS; }
		expect(s.cards.c0.ivl).toBeLessThan(MATURE_DAYS);
		expect(seen().young).toBe(1);
		expect(seen().mature).toBe(0);

		s = grade(s, 'c0', GOOD, now).state;
		expect(s.cards.c0.ivl).toBeGreaterThanOrEqual(MATURE_DAYS);
		expect(seen().mature).toBe(1);
		expect(seen().young).toBe(0);
	});

	it('does not treat unlocking a lab as a review day', () => {
		const s = unlock(emptyState(), ['lab01']);
		expect(streak(s, T0)).toBe(0);
		expect(stats(s, deck, T0).streak).toBe(0);
	});

	it('tracks a streak across consecutive days and breaks on a gap', () => {
		let s = unlock(emptyState(), ['lab01']);
		s = grade(s, 'c0', GOOD, T0).state;
		s = grade(s, 'c1', GOOD, T0 + DAY_MS).state;
		s = grade(s, 'c2', GOOD, T0 + 2 * DAY_MS).state;
		expect(streak(s, T0 + 2 * DAY_MS)).toBe(3);
		// A missed day resets it.
		expect(streak(s, T0 + 5 * DAY_MS)).toBe(0);
	});

	it('still counts a streak earned yesterday when today is untouched', () => {
		let s = unlock(emptyState(), ['lab01']);
		s = grade(s, 'c0', GOOD, T0).state;
		expect(streak(s, T0 + DAY_MS)).toBe(1);
	});

	it('reports totals against the whole deck, not just unlocked cards', () => {
		const s = unlock(emptyState(), ['lab01']);
		const st = stats(s, deck, T0);
		expect(st.unlocked).toBe(19);
		expect(st.total).toBe(29);
	});
});

describe('tier review progress', () => {
	const tiers = [
		{ id: 'lab01', size: 19 },
		{ id: 'lab02', size: 10 }
	];

	it('treats an unlocked unreviewed tier as not started, not as a zeroed bar', () => {
		const s = unlock(emptyState(), ['lab01']);
		const [lab01, lab02] = tierReviewProgress(s, deck, tiers);
		expect(lab01).toMatchObject({
			unlocked: true,
			mature: 0,
			young: 0,
			unseen: 19,
			seen: 0,
			size: 19
		});
		expect(lab02.unlocked).toBe(false);
		expect(tierCountLabel(lab01)).toBe('19 not started');
		expect(tierCountLabel(lab02)).toBe('locked');
	});

	it('counts learning cards as seen, not only mature ones', () => {
		let s = unlock(emptyState(), ['lab01']);
		s = grade(s, 'c0', GOOD, T0).state;
		const [lab01] = tierReviewProgress(s, deck, tiers);
		expect(lab01.young).toBe(1);
		expect(lab01.mature).toBe(0);
		expect(lab01.seen).toBe(1);
		expect(lab01.unseen).toBe(18);
		expect(tierCountLabel(lab01)).toBe('1/19');
	});

	it('splits mastered from still-learning on the same unlocked tier', () => {
		let s = unlock(emptyState(), ['lab01']);
		let now = T0;
		for (let i = 0; i < 5; i++) {
			s = grade(s, 'c0', GOOD, now).state;
			now += 30 * DAY_MS;
		}
		s = grade(s, 'c1', GOOD, now).state;
		const [lab01] = tierReviewProgress(s, deck, tiers);
		expect(lab01.mature).toBe(1);
		expect(lab01.young).toBe(1);
		expect(lab01.unseen).toBe(17);
		expect(tierCountLabel(lab01)).toBe('2/19');
	});
});

describe('weakest', () => {
	it('surfaces the most-lapsed cards and ignores clean ones', () => {
		let s = unlock(emptyState(), ['lab01']);
		s = grade(s, 'c0', GOOD, T0).state;
		for (let i = 0; i < 3; i++) s = grade(s, 'c1', AGAIN, T0).state;
		s = grade(s, 'c2', AGAIN, T0).state;

		const w = weakest(s, deck, 5).map((c) => c.id);
		expect(w[0]).toBe('c1');
		expect(w).toContain('c2');
		expect(w).not.toContain('c0');
	});
});

describe('day boundaries', () => {
	it('formats the local calendar date, including late evening', () => {
		expect(isoDay(new Date(2026, 2, 1, 0, 30, 0).getTime())).toBe('2026-03-01');
		expect(isoDay(new Date(2026, 2, 1, 23, 59, 0).getTime())).toBe('2026-03-01');
	});

	it('reads local date fields rather than toISOString', () => {
		const iso = vi.spyOn(Date.prototype, 'toISOString');
		const ts = new Date(2026, 5, 15, 12, 0, 0).getTime();
		expect(isoDay(ts)).toBe('2026-06-15');
		expect(iso).not.toHaveBeenCalled();
		iso.mockRestore();
	});

	it('rolls the new-card allowance when the date changes', () => {
		let s: SrsState = unlock(emptyState(), ['lab01']);
		s = grade(s, 'c0', GOOD, T0).state;
		expect(s.newCount).toBe(1);
		s = grade(s, 'c1', GOOD, T0 + DAY_MS).state;
		expect(s.newCount).toBe(1); // reset, then incremented
		expect(s.newDate).toBe(isoDay(T0 + DAY_MS));
	});
});

describe('vocabulary track', () => {
	const mixedDeck: SchedulableCard[] = [
		...Array.from({ length: 19 }, (_, i) => ({ id: `c${i}`, tier: 'lab01' })),
		...Array.from({ length: 12 }, (_, i) => ({ id: `w${i}`, tier: 'vocab-food' }))
	];

	function bothUnlocked(): SrsState {
		return unlock(emptyState(), ['lab01', 'vocab-food']);
	}

	it('budgets each track separately in the daily draw', () => {
		const pinned = pinNewForDay(bothUnlocked(), mixedDeck, T0, { shuffle: noShuffle });
		expect(pinned.newIds).toHaveLength(10); // script default
		expect(pinned.vocabNewIds).toHaveLength(5); // vocab default
		expect(pinned.newIds.every((id) => id.startsWith('c'))).toBe(true);
		expect(pinned.vocabNewIds.every((id) => id.startsWith('w'))).toBe(true);

		const queue = due(pinned, mixedDeck, T0, { shuffle: noShuffle });
		expect(queue).toHaveLength(15);
	});

	it('grading a vocab card spends the vocab budget, not the script budget', () => {
		let state = pinNewForDay(bothUnlocked(), mixedDeck, T0, { shuffle: noShuffle });
		state = grade(state, 'w0', GOOD, T0, 'vocab').state;
		expect(state.vocabNewCount).toBe(1);
		expect(state.newCount).toBe(0);
		state = grade(state, 'c0', GOOD, T0).state;
		expect(state.newCount).toBe(1);
		expect(state.vocabNewCount).toBe(1);
	});

	it('rolls both pins on a new day and honors custom caps', () => {
		let state = pinNewForDay(bothUnlocked(), mixedDeck, T0, {
			shuffle: noShuffle,
			newPerDay: 2,
			vocabNewPerDay: 3
		});
		expect(state.newIds).toHaveLength(2);
		expect(state.vocabNewIds).toHaveLength(3);

		state = grade(state, 'w0', GOOD, T0, 'vocab').state;
		const tomorrow = T0 + DAY_MS;
		const rolled = pinNewForDay(state, mixedDeck, tomorrow, { shuffle: noShuffle });
		expect(rolled.vocabNewCount).toBe(0);
		expect(rolled.newDate).toBe(isoDay(tomorrow));
		expect(rolled.vocabNewDate).toBe(isoDay(tomorrow));
	});

	it('reports vocabNewLeft separately and adds it to the queue stat', () => {
		const s = stats(bothUnlocked(), mixedDeck, T0);
		expect(s.newLeft).toBe(10);
		expect(s.vocabNewLeft).toBe(5);
		expect(s.queue).toBe(15);
	});

	it('a script-only deck leaves the vocab triple inert', () => {
		const scriptOnly = unlock(emptyState(), ['lab01']);
		const deck: SchedulableCard[] = Array.from({ length: 5 }, (_, i) => ({ id: `c${i}`, tier: 'lab01' }));
		const pinned = pinNewForDay(scriptOnly, deck, T0, { shuffle: noShuffle });
		expect(pinned.vocabNewIds).toEqual([]);
		expect(stats(scriptOnly, deck, T0).vocabNewLeft).toBe(0);
	});

	it('revives legacy documents without vocab fields to safe defaults', () => {
		const legacy = reviveState({ version: 1, unlocked: ['lab01'], cards: {}, days: {} });
		expect(legacy.vocabNewDate).toBe('');
		expect(legacy.vocabNewCount).toBe(0);
		expect(legacy.vocabNewIds).toEqual([]);
	});
});
