/**
 * srs.ts — spaced repetition scheduling, as pure functions.
 *
 * Two deliberate changes from the original implementation:
 *
 * 1. **No I/O.** Every function takes state and returns new state. Persistence
 *    is somebody else's problem (see storage.ts), which is what makes the
 *    scheduling curve testable and what will make cross-device sync possible
 *    without touching this file.
 * 2. **The clock is a parameter.** The old version called Date.now() inline,
 *    so the interval curve could only be checked by mutating real time. Here a
 *    test can advance six months in a loop.
 *
 * The algorithm is an SM-2 variant. Grades are derived from correctness plus
 * latency rather than self-rating, because self-assessment is unreliable early
 * and hesitation is the honest signal that a card is not secure.
 */

export const DAY_MS = 86_400_000;

/** Cards seen this many days apart are treated as retained. */
export const MATURE_DAYS = 21;

/** Sized to keep a session near the ten-minute budget. */
export const DEFAULT_NEW_PER_DAY = 10;

/** A missed card comes back inside the same sitting. */
export const RELEARN_MS = 600_000;

const EASE_FLOOR = 1.3;
const EASE_CEILING = 2.8;
const EASE_START = 2.5;
const MAX_INTERVAL_DAYS = 365;

export type Grade = 0 | 1 | 2 | 3;
export const AGAIN: Grade = 0;
export const HARD: Grade = 1;
export const GOOD: Grade = 2;
export const EASY: Grade = 3;

export interface CardState {
	/** Ease factor; lower means the card comes back sooner. */
	ease: number;
	/** Current interval in days. 0 means "still learning". */
	ivl: number;
	/** Consecutive successful reviews. */
	reps: number;
	/** Times this card has been forgotten. */
	lapses: number;
	/** Epoch ms when it is next due. */
	due: number;
}

export interface SrsState {
	version: 1;
	unlocked: string[];
	cards: Record<string, CardState>;
	/** Reviews per ISO date, for streaks. */
	days: Record<string, number>;
	newDate: string;
	newCount: number;
	/** Unseen card ids chosen for `newDate`. Empty until a draw that day. */
	newIds: string[];
}

export interface SchedulableCard {
	id: string;
	tier: string;
}

export function emptyState(): SrsState {
	return { version: 1, unlocked: [], cards: {}, days: {}, newDate: '', newCount: 0, newIds: [] };
}

/**
 * Accepts anything and returns a valid state — corrupt storage must not brick
 * the app, and must not silently discard real progress either.
 *
 * The pre-rewrite app wrote its version as `v` rather than `version`, under the
 * same storage key. Serving this build from the old app's origin therefore
 * hands us that shape; treating it as unknown would throw away a learner's
 * whole history without a word. So the legacy field is accepted.
 */
export function reviveState(raw: unknown): SrsState {
	if (!raw || typeof raw !== 'object') return emptyState();
	const s = raw as Partial<SrsState> & { v?: number };
	const version = s.version ?? s.v;
	if (version !== 1) return emptyState();
	return {
		version: 1,
		unlocked: Array.isArray(s.unlocked) ? s.unlocked.filter((x) => typeof x === 'string') : [],
		cards: s.cards && typeof s.cards === 'object' ? s.cards : {},
		days: s.days && typeof s.days === 'object' ? s.days : {},
		newDate: typeof s.newDate === 'string' ? s.newDate : '',
		newCount: typeof s.newCount === 'number' ? s.newCount : 0,
		newIds: Array.isArray(s.newIds) ? s.newIds.filter((id) => typeof id === 'string') : []
	};
}

/** Strict shape check for file restore — unlike reviveState, rejects unknown payloads. */
export function isSrsBackup(raw: unknown): boolean {
	if (!raw || typeof raw !== 'object') return false;
	const s = raw as Partial<SrsState> & { v?: number };
	const version = s.version ?? s.v;
	if (version !== 1) return false;
	if (!Array.isArray(s.unlocked)) return false;
	if (!s.cards || typeof s.cards !== 'object' || Array.isArray(s.cards)) return false;
	return true;
}

/** Parse and validate an imported backup; returns null on any failure. */
export function parseImportedBackup(json: string): SrsState | null {
	try {
		const parsed = JSON.parse(json);
		if (!isSrsBackup(parsed)) return null;
		return reviveState(parsed);
	} catch {
		return null;
	}
}

export function isoDay(now: number): string {
	return new Date(now).toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ *
 * Unlocking
 * ------------------------------------------------------------------ */

export function unlock(state: SrsState, tiers: string[]): SrsState {
	const missing = tiers.filter((t) => !state.unlocked.includes(t));
	if (missing.length === 0) return state;
	return { ...state, unlocked: [...state.unlocked, ...missing] };
}

export function isUnlocked(state: SrsState, tier: string): boolean {
	return state.unlocked.includes(tier);
}

function pool<T extends SchedulableCard>(state: SrsState, deck: T[]): T[] {
	return deck.filter((c) => isUnlocked(state, c.tier));
}

/* ------------------------------------------------------------------ *
 * Grading
 * ------------------------------------------------------------------ */

/**
 * Turn an attempt into a grade. A correct-but-slow answer is scheduled sooner
 * than a correct-and-fast one; a brand new card never earns EASY on sight.
 */
export function gradeFromAttempt(correct: boolean, ms: number, isNew: boolean): Grade {
	if (!correct) return AGAIN;
	if (ms < 3500) return isNew ? GOOD : EASY;
	if (ms < 9000) return GOOD;
	return HARD;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

function nextCard(prev: CardState | undefined, g: Grade, now: number): CardState {
	const card: CardState = prev ?? { ease: EASE_START, ivl: 0, reps: 0, lapses: 0, due: 0 };

	if (g === AGAIN) {
		return {
			ease: clamp(card.ease - 0.2, EASE_FLOOR, EASE_CEILING),
			ivl: 0,
			reps: 0,
			lapses: card.lapses + 1,
			due: now + RELEARN_MS
		};
	}

	let ease = card.ease;
	let ivl: number;

	if (g === HARD) {
		ease = clamp(ease - 0.15, EASE_FLOOR, EASE_CEILING);
		ivl = card.reps === 0 ? 1 : Math.max(1, card.ivl * 1.2);
	} else if (g === GOOD) {
		ivl = card.reps === 0 ? 1 : card.reps === 1 ? 3 : card.ivl * ease;
	} else {
		ease = clamp(ease + 0.15, EASE_FLOOR, EASE_CEILING);
		ivl = card.reps === 0 ? 4 : card.ivl * ease * 1.3;
	}

	ivl = Math.min(MAX_INTERVAL_DAYS, Math.round(ivl * 10) / 10);
	return { ease, ivl, reps: card.reps + 1, lapses: card.lapses, due: now + ivl * DAY_MS };
}

export interface GradeResult {
	state: SrsState;
	card: CardState;
	wasNew: boolean;
}

export function grade(state: SrsState, id: string, g: Grade, now: number): GradeResult {
	const today = isoDay(now);
	const rolled =
		state.newDate === today ? state : { ...state, newDate: today, newCount: 0, newIds: [] };

	const wasNew = !rolled.cards[id];
	const card = nextCard(rolled.cards[id], g, now);

	return {
		state: {
			...rolled,
			cards: { ...rolled.cards, [id]: card },
			days: { ...rolled.days, [today]: (rolled.days[today] ?? 0) + 1 },
			newCount: rolled.newCount + (wasNew ? 1 : 0)
		},
		card,
		wasNew
	};
}

/* ------------------------------------------------------------------ *
 * The queue
 * ------------------------------------------------------------------ */

export interface QueueOptions {
	newPerDay?: number;
	/** Injectable so tests are deterministic; defaults to Math.random. */
	shuffle?: <T>(items: T[]) => T[];
}

const defaultShuffle = <T>(items: T[]): T[] => {
	const a = items.slice();
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
};

function sameIds(a: string[], b: string[]): boolean {
	if (a.length !== b.length) return false;
	return a.every((id, i) => id === b[i]);
}

function splitQueue<T extends SchedulableCard>(
	state: SrsState,
	deck: T[],
	now: number
): { reviews: T[]; fresh: T[] } {
	const reviews: T[] = [];
	const fresh: T[] = [];
	for (const card of pool(state, deck)) {
		const st = state.cards[card.id];
		if (!st) fresh.push(card);
		else if (st.due <= now) reviews.push(card);
	}
	reviews.sort((a, b) => state.cards[a.id].due - state.cards[b.id].due);
	return { reviews, fresh };
}

function rollNewDay(state: SrsState, today: string): SrsState {
	if (state.newDate === today) return state;
	return { ...state, newDate: today, newCount: 0, newIds: [] };
}

/**
 * Persist today’s unseen draw on state. Call before `due()` so reloads and
 * later visits the same calendar day keep the same new cards.
 */
export function pinNewForDay<T extends SchedulableCard>(
	state: SrsState,
	deck: T[],
	now: number,
	opts: QueueOptions = {}
): SrsState {
	const newPerDay = opts.newPerDay ?? DEFAULT_NEW_PER_DAY;
	const shuffle = opts.shuffle ?? defaultShuffle;
	const today = isoDay(now);
	const rolled = rollNewDay(state, today);
	const room = Math.max(0, newPerDay - rolled.newCount);
	const { fresh } = splitQueue(rolled, deck, now);
	const unseen = new Set(fresh.map((c) => c.id));
	const kept = rolled.newIds.filter((id) => unseen.has(id)).slice(0, room);

	let newIds = kept;
	if (kept.length < room) {
		const have = new Set(kept);
		const drawn = shuffle(fresh.filter((c) => !have.has(c.id)))
			.slice(0, room - kept.length)
			.map((c) => c.id);
		newIds = [...kept, ...drawn];
	}

	if (rolled === state && sameIds(newIds, state.newIds)) return state;
	return { ...rolled, newIds };
}

/**
 * Everything overdue, then a capped trickle of unseen cards. Reviews come
 * first: clearing debt matters more than taking on new material.
 *
 * When `state.newIds` is pinned for today, those ids are used instead of a
 * fresh shuffle so `/review` does not reshuffle unseen cards on every load.
 */
export function due<T extends SchedulableCard>(
	state: SrsState,
	deck: T[],
	now: number,
	opts: QueueOptions = {}
): T[] {
	const newPerDay = opts.newPerDay ?? DEFAULT_NEW_PER_DAY;
	const shuffle = opts.shuffle ?? defaultShuffle;
	const today = isoDay(now);
	const usedToday = state.newDate === today ? state.newCount : 0;
	const { reviews, fresh } = splitQueue(state, deck, now);
	const room = Math.max(0, newPerDay - usedToday);

	const pin = state.newDate === today ? state.newIds : [];
	if (pin.length === 0) {
		return [...reviews, ...shuffle(fresh).slice(0, room)];
	}

	const byId = new Map(fresh.map((c) => [c.id, c]));
	const pinned: T[] = [];
	for (const id of pin) {
		if (pinned.length >= room) break;
		const card = byId.get(id);
		if (card) pinned.push(card);
	}
	return [...reviews, ...pinned];
}

/** Epoch ms of the soonest upcoming card, or null when nothing is scheduled. */
export function nextDueAt<T extends SchedulableCard>(state: SrsState, deck: T[]): number | null {
	let soonest = Infinity;
	for (const card of pool(state, deck)) {
		const st = state.cards[card.id];
		if (st && st.due < soonest) soonest = st.due;
	}
	return Number.isFinite(soonest) ? soonest : null;
}

/* ------------------------------------------------------------------ *
 * Stats
 * ------------------------------------------------------------------ */

export interface Stats {
	unlocked: number;
	total: number;
	seen: number;
	unseen: number;
	mature: number;
	young: number;
	due: number;
	newLeft: number;
	queue: number;
	lapsing: number;
	streak: number;
	reviewedToday: number;
	tiers: string[];
}

export interface TierMeta {
	id: string;
	size: number;
}

export interface TierReviewProgress {
	id: string;
	size: number;
	unlocked: boolean;
	mature: number;
	young: number;
	unseen: number;
	seen: number;
}

/** Per-tier mastered / learning / not-started counts from existing card state. */
export function tierReviewProgress<T extends SchedulableCard>(
	state: SrsState,
	deck: T[],
	tiers: readonly TierMeta[]
): TierReviewProgress[] {
	return tiers.map((tier) => {
		const cards = deck.filter((c) => c.tier === tier.id);
		let mature = 0;
		let young = 0;
		for (const c of cards) {
			const cs = state.cards[c.id];
			if (!cs) continue;
			if (cs.ivl >= MATURE_DAYS) mature++;
			else young++;
		}
		const seen = mature + young;
		return {
			id: tier.id,
			size: tier.size,
			unlocked: isUnlocked(state, tier.id),
			mature,
			young,
			unseen: cards.length - seen,
			seen
		};
	});
}

/** Home deck row label: locked vs not-started vs seen/size. */
export function tierCountLabel(row: Pick<TierReviewProgress, 'unlocked' | 'seen' | 'size'>): string {
	if (!row.unlocked) return 'locked';
	if (row.seen === 0) return `${row.size} not started`;
	return `${row.seen}/${row.size}`;
}

export function stats<T extends SchedulableCard>(
	state: SrsState,
	deck: T[],
	now: number,
	opts: QueueOptions = {}
): Stats {
	const newPerDay = opts.newPerDay ?? DEFAULT_NEW_PER_DAY;
	const available = pool(state, deck);
	const today = isoDay(now);

	let seen = 0, mature = 0, young = 0, dueNow = 0, lapsing = 0;
	for (const card of available) {
		const st = state.cards[card.id];
		if (!st) continue;
		seen++;
		if (st.ivl >= MATURE_DAYS) mature++;
		else young++;
		if (st.due <= now) dueNow++;
		if (st.lapses >= 3) lapsing++;
	}

	const usedToday = state.newDate === today ? state.newCount : 0;
	const newLeft = Math.max(0, Math.min(newPerDay - usedToday, available.length - seen));

	return {
		unlocked: available.length,
		total: deck.length,
		seen,
		unseen: available.length - seen,
		mature,
		young,
		due: dueNow,
		newLeft,
		queue: dueNow + newLeft,
		lapsing,
		streak: streak(state, now),
		reviewedToday: state.days[today] ?? 0,
		tiers: [...state.unlocked]
	};
}

/** Consecutive days ending today, or yesterday if today has not been done yet. */
export function streak(state: SrsState, now: number): number {
	let count = 0;
	let cursor = now;
	if (!state.days[isoDay(now)]) cursor -= DAY_MS;
	while (state.days[isoDay(cursor)]) {
		count++;
		cursor -= DAY_MS;
	}
	return count;
}

/** Cards the scheduler considers weak — drives what the next lab should target. */
export function weakest<T extends SchedulableCard>(state: SrsState, deck: T[], limit = 5): T[] {
	return pool(state, deck)
		.filter((c) => (state.cards[c.id]?.lapses ?? 0) > 0)
		.sort((a, b) => {
			const A = state.cards[a.id];
			const B = state.cards[b.id];
			return B.lapses - A.lapses || A.ease - B.ease;
		})
		.slice(0, limit);
}
