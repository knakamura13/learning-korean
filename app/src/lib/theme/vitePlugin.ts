import type { Plugin } from 'vite';
import { IMMUTABLE_CACHE_CONTROL, isImmutableStaticAsset } from '../server/assetCache.ts';
import { writeManifests } from './manifest.ts';

function stampFontCache(
	req: { url?: string },
	res: { setHeader: (name: string, value: string) => void },
	next: () => void
): void {
	if (isImmutableStaticAsset(req.url ?? '')) {
		res.setHeader('cache-control', IMMUTABLE_CACHE_CONTROL);
	}
	next();
}

/** Keeps static PWA manifests in lockstep with the active design system. */
export function designSystemPlugin(): Plugin {
	return {
		name: 'design-system',
		buildStart() {
			writeManifests();
		},
		configureServer(server) {
			writeManifests();
			server.middlewares.use(stampFontCache);
		},
		configurePreviewServer(server) {
			server.middlewares.use(stampFontCache);
		},
		handleHotUpdate({ file, server }) {
			if (!file.includes('/theme/')) return;
			writeManifests();
			server.ws.send({ type: 'full-reload' });
		}
	};
}
