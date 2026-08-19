import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../contrast';
import { designSystemCss } from '../css';
import { watercolor } from './watercolor';

describe('watercolor', () => {
	it('is paper, indigo, and coral from the Watercolor pigment guide', () => {
		expect(watercolor.id).toBe('watercolor');
		expect(watercolor.name).toBe('Watercolor');
		expect(watercolor.light.paper.toLowerCase()).toBe('#f9f6f2');
		expect(watercolor.light.paperRaised.toLowerCase()).toBe('#fffef8');
		expect(watercolor.light.paperSunk.toLowerCase()).toBe('#f5f0e8');
		expect(watercolor.light.accent.toLowerCase()).toBe('#4a5568');
		expect(watercolor.light.accentInk.toLowerCase()).toBe('#fffef8');
		expect(watercolor.light.rose.toLowerCase()).toBe('#8a4a44');
		expect(watercolor.dark.paper.toLowerCase()).toBe('#1a1e26');
		expect(watercolor.dark.accent.toLowerCase()).toBe('#a8b4c4');
		expect(watercolor.dark.rose.toLowerCase()).toBe('#e8a8a2');
	});

	it('uses Cormorant Garamond for display and Lora for reading', () => {
		expect(watercolor.type.serif).toContain('Cormorant Garamond');
		expect(watercolor.type.sans).toContain('Lora');
		expect(watercolor.type.hangul).toContain('Noto Sans KR');
		expect(watercolor.leading).toBe('1.7');
	});

	it('keeps caption-size ink-faint at least 7:1 and action inks at 4.5:1', () => {
		const { light, dark } = watercolor;
		expect(contrastRatio(light.inkFaint, light.paper)).toBeGreaterThanOrEqual(7);
		expect(contrastRatio(dark.inkFaint, dark.paper)).toBeGreaterThanOrEqual(7);
		expect(contrastRatio(light.accent, light.accentInk)).toBeGreaterThanOrEqual(4.5);
		expect(contrastRatio(dark.accent, dark.accentInk)).toBeGreaterThanOrEqual(4.5);
		for (const name of ['rose', 'good', 'blue', 'warn'] as const) {
			expect(contrastRatio(light[name], light.paper)).toBeGreaterThanOrEqual(4.5);
			expect(contrastRatio(dark[name], dark.paper)).toBeGreaterThanOrEqual(4.5);
		}
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
