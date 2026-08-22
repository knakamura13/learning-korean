/** POST /api/auth/logout — drop the server session and the cookie. */

import { dev } from '$app/environment';
import type { RequestHandler } from './$types';
import { emptyResponse } from '$lib/server/http';
import { clearSessionCookie } from '$lib/server/session';

export const prerender = false;

export const POST: RequestHandler = async ({ cookies, locals }) => {
	if (locals.repo && locals.sessionTokenHash) {
		await locals.repo.deleteSession(locals.sessionTokenHash);
	}
	clearSessionCookie(cookies, !dev);
	return emptyResponse();
};
