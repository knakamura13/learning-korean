import type { Plugin } from 'vite';
import { writeManifests } from './manifest.ts';

/** Keeps static PWA manifests in lockstep with the active design system. */
export function designSystemPlugin(): Plugin {
	return {
		name: 'design-system',
		buildStart() {
			writeManifests();
		},
		configureServer() {
			writeManifests();
		},
		handleHotUpdate({ file, server }) {
			if (!file.includes('/theme/')) return;
			writeManifests();
			server.ws.send({ type: 'full-reload' });
		}
	};
}
