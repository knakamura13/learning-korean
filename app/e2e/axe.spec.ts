/**
 * axe scan per route. Gate: zero serious or critical violations. The
 * polish.test.ts source contracts pin tokens and structure; this catches
 * what only a rendered accessibility tree can show.
 */

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const ROUTES = ['/', '/lab/0001', '/review', '/drill', '/reference', '/settings'];

for (const route of ROUTES) {
	test(`axe: ${route}`, async ({ page }) => {
		await page.goto(route);
		await page.locator('#main').waitFor();
		// Scan the hydrated, settled page: not the loading skeleton, and not
		// mid-fade — axe reads opacity-blended colors as contrast failures.
		await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'));
		await page.evaluate(() =>
			Promise.all(
				document
					.getAnimations()
					.filter((a) => {
						const timing = a.effect?.getTiming();
						return timing ? timing.iterations !== Infinity : true;
					})
					.map((a) => a.finished.catch(() => undefined))
			)
		);
		const results = await new AxeBuilder({ page }).analyze();
		const blocking = results.violations.filter(
			(v) => v.impact === 'serious' || v.impact === 'critical'
		);
		expect(
			blocking.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }))
		).toEqual([]);
	});
}
