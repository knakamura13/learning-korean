import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';

describe('contrastRatio', () => {
	it('is 21 for black on white', () => {
		expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
	});

	it('is 1 for identical colours', () => {
		expect(contrastRatio('#faf6ee', '#FAF6EE')).toBeCloseTo(1, 5);
	});
});
