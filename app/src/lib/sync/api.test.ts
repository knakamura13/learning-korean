import { describe, expect, it } from 'vitest';
import { createSyncApi } from './api';

function jsonRes(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' }
	});
}

function apiWith(res: () => Promise<Response> | Response) {
	const calls: { url: string; init?: RequestInit }[] = [];
	const fetchFn = (async (url: unknown, init?: RequestInit) => {
		calls.push({ url: String(url), init });
		return res();
	}) as typeof fetch;
	return { api: createSyncApi(fetchFn), calls };
}

describe('sync api wrapper', () => {
	it('maps 2xx JSON to ok', async () => {
		const { api } = apiWith(() => jsonRes({ user: null }));
		expect(await api.me()).toEqual({ kind: 'ok', data: { user: null } });
	});

	it('maps 401 to unauthorized and 404/503/non-JSON to unavailable', async () => {
		expect((await apiWith(() => new Response(null, { status: 401 })).api.me()).kind).toBe(
			'unauthorized'
		);
		expect((await apiWith(() => new Response('nope', { status: 404 })).api.me()).kind).toBe(
			'unavailable'
		);
		expect((await apiWith(() => jsonRes({ user: null }, 503)).api.me()).kind).toBe('unavailable');
		expect(
			(await apiWith(() => new Response('<html>', { status: 200 })).api.me()).kind
		).toBe('unavailable');
	});

	it('maps a network failure to unavailable', async () => {
		const { api } = apiWith(() => Promise.reject(new Error('offline')));
		expect((await api.getState()).kind).toBe('unavailable');
	});

	it('surfaces a 409 as conflict with the server copy', async () => {
		const { api } = apiWith(() => jsonRes({ rev: 7, doc: { n: 1 } }, 409));
		expect(await api.putState(3, { n: 2 })).toEqual({ kind: 'conflict', rev: 7, doc: { n: 1 } });

		const malformed = apiWith(() => new Response('x', { status: 409 }));
		expect((await malformed.api.putState(3, {})).kind).toBe('unavailable');
	});

	it('sends JSON bodies with the right method and honors keepalive', async () => {
		const { api, calls } = apiWith(() => jsonRes({ rev: 1 }));
		await api.putState(0, { n: 1 }, true);
		expect(calls[0].url).toBe('/api/state');
		expect(calls[0].init?.method).toBe('PUT');
		expect(calls[0].init?.keepalive).toBe(true);
		expect(JSON.parse(String(calls[0].init?.body))).toEqual({ baseRev: 0, doc: { n: 1 } });
	});

	it('treats 204 as ok for logout and delete', async () => {
		const { api, calls } = apiWith(() => new Response(null, { status: 204 }));
		expect((await api.logout()).kind).toBe('ok');
		expect((await api.deleteAccount()).kind).toBe('ok');
		expect(calls.map((c) => c.init?.method)).toEqual(['POST', 'DELETE']);
	});

	it('round-trips prefs', async () => {
		const { api, calls } = apiWith(() => jsonRes({ prefs: { newPerDay: 4, reviewsPerSitting: 8 } }));
		const result = await api.putPrefs(4, 8);
		expect(result).toEqual({ kind: 'ok', data: { prefs: { newPerDay: 4, reviewsPerSitting: 8 } } });
		expect(calls[0].url).toBe('/api/prefs');
	});
});
