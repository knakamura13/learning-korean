/**
 * api.ts — typed fetch wrapper for the account API.
 *
 * "Unavailable" is a value, not an exception: a static deployment 404s these
 * paths, a database-less deployment 503s them, and a network drop rejects —
 * all three mean "run as the guest app". The server never sees a merge; it
 * only stores and CAS-checks documents.
 */

export interface MeResponse {
	user: { email: string; name: string | null } | null;
	prefs?: { newPerDay: number; reviewsPerSitting: number };
}

export type ApiResult<T> =
	| { kind: 'ok'; data: T }
	| { kind: 'unauthorized' }
	| { kind: 'conflict'; rev: number; doc: unknown }
	| { kind: 'unavailable' };

async function jsonOf(res: Response): Promise<unknown | null> {
	if (!(res.headers.get('content-type') ?? '').startsWith('application/json')) return null;
	try {
		return (await res.json()) as unknown;
	} catch {
		return null;
	}
}

async function request<T>(
	fetchFn: typeof fetch,
	path: string,
	init?: RequestInit
): Promise<ApiResult<T>> {
	let res: Response;
	try {
		res = await fetchFn(path, init);
	} catch {
		return { kind: 'unavailable' };
	}
	if (res.status === 401) return { kind: 'unauthorized' };
	if (res.status === 409) {
		const body = (await jsonOf(res)) as { rev?: number; doc?: unknown } | null;
		if (body && typeof body.rev === 'number') {
			return { kind: 'conflict', rev: body.rev, doc: body.doc ?? null };
		}
		return { kind: 'unavailable' };
	}
	if (res.status === 204) return { kind: 'ok', data: undefined as T };
	if (!res.ok) return { kind: 'unavailable' };
	const body = await jsonOf(res);
	if (body === null) return { kind: 'unavailable' };
	return { kind: 'ok', data: body as T };
}

function jsonInit(method: string, body: unknown, keepalive = false): RequestInit {
	return {
		method,
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body),
		keepalive
	};
}

export function createSyncApi(fetchFn: typeof fetch = fetch) {
	return {
		me: () => request<MeResponse>(fetchFn, '/api/me'),
		getState: () => request<{ rev: number; doc: unknown }>(fetchFn, '/api/state'),
		putState: (baseRev: number, doc: unknown, keepalive = false) =>
			request<{ rev: number }>(fetchFn, '/api/state', jsonInit('PUT', { baseRev, doc }, keepalive)),
		putPrefs: (newPerDay: number, reviewsPerSitting: number) =>
			request<{ prefs: { newPerDay: number; reviewsPerSitting: number } }>(
				fetchFn,
				'/api/prefs',
				jsonInit('PUT', { newPerDay, reviewsPerSitting })
			),
		logout: () => request<void>(fetchFn, '/api/auth/logout', { method: 'POST' }),
		deleteAccount: () => request<void>(fetchFn, '/api/account', { method: 'DELETE' })
	};
}

export type SyncApi = ReturnType<typeof createSyncApi>;
