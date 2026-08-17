import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../contrast';
import { designSystemCss } from '../css';
import { botanicalKorea, LATIN_UNICODE_RANGE } from './botanicalKorea';

describe('botanicalKorea', () => {
	it('uses moss for go and mugunghwa rose for due', () => {
		expect(botanicalKorea.id).toBe('botanicalKorea');
		expect(botanicalKorea.light.accent.toLowerCase()).toBe('#315c45');
		expect(botanicalKorea.light.rose.toLowerCase()).toBe('#7a3e46');
		expect(botanicalKorea.light.paper.toLowerCase()).toBe('#faf5ee');
		expect(botanicalKorea.dark.paper.toLowerCase()).toBe('#1a2420');
	});

	it('keeps caption-size ink-faint at least 7:1 against paper', () => {
		expect(contrastRatio(botanicalKorea.light.inkFaint, botanicalKorea.light.paper)).toBeGreaterThanOrEqual(7);
		expect(contrastRatio(botanicalKorea.dark.inkFaint, botanicalKorea.dark.paper)).toBeGreaterThanOrEqual(7);
	});

	it('keeps body ink at least 4.5:1 against paper', () => {
		expect(contrastRatio(botanicalKorea.light.ink, botanicalKorea.light.paper)).toBeGreaterThanOrEqual(4.5);
		expect(contrastRatio(botanicalKorea.dark.ink, botanicalKorea.dark.paper)).toBeGreaterThanOrEqual(4.5);
	});

	it('owns Hangul as a webfont on the system, not as a CSS special case', () => {
		const hangul = botanicalKorea.fonts.find((face) => face.file === 'NotoSansKR-subset.woff2');
		expect(hangul).toMatchObject({
			family: 'Noto Sans KR',
			weight: '400 600',
			display: 'optional'
		});
		expect(botanicalKorea.type.hangul).toContain('Noto Sans KR');
		expect(botanicalKorea.type.display).toContain('Newsreader');
		expect(botanicalKorea.type.serif).toContain('Source Serif 4');
		expect(botanicalKorea.type.mono).toContain('IBM Plex Mono');
		expect(botanicalKorea.type.sans).toContain('Inter');
		expect(botanicalKorea.type.hangul).not.toMatch(/Newsreader|Source Serif|Noto Serif/);
	});

	it('self-hosts Latin woff2 subsets with a Latin unicode-range', () => {
		const fontsDir = new URL('../../../../static/fonts/', import.meta.url);
		for (const face of botanicalKorea.fonts) {
			expect(existsSync(new URL(face.file, fontsDir)), face.file).toBe(true);
		}
		const latin = botanicalKorea.fonts.filter((face) => face.file !== 'NotoSansKR-subset.woff2');
		expect(latin.map((face) => face.family)).toEqual(
			expect.arrayContaining(['Newsreader', 'Source Serif 4', 'Inter', 'IBM Plex Mono'])
		);
		for (const face of latin) {
			expect(face.unicodeRange).toBe(LATIN_UNICODE_RANGE);
		}
		const css = designSystemCss(botanicalKorea);
		expect(css).toContain('unicode-range:');
		expect(css).toContain('Newsreader-latin.woff2');
		expect(css).not.toMatch(/fonts\.googleapis|fonts\.gstatic/);
	});

	it('puts moss and rose contrast-more deltas on the system, not a full palette dump', () => {
		expect(botanicalKorea.contrastMoreLight).toMatchObject({
			accent: '#1e3d2c',
			rose: '#5c2c33'
		});
		expect(botanicalKorea.contrastMoreDark).toMatchObject({
			accent: '#c4dccb',
			rose: '#f0c8cc'
		});
		const css = designSystemCss(botanicalKorea);
		expect(css).toContain('--accent: #1e3d2c');
		expect(css).toContain('--rose: #5c2c33');
		expect(css).not.toContain('--accent: #8a2a22');
	});
});
