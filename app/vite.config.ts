import { sveltekit } from '@sveltejs/kit/vite';
// vitest's defineConfig, not vite's — it is the one that knows about `test`.
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	// Component tests import `mount` from `svelte`. Without the browser
	// condition Vitest resolves the server entry and mount() throws.
	resolve: (globalThis as { process?: { env?: { VITEST?: string } } }).process?.env?.VITEST
		? { conditions: ['browser'] }
		: undefined,
	test: {
		// The domain layer is pure and runs in node; component tests opt into
		// jsdom individually via an environment docblock.
		environment: 'node',
		include: ['src/**/*.{test,spec}.{js,ts}'],
		coverage: {
			provider: 'v8',
			include: ['src/lib/domain/**/*.ts'],
			thresholds: { statements: 90, branches: 85, functions: 90, lines: 90 }
		}
	}
});
