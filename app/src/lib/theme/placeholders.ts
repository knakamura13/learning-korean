import type { DesignSystem } from './types.ts';

export const PAPER_PLACEHOLDER_LIGHT = '%%DESIGN_PAPER_LIGHT%%';
export const PAPER_PLACEHOLDER_DARK = '%%DESIGN_PAPER_DARK%%';

export function applyPaperPlaceholders(html: string, system: DesignSystem): string {
	return html
		.replaceAll(PAPER_PLACEHOLDER_LIGHT, system.light.paper)
		.replaceAll(PAPER_PLACEHOLDER_DARK, system.dark.paper);
}
