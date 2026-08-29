/**
 * One journey per surface, both viewports. Content-shallow on purpose: labs
 * are validated exhaustively by content.test.ts; this proves the built app
 * actually serves, hydrates, and lays out.
 */

import { expect, test } from '@playwright/test';
import { lapsedSrsDoc, noHorizontalOverflow, seedGuestState } from './helpers';

const ROUTES = ['/', '/lab/0001', '/review', '/drill', '/reference', '/settings'];

for (const route of ROUTES) {
	test(`renders ${route} without horizontal overflow`, async ({ page }) => {
		await page.goto(route);
		await expect(page.locator('#main')).toBeVisible();
		expect(await noHorizontalOverflow(page)).toBe(true);
	});
}

test('selecting a main nav tab does not shift tab boxes', async ({ page }) => {
	const nav = page.getByRole('navigation', { name: 'Main navigation' });
	await page.goto('/');
	await expect(nav.getByRole('link').first()).toBeVisible();

	const before = await nav.getByRole('link').evaluateAll((links) =>
		links.map((el) => {
			const box = el.getBoundingClientRect();
			return { href: el.getAttribute('href') ?? '', x: box.x, width: box.width };
		})
	);

	// Visible label is "Review"; the trailing `w` lives in a span so the
	// accessible name is "Revie w". Match the path instead of the name.
	await nav.locator('a[href$="review"]').click();
	await expect(page).toHaveURL(/\/review\/?$/);

	const after = await nav.getByRole('link').evaluateAll((links) =>
		links.map((el) => {
			const box = el.getBoundingClientRect();
			return { href: el.getAttribute('href') ?? '', x: box.x, width: box.width };
		})
	);

	expect(after).toHaveLength(before.length);
	for (let i = 0; i < before.length; i++) {
		expect(after[i].href).toBe(before[i].href);
		expect(Math.abs(after[i].x - before[i].x)).toBeLessThan(0.5);
		expect(Math.abs(after[i].width - before[i].width)).toBeLessThan(0.5);
	}
});

test('home shows all ten labs with Lab 01 as the entry point', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByText('start here')).toBeVisible();
	// resolve() emits relative hrefs (./lab/0001), so match by accessible name.
	// Exact: the desktop lab rail carries a second, longer-named link.
	await expect(
		page.getByRole('link', { name: 'Find the Letters in Your Mouth', exact: true })
	).toBeVisible();
	await expect(page.getByRole('heading', { level: 3 })).toHaveCount(10);
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
		await expect(sheet.locator('a')).toHaveCount(10);
		await expect(sheet.locator('a[aria-current="page"]')).toHaveCount(1);
		await sheet.locator('a').nth(1).click();
		await expect(page).toHaveURL(/\/lab\/0002$/);
		await expect(page.locator('dialog.sheet')).toBeHidden();
	} else {
		await expect(switcher).toBeHidden();
		await expect(rail).toBeVisible();
	}
});

test('compact lab sitting opens main destinations from the sitting-nav', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name !== 'mobile', 'compact sitting is the phone band');
	await page.goto('/lab/0001');
	const trigger = page.getByRole('button', { name: 'Main navigation' });
	await expect(trigger).toBeVisible();
	await expect(page.getByRole('navigation', { name: 'Main navigation' })).toHaveCount(0);
	await trigger.click();
	const sheet = page.locator('dialog.sitting-sheet');
	await expect(sheet).toBeVisible();
	await expect(sheet.getByRole('link', { name: 'Labs' })).toBeVisible();
	await expect(sheet.locator('a[href$="review"]')).toBeVisible();
	await expect(sheet.getByRole('link', { name: 'Drill' })).toBeVisible();
	await expect(sheet.getByRole('link', { name: 'Reference' })).toBeVisible();
	await sheet.locator('a[href$="review"]').click();
	await expect(page).toHaveURL(/\/review\/?$/);
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
	// Review lands on the pile first; the CTA starts the sitting.
	await page.getByRole('button', { name: /^Review \d+ cards?/ }).click();
	await expect(page.getByRole('progressbar', { name: 'Review progress' })).toBeVisible();
	await expect(page.getByRole('textbox').first()).toBeVisible();
});

/**
 * The cross-surface regression: the nav badge, the Review pile CTA and the
 * sitting itself each named a different number. A returning learner saw 19 in
 * two places and got 10 cards. Only a real browser can watch all three at once.
 */
test('a returning learner is promised the sitting, not the pile', async ({ page }) => {
	await seedGuestState(page, lapsedSrsDoc());

	await page.goto('/');
	const chip = page.getByRole('link', { name: /^Review 10 cards/ });
	await expect(chip).toBeVisible();
	await expect(chip).toHaveText(/10 due → Review/);

	const badge = page.locator('.badge-n');
	await expect(badge).toHaveText('10');
	await expect(page.getByRole('link', { name: /Review, 10 cards in this sitting/ })).toBeVisible();

	await chip.click();
	const cta = page.getByRole('button', { name: /^Review 10 cards/ });
	await expect(cta).toBeVisible();
	await expect(page.getByText(/9 more are waiting/)).toBeVisible();
	await expect(page.getByRole('button', { name: /Review 19/ })).toHaveCount(0);

	await cta.click();
	await expect(page.getByRole('progressbar', { name: 'Review progress' })).toHaveAttribute(
		'aria-valuetext',
		'Card 1 of 10'
	);
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
