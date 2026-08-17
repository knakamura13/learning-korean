import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import labRunner from './components/LabRunner.svelte?raw';
import progressBackup from './components/ProgressBackup.svelte?raw';
import consonantClip from './components/ConsonantClip.svelte?raw';
import vowelStep from './components/steps/VowelStep.svelte?raw';
import options from './components/Options.svelte?raw';
import themeToggle from './components/ThemeToggle.svelte?raw';
import viteConfig from '../../vite.config.ts?raw';
import layout from '../routes/+layout.svelte?raw';
import home from '../routes/+page.svelte?raw';
import review from '../routes/review/+page.svelte?raw';
import reference from '../routes/reference/+page.svelte?raw';
import errorPage from '../routes/+error.svelte?raw';
import appHtml from '../app.html?raw';
import manifest from '../../static/manifest.webmanifest?raw';
import { activeSystem } from './theme/active';
import { contrastRatio } from './theme/contrast';
import { designSystemCss } from './theme/css';
import { applyDesignSystem } from './theme/placeholders';

const appCss = readFileSync(new URL('../app.css', import.meta.url), 'utf8');
const systemCss = designSystemCss(activeSystem);

function styleBlock(markup: string): string {
	const match = markup.match(/<style>([\s\S]*?)<\/style>/);
	if (!match) throw new Error('no style block');
	return match[1];
}

function physicalBoxProps(src: string): string[] {
	return src.match(/(?:margin|padding|border)-(?:left|right)\s*:/g) ?? [];
}

function physicalLeftRight(src: string): string[] {
	return src.match(/(?:^|[^\w-])(?:left|right)\s*:/gm) ?? [];
}

describe('polish audit regressions', () => {
	it('requires confirmation before clearing a completed lab session', () => {
		expect(labRunner).toMatch(/let confirmingRestart = \$state\(false\)/);
		expect(labRunner).toMatch(/function requestRestart\(\)[\s\S]*confirmingRestart = true/);
		expect(labRunner).toMatch(/onclick=\{requestRestart\}/);
		expect(labRunner).toMatch(/Start over\? Your completed lab summary will be cleared\./);
		expect(labRunner).toMatch(/onclick=\{confirmRestart\}/);
	});

	it('opens restore and restart confirmations as native modal dialogs', () => {
		expect(progressBackup).toMatch(/<dialog\b[^>]*class="confirm"/);
		expect(progressBackup).toMatch(/showModal\s*\(/);
		expect(labRunner).toMatch(/<dialog\b[^>]*class="restart-confirm"/);
		expect(labRunner).toMatch(/showModal\s*\(/);
	});

	it('gives the theme control pressed-state feedback', () => {
		expect(themeToggle).toMatch(/\.theme:active\s*\{/);
	});

	it('gives remaining interactive chrome a pressed state', () => {
		expect(styleBlock(consonantClip)).toMatch(/\.play:active\s*\{/);
		expect(styleBlock(vowelStep)).toMatch(/\.stamp:active:not\(:disabled\)\s*\{/);
		expect(styleBlock(labRunner)).toMatch(/button\.pip:not\(\[data-selected\]\):active\s*\{/);
		expect(styleBlock(layout)).toMatch(/nav a:active\s*\{/);
		expect(styleBlock(review)).toMatch(/\.backup-card summary:active\s*\{/);
	});

	it('uses logical properties in shared directional layout', () => {
		expect(appCss).not.toMatch(/\bmargin-left\s*:/);
		expect(labRunner).not.toMatch(/\bleft\s*:\s*0/);
		const chrome = [appCss, labRunner, progressBackup, layout, home, review, reference, options, errorPage];
		for (const src of chrome) {
			expect(physicalBoxProps(src)).toEqual([]);
			expect(src).not.toMatch(/text-align:\s*(?:left|right)/);
		}
		expect(physicalLeftRight(styleBlock(layout))).toEqual([]);
		expect(physicalLeftRight(styleBlock(labRunner))).toEqual([]);
		expect(physicalLeftRight(styleBlock(progressBackup))).toEqual([]);
		expect(physicalLeftRight(styleBlock(home))).toEqual([]);
		expect(physicalLeftRight(styleBlock(review))).toEqual([]);
		expect(physicalLeftRight(styleBlock(reference))).toEqual([]);
		expect(physicalLeftRight(styleBlock(errorPage))).toEqual([]);
	});

	it('prevents a late Hangul font swap from causing layout shift', () => {
		expect(systemCss).toMatch(/font-family: 'Noto Sans KR'/);
		expect(systemCss).toMatch(/font-display:\s*optional/);
	});

	it('loads tokens from the active design system rather than hard-coding a palette', () => {
		expect(appHtml).toContain('%%DESIGN_SYSTEM_CSS%%');
		expect(layout).toMatch(/activeSystem\.fonts/);
		expect(layout).not.toMatch(/virtual:design-system/);
		expect(appCss).not.toMatch(/--paper:\s*#/);
		expect(appCss).toMatch(/--s1:/);
		expect(appCss).toMatch(/font-size:\s*var\(--html-size\)/);
		expect(appCss).toMatch(/line-height:\s*var\(--leading\)/);
		expect(viteConfig).toMatch(/designSystemPlugin/);
	});

	it('makes the Baseline Widely Available browser target explicit', () => {
		expect(viteConfig).toMatch(/build:\s*\{[\s\S]*?target:\s*'baseline-widely-available'/);
	});

	it('keeps caption-size ink-faint at least 7:1 against paper', () => {
		expect(contrastRatio(activeSystem.light.inkFaint, activeSystem.light.paper)).toBeGreaterThanOrEqual(7);
		expect(contrastRatio(activeSystem.dark.inkFaint, activeSystem.dark.paper)).toBeGreaterThanOrEqual(7);
	});

	it('sizes peek, backup summary, and pip hits to at least 44px with pip buffers', () => {
		expect(styleBlock(home)).toMatch(/\.peek\s*\{[^}]*min-height:\s*44px/s);
		expect(styleBlock(review)).toMatch(/\.backup-card summary\s*\{[^}]*min-height:\s*44px/s);
		expect(styleBlock(labRunner)).toMatch(/\.pip\s*\{[^}]*min-width:\s*44px/s);
		expect(styleBlock(labRunner)).toMatch(/\.rail li\s*\{[^}]*padding-inline:/s);
	});

	it('uses an h1 on the error page and the lab finish screen', () => {
		expect(errorPage).toMatch(/<h1>/);
		expect(errorPage).not.toMatch(/<h2>/);
		const finish = labRunner.match(/\{#if finished\}([\s\S]*?)\{:else\}/)?.[1] ?? '';
		expect(finish).toMatch(/<h1>/);
		expect(finish).not.toMatch(/<h2>/);
	});

	it('emits absolute Open Graph images only, with dimensions and a dark manifest', () => {
		expect(layout).not.toMatch(/siteAsset\('\/og\.png'\)\s*\?\?/);
		expect(layout).toMatch(/property="og:type"/);
		expect(layout).toMatch(/property="og:image:width"/);
		expect(layout).toMatch(/content="1200"/);
		expect(layout).toMatch(/property="og:image:height"/);
		expect(layout).toMatch(/content="630"/);
		expect(layout).toMatch(/name="twitter:title"/);
		expect(appHtml).toMatch(/manifest-dark\.webmanifest/);
		expect(appHtml).toMatch(/prefers-color-scheme:\s*dark/);
		expect(appHtml).toContain('%%DESIGN_PAPER_LIGHT%%');
		const resolvedHtml = applyDesignSystem(appHtml, activeSystem);
		expect(resolvedHtml).toContain(activeSystem.light.paper);
		expect(resolvedHtml).toContain(activeSystem.dark.paper);
		expect(manifest).toContain(`"theme_color": "${activeSystem.light.paper}"`);
		const darkPath = new URL('../../static/manifest-dark.webmanifest', import.meta.url);
		expect(existsSync(darkPath)).toBe(true);
		const manifestDark = readFileSync(darkPath, 'utf8');
		expect(manifestDark).toContain(`"theme_color": "${activeSystem.dark.paper}"`);
		expect(manifestDark).toContain(`"background_color": "${activeSystem.dark.paper}"`);
	});
});
