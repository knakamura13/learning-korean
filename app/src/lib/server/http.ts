/**
 * http.ts — tiny response/request helpers shared by the API routes.
 * Account data must never be cached by an intermediary, hence no-store on
 * every JSON response.
 */

/**
 * Cross-origin write protection for the API. SameSite=Lax already keeps the
 * session cookie off cross-site fetches; this rejects anything that still
 * arrives with a foreign Origin header. adapter-node derives the URL origin
 * from the proxy headers the Dockerfile sets.
 */
export function apiOriginAllowed(
	method: string,
	origin: string | null,
	urlOrigin: string
): boolean {
	if (method === 'GET' || method === 'HEAD') return true;
	return origin === urlOrigin;
}

export function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
	});
}

export function emptyResponse(status = 204): Response {
	return new Response(null, { status, headers: { 'cache-control': 'no-store' } });
}

/**
 * Parse a JSON request body, enforcing content type and a size ceiling.
 * Returns null on any violation — routes answer 400 and move on.
 */
export async function readJsonBody(request: Request, maxBytes: number): Promise<unknown | null> {
	const type = request.headers.get('content-type') ?? '';
	if (!type.startsWith('application/json')) return null;
	const length = Number(request.headers.get('content-length') ?? '0');
	if (!Number.isFinite(length) || length > maxBytes) return null;
	try {
		const text = await request.text();
		if (text.length > maxBytes) return null;
		return JSON.parse(text) as unknown;
	} catch {
		return null;
	}
}
