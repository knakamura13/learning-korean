/**
 * GET /api/auth/google — start the sign-in hop. State and the PKCE verifier
 * ride in short-lived httpOnly cookies; the callback consumes both.
 */

import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { googleAuthorizeUrl, randomToken } from '$lib/server/googleOauth';

export const prerender = false;

const TEN_MINUTES = 600;

export const GET: RequestHandler = async ({ cookies, url }) => {
	if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
		redirect(302, '/settings?auth=failed');
	}

	const state = randomToken();
	const codeVerifier = randomToken();
	const opts = {
		path: '/',
		httpOnly: true,
		secure: !dev,
		sameSite: 'lax',
		maxAge: TEN_MINUTES
	} as const;
	cookies.set('oauth_state', state, opts);
	cookies.set('oauth_verifier', codeVerifier, opts);

	redirect(
		302,
		googleAuthorizeUrl({
			clientId: env.GOOGLE_CLIENT_ID,
			redirectUri: `${url.origin}/api/auth/google/callback`,
			state,
			codeVerifier
		})
	);
};
