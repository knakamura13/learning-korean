import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { designSystemCss } from '../css';
import {
	assertPairings,
	BORDER_PAIRINGS,
	paletteStates,
	TEXT_PAIRINGS
} from '../palettePairings';
import { watercolor } from './watercolor';

describe('watercolor', () => {
	it('is paper, indigo, and coral from the Watercolor pigment guide', () => {
		expect(watercolor.id).toBe('watercolor');
		expect(watercolor.name).toBe('Watercolor');
		expect(watercolor.light.paper.toLowerCase()).toBe('#f9f6f2');
		expect(watercolor.light.paperRaised.toLowerCase()).toBe('#fffef8');
		expect(watercolor.light.paperSunk.toLowerCase()).toBe('#f5f0e8');
		expect(watercolor.light.accent.toLowerCase()).toBe('#444c5e');
		expect(watercolor.light.accentInk.toLowerCase()).toBe('#fffef8');
		expect(watercolor.light.rose.toLowerCase()).toBe('#76403a');
		expect(watercolor.dark.paper.toLowerCase()).toBe('#1a1e26');
		expect(watercolor.dark.accent.toLowerCase()).toBe('#b5bfcc');
		expect(watercolor.dark.rose.toLowerCase()).toBe('#e8a8a2');
	});

	it('uses Cormorant Garamond for display and Lora for reading', () => {
		expect(watercolor.type.serif).toContain('Cormorant Garamond');
		expect(watercolor.type.sans).toContain('Lora');
		expect(watercolor.type.hangul).toContain('Noto Sans KR');
		expect(watercolor.leading).toBe('1.7');
	});

	it('keeps painted palette pairings across schemes and contrast-more', () => {
		const states = paletteStates(watercolor);
		assertPairings(states, TEXT_PAIRINGS);
		assertPairings(states, BORDER_PAIRINGS);
	});

	it('self-hosts Watercolor Latin faces next to Hangul', () => {
		const fontsDir = new URL('../../../../static/fonts/', import.meta.url);
		for (const face of watercolor.fonts) {
			if (!face.file) continue;
			expect(existsSync(new URL(face.file, fontsDir)), face.file).toBe(true);
		}
		const families = watercolor.fonts.map((face) => face.family);
		expect(families).toContain('Cormorant Garamond');
		expect(families).toContain('Lora');
		expect(families).toContain('Noto Sans KR');
		expect(watercolor.fonts.some((face) => face.style === 'italic')).toBe(true);
	});

	it('loads Latin faces as optional with metric-matched local fallbacks', () => {
		const latin = watercolor.fonts.filter(
			(face) => face.file && face.family !== 'Noto Sans KR' && face.family !== 'Noto Serif KR'
		);
		expect(latin.length).toBeGreaterThan(0);
		for (const face of latin) {
			expect(face.display, face.file).toBe('optional');
		}

		const cormorant = watercolor.fonts.filter((face) => face.family === 'Cormorant Garamond Fallback');
		const lora = watercolor.fonts.filter((face) => face.family === 'Lora Fallback');
		expect(cormorant.map((face) => face.style).sort()).toEqual(['italic', 'normal']);
		expect(lora.map((face) => face.style).sort()).toEqual(['italic', 'normal']);
		for (const face of cormorant) {
			expect(face).toMatchObject({
				ascentOverride: '92.4%',
				descentOverride: '28.7%',
				lineGapOverride: '0%'
			});
			expect(face.file).toBeUndefined();
			expect(face.local).toEqual(['Iowan Old Style', 'Palatino Linotype', 'Palatino', 'Georgia']);
		}
		for (const face of lora) {
			expect(face).toMatchObject({
				ascentOverride: '100.6%',
				descentOverride: '27.4%',
				lineGapOverride: '0%'
			});
			expect(face.file).toBeUndefined();
		}
		expect(watercolor.type.serif).toMatch(/'Cormorant Garamond Fallback'/);
		expect(watercolor.type.sans).toMatch(/'Lora Fallback'/);

		const css = designSystemCss(watercolor);
		expect(css).toContain('font-display: optional');
		expect(css).not.toMatch(/font-display:\s*swap/);
		expect(css).toContain('ascent-override: 92.4%');
		expect(css).toContain('ascent-override: 100.6%');
	});

	it('puts indigo and coral contrast-more deltas on the system, not a full palette dump', () => {
		expect(watercolor.contrastMoreLight).toMatchObject({
			accent: '#2d3748',
			rose: '#6b3532'
		});
		expect(watercolor.contrastMoreDark).toMatchObject({
			accent: '#c4cad0',
			rose: '#f0c4c0'
		});
		const css = designSystemCss(watercolor);
		expect(css).toContain('--accent: #2d3748');
		expect(css).toContain('--rose: #6b3532');
		expect(css).not.toContain('--accent: #8a2a22');
		expect(css).not.toContain('--accent: #1e3d2c');
	});
});
