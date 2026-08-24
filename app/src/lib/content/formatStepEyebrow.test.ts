import { describe, expect, it } from 'vitest';
import { formatStepEyebrow } from './formatStepEyebrow';

describe('formatStepEyebrow', () => {
	it('removes the legacy Act prefix', () => {
		expect(formatStepEyebrow('Act 1 · 2 of 5')).toBe('2 of 5');
		expect(formatStepEyebrow('Act 2 · the mismatch')).toBe('the mismatch');
	});

	it('leaves labels without an Act prefix unchanged', () => {
		expect(formatStepEyebrow('Find the five shapes · 2 of 5')).toBe('Find the five shapes · 2 of 5');
	});
});
