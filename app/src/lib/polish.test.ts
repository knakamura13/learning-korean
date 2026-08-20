import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import labRunner from './components/LabRunner.svelte?raw';
import labRunnerPipRail from './components/labRunnerPipRail.svelte.ts?raw';
import progressBackup from './components/ProgressBackup.svelte?raw';
import consonantClip from './components/ConsonantClip.svelte?raw';
import vowelStep from './components/steps/VowelStep.svelte?raw';
import mouthStep from './components/steps/MouthStep.svelte?raw';
import readStep from './components/steps/ReadStep.svelte?raw';
import options from './components/Options.svelte?raw';
import tray from './components/Tray.svelte?raw';
import settingsLink from './components/SettingsLink.svelte?raw';
import labIndexRail from './components/shell/LabIndexRail.svelte?raw';
import labPreview from './components/shell/LabPreview.svelte?raw';
import labSpread from './components/shell/LabSpread.svelte?raw';
import lockedLabPopover from './components/shell/LockedLabPopover.svelte?raw';
import lookPicker from './components/LookPicker.svelte?raw';
import referenceIndexRail from './components/shell/ReferenceIndexRail.svelte?raw';
import referencePreview from './components/shell/ReferencePreview.svelte?raw';
import viteConfig from '../../vite.config.ts?raw';
import layout from '../routes/+layout.svelte?raw';
import home from '../routes/+page.svelte?raw';
import review from '../routes/review/+page.svelte?raw';
import settingsPage from '../routes/settings/+page.svelte?raw';
import reference from '../routes/reference/+page.svelte?raw';
import labPage from '../routes/lab/[id]/+page.svelte?raw';
import errorPage from '../routes/+error.svelte?raw';
import appHtml from '../app.html?raw';
import manifest from '../../static/manifest.webmanifest?raw';
import { activeSystem } from './theme/active';
import { LOOKS } from './theme/catalog';
import { contrastRatio } from './theme/contrast';
import { designSystemCss } from './theme/css';
import { applyDesignSystem, BOOT_PLACEHOLDER } from './theme/placeholders';
import { writeManifests } from './theme/manifest';
import slots from './components/Slots.svelte?raw';

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

/**
 * Sitting chrome Phase 3 may split. Assert against this bundle, not
 * LabRunner.svelte identifiers, import paths, or which file owns CSS.
 */
const sittingSources = [labRunner, labSpread, labRunnerPipRail];
const sitting = sittingSources.join('\n');

function sittingStyles(): string {
	return sittingSources
		.map((src) => src.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '')
		.join('\n');
}

const sittingCss = sittingStyles();

describe('polish audit regressions', () => {
	it('requires confirmation before clearing a completed lab session', () => {
		expect(sitting).toMatch(/Start over\? Your completed lab summary will be cleared\./);
		expect(sitting).toMatch(/<dialog\b[^>]*class="restart-confirm"/);
		expect(sitting).toMatch(/>Start over</);
	});

	it('opens restore and restart confirmations as native modal dialogs', () => {
		expect(progressBackup).toMatch(/<dialog\b[^>]*class="confirm"/);
		expect(progressBackup).toMatch(/attachModalDialog/);
		expect(sitting).toMatch(/<dialog\b[^>]*class="restart-confirm"/);
		expect(sitting).toMatch(/attachModalDialog/);
	});

	it('opens the locked-lab overlay as a native modal dialog', () => {
		expect(lockedLabPopover).toMatch(/<dialog\b[^>]*class="pop"/);
		expect(lockedLabPopover).toMatch(/attachModalDialog/);
		expect(lockedLabPopover).toMatch(/from '\$lib\/a11y\/attachModalDialog'/);
		expect(lockedLabPopover).not.toMatch(/role="dialog"/);
		expect(lockedLabPopover).not.toMatch(/e\.key !== 'Tab'/);
		expect(styleBlock(lockedLabPopover)).toMatch(/\.pop\s*\{[^}]*inset:\s*unset/s);
		expect(styleBlock(lockedLabPopover)).toMatch(/\.pop::backdrop/);
	});

	it('moves card-change focus to the first well control, not the instruction heading', () => {
		expect(sitting).not.toMatch(/querySelector\('h2'\)\?\.focus/);
		expect(sitting).not.toMatch(/<h2 class="do" tabindex="-1"/);
		expect(sitting).toMatch(/firstWellControl\(/);
		expect(sittingCss).not.toMatch(/\.do:focus-visible/);
		expect(sittingCss).not.toMatch(/\.do:focus\b/);
	});

	it('announces the new instruction from a persistent live region outside the card key', () => {
		expect(sitting).toMatch(/data-prompt-live/);
		expect(sitting).toMatch(/data-prompt-live[^>]*aria-live="polite"/);
		const promptOpen = sitting.match(/class="prompt"[\s\S]{0,400}<h2 class="do"/)?.[0] ?? '';
		expect(promptOpen).not.toMatch(/data-prompt-live/);
	});

	it('gives the settings control pressed-state feedback', () => {
		expect(settingsLink).toMatch(/\.settings:active\s*\{/);
	});

	it('gives remaining interactive chrome a pressed state', () => {
		expect(styleBlock(consonantClip)).toMatch(/\.play:active\s*\{/);
		expect(styleBlock(vowelStep)).toMatch(/\.stamp:active:not\(:disabled\)\s*\{/);
		expect(sittingCss).toMatch(/button\.pip:not\(\[data-selected\]\):active\s*\{/);
		expect(styleBlock(layout)).toMatch(/nav a:active\s*\{/);
		expect(styleBlock(home)).toMatch(/a\.lab:active/);
		expect(styleBlock(home)).toMatch(/button\.lab:active/);
		expect(styleBlock(labIndexRail)).toMatch(/\.num:active/);
		expect(styleBlock(referenceIndexRail)).toMatch(/\.jump:active/);
		expect(appCss).toMatch(/\.btn:active\s*\{/);
		expect(styleBlock(lookPicker)).toMatch(/\.look-card:active\s*\{/);
		expect(styleBlock(lookPicker)).toMatch(/\.color-option:active\s*\{/);
	});

	it('does not paint the control focus ring on the skip-to-content landmark', () => {
		expect(appCss).toMatch(/#main:focus\s*,\s*#main:focus-visible/);
		expect(appCss).toMatch(/#main:focus[\s\S]*?outline:\s*none/s);
		expect(appCss).toMatch(/#main:focus[\s\S]*?box-shadow:\s*none/s);
		expect(appCss).toMatch(/#main\[data-skip-landed\]::after/);
		expect(appCss).toMatch(/#main\[data-skip-landed\]::after\s*\{[^}]*inset:\s*1\.5rem/s);
		expect(appCss).toMatch(/#main\[data-skip-landed\]::after\s*\{[^}]*border:\s*4px solid var\(--blue\)/s);
	});

	it('keeps filled button labels visible when a .btn link is hovered', () => {
		expect(appCss).toMatch(/a:hover:not\(\.btn\)\s*\{[^}]*color:\s*var\(--accent\)/s);
		expect(appCss).toMatch(/\.btn:hover\s*\{[^}]*color:\s*var\(--accent-ink\)/s);
	});

	it('reserves the lab well with a mouth-sized skeleton until widgets can mount', () => {
		const well = sitting.match(/\{#snippet well\(\)\}([\s\S]*?)\{\/snippet\}/)?.[1] ?? '';
		expect(well).toMatch(/\{#if ready\}/);
		expect(well).toMatch(/class="[^"]*(?:work-skel|mouth-ph)/);
		expect(well).toMatch(/aria-hidden="true"/);
		expect(well).toMatch(/<MouthStep/);
		expect(sittingCss).toMatch(/aspect-ratio:\s*440\s*\/\s*300/);
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
		expect(sittingCss).toMatch(/to right/);
		expect(sittingCss).not.toMatch(/to inline-end/);
		expect(styleBlock(reference)).not.toMatch(/to inline-end/);
	});

	it('keeps every Reference section on screen instead of a hiding carousel', () => {
		expect(reference).toMatch(/ReferenceIndexRail/);
		expect(reference).toMatch(/function jumpToSection/);
		expect(reference).toMatch(/jumpScrollY/);
		expect(reference).toMatch(/pinnedSection/);
		expect(reference).toMatch(/shouldReleaseJumpPin/);
		expect(reference).toMatch(/releaseJumpPin/);
		expect(styleBlock(referenceIndexRail)).toMatch(/flex-wrap:\s*wrap/);
		expect(styleBlock(referenceIndexRail)).not.toMatch(/overflow-x:\s*auto/);
		expect(styleBlock(referenceIndexRail)).toMatch(/\.ref-index\s*\{[^}]*position:\s*sticky/s);
		expect(home).toMatch(/lockedLabPopoverCopy/);
		expect(styleBlock(home)).toMatch(/grid-template-areas:/);
	});

	it('uses logical properties in shared directional layout', () => {
		expect(appCss).not.toMatch(/\bmargin-left\s*:/);
		expect(sitting).not.toMatch(/\bleft\s*:\s*0/);
		const chrome = [
			appCss,
			labRunner,
			labRunnerPipRail,
			progressBackup,
			settingsPage,
			layout,
			home,
			review,
			reference,
			options,
			errorPage,
			labPage,
			labIndexRail,
			labPreview,
			labSpread,
			referenceIndexRail,
			referencePreview
		];
		for (const src of chrome) {
			expect(physicalBoxProps(src)).toEqual([]);
			expect(src).not.toMatch(/text-align:\s*(?:left|right)/);
		}
		expect(physicalLeftRight(styleBlock(layout))).toEqual([]);
		expect(physicalLeftRight(sittingCss)).toEqual([]);
		expect(physicalLeftRight(styleBlock(progressBackup))).toEqual([]);
		expect(physicalLeftRight(styleBlock(settingsPage))).toEqual([]);
		expect(physicalLeftRight(styleBlock(home))).toEqual([]);
		expect(physicalLeftRight(styleBlock(review))).toEqual([]);
		expect(physicalLeftRight(styleBlock(reference))).toEqual([]);
		expect(physicalLeftRight(styleBlock(errorPage))).toEqual([]);
		expect(physicalLeftRight(styleBlock(labPage))).toEqual([]);
		expect(physicalLeftRight(styleBlock(labIndexRail))).toEqual([]);
		expect(physicalLeftRight(styleBlock(labPreview))).toEqual([]);
		expect(physicalLeftRight(styleBlock(labSpread))).toEqual([]);
		expect(physicalLeftRight(styleBlock(referenceIndexRail))).toEqual([]);
		expect(physicalLeftRight(styleBlock(referencePreview))).toEqual([]);
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
		const runnerCss = sittingCss;
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
	});

	it('keeps jamo clusters on one line when headings balance', () => {
		// `h1, h2 { text-wrap: balance }` wraps at spaces inside
		// `<span class="jamo">ㅐ ㅔ ㅖ</span>` even when the line has room.
		expect(appCss).toMatch(/h1,\s*h2\s*\{[^}]*text-wrap:\s*balance/s);
		expect(appCss).toMatch(/\.jamo\s*\{[^}]*white-space:\s*nowrap/s);
		expect(appCss).toMatch(/h2\.do\s*\{[^}]*text-wrap:\s*pretty/s);
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

	it('keeps status pills as labels and locked-card skip in a click popover', () => {
		const homeCss = styleBlock(home);
		expect(appCss).toMatch(/\.btn\s*\{[^}]*border-radius:\s*var\(--r-md\)/s);
		expect(appCss).toMatch(/\.btn\s*\{[^}]*text-decoration:\s*none/s);
		expect(appCss).toMatch(/\.btn\.ghost\s*\{[^}]*text-decoration:\s*none/s);
		expect(appCss).toMatch(/\.btn\.ghost\s*\{[^}]*border-color:\s*var\(--rule-strong\)/s);
		expect(homeCss).toMatch(/\.chip-status\s*\{[^}]*border-radius:\s*var\(--r-pill\)/s);
		expect(homeCss).toMatch(/\.chip-status\s*\{[^}]*cursor:\s*default/s);
		expect(home).not.toMatch(/<a[^>]*chip-status/);
		expect(home).not.toMatch(/class="lab-actions"/);
		expect(home).toMatch(/type="button"/);
		expect(home).toMatch(/class="lab card ahead"/);
		expect(home).toMatch(/LockedLabPopover/);
		expect(home).toMatch(/placeClickPopover/);
		expect(home).toMatch(/class="lock"/);
		expect(labPreview).toMatch(/class="btn ghost"/);
		expect(labPreview).toMatch(/model\.priorActionLabel/);
		expect(labPreview).toMatch(/openLab/);
	});

	it('sizes popover actions, pip, settings, brand, and lab-index hits to at least 44px', () => {
		expect(appCss).toMatch(/\.btn\s*\{[^}]*min-height:\s*44px/s);
		expect(home).toMatch(/LockedLabPopover/);
		expect(sittingCss).toMatch(/\.pip\s*\{[^}]*min-width:\s*44px/s);
		expect(sittingCss).toMatch(/\.rail li\s*\{[^}]*padding-inline:/s);
		expect(styleBlock(labIndexRail)).toMatch(/min-height:\s*44px/);
		expect(styleBlock(referenceIndexRail)).toMatch(/min-height:\s*44px/);
		expect(styleBlock(settingsLink)).toMatch(/min-height:\s*44px/);
		expect(styleBlock(layout)).toMatch(/\.brand\s*\{[^}]*min-width:\s*44px/s);
		expect(styleBlock(layout)).toMatch(/\.brand\s*\{[^}]*min-height:\s*44px/s);
	});

	it('leaves enough scroll room so Dictionary Order can sit under the sticky header', () => {
		const css = styleBlock(reference);
		expect(css).toMatch(
			/section\s*\{[^}]*scroll-margin-block-start:\s*calc\(44px \+ env\(safe-area-inset-top\) \+ 12\.5rem\)/s
		);
		expect(css).toMatch(
			/min-width:\s*72rem[^}]*scroll-margin-block-start:\s*calc\(44px \+ env\(safe-area-inset-top\) \+ var\(--s3\)\)/s
		);
		expect(css).toMatch(/#sources\s*\{[^}]*min-height:\s*calc\(100dvh/s);
	});

	it('sizes reference source links to at least 44px', () => {
		expect(styleBlock(reference)).toMatch(/\.src a\s*\{[^}]*min-height:\s*44px/s);
	});

	it('keeps composer plate readings faint on paper, not the batchim wash', () => {
		const css = styleBlock(slots);
		expect(css).toMatch(/\.slot-reading\s*\{[^}]*color:\s*var\(--ink-faint\)/s);
		expect(css).toMatch(/\.slot-reading\s*\{[^}]*font-style:\s*italic/s);
		expect(css).toMatch(/\.slot-reading\s*\{[^}]*font-weight:\s*400/s);
		expect(css).toMatch(/\.slot-reading\s*\{[^}]*margin-block-start:\s*var\(--s2\)/s);
		expect(css).not.toMatch(/\.slot-name\s*\{[^}]*font-style:\s*italic/s);
		expect(css).not.toMatch(/\.slot\.bottom\.filled\s*\{[^}]*background:\s*var\(--blue-soft\)/s);
		expect(css).toMatch(/\.slot\.bottom\.filled\s*\{[^}]*border-color:\s*var\(--blue\)/s);
		const { light, dark } = activeSystem;
		expect(contrastRatio(light.inkFaint, light.paperRaised)).toBeGreaterThanOrEqual(7);
		expect(contrastRatio(dark.inkFaint, dark.paperRaised)).toBeGreaterThanOrEqual(7);
		expect(contrastRatio(light.inkFaint, light.paper)).toBeGreaterThanOrEqual(7);
		expect(contrastRatio(dark.inkFaint, dark.paper)).toBeGreaterThanOrEqual(7);
	});

	it('paints stats labels in ink so they clear 7:1 on raised paper and rose-soft', () => {
		const { light, dark } = activeSystem;
		expect(styleBlock(review)).toMatch(/\.stat span\s*\{[^}]*color:\s*var\(--ink\)/s);
		expect(styleBlock(review)).not.toMatch(/\.stat span\s*\{[^}]*color:\s*var\(--ink-faint\)/s);
		for (const palette of [light, dark]) {
			expect(contrastRatio(palette.ink, palette.paperRaised)).toBeGreaterThanOrEqual(7);
			expect(contrastRatio(palette.ink, palette.roseSoft)).toBeGreaterThanOrEqual(7);
		}
	});

	it('uses an h1 on the error page and the lab finish screen', () => {
		expect(errorPage).toMatch(/<h1>/);
		expect(errorPage).not.toMatch(/<h2>/);
		expect(styleBlock(errorPage)).toMatch(/@media \(forced-colors:\s*active\)/);
		expect(styleBlock(readStep)).toMatch(/@media \(forced-colors:\s*active\)/);
		const finish = sitting.match(/\{#if finished\}([\s\S]*?)\{:else\}/)?.[1] ?? '';
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
		expect(sitting).not.toMatch(/class="card step"/);
	});

	it('lets spatial lab widgets occupy the well instead of old card figures', () => {
		const wellCss = styleBlock(labSpread);
		const workCss = sittingCss;
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
		expect(layout).toMatch(/SettingsLink/);
		expect(layout).not.toMatch(/ThemeToggle/);
		expect(styleBlock(layout)).toMatch(/\.inner\s*\{[^}]*min-height:\s*44px/s);
		expect(styleBlock(layout)).not.toMatch(/\.inner\s*\{[^}]*(?<!min-)height:\s*44px/s);
		expect(styleBlock(layout)).toMatch(/\.name\s*\{[^}]*font-size:\s*1rem/s);
		expect(styleBlock(labSpread)).toMatch(/inset-block-start:\s*calc\(2\.75rem/);
		expect(styleBlock(labSpread)).toMatch(/max-height:\s*calc\(100dvh - 2\.75rem/);
		// Sticky column is a flex container with a viewport max-height. If .well
		// (or .after) shrinks, stacked choice buttons paint past the well border.
		expect(styleBlock(labSpread)).toMatch(/\.well\s*\{[^}]*flex-shrink:\s*0/s);
		expect(styleBlock(labSpread)).toMatch(/\.after\s*\{[^}]*flex-shrink:\s*0/s);
		expect(styleBlock(labIndexRail)).toMatch(/inset-block-start:\s*calc\(2\.75rem/);
		expect(styleBlock(layout)).toMatch(/\.bar\.lab-route \.inner\s*\{[^}]*max-width:\s*var\(--sitting\)/s);
		expect(styleBlock(layout)).toMatch(/@media \(max-width: 20rem\)/);
		expect(styleBlock(layout)).not.toMatch(/overflow-x:\s*auto/);
		expect(styleBlock(layout)).toMatch(/nav\s*\{[^}]*padding-block-start:\s*0\.6rem/s);
		expect(styleBlock(layout)).toMatch(/nav\s*\{[^}]*flex-wrap:\s*nowrap/s);
		expect(layout).toMatch(/class="review-w"/);
		expect(layout).toMatch(/class="badge" aria-hidden="true"/);
		expect(layout).toMatch(/Review, \$\{queue\} cards due/);
		expect(styleBlock(layout)).toMatch(/\.review-w\s*\{[^}]*position:\s*relative/s);
		expect(styleBlock(layout)).toMatch(/\.badge\s*\{[^}]*position:\s*absolute/s);
		expect(styleBlock(layout)).toMatch(/\.badge\s*\{[^}]*inset-block-end:/s);
		expect(layout).toMatch(/class="badge-n"/);
		expect(styleBlock(layout)).toMatch(/\.badge\s*\{[^}]*padding-block:\s*0\.22rem/s);
		expect(styleBlock(layout)).toMatch(/\.badge\s*\{[^}]*padding-inline:\s*0\.36rem/s);
		expect(styleBlock(layout)).toMatch(/\.badge\s*\{[^}]*place-items:\s*center/s);
		expect(styleBlock(layout)).toMatch(/\.badge\s*\{[^}]*min-block-size:\s*1\.35rem/s);
		expect(styleBlock(layout)).toMatch(/\.badge-n\s*\{[^}]*text-box:\s*trim-both cap alphabetic/s);
		expect(styleBlock(layout)).toMatch(
			/@media \(max-width: 40rem\)[\s\S]*\.badge\s*\{[^}]*inline-size:\s*8px/s
		);
		expect(styleBlock(layout)).toMatch(
			/@media \(max-width: 40rem\)[\s\S]*\.badge\s*\{[^}]*block-size:\s*8px/s
		);
		expect(styleBlock(layout)).toMatch(
			/@media \(max-width: 40rem\)[\s\S]*\.badge\s*\{[^}]*aspect-ratio:\s*1/s
		);
		expect(styleBlock(layout)).toMatch(
			/@media \(max-width: 40rem\)[\s\S]*\.badge\s*\{[^}]*border-radius:\s*50%/s
		);
		expect(styleBlock(layout)).toMatch(
			/@media \(max-width: 40rem\)[\s\S]*\.badge\s*\{[^}]*translate:\s*none/s
		);
		expect(styleBlock(layout)).toMatch(
			/@media \(max-width: 40rem\)[\s\S]*\.badge\s*\{[^}]*inset-inline-start:\s*calc\(100% - 8px\)/s
		);
		expect(styleBlock(layout)).toMatch(
			/@media \(max-width: 40rem\)[\s\S]*\.badge-n\s*\{[^}]*display:\s*none/s
		);
		expect(styleBlock(layout)).toMatch(/nav a\s*\{[^}]*min-height:\s*40px/s);
		expect(styleBlock(layout)).not.toMatch(/nav a\s*\{[^}]*min-height:\s*calc\(/s);
		expect(styleBlock(layout)).toMatch(/nav a\.active\s*\{[^}]*background:\s*var\(--paper\)/s);
		expect(styleBlock(layout)).toMatch(/border-start-start-radius:\s*var\(--tab-r\)/);
		expect(styleBlock(layout)).toMatch(/nav a\.active::before/);
		expect(styleBlock(layout)).toMatch(/nav a\.active::after/);
		expect(styleBlock(layout)).toMatch(/radial-gradient\(\s*circle at 0 0/);
		expect(styleBlock(layout)).toMatch(/margin-block-end:\s*-1px/);
		expect(labIndexRail).toMatch(/aria-label="Labs"/);
	});

	it('paints vertical overscroll with the header chrome color', () => {
		expect(appCss).toMatch(/--chrome:\s*color-mix\(in srgb, var\(--paper-sunk\) 82%, black\)/);
		expect(appCss).toMatch(/html\s*\{[^}]*background-color:\s*var\(--chrome\)/s);
		expect(appCss).toMatch(/body\s*\{[^}]*background-color:\s*var\(--paper\)/s);
		expect(styleBlock(layout)).toMatch(/\.bar\s*\{[^}]*background:\s*var\(--chrome\)/s);
	});

	it('keeps an English brand name on phones and marks lab sittings as Labs', () => {
		expect(layout).toMatch(/class="brand"[^>]*aria-label="Korean 한"/);
		expect(layout).toMatch(/class="mark" lang="ko"/);
		expect(layout).toMatch(/pathname === '\/' \|\| page\.url\.pathname\.startsWith\('\/lab\/'\)/);
		expect(styleBlock(layout)).not.toMatch(/\.name\s*\{[^}]*display:\s*none/s);
		expect(home).toMatch(/Interactive labs that make you derive the writing system/);
		expect(home).not.toMatch(/Labs teach Hangul/);
		expect(home).toMatch(/<h2 id="sec-review-heading" class="sec">Review pile<\/h2>/);
		expect(home).not.toMatch(/<h2[^>]*>Deck<\/h2>/);
		expect(home).not.toMatch(/sec-deck-heading/);
		expect(home).toMatch(/reviewPileView/);
		expect(home).toMatch(/<span class="chip-status wait">/);
		expect(home).not.toMatch(/<a[^>]*chip-status/);
		expect(home).not.toMatch(/class="peek"/);
		expect(home).not.toMatch(/class="lab-actions"/);
		expect(home).toMatch(/LockedLabPopover/);
		expect(home).toMatch(/Review \{pile\.due\} due/);
		expect(home).toMatch(/Letters land here after you finish a lab/);
		expect(home).toMatch(/class="pile-skel"/);
		expect(home).toMatch(/class="tier skel-row"/);
		expect(styleBlock(home)).toMatch(/\.flag\s*\{[^}]*min-height:\s*1\.6rem/s);
		expect(styleBlock(home)).toMatch(/\.sec-row\s*\{[^}]*min-height:\s*44px/s);
		expect(styleBlock(home)).toMatch(/\.pile-empty\s*\{[^}]*min-height:\s*16rem/s);
		expect(home).not.toMatch(/pile-empty loading-copy/);
	});

	it('does not ship fascicle journal words in UI chrome', () => {
		const chrome = layout + home + sitting + labPage + labIndexRail + labPreview + review + settingsPage;
		expect(chrome).not.toMatch(/Colophon/);
		expect(chrome).not.toMatch(/>ToC</);
		expect(chrome).not.toMatch(/label: 'ToC'/);
		expect(chrome).not.toMatch(/fascicle/i);
		expect(chrome).not.toMatch(/folio/i);
		expect(settingsPage).toMatch(/<h2[^>]*>Backup<\/h2>/);
		expect(settingsPage).toMatch(/Your progress lives only in this browser/);
		expect(settingsPage).not.toMatch(/Back up or restore your progress/);
		expect(review).toMatch(/Loading Review/);
		expect(review).toMatch(/Nothing in Review yet/);
		expect(review).toMatch(/Review is clear/);
		expect(review).not.toMatch(/Deck clear/);
		expect(review).not.toMatch(/Nothing in the deck/);
		expect(labPage).not.toMatch(/Need a letter\?/);
		expect(labPage).not.toMatch(/Look up any letter in/);
		expect(labPage).not.toMatch(/jamo/);
		expect(labPage).not.toMatch(/same\s+module these cards use/);
		expect(sittingCss).toMatch(/\.finish\s*\{[^}]*max-width:\s*var\(--measure\)/s);
		const finish = sitting.match(/\{#if finished\}([\s\S]*?)\{:else\}/)?.[1] ?? '';
		expect(finish).toMatch(/<LabSpread>/);
		expect(finish).toMatch(/\{#snippet article\(\)\}/);
		expect(finish).toMatch(/class="finish card"/);
		expect(finish).not.toMatch(/\{#snippet well\(\)\}/);
	});

	it('puts the review card ahead of stats during a sitting and keeps backup off the page', () => {
		expect(review).toMatch(/reviewChrome\(/);
		expect(review).not.toMatch(/backupPanel/);
		expect(review).not.toMatch(/ProgressBackup/);
		expect(sitting).toMatch(/\{:else if alreadyDone\}/);
		expect(review).not.toMatch(/type the romanization/);
	});

	it('archives completed labs and inverts the next-up card like a button', () => {
		const homeCss = styleBlock(home);
		const railCss = styleBlock(labIndexRail);
		const previewCss = styleBlock(labPreview);

		expect(home).toMatch(/class:now=\{card\.startHere\}/);
		expect(home).not.toMatch(/chip-status ok/);
		expect(home).toMatch(/chip-status go/);
		expect(homeCss).toMatch(/\.lab\.now\s*\{[^}]*background:\s*var\(--accent\)/s);
		expect(homeCss).toMatch(/\.lab\.now\s*\{[^}]*color:\s*var\(--accent-ink\)/s);
		expect(homeCss).toMatch(/\.lab\.now \.num\s*\{[^}]*var\(--accent-ink\)/s);
		expect(homeCss).not.toMatch(/\.lab\.done \.num\s*\{[^}]*var\(--good\)/s);
		expect(homeCss).toMatch(/\.lab\.done \.num\s*\{[^}]*var\(--ink-faint\)/s);
		expect(homeCss).toMatch(/a\.lab:hover[\s\S]*translateY\(-2px\)/);
		expect(homeCss).not.toMatch(/a\.lab\.done:hover\s*\{[^}]*transform:\s*none/s);
		expect(homeCss).toMatch(/a\.lab\.now:hover\s*\{[^}]*var\(--accent-ink\)/s);
		expect(homeCss).toMatch(/\.lab\.now \.chip-status\.go\s*\{[^}]*background:\s*var\(--accent-ink\)/s);

		expect(railCss).toMatch(/\.num\.go\s*\{[^}]*background:\s*var\(--accent\)/s);
		expect(railCss).toMatch(/\.num\.go\s*\{[^}]*color:\s*var\(--accent-ink\)/s);
		expect(railCss).not.toMatch(/\.num\.done\s*\{[^}]*var\(--good\)/s);
		expect(railCss).toMatch(/\.num\.done\s*\{[^}]*var\(--ink-faint\)/s);

		expect(previewCss).toMatch(/\.chip\[data-kind='start'\]\s*\{[^}]*var\(--accent-ink\)/s);
		expect(previewCss).not.toMatch(/\.chip\[data-kind='done'\]/);
	});

	it('paints due and resume rose, and keeps primary actions moss', () => {
		const homeCss = styleBlock(home);
		const layoutCss = styleBlock(layout);
		const reviewCss = styleBlock(review);
		expect(home).toMatch(/chip-status due/);
		expect(homeCss).toMatch(/\.chip-status\.due\s*\{[^}]*var\(--rose\)/s);
		expect(homeCss).toMatch(/\.lab\.resume\s*\{[^}]*var\(--rose\)/s);
		expect(homeCss).toMatch(/a\.lab\.resume:hover\s*\{[^}]*var\(--rose\)/s);
		expect(homeCss).toMatch(/\.chip-status\.go\s*\{[^}]*var\(--accent\)/s);
		expect(layoutCss).toMatch(/\.badge\s*\{[^}]*var\(--rose\)/s);
		expect(layoutCss).toMatch(/nav a\.active\s*\{[^}]*var\(--accent\)/s);
		expect(reviewCss).toMatch(/\.stat\.hot\s*\{[^}]*var\(--rose\)/s);
	});

	it('ships PNG raster icons and OG with a moss favicon, not 태극 red marks', () => {
		const rasters = ['icon-192.png', 'apple-touch-icon.png', 'icon-maskable.png', 'og.png'] as const;

		for (const name of rasters) {
			const path = fileURLToPath(new URL(`../../static/${name}`, import.meta.url));
			expect(existsSync(path)).toBe(true);
			const bytes = readFileSync(path);
			expect(bytes.length).toBeGreaterThan(1000);
			expect(bytes[0]).toBe(0x89);
			expect(bytes[1]).toBe(0x50);
			expect(bytes[2]).toBe(0x4e);
			expect(bytes[3]).toBe(0x47);
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
		expect(layout).toMatch(/name="twitter:description"/);
		expect(layout).toMatch(/property="og:image:alt"/);
		expect(layout).toMatch(/name="twitter:image:alt"/);
		expect(layout).toMatch(/OG_IMAGE_ALT/);
		expect(layout).toMatch(/SITE_DESCRIPTION/);
		expect(appHtml).toMatch(/manifest-dark\.webmanifest/);
		expect(appHtml).toMatch(/prefers-color-scheme:\s*dark/);
		expect(appHtml).toContain('%%DESIGN_PAPER_LIGHT%%');
		expect(appHtml).not.toContain(BOOT_PLACEHOLDER);
		expect(appHtml).toMatch(/theme-boot\.js/);
		writeManifests();
		const resolvedHtml = applyDesignSystem(appHtml, LOOKS, activeSystem);
		expect(resolvedHtml).toContain(activeSystem.light.paper);
		expect(resolvedHtml).toContain(activeSystem.dark.paper);
		const bootPath = new URL('../../static/theme-boot.js', import.meta.url);
		expect(existsSync(bootPath)).toBe(true);
		expect(readFileSync(bootPath, 'utf8')).toMatch(
			/querySelector\('meta\[name="theme-color"\]\[data-resolved\]'\)/
		);
		expect(manifest).toContain(`"theme_color": "${activeSystem.light.paper}"`);
		const darkPath = new URL('../../static/manifest-dark.webmanifest', import.meta.url);
		expect(existsSync(darkPath)).toBe(true);
		const manifestDark = readFileSync(darkPath, 'utf8');
		expect(manifestDark).toContain(`"theme_color": "${activeSystem.dark.paper}"`);
		expect(manifestDark).toContain(`"background_color": "${activeSystem.dark.paper}"`);
	});

	it('keeps one unscoped theme-color so in-app theme can update browser chrome', () => {
		const tags = appHtml.match(/<meta\b[^>]*\bname="theme-color"[^>]*>/g) ?? [];
		expect(tags).toHaveLength(1);
		expect(tags[0]).toMatch(/\bdata-resolved\b/);
		expect(tags[0]).not.toMatch(/\bmedia=/);
		expect(appHtml).not.toMatch(/name="theme-color"[^>]*\bmedia=/);
		writeManifests();
		const boot = readFileSync(new URL('../../static/theme-boot.js', import.meta.url), 'utf8');
		expect(boot).toMatch(/querySelector\('meta\[name="theme-color"\]\[data-resolved\]'\)/);
	});

	it('sizes eyebrow chrome at 0.75rem so small uppercase type clears APCA', () => {
		expect(appCss).toMatch(/\.eyebrow\s*\{[^}]*font-size:\s*0\.75rem/s);
		expect(styleBlock(review)).toMatch(/\.answer-label\s*\{[^}]*font-size:\s*0\.75rem/s);
		expect(styleBlock(review)).toMatch(/\.tag\s*\{[^}]*font-size:\s*0\.75rem/s);
		expect(styleBlock(review)).toMatch(/\.v\s*\{[^}]*font-size:\s*0\.75rem/s);
		expect(sittingCss).toMatch(/\.verdict\s*\{[^}]*font-size:\s*0\.75rem/s);
		expect(styleBlock(options)).toMatch(/\.key\s*\{[^}]*font-size:\s*0\.75rem/s);
		expect(styleBlock(slots)).toMatch(/\.slot-name\s*\{[^}]*font-size:\s*0\.75rem/s);
		expect(styleBlock(tray)).toMatch(/\.mark\s*\{[^}]*font-size:\s*0\.75rem/s);
	});

	it('keeps phone header tab hit boxes from sharing a 0.1rem gutter', () => {
		expect(styleBlock(layout)).toMatch(
			/@media \(max-width: 30rem\)[\s\S]*?nav\s*\{[^}]*gap:\s*0\.35rem/s
		);
		expect(styleBlock(layout)).not.toMatch(
			/@media \(max-width: 30rem\)[\s\S]*?nav\s*\{[^}]*gap:\s*0\.1rem/s
		);
	});

	it('sets Settings display headings to the shipped Newsreader italic weight', () => {
		expect(styleBlock(settingsPage)).toMatch(/\.head h1\s*\{[^}]*font-weight:\s*400/s);
		expect(styleBlock(settingsPage)).toMatch(
			/\.appearance h2,\s*\.backup h2\s*\{[^}]*font-weight:\s*400/s
		);
		expect(styleBlock(settingsPage)).not.toMatch(/font-weight:\s*600/);
		expect(styleBlock(lookPicker)).toMatch(/legend\s*\{[^}]*font-weight:\s*400/s);
		expect(styleBlock(lookPicker)).toMatch(/\.look-name\s*\{[^}]*font-weight:\s*400/s);
		expect(styleBlock(lookPicker)).toMatch(/legend\s*\{[^}]*font-style:\s*italic/s);
		expect(styleBlock(lookPicker)).toMatch(/\.look-name\s*\{[^}]*font-style:\s*italic/s);
	});

	it('gives generic links a real pressed translate, not a no-op', () => {
		expect(appCss).toMatch(/a:active:not\(\.btn\)\s*\{[^}]*translateY\(1px\)/s);
		expect(appCss).toMatch(
			/@media \(prefers-reduced-motion: reduce\)[\s\S]*?a:active:not\(\.btn\)\s*\{[^}]*transform:\s*none/s
		);
	});

	it('contains overscroll on confirm dialogs and the locked-lab popover', () => {
		expect(styleBlock(progressBackup)).toMatch(/\.confirm\s*\{[^}]*overscroll-behavior:\s*contain/s);
		expect(sittingCss).toMatch(/\.restart-confirm\s*\{[^}]*overscroll-behavior:\s*contain/s);
		expect(styleBlock(lockedLabPopover)).toMatch(/\.pop\s*\{[^}]*overscroll-behavior:\s*contain/s);
	});

	it('passes PUBLIC_SITE_URL into the Railway image build so prerendered OG tags are absolute', () => {
		const dockerfile = readFileSync(new URL('../../../Dockerfile', import.meta.url), 'utf8');
		expect(dockerfile).toMatch(/ARG PUBLIC_SITE_URL/);
		expect(dockerfile).toMatch(/ENV PUBLIC_SITE_URL=/);
		expect(dockerfile.indexOf('ARG PUBLIC_SITE_URL')).toBeLessThan(dockerfile.indexOf('RUN pnpm build'));
	});

	it('keeps pip-rail attach in sitting chrome without freezing LabRunner import paths', () => {
		expect(sitting).toMatch(/attachPipRail/);
		expect(sitting).toMatch(/attachModalDialog/);
	});
});
