import { building, dev } from '$app/environment';
import type { Handle } from '@sveltejs/kit';
import { activeSystem } from '$lib/theme/active';
import { LOOKS } from '$lib/theme/catalog';
import { applyDesignSystem } from '$lib/theme/placeholders';
import { getDb } from '$lib/server/db';
import { apiOriginAllowed } from '$lib/server/http';
import { createRepo } from '$lib/server/repo';
import {
	SESSION_COOKIE,
	SESSION_EXTEND_BELOW_MS,
	SESSION_TTL_MS,
	hashSessionToken,
	setSessionCookie
} from '$lib/server/session';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.repo = null;
	event.locals.user = null;
	event.locals.sessionTokenHash = null;

	if (!building && event.url.pathname.startsWith('/api/')) {
		const { request, url } = event;
		if (!apiOriginAllowed(request.method, request.headers.get('origin'), url.origin)) {
			return new Response(JSON.stringify({ error: 'cross-origin request rejected' }), {
				status: 403,
				headers: { 'content-type': 'application/json' }
			});
		}

		const db = getDb();
		if (db) {
			try {
				event.locals.repo = createRepo(await db);
			} catch (error) {
				console.error('[db] unavailable:', error);
			}
		}

		const token = event.cookies.get(SESSION_COOKIE);
		if (token && event.locals.repo) {
			const hash = hashSessionToken(token);
			const now = new Date();
			const found = await event.locals.repo.userForSession(hash, now);
			if (found) {
				event.locals.user = found.user;
				event.locals.sessionTokenHash = hash;
				if (found.expiresAt.getTime() - now.getTime() < SESSION_EXTEND_BELOW_MS) {
					const extended = new Date(now.getTime() + SESSION_TTL_MS);
					await event.locals.repo.extendSession(hash, extended);
					setSessionCookie(event.cookies, token, !dev);
				}
			}
		}
	}

	return resolve(event, {
		transformPageChunk: ({ html }) => applyDesignSystem(html, LOOKS, activeSystem)
	});
};
