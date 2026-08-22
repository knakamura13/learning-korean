/**
 * session.ts — opaque session tokens and their cookie.
 *
 * The cookie carries 32 random bytes; the database stores only the SHA-256 of
 * them, so a leaked table cannot mint sessions. Nothing stateful lives in the
 * cookie, which is why no signing secret exists anywhere in this app.
 */

import { createHash, randomBytes } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';

export const SESSION_COOKIE = 'session';
export const SESSION_TTL_MS = 30 * 86_400_000;
/** Sliding renewal: extend when less than this much lifetime remains. */
export const SESSION_EXTEND_BELOW_MS = 15 * 86_400_000;

export function newSessionToken(): { token: string; hash: string } {
	const token = randomBytes(32).toString('base64url');
	return { token, hash: hashSessionToken(token) };
}

export function hashSessionToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

export function setSessionCookie(cookies: Cookies, token: string, secure: boolean): void {
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		secure,
		sameSite: 'lax',
		maxAge: SESSION_TTL_MS / 1000
	});
}

export function clearSessionCookie(cookies: Cookies, secure: boolean): void {
	cookies.delete(SESSION_COOKIE, { path: '/', httpOnly: true, secure, sameSite: 'lax' });
}
