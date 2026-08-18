import { describe, expect, it } from 'vitest';
import src from './ThemeToggle.svelte?raw';

function styleBlock(markup: string): string {
	const match = markup.match(/<style>([\s\S]*?)<\/style>/);
	if (!match) throw new Error('ThemeToggle.svelte has no style block');
	return match[1];
}

function branch(markup: string, condition: string): string {
	const start = markup.indexOf(condition);
	if (start < 0) throw new Error(`missing ${condition}`);
	const from = markup.indexOf('>', start) + 1;
	const next = markup.indexOf('{:', from);
	const end = markup.indexOf('{/if}', from);
	const cut = next >= 0 && (end < 0 || next < end) ? next : end;
	return markup.slice(from, cut < 0 ? undefined : cut);
}

describe('ThemeToggle glyphs', () => {
	const css = styleBlock(src);
	const sun = branch(src, `glyph === 'sun'`);
	const moon = branch(src, '{:else}');

	it('keeps a 44px hit target, reduced-motion, and forced-colors styles', () => {
		expect(css).toMatch(/min-width:\s*44px/);
		expect(css).toMatch(/min-height:\s*44px/);
		expect(css).toMatch(/\.theme::before\s*\{[^}]*inset:\s*0\.25rem/s);
		expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
		expect(css).toMatch(/@media\s*\(forced-colors:\s*active\)/);
	});

	it('announces the stored pref, system follow-through, and the next cycle step', () => {
		expect(src).toMatch(/aria-label=\{label\}/);
		expect(src).toMatch(/themeToggleLabel\(pref,\s*darkScheme\.current\)/);
		expect(src).not.toMatch(/themePrefLabel\(pref\)/);
	});

	it('defaults to system and paints the resolved sun or moon, not a chimera', () => {
		expect(src).toMatch(/let pref = \$state<ThemePref>\('system'\)/);
		expect(src).toMatch(/themeToggleGlyph\(pref,\s*darkScheme\.current\)/);
		expect(src).toMatch(/prefers-color-scheme:\s*dark/);
		expect(src).not.toMatch(/a4 4 0 1 0 4 4 6 6 0 0 1-4-4z/);
		expect(src).not.toMatch(/\{:else if pref === /);
	});

	it('uses a sun for light and a moon for dark', () => {
		expect(sun).toMatch(/<circle /);
		expect(sun).toMatch(/M12 3v2/);
		expect(moon).toMatch(/A7 7 0 0 1 10\.2 4\.1/);
	});

	it('still cycles through nextThemePref', () => {
		expect(src).toMatch(/setPref\(nextThemePref\(pref\)\)/);
	});

	it('exposes data-pref on the button and a visible Auto mark for system', () => {
		expect(src).toMatch(/data-pref=\{pref\}/);
		const glyphEnd = src.indexOf('{/if}', src.indexOf(`glyph === 'sun'`));
		const systemIf = src.indexOf(`{#if pref === 'system'}`);
		expect(systemIf).toBeGreaterThan(glyphEnd);
		expect(src).toMatch(
			/\{#if pref === 'system'\}[\s\S]*?aria-hidden="true"[\s\S]*?Auto/
		);
		expect(css).toMatch(/flex-direction:\s*column/);
		expect(css).not.toMatch(/\.auto\s*\{[^}]*position:\s*absolute/s);
	});
});
