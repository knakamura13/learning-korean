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
	emptySessions,
	reviveSessions,
	upsertLab,
	type LabProgress,
	type LabSessions
} from '$lib/domain/labSession';
import { browserStorage, memoryStorage, type Storage } from '$lib/domain/storage';

const STORAGE_KEY = 'korean-lab-session-v1';

const STEP_COUNTS: Record<string, number> = Object.fromEntries(
	LABS.map((lab) => [lab.id, lab.steps.length])
);

function load(store: Storage): LabSessions {
	const raw = store.read();
	if (!raw) return emptySessions();
	try {
		return reviveSessions(JSON.parse(raw), STEP_COUNTS);
	} catch {
		return emptySessions();
	}
}

function createLabSession() {
	const store: Storage = browser ? browserStorage(STORAGE_KEY) : memoryStorage();
	let state = $state<LabSessions>(load(store));

	function commit(next: LabSessions) {
		if (next === state) return;
		state = next;
		store.write(JSON.stringify(next));
	}

	return {
		get all() {
			return state.labs;
		},

		forLab(labId: string): LabProgress | undefined {
			return state.labs[labId];
		},

		save(labId: string, progress: LabProgress) {
			const count = STEP_COUNTS[labId];
			if (count === undefined) return;
			commit(upsertLab(state, labId, progress, count));
		},

		clear(labId: string) {
			commit(clearLab(state, labId));
		}
	};
}

export const labSession = createLabSession();
