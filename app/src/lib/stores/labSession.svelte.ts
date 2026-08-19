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

function decodeSessions(raw: string | null): { state: LabSessions; corrupt: string | null } {
	if (raw == null || raw === '') return { state: emptySessions(), corrupt: null };
	try {
		return { state: reviveSessions(JSON.parse(raw), STEP_COUNTS), corrupt: null };
	} catch {
		return { state: emptySessions(), corrupt: raw };
	}
}

export function createLabSession(store: Storage = browser ? browserStorage(STORAGE_KEY) : memoryStorage()) {
	const loaded = decodeSessions(store.read());
	let state = $state<LabSessions>(loaded.state);
	let corruptRaw = $state<string | null>(loaded.corrupt);

	function commit(next: LabSessions) {
		if (next === state) return;
		state = next;
		if (corruptRaw) return;
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
