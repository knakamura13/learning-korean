/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_NEW_PER_DAY, DEFAULT_REVIEW_PER_SITTING } from '$lib/domain/srs';
import { APP_BACKUP_KIND } from '$lib/domain/backup';
import type { SyncApi, MeResponse, ApiResult } from '$lib/sync/api';
import { createSession } from './session.svelte';
import { progress } from './progress.svelte';

afterEach(() => {
	localStorage.clear();
	window.dispatchEvent(new StorageEvent('storage', { key: null, storageArea: localStorage }));
	progress.setStudyPrefs({
		newPerDay: DEFAULT_NEW_PER_DAY,
		reviewsPerSitting: DEFAULT_REVIEW_PER_SITTING
	});
});

const signedIn: ApiResult<MeResponse> = {
	kind: 'ok',
	data: {
		user: { email: 'kyle@example.com', name: 'Kyle' },
		prefs: { newPerDay: 5, reviewsPerSitting: 12 }
	}
};

function fakeApi(overrides: Partial<SyncApi> = {}): SyncApi & {
	putCalls: { baseRev: number; doc: unknown }[];
	logouts: number;
	deletes: number;
} {
	const record = {
		putCalls: [] as { baseRev: number; doc: unknown }[],
		logouts: 0,
		deletes: 0
	};
	return {
		...record,
		me: async () => signedIn,
		getState: async () => ({ kind: 'ok', data: { rev: 0, doc: null } }) as never,
		putState: async (baseRev: number, doc: unknown) => {
			record.putCalls.push({ baseRev, doc });
			return { kind: 'ok', data: { rev: baseRev + 1 } } as never;
		},
		putPrefs: async (newPerDay: number, reviewsPerSitting: number) =>
			({ kind: 'ok', data: { prefs: { newPerDay, reviewsPerSitting } } }) as never,
		logout: async () => {
			record.logouts++;
			return { kind: 'ok', data: undefined } as never;
		},
		deleteAccount: async () => {
			record.deletes++;
			return { kind: 'ok', data: undefined } as never;
		},
		...overrides,
		get putCalls() {
			return record.putCalls;
		},
		get logouts() {
			return record.logouts;
		},
		get deletes() {
			return record.deletes;
		}
	};
}

describe('session store', () => {
	it('treats an unavailable backend as guest with accounts hidden', async () => {
		const session = createSession(fakeApi({ me: async () => ({ kind: 'unavailable' }) }));
		expect(session.status).toBe('unknown');
		await session.load();
		expect(session.status).toBe('guest');
		expect(session.accountsAvailable).toBe(false);
	});

	it('treats a signed-out backend as guest with accounts offered', async () => {
		const session = createSession(fakeApi({ me: async () => ({ kind: 'ok', data: { user: null } }) }));
		await session.load();
		expect(session.status).toBe('guest');
		expect(session.accountsAvailable).toBe(true);
	});

	it('signs in, applies account pacing, and adopts the local deck', async () => {
		const api = fakeApi();
		const session = createSession(api);
		await session.load();

		expect(session.status).toBe('signed-in');
		expect(session.user?.email).toBe('kyle@example.com');
		expect(progress.studyPrefs).toEqual({ newPerDay: 5, reviewsPerSitting: 12 });

		await vi.waitFor(() => expect(api.putCalls.length).toBe(1));
		const pushed = api.putCalls[0];
		expect(pushed.baseRev).toBe(0);
		expect((pushed.doc as { kind: string }).kind).toBe(APP_BACKUP_KIND);
	});

	it('saves prefs through the API before applying them locally', async () => {
		const session = createSession(fakeApi());
		await session.load();
		expect(await session.savePrefs({ newPerDay: 2, reviewsPerSitting: 4 })).toBe(true);
		expect(progress.studyPrefs).toEqual({ newPerDay: 2, reviewsPerSitting: 4 });

		const offline = createSession(fakeApi({ putPrefs: async () => ({ kind: 'unavailable' }) }));
		await offline.load();
		expect(await offline.savePrefs({ newPerDay: 9, reviewsPerSitting: 9 })).toBe(false);
	});

	it('signs out and deletes accounts back to guest', async () => {
		const api = fakeApi();
		const session = createSession(api);
		await session.load();

		await session.signOut();
		expect(session.status).toBe('guest');
		expect(api.logouts).toBe(1);

		await session.load();
		expect(await session.deleteAccount()).toBe(true);
		expect(session.status).toBe('guest');
		expect(api.deletes).toBe(1);
	});

	it('falls back to guest when the session dies server-side', async () => {
		const api = fakeApi({ getState: async () => ({ kind: 'unauthorized' }) });
		const session = createSession(api);
		await session.load();
		await vi.waitFor(() => expect(session.status).toBe('guest'));
	});

	it('noteLocalChange is safe for guests', async () => {
		const session = createSession(fakeApi({ me: async () => ({ kind: 'unavailable' }) }));
		await session.load();
		expect(() => session.noteLocalChange()).not.toThrow();
	});
});
