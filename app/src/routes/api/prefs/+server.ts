/** PUT /api/prefs — study pacing, per account. Ranges mirror the DB checks. */

import type { RequestHandler } from './$types';
import { jsonResponse, readJsonBody } from '$lib/server/http';

export const prerender = false;

export const PUT: RequestHandler = async ({ locals, request }) => {
	if (!locals.repo) return jsonResponse({ error: 'accounts unavailable' }, 503);
	if (!locals.user) return jsonResponse({ error: 'sign in first' }, 401);

	const body = await readJsonBody(request, 1000);
	if (!body || typeof body !== 'object') return jsonResponse({ error: 'bad request' }, 400);
	const { newPerDay, reviewsPerSitting } = body as {
		newPerDay?: unknown;
		reviewsPerSitting?: unknown;
	};
	const validNew =
		typeof newPerDay === 'number' && Number.isInteger(newPerDay) && newPerDay >= 0 && newPerDay <= 50;
	const validSitting =
		typeof reviewsPerSitting === 'number' &&
		Number.isInteger(reviewsPerSitting) &&
		reviewsPerSitting >= 1 &&
		reviewsPerSitting <= 100;
	if (!validNew || !validSitting) return jsonResponse({ error: 'out of range' }, 400);

	const user = await locals.repo.setPrefs(locals.user.id, newPerDay, reviewsPerSitting);
	if (!user) return jsonResponse({ error: 'sign in first' }, 401);
	return jsonResponse({
		prefs: { newPerDay: user.newPerDay, reviewsPerSitting: user.reviewsPerSitting }
	});
};
