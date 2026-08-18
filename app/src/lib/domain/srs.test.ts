import { describe, it, expect } from 'vitest';
import {
	AGAIN, HARD, GOOD, EASY, DAY_MS, MATURE_DAYS, RELEARN_MS, DEFAULT_NEW_PER_DAY,
	emptyState, reviveState, isSrsBackup, parseImportedBackup, unlock, isUnlocked, grade, gradeFromAttempt,
	due, pinNewForDay, nextDueAt, stats, streak, weakest, isoDay,
	tierCountLabel, tierReviewProgress,
	type SrsState, type SchedulableCard
} from './srs';

const T0 = Date.parse('2026-03-01T09:00:00.000Z');
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

	it('parseImportedBackup fails closed on invalid input', () => {
		expect(parseImportedBackup('{"nope":true}')).toBeNull();
		expect(parseImportedBackup('not json')).toBeNull();
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
	it('derives an ISO day from an instant', () => {
		expect(isoDay(Date.parse('2026-03-01T23:59:00.000Z'))).toBe('2026-03-01');
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
