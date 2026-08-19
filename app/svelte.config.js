import adapterNode from '@sveltejs/adapter-node';
import adapterStatic from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// Local `pnpm build` stays a static folder you can serve with anything.
// Railway's Dockerfile sets ADAPTER=node at image build time.
const useNodeAdapter = process.env.ADAPTER === 'node';

/**
 * Static output on purpose, unless we're building the Railway Node server.
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
		adapter: useNodeAdapter
			? adapterNode({ precompress: true })
			: adapterStatic({
					pages: 'build',
					assets: 'build',
					// `index.html` is the prerendered homepage. Using it as the SPA fallback
					// made unknown URLs render Labs instead of +error.svelte. `404.html` is
					// a separate shell so cold loads of missing paths can show the error page.
					fallback: '404.html',
					precompress: false,
					strict: true
				}),
		prerender: { handleHttpError: 'fail' },
		csp: {
			mode: 'auto',
			directives: {
				'default-src': ['self'],
				'script-src': ['self'],
				// Svelte transitions inject a <style> element; hashes cannot cover those.
				'style-src': ['self', 'unsafe-inline'],
				'img-src': ['self', 'data:'],
				'font-src': ['self'],
				'connect-src': ['self'],
				'object-src': ['none'],
				'base-uri': ['self'],
				'frame-ancestors': ['none']
			}
		}
	}
};

export default config;
