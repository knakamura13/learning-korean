/**
 * progress.svelte.ts — the one place mutable app state lives.
 *
 * Wraps the pure scheduler in srs.ts with reactivity and persistence. Every
 * mutation goes through here, so there is a single write path to storage and a
 * single source of truth for the UI.
 */

import { browser } from '$app/environment';
import {
	emptyState, decodeStoredState, parseImportedBackup, unlock as unlockTiers, isUnlocked,
	openLab as openLabAccess, isOpened, isFlagged as cardIsFlagged, setFlagged,
	grade as gradeCard, due as dueCards, pinNewForDay, nextDueAt, stats as computeStats,
	weakest as weakestCards, gradeFromAttempt, tierReviewProgress, reviveState, trackOfTier,
	DEFAULT_NEW_PER_DAY, DEFAULT_REVIEW_PER_SITTING,
	type SrsState, type Grade, type Stats, type QueueOptions
} from '$lib/domain/srs';
import { mergeSrsState } from '$lib/domain/merge';
import { CARDS_BY_ID, DECK, TIERS, VOCAB_TIERS, cardsOfTier, type Card } from '$lib/domain/deck';
import { browserStorage, memoryStorage, onStorageKey, type Storage } from '$lib/domain/storage';

export const SRS_STORAGE_KEY = 'korean-srs-v1';

export interface StudyPrefs {
	newPerDay: number;
	reviewsPerSitting: number;
}

export function createProgress(store: Storage = browser ? browserStorage(SRS_STORAGE_KEY) : memoryStorage()) {
	const loaded = decodeStoredState(store.read());
	let state = $state<SrsState>(loaded.state);
	let now = $state(Date.now());
	let durable = $state(store.durable);
	let corruptRaw = $state<string | null>(loaded.corrupt);
	/** Signed-in learners get account pacing; guests keep the compiled defaults. */
	let prefs = $state<StudyPrefs>({
		newPerDay: DEFAULT_NEW_PER_DAY,
		reviewsPerSitting: DEFAULT_REVIEW_PER_SITTING
	});

	function queueOpts(): QueueOptions {
		return { newPerDay: prefs.newPerDay, reviewPerSitting: prefs.reviewsPerSitting };
	}

	function applyStored() {
		const next = decodeStoredState(store.read());
		state = next.state;
		corruptRaw = next.corrupt;
		durable = store.durable;
	}

	onStorageKey(SRS_STORAGE_KEY, applyStored);

	function persistPin() {
		const next = pinNewForDay(state, DECK, now, queueOpts());
		if (next !== state) commit(next);
	}

	function commit(next: SrsState): boolean {
		if (corruptRaw) return false;
		state = next;
		if (!store.write(JSON.stringify(next))) {
			durable = false;
			return false;
		}
		return true;
	}

	return {
		get state() { return state; },
		get durable() { return durable; },
		get corrupt() { return corruptRaw !== null; },

		/** Re-read the clock so `due` and `stats` recompute. */
		tick() {
			now = Date.now();
			persistPin();
		},

		get stats(): Stats {
			return computeStats(state, DECK, now, queueOpts());
		},

		get queue(): Card[] {
			return dueCards(state, DECK, now, queueOpts());
		},

		get studyPrefs(): StudyPrefs {
			return prefs;
		},

		/** Account pacing from /api/me; re-pins today's draw under the new cap. */
		setStudyPrefs(next: StudyPrefs) {
			prefs = next;
			persistPin();
		},

		/**
		 * Merge a synced document into local state. Local storage stays the
		 * source of truth; the merge never asks the learner anything. No-op
		 * while local state is quarantined as corrupt.
		 */
		applyRemote(remoteSrs: unknown): boolean {
			if (corruptRaw) return false;
			const merged = mergeSrsState(state, reviveState(remoteSrs));
			if (JSON.stringify(merged) === JSON.stringify(state)) return false;
			return commit(merged);
		},

		get nextDue(): number | null {
			return nextDueAt(state, DECK);
		},

		get weakest(): Card[] {
			return weakestCards(state, DECK, 5);
		},

		isUnlocked(tier: string) {
			return isUnlocked(state, tier);
		},

		isOpened(labId: string) {
			return isOpened(state, labId);
		},

		openLab(labId: string) {
			const next = openLabAccess(state, labId);
			if (next === state) return;
			commit(next);
		},

		isFlagged(cardId: string) {
			return cardIsFlagged(state, cardId);
		},

		/** True when every listed card id is currently bookmarked. */
		areFlagged(cardIds: readonly string[]) {
			return cardIds.length > 0 && cardIds.every((id) => cardIsFlagged(state, id));
		},

		/**
		 * Bookmark review concepts. Flagging marks them due now so Review
		 * surfaces them; unflagging clears the bookmark only.
		 */
		flagCards(cardIds: readonly string[], flag = true) {
			now = Date.now();
			const next = setFlagged(state, cardIds, flag, now, DECK);
			if (next === state) return;
			commit(next);
		},

		toggleFlagged(cardIds: readonly string[]) {
			if (cardIds.length === 0) return;
			const allOn = cardIds.every((id) => cardIsFlagged(state, id));
			now = Date.now();
			const next = setFlagged(state, cardIds, !allOn, now, DECK);
			if (next === state) return;
			commit(next);
		},

		/** Per-tier progress for the dashboard. */
		get tierProgress() {
			const rows = tierReviewProgress(state, DECK, TIERS);
			return TIERS.map((tier, i) => ({ ...tier, ...rows[i] }));
		},

		/** Per-pack progress for the home Vocabulary section. */
		get vocabProgress() {
			const rows = tierReviewProgress(state, DECK, VOCAB_TIERS);
			return VOCAB_TIERS.map((tier, i) => ({ ...tier, ...rows[i] }));
		},

		/** Returns how many cards this actually released. */
		unlock(tiers: string[]): number {
			const before = state.unlocked.length;
			let next = unlockTiers(state, tiers);
			if (next === state) return 0;
			now = Date.now();
			// Materialize bookmarked concepts that just became eligible for Review.
			next = setFlagged(next, next.flagged, true, now, DECK);
			if (!commit(next)) return 0;
			persistPin();
			return tiers
				.filter((t) => !state.unlocked.slice(0, before).includes(t))
				.reduce((n, t) => n + cardsOfTier(t).length, 0);
		},

		answer(cardId: string, correct: boolean, elapsedMs: number) {
			now = Date.now();
			const wasNew = !state.cards[cardId];
			const g = gradeFromAttempt(correct, elapsedMs, wasNew);
			const track = trackOfTier(CARDS_BY_ID[cardId]?.tier ?? '');
			const result = gradeCard(state, cardId, g, now, track);
			commit(result.state);
			return result;
		},

		grade(cardId: string, g: Grade) {
			now = Date.now();
			const track = trackOfTier(CARDS_BY_ID[cardId]?.tier ?? '');
			const result = gradeCard(state, cardId, g, now, track);
			commit(result.state);
			return result;
		},

		reset() {
			store.clear();
			corruptRaw = null;
			durable = store.durable;
			state = emptyState();
		},

		export(): string {
			if (corruptRaw) return corruptRaw;
			return JSON.stringify(state, null, 2);
		},

		import(json: string): boolean {
			const next = parseImportedBackup(json);
			if (!next) return false;
			if (!store.write(JSON.stringify(next))) {
				durable = false;
				return false;
			}
			corruptRaw = null;
			state = next;
			return true;
		}
	};
}

export const progress = createProgress();
