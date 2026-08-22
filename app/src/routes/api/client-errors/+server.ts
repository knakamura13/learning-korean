/**
 * POST /api/client-errors — browser errors land in the server log, which on
 * Railway is the log viewer. Deliberately no vendor: for a small circle,
 * "did anyone hit an error this week?" is a log search. Always 204 so a
 * broken reporter can never cascade into more client errors.
 */

import type { RequestHandler } from './$types';
import { emptyResponse, readJsonBody } from '$lib/server/http';
import { allowReport } from '$lib/server/rateLimit';

export const prerender = false;

const MAX_REPORT_BYTES = 10_000;

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	let ip = 'unknown';
	try {
		ip = getClientAddress();
	} catch {
		// static/dev contexts may not provide an address; rate-limit as one bucket
	}
	if (!allowReport(ip, Date.now())) return emptyResponse();

	const report = await readJsonBody(request, MAX_REPORT_BYTES);
	if (report !== null) console.error('[client-error]', JSON.stringify(report));
	return emptyResponse();
};
