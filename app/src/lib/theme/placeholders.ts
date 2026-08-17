import { designSystemCss } from './css.ts';
import type { DesignSystem } from './types.ts';

export const PAPER_PLACEHOLDER_LIGHT = '%%DESIGN_PAPER_LIGHT%%';
export const PAPER_PLACEHOLDER_DARK = '%%DESIGN_PAPER_DARK%%';
export const CSS_PLACEHOLDER = '%%DESIGN_SYSTEM_CSS%%';

/** Stamp design-system values into app.html. The only HTML rewrite path. */
export function applyDesignSystem(html: string, system: DesignSystem): string {
	return html
		.replaceAll(PAPER_PLACEHOLDER_LIGHT, system.light.paper)
		.replaceAll(PAPER_PLACEHOLDER_DARK, system.dark.paper)
		.replaceAll(CSS_PLACEHOLDER, designSystemCss(system));
}
