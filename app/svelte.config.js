import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/**
 * Static output on purpose.
 *
 * The old app's best property was that it was just a folder: no server, works
 * offline, opens in five years. adapter-static keeps that — `pnpm build`
 * produces a directory you can serve with anything, including
 * `python3 -m http.server`. Nothing here needs a backend.
 *
 * @type {import('@sveltejs/kit').Config}
 */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			// All routes are prerendered (`prerender = true` + lab `entries()`).
			// `index.html` as fallback collided with the homepage and sent unknown
			// URLs to Labs. `404.html` is the SPA shell for cold loads of unknown
			// paths (so +error.svelte can render) without replacing the home page.
			fallback: '404.html',
			precompress: false,
			strict: true
		}),
		prerender: { handleHttpError: 'fail' }
	}
};

export default config;
