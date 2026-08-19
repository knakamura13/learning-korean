import { themeBootScript } from './boot.ts';
import { allDesignSystemsCss } from './css.ts';
import type { DesignSystem } from './types.ts';

export const PAPER_PLACEHOLDER_LIGHT = '%%DESIGN_PAPER_LIGHT%%';
export const PAPER_PLACEHOLDER_DARK = '%%DESIGN_PAPER_DARK%%';
export const CSS_PLACEHOLDER = '%%DESIGN_SYSTEM_CSS%%';
export const BOOT_PLACEHOLDER = '%%THEME_BOOT%%';

/** Stamp design-system values into app.html. The only HTML rewrite path. */
export function applyDesignSystem(
	html: string,
	systems: readonly DesignSystem[],
	fallback: DesignSystem
): string {
	const lookPapers = Object.fromEntries(
		systems.map((system) => [system.id, { light: system.light.paper, dark: system.dark.paper }])
	);

	return html
		.replaceAll(PAPER_PLACEHOLDER_LIGHT, fallback.light.paper)
		.replaceAll(PAPER_PLACEHOLDER_DARK, fallback.dark.paper)
		.replaceAll(CSS_PLACEHOLDER, allDesignSystemsCss(systems, fallback.id))
		.replaceAll(BOOT_PLACEHOLDER, themeBootScript(lookPapers));
}
