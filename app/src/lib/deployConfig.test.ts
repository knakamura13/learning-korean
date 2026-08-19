import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import packageJson from '../../package.json';
import svelteConfig from '../../svelte.config.js?raw';
import viteConfig from '../../vite.config.ts?raw';
import envExample from '../../.env.example?raw';
import appHtml from '../app.html?raw';
import appReadme from '../../README.md?raw';

const rootReadme = readFileSync(new URL('../../../README.md', import.meta.url), 'utf8');
const dockerfile = readFileSync(new URL('../../../Dockerfile', import.meta.url), 'utf8');
const ciPath = new URL('../../../.github/workflows/ci.yml', import.meta.url);

describe('adapter and runtime env', () => {
	it('selects the Node adapter only when ADAPTER=node', () => {
		expect(svelteConfig).toMatch(/process\.env\.ADAPTER === 'node'/);
		expect(svelteConfig).not.toMatch(/RAILWAY_ENVIRONMENT/);
		expect(appReadme).not.toMatch(/RAILWAY_ENVIRONMENT/);
	});

	it('does not depend on adapter-auto', () => {
		expect(packageJson.devDependencies).not.toHaveProperty('@sveltejs/adapter-auto');
	});

	it('pins svelte, kit, and vite to exact versions', () => {
		expect(packageJson.devDependencies.svelte).toMatch(/^\d/);
		expect(packageJson.devDependencies['@sveltejs/kit']).toMatch(/^\d/);
		expect(packageJson.devDependencies.vite).toMatch(/^\d/);
		expect(packageJson.devDependencies.svelte).not.toMatch(/^[~^]/);
		expect(packageJson.devDependencies['@sveltejs/kit']).not.toMatch(/^[~^]/);
		expect(packageJson.devDependencies.vite).not.toMatch(/^[~^]/);
	});

	it('documents ADAPTER, ORIGIN, PORT, and proxy headers', () => {
		for (const name of ['ADAPTER', 'ORIGIN', 'PORT', 'PROTOCOL_HEADER', 'HOST_HEADER', 'PUBLIC_SITE_URL']) {
			expect(envExample).toContain(name);
			expect(rootReadme).toContain(name);
		}
	});

	it('does not bake a public origin into the image', () => {
		expect(dockerfile).not.toMatch(/ENV ORIGIN=/);
		expect(dockerfile).toMatch(/ENV PROTOCOL_HEADER=/);
		expect(dockerfile).toMatch(/ENV HOST_HEADER=/);
	});
});

describe('csp', () => {
	it('declares a CSP; theme boot script runs before %sveltekit.head% injects CSP', () => {
		expect(svelteConfig).toMatch(/csp:\s*\{/);
		expect(svelteConfig).toMatch(/['"]script-src['"]/);
		expect(svelteConfig).toMatch(/unsafe-inline/);
		expect(appHtml).toMatch(/<script>/);
		expect(appHtml).not.toMatch(/%sveltekit\.nonce%/);

		const bootScript = appHtml.search(/<script>\s*%%THEME_BOOT%%/);
		const kitHead = appHtml.indexOf('%sveltekit.head%');
		expect(bootScript).toBeGreaterThan(-1);
		expect(kitHead).toBeGreaterThan(bootScript);
		expect(appHtml).toMatch(/not script-src-hashed/i);
		expect(appHtml).not.toMatch(/Prerender hashes this inline script/i);
	});
});

describe('coverage and CI', () => {
	it('gates coverage on domain and store modules', () => {
		expect(viteConfig).toMatch(/src\/lib\/domain\/\*\*\/\*\.ts/);
		expect(viteConfig).toMatch(/src\/lib\/stores\/\*\*/);
	});

	it('runs install, tests with coverage, check, and both builds on GitHub Actions', () => {
		expect(existsSync(ciPath)).toBe(true);
		const ci = readFileSync(ciPath, 'utf8');
		expect(ci).toMatch(/working-directory:\s*app/);
		expect(ci).toMatch(/pnpm install --frozen-lockfile/);
		expect(ci).toMatch(/pnpm audit/);
		expect(ci).toMatch(/--coverage/);
		expect(ci).toMatch(/pnpm check/);
		expect(ci).toMatch(/pnpm build/);
		expect(ci).toMatch(/ADAPTER=node pnpm build/);
	});
});
