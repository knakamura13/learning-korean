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
	const next = markup.search(/\{:else(?:\s+if)?|\{:else\}|\{\/if\}/);
	const from = markup.indexOf('>', start) + 1;
	return markup.slice(from, next < 0 ? undefined : markup.indexOf('{:', from));
}

describe('ThemeToggle glyphs', () => {
	const css = styleBlock(src);
	const light = branch(src, `pref === 'light'`);
	const dark = branch(src, `pref === 'dark'`);
	const systemStart = src.indexOf('{:else}');
	const system = src.slice(systemStart, src.indexOf('{/if}'));

	it('keeps a 44px hit target and forced-colors styles', () => {
		expect(css).toMatch(/min-width:\s*44px/);
		expect(css).toMatch(/min-height:\s*44px/);
		expect(css).toMatch(/@media\s*\(forced-colors:\s*active\)/);
	});

	it('announces the current theme and the next cycle step', () => {
		expect(src).toMatch(/aria-label=\{label\}/);
		expect(src).toMatch(/title=\{label\}/);
		expect(src).toMatch(/Theme: \$\{themePrefLabel\(pref\)\}\. Next: \$\{themePrefLabel\(nextThemePref\(pref\)\)\}/);
	});

	it('uses a sun for light and a moon for dark', () => {
		expect(light).toMatch(/<circle /);
		expect(light).toMatch(/M12 3v2/);
		expect(dark).toMatch(/A7 7 0 0 1 10\.2 4\.1/);
	});

	it('uses a sun-moon glyph for system, not a monitor', () => {
		expect(system).not.toMatch(/<rect\b/);
		expect(system).not.toMatch(/M8 21h8/);
		expect(system).toMatch(/M12 3v2/);
		expect(system).toMatch(/a4 4 0 1 0 4 4 6 6 0 0 1-4-4z/);
	});
});
