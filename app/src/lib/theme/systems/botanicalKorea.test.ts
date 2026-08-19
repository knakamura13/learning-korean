import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../contrast';
import { designSystemCss } from '../css';
import { botanicalKorea, LATIN_UNICODE_RANGE } from './botanicalKorea';

describe('botanicalKorea', () => {
	it('is the pressed-flowers paper with moss accent and mugunghwa rose', () => {
		expect(botanicalKorea.id).toBe('botanicalKorea');
		expect(botanicalKorea.light.paper.toLowerCase()).toBe('#faf5ee');
		expect(botanicalKorea.dark.paper.toLowerCase()).toBe('#1a2420');
		expect(botanicalKorea.light.accent.toLowerCase()).toBe('#315c45');
		expect(botanicalKorea.dark.accent.toLowerCase()).toBe('#a6c1ae');
		expect(botanicalKorea.light.rose.toLowerCase()).toBe('#7a3e46');
		expect(botanicalKorea.light.roseSoft.toLowerCase()).toBe('#f3e6e8');
		expect(botanicalKorea.dark.rose.toLowerCase()).toBe('#e8b4ba');
		expect(botanicalKorea.dark.roseSoft.toLowerCase()).toBe('#3a2428');
	});

	it('keeps caption-size ink-faint at least 7:1 and action inks at 4.5:1', () => {
		const { light, dark } = botanicalKorea;
		expect(contrastRatio(light.inkFaint, light.paper)).toBeGreaterThanOrEqual(7);
		expect(contrastRatio(dark.inkFaint, dark.paper)).toBeGreaterThanOrEqual(7);
		expect(contrastRatio(light.accent, light.accentInk)).toBeGreaterThanOrEqual(4.5);
		expect(contrastRatio(dark.accent, dark.accentInk)).toBeGreaterThanOrEqual(4.5);
		for (const name of ['rose', 'good', 'blue', 'warn'] as const) {
			expect(contrastRatio(light[name], light.paper)).toBeGreaterThanOrEqual(4.5);
			expect(contrastRatio(dark[name], dark.paper)).toBeGreaterThanOrEqual(4.5);
		}
	});

	it('self-hosts Hangul sans as an optional webfont and keeps a serif stack token', () => {
		const hangul = botanicalKorea.fonts.find((face) => face.file === 'NotoSansKR-subset.woff2');
		expect(hangul).toMatchObject({
			family: 'Noto Sans KR',
			weight: '400 600',
			display: 'optional'
		});
		expect(botanicalKorea.fonts.find((face) => face.file === 'NotoSerifKR-subset.woff2')).toBeUndefined();
		expect(botanicalKorea.type.hangul).toContain('Noto Sans KR');
		expect(botanicalKorea.type.hangul).not.toMatch(/Newsreader/);
		expect(botanicalKorea.type.serif).toContain('Noto Serif KR');
		expect(botanicalKorea.type.display).toContain('Newsreader');
	});

	it('self-hosts Newsreader italic with a Latin unicode-range', () => {
		const italic = botanicalKorea.fonts.find((face) => face.file === 'Newsreader-Italic-latin.woff2');
		expect(italic).toMatchObject({
			family: 'Newsreader',
			style: 'italic',
			display: 'optional',
			unicodeRange: botanicalKorea.fonts.find((face) => face.unicodeRange)?.unicodeRange
		});
		expect(botanicalKorea.fonts.find((face) => face.file === 'Newsreader-latin.woff2')).toBeUndefined();
		expect(italic?.unicodeRange).toBe(LATIN_UNICODE_RANGE);
		const css = designSystemCss(botanicalKorea);
		expect(css).toContain('Newsreader-Italic-latin.woff2');
		expect(css).not.toContain('Newsreader-latin.woff2');
		expect(css).not.toContain('NotoSerifKR-subset.woff2');
		expect(css).toContain('font-style: italic');
		expect(css).toContain('unicode-range:');
		expect(css).toContain('--display:');
		expect(css).toContain('--serif:');
		expect(css).toContain('Newsreader');
	});

	it('pairs LCP faces with local fallbacks whose vertical metrics match the webfont', () => {
		const displayFallback = botanicalKorea.fonts.find((face) => face.family === 'Newsreader Fallback');
		const hangulFallback = botanicalKorea.fonts.find((face) => face.family === 'Noto Sans KR Fallback');
		expect(displayFallback).toMatchObject({
			style: 'italic',
			ascentOverride: '73.5%',
			descentOverride: '26.5%',
			lineGapOverride: '0%'
		});
		expect(displayFallback?.file).toBeUndefined();
		expect(displayFallback?.local).toEqual([
			'Iowan Old Style',
			'Palatino Linotype',
			'Palatino',
			'Georgia'
		]);
		expect(hangulFallback).toMatchObject({
			ascentOverride: '116%',
			descentOverride: '28.8%',
			lineGapOverride: '0%'
		});
		expect(hangulFallback?.local).toEqual(['Apple SD Gothic Neo', 'Malgun Gothic', 'Nanum Gothic']);
		expect(botanicalKorea.type.display).toMatch(/'Newsreader Fallback'/);
		expect(botanicalKorea.type.hangul).toMatch(/'Noto Sans KR Fallback'/);
		const css = designSystemCss(botanicalKorea);
		expect(css).toContain("src: local('Iowan Old Style')");
		expect(css).toContain('ascent-override: 73.5%');
		expect(css).toContain('ascent-override: 116%');
	});

	it('puts moss and rose contrast-more deltas on the system, not a full palette dump', () => {
		expect(botanicalKorea.contrastMoreLight).toMatchObject({
			accent: '#1e3d2c',
			rose: '#5c2c33'
		});
		expect(botanicalKorea.contrastMoreDark).toMatchObject({
			accent: '#c5dbc5',
			rose: '#f0c9ce'
		});
		const css = designSystemCss(botanicalKorea);
		expect(css).toContain('--accent: #1e3d2c');
		expect(css).toContain('--rose: #5c2c33');
		expect(css).not.toContain('--accent: #8a2a22');
	});
});
