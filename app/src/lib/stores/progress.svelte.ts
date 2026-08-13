/**
 * progress.svelte.ts — the one place mutable app state lives.
 *
 * Wraps the pure scheduler in srs.ts with reactivity and persistence. Every
 * mutation goes through here, so there is a single write path to storage and a
 * single source of truth for the UI.
 */

import { browser } from '$app/environment';
import {
	emptyState, reviveState, unlock as unlockTiers, isUnlocked,
	grade as gradeCard, due as dueCards, nextDueAt, stats as computeStats,
	weakest as weakestCards, gradeFromAttempt,
	type SrsState, type Grade, type Stats
} from '$lib/domain/srs';
import { DECK, TIERS, cardsOfTier, type Card } from '$lib/domain/deck';
import { browserStorage, memoryStorage, type Storage } from '$lib/domain/storage';

const STORAGE_KEY = 'korean-srs-v1';

function load(store: Storage): SrsState {
	const raw = store.read();
	if (!raw) return emptyState();
	try {
		return reviveState(JSON.parse(raw));
	} catch {
		return emptyState();
	}
}

function createProgress() {
	// On the server (prerender) there is no storage; start empty and hydrate.
	const store: Storage = browser ? browserStorage(STORAGE_KEY) : memoryStorage();

	let state = $state<SrsState>(load(store));
	let now = $state(Date.now());

	function commit(next: SrsState) {
		state = next;
		store.write(JSON.stringify(next));
	}

	return {
		get state() { return state; },
		get durable() { return store.durable; },

		/** Re-read the clock so `due` and `stats` recompute. */
		tick() { now = Date.now(); },

		get stats(): Stats {
			return computeStats(state, DECK, now);
		},

		get queue(): Card[] {
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

		/** Per-tier progress for the dashboard. */
		get tierProgress() {
			return TIERS.map((tier) => {
				const cards = cardsOfTier(tier.id);
				let mature = 0;
				let young = 0;
				for (const c of cards) {
					const cs = state.cards[c.id];
					if (!cs) continue;
					if (cs.ivl >= 21) mature++;
					else young++;
				}
				return {
					...tier,
					unlocked: isUnlocked(state, tier.id),
					mature,
					young,
					unseen: cards.length - mature - young
				};
			});
		},

		/** Returns how many cards this actually released. */
		unlock(tiers: string[]): number {
			const before = state.unlocked.length;
			const next = unlockTiers(state, tiers);
			if (next === state) return 0;
			commit(next);
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
			state = emptyState();
		},

		export(): string {
			return JSON.stringify(state, null, 2);
		},

		import(json: string): boolean {
			try {
				commit(reviveState(JSON.parse(json)));
				return true;
			} catch {
				return false;
			}
		}
	};
}

export const progress = createProgress();
