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

	it('includes solved jamo on mouth steps', () => {
		expect(
			stepGlyphs({
				type: 'mouth',
				zone: 'velar',
				jamo: 'ㄱ',
				solved: [{ jamo: 'ㅋ', zone: 'velar' }],
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

	it('collects assemble, vowel, fusion, cluster, flow, and read glyphs', () => {
		expect(
			stepGlyphs({
				type: 'assemble',
				target: '한',
				consonants: ['ㅎ'],
				vowels: ['ㅏ'],
				finals: ['ㄴ'],
				do: '',
				teach: ''
			})
		).toEqual(['한', 'ㅎ', 'ㅏ', 'ㄴ']);

		expect(stepGlyphs({ type: 'vowel', target: 'ㅏ', do: '', teach: '' })).toEqual(['ㅏ']);

		expect(
			stepGlyphs({
				type: 'fusion',
				target: 'ㅘ',
				first: ['ㅗ'],
				second: ['ㅏ'],
				do: '',
				teach: ''
			})
		).toEqual(['ㅘ', 'ㅗ', 'ㅏ']);

		expect(
			stepGlyphs({
				type: 'cluster',
				word: '읽다',
				cluster: 'ㄺ',
				pron: 'ㄱ',
				do: '',
				teach: ''
			})
		).toEqual(['읽다', 'ㄺ', 'ㄱ']);

		expect(stepGlyphs({ type: 'liaison', word: '한국어', do: '', teach: '' })).toEqual(['한국어']);
		expect(stepGlyphs({ type: 'contact', word: '학교', do: '', teach: '' })).toEqual(['학교']);
		expect(stepGlyphs({ type: 'hmerge', word: '좋다', do: '', teach: '' })).toEqual(['좋다']);
		expect(stepGlyphs({ type: 'flow', word: '신라', do: '', teach: '' })).toEqual(['신라']);

		expect(
			stepGlyphs({
				type: 'read',
				blocks: [{ block: '가', reading: 'ga' }, { block: '나', reading: 'na' }],
				options: ['ga na', 'ka na'],
				answer: 0,
				do: '',
				teach: ''
			})
		).toEqual(['가', '나']);
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

	it('returns no ids when the step teaches nothing matchable', () => {
		expect(conceptsForStep({ type: 'vowel', target: '', do: '', teach: '' })).toEqual([]);
	});

	it('maps cluster and read steps to deck cards', () => {
		expect(conceptsForStep({ type: 'cluster', word: '읽다', cluster: 'ㄺ', pron: 'ㄱ', do: '', teach: '' })).toContain(
			'g-ㄺ'
		);
		const readIds = conceptsForStep({
			type: 'read',
			blocks: [{ block: '가', reading: 'ga' }],
			options: ['ga'],
			answer: 0,
			do: '',
			teach: ''
		});
		expect(readIds.length).toBeGreaterThan(0);
		expect(readIds.some((id) => id.startsWith('wm-') || id.startsWith('b-'))).toBe(true);
	});

	it('uses substring deck matches when no exact front hits', () => {
		const ids = conceptsForStep(
			{ type: 'choice', do: '', teach: '', options: ['1 한'], answer: 0 },
			['lab06']
		);
		expect(ids.some((id) => id === 'p-한국어' || id.startsWith('wm-'))).toBe(true);
	});
});
