import { describe, expect, it } from 'vitest';
import hooksSrc from '../../hooks.server.ts?raw';
import layoutSrc from '../../routes/+layout.svelte?raw';
import pluginSrc from './vitePlugin.ts?raw';
import { designSystemCss } from './css';
import {
	applyDesignSystem,
	CSS_PLACEHOLDER,
	PAPER_PLACEHOLDER_DARK,
	PAPER_PLACEHOLDER_LIGHT
} from './placeholders';
import type { ContrastOverrides, DesignSystem, Palette } from './types';

function paint(paper: string, ink: string): Palette {
	return {
		ink,
		inkSoft: ink,
		inkFaint: ink,
		paper,
		paperSunk: paper,
		paperRaised: paper,
		rule: ink,
		ruleStrong: ink,
		accent: ink,
		accentInk: paper,
		accentSoft: paper,
		blue: ink,
		blueSoft: paper,
		good: ink,
		goodSoft: paper,
		bad: ink,
		badSoft: paper,
		warn: ink,
		warnSoft: paper,
		rose: ink,
		roseSoft: paper,
		shadow1: 'none',
		shadow2: 'none',
		shadow3: 'none'
	};
}

const contrastLight: ContrastOverrides = {
	inkFaint: '#111111',
	rule: '#222222',
	ruleStrong: '#333333',
	accent: '#444444',
	accentSoft: '#555555',
	rose: '#666666',
	roseSoft: '#777777'
};

const contrastDark: ContrastOverrides = {
	inkFaint: '#aaaaaa',
	rule: '#bbbbbb',
	ruleStrong: '#cccccc',
	accent: '#dddddd',
	accentSoft: '#eeeeee',
	rose: '#f0f0f0',
	roseSoft: '#fafafa'
};

const fixture: DesignSystem = {
	id: 'fixture',
	name: 'Fixture',
	htmlSize: '100%',
	leading: '1.5',
	shape: { rSm: '1px', rMd: '2px', rLg: '3px', rPill: '4px' },
	type: {
		serif: 'Fixture Serif',
		sans: 'Fixture Sans',
		mono: 'Fixture Mono',
		hangul: 'Fixture Hangul'
	},
	fonts: [
		{
			family: 'Test Face',
			file: 'test.woff2',
			style: 'normal',
			weight: '400 700',
			display: 'optional'
		}
	],
	light: paint('#fefefe', '#010101'),
	dark: paint('#121212', '#f5f5f5'),
	contrastMoreLight: contrastLight,
	contrastMoreDark: contrastDark
};

function contrastCss(css: string): string {
	const idx = css.indexOf('prefers-contrast');
	return idx < 0 ? '' : css.slice(idx);
}

describe('designSystemCss', () => {
	const css = designSystemCss(fixture);

	it('emits light tokens, an explicit dark theme, and system dark', () => {
		expect(css).toMatch(/:root\s*\{/);
		expect(css).toMatch(/:root\[data-theme='dark'\]/);
		expect(css).toMatch(/prefers-color-scheme:\s*dark/);
		expect(css).toContain(`--paper: ${fixture.light.paper}`);
		expect(css).toContain(`--paper: ${fixture.dark.paper}`);
	});

	it('emits webfonts from the system, including display and weight', () => {
		expect(css).toContain("font-family: 'Test Face'");
		expect(css).toContain("url('/fonts/test.woff2')");
		expect(css).toContain('font-display: optional');
		expect(css).toContain('font-weight: 400 700');
		expect(css).not.toMatch(/Noto Sans KR/);
	});

	it('declares type stacks once from DesignSystem.type, not from each palette', () => {
		expect(css).toContain('--serif: Fixture Serif');
		expect(css).toContain('--sans: Fixture Sans');
		expect(css.match(/--serif:/g)?.length).toBe(1);
	});

	it('emits look tokens for size, leading, and shape', () => {
		expect(css).toContain('--html-size: 100%');
		expect(css).toContain('--leading: 1.5');
		expect(css).toContain('--r-sm: 1px');
		expect(css).toContain('--r-pill: 4px');
	});

	it('does not emit app chrome — space, motion, measure, and focus-ring live in app.css', () => {
		expect(css).not.toMatch(/--s1:/);
		expect(css).not.toMatch(/--ease:/);
		expect(css).not.toMatch(/--fast:/);
		expect(css).not.toMatch(/--shell:/);
		expect(css).not.toMatch(/--measure:/);
		expect(css).not.toMatch(/--focus-ring:/);
	});

	it('does not emit html or body element rules', () => {
		expect(css).not.toMatch(/html\s*\{/);
		expect(css).not.toMatch(/body\s*\{/);
	});

	it('emits contrast-more as deltas, not a full palette dump', () => {
		const more = contrastCss(css);
		expect(more).toContain('--ink-faint: #111111');
		expect(more).toContain('--ink-faint: #aaaaaa');
		expect(more).not.toContain('--shadow-1:');
		expect(more).not.toContain('--serif:');
		expect(more).not.toContain('--paper:');
	});

	it('emits rose and rose-soft from the palette', () => {
		expect(css).toContain('--rose: #010101');
		expect(css).toContain('--rose-soft: #fefefe');
	});

	it('still emits dark contrast overrides when contrastMoreLight is absent', () => {
		const darkOnly: DesignSystem = {
			...fixture,
			contrastMoreLight: undefined,
			contrastMoreDark: contrastDark
		};
		const more = contrastCss(designSystemCss(darkOnly));
		expect(more).toContain('--ink-faint: #aaaaaa');
		expect(more).not.toContain('--ink-faint: #111111');
	});
});

describe('applyDesignSystem', () => {
	it('stamps paper colours and token CSS into one HTML pass', () => {
		const html = [
			`light:${PAPER_PLACEHOLDER_LIGHT}`,
			`dark:${PAPER_PLACEHOLDER_DARK}`,
			`<style>${CSS_PLACEHOLDER}</style>`
		].join('\n');
		const stamped = applyDesignSystem(html, fixture);
		expect(stamped).toContain(`light:${fixture.light.paper}`);
		expect(stamped).toContain(`dark:${fixture.dark.paper}`);
		expect(stamped).toContain('--paper: #fefefe');
		expect(stamped).not.toContain(CSS_PLACEHOLDER);
		expect(stamped).not.toContain(PAPER_PLACEHOLDER_LIGHT);
	});
});

describe('delivery', () => {
	it('stamps prerendered HTML only in the SvelteKit handle', () => {
		expect(hooksSrc).toMatch(/transformPageChunk/);
		expect(hooksSrc).toMatch(/applyDesignSystem/);
		expect(pluginSrc).toMatch(/writeManifests/);
		expect(pluginSrc).not.toMatch(/transformIndexHtml/);
		expect(pluginSrc).not.toMatch(/virtual:design-system/);
	});

	it('preloads system webfonts from the layout so asset URLs are already resolved', () => {
		expect(layoutSrc).toMatch(/activeSystem\.fonts/);
		expect(layoutSrc).toMatch(/rel="preload"/);
		expect(layoutSrc).not.toMatch(/%sveltekit\.assets%/);
	});
});
