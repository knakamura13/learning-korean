/**
 * session.svelte.ts — who is signed in, and the sync engine's lifecycle.
 *
 * Three statuses: 'unknown' until /api/me answers (UI renders nothing
 * account-shaped during it, so prerendered pages never flash), 'guest' when
 * signed out OR when this deployment has no accounts at all
 * (`accountsAvailable` separates those for the Settings page), and
 * 'signed-in'. Signing in never migrates anything destructive: the engine
 * merges, and local storage remains the source of truth.
 */

import { browser } from '$app/environment';
import { createSyncApi, type SyncApi } from '$lib/sync/api';
import { createSyncEngine, type SyncEngine } from '$lib/sync/engine';
import { wrapExport } from '$lib/domain/backup';
import { progress, type StudyPrefs } from './progress.svelte';
import { labSession } from './labSession.svelte';

export type SessionStatus = 'unknown' | 'guest' | 'signed-in';

export interface SessionNotice {
	tone: 'wrong';
	message: string;
}

export interface SessionUserInfo {
	email: string;
	name: string | null;
}

export function createSession(api: SyncApi = createSyncApi()) {
	let status = $state<SessionStatus>('unknown');
	let user = $state<SessionUserInfo | null>(null);
	let accountsAvailable = $state(false);
	let notice = $state<SessionNotice | null>(null);
	let engine: SyncEngine | null = null;
	let detach: (() => void) | null = null;

	function buildDoc(): unknown | null {
		if (progress.corrupt || labSession.corrupt) return null;
		try {
			return JSON.parse(wrapExport(progress.export(), labSession.snapshot)) as unknown;
		} catch {
			return null;
		}
	}

	function applyRemote(doc: unknown) {
		if (!doc || typeof doc !== 'object') return;
		const envelope = doc as { srs?: unknown; sessions?: unknown };
		progress.applyRemote(envelope.srs);
		labSession.applyRemote(envelope.sessions);
	}

	function becomeGuest(nextNotice: SessionNotice | null = null) {
		status = 'guest';
		user = null;
		notice = nextNotice;
		engine?.stop();
		engine = null;
		detach?.();
		detach = null;
	}

	function startEngine() {
		engine = createSyncEngine({
			api,
			buildDoc,
			applyRemote,
			onAuthLost: () =>
				becomeGuest({
					tone: 'wrong',
					message: 'Signed out. Progress in this browser is kept.'
				})
		});
		void engine.start();

		if (browser) {
			const onVisibility = () => {
				if (document.visibilityState === 'visible') engine?.onVisible();
				else engine?.flush((baseRev, doc) => void api.putState(baseRev, doc, true));
			};
			const onPageHide = () =>
				engine?.flush((baseRev, doc) => void api.putState(baseRev, doc, true));
			document.addEventListener('visibilitychange', onVisibility);
			window.addEventListener('pagehide', onPageHide);
			detach = () => {
				document.removeEventListener('visibilitychange', onVisibility);
				window.removeEventListener('pagehide', onPageHide);
			};
		}
	}

	return {
		get status() {
			return status;
		},
		get user() {
			return user;
		},
		get accountsAvailable() {
			return accountsAvailable;
		},
		get notice() {
			return notice;
		},

		clearNotice() {
			notice = null;
		},

		/** Called once from the layout. Safe to call again after sign-out. */
		async load() {
			const result = await api.me();
			if (result.kind !== 'ok') {
				accountsAvailable = false;
				becomeGuest();
				return;
			}
			accountsAvailable = true;
			if (!result.data.user) {
				becomeGuest();
				return;
			}
			user = result.data.user;
			status = 'signed-in';
			notice = null;
			if (result.data.prefs) progress.setStudyPrefs(result.data.prefs);
			startEngine();
		},

		/** The layout calls this on every store commit; a no-op while guest. */
		noteLocalChange() {
			engine?.onLocalChange();
		},

		async savePrefs(prefs: StudyPrefs): Promise<boolean> {
			const result = await api.putPrefs(prefs.newPerDay, prefs.reviewsPerSitting);
			if (result.kind !== 'ok') return false;
			progress.setStudyPrefs(result.data.prefs);
			return true;
		},

		async signOut() {
			await api.logout();
			becomeGuest();
		},

		/** Server copy is gone; the browser-local deck stays, as guest data. */
		async deleteAccount(): Promise<boolean> {
			const result = await api.deleteAccount();
			if (result.kind !== 'ok') return false;
			becomeGuest();
			return true;
		}
	};
}

export const session = createSession();
