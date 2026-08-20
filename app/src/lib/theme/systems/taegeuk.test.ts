import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../contrast';
import { taegeuk } from './taegeuk';

describe('taegeuk', () => {
	it('keeps the former paper colours', () => {
		expect(taegeuk.light.paper.toLowerCase()).toBe('#fffef9');
		expect(taegeuk.dark.paper.toLowerCase()).toBe('#131316');
	});

	it('keeps caption-size ink-faint at least 7:1 and action inks at 4.5:1', () => {
		const { light, dark } = taegeuk;
		expect(contrastRatio(light.inkFaint, light.paper)).toBeGreaterThanOrEqual(7);
		expect(contrastRatio(dark.inkFaint, dark.paper)).toBeGreaterThanOrEqual(7);
		expect(contrastRatio(light.accent, light.accentInk)).toBeGreaterThanOrEqual(4.5);
		expect(contrastRatio(dark.accent, dark.accentInk)).toBeGreaterThanOrEqual(4.5);
		for (const name of ['rose', 'good', 'blue', 'warn'] as const) {
			expect(contrastRatio(light[name], light.paper)).toBeGreaterThanOrEqual(4.5);
			expect(contrastRatio(dark[name], dark.paper)).toBeGreaterThanOrEqual(4.5);
		}
	});

	it('owns Hangul as a webfont on the system, not as a CSS special case', () => {
		const hangul = taegeuk.fonts.find((face) => face.file === 'NotoSansKR-subset.woff2');
		expect(hangul).toMatchObject({
			family: 'Noto Sans KR',
			weight: '400 600',
			display: 'optional'
		});
		expect(taegeuk.type.hangul).toContain('Noto Sans KR');
	});

	it('aliases rose to accent so --rose is never unset', () => {
		expect(taegeuk.light.rose).toBe(taegeuk.light.accent);
		expect(taegeuk.light.roseSoft).toBe(taegeuk.light.accentSoft);
		expect(taegeuk.dark.rose).toBe(taegeuk.dark.accent);
		expect(taegeuk.dark.roseSoft).toBe(taegeuk.dark.accentSoft);
		expect(taegeuk.contrastMoreLight?.rose).toBe(taegeuk.contrastMoreLight?.accent);
		expect(taegeuk.contrastMoreDark?.rose).toBe(taegeuk.contrastMoreDark?.accent);
	});
});
