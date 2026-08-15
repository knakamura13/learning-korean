import { describe, expect, it } from 'vitest';
import { LEADS } from '$lib/domain/hangul';
import {
	CONSONANT_AUDIO_SLUG,
	consonantAudioSrc,
	isConsonantLead
} from './consonants';

const clipModules = import.meta.glob('../../../static/audio/consonants/*.opus', {
	eager: true,
	query: '?url',
	import: 'default'
}) as Record<string, string>;

describe('consonant audio mapping', () => {
	it('maps every lab-01 lead jamo to a static opus path', () => {
		expect(LEADS).toHaveLength(19);
		for (const jamo of LEADS) {
			const src = consonantAudioSrc(jamo);
			expect(src, jamo).toBe(`/audio/consonants/${CONSONANT_AUDIO_SLUG[jamo]}.opus`);
		}
	});

	it('returns null when there is no clip for the glyph', () => {
		expect(consonantAudioSrc('ㅏ')).toBeNull();
		expect(consonantAudioSrc('가')).toBeNull();
		expect(consonantAudioSrc('')).toBeNull();
		expect(consonantAudioSrc('ㄱㄱ')).toBeNull();
	});

	it('treats the 19 leads as audio subjects and nothing else', () => {
		expect(isConsonantLead('ㄱ')).toBe(true);
		expect(isConsonantLead('ㅇ')).toBe(true);
		expect(isConsonantLead('ㅏ')).toBe(false);
		expect(isConsonantLead('ㄳ')).toBe(false);
	});

	it('ships a file for every mapped slug', () => {
		const names = Object.keys(clipModules).map((p) => p.split('/').pop());
		for (const jamo of LEADS) {
			const slug = CONSONANT_AUDIO_SLUG[jamo];
			expect(names, slug).toContain(`${slug}.opus`);
		}
	});
});
