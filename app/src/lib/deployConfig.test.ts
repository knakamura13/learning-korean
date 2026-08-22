import { existsSync, readFileSync, readdirSync } from 'node:fs';
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

	it('documents the seven-lab course', () => {
		expect(appReadme).toMatch(/lab01\.\.lab07/);
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

	it('installs production dependencies in the runtime image', () => {
		expect(dockerfile).toMatch(/pnpm install --prod --frozen-lockfile/);
		expect(dockerfile).toMatch(/\/app\/pnpm-lock\.yaml/);
	});
});

describe('csp', () => {
	it('loads theme boot as a same-origin file after %sveltekit.head% injects CSP', () => {
		expect(svelteConfig).toMatch(/csp:\s*\{/);
		expect(svelteConfig).toMatch(/['"]script-src['"]/);
		expect(svelteConfig).toMatch(/unsafe-inline/);
		expect(appHtml).not.toMatch(/%sveltekit\.nonce%/);
		expect(appHtml).not.toMatch(/%%THEME_BOOT%%/);
		expect(appHtml).not.toMatch(/not script-src-hashed/i);

		const kitHead = appHtml.indexOf('%sveltekit.head%');
		const bootSrc = appHtml.search(/theme-boot\.js/);
		expect(kitHead).toBeGreaterThan(-1);
		expect(bootSrc).toBeGreaterThan(kitHead);
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
		expect(ci).toMatch(/pnpm audit --prod --audit-level=high/);
		expect(ci).toMatch(/continue-on-error:\s*true/);
		expect(ci).toMatch(/--coverage/);
		expect(ci).toMatch(/pnpm check/);
		expect(ci).toMatch(/pnpm build/);
		expect(ci).toMatch(/ADAPTER=node pnpm build/);
		expect(ci).toMatch(/permissions:\s*\n\s+contents:\s+read/s);
		expect(ci).toMatch(/actions\/checkout@[0-9a-f]{40}/);
		expect(ci).toMatch(/pnpm\/action-setup@[0-9a-f]{40}/);
		expect(ci).toMatch(/actions\/setup-node@[0-9a-f]{40}/);
	});
});

describe('license, health, and manifests', () => {
	it('declares an SPDX license at the repository root', () => {
		const licensePath = new URL('../../../LICENSE', import.meta.url);
		expect(existsSync(licensePath)).toBe(true);
		expect(readFileSync(licensePath, 'utf8')).toMatch(/MIT License/);
	});

	it('uses a short Railway healthcheck on /healthz', () => {
		const railway = readFileSync(new URL('../../../railway.toml', import.meta.url), 'utf8');
		expect(railway).toMatch(/healthcheckPath\s*=\s*"\/healthz"/);
		expect(railway).toMatch(/healthcheckTimeout\s*=\s*30/);
		expect(svelteConfig).toMatch(/['"]\/healthz['"]/);
	});

	it('does not depend on isomorphic-dompurify', () => {
		expect(packageJson.dependencies).not.toHaveProperty('isomorphic-dompurify');
		expect(packageJson.dependencies).toHaveProperty('dompurify');
	});

	it('does not keep the unused $lib barrel scaffold', () => {
		expect(existsSync(new URL('./index.ts', import.meta.url))).toBe(false);
	});

	it('types Shopify runtime extras via module augmentation, not an unknown cast', () => {
		const runtime = readFileSync(new URL('./components/shopifyRuntime.ts', import.meta.url), 'utf8');
		expect(runtime).not.toMatch(/as unknown as/);
		expect(runtime).toMatch(/from '@shopify\/draggable'/);
		expect(existsSync(new URL('./components/shopify-draggable.d.ts', import.meta.url))).toBe(true);
	});

	it('points app README at the root runbook and guards pnpm start', () => {
		expect(appReadme).not.toMatch(/pnpm start/);
		expect(appReadme).toMatch(/repository README/);
		expect(rootReadme).toMatch(/ADAPTER=node pnpm build/);
		expect(packageJson.scripts.start).toMatch(/scripts\/start\.mjs/);
		const start = readFileSync(new URL('../../scripts/start.mjs', import.meta.url), 'utf8');
		expect(start).toMatch(/ADAPTER=node/);
		expect(start).toMatch(/build\/index\.js/);
	});
});

describe('accounts API deploy contract', () => {
	it('documents the account env vars without baking any into the image', () => {
		for (const name of ['DATABASE_URL', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']) {
			expect(envExample).toContain(name);
			expect(rootReadme).toContain(name);
			expect(dockerfile).not.toContain(name);
		}
	});

	it('talks to Postgres over Railway private networking, never the TCP proxy', () => {
		expect(envExample).toMatch(/railway\.internal/);
		expect(rootReadme).toMatch(/railway\.internal/);
		expect(rootReadme).not.toMatch(/DATABASE_PUBLIC_URL/);
	});

	it('opts every API route out of prerendering', () => {
		const apiDir = new URL('../routes/api/', import.meta.url);
		const entries = readdirSync(apiDir, { recursive: true }) as string[];
		const servers = entries.filter((p) => p.toString().endsWith('+server.ts'));
		expect(servers.length).toBeGreaterThanOrEqual(8);
		for (const rel of servers) {
			const source = readFileSync(new URL(rel.toString(), apiDir), 'utf8');
			expect(source, `${rel} must export prerender = false`).toMatch(
				/export const prerender = false/
			);
		}
	});

	it('runs the Postgres integration suite in CI via a service container', () => {
		const ci = readFileSync(ciPath, 'utf8');
		expect(ci).toMatch(/postgres:16/);
		expect(ci).toMatch(/TEST_DATABASE_URL/);
		expect(ci).toMatch(/pg_isready/);
	});

	it('uses postgres.js and no deprecated auth dependency', () => {
		expect(packageJson.dependencies).toHaveProperty('postgres');
		expect(packageJson.dependencies).not.toHaveProperty('arctic');
		expect(packageJson.dependencies).not.toHaveProperty('@auth/core');
	});
});

