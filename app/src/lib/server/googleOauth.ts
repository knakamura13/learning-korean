/**
 * googleOauth.ts — the authorization-code + PKCE flow, hand-rolled.
 *
 * A library was considered and rejected: the maintained candidates are
 * frameworks this app does not want, and the small ones are unmaintained
 * (arctic is published as "no longer supported"). The flow itself is two
 * URLs and one fetch. The id_token arrives directly from Google's token
 * endpoint over TLS, authenticated by the client secret, so its payload is
 * trusted without local signature verification (per OIDC Core §3.1.3.7).
 */

import { createHash, randomBytes } from 'node:crypto';

const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

export interface GoogleIdentity {
	sub: string;
	email: string;
	name: string | null;
}

export function randomToken(): string {
	return randomBytes(32).toString('base64url');
}

/** S256 code challenge for a PKCE verifier. */
export function pkceChallenge(verifier: string): string {
	return createHash('sha256').update(verifier).digest('base64url');
}

export function googleAuthorizeUrl(opts: {
	clientId: string;
	redirectUri: string;
	state: string;
	codeVerifier: string;
}): string {
	const url = new URL(AUTHORIZE_URL);
	url.searchParams.set('client_id', opts.clientId);
	url.searchParams.set('redirect_uri', opts.redirectUri);
	url.searchParams.set('response_type', 'code');
	url.searchParams.set('scope', 'openid email profile');
	url.searchParams.set('state', opts.state);
	url.searchParams.set('code_challenge', pkceChallenge(opts.codeVerifier));
	url.searchParams.set('code_challenge_method', 'S256');
	return url.toString();
}

/** Base64url JWT payload decode — no verification, see module comment. */
export function decodeIdToken(idToken: string): GoogleIdentity | null {
	const parts = idToken.split('.');
	if (parts.length !== 3) return null;
	try {
		const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as Record<
			string,
			unknown
		>;
		if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') return null;
		return {
			sub: payload.sub,
			email: payload.email,
			name: typeof payload.name === 'string' ? payload.name : null
		};
	} catch {
		return null;
	}
}

export async function exchangeGoogleCode(opts: {
	code: string;
	codeVerifier: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	fetchFn?: typeof fetch;
}): Promise<GoogleIdentity | null> {
	const fetchFn = opts.fetchFn ?? fetch;
	try {
		const res = await fetchFn(TOKEN_URL, {
			method: 'POST',
			headers: { 'content-type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				grant_type: 'authorization_code',
				code: opts.code,
				code_verifier: opts.codeVerifier,
				client_id: opts.clientId,
				client_secret: opts.clientSecret,
				redirect_uri: opts.redirectUri
			})
		});
		if (!res.ok) return null;
		const body = (await res.json()) as { id_token?: unknown };
		if (typeof body.id_token !== 'string') return null;
		return decodeIdToken(body.id_token);
	} catch {
		return null;
	}
}
