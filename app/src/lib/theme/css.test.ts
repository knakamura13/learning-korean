import { describe, expect, it } from 'vitest';
import hooksSrc from '../../hooks.server.ts?raw';
import layoutSrc from '../../routes/+layout.svelte?raw';
import pluginSrc from './vitePlugin.ts?raw';
import { allDesignSystemsCss, designSystemCss } from './css';
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
	summary: 'Fixture look.',
	htmlSize: '100%',
	leading: '1.5',
	shape: { rSm: '1px', rMd: '2px', rLg: '3px', rPill: '4px' },
	type: {
		display: 'Fixture Display',
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
		expect(css).toContain('--display: Fixture Display');
		expect(css).toContain('--serif: Fixture Serif');
		expect(css).toContain('--sans: Fixture Sans');
		expect(css.match(/--serif:/g)?.length).toBe(1);
		expect(css.match(/--display:/g)?.length).toBe(1);
	});

	it('emits unicode-range when a face declares it', () => {
		const ranged = designSystemCss({
			...fixture,
			fonts: [{ ...fixture.fonts[0], unicodeRange: 'U+0000-00FF' }]
		});
		expect(ranged).toContain('unicode-range: U+0000-00FF');
	});

	it('emits local metric-matched fallback faces without a webfont URL', () => {
		const css = designSystemCss({
			...fixture,
			fonts: [
				...fixture.fonts,
				{
					family: 'Test Fallback',
					local: ['Georgia', 'Palatino'],
					style: 'italic',
					ascentOverride: '73.5%',
					descentOverride: '26.5%',
					lineGapOverride: '0%'
				}
			]
		});
		expect(css).toContain("font-family: 'Test Fallback'");
		expect(css).toContain("src: local('Georgia'), local('Palatino')");
		expect(css).toContain('ascent-override: 73.5%');
		expect(css).toContain('descent-override: 26.5%');
		expect(css).toContain('line-gap-override: 0%');
		expect(css).toContain('font-style: italic');
		expect(css).not.toContain("url('/fonts/undefined')");
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

function miniSystem(
	id: string,
	paper: string,
	contrastAccent: string,
	fonts: DesignSystem['fonts'] = []
): DesignSystem {
	return {
		id,
		name: id,
		summary: `${id} look.`,
		htmlSize: '100%',
		leading: '1.5',
		shape: { rSm: '0', rMd: '0', rLg: '0', rPill: '0' },
		type: {
			display: `${id} Display`,
			serif: `${id} Serif`,
			sans: `${id} Sans`,
			mono: `${id} Mono`,
			hangul: `${id} Hangul`
		},
		fonts,
		light: paint(paper, '#000000'),
		dark: paint('#010101', '#ffffff'),
		contrastMoreLight: { ...contrastLight, accent: contrastAccent, inkFaint: contrastAccent }
	};
}

describe('allDesignSystemsCss', () => {
	const alpha = miniSystem('alpha', '#aaaaaa', '#111111', [
		{ family: 'Shared', file: 'shared.woff2', weight: '400', display: 'swap' }
	]);
	const beta = miniSystem('beta', '#bbbbbb', '#222222', [
		{ family: 'Shared', file: 'shared.woff2', weight: '400', display: 'swap' },
		{ family: 'Beta Only', file: 'beta.woff2', weight: '700', display: 'optional' }
	]);
	const css = allDesignSystemsCss([alpha, beta], 'alpha');

	it('keeps fallback :root tokens and scopes every look including the fallback', () => {
		expect(css).toMatch(/:root\s*\{[^}]*--paper:\s*#aaaaaa/);
		expect(css).toMatch(/html\[data-look='alpha'\]\s*\{/);
		expect(css).toMatch(/html\[data-look='beta'\]\s*\{[^}]*--paper:\s*#bbbbbb/);
		expect(css).toMatch(/html\[data-look='beta'\]\[data-theme='dark'\]/);
		expect(css).not.toMatch(/html\s*\{/);
		expect(css).not.toMatch(/body\s*\{/);
	});

	it('scopes contrast-more overrides per look, not only :root', () => {
		const betaBodies = [...css.matchAll(/html\[data-look='beta'\]\s*\{([^}]*)\}/g)].map(
			(m) => m[1]
		);
		const contrastBody = betaBodies.find((body) => body.includes('--accent: #222222'));
		expect(contrastBody).toBeDefined();
		expect(contrastBody).not.toContain('#111111');
		expect(css).toMatch(/prefers-contrast:\s*more[\s\S]*html\[data-look='beta'\]/);
	});

	it('dedupes @font-face across systems on family+file+style+weight+unicodeRange', () => {
		expect(css.match(/font-family: 'Shared'/g)?.length).toBe(1);
		expect(css).toContain("font-family: 'Beta Only'");
		expect(css).toContain('font-display: optional');
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
		expect(layoutSrc).toMatch(/face\.file/);
	});
});
