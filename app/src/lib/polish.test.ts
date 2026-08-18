import { existsSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import labRunner from './components/LabRunner.svelte?raw';
import progressBackup from './components/ProgressBackup.svelte?raw';
import siteFooter from './components/SiteFooter.svelte?raw';
import consonantClip from './components/ConsonantClip.svelte?raw';
import vowelStep from './components/steps/VowelStep.svelte?raw';
import mouthStep from './components/steps/MouthStep.svelte?raw';
import options from './components/Options.svelte?raw';
import themeToggle from './components/ThemeToggle.svelte?raw';
import labIndexRail from './components/shell/LabIndexRail.svelte?raw';
import labPreview from './components/shell/LabPreview.svelte?raw';
import labSpread from './components/shell/LabSpread.svelte?raw';
import viteConfig from '../../vite.config.ts?raw';
import layout from '../routes/+layout.svelte?raw';
import home from '../routes/+page.svelte?raw';
import review from '../routes/review/+page.svelte?raw';
import reference from '../routes/reference/+page.svelte?raw';
import labPage from '../routes/lab/[id]/+page.svelte?raw';
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
		expect(styleBlock(layout)).toMatch(/nav a:active\s*\{/);
		expect(styleBlock(siteFooter)).toMatch(/\.backup-fold summary:active\s*\{/);
		expect(styleBlock(home)).toMatch(/\.continue:active\s*\{/);
		expect(styleBlock(home)).toMatch(/a\.lab:active\s*\{/);
		expect(styleBlock(home)).toMatch(/a\.stat:active\s*\{/);
		expect(styleBlock(home)).toMatch(/\.peek:active\s*\{/);
	});

	it('gives the backup summary a hover state', () => {
		expect(styleBlock(siteFooter)).toMatch(/\.backup-fold summary:hover\s*\{/);
	});

	it('reserves the lab well with a mouth-sized skeleton until widgets can mount', () => {
		const well = labRunner.match(/\{#snippet well\(\)\}([\s\S]*?)\{\/snippet\}/)?.[1] ?? '';
		expect(well).toMatch(/\{#if ready\}/);
		expect(well).toMatch(/class="[^"]*(?:work-skel|mouth-ph)/);
		expect(well).toMatch(/aria-hidden="true"/);
		expect(well).toMatch(/<MouthStep/);
		expect(styleBlock(labRunner)).toMatch(/aspect-ratio:\s*440\s*\/\s*300/);
	});

	it('dims locked home chrome without opacity on live text', () => {
		const css = styleBlock(home);
		expect(css).not.toMatch(/\.lab\.ahead\s*\{[^}]*opacity\s*:/s);
		expect(css).not.toMatch(/\.tier\.locked\s*\{[^}]*opacity\s*:/s);
		expect(css).toMatch(/\.lab\.ahead\s*\{[^}]*background:\s*var\(--paper-sunk\)/s);
		expect(css).toMatch(/\.tier\.locked\s*\{[^}]*color:\s*var\(--ink-faint\)/s);
		expect(css).toMatch(/\.chip-status\.wait\s*\{[^}]*color:\s*var\(--warn\)/s);
	});

	it('sizes vowel picker choices to 44px and gives picker controls hover and active', () => {
		const css = styleBlock(vowelStep);
		expect(css).toMatch(/\.choice\s*\{[^}]*min-width:\s*44px/s);
		expect(css).toMatch(/\.choice\s*\{[^}]*min-height:\s*44px/s);
		expect(css).toMatch(/\.choice:hover/);
		expect(css).toMatch(/\.choice:active/);
		expect(css).toMatch(/\.dock:hover/);
		expect(css).toMatch(/\.dock:active/);
		expect(css).not.toMatch(/text-align:\s*left/);
		expect(css).toMatch(/text-align:\s*start/);
	});

	it('keeps physical gradient sides because logical gradient keywords are not Baseline', () => {
		expect(styleBlock(labRunner)).toMatch(/to right/);
		expect(styleBlock(labRunner)).not.toMatch(/to inline-end/);
		expect(styleBlock(reference)).not.toMatch(/to inline-end/);
	});

	it('keeps every Reference section on screen instead of a hiding carousel', () => {
		expect(reference).toMatch(/REFERENCE_SECTIONS/);
		expect(styleBlock(reference)).toMatch(/\.quick-nav\s*\{[^}]*flex-wrap:\s*wrap/s);
		expect(styleBlock(reference)).not.toMatch(/flex-wrap:\s*nowrap/);
		expect(styleBlock(reference)).not.toMatch(/overflow-x:\s*auto/);
		expect(styleBlock(reference)).toMatch(/\.toc\s*\{[^}]*position:\s*sticky/s);
		expect(reference).toMatch(/function jumpToSection/);
		expect(reference).toMatch(/scrollIntoView/);
		expect(home).toMatch(/Review still waits/);
		expect(styleBlock(home)).toMatch(/grid-template-areas:/);
	});

	it('uses logical properties in shared directional layout', () => {
		expect(appCss).not.toMatch(/\bmargin-left\s*:/);
		expect(labRunner).not.toMatch(/\bleft\s*:\s*0/);
		const chrome = [
			appCss,
			labRunner,
			progressBackup,
			siteFooter,
			layout,
			home,
			review,
			reference,
			options,
			errorPage,
			labPage,
			labIndexRail,
			labPreview,
			labSpread
		];
		for (const src of chrome) {
			expect(physicalBoxProps(src)).toEqual([]);
			expect(src).not.toMatch(/text-align:\s*(?:left|right)/);
		}
		expect(physicalLeftRight(styleBlock(layout))).toEqual([]);
		expect(physicalLeftRight(styleBlock(labRunner))).toEqual([]);
		expect(physicalLeftRight(styleBlock(progressBackup))).toEqual([]);
		expect(physicalLeftRight(styleBlock(siteFooter))).toEqual([]);
		expect(physicalLeftRight(styleBlock(home))).toEqual([]);
		expect(physicalLeftRight(styleBlock(review))).toEqual([]);
		expect(physicalLeftRight(styleBlock(reference))).toEqual([]);
		expect(physicalLeftRight(styleBlock(errorPage))).toEqual([]);
		expect(physicalLeftRight(styleBlock(labPage))).toEqual([]);
		expect(physicalLeftRight(styleBlock(labIndexRail))).toEqual([]);
		expect(physicalLeftRight(styleBlock(labPreview))).toEqual([]);
		expect(physicalLeftRight(styleBlock(labSpread))).toEqual([]);
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

	it('keeps unused Botanical Korea faces on disk without preloading them', () => {
		expect(existsSync(new URL('../../static/fonts/NotoSerifKR-subset.woff2', import.meta.url))).toBe(true);
		expect(existsSync(new URL('../../static/fonts/Newsreader-latin.woff2', import.meta.url))).toBe(true);
		expect(systemCss).toMatch(/--serif:/);
		expect(systemCss).toMatch(/Noto Serif KR/);
		expect(systemCss).not.toMatch(/NotoSerifKR-subset\.woff2/);
		expect(systemCss).not.toMatch(/Newsreader-latin\.woff2/);
		expect(systemCss).toMatch(/font-display:\s*optional/);
		expect(layout).toMatch(/activeSystem\.fonts/);
	});

	it('self-hosts Newsreader italic for English display type', () => {
		expect(existsSync(new URL('../../static/fonts/Newsreader-Italic-latin.woff2', import.meta.url))).toBe(true);
		expect(systemCss).toMatch(/font-family: 'Newsreader'/);
		expect(systemCss).toMatch(/Newsreader-Italic-latin\.woff2/);
		expect(systemCss).toMatch(/font-style:\s*italic/);
		expect(systemCss).toMatch(/unicode-range:/);
		expect(systemCss).toMatch(/font-family: 'Noto Sans KR'/);
		expect(layout).toMatch(/var\(--display\)/);
		expect(appCss).toMatch(
			/h1,\s*h2,\s*h3,\s*h4\s*\{[^}]*font-family:\s*var\(--display\);[^}]*font-style:\s*italic/s
		);
		expect(appCss.indexOf(':lang(ko)')).toBeGreaterThan(appCss.indexOf('h1, h2, h3, h4'));
		expect(appCss).toMatch(/:lang\(ko\)\s*\{[^}]*font-family:\s*var\(--hangul\);[^}]*font-style:\s*normal/s);
		expect(styleBlock(home)).not.toMatch(/\.lab h3\s*\{[^}]*font-family:/s);
		expect(styleBlock(reference)).not.toMatch(/h1\s*\{[^}]*font-family:/s);
		expect(styleBlock(review)).not.toMatch(/\.empty h2\s*\{[^}]*font-family:/s);
		expect(systemCss).not.toMatch(/fonts\.googleapis\.com/);
		expect(layout).not.toMatch(/fonts\.googleapis\.com/);
	});

	it('sets lab card .do in sans, not display italic', () => {
		const runnerCss = styleBlock(labRunner);
		const doBlock = runnerCss.match(/\.do\s*\{[^}]*\}/)?.[0];
		expect(doBlock).toBeTruthy();
		expect(doBlock).toMatch(/font-family:\s*var\(--sans\)/);
		expect(doBlock).toMatch(/font-style:\s*normal/);
		expect(doBlock).not.toMatch(/var\(--display\)/);
		expect(doBlock).not.toMatch(/font-style:\s*italic/);
		expect(runnerCss).toMatch(
			/\.do\s+:global\(em\)\s*\{[^}]*font-style:\s*italic;[^}]*font-weight:\s*600/s
		);

		expect(runnerCss).toMatch(
			/\.head h1\s*\{[^}]*font-family:\s*var\(--display\);[^}]*font-style:\s*italic/s
		);
		expect(runnerCss).toMatch(
			/\.finish h1\s*\{[^}]*font-family:\s*var\(--display\);[^}]*font-style:\s*italic/s
		);
		expect(styleBlock(layout)).toMatch(
			/\.name\s*\{[^}]*font-family:\s*var\(--display\);[^}]*font-style:\s*italic/s
		);
		expect(styleBlock(home)).toMatch(
			/\.sec\s*\{[^}]*font-family:\s*var\(--display\);[^}]*font-style:\s*italic/s
		);
		expect(styleBlock(home)).toMatch(
			/\.continue-title\s*\{[^}]*font-family:\s*var\(--display\);[^}]*font-style:\s*italic/s
		);
	});

	it('makes the Baseline Widely Available browser target explicit', () => {
		expect(viteConfig).toMatch(/build:\s*\{[\s\S]*?target:\s*'baseline-widely-available'/);
	});

	it('keeps caption-size ink-faint at least 7:1 against paper', () => {
		expect(contrastRatio(activeSystem.light.inkFaint, activeSystem.light.paper)).toBeGreaterThanOrEqual(7);
		expect(contrastRatio(activeSystem.dark.inkFaint, activeSystem.dark.paper)).toBeGreaterThanOrEqual(7);
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

	it('sizes peek, backup summary, pip, theme, brand, and lab-index hits to at least 44px', () => {
		expect(styleBlock(home)).toMatch(/\.peek\s*\{[^}]*min-height:\s*44px/s);
		expect(styleBlock(siteFooter)).toMatch(/\.backup-fold summary\s*\{[^}]*min-height:\s*44px/s);
		expect(styleBlock(labRunner)).toMatch(/\.pip\s*\{[^}]*min-width:\s*44px/s);
		expect(styleBlock(labRunner)).toMatch(/\.rail li\s*\{[^}]*padding-inline:/s);
		expect(styleBlock(labIndexRail)).toMatch(/min-height:\s*44px/);
		expect(styleBlock(themeToggle)).toMatch(/min-height:\s*44px/);
		expect(styleBlock(layout)).toMatch(/\.brand\s*\{[^}]*min-width:\s*44px/s);
		expect(styleBlock(layout)).toMatch(/\.brand\s*\{[^}]*min-height:\s*44px/s);
	});

	it('leaves enough scroll room so Dictionary Order can sit under the sticky header', () => {
		const css = styleBlock(reference);
		expect(css).toMatch(
			/section\s*\{[^}]*scroll-margin-block-start:\s*calc\(44px \+ env\(safe-area-inset-top\) \+ 12\.5rem\)/s
		);
		expect(css).toMatch(/#sources\s*\{[^}]*min-height:\s*calc\(100dvh/s);
	});

	it('sizes Need a letter and reference source links to at least 44px', () => {
		expect(styleBlock(labPage)).toMatch(/\.ask a\s*\{[^}]*min-height:\s*44px/s);
		expect(styleBlock(reference)).toMatch(/\.src a\s*\{[^}]*min-height:\s*44px/s);
	});

	it('paints stats labels in ink so they clear 7:1 on raised paper and rose-soft', () => {
		const { light, dark } = activeSystem;
		expect(styleBlock(home)).toMatch(/\.stat span\s*\{[^}]*color:\s*var\(--ink\)/s);
		expect(styleBlock(review)).toMatch(/\.stat span\s*\{[^}]*color:\s*var\(--ink\)/s);
		expect(styleBlock(home)).not.toMatch(/\.stat span\s*\{[^}]*color:\s*var\(--ink-faint\)/s);
		expect(styleBlock(review)).not.toMatch(/\.stat span\s*\{[^}]*color:\s*var\(--ink-faint\)/s);
		for (const palette of [light, dark]) {
			expect(contrastRatio(palette.ink, palette.paperRaised)).toBeGreaterThanOrEqual(7);
			expect(contrastRatio(palette.ink, palette.roseSoft)).toBeGreaterThanOrEqual(7);
		}
	});

	it('uses an h1 on the error page and the lab finish screen', () => {
		expect(errorPage).toMatch(/<h1>/);
		expect(errorPage).not.toMatch(/<h2>/);
		const finish = labRunner.match(/\{#if finished\}([\s\S]*?)\{:else\}/)?.[1] ?? '';
		expect(finish).toMatch(/<h1>/);
		expect(finish).not.toMatch(/<h2>/);
	});

	it('mounts home lab cards as herbarium specimens without grain on the face', () => {
		expect(appCss).toMatch(/\.card\s*\{[^}]*position:\s*relative/s);
		expect(appCss).toMatch(/\.lab\.card::before/);
		expect(appCss).toMatch(/\.lab\.card::after/);
		expect(appCss).not.toMatch(/(?<!\.lab)\.card::before/);
		expect(appCss).not.toMatch(/(?<!\.lab)\.card::after/);
		expect(home).toMatch(/class="lab card/);
		expect(appCss).toMatch(/body\s*\{[\s\S]*background-image:/);
		expect(appCss).not.toMatch(/body::before[\s\S]{0,200}z-index:\s*1000/);
		expect(appCss).toMatch(/width='400'\s+height='400'/);
		expect(appCss).toMatch(/background-size:\s*400px\s+400px/);
	});

	it('keeps the lab well free of specimen ticks', () => {
		expect(labSpread).toMatch(/class="well"/);
		expect(labSpread).not.toMatch(/\.well::before/);
		expect(labSpread).not.toMatch(/\.well::after/);
		expect(labRunner).not.toMatch(/class="card step"/);
	});

	it('lets spatial lab widgets occupy the well instead of old card figures', () => {
		const wellCss = styleBlock(labSpread);
		const workCss = styleBlock(labRunner);
		const mouthCss = styleBlock(mouthStep);
		const vowelCss = styleBlock(vowelStep);
		const zoneBoard = vowelCss.match(/\.zone\s*\{[^}]+\}/)?.[0] ?? '';

		expect(wellCss).toMatch(/\.well\s*\{[^}]*display:\s*flex/s);
		expect(workCss).toMatch(/\.work\s*\{[^}]*width:\s*100%/s);
		expect(workCss).toMatch(/\.work\s*\{[^}]*flex:\s*1 1 auto/s);

		expect(mouthCss).toMatch(/\.mouth-wrap\s*\{[^}]*width:\s*100%/s);
		expect(mouthCss).not.toMatch(/\.mouth-wrap\s*\{[^}]*max-width:\s*30rem/s);
		expect(mouthCss).not.toMatch(/\.mouth-wrap\s*\{[^}]*margin:\s*0 auto/s);
		expect(mouthCss).toMatch(/\.mouth-stage\s*\{[^}]*width:\s*100%/s);
		expect(mouthCss).toMatch(/\.mouth\s*\{[^}]*width:\s*100%/s);
		expect(mouthStep).toMatch(/viewBox="0 0 440 300"/);
		expect(mouthStep).not.toMatch(/<svg[^>]*\swidth="/);
		expect(mouthStep).not.toMatch(/<svg[^>]*\sheight="/);

		expect(zoneBoard).toMatch(/aspect-ratio:\s*1/);
		expect(zoneBoard).toMatch(/width:\s*min\(100%/);
		expect(zoneBoard).not.toMatch(/12rem/);
		expect(zoneBoard).not.toMatch(/paper-sunk/);
		expect(zoneBoard).toMatch(/paper-raised/);
		expect(vowelCss).toMatch(/\.dock\s*\{[^}]*width:\s*2\.75rem/s);
	});

	it('keeps a labeled Labs / Review / Reference header without journal chrome', () => {
		expect(layout).toMatch(/label: 'Labs'/);
		expect(layout).toMatch(/label: 'Review'/);
		expect(layout).toMatch(/label: 'Reference'/);
		expect(layout).not.toMatch(/>ToC</);
		expect(layout).not.toMatch(/>¶</);
		expect(layout).not.toMatch(/Colophon/);
		expect(layout).not.toMatch(/folio/);
		expect(layout).toMatch(/ThemeToggle/);
		expect(styleBlock(layout)).toMatch(/\.inner\s*\{[^}]*min-height:\s*44px/s);
		expect(styleBlock(layout)).not.toMatch(/\.inner\s*\{[^}]*(?<!min-)height:\s*44px/s);
		expect(styleBlock(layout)).toMatch(/\.name\s*\{[^}]*font-size:\s*1rem/s);
		expect(styleBlock(labSpread)).toMatch(/inset-block-start:\s*calc\(2\.75rem/);
		expect(styleBlock(labSpread)).toMatch(/max-height:\s*calc\(100dvh - 2\.75rem/);
		expect(styleBlock(labIndexRail)).toMatch(/inset-block-start:\s*calc\(2\.75rem/);
		expect(styleBlock(layout)).toMatch(/\.bar\.lab-route \.inner\s*\{[^}]*max-width:\s*var\(--sitting\)/s);
		expect(styleBlock(layout)).toMatch(/@media \(max-width: 20rem\)/);
		expect(styleBlock(layout)).not.toMatch(/overflow-x:\s*auto/);
		expect(styleBlock(layout)).toMatch(/nav a\.active\s*\{[^}]*background:\s*var\(--paper\)/s);
		expect(styleBlock(layout)).toMatch(/border-start-start-radius:\s*var\(--tab-r\)/);
		expect(styleBlock(layout)).toMatch(/nav a\.active::before/);
		expect(styleBlock(layout)).toMatch(/nav a\.active::after/);
		expect(styleBlock(layout)).toMatch(/radial-gradient\(\s*circle at 0 0/);
		expect(styleBlock(layout)).toMatch(/margin-block-end:\s*-1px/);
		expect(labIndexRail).toMatch(/aria-label="Labs"/);
	});

	it('keeps an English brand name on phones and marks lab sittings as Labs', () => {
		expect(layout).toMatch(/class="brand"[^>]*aria-label="Korean 한"/);
		expect(layout).toMatch(/class="mark" lang="ko"/);
		expect(layout).toMatch(/pathname === '\/' \|\| page\.url\.pathname\.startsWith\('\/lab\/'\)/);
		expect(styleBlock(layout)).not.toMatch(/\.name\s*\{[^}]*display:\s*none/s);
		expect(home).toMatch(/Labs teach Hangul/);
		expect(home).toMatch(/Review quizzes only what you have already met/);
		expect(home).toMatch(/Reference is the letter list/);
		expect(home).toMatch(/<h2 id="sec-review-heading" class="sec">Review pile<\/h2>/);
		expect(home).not.toMatch(/<h2[^>]*>Deck<\/h2>/);
		expect(home).not.toMatch(/sec-deck-heading/);
	});

	it('does not ship fascicle journal words in UI chrome', () => {
		const chrome = layout + home + labRunner + labPage + labIndexRail + labPreview + labSpread + review + siteFooter;
		expect(chrome).not.toMatch(/Colophon/);
		expect(chrome).not.toMatch(/>ToC</);
		expect(chrome).not.toMatch(/label: 'ToC'/);
		expect(chrome).not.toMatch(/fascicle/i);
		expect(chrome).not.toMatch(/folio/i);
		expect(siteFooter).toMatch(/Back up or restore your progress/);
		expect(review).toMatch(/Loading Review/);
		expect(review).toMatch(/Nothing in Review yet/);
		expect(review).toMatch(/Review is clear/);
		expect(review).not.toMatch(/Deck clear/);
		expect(review).not.toMatch(/Nothing in the deck/);
		expect(labPage).toMatch(/Need a letter\?/);
		expect(labPage).toMatch(/Look up any letter in/);
		expect(labPage).toMatch(/resolve\('\/reference'\)/);
		expect(labPage).not.toMatch(/jamo/);
		expect(labPage).not.toMatch(/same\s+module these cards use/);
		expect(styleBlock(labRunner)).toMatch(/\.finish\s*\{[^}]*max-width:\s*var\(--measure\)/s);
	});

	it('puts the review card ahead of stats during a sitting and keeps backup off the page', () => {
		expect(review).toMatch(/reviewChrome\(/);
		expect(review).not.toMatch(/backupPanel/);
		expect(review).not.toMatch(/ProgressBackup/);
		expect(labRunner).toMatch(/\{:else if alreadyDone\}/);
		expect(review).not.toMatch(/type the romanization/);
	});

	it('paints due and resume rose, and keeps primary actions moss', () => {
		const homeCss = styleBlock(home);
		const layoutCss = styleBlock(layout);
		const reviewCss = styleBlock(review);
		expect(home).toMatch(/chip-status due/);
		expect(homeCss).toMatch(/\.chip-status\.due\s*\{[^}]*var\(--rose\)/s);
		expect(homeCss).toMatch(/a\.stat\.hot:not\(\.quiet\)[^}]*var\(--rose\)/s);
		expect(homeCss).toMatch(/\.lab\.resume\s*\{[^}]*var\(--rose\)/s);
		expect(homeCss).toMatch(/a\.lab\.resume:hover\s*\{[^}]*var\(--rose\)/s);
		expect(homeCss).toMatch(/\.chip-status\.go\s*\{[^}]*var\(--accent\)/s);
		expect(homeCss).toMatch(/\.continue\[data-kind='start'\]\s*\{[^}]*var\(--accent\)/s);
		expect(homeCss).toMatch(/\.continue\[data-kind='start'\]\s*\{[^}]*var\(--accent-soft\)/s);
		expect(homeCss).toMatch(
			/\.continue\[data-kind='resume'\],\s*\.continue\[data-kind='review'\]\s*\{[^}]*var\(--rose\)[^}]*var\(--rose-soft\)/s
		);
		expect(homeCss).toMatch(
			/\.continue\[data-kind='resume'\] \.continue-go,\s*\.continue\[data-kind='review'\] \.continue-go\s*\{[^}]*var\(--rose\)/s
		);
		expect(homeCss).not.toMatch(/\.continue\s*\{[^}]*var\(--accent\)/s);
		expect(layoutCss).toMatch(/\.badge\s*\{[^}]*var\(--rose\)/s);
		expect(layoutCss).toMatch(/nav a\.active\s*\{[^}]*var\(--accent\)/s);
		expect(reviewCss).toMatch(/\.stat\.hot\s*\{[^}]*var\(--rose\)/s);
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
