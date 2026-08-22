/**
 * /api/state — the account's progress document, revision-checked.
 *
 * The server is a dumb CAS store: GET hands back `{rev, doc}`, PUT lands only
 * when `baseRev` still matches and otherwise answers 409 with the current
 * copy so the *client* can merge (the merge must live client-side anyway —
 * sign-in adoption merges a guest deck that only exists in the browser).
 */

import type { RequestHandler } from './$types';
import { jsonResponse, readJsonBody } from '$lib/server/http';
import { isAccountStateDoc } from '$lib/server/stateDoc';
import { MAX_BACKUP_BYTES } from '$lib/domain/backup';

export const prerender = false;

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.repo) return jsonResponse({ error: 'accounts unavailable' }, 503);
	if (!locals.user) return jsonResponse({ error: 'sign in first' }, 401);
	const state = await locals.repo.getState(locals.user.id);
	if (!state) return jsonResponse({ rev: 0, doc: null });
	return jsonResponse(state);
};

export const PUT: RequestHandler = async ({ locals, request }) => {
	if (!locals.repo) return jsonResponse({ error: 'accounts unavailable' }, 503);
	if (!locals.user) return jsonResponse({ error: 'sign in first' }, 401);

	const body = await readJsonBody(request, MAX_BACKUP_BYTES);
	if (!body || typeof body !== 'object') return jsonResponse({ error: 'bad request' }, 400);
	const { baseRev, doc } = body as { baseRev?: unknown; doc?: unknown };
	if (typeof baseRev !== 'number' || !Number.isInteger(baseRev) || baseRev < 0) {
		return jsonResponse({ error: 'bad request' }, 400);
	}
	if (!isAccountStateDoc(doc)) return jsonResponse({ error: 'not a progress document' }, 400);

	const rev = await locals.repo.putState(locals.user.id, baseRev, doc);
	if (rev !== null) return jsonResponse({ rev });

	const current = await locals.repo.getState(locals.user.id);
	return jsonResponse(current ?? { rev: 0, doc: null }, 409);
};
