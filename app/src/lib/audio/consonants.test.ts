import { describe, expect, it } from 'vitest';
import { LEADS } from '$lib/domain/hangul';
import {
	CONSONANT_AUDIO_SLUG,
	consonantAudioSrc,
	isConsonantLead
} from './consonants';
import { RECORDED } from './recorded';

describe('consonant audio mapping', () => {
	it('keeps a slug for every lab-01 lead jamo, gated on the recording set', () => {
		expect(LEADS).toHaveLength(19);
		for (const jamo of LEADS) {
			const slug = CONSONANT_AUDIO_SLUG[jamo];
			expect(slug, jamo).toBeTruthy();
			const src = consonantAudioSrc(jamo);
			if (RECORDED.has(`consonants/${slug}`)) {
				expect(src, jamo).toMatch(new RegExp(`/audio/consonants/${slug}\\.opus$`));
			} else {
				expect(src, jamo).toBeNull();
			}
		}
	});

	it('returns null when the glyph has no lead slot at all', () => {
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
});
