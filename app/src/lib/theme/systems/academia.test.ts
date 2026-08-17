import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../contrast';
import { academia } from './academia';
import { taegeuk } from './taegeuk';
import type { DesignSystem } from '../types';

function assertReadableCaptionInk(system: DesignSystem) {
	expect(contrastRatio(system.light.inkFaint, system.light.paper)).toBeGreaterThanOrEqual(7);
	expect(contrastRatio(system.dark.inkFaint, system.dark.paper)).toBeGreaterThanOrEqual(7);
}

describe('academia', () => {
	it('uses Light Academia cream and Dark Academia brown paper', () => {
		expect(academia.light.paper.toLowerCase()).toBe('#faf6ee');
		expect(academia.dark.paper.toLowerCase()).toBe('#2a1a0a');
	});

	it('pairs Light Academia faces with Dark Academia faces', () => {
		expect(academia.light.display).toMatch(/Cormorant Garamond/);
		expect(academia.light.serif).toMatch(/Libre Baskerville/);
		expect(academia.light.sans).toMatch(/Lora/);
		expect(academia.dark.serif).toMatch(/EB Garamond/);
		expect(academia.dark.sans).toMatch(/Source Serif 4/);
	});

	it('keeps caption-size ink-faint at least 7:1 against paper', () => {
		assertReadableCaptionInk(academia);
	});

	it('ships self-hosted Latin faces next to Noto Sans KR', () => {
		const fontsDir = new URL('../../../../static/fonts/', import.meta.url);
		for (const face of academia.fonts) {
			expect(existsSync(new URL(face.file, fontsDir)), face.file).toBe(true);
		}
	});
});

describe('taegeuk (previous system)', () => {
	it('keeps the former paper colours so it can be swapped back', () => {
		expect(taegeuk.light.paper.toLowerCase()).toBe('#fffef9');
		expect(taegeuk.dark.paper.toLowerCase()).toBe('#131316');
		assertReadableCaptionInk(taegeuk);
	});
});
