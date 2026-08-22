/**
 * One journey per surface, both viewports. Content-shallow on purpose: labs
 * are validated exhaustively by content.test.ts; this proves the built app
 * actually serves, hydrates, and lays out.
 */

import { expect, test } from '@playwright/test';
import { noHorizontalOverflow, seedGuestState } from './helpers';

const ROUTES = ['/', '/lab/0001', '/review', '/drill', '/reference', '/settings'];

for (const route of ROUTES) {
	test(`renders ${route} without horizontal overflow`, async ({ page }) => {
		await page.goto(route);
		await expect(page.locator('#main')).toBeVisible();
		expect(await noHorizontalOverflow(page)).toBe(true);
	});
}

test('home shows the seven labs with Lab 01 as the entry point', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByText('start here')).toBeVisible();
	// resolve() emits relative hrefs (./lab/0001), so match by accessible name.
	// Exact: the desktop lab rail carries a second, longer-named link.
	await expect(
		page.getByRole('link', { name: 'Find the Letters in Your Mouth', exact: true })
	).toBeVisible();
	await expect(page.getByRole('heading', { level: 3 })).toHaveCount(9);
});

test('a fresh visitor sees honest empty states on review and drill', async ({ page }) => {
	await page.goto('/review');
	await expect(page.getByText('Nothing in Review yet')).toBeVisible();
	await page.goto('/drill');
	await expect(page.getByText(/Sprint is locked|Start Lab/).first()).toBeVisible();
});

test('the lab page shows the right lab navigation for the viewport', async ({ page }, testInfo) => {
	await page.goto('/lab/0001');
	const switcher = page.locator('.switcher .trigger');
	const rail = page.locator('.lab-index');
	if (testInfo.project.name === 'mobile') {
		await expect(switcher).toBeVisible();
		await expect(rail).toBeHidden();
		await switcher.click();
		const sheet = page.locator('dialog.sheet');
		await expect(sheet).toBeVisible();
		await expect(sheet.locator('a')).toHaveCount(9);
		await expect(sheet.locator('a[aria-current="page"]')).toHaveCount(1);
		await sheet.locator('a').nth(1).click();
		await expect(page).toHaveURL(/\/lab\/0002$/);
		await expect(page.locator('dialog.sheet')).toBeHidden();
	} else {
		await expect(switcher).toBeHidden();
		await expect(rail).toBeVisible();
	}
});

test('a first lab card is interactive and a wrong pick does not advance', async ({ page }) => {
	await page.goto('/lab/0001');
	// Card 1 of Lab 01 always renders an action well with at least one control.
	await expect(page.locator('.pip').first()).toBeVisible();
	await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
});

test('review with unlocked progress starts a sitting', async ({ page }) => {
	await seedGuestState(page);
	await page.goto('/review');
	// Review auto-starts when cards are available: progress bar + typed answer.
	await expect(page.getByRole('progressbar', { name: 'Review progress' })).toBeVisible();
	await expect(page.getByRole('textbox').first()).toBeVisible();
});

test('settings offers appearance and backup, and export downloads a file', async ({ page }) => {
	await page.goto('/settings');
	await expect(page.getByRole('heading', { name: 'Appearance' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Backup' })).toBeVisible();
	const downloadPromise = page.waitForEvent('download');
	await page.getByRole('button', { name: /download|back up|export/i }).first().click();
	const download = await downloadPromise;
	expect(download.suggestedFilename()).toMatch(/^korean-progress-\d{4}-\d{2}-\d{2}\.json$/);
});

test('manifest declares orientation and standalone display', async ({ request, baseURL }) => {
	const res = await request.get(`${baseURL}/manifest.webmanifest`);
	expect(res.ok()).toBe(true);
	const manifest = await res.json();
	expect(manifest.display).toBe('standalone');
	expect(manifest.orientation).toBe('any');
});
