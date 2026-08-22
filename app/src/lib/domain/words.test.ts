import { describe, expect, it } from 'vitest';
import { VOCAB_PACKS, WORDS, wordsOfPack } from './words';
import { decompose, pronounceWord, romanizeWord } from './hangul';

describe('the corpus obeys its own selection rules', () => {
	it('authors a spoken form the engine actually derives, for every word', () => {
		for (const word of WORDS) {
			expect(pronounceWord(word.hangul), word.hangul).toBe(word.spoken);
		}
	});

	it('uses only real single words — every character a syllable, no spaces', () => {
		for (const word of WORDS) {
			expect(word.hangul).not.toMatch(/\s/);
			for (const ch of [...word.hangul]) {
				expect(decompose(ch), `${word.hangul}: ${ch}`).not.toBeNull();
			}
			expect(romanizeWord(word.spoken), word.hangul).not.toBe('');
		}
	});

	it('has unique fronts and at least one gloss each', () => {
		expect(new Set(WORDS.map((w) => w.hangul)).size).toBe(WORDS.length);
		for (const word of WORDS) {
			expect(word.glosses.length, word.hangul).toBeGreaterThan(0);
			for (const gloss of word.glosses) {
				expect(gloss, word.hangul).toBe(gloss.toLowerCase());
			}
		}
	});

	it('fills all seven packs with a real spread of words', () => {
		expect(WORDS.length).toBe(165);
		for (const pack of VOCAB_PACKS) {
			expect(wordsOfPack(pack.id).length, pack.id).toBeGreaterThanOrEqual(20);
		}
	});

	it('keeps sound-change words in the corpus — the point of reading real text', () => {
		const changed = WORDS.filter((w) => w.hangul !== w.spoken);
		expect(changed.length).toBeGreaterThanOrEqual(20);
	});
});
