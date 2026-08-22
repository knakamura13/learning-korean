/**
 * DELETE /api/account — hard delete. Sessions and the synced document go with
 * the user row via cascade; the browser's local copy is untouched and simply
 * becomes guest data again.
 */

import { dev } from '$app/environment';
import type { RequestHandler } from './$types';
import { emptyResponse, jsonResponse } from '$lib/server/http';
import { clearSessionCookie } from '$lib/server/session';

export const prerender = false;

export const DELETE: RequestHandler = async ({ cookies, locals }) => {
	if (!locals.repo) return jsonResponse({ error: 'accounts unavailable' }, 503);
	if (!locals.user) return jsonResponse({ error: 'sign in first' }, 401);

	await locals.repo.deleteUser(locals.user.id);
	clearSessionCookie(cookies, !dev);
	return emptyResponse();
};
