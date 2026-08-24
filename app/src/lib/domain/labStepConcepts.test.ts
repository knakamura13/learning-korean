import { describe, expect, it } from 'vitest';
import { conceptsForStep, stepGlyphs } from './labStepConcepts';
import type { Step } from '$lib/content/types';

describe('stepGlyphs', () => {
	it('collects mouth and build glyphs', () => {
		expect(stepGlyphs({ type: 'mouth', zone: 'velar', jamo: 'ㄱ', do: '', teach: '' })).toEqual([
			'ㄱ'
		]);
		expect(
			stepGlyphs({
				type: 'build',
				start: 'ㄱ',
				target: 'ㅋ',
				do: '',
				teach: ''
			})
		).toEqual(['ㄱ', 'ㅋ']);
	});

	it('pulls Hangul out of choice options and stage', () => {
		const step: Step = {
			type: 'choice',
			do: '',
			teach: '',
			stage: [{ glyph: '한' }, { glyph: '국' }],
			options: ['1 Korea', '2 중국', '3 Japan'],
			answer: 0
		};
		expect(stepGlyphs(step)).toEqual(['한', '국', '중국']);
	});
});

describe('conceptsForStep', () => {
	it('maps a consonant mouth step to the lab01 review card', () => {
		const ids = conceptsForStep(
			{ type: 'mouth', zone: 'velar', jamo: 'ㄱ', do: '', teach: '' },
			['lab01']
		);
		expect(ids).toContain('c-g');
	});

	it('prefers the lab unlock tier when several fronts match', () => {
		const ids = conceptsForStep(
			{ type: 'vowel', target: 'ㅏ', do: '', teach: '' },
			['lab02']
		);
		expect(ids[0]).toBe('v-a');
	});
});
