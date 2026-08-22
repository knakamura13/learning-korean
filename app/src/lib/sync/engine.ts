/**
 * engine.ts — login-and-load sync, as a plain dependency-injected module.
 *
 * The flow, per the design decisions:
 * - On start: pull. rev 0 means first sign-in → the local (guest) document is
 *   adopted as the account copy. Otherwise the server copy merges INTO local
 *   (localStorage stays the source of truth) and pushes back only if the
 *   merge produced something new.
 * - After local activity: a debounced push, CAS-checked by revision.
 * - On a 409: merge the server's current copy locally and push again —
 *   the merge is deterministic, so this converges. Never asks the learner.
 * - Quarantined-corrupt local state makes the engine fully inert for safety:
 *   pushing would clobber the account copy with an empty deck.
 *
 * Svelte reactivity stays outside: the layout observes store commits and
 * calls `onLocalChange()`; this module owns only protocol state, which is
 * what makes it unit-testable without a component tree.
 */

import type { SyncApi } from './api';

/** Key-sorted stringify so Postgres jsonb key reordering cannot fake a diff. */
export function canonicalJson(value: unknown): string {
	if (value === null || typeof value !== 'object') return JSON.stringify(value);
	if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
	const keys = Object.keys(value as Record<string, unknown>).sort();
	const parts = keys.map(
		(k) => `${JSON.stringify(k)}:${canonicalJson((value as Record<string, unknown>)[k])}`
	);
	return `{${parts.join(',')}}`;
}

export interface SyncEngineDeps {
	api: Pick<SyncApi, 'getState' | 'putState'>;
	/** Current local document as the v2 envelope, or null while quarantined. */
	buildDoc(): unknown | null;
	/** Merge a server envelope into local state. Must never prompt. */
	applyRemote(doc: unknown): void;
	/** Session died server-side (expired/revoked). */
	onAuthLost(): void;
	debounceMs?: number;
	pullIntervalMs?: number;
	now?: () => number;
}

const PUSH_DEBOUNCE_MS = 3000;
const PULL_INTERVAL_MS = 60_000;
const MAX_CONFLICT_ROUNDS = 3;

export function createSyncEngine(deps: SyncEngineDeps) {
	const debounceMs = deps.debounceMs ?? PUSH_DEBOUNCE_MS;
	const pullIntervalMs = deps.pullIntervalMs ?? PULL_INTERVAL_MS;
	const now = deps.now ?? Date.now;

	let knownRev = 0;
	let lastPushed: string | null = null;
	let lastPullAt = -Infinity;
	let timer: ReturnType<typeof setTimeout> | null = null;
	let running = false;
	let stopped = false;

	function clearTimer() {
		if (timer !== null) {
			clearTimeout(timer);
			timer = null;
		}
	}

	async function pushLoop(): Promise<void> {
		for (let round = 0; round < MAX_CONFLICT_ROUNDS; round++) {
			const doc = deps.buildDoc();
			if (doc === null) return;
			const json = canonicalJson(doc);
			if (json === lastPushed) return;

			const result = await deps.api.putState(knownRev, doc);
			if (result.kind === 'ok') {
				knownRev = result.data.rev;
				lastPushed = json;
				return;
			}
			if (result.kind === 'conflict') {
				knownRev = result.rev;
				if (result.doc !== null) {
					deps.applyRemote(result.doc);
					lastPushed = canonicalJson(result.doc);
				}
				continue;
			}
			if (result.kind === 'unauthorized') deps.onAuthLost();
			return;
		}
	}

	async function pullMerge(): Promise<void> {
		lastPullAt = now();
		const result = await deps.api.getState();
		if (result.kind === 'unauthorized') {
			deps.onAuthLost();
			return;
		}
		if (result.kind !== 'ok') return;
		if (result.data.rev > 0 && result.data.doc !== null) {
			knownRev = result.data.rev;
			deps.applyRemote(result.data.doc);
			lastPushed = canonicalJson(result.data.doc);
		} else {
			// First sign-in on this account: the local deck becomes the copy.
			knownRev = 0;
			lastPushed = null;
		}
		await pushLoop();
	}

	async function run(task: () => Promise<void>): Promise<void> {
		if (running || stopped) return;
		running = true;
		try {
			await task();
		} finally {
			running = false;
		}
	}

	return {
		/** Sign-in (or app start while signed in): pull, merge, adopt, settle. */
		start: () => run(pullMerge),

		/** A store committed; push soon. */
		onLocalChange() {
			if (stopped) return;
			clearTimer();
			timer = setTimeout(() => {
				timer = null;
				void run(pushLoop);
			}, debounceMs);
		},

		/** Tab became visible; re-pull if it has been a while. */
		onVisible() {
			if (stopped) return;
			if (now() - lastPullAt < pullIntervalMs) return;
			void run(pullMerge);
		},

		/** Best-effort keepalive push on pagehide; no await, no retry. */
		flush(putKeepalive: (baseRev: number, doc: unknown) => void) {
			if (stopped) return;
			const doc = deps.buildDoc();
			if (doc === null) return;
			if (canonicalJson(doc) === lastPushed) return;
			putKeepalive(knownRev, doc);
		},

		stop() {
			stopped = true;
			clearTimer();
		},

		/** Test/inspection surface. */
		get rev() {
			return knownRev;
		}
	};
}

export type SyncEngine = ReturnType<typeof createSyncEngine>;
