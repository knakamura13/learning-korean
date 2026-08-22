import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CLUSTERS, LEADS, REPRESENTATIVE, VOWELS, batchimSound } from '$lib/domain/hangul';
import {
	FINAL_AUDIO_SLUG,
	LEAD_AUDIO_SLUG,
	VOWEL_AUDIO_SLUG,
	letterAudioSources
} from './letters';
import { RECORDED } from './recorded';
import { consonantAudioSrc } from './consonants';

const audioRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../static/audio');

/** Every slot the app can ever play, as `<dir>/<slug>` — the filename contract. */
function allSlots(): Set<string> {
	const slots = new Set<string>();
	for (const slug of Object.values(LEAD_AUDIO_SLUG)) slots.add(`consonants/${slug}`);
	for (const slug of Object.values(VOWEL_AUDIO_SLUG)) slots.add(`vowels/${slug}`);
	for (const slug of Object.values(FINAL_AUDIO_SLUG)) slots.add(`finals/${slug}`);
	return slots;
}

describe('the slug mapping (filename contract for future native recordings)', () => {
	it('covers exactly the 19 leads, 21 vowels, and 7 final representatives', () => {
		expect(LEADS).toHaveLength(19);
		expect(new Set(Object.keys(LEAD_AUDIO_SLUG))).toEqual(new Set(LEADS));
		expect(VOWELS).toHaveLength(21);
		expect(new Set(Object.keys(VOWEL_AUDIO_SLUG))).toEqual(new Set(VOWELS));
		expect(REPRESENTATIVE).toHaveLength(7);
		expect(new Set(Object.keys(FINAL_AUDIO_SLUG))).toEqual(new Set(REPRESENTATIVE));
		expect(allSlots().size).toBe(47);
	});

	it('gives every slot a unique filename within its directory', () => {
		for (const slugs of [LEAD_AUDIO_SLUG, VOWEL_AUDIO_SLUG, FINAL_AUDIO_SLUG]) {
			const values = Object.values(slugs);
			expect(new Set(values).size).toBe(values.length);
		}
	});
});

describe('letterAudioSources (recording-availability gate)', () => {
	it('returns null for every lead until its recording is ingested, URLs after', () => {
		for (const jamo of LEADS) {
			const slug = LEAD_AUDIO_SLUG[jamo];
			const src = letterAudioSources(jamo, 'lead');
			if (RECORDED.has(`consonants/${slug}`)) {
				expect(src!.opus, jamo).toMatch(new RegExp(`/audio/consonants/${slug}\\.opus$`));
				expect(src!.mp3, jamo).toMatch(new RegExp(`/audio/consonants/${slug}\\.mp3$`));
			} else {
				expect(src, jamo).toBeNull();
			}
		}
	});

	it('returns null for every vowel until its recording is ingested, URLs after', () => {
		for (const jamo of VOWELS) {
			const slug = VOWEL_AUDIO_SLUG[jamo];
			const src = letterAudioSources(jamo, 'vowel');
			if (RECORDED.has(`vowels/${slug}`)) {
				expect(src!.opus, jamo).toMatch(new RegExp(`/audio/vowels/${slug}\\.opus$`));
				expect(src!.mp3, jamo).toMatch(new RegExp(`/audio/vowels/${slug}\\.mp3$`));
			} else {
				expect(src, jamo).toBeNull();
			}
		}
	});

	it('still routes finals through batchimSound: clusters share their representative', () => {
		for (const r of REPRESENTATIVE) {
			const slug = FINAL_AUDIO_SLUG[r];
			const src = letterAudioSources(r, 'final');
			if (RECORDED.has(`finals/${slug}`)) {
				expect(src!.opus, r).toMatch(new RegExp(`/audio/finals/${slug}\\.opus$`));
			} else {
				expect(src, r).toBeNull();
			}
		}
		expect(letterAudioSources('ㄲ', 'final')).toEqual(letterAudioSources('ㄱ', 'final'));
		expect(letterAudioSources('ㅅ', 'final')).toEqual(letterAudioSources('ㄷ', 'final'));
		for (const c of CLUSTERS) {
			const rep = batchimSound(c);
			expect(letterAudioSources(c, 'final')).toEqual(letterAudioSources(rep, 'final'));
		}
	});

	it('returns null when the slot does not match the glyph, recorded or not', () => {
		expect(letterAudioSources('ㅏ', 'lead')).toBeNull();
		expect(letterAudioSources('ㄱ', 'vowel')).toBeNull();
		expect(letterAudioSources('ㅏ', 'final')).toBeNull();
		expect(letterAudioSources('', 'lead')).toBeNull();
		expect(letterAudioSources('가', 'lead')).toBeNull();
	});

	it('gates consonantAudioSrc the same way', () => {
		const gSrc = consonantAudioSrc('ㄱ');
		if (RECORDED.has('consonants/g')) {
			expect(gSrc).toMatch(/\/audio\/consonants\/g\.opus$/);
		} else {
			expect(gSrc).toBeNull();
		}
		expect(consonantAudioSrc('ㅏ')).toBeNull();
	});
});

describe('RECORDED (maintained by scripts/ingest-recordings.mjs)', () => {
	it('only ever names slots from the contract', () => {
		const slots = allSlots();
		for (const entry of RECORDED) {
			expect(slots.has(entry), entry).toBe(true);
		}
	});

	it('mirrors the clips on disk exactly: opus + mp3 for every entry, no orphan files', () => {
		for (const entry of RECORDED) {
			expect(existsSync(join(audioRoot, `${entry}.opus`)), `${entry}.opus`).toBe(true);
			expect(existsSync(join(audioRoot, `${entry}.mp3`)), `${entry}.mp3`).toBe(true);
		}
		for (const dir of ['consonants', 'vowels', 'finals']) {
			const dirPath = join(audioRoot, dir);
			if (!existsSync(dirPath)) continue;
			for (const name of readdirSync(dirPath)) {
				const clip = name.match(/^(.+)\.(?:opus|mp3)$/);
				if (!clip) continue;
				expect(RECORDED.has(`${dir}/${clip[1]}`), `${dir}/${name}`).toBe(true);
			}
		}
	});
});
