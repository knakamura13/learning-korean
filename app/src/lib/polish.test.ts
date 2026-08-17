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

const appCss = readFileSync(new URL('../app.css', import.meta.url), 'utf8');

function styleBlock(markup: string): string {
	const match = markup.match(/<style>([\s\S]*?)<\/style>/);
	if (!match) throw new Error('no style block');
	return match[1];
}

function cssBlock(css: string, prelude: string): string {
	const start = css.indexOf(prelude);
	if (start < 0) throw new Error(`missing ${prelude}`);
	const brace = css.indexOf('{', start);
	let depth = 0;
	for (let i = brace; i < css.length; i++) {
		if (css[i] === '{') depth += 1;
		else if (css[i] === '}') {
			depth -= 1;
			if (depth === 0) return css.slice(brace + 1, i);
		}
	}
	throw new Error(`unclosed ${prelude}`);
}

function token(block: string, name: string): string {
	const match = block.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{3,8})`));
	if (!match) throw new Error(`missing ${name}`);
	return match[1];
}

function relativeLuminance(hex: string): number {
	const raw = hex.replace('#', '');
	const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
	const toLinear = (channel: number) => {
		const c = channel / 255;
		return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	};
	const r = toLinear(parseInt(full.slice(0, 2), 16));
	const g = toLinear(parseInt(full.slice(2, 4), 16));
	const b = toLinear(parseInt(full.slice(4, 6), 16));
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: string, b: string): number {
	const l1 = relativeLuminance(a);
	const l2 = relativeLuminance(b);
	const hi = Math.max(l1, l2);
	const lo = Math.min(l1, l2);
	return (hi + 0.05) / (lo + 0.05);
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
		expect(appCss).toMatch(/font-display:\s*optional/);
	});

	it('makes the Baseline Widely Available browser target explicit', () => {
		expect(viteConfig).toMatch(/build:\s*\{[\s\S]*?target:\s*'baseline-widely-available'/);
	});

	it('keeps caption-size ink-faint at least 7:1 against paper', () => {
		const light = cssBlock(appCss, ':root {');
		const dark = cssBlock(appCss, ":root[data-theme='dark']");
		expect(contrastRatio(token(light, '--ink-faint'), token(light, '--paper'))).toBeGreaterThanOrEqual(7);
		expect(contrastRatio(token(dark, '--ink-faint'), token(dark, '--paper'))).toBeGreaterThanOrEqual(7);
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
		expect(manifest).toMatch(/"theme_color":\s*"#fffef9"/);
		const darkPath = new URL('../../static/manifest-dark.webmanifest', import.meta.url);
		expect(existsSync(darkPath)).toBe(true);
		const manifestDark = readFileSync(darkPath, 'utf8');
		expect(manifestDark).toMatch(/"theme_color":\s*"#131316"/);
		expect(manifestDark).toMatch(/"background_color":\s*"#131316"/);
	});
});
