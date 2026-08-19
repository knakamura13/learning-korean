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
	openLab as openLabAccess, isOpened,
	grade as gradeCard, due as dueCards, pinNewForDay, nextDueAt, stats as computeStats,
	weakest as weakestCards, gradeFromAttempt, tierReviewProgress,
	type SrsState, type Grade, type Stats
} from '$lib/domain/srs';
import { DECK, TIERS, cardsOfTier, type Card } from '$lib/domain/deck';
import { browserStorage, memoryStorage, type Storage } from '$lib/domain/storage';

const STORAGE_KEY = 'korean-srs-v1';

export function createProgress(store: Storage = browser ? browserStorage(STORAGE_KEY) : memoryStorage()) {
	const loaded = decodeStoredState(store.read());
	let state = $state<SrsState>(loaded.state);
	let now = $state(Date.now());
	let durable = $state(store.durable);
	let corruptRaw = $state<string | null>(loaded.corrupt);

	function persistPin() {
		const next = pinNewForDay(state, DECK, now);
		if (next !== state) commit(next);
	}

	function commit(next: SrsState): boolean {
		state = next;
		if (corruptRaw) return false;
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
			return computeStats(state, DECK, now);
		},

		get queue(): Card[] {
			persistPin();
			return dueCards(state, DECK, now);
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

		/** Per-tier progress for the dashboard. */
		get tierProgress() {
			const rows = tierReviewProgress(state, DECK, TIERS);
			return TIERS.map((tier, i) => ({ ...tier, ...rows[i] }));
		},

		/** Returns how many cards this actually released. */
		unlock(tiers: string[]): number {
			const before = state.unlocked.length;
			const next = unlockTiers(state, tiers);
			if (next === state) return 0;
			commit(next);
			persistPin();
			return tiers
				.filter((t) => !state.unlocked.slice(0, before).includes(t))
				.reduce((n, t) => n + cardsOfTier(t).length, 0);
		},

		answer(cardId: string, correct: boolean, elapsedMs: number) {
			const wasNew = !state.cards[cardId];
			const g = gradeFromAttempt(correct, elapsedMs, wasNew);
			const result = gradeCard(state, cardId, g, Date.now());
			commit(result.state);
			return result;
		},

		grade(cardId: string, g: Grade) {
			const result = gradeCard(state, cardId, g, Date.now());
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
			corruptRaw = null;
			return commit(next);
		}
	};
}

export const progress = createProgress();
