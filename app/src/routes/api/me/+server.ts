/**
 * GET /api/me — who am I, and does this deployment even have accounts?
 *
 * Never 401s: `{user: null}` is the signed-out answer, and 503 with the same
 * body is the "no backend here" answer. The client uses this route as its
 * feature-detection probe, so a static deployment (where this file does not
 * exist and the request 404s) degrades to guest mode the same way.
 */

import type { RequestHandler } from './$types';
import { jsonResponse } from '$lib/server/http';

export const prerender = false;

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.repo) return jsonResponse({ user: null }, 503);
	if (!locals.user) return jsonResponse({ user: null });
	return jsonResponse({
		user: { email: locals.user.email, name: locals.user.name },
		prefs: {
			newPerDay: locals.user.newPerDay,
			reviewsPerSitting: locals.user.reviewsPerSitting
		}
	});
};
