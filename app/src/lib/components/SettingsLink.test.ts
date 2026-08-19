import { describe, expect, it } from 'vitest';
import src from './SettingsLink.svelte?raw';
import layout from '../../routes/+layout.svelte?raw';

function styleBlock(markup: string): string {
	const match = markup.match(/<style>([\s\S]*?)<\/style>/);
	if (!match) throw new Error('SettingsLink.svelte has no style block');
	return match[1];
}

describe('SettingsLink', () => {
	const css = styleBlock(src);

	it('keeps a 44px hit target with ThemeToggle chrome (renamed .settings)', () => {
		expect(css).toMatch(/min-width:\s*44px/);
		expect(css).toMatch(/min-height:\s*44px/);
		expect(css).toMatch(/\.settings::before\s*\{[^}]*inset:\s*0\.25rem/s);
		expect(css).toMatch(/\.settings:active\s*\{/);
		expect(css).toMatch(/\.settings:focus-visible/);
		expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
		expect(css).toMatch(/@media\s*\(forced-colors:\s*active\)/);
	});

	it('is a Settings link with person silhouette, not a gear', () => {
		expect(src).toMatch(/aria-label="Settings"/);
		expect(src).toMatch(/title="Settings"/);
		expect(src).toMatch(/href=\{resolve\('\/settings'\)\}/);
		expect(src).toMatch(/class="settings"/);
		expect(src).toMatch(/viewBox="0 0 24 24"/);
		expect(src).toMatch(/aria-hidden="true"/);
		expect(src).toMatch(/stroke="currentColor"/);
		expect(src).toMatch(/stroke-width="2"/);
		expect(src).toMatch(/<circle /);
		expect(src).toMatch(/<path[\s\S]*d=/);
		expect(src).not.toMatch(/gear/i);
		expect(src).not.toMatch(/M12 15a3 3/);
		expect(src).not.toMatch(/cog/i);
	});

	it('sets aria-current when pathname is /settings or /settings/', () => {
		expect(src).toMatch(
			/page\.url\.pathname === '\/settings' \|\| page\.url\.pathname === '\/settings\/'/
		);
		expect(src).toMatch(/aria-current=\{onSettings \? 'page' : undefined\}/);
	});
});

describe('layout Settings entry', () => {
	it('mounts SettingsLink outside main nav and drops ThemeToggle', () => {
		expect(layout).toMatch(/SettingsLink/);
		expect(layout).not.toMatch(/ThemeToggle/);
		expect(layout).toMatch(/<\/nav>\s*<SettingsLink/);
		expect(layout).toMatch(/label: 'Labs'/);
		expect(layout).toMatch(/label: 'Review'/);
		expect(layout).toMatch(/label: 'Reference'/);
		expect(layout).not.toMatch(/label: 'Settings'/);
	});
});
