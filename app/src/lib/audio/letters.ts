import { assets } from '$app/paths';
import {
	LEADS,
	REPRESENTATIVE,
	VOWELS,
	batchimSound,
	type Lead,
	type Representative,
	type Vowel
} from '$lib/domain/hangul';
import { RECORDED } from './recorded';

export type AudioSlot = 'lead' | 'vowel' | 'final';

export interface LetterSources {
	opus: string;
	mp3: string;
}

/*
 * Filename contract for native-speaker letter recordings.
 *
 * The synthesized clips that used to live at these URLs were removed on
 * 2026-08-22: they were meaningless machine noise, not Korean, and playing
 * them taught nothing. The slug maps below are kept deliberately — they are
 * the TARGET contract that real recordings land on. When Sally (a native
 * speaker) records the letters, `app/scripts/ingest-recordings.mjs` encodes
 * her takes to `static/audio/<dir>/<slug>.{opus,mp3}` and regenerates
 * `./recorded.ts`. Until a slug is in RECORDED, `letterAudioSources` returns
 * null and the UI renders no play button at all (see PlayButton.svelte).
 */
export const LEAD_AUDIO_SLUG: Record<Lead, string> = {
	ㄱ: 'g', ㄲ: 'kk', ㄴ: 'n', ㄷ: 'd', ㄸ: 'tt', ㄹ: 'r', ㅁ: 'm',
	ㅂ: 'b', ㅃ: 'pp', ㅅ: 's', ㅆ: 'ss', ㅇ: 'silent', ㅈ: 'j', ㅉ: 'jj',
	ㅊ: 'ch', ㅋ: 'k', ㅌ: 't', ㅍ: 'p', ㅎ: 'h'
};

export const VOWEL_AUDIO_SLUG: Record<Vowel, string> = {
	ㅏ: 'a', ㅐ: 'ae', ㅑ: 'ya', ㅒ: 'yae', ㅓ: 'eo', ㅔ: 'e', ㅕ: 'yeo',
	ㅖ: 'ye', ㅗ: 'o', ㅘ: 'wa', ㅙ: 'wae', ㅚ: 'oe', ㅛ: 'yo', ㅜ: 'u',
	ㅝ: 'wo', ㅞ: 'we', ㅟ: 'wi', ㅠ: 'yu', ㅡ: 'eu', ㅢ: 'ui', ㅣ: 'i'
};

export const FINAL_AUDIO_SLUG: Record<Representative, string> = {
	ㄱ: 'k', ㄴ: 'n', ㄷ: 't', ㄹ: 'l', ㅁ: 'm', ㅂ: 'p', ㅇ: 'ng'
};

function pair(dir: string, slug: string): LetterSources | null {
	if (!RECORDED.has(`${dir}/${slug}`)) return null;
	return {
		opus: `${assets}/audio/${dir}/${slug}.opus`,
		mp3: `${assets}/audio/${dir}/${slug}.mp3`
	};
}

export function letterAudioSources(jamo: string, slot: AudioSlot): LetterSources | null {
	switch (slot) {
		case 'lead': {
			if (!(LEADS as readonly string[]).includes(jamo)) return null;
			return pair('consonants', LEAD_AUDIO_SLUG[jamo as Lead]);
		}
		case 'vowel': {
			if (!(VOWELS as readonly string[]).includes(jamo)) return null;
			return pair('vowels', VOWEL_AUDIO_SLUG[jamo as Vowel]);
		}
		case 'final': {
			const rep = batchimSound(jamo);
			if (!rep) return null;
			if (!(REPRESENTATIVE as readonly string[]).includes(rep)) return null;
			return pair('finals', FINAL_AUDIO_SLUG[rep]);
		}
		default: {
			const _never: never = slot;
			return _never;
		}
	}
}
