import { describe, expect, it } from 'vitest';
import hooksSrc from '../../hooks.server.ts?raw';
import { activeSystem } from './active';
import { designSystemCss } from './css';
import { applyPaperPlaceholders, PAPER_PLACEHOLDER_DARK, PAPER_PLACEHOLDER_LIGHT } from './placeholders';

describe('designSystemCss', () => {
	const css = designSystemCss(activeSystem);

	it('emits light tokens, an explicit dark theme, and system dark', () => {
		expect(css).toMatch(/:root\s*\{/);
		expect(css).toMatch(/:root\[data-theme='dark'\]/);
		expect(css).toMatch(/prefers-color-scheme:\s*dark/);
		expect(css).toContain(`--paper: ${activeSystem.light.paper}`);
		expect(css).toContain(`--paper: ${activeSystem.dark.paper}`);
	});

	it('self-hosts Hangul and the active system Latin faces', () => {
		expect(css).toMatch(/font-family: 'Noto Sans KR'/);
		expect(css).toMatch(/font-display:\s*optional/);
		for (const face of activeSystem.fonts) {
			expect(css).toContain(face.file);
		}
	});

	it('exposes a display face token for buttons and eyebrows', () => {
		expect(css).toMatch(/--display:/);
	});
});

describe('applyPaperPlaceholders', () => {
	it('stamps the active paper colours into app.html placeholders', () => {
		const html = `light:${PAPER_PLACEHOLDER_LIGHT} dark:${PAPER_PLACEHOLDER_DARK}`;
		expect(applyPaperPlaceholders(html, activeSystem)).toBe(
			`light:${activeSystem.light.paper} dark:${activeSystem.dark.paper}`
		);
	});
});

describe('activeSystem', () => {
	it('is Academia until a prototype points it elsewhere', () => {
		expect(activeSystem.id).toBe('academia');
	});
});

describe('prerender paper stamp', () => {
	it('is applied by the server handle so static HTML is not left with placeholders', () => {
		expect(hooksSrc).toMatch(/transformPageChunk/);
		expect(hooksSrc).toMatch(/applyPaperPlaceholders/);
	});
});
