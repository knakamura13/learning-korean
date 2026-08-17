import { existsSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import labRunner from './components/LabRunner.svelte?raw';
import progressBackup from './components/ProgressBackup.svelte?raw';
import consonantClip from './components/ConsonantClip.svelte?raw';
import vowelStep from './components/steps/VowelStep.svelte?raw';
import options from './components/Options.svelte?raw';
import themeToggle from './components/ThemeToggle.svelte?raw';
import runningHead from './components/shell/RunningHead.svelte?raw';
import plateRail from './components/shell/PlateRail.svelte?raw';
import tocFlyleaf from './components/shell/TocFlyleaf.svelte?raw';
import colophon from './components/shell/Colophon.svelte?raw';
import sittingArticle from './components/shell/SittingArticle.svelte?raw';
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

function samplePngRgb(filePath: string, x?: number, y?: number): { r: number; g: number; b: number } {
	const script = `
from PIL import Image
import json, sys
im = Image.open(sys.argv[1])
w, h = im.size
px = int(sys.argv[2]) if len(sys.argv) > 2 else w // 2
py = int(sys.argv[3]) if len(sys.argv) > 3 else h // 2
p = im.getpixel((px, py))
print(json.dumps(list(p[:3])))
`.trim();
	const args = [filePath, String(x ?? ''), String(y ?? '')].filter((a, i) => i === 0 || a !== '');
	const out = execSync(`python3 -c "${script.replace(/"/g, '\\"')}" ${args.map((a) => `"${a}"`).join(' ')}`, {
		encoding: 'utf8'
	}).trim();
	const [r, g, b] = JSON.parse(out) as [number, number, number];
	return { r, g, b };
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
		expect(styleBlock(runningHead)).toMatch(/\.head-link:active\s*\{/);
		expect(styleBlock(colophon)).toMatch(/\.toggle:active\s*\{/);
	});

	it('uses logical properties in shared directional layout', () => {
		expect(appCss).not.toMatch(/\bmargin-left\s*:/);
		expect(labRunner).not.toMatch(/\bleft\s*:\s*0/);
		const chrome = [
			appCss,
			labRunner,
			progressBackup,
			layout,
			home,
			review,
			reference,
			options,
			errorPage,
			runningHead,
			plateRail,
			tocFlyleaf,
			colophon,
			sittingArticle
		];
		for (const src of chrome) {
			expect(physicalBoxProps(src)).toEqual([]);
			expect(src).not.toMatch(/text-align:\s*(?:left|right)/);
		}
		expect(physicalLeftRight(styleBlock(layout))).toEqual([]);
		expect(physicalLeftRight(styleBlock(labRunner))).toEqual([]);
		expect(physicalLeftRight(styleBlock(progressBackup))).toEqual([]);
		if (home.includes('<style>')) {
			expect(physicalLeftRight(styleBlock(home))).toEqual([]);
		}
		expect(physicalLeftRight(styleBlock(review))).toEqual([]);
		expect(physicalLeftRight(styleBlock(reference))).toEqual([]);
		expect(physicalLeftRight(styleBlock(errorPage))).toEqual([]);
		expect(physicalLeftRight(styleBlock(runningHead))).toEqual([]);
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

	it('self-hosts Hangul and loads Latin faces from the layout', () => {
		expect(existsSync(new URL('../../static/fonts/NotoSansKR-subset.woff2', import.meta.url))).toBe(true);
		expect(systemCss).toMatch(/font-family: 'Noto Sans KR'/);
		expect(systemCss).toMatch(/NotoSansKR-subset\.woff2/);
		expect(systemCss).toMatch(/font-display:\s*optional/);
		expect(systemCss).toMatch(/Newsreader/);
		expect(layout).toMatch(/activeSystem\.fonts/);
		expect(layout).toMatch(/fonts\.googleapis\.com/);
	});

	it('makes the Baseline Widely Available browser target explicit', () => {
		expect(viteConfig).toMatch(/build:\s*\{[\s\S]*?target:\s*'baseline-widely-available'/);
	});

	it('keeps caption-size ink-faint at least 7:1 against paper', () => {
		expect(contrastRatio(activeSystem.light.inkFaint, activeSystem.light.paper)).toBeGreaterThanOrEqual(7);
		expect(contrastRatio(activeSystem.dark.inkFaint, activeSystem.dark.paper)).toBeGreaterThanOrEqual(7);
	});

	it('keeps body ink at least 4.5:1 against paper', () => {
		expect(contrastRatio(activeSystem.light.ink, activeSystem.light.paper)).toBeGreaterThanOrEqual(4.5);
		expect(contrastRatio(activeSystem.dark.ink, activeSystem.dark.paper)).toBeGreaterThanOrEqual(4.5);
	});

	it('uses moss and rose under prefers-contrast, not 태극 red', () => {
		expect(appCss).not.toMatch(/prefers-contrast:\s*more\)[\s\S]{0,400}--accent:\s*#/);
		expect(activeSystem.contrastMoreLight?.accent.toLowerCase()).toBe('#1e3d2c');
		expect(activeSystem.contrastMoreLight?.rose.toLowerCase()).toBe('#5c2c33');
		expect(systemCss).toContain('--accent: #1e3d2c');
		expect(systemCss).toContain('--rose: #5c2c33');
		expect(systemCss).not.toContain('--accent: #8a2a22');
		expect(contrastRatio(activeSystem.contrastMoreLight!.accent, activeSystem.light.paper)).toBeGreaterThanOrEqual(
			4.5
		);
		expect(contrastRatio(activeSystem.contrastMoreLight!.rose, activeSystem.light.paper)).toBeGreaterThanOrEqual(4.5);
	});

	it('locks Botanical Korea paper, moss, and rose with WCAG floors', () => {
		expect(activeSystem.id).toBe('botanicalKorea');
		const { light, dark } = activeSystem;
		expect(light.paper.toLowerCase()).toBe('#faf5ee');
		expect(light.accent.toLowerCase()).toBe('#315c45');
		expect(light.accentInk.toLowerCase()).toBe('#fffdf8');
		expect(light.rose.toLowerCase()).toBe('#7a3e46');
		expect(dark.paper.toLowerCase()).toBe('#1a2420');
		expect(dark.accent.toLowerCase()).toBe('#a6c1ae');
		expect(dark.rose.toLowerCase()).toBe('#e8b4ba');
		expect(systemCss).toContain('--paper: #faf5ee');
		expect(systemCss).toContain('--rose: #7a3e46');
		expect(systemCss).toContain('--rose-soft: #f3e6e8');
		expect(contrastRatio(light.inkFaint, light.paper)).toBeGreaterThanOrEqual(7);
		expect(contrastRatio(dark.inkFaint, dark.paper)).toBeGreaterThanOrEqual(7);
		expect(contrastRatio(light.accent, light.accentInk)).toBeGreaterThanOrEqual(4.5);
		expect(contrastRatio(dark.accent, dark.accentInk)).toBeGreaterThanOrEqual(4.5);
		for (const name of ['rose', 'good', 'blue', 'warn'] as const) {
			expect(contrastRatio(light[name], light.paper)).toBeGreaterThanOrEqual(4.5);
			expect(contrastRatio(dark[name], dark.paper)).toBeGreaterThanOrEqual(4.5);
		}
	});

	it('sizes ToC rows, colophon toggle, and pip hits to at least 44px with pip buffers', () => {
		expect(styleBlock(tocFlyleaf)).toMatch(/\.plate\s*\{[^}]*min-height:\s*44px/s);
		expect(styleBlock(colophon)).toMatch(/\.toggle\s*\{[^}]*min-height:\s*44px/s);
		expect(styleBlock(labRunner)).toMatch(/\.pip\s*\{[^}]*min-width:\s*44px/s);
		expect(styleBlock(labRunner)).toMatch(/\.rail li\s*\{[^}]*padding-inline:/s);
		expect(styleBlock(plateRail)).toMatch(/min-height:\s*44px/);
		expect(styleBlock(runningHead)).toMatch(/min-height:\s*44px/);
	});

	it('does not present Labs, Review, and Reference as peer tabs', () => {
		expect(layout).not.toMatch(/label: 'Labs'/);
		expect(layout).not.toMatch(/Main navigation/);
		expect(runningHead).toMatch(/ToC/);
		expect(runningHead).toMatch(/¶/);
		expect(home).not.toMatch(/sec-labs-heading/);
		expect(home).not.toMatch(/to review/);
	});

	it('uses an h1 on the error page and the lab finish screen', () => {
		expect(errorPage).toMatch(/<h1>/);
		expect(errorPage).not.toMatch(/<h2>/);
		const finish = labRunner.match(/\{#if finished\}([\s\S]*?)\{:else\}/)?.[1] ?? '';
		expect(finish).toMatch(/<h1>/);
		expect(finish).not.toMatch(/<h2>/);
	});

	it('mounts cards as herbarium specimens without grain on the face', () => {
		expect(appCss).toMatch(/\.card\s*\{[^}]*position:\s*relative/s);
		expect(appCss).toMatch(/\.card::before/);
		expect(appCss).toMatch(/\.card::after/);
		expect(appCss).toMatch(/body\s*\{[\s\S]*background-image:/);
		expect(appCss).not.toMatch(/body::before[\s\S]{0,200}z-index:\s*1000/);
		expect(appCss).toMatch(/--grain:/);
		expect(appCss).toMatch(/background-image:\s*var\(--grain\)/);
	});

	it('paints due and resume rose, and keeps primary actions moss', () => {
		const articleCss = styleBlock(sittingArticle);
		const railCss = styleBlock(plateRail);
		const headCss = styleBlock(runningHead);
		const reviewCss = styleBlock(review);
		expect(articleCss).toMatch(/\.kicker\[data-kind='review'\]\s*\{[^}]*var\(--rose\)/s);
		expect(articleCss).toMatch(/var\(--accent\)/);
		expect(railCss).toMatch(/\.pip\[data-tone='due'\]\s*\{[^}]*var\(--rose\)/s);
		expect(railCss).toMatch(/\.pip\[data-tone='current'\]\s*\{[^}]*var\(--accent\)/s);
		expect(headCss).toMatch(/\.pip\[data-tone='rose'\]\s*\{[^}]*var\(--rose\)/s);
		expect(headCss).toMatch(/\.pip\[data-tone='moss'\]\s*\{[^}]*var\(--accent\)/s);
		expect(reviewCss).toMatch(/\.kicker\.hot\s*\{[^}]*var\(--rose\)/s);
	});

	it('ships moss raster icons and OG, not 태극 red marks', () => {
		const rasters = ['icon-192.png', 'apple-touch-icon.png', 'icon-maskable.png', 'og.png'] as const;
		const taguk = { r: 164, g: 52, b: 43 };
		const isTaguk = (r: number, g: number, b: number) =>
			Math.abs(r - taguk.r) < 8 && Math.abs(g - taguk.g) < 8 && Math.abs(b - taguk.b) < 8;

		for (const name of rasters) {
			const path = fileURLToPath(new URL(`../../static/${name}`, import.meta.url));
			expect(existsSync(path)).toBe(true);
			const bytes = readFileSync(path);
			expect(bytes.length).toBeGreaterThan(1000);
			expect(bytes[0]).toBe(0x89);
			expect(bytes[1]).toBe(0x50);
			const sample =
				name === 'og.png'
					? samplePngRgb(path, 200, 300)
					: samplePngRgb(path);
			expect(isTaguk(sample.r, sample.g, sample.b)).toBe(false);
		}
	});

	it('paints the favicon 한 on moss, not 태극 red', () => {
		const svg = readFileSync(new URL('../../static/favicon.svg', import.meta.url), 'utf8');
		expect(svg).toMatch(/fill="#315c45"/);
		expect(svg).not.toMatch(/#a4342b/);
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
