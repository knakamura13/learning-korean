/**
 * E2E smoke + accessibility scans against the real built app.
 *
 * The webServer is the adapter-node build (`ADAPTER=node pnpm build` first).
 * DATABASE_URL is passed through when TEST_DATABASE_URL is set (CI's service
 * container), which turns the account API on; without it the same suite runs
 * and the account specs skip — mirroring a guest deployment.
 */

import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const ORIGIN = `http://localhost:${PORT}`;

export default defineConfig({
	testDir: './e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? 'line' : 'list',
	// Mobile emulation hydrates slowly on a cold parallel run; 5s flakes.
	expect: { timeout: 10_000 },
	use: {
		baseURL: ORIGIN,
		trace: 'retain-on-failure'
	},
	projects: [
		{ name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
		{ name: 'mobile', use: { ...devices['Pixel 7'] } }
	],
	webServer: {
		command: 'node build/index.js',
		url: `${ORIGIN}/healthz`,
		reuseExistingServer: !process.env.CI,
		env: {
			PORT: String(PORT),
			ORIGIN,
			...(process.env.TEST_DATABASE_URL ? { DATABASE_URL: process.env.TEST_DATABASE_URL } : {})
		}
	}
});
