import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { activeSystem } from '../active';
import { designSystemCss } from '../css';
import {
	assertPairings,
	BORDER_PAIRINGS,
	paletteStates,
	TEXT_PAIRINGS
} from '../palettePairings';
import { academia } from './academia';

describe('academia', () => {
	it('is Light Academia cream and Dark Academia brown paper', () => {
		expect(academia.id).toBe('academia');
		expect(academia.name).toBe('Academia');
		expect(academia.light.paper.toLowerCase()).toBe('#faf6ee');
		expect(academia.light.paperRaised.toLowerCase()).toBe('#fff9f0');
		expect(academia.light.paperSunk.toLowerCase()).toBe('#f5efe3');
		expect(academia.dark.paper.toLowerCase()).toBe('#2a1a0a');
		expect(academia.dark.paperRaised.toLowerCase()).toBe('#3d2914');
		expect(academia.dark.paperSunk.toLowerCase()).toBe('#1f1208');
	});

	it('uses walnut / lifted burgundy for actions and bronze / honey for rose', () => {
		expect(academia.light.accent.toLowerCase()).toBe('#5c3d2e');
		expect(academia.light.accentInk.toLowerCase()).toBe('#faf6ee');
		expect(academia.light.rose.toLowerCase()).toBe('#654911');
		expect(academia.dark.accent.toLowerCase()).toBe('#e8aaa4');
		expect(academia.dark.accentInk.toLowerCase()).toBe('#2a1a0a');
		expect(academia.dark.rose.toLowerCase()).toBe('#dab55e');
		expect(academia.shape.rSm).toBe('0px');
		expect(academia.shape.rMd).toBe('0px');
		expect(academia.shape.rLg).toBe('0px');
		expect(academia.shape.rPill).toBe('0px');
	});

	it('keeps light-mode links a distinct ink-blue so hover is not a no-op', () => {
		expect(academia.light.blue.toLowerCase()).not.toBe(academia.light.accent.toLowerCase());
		expect(academia.light.blue.toLowerCase()).toBe('#3a4a62');
		expect(academia.light.blueSoft.toLowerCase()).not.toBe(academia.light.accentSoft.toLowerCase());
	});

	it('uses Cormorant for display, Libre Baskerville for serif, and Lora for reading', () => {
		expect(academia.type.display).toContain('Cormorant Garamond');
		expect(academia.type.serif).toContain('Libre Baskerville');
		expect(academia.type.sans).toContain('Lora');
		expect(academia.type.hangul).toContain('Noto Sans KR');
		expect(academia.leading).toBe('1.75');
	});

	it('keeps painted palette pairings across schemes and contrast-more', () => {
		const states = paletteStates(academia);
		assertPairings(states, TEXT_PAIRINGS);
		assertPairings(states, BORDER_PAIRINGS);
	});

	it('self-hosts Academia Latin faces next to Hangul', () => {
		const fontsDir = new URL('../../../../static/fonts/', import.meta.url);
		for (const face of academia.fonts) {
			if (!face.file) continue;
			expect(existsSync(new URL(face.file, fontsDir)), face.file).toBe(true);
		}
		const families = academia.fonts.map((face) => face.family);
		expect(families).toContain('Cormorant Garamond');
		expect(families).toContain('Libre Baskerville');
		expect(families).toContain('Lora');
		expect(families).toContain('Noto Sans KR');
		expect(academia.fonts.some((face) => face.style === 'italic')).toBe(true);
	});

	it('loads Latin faces as optional with metric-matched local fallbacks', () => {
		const latin = academia.fonts.filter(
			(face) => face.file && face.family !== 'Noto Sans KR' && face.family !== 'Noto Serif KR'
		);
		expect(latin.length).toBeGreaterThan(0);
		for (const face of latin) {
			expect(face.display, face.file).toBe('optional');
		}

		const cormorant = academia.fonts.filter((face) => face.family === 'Cormorant Garamond Fallback');
		const baskerville = academia.fonts.filter((face) => face.family === 'Libre Baskerville Fallback');
		const lora = academia.fonts.filter((face) => face.family === 'Lora Fallback');
		expect(cormorant.map((face) => face.style).sort()).toEqual(['italic', 'normal']);
		expect(baskerville.map((face) => face.style).sort()).toEqual(['italic', 'normal']);
		expect(lora.map((face) => face.style).sort()).toEqual(['italic', 'normal']);
		for (const face of baskerville) {
			expect(face).toMatchObject({
				ascentOverride: '97%',
				descentOverride: '27%',
				lineGapOverride: '0%'
			});
			expect(face.file).toBeUndefined();
			expect(face.local).toEqual(['Iowan Old Style', 'Palatino Linotype', 'Palatino', 'Georgia']);
		}
		expect(academia.type.display).toMatch(/'Cormorant Garamond Fallback'/);
		expect(academia.type.serif).toMatch(/'Libre Baskerville Fallback'/);
		expect(academia.type.sans).toMatch(/'Lora Fallback'/);

		const css = designSystemCss(academia);
		expect(css).not.toMatch(/font-display:\s*swap/);
		expect(css).toContain('ascent-override: 92.4%');
		expect(css).toContain('ascent-override: 97%');
		expect(css).toContain('ascent-override: 100.6%');
	});

	it('puts walnut and bronze contrast-more deltas on the system, not a full palette dump', () => {
		expect(academia.contrastMoreLight).toMatchObject({
			accent: '#3e2518',
			rose: '#4a3b12'
		});
		expect(academia.contrastMoreDark).toMatchObject({
			accent: '#e8aaa4',
			rose: '#e0b34d'
		});
		const css = designSystemCss(academia);
		expect(css).toContain('--accent: #3e2518');
		expect(css).toContain('--rose: #4a3b12');
		expect(css).toContain('--paper: #faf6ee');
		expect(css).not.toContain('--accent: #8a2a22');
		expect(css).not.toContain('--accent: #1e3d2c');
	});

	it('is available without replacing the painted Botanical Korea look', () => {
		expect(activeSystem.id).toBe('botanicalKorea');
		expect(activeSystem.id).not.toBe(academia.id);
	});
});
