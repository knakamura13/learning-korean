import { describe, it, expect } from 'vitest';
import { GET as getMe } from '../../routes/api/me/+server';
import { GET as getState, PUT as putState } from '../../routes/api/state/+server';
import { PUT as putPrefs } from '../../routes/api/prefs/+server';
import { allowReport } from './rateLimit';
import { hashSessionToken, newSessionToken } from './session';
import { decodeIdToken, exchangeGoogleCode, googleAuthorizeUrl, pkceChallenge } from './googleOauth';
import { isAccountStateDoc } from './stateDoc';
import { apiOriginAllowed, readJsonBody } from './http';
import type { AccountState, Repo, SessionUser } from './repo';
import { emptyState } from '$lib/domain/srs';
import { emptySessions } from '$lib/domain/labSession';
import { APP_BACKUP_KIND, APP_BACKUP_VERSION } from '$lib/domain/backup';

const user: SessionUser = {
	id: 1,
	email: 'kyle@example.com',
	name: 'Kyle',
	newPerDay: 10,
	reviewsPerSitting: 10
};

function validDoc() {
	return {
		kind: APP_BACKUP_KIND,
		version: APP_BACKUP_VERSION,
		srs: emptyState(),
		sessions: emptySessions()
	};
}

/** In-memory Repo good enough for handler behavior. */
function fakeRepo(initial: AccountState | null = null): Repo & { state: AccountState | null } {
	const store = {
		state: initial,
		async upsertUser() {
			return user;
		},
		async createSession() {},
		async userForSession() {
			return null;
		},
		async extendSession() {},
		async deleteSession() {},
		async getState() {
			return store.state;
		},
		async putState(_userId: number, baseRev: number, doc: unknown) {
			if (baseRev === 0) {
				if (store.state) return null;
				store.state = { rev: 1, doc };
				return 1;
			}
			if (!store.state || store.state.rev !== baseRev) return null;
			store.state = { rev: baseRev + 1, doc };
			return store.state.rev;
		},
		async setPrefs(_userId: number, newPerDay: number, reviewsPerSitting: number) {
			return { ...user, newPerDay, reviewsPerSitting };
		},
		async deleteUser() {}
	};
	return store;
}

type Handler = (event: never) => Promise<Response>;

function call(
	handler: unknown,
	locals: Partial<App.Locals>,
	body?: unknown
): Promise<Response> {
	const request = new Request('http://localhost/api/test', {
		method: body === undefined ? 'GET' : 'PUT',
		headers: body === undefined ? {} : { 'content-type': 'application/json' },
		body: body === undefined ? undefined : JSON.stringify(body)
	});
	const event = {
		locals: { repo: null, user: null, sessionTokenHash: null, ...locals },
		request
	};
	return (handler as Handler)(event as never);
}

describe('apiOriginAllowed', () => {
	it('lets reads through and gates writes on a matching Origin', () => {
		expect(apiOriginAllowed('GET', null, 'https://app.test')).toBe(true);
		expect(apiOriginAllowed('PUT', 'https://app.test', 'https://app.test')).toBe(true);
		expect(apiOriginAllowed('PUT', 'https://evil.test', 'https://app.test')).toBe(false);
		expect(apiOriginAllowed('POST', null, 'https://app.test')).toBe(false);
	});
});

describe('/api/me', () => {
	it('answers 503 user:null when accounts are unavailable', async () => {
		const res = await call(getMe, {});
		expect(res.status).toBe(503);
		expect(await res.json()).toEqual({ user: null });
	});

	it('answers user:null when signed out, never 401', async () => {
		const res = await call(getMe, { repo: fakeRepo() });
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ user: null });
	});

	it('returns identity and prefs when signed in', async () => {
		const res = await call(getMe, { repo: fakeRepo(), user });
		expect(await res.json()).toEqual({
			user: { email: 'kyle@example.com', name: 'Kyle' },
			prefs: { newPerDay: 10, reviewsPerSitting: 10 }
		});
		expect(res.headers.get('cache-control')).toBe('no-store');
	});
});

describe('/api/state', () => {
	it('requires a session', async () => {
		expect((await call(getState, { repo: fakeRepo() })).status).toBe(401);
		expect((await call(putState, { repo: fakeRepo() }, { baseRev: 0, doc: validDoc() })).status).toBe(401);
	});

	it('hands a first-time account rev 0 and no doc', async () => {
		const res = await call(getState, { repo: fakeRepo(), user });
		expect(await res.json()).toEqual({ rev: 0, doc: null });
	});

	it('accepts a first write at baseRev 0 and bumps the rev after', async () => {
		const repo = fakeRepo();
		const first = await call(putState, { repo, user }, { baseRev: 0, doc: validDoc() });
		expect(await first.json()).toEqual({ rev: 1 });
		const second = await call(putState, { repo, user }, { baseRev: 1, doc: validDoc() });
		expect(await second.json()).toEqual({ rev: 2 });
	});

	it('answers 409 with the current copy when the caller lost the race', async () => {
		const winning = validDoc();
		const repo = fakeRepo({ rev: 3, doc: winning });
		const res = await call(putState, { repo, user }, { baseRev: 2, doc: validDoc() });
		expect(res.status).toBe(409);
		expect(await res.json()).toEqual({ rev: 3, doc: winning });
	});

	it('rejects payloads that are not a progress document', async () => {
		const repo = fakeRepo();
		expect((await call(putState, { repo, user }, { baseRev: 0, doc: { kind: 'nope' } })).status).toBe(400);
		expect((await call(putState, { repo, user }, { baseRev: -1, doc: validDoc() })).status).toBe(400);
		expect((await call(putState, { repo, user }, { baseRev: 0.5, doc: validDoc() })).status).toBe(400);
		expect(repo.state).toBeNull();
	});
});

describe('/api/prefs', () => {
	it('validates ranges before touching the database', async () => {
		const repo = fakeRepo();
		expect((await call(putPrefs, { repo, user }, { newPerDay: -1, reviewsPerSitting: 10 })).status).toBe(400);
		expect((await call(putPrefs, { repo, user }, { newPerDay: 51, reviewsPerSitting: 10 })).status).toBe(400);
		expect((await call(putPrefs, { repo, user }, { newPerDay: 10, reviewsPerSitting: 0 })).status).toBe(400);
		expect((await call(putPrefs, { repo, user }, { newPerDay: 5, reviewsPerSitting: 20 })).status).toBe(200);
	});

	it('echoes the stored prefs back', async () => {
		const res = await call(putPrefs, { repo: fakeRepo(), user }, { newPerDay: 3, reviewsPerSitting: 15 });
		expect(await res.json()).toEqual({ prefs: { newPerDay: 3, reviewsPerSitting: 15 } });
	});
});

describe('/api/client-errors rate limit', () => {
	it('allows a burst then cuts off within the window', () => {
		const t = 1_000_000;
		for (let i = 0; i < 10; i++) expect(allowReport('1.2.3.4', t + i)).toBe(true);
		expect(allowReport('1.2.3.4', t + 11)).toBe(false);
		expect(allowReport('5.6.7.8', t + 11)).toBe(true);
		expect(allowReport('1.2.3.4', t + 61_000)).toBe(true);
	});
});

describe('sessions', () => {
	it('tokens hash stably and never repeat', () => {
		const a = newSessionToken();
		const b = newSessionToken();
		expect(a.token).not.toBe(b.token);
		expect(hashSessionToken(a.token)).toBe(a.hash);
		expect(a.hash).toMatch(/^[0-9a-f]{64}$/);
	});
});

describe('google oauth', () => {
	it('builds an authorize URL carrying state and an S256 challenge', () => {
		const url = new URL(
			googleAuthorizeUrl({
				clientId: 'cid',
				redirectUri: 'https://app.test/api/auth/google/callback',
				state: 'st4te',
				codeVerifier: 'verifier'
			})
		);
		expect(url.origin).toBe('https://accounts.google.com');
		expect(url.searchParams.get('state')).toBe('st4te');
		expect(url.searchParams.get('code_challenge')).toBe(pkceChallenge('verifier'));
		expect(url.searchParams.get('code_challenge_method')).toBe('S256');
		expect(url.searchParams.get('redirect_uri')).toBe('https://app.test/api/auth/google/callback');
	});

	it('decodes an id_token payload and rejects malformed ones', () => {
		const payload = Buffer.from(
			JSON.stringify({ sub: '123', email: 'kyle@example.com', name: 'Kyle' })
		).toString('base64url');
		expect(decodeIdToken(`h.${payload}.s`)).toEqual({
			sub: '123',
			email: 'kyle@example.com',
			name: 'Kyle'
		});
		expect(decodeIdToken('nonsense')).toBeNull();
		expect(decodeIdToken(`h.${Buffer.from('{}').toString('base64url')}.s`)).toBeNull();
	});

	it('exchanges a code through an injected fetch and fails closed', async () => {
		const payload = Buffer.from(JSON.stringify({ sub: '9', email: 'a@b.c' })).toString('base64url');
		const ok = await exchangeGoogleCode({
			code: 'c',
			codeVerifier: 'v',
			clientId: 'id',
			clientSecret: 'secret',
			redirectUri: 'https://app.test/cb',
			fetchFn: async () =>
				new Response(JSON.stringify({ id_token: `h.${payload}.s` }), { status: 200 })
		});
		expect(ok).toEqual({ sub: '9', email: 'a@b.c', name: null });

		const denied = await exchangeGoogleCode({
			code: 'c',
			codeVerifier: 'v',
			clientId: 'id',
			clientSecret: 'secret',
			redirectUri: 'https://app.test/cb',
			fetchFn: async () => new Response('nope', { status: 400 })
		});
		expect(denied).toBeNull();
	});
});

describe('state document validation', () => {
	it('accepts the v2 envelope and rejects everything else', () => {
		expect(isAccountStateDoc(validDoc())).toBe(true);
		expect(isAccountStateDoc(null)).toBe(false);
		expect(isAccountStateDoc({ kind: 'korean-progress', version: 1 })).toBe(false);
		expect(isAccountStateDoc({ ...validDoc(), srs: { version: 99 } })).toBe(false);
		expect(isAccountStateDoc({ ...validDoc(), sessions: { version: 2, labs: {} } })).toBe(false);
		expect(isAccountStateDoc({ ...validDoc(), sessions: { version: 1 } })).toBe(false);
	});
});

describe('readJsonBody', () => {
	it('enforces content type and the size ceiling', async () => {
		const good = new Request('http://x', {
			method: 'PUT',
			headers: { 'content-type': 'application/json' },
			body: '{"a":1}'
		});
		expect(await readJsonBody(good, 100)).toEqual({ a: 1 });

		const wrongType = new Request('http://x', { method: 'PUT', body: '{"a":1}' });
		expect(await readJsonBody(wrongType, 100)).toBeNull();

		const tooBig = new Request('http://x', {
			method: 'PUT',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ pad: 'x'.repeat(200) })
		});
		expect(await readJsonBody(tooBig, 100)).toBeNull();
	});
});
