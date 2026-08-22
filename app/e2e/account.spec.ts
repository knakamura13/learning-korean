/**
 * Signed-in flows against a real database, no Google round-trip: the session
 * row is minted directly (everything after the OAuth callback is ours to
 * test). Skipped without TEST_DATABASE_URL — a guest deployment has no
 * account surface, and smoke.spec covers that world.
 */

import { expect, test } from '@playwright/test';
import { HAS_DB, guestSrsDoc, seedGuestState, signIn, sql } from './helpers';

test.skip(!HAS_DB, 'TEST_DATABASE_URL unset — account API disabled');

test('settings hides the account section only when accounts are unavailable', async ({ page }) => {
	// With the DB up, a guest sees a real sign-in offer.
	await page.goto('/settings');
	await expect(page.getByRole('link', { name: 'Sign in with Google' })).toBeVisible();
});

test('first sign-in adopts the guest deck as the account copy', async ({
	page,
	context,
	request,
	baseURL
}) => {
	await signIn(context, request, baseURL!);
	await seedGuestState(page);

	const adopted = page.waitForResponse(
		(res) => res.url().endsWith('/api/state') && res.request().method() === 'PUT' && res.ok()
	);
	await page.goto('/');
	await adopted;

	const state = await page.request.get(`${baseURL}/api/state`);
	const body = await state.json();
	expect(body.rev).toBeGreaterThanOrEqual(1);
	expect(body.doc.kind).toBe('korean-progress');
	expect(body.doc.srs.unlocked).toContain('lab01');
});

test('a newer server copy merges into local state on load', async ({
	page,
	context,
	request,
	baseURL
}) => {
	const { email } = await signIn(context, request, baseURL!);
	await seedGuestState(page);

	const adopted = page.waitForResponse(
		(res) => res.url().endsWith('/api/state') && res.request().method() === 'PUT' && res.ok()
	);
	await page.goto('/');
	await adopted;

	// Another device unlocked lab02: rewrite the account copy server-side.
	const db = sql();
	try {
		const rows = await db<{ user_id: number; rev: number; doc: unknown }[]>`
			SELECT s.user_id, a.rev, a.doc FROM users u
			JOIN sessions s ON s.user_id = u.id
			JOIN account_state a ON a.user_id = u.id
			WHERE u.email = ${email}
		`;
		const doc = rows[0].doc as { srs: ReturnType<typeof guestSrsDoc> };
		doc.srs.unlocked = [...doc.srs.unlocked, 'lab02'];
		await db`
			UPDATE account_state SET rev = rev + 1, doc = ${db.json(doc as never)}
			WHERE user_id = ${rows[0].user_id}
		`;
	} finally {
		await db.end();
	}

	await page.goto('/');
	await expect
		.poll(async () =>
			page.evaluate(() => JSON.parse(localStorage.getItem('korean-srs-v1') ?? '{}').unlocked)
		)
		.toContain('lab02');
});

test('study prefs save to the account and survive a reload', async ({
	page,
	context,
	request,
	baseURL
}) => {
	const { email } = await signIn(context, request, baseURL!);
	await page.goto('/settings');
	await expect(page.getByText(email)).toBeVisible();

	const newPerDay = page.getByLabel('New cards per day');
	await newPerDay.fill('3');
	await page.getByRole('button', { name: 'Save study pace' }).click();
	await expect(page.getByText('Study pace saved to your account.')).toBeVisible();

	await page.reload();
	await expect(page.getByLabel('New cards per day')).toHaveValue('3');
});

test('sign out returns to a guest with local progress intact', async ({
	page,
	context,
	request,
	baseURL
}) => {
	await signIn(context, request, baseURL!);
	await seedGuestState(page);
	await page.goto('/settings');
	await page.getByRole('button', { name: 'Sign out' }).click();
	await expect(page.getByRole('link', { name: 'Sign in with Google' })).toBeVisible();
	const unlocked = await page.evaluate(
		() => JSON.parse(localStorage.getItem('korean-srs-v1') ?? '{}').unlocked
	);
	expect(unlocked).toContain('lab01');
});
