/**
 * Svelte in:/out: compile to WAAPI. CSS prefers-reduced-motion cannot
 * collapse them — motion() must. Intercept element.animate to prove it.
 *
 * When duration is 0, Svelte short-circuits before calling animate (see
 * transitions.js `if (!options?.duration && !options?.delay)`). So "no
 * long WAAPI durations" under reduce is the success signal.
 */

import { expect, test } from '@playwright/test';
import { lapsedSrsDoc, seedGuestState } from './helpers';

async function collectWaapiDurations(page: import('@playwright/test').Page) {
	await page.addInitScript(() => {
		const log: number[] = [];
		(window as unknown as { __waapiDurations: number[] }).__waapiDurations = log;
		const orig = Element.prototype.animate;
		Element.prototype.animate = function (this: Element, ...args: Parameters<typeof orig>) {
			const opts = args[1];
			const duration =
				typeof opts === 'number'
					? opts
					: opts && typeof opts === 'object' && 'duration' in opts
						? Number(opts.duration)
						: NaN;
			if (Number.isFinite(duration)) log.push(duration);
			return orig.apply(this, args);
		};
	});
}

async function runReviewVerdict(page: import('@playwright/test').Page) {
	await seedGuestState(page, lapsedSrsDoc());
	await page.goto('/review');
	await page.getByRole('button', { name: /^Review 10 cards/ }).click();
	await page.locator('.card.review').waitFor();
	const answer = page.locator('#review-answer');
	if (await answer.isVisible()) {
		await answer.fill('g');
		await page.getByRole('button', { name: 'Check' }).click();
		await page.locator('.fb').waitFor();
	}
	return page.evaluate(
		() => (window as unknown as { __waapiDurations: number[] }).__waapiDurations
	);
}

test.describe('prefers-reduced-motion and Svelte transitions', () => {
	test('zeros WAAPI transition durations on review when reduce is set', async ({ page }) => {
		await collectWaapiDurations(page);
		await page.emulateMedia({ reducedMotion: 'reduce' });
		expect(
			await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
		).toBe(true);

		const durations = await runReviewVerdict(page);
		// motion() → duration 0 → Svelte skips element.animate for the intro.
		// Any leftover CSSTransition WAAPI should already be collapsed by CSS.
		expect(durations.every((d) => d < 1), JSON.stringify(durations)).toBe(true);
	});

	test('still runs timed WAAPI transitions when motion is preferred', async ({ page }) => {
		await collectWaapiDurations(page);
		await page.emulateMedia({ reducedMotion: 'no-preference' });

		const durations = await runReviewVerdict(page);
		expect(Math.max(0, ...durations), JSON.stringify(durations)).toBeGreaterThanOrEqual(150);
	});
});
