import { assets } from '$app/paths';
import { LEADS, type Lead } from '$lib/domain/hangul';

/** ASCII filename stems under `/audio/consonants/{slug}.opus`. */
export const CONSONANT_AUDIO_SLUG: Record<Lead, string> = {
	ㄱ: 'g',
	ㄲ: 'kk',
	ㄴ: 'n',
	ㄷ: 'd',
	ㄸ: 'tt',
	ㄹ: 'r',
	ㅁ: 'm',
	ㅂ: 'b',
	ㅃ: 'pp',
	ㅅ: 's',
	ㅆ: 'ss',
	ㅇ: 'silent',
	ㅈ: 'j',
	ㅉ: 'jj',
	ㅊ: 'ch',
	ㅋ: 'k',
	ㅌ: 't',
	ㅍ: 'p',
	ㅎ: 'h'
};

export function isConsonantLead(jamo: string): jamo is Lead {
	return (LEADS as readonly string[]).includes(jamo);
}

/** Static path for a lead consonant clip, or null when this slice has none. */
export function consonantAudioSrc(jamo: string): string | null {
	if (!isConsonantLead(jamo)) return null;
	return `${assets}/audio/consonants/${CONSONANT_AUDIO_SLUG[jamo]}.opus`;
}
