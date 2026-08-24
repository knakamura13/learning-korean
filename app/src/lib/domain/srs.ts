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

/** Vocabulary trickles separately so words never starve letter reviews. */
export const DEFAULT_VOCAB_NEW_PER_DAY = 5;

/** Overdue reviews drawn into one sitting; leftover debt stays in `stats.due`. */
export const DEFAULT_REVIEW_PER_SITTING = 10;

/** Imported backup files larger than this are rejected. */
export const MAX_BACKUP_CHARS = 100_000;

/** A missed card comes back inside the same sitting. */
export const RELEARN_MS = 600_000;

/** Correct answers faster than this are easy (new cards stay GOOD). */
export const FAST_MS = 3500;

/** Correct answers at or above this are slow / HARD. */
export const STEADY_MS = 9000;

export type AttemptSpeed = 'fast' | 'steady' | 'slow';

const EASE_FLOOR = 1.3;
const EASE_CEILING = 2.8;
const EASE_START = 2.5;
const MAX_INTERVAL_DAYS = 365;
const MAX_STORED_DAYS = 400;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

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
	/** Lab ids granted skip-ahead access without finishing the prerequisite. */
	openedLabs: string[];
	/** Deck card ids the learner bookmarked for revisit; also pulled into Review. */
	flagged: string[];
	cards: Record<string, CardState>;
	/** Reviews per ISO date, for streaks. */
	days: Record<string, number>;
	newDate: string;
	newCount: number;
	/** Unseen card ids chosen for `newDate`. Empty until a draw that day. */
	newIds: string[];
	/** The vocabulary track's own daily pin — same shape, separate budget. */
	vocabNewDate: string;
	vocabNewCount: number;
	vocabNewIds: string[];
}

export type Track = 'script' | 'vocab';

/** Which daily new-card budget a tier draws from. */
export function trackOfTier(tier: string): Track {
	return tier.startsWith('vocab') ? 'vocab' : 'script';
}

export interface SchedulableCard {
	id: string;
	tier: string;
}

export function emptyState(): SrsState {
	return {
		version: 1,
		unlocked: [],
		openedLabs: [],
		flagged: [],
		cards: {},
		days: {},
		newDate: '',
		newCount: 0,
		newIds: [],
		vocabNewDate: '',
		vocabNewCount: 0,
		vocabNewIds: []
	};
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function asFiniteNumber(value: unknown): number | null {
	return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function isStringArray(raw: unknown): raw is string[] {
	return Array.isArray(raw) && raw.every((value) => typeof value === 'string');
}

function reviveCard(raw: unknown): CardState | null {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
	const rec = raw as Record<string, unknown>;
	const ease = asFiniteNumber(rec.ease);
	const ivl = asFiniteNumber(rec.ivl);
	const reps = asFiniteNumber(rec.reps);
	const lapses = asFiniteNumber(rec.lapses);
	const due = asFiniteNumber(rec.due);
	if (ease === null || ivl === null || reps === null || lapses === null || due === null) return null;
	if (ivl < 0 || reps < 0 || lapses < 0) return null;
	return {
		ease: clamp(ease, EASE_FLOOR, EASE_CEILING),
		ivl: Math.min(MAX_INTERVAL_DAYS, ivl),
		reps: Math.trunc(reps),
		lapses: Math.trunc(lapses),
		due
	};
}

function reviveCards(raw: unknown): Record<string, CardState> {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
	const cards: Record<string, CardState> = {};
	for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
		if (!id) continue;
		const card = reviveCard(value);
		if (card) cards[id] = card;
	}
	return cards;
}

function isDaysRecord(raw: unknown): raw is Record<string, number> {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
	return Object.entries(raw as Record<string, unknown>).every(
		([day, count]) => ISO_DAY.test(day) && asFiniteNumber(count) !== null && (count as number) >= 0
	);
}

function pruneDays(days: Record<string, number>): Record<string, number> {
	const keys = Object.keys(days);
	if (keys.length <= MAX_STORED_DAYS) return days;
	const keep = keys.sort().slice(-MAX_STORED_DAYS);
	const out: Record<string, number> = {};
	for (const iso of keep) out[iso] = days[iso];
	return out;
}

function reviveDays(raw: unknown): Record<string, number> {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
	const days: Record<string, number> = {};
	for (const [day, count] of Object.entries(raw as Record<string, unknown>)) {
		if (!ISO_DAY.test(day)) continue;
		const n = asFiniteNumber(count);
		if (n === null || n < 0) continue;
		days[day] = Math.trunc(n);
	}
	return pruneDays(days);
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
	const newCount = asFiniteNumber(s.newCount);
	const vocabNewCount = asFiniteNumber(s.vocabNewCount);
	return {
		version: 1,
		unlocked: Array.isArray(s.unlocked) ? s.unlocked.filter((x) => typeof x === 'string') : [],
		openedLabs: Array.isArray(s.openedLabs) ? s.openedLabs.filter((x) => typeof x === 'string') : [],
		flagged: Array.isArray(s.flagged) ? s.flagged.filter((id) => typeof id === 'string') : [],
		cards: reviveCards(s.cards),
		days: reviveDays(s.days),
		newDate: typeof s.newDate === 'string' ? s.newDate : '',
		newCount: newCount !== null && newCount >= 0 ? Math.trunc(newCount) : 0,
		newIds: Array.isArray(s.newIds) ? s.newIds.filter((id) => typeof id === 'string') : [],
		vocabNewDate: typeof s.vocabNewDate === 'string' ? s.vocabNewDate : '',
		vocabNewCount: vocabNewCount !== null && vocabNewCount >= 0 ? Math.trunc(vocabNewCount) : 0,
		vocabNewIds: Array.isArray(s.vocabNewIds)
			? s.vocabNewIds.filter((id) => typeof id === 'string')
			: []
	};
}

function isReadableSrsDocument(raw: unknown): boolean {
	if (!raw || typeof raw !== 'object') return false;
	const s = raw as Partial<SrsState> & { v?: number };
	return (s.version ?? s.v) === 1;
}

/**
 * JSON.parse of localStorage can throw. Keep the raw blob so a later persist
 * cannot overwrite unread history with an empty deck. Parsed JSON that is not
 * a v1 document is quarantined the same way — `reviveState` would otherwise
 * return empty and the next pin would wipe the unread file.
 */
export function decodeStoredState(raw: string | null): { state: SrsState; corrupt: string | null } {
	if (raw == null || raw === '') return { state: emptyState(), corrupt: null };
	try {
		const parsed: unknown = JSON.parse(raw);
		if (!isReadableSrsDocument(parsed)) return { state: emptyState(), corrupt: raw };
		return { state: reviveState(parsed), corrupt: null };
	} catch {
		return { state: emptyState(), corrupt: raw };
	}
}

/** Strict shape check for file restore — unlike reviveState, rejects unknown payloads. */
export function isSrsBackup(raw: unknown): boolean {
	if (!raw || typeof raw !== 'object') return false;
	const s = raw as Partial<SrsState> & { v?: number };
	const version = s.version ?? s.v;
	if (version !== 1) return false;
	if (!isStringArray(s.unlocked)) return false;
	if (s.openedLabs !== undefined && !isStringArray(s.openedLabs)) return false;
	if (s.flagged !== undefined && !isStringArray(s.flagged)) return false;
	if (s.newIds !== undefined && !isStringArray(s.newIds)) return false;
	if (s.vocabNewIds !== undefined && !isStringArray(s.vocabNewIds)) return false;
	if (!s.cards || typeof s.cards !== 'object' || Array.isArray(s.cards)) return false;
	for (const value of Object.values(s.cards as Record<string, unknown>)) {
		if (!reviveCard(value)) return false;
	}
	if (s.days !== undefined && !isDaysRecord(s.days)) return false;
	return true;
}

/** Parse and validate an imported backup; returns null on any failure. */
export function parseImportedBackup(json: string): SrsState | null {
	if (json.length > MAX_BACKUP_CHARS) return null;
	try {
		const parsed = JSON.parse(json);
		if (!isSrsBackup(parsed)) return null;
		return reviveState(parsed);
	} catch {
		return null;
	}
}

/** Local calendar date (YYYY-MM-DD), not UTC. */
export function isoDay(now: number): string {
	const d = new Date(now);
	const y = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${month}-${day}`;
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

/** Grant skip-ahead access to a lab without releasing its review tier. */
export function openLab(state: SrsState, labId: string): SrsState {
	if (state.openedLabs.includes(labId)) return state;
	return { ...state, openedLabs: [...state.openedLabs, labId] };
}

export function isOpened(state: SrsState, labId: string): boolean {
	return state.openedLabs.includes(labId);
}

export function isFlagged(state: SrsState, cardId: string): boolean {
	return state.flagged.includes(cardId);
}

/**
 * Bookmark deck cards for revisit. Flagging pulls them into Review by setting
 * `due` to now (and introducing an unseen card into the schedule when the
 * tier is already unlocked). Unflagging clears the bookmark only — schedule
 * stays where the learner left it.
 */
export function setFlagged(
	state: SrsState,
	cardIds: readonly string[],
	flag: boolean,
	now: number,
	deck: readonly SchedulableCard[] = []
): SrsState {
	if (cardIds.length === 0) return state;
	const flagged = new Set(state.flagged);
	let cards = state.cards;
	let changed = false;

	for (const id of cardIds) {
		if (!id) continue;
		if (flag) {
			if (!flagged.has(id)) {
				flagged.add(id);
				changed = true;
			}
			const prev = cards[id];
			if (prev) {
				if (prev.due > now) {
					if (cards === state.cards) cards = { ...cards };
					cards[id] = { ...prev, due: now };
					changed = true;
				}
			} else {
				const tier = deck.find((c) => c.id === id)?.tier;
				if (tier && isUnlocked(state, tier)) {
					if (cards === state.cards) cards = { ...cards };
					cards[id] = { ease: EASE_START, ivl: 0, reps: 0, lapses: 0, due: now };
					changed = true;
				}
			}
		} else if (flagged.delete(id)) {
			changed = true;
		}
	}

	if (!changed) return state;
	return { ...state, flagged: [...flagged], cards };
}

function pool<T extends SchedulableCard>(state: SrsState, deck: T[]): T[] {
	return deck.filter((c) => isUnlocked(state, c.tier));
}

/* ------------------------------------------------------------------ *
 * Grading
 * ------------------------------------------------------------------ */

export function attemptSpeed(ms: number): AttemptSpeed {
	if (ms < FAST_MS) return 'fast';
	if (ms < STEADY_MS) return 'steady';
	return 'slow';
}

/**
 * Turn an attempt into a grade. A correct-but-slow answer is scheduled sooner
 * than a correct-and-fast one; a brand new card never earns EASY on sight.
 */
export function gradeFromAttempt(correct: boolean, ms: number, isNew: boolean): Grade {
	if (!correct) return AGAIN;
	const speed = attemptSpeed(ms);
	switch (speed) {
		case 'fast':
			return isNew ? GOOD : EASY;
		case 'steady':
			return GOOD;
		case 'slow':
			return HARD;
		default: {
			const _exhaustive: never = speed;
			return _exhaustive;
		}
	}
}

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

export function grade(
	state: SrsState,
	id: string,
	g: Grade,
	now: number,
	track: Track = 'script'
): GradeResult {
	const today = isoDay(now);
	const rolled = rollNewDay(state, today);

	const wasNew = !rolled.cards[id];
	const card = nextCard(rolled.cards[id], g, now);
	const prevDays = asFiniteNumber(rolled.days[today]) ?? 0;

	const counted = wasNew
		? track === 'vocab'
			? { vocabNewCount: rolled.vocabNewCount + 1 }
			: { newCount: rolled.newCount + 1 }
		: {};

	return {
		state: {
			...rolled,
			cards: { ...rolled.cards, [id]: card },
			days: pruneDays({ ...rolled.days, [today]: prevDays + 1 }),
			...counted
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
	vocabNewPerDay?: number;
	reviewPerSitting?: number;
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
	const flagged = new Set(state.flagged);
	for (const card of pool(state, deck)) {
		const st = state.cards[card.id];
		if (!st) fresh.push(card);
		else if (st.due <= now || flagged.has(card.id)) reviews.push(card);
	}
	// Bookmarked cards lead the sitting so revisit intent is not buried.
	reviews.sort((a, b) => {
		const af = flagged.has(a.id) ? 0 : 1;
		const bf = flagged.has(b.id) ? 0 : 1;
		if (af !== bf) return af - bf;
		return state.cards[a.id].due - state.cards[b.id].due;
	});
	return { reviews, fresh };
}

function rollNewDay(state: SrsState, today: string): SrsState {
	const scriptStale = state.newDate !== today;
	const vocabStale = state.vocabNewDate !== today;
	if (!scriptStale && !vocabStale) return state;
	return {
		...state,
		...(scriptStale ? { newDate: today, newCount: 0, newIds: [] } : {}),
		...(vocabStale ? { vocabNewDate: today, vocabNewCount: 0, vocabNewIds: [] } : {})
	};
}

/** The per-track view of the daily pin. Both tracks share one algorithm. */
function pinOf(state: SrsState, track: Track): { count: number; ids: string[] } {
	return track === 'vocab'
		? { count: state.vocabNewCount, ids: state.vocabNewIds }
		: { count: state.newCount, ids: state.newIds };
}

function capOf(opts: QueueOptions, track: Track): number {
	return track === 'vocab'
		? (opts.vocabNewPerDay ?? DEFAULT_VOCAB_NEW_PER_DAY)
		: (opts.newPerDay ?? DEFAULT_NEW_PER_DAY);
}

function pinTrack<T extends SchedulableCard>(
	rolled: SrsState,
	fresh: T[],
	track: Track,
	opts: QueueOptions
): string[] {
	const shuffle = opts.shuffle ?? defaultShuffle;
	const { count, ids } = pinOf(rolled, track);
	const room = Math.max(0, capOf(opts, track) - count);
	const mine = fresh.filter((c) => trackOfTier(c.tier) === track);
	const unseen = new Set(mine.map((c) => c.id));
	const kept = ids.filter((id) => unseen.has(id)).slice(0, room);
	if (kept.length >= room) return kept;
	const have = new Set(kept);
	const drawn = shuffle(mine.filter((c) => !have.has(c.id)))
		.slice(0, room - kept.length)
		.map((c) => c.id);
	return [...kept, ...drawn];
}

/**
 * Persist today’s unseen draw on state — one pin per track, so a vocabulary
 * pack landing can never crowd letters out of the day (or vice versa). Call
 * before `due()` so reloads the same calendar day keep the same new cards.
 */
export function pinNewForDay<T extends SchedulableCard>(
	state: SrsState,
	deck: T[],
	now: number,
	opts: QueueOptions = {}
): SrsState {
	const today = isoDay(now);
	const rolled = rollNewDay(state, today);
	const { fresh } = splitQueue(rolled, deck, now);
	const newIds = pinTrack(rolled, fresh, 'script', opts);
	const vocabNewIds = pinTrack(rolled, fresh, 'vocab', opts);

	if (
		rolled === state &&
		sameIds(newIds, state.newIds) &&
		sameIds(vocabNewIds, state.vocabNewIds)
	) {
		return state;
	}
	return { ...rolled, newIds, vocabNewIds };
}

function pinnedCards<T extends SchedulableCard>(
	state: SrsState,
	fresh: T[],
	track: Track,
	today: string,
	opts: QueueOptions
): T[] {
	const dateOf = track === 'vocab' ? state.vocabNewDate : state.newDate;
	const { count, ids } = pinOf(state, track);
	const usedToday = dateOf === today ? count : 0;
	const room = Math.max(0, capOf(opts, track) - usedToday);
	const mine = fresh.filter((c) => trackOfTier(c.tier) === track);

	const pin = dateOf === today ? ids : [];
	if (pin.length === 0) {
		const shuffle = opts.shuffle ?? defaultShuffle;
		return shuffle(mine).slice(0, room);
	}
	const byId = new Map(mine.map((c) => [c.id, c]));
	const picked: T[] = [];
	for (const id of pin) {
		if (picked.length >= room) break;
		const card = byId.get(id);
		if (card) picked.push(card);
	}
	return picked;
}

/**
 * Overdue reviews first (both tracks, oldest due first, capped per sitting),
 * then each track's capped trickle of unseen cards. Leftover debt stays in
 * `stats.due` so Review can offer another sitting.
 *
 * When a track's pin is set for today, those ids are used instead of a fresh
 * shuffle so `/review` does not reshuffle unseen cards on every load.
 */
export function due<T extends SchedulableCard>(
	state: SrsState,
	deck: T[],
	now: number,
	opts: QueueOptions = {}
): T[] {
	const reviewPerSitting = opts.reviewPerSitting ?? DEFAULT_REVIEW_PER_SITTING;
	const today = isoDay(now);
	const { reviews, fresh } = splitQueue(state, deck, now);
	const sittingReviews = reviews.slice(0, reviewPerSitting);
	return [
		...sittingReviews,
		...pinnedCards(state, fresh, 'script', today, opts),
		...pinnedCards(state, fresh, 'vocab', today, opts)
	];
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
	/** The vocabulary track's remaining daily draw, budgeted separately. */
	vocabNewLeft: number;
	queue: number;
	/**
	 * Cards the next sitting will actually present — exactly `due().length`.
	 * This is the commitment to quote in the UI. `queue` is everything
	 * available today, which after a gap is several sittings' worth.
	 */
	sitting: number;
	/** Overdue cards this sitting will not reach. Zero when on schedule. */
	backlog: number;
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

/** Mastery row label: locked vs not-started vs seen/size. */
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
	const vocabNewPerDay = opts.vocabNewPerDay ?? DEFAULT_VOCAB_NEW_PER_DAY;
	const reviewPerSitting = opts.reviewPerSitting ?? DEFAULT_REVIEW_PER_SITTING;
	const available = pool(state, deck);
	const today = isoDay(now);

	let seen = 0, mature = 0, young = 0, dueNow = 0, lapsing = 0;
	let scriptUnseen = 0, vocabUnseen = 0;
	const flagged = new Set(state.flagged);
	for (const card of available) {
		const st = state.cards[card.id];
		if (!st) {
			if (trackOfTier(card.tier) === 'vocab') vocabUnseen++;
			else scriptUnseen++;
			continue;
		}
		seen++;
		if (st.ivl >= MATURE_DAYS) mature++;
		else young++;
		if (st.due <= now || flagged.has(card.id)) dueNow++;
		if (st.lapses >= 3) lapsing++;
	}

	const usedToday = state.newDate === today ? state.newCount : 0;
	const vocabUsedToday = state.vocabNewDate === today ? state.vocabNewCount : 0;
	const newLeft = Math.max(0, Math.min(newPerDay - usedToday, scriptUnseen));
	const vocabNewLeft = Math.max(0, Math.min(vocabNewPerDay - vocabUsedToday, vocabUnseen));
	// Mirrors how `due()` builds a sitting: capped reviews, then each track's
	// capped trickle. `srs.test.ts` asserts the two never drift.
	const sittingReviews = Math.min(dueNow, Math.max(0, reviewPerSitting));

	return {
		unlocked: available.length,
		total: deck.length,
		seen,
		unseen: available.length - seen,
		mature,
		young,
		due: dueNow,
		newLeft,
		vocabNewLeft,
		queue: dueNow + newLeft + vocabNewLeft,
		sitting: sittingReviews + newLeft + vocabNewLeft,
		backlog: dueNow - sittingReviews,
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
