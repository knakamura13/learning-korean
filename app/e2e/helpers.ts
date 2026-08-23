/**
 * Shared e2e helpers: a guest progress document, and a signed-in session
 * minted straight into Postgres (no Google round-trip — OAuth is not ours to
 * test; everything after the callback is).
 */

import { createHash, randomBytes } from 'node:crypto';
import type { APIRequestContext, BrowserContext, Page } from '@playwright/test';
import postgres from 'postgres';

export const HAS_DB = Boolean(process.env.TEST_DATABASE_URL);

export function sql() {
	if (!process.env.TEST_DATABASE_URL) throw new Error('TEST_DATABASE_URL unset');
	return postgres(process.env.TEST_DATABASE_URL, { max: 2, onnotice: () => {} });
}

/** A minimal, valid v1 SRS document with lab01 unlocked and one seen card. */
export function guestSrsDoc() {
	return {
		version: 1,
		unlocked: ['lab01'],
		openedLabs: [],
		cards: { g: { ease: 2.5, ivl: 3, reps: 2, lapses: 0, due: Date.now() + 86_400_000 } },
		days: {},
		newDate: '',
		newCount: 0,
		newIds: []
	};
}

/**
 * A learner who studied for a month and then vanished: every lab01 card is
 * long overdue. The pile is 19 where a sitting is 10, which is the shape that
 * used to make the badge quote six sittings as one.
 */
export function lapsedSrsDoc() {
	const day = 86_400_000;
	const ids = [
		'c-g', 'c-kk', 'c-n', 'c-d', 'c-tt', 'c-r', 'c-m', 'c-b', 'c-pp', 'c-s',
		'c-ss', 'c-ng0', 'c-j', 'c-jj', 'c-ch', 'c-k', 'c-t', 'c-p', 'c-h'
	];
	const cards: Record<string, unknown> = {};
	ids.forEach((id, i) => {
		cards[id] = { ease: 2.5, ivl: 6, reps: 4, lapses: 0, due: Date.now() - (i + 2) * day };
	});
	return {
		version: 1,
		unlocked: ['lab01'],
		openedLabs: [],
		cards,
		days: {},
		newDate: '',
		newCount: 0,
		newIds: []
	};
}

export async function seedGuestState(page: Page, doc: unknown = guestSrsDoc()): Promise<void> {
	await page.addInitScript((value) => {
		localStorage.setItem('korean-srs-v1', value);
	}, JSON.stringify(doc));
}

/**
 * Ensure the schema exists (the server migrates lazily on first API touch),
 * then mint a user + session row and hand the raw cookie token back.
 */
export async function signIn(
	context: BrowserContext,
	request: APIRequestContext,
	baseURL: string,
	email = `e2e-${Date.now()}@example.com`
): Promise<{ email: string }> {
	await request.get(`${baseURL}/api/me`);

	const token = randomBytes(32).toString('base64url');
	const hash = createHash('sha256').update(token).digest('hex');
	const db = sql();
	try {
		const rows = await db<{ id: number }[]>`
			INSERT INTO users (google_sub, email, name)
			VALUES (${`e2e-${email}`}, ${email}, ${'E2E'})
			ON CONFLICT (google_sub) DO UPDATE SET email = EXCLUDED.email
			RETURNING id
		`;
		await db`
			INSERT INTO sessions (token_hash, user_id, expires_at)
			VALUES (${hash}, ${rows[0].id}, ${new Date(Date.now() + 3_600_000)})
		`;
	} finally {
		await db.end();
	}

	const url = new URL(baseURL);
	await context.addCookies([
		{
			name: 'session',
			value: token,
			domain: url.hostname,
			path: '/',
			httpOnly: true,
			sameSite: 'Lax'
		}
	]);
	return { email };
}

export async function noHorizontalOverflow(page: Page): Promise<boolean> {
	return page.evaluate(
		() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
	);
}
