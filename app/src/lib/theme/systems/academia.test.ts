import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { activeSystem } from '../active';
import { contrastRatio } from '../contrast';
import { designSystemCss } from '../css';
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
		expect(academia.light.rose.toLowerCase()).toBe('#6b4e12');
		expect(academia.dark.accent.toLowerCase()).toBe('#c47a82');
		expect(academia.dark.accentInk.toLowerCase()).toBe('#2a1a0a');
		expect(academia.dark.rose.toLowerCase()).toBe('#d4a843');
		expect(academia.shape.rSm).toBe('0px');
		expect(academia.shape.rMd).toBe('0px');
		expect(academia.shape.rLg).toBe('0px');
		expect(academia.shape.rPill).toBe('0px');
	});

	it('uses Cormorant for display, Libre Baskerville for serif, and Lora for reading', () => {
		expect(academia.type.display).toContain('Cormorant Garamond');
		expect(academia.type.serif).toContain('Libre Baskerville');
		expect(academia.type.sans).toContain('Lora');
		expect(academia.type.hangul).toContain('Noto Sans KR');
		expect(academia.leading).toBe('1.75');
	});

	it('keeps caption-size ink-faint at least 7:1 and action inks at 4.5:1', () => {
		const { light, dark } = academia;
		expect(contrastRatio(light.inkFaint, light.paper)).toBeGreaterThanOrEqual(7);
		expect(contrastRatio(dark.inkFaint, dark.paper)).toBeGreaterThanOrEqual(7);
		expect(contrastRatio(light.accent, light.accentInk)).toBeGreaterThanOrEqual(4.5);
		expect(contrastRatio(dark.accent, dark.accentInk)).toBeGreaterThanOrEqual(4.5);
		for (const name of ['rose', 'good', 'blue', 'warn'] as const) {
			expect(contrastRatio(light[name], light.paper)).toBeGreaterThanOrEqual(4.5);
			expect(contrastRatio(dark[name], dark.paper)).toBeGreaterThanOrEqual(4.5);
		}
	});

	it('self-hosts Academia Latin faces next to Hangul', () => {
		const fontsDir = new URL('../../../../static/fonts/', import.meta.url);
		for (const face of academia.fonts) {
			expect(existsSync(new URL(face.file, fontsDir)), face.file).toBe(true);
		}
		const families = academia.fonts.map((face) => face.family);
		expect(families).toContain('Cormorant Garamond');
		expect(families).toContain('Libre Baskerville');
		expect(families).toContain('Lora');
		expect(families).toContain('Noto Sans KR');
		expect(academia.fonts.some((face) => face.style === 'italic')).toBe(true);
	});

	it('puts walnut and bronze contrast-more deltas on the system, not a full palette dump', () => {
		expect(academia.contrastMoreLight).toMatchObject({
			accent: '#3e2518',
			rose: '#4a3b12'
		});
		expect(academia.contrastMoreDark).toMatchObject({
			accent: '#e8a8a2',
			rose: '#dead40'
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
