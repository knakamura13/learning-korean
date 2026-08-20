/**
 * labSession.svelte.ts — the write path for in-progress lab place.
 *
 * Kept off the SRS document on purpose: reviveState has a compatibility
 * branch for the pre-rewrite payload, and lab progress must not ride along.
 */

import { browser } from '$app/environment';
import { LABS } from '$lib/content';
import {
	clearLab,
	decodeStoredSessions,
	emptySessions,
	reviveSessions,
	upsertLab,
	type LabProgress,
	type LabSessions
} from '$lib/domain/labSession';
import { browserStorage, memoryStorage, onStorageKey, type Storage } from '$lib/domain/storage';

export const LAB_SESSION_STORAGE_KEY = 'korean-lab-session-v1';

export const LAB_STEP_COUNTS: Record<string, number> = Object.fromEntries(
	LABS.map((lab) => [lab.id, lab.steps.length])
);

export function createLabSession(
	store: Storage = browser ? browserStorage(LAB_SESSION_STORAGE_KEY) : memoryStorage()
) {
	const loaded = decodeStoredSessions(store.read(), LAB_STEP_COUNTS);
	let state = $state<LabSessions>(loaded.sessions);
	let durable = $state(store.durable);
	let corruptRaw = $state<string | null>(loaded.corrupt);

	function applyStored() {
		const next = decodeStoredSessions(store.read(), LAB_STEP_COUNTS);
		state = next.sessions;
		corruptRaw = next.corrupt;
		durable = store.durable;
	}

	onStorageKey(LAB_SESSION_STORAGE_KEY, applyStored);

	function commit(next: LabSessions) {
		if (corruptRaw) return;
		if (next === state) return;
		state = next;
		if (!store.write(JSON.stringify(next))) durable = false;
	}

	return {
		get all() {
			return state.labs;
		},

		get snapshot(): LabSessions {
			return state;
		},

		get durable() {
			return durable;
		},

		get corrupt() {
			return corruptRaw !== null;
		},

		forLab(labId: string): LabProgress | undefined {
			return state.labs[labId];
		},

		save(labId: string, progress: LabProgress) {
			const count = LAB_STEP_COUNTS[labId];
			if (count === undefined) return;
			commit(upsertLab(state, labId, progress, count));
		},

		clear(labId: string) {
			commit(clearLab(state, labId));
		},

		replaceAll(raw: unknown) {
			const next = reviveSessions(raw, LAB_STEP_COUNTS);
			if (!store.write(JSON.stringify(next))) {
				durable = false;
				return;
			}
			corruptRaw = null;
			state = next;
		},

		reset() {
			store.clear();
			corruptRaw = null;
			durable = store.durable;
			state = emptySessions();
		}
	};
}

export const labSession = createLabSession();
