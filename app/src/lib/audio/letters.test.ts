import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CLUSTERS, LEADS, REPRESENTATIVE, VOWELS, batchimSound } from '$lib/domain/hangul';
import {
	FINAL_AUDIO_SLUG,
	LEAD_AUDIO_SLUG,
	VOWEL_AUDIO_SLUG,
	letterAudioSources,
	type AudioSlot
} from './letters';
import { consonantAudioSrc } from './consonants';

const audioRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../static/audio');

describe('letterAudioSources', () => {
	it('maps every lead in the lead slot to consonants/{slug}.opus and .mp3', () => {
		expect(LEADS).toHaveLength(19);
		for (const jamo of LEADS) {
			const src = letterAudioSources(jamo, 'lead');
			expect(src, jamo).not.toBeNull();
			expect(src!.opus).toMatch(
				new RegExp(`/audio/consonants/${LEAD_AUDIO_SLUG[jamo]}\\.opus$`)
			);
			expect(src!.mp3).toMatch(
				new RegExp(`/audio/consonants/${LEAD_AUDIO_SLUG[jamo]}\\.mp3$`)
			);
		}
	});

	it('maps every vowel in the vowel slot', () => {
		expect(VOWELS).toHaveLength(21);
		for (const jamo of VOWELS) {
			const src = letterAudioSources(jamo, 'vowel');
			expect(src, jamo).not.toBeNull();
			expect(src!.opus).toMatch(
				new RegExp(`/audio/vowels/${VOWEL_AUDIO_SLUG[jamo]}\\.opus$`)
			);
		}
	});

	it('shares one final clip per batchimSound representative', () => {
		for (const r of REPRESENTATIVE) {
			const src = letterAudioSources(r, 'final');
			expect(src, r).not.toBeNull();
			expect(src!.opus).toMatch(
				new RegExp(`/audio/finals/${FINAL_AUDIO_SLUG[r]}\\.opus$`)
			);
		}
		expect(letterAudioSources('ㄲ', 'final')?.opus).toBe(letterAudioSources('ㄱ', 'final')?.opus);
		expect(letterAudioSources('ㅅ', 'final')?.opus).toBe(letterAudioSources('ㄷ', 'final')?.opus);
		for (const c of CLUSTERS) {
			const rep = batchimSound(c);
			expect(letterAudioSources(c, 'final')?.opus).toBe(letterAudioSources(rep, 'final')?.opus);
		}
	});

	it('returns null when the slot does not match the glyph', () => {
		expect(letterAudioSources('ㅏ', 'lead')).toBeNull();
		expect(letterAudioSources('ㄱ', 'vowel')).toBeNull();
		expect(letterAudioSources('ㅏ', 'final')).toBeNull();
		expect(letterAudioSources('', 'lead')).toBeNull();
		expect(letterAudioSources('가', 'lead')).toBeNull();
	});

	it('keeps consonantAudioSrc as the lead opus path', () => {
		expect(consonantAudioSrc('ㄱ')).toMatch(/\/audio\/consonants\/g\.opus$/);
		expect(consonantAudioSrc('ㅏ')).toBeNull();
	});

	it('ships opus and mp3 for every mapped slug', () => {
		const need: string[] = [];
		for (const slug of Object.values(LEAD_AUDIO_SLUG)) {
			need.push(`consonants/${slug}.opus`, `consonants/${slug}.mp3`);
		}
		for (const slug of Object.values(VOWEL_AUDIO_SLUG)) {
			need.push(`vowels/${slug}.opus`, `vowels/${slug}.mp3`);
		}
		for (const slug of Object.values(FINAL_AUDIO_SLUG)) {
			need.push(`finals/${slug}.opus`, `finals/${slug}.mp3`);
		}
		for (const rel of need) {
			expect(existsSync(join(audioRoot, rel)), rel).toBe(true);
		}
	});
});
