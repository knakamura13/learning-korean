import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../contrast';
import { taegeuk } from './taegeuk';
import type { DesignSystem } from '../types';

function assertReadableCaptionInk(system: DesignSystem) {
	expect(contrastRatio(system.light.inkFaint, system.light.paper)).toBeGreaterThanOrEqual(7);
	expect(contrastRatio(system.dark.inkFaint, system.dark.paper)).toBeGreaterThanOrEqual(7);
}

describe('taegeuk', () => {
	it('keeps the former paper colours', () => {
		expect(taegeuk.light.paper.toLowerCase()).toBe('#fffef9');
		expect(taegeuk.dark.paper.toLowerCase()).toBe('#131316');
		assertReadableCaptionInk(taegeuk);
	});
});
