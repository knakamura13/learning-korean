import type { Plugin } from 'vite';
import { activeSystem } from './active.ts';
import { designSystemCss } from './css.ts';
import { applyPaperPlaceholders } from './placeholders.ts';

export const DESIGN_SYSTEM_CSS_ID = 'virtual:design-system.css';

/** Emits the active design system's CSS and stamps paper colours into app.html. */
export function designSystemPlugin(): Plugin {
	const resolved = '\0' + DESIGN_SYSTEM_CSS_ID;
	return {
		name: 'design-system',
		enforce: 'pre',
		resolveId(id) {
			const bare = id.split('?')[0];
			if (bare === DESIGN_SYSTEM_CSS_ID) return resolved;
		},
		load(id) {
			if (id === resolved) return designSystemCss(activeSystem);
		},
		transformIndexHtml: {
			order: 'pre',
			handler(html) {
				return applyPaperPlaceholders(html, activeSystem);
			}
		},
		handleHotUpdate({ file, server }) {
			if (!file.includes('/theme/')) return;
			const mod = server.moduleGraph.getModuleById(resolved);
			if (mod) void server.reloadModule(mod);
		}
	};
}
