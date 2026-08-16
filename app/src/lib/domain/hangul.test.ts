import { describe, it, expect } from 'vitest';
import {
	LEADS, VOWELS, FINALS, REPRESENTATIVE, CLUSTERS, CLUSTER_EXCEPTIONS, SOUND_CHANGES,
	compose, decompose, isSyllable, harmony, sidesFor, buildVowel,
	fuse, fusionParts, mergedWith, batchimSound, clusterParts, clusterRule, isCluster,
	applyLiaison, liaisonSources, liaisonAction,
	romanizeSyllable, romanizeWord
} from './hangul';

describe('syllable composition', () => {
	it('round-trips every one of the 11,172 syllable blocks', () => {
		let checked = 0;
		for (const lead of LEADS) {
			for (const vowel of VOWELS) {
				for (const final of FINALS) {
					const syl = compose(lead, vowel, final);
					expect(syl).toHaveLength(1);
					expect(decompose(syl)).toEqual({ lead, vowel, final });
					checked++;
				}
			}
		}
		expect(checked).toBe(19 * 21 * 28);
	});

	it('composes the words the labs actually teach', () => {
		expect(compose('ㅂ', 'ㅏ')).toBe('바');
		expect(compose('ㅅ', 'ㅗ')).toBe('소');
		expect(compose('ㄱ', 'ㅘ')).toBe('과');
		expect(compose('ㄱ', 'ㅏ', 'ㅇ')).toBe('강');
		expect(compose('ㄱ', 'ㅣ', 'ㅁ')).toBe('김');
		expect(compose('ㅂ', 'ㅏ', 'ㄱ')).toBe('박');
		expect(compose('ㅇ', 'ㅓ', 'ㅄ')).toBe('없');
	});

	it('rejects pieces that are not in the right slot', () => {
		expect(compose('ㅏ', 'ㅏ')).toBe('');
		expect(compose('ㄱ', 'ㄱ')).toBe('');
		expect(compose('ㄱ', 'ㅏ', 'ㄸ')).toBe(''); // ㄸ can never be a batchim
		expect(compose('', '')).toBe('');
	});

	it('decomposes only real syllable blocks', () => {
		expect(decompose('ㄱ')).toBeNull();
		expect(decompose('a')).toBeNull();
		expect(decompose('가나')).toBeNull();
		expect(isSyllable('한')).toBe(true);
		expect(isSyllable('ㅎ')).toBe(false);
	});
});

describe('vowels', () => {
	it('generates all ten simple vowels from strokes, ticks and side', () => {
		const built = new Set<string>();
		for (const base of ['ㅣ', 'ㅡ']) {
			built.add(buildVowel(base, null, 0));
			for (const side of sidesFor(base)) {
				for (const ticks of [1, 2]) built.add(buildVowel(base, side, ticks));
			}
		}
		expect([...built].sort()).toEqual(
			['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ'].sort()
		);
	});

	it('offers only the sides that make sense for each base stroke', () => {
		expect(sidesFor('ㅣ')).toEqual(['left', 'right']);
		expect(sidesFor('ㅡ')).toEqual(['above', 'below']);
		expect(sidesFor('ㅏ')).toEqual([]);
		// A side belonging to the other base yields nothing rather than a wrong letter.
		expect(buildVowel('ㅣ', 'above', 1)).toBe('');
	});

	it('adds the y-glide with the second tick', () => {
		expect(buildVowel('ㅣ', 'right', 1)).toBe('ㅏ');
		expect(buildVowel('ㅣ', 'right', 2)).toBe('ㅑ');
		expect(buildVowel('ㅡ', 'above', 2)).toBe('ㅛ');
	});

	it('fuses exactly the eleven compound vowels', () => {
		const simple = ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ', 'ㅐ', 'ㅔ'];
		const made = new Set<string>();
		for (const a of simple) for (const b of simple) {
			const r = fuse(a, b);
			if (r) made.add(r);
		}
		expect([...made].sort()).toEqual(
			['ㅐ', 'ㅒ', 'ㅔ', 'ㅖ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅢ'].sort()
		);
	});

	it('is its own inverse via fusionParts', () => {
		for (const compound of ['ㅐ', 'ㅒ', 'ㅔ', 'ㅖ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅢ']) {
			const parts = fusionParts(compound);
			expect(parts, `no parts for ${compound}`).not.toBeNull();
			expect(fuse(parts![0], parts![1])).toBe(compound);
		}
		expect(fusionParts('ㅏ')).toBeNull();
	});

	it('never fuses a bright vowel with a dark one — this is the Lab 03 discovery', () => {
		const all = [...VOWELS];
		for (const a of all) for (const b of all) {
			if (!fuse(a, b)) continue;
			const [ha, hb] = [harmony(a), harmony(b)];
			if (ha !== 'neutral' && hb !== 'neutral') {
				expect(ha, `${a}+${b} mixes harmony classes`).toBe(hb);
			}
		}
		// The specific pair the lab asks about.
		expect(fuse('ㅗ', 'ㅓ')).toBe('');
		expect(harmony('ㅗ')).toBe('bright');
		expect(harmony('ㅓ')).toBe('dark');
	});

	it('knows which vowels merged in modern speech', () => {
		expect(mergedWith('ㅐ')).toEqual(['ㅔ']);
		expect(mergedWith('ㅚ').sort()).toEqual(['ㅙ', 'ㅞ']);
		expect(mergedWith('ㅏ')).toEqual([]);
	});
});

describe('batchim', () => {
	it('collapses all 27 written finals onto exactly seven sounds', () => {
		const written = FINALS.filter((f) => f !== '');
		expect(written).toHaveLength(27);
		const sounds = new Set(written.map(batchimSound));
		expect(sounds.size).toBe(7);
		expect([...sounds].sort()).toEqual([...REPRESENTATIVE].sort());
	});

	it('maps every final to something, and non-finals to nothing', () => {
		for (const f of FINALS) {
			if (f === '') continue;
			expect(batchimSound(f), `${f} has no representative sound`).not.toBe('');
		}
		expect(batchimSound('ㄸ')).toBe(''); // never occurs as a batchim
		expect(batchimSound('ㅏ')).toBe('');
	});

	it('is idempotent — a representative sound maps to itself', () => {
		for (const r of REPRESENTATIVE) expect(batchimSound(r)).toBe(r);
	});

	it('makes 낫 낮 낯 낟 낱 homophones', () => {
		const finals = ['ㅅ', 'ㅈ', 'ㅊ', 'ㄷ', 'ㅌ'];
		const sounds = new Set(finals.map(batchimSound));
		expect(sounds).toEqual(new Set(['ㄷ']));
	});
});

describe('clusters', () => {
	it('has exactly eleven', () => {
		expect(CLUSTERS).toHaveLength(11);
	});

	it('always pronounces one of its own two members — the core lab invariant', () => {
		for (const c of CLUSTERS) {
			const parts = clusterParts(c);
			expect(parts, `${c} has no parts`).not.toBeNull();
			const winner = batchimSound(c);
			const partSounds = parts!.map(batchimSound);
			expect(
				partSounds.includes(winner as never),
				`${c} says ${winner}, which is neither ${parts![0]} nor ${parts![1]}`
			).toBe(true);
		}
	});

	it('classifies each cluster as Rule A, Rule B, or an ㅎ-cluster', () => {
		const byRule: Record<string, string[]> = { first: [], second: [], h: [] };
		for (const c of CLUSTERS) byRule[clusterRule(c)!].push(c);

		// Article 10 — first member survives.
		expect(byRule.first.sort()).toEqual(['ㄳ', 'ㄵ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㅄ'].sort());
		// Article 11 — second member survives.
		expect(byRule.second.sort()).toEqual(['ㄺ', 'ㄻ', 'ㄿ'].sort());
		// ㅎ leaves the slot but aspirates what follows.
		expect(byRule.h.sort()).toEqual(['ㄶ', 'ㅀ'].sort());
	});

	it('resolves each cluster to the sound the Standard Pronunciation Rules give', () => {
		const expected: Record<string, string> = {
			'ㄳ': 'ㄱ', 'ㄵ': 'ㄴ', 'ㄶ': 'ㄴ', 'ㄺ': 'ㄱ', 'ㄻ': 'ㅁ', 'ㄼ': 'ㄹ',
			'ㄽ': 'ㄹ', 'ㄾ': 'ㄹ', 'ㄿ': 'ㅂ', 'ㅀ': 'ㄹ', 'ㅄ': 'ㅂ'
		};
		for (const [cluster, sound] of Object.entries(expected)) {
			expect(batchimSound(cluster), `${cluster}`).toBe(sound);
		}
	});

	it('recognises clusters and single finals apart', () => {
		expect(isCluster('ㅄ')).toBe(true);
		expect(isCluster('ㅂ')).toBe(false);
		expect(clusterParts('ㅂ')).toBeNull();
		expect(clusterRule('ㅂ')).toBeNull();
	});

	it('records the lexical exceptions rather than pretending they follow a rule', () => {
		expect(CLUSTER_EXCEPTIONS.length).toBeGreaterThanOrEqual(3);
		const stems = CLUSTER_EXCEPTIONS.map((e) => e.stem);
		expect(stems).toContain('밟');
		expect(stems).toContain('읽');
		// Each exception contradicts the general rule — that is what makes it one.
		for (const ex of CLUSTER_EXCEPTIONS) {
			expect(ex.says).not.toBe(batchimSound(ex.cluster));
		}
	});
});

describe('liaison (Articles 13–14)', () => {
	it('moves a simple batchim into a following placeholder ㅇ', () => {
		expect(applyLiaison('옷이')).toBe('오시');
		expect(applyLiaison('밭에')).toBe('바테');
		expect(applyLiaison('앞에')).toBe('아페');
		expect(applyLiaison('부엌에')).toBe('부어케');
		expect(applyLiaison('음악')).toBe('으막');
		expect(applyLiaison('한국어')).toBe('한구거');
		expect(applyLiaison('한글을')).toBe('한그를');
		expect(applyLiaison('마음에')).toBe('마으메');
	});

	it('moves 쌍받침 as itself', () => {
		expect(applyLiaison('밖에')).toBe('바께');
		expect(applyLiaison('있어')).toBe('이써');
	});

	it('splits a cluster: first stays, second jumps', () => {
		expect(applyLiaison('읽어요')).toBe('일거요');
		expect(applyLiaison('앉아')).toBe('안자');
		expect(applyLiaison('닭을')).toBe('달글');
		expect(applyLiaison('젊어')).toBe('절머');
		expect(applyLiaison('핥아')).toBe('할타');
		expect(applyLiaison('읊어')).toBe('을퍼');
	});

	it('tenses a cluster-final ㅅ when it jumps (Article 14)', () => {
		expect(applyLiaison('없어')).toBe('업써');
		expect(applyLiaison('넋이')).toBe('넉씨');
		expect(applyLiaison('값을')).toBe('갑쓸');
	});

	it('leaves ㅇ-batchim in place so ng is not silenced', () => {
		expect(applyLiaison('강이')).toBe('강이');
		expect(applyLiaison('영어')).toBe('영어');
	});

	it('does not implement ㅎ-deletion or palatalisation', () => {
		expect(applyLiaison('좋아요')).toBe('좋아요');
		expect(applyLiaison('많아')).toBe('많아');
		expect(applyLiaison('밭이')).toBe('바티');
		expect(applyLiaison('같이')).toBe('가티');
	});

	it('documents Article 15 as out of scope (written letter, not 대표음)', () => {
		// Real Korean: 밭 아래 → [바다래]. This function is particles/endings only.
		expect(applyLiaison('밭아래')).toBe('바타래');
	});

	it('agrees with the reference-page liaison examples', () => {
		const liaison = SOUND_CHANGES.find((s) => s.id === 'liaison');
		expect(liaison).toBeDefined();
		for (const ex of liaison!.examples) {
			expect(applyLiaison(ex.written), ex.written).toBe(ex.spoken);
		}
	});

	it('returns the input unchanged when any character is not a syllable', () => {
		expect(applyLiaison('옷이!')).toBe('옷이!');
		expect(applyLiaison('')).toBe('');
	});

	it('lists written source jamo, not the tensed result', () => {
		expect(liaisonSources('음악')).toEqual(['ㅁ']);
		expect(liaisonSources('읽어요')).toEqual(['ㄹ', 'ㄱ']);
		expect(liaisonSources('없어')).toEqual(['ㅂ', 'ㅅ']);
		expect(liaisonSources('강이')).toEqual(['ㅇ']);
		expect(liaisonSources('좋아요')).toEqual([]);
	});

	it('derives stay vs the written jumper', () => {
		expect(liaisonAction('강이')).toEqual({ type: 'stay' });
		expect(liaisonAction('좋아요')).toEqual({ type: 'stay' });
		expect(liaisonAction('음악')).toEqual({ type: 'move', jamo: 'ㅁ' });
		expect(liaisonAction('옷이')).toEqual({ type: 'move', jamo: 'ㅅ' });
		expect(liaisonAction('읽어요')).toEqual({ type: 'move', jamo: 'ㄱ' });
		expect(liaisonAction('없어')).toEqual({ type: 'move', jamo: 'ㅅ' });
	});
});

describe('romanise spoken syllables', () => {
	it('uses lab conventions: onset g/d/b/r, batchim k/t/p/l/ng, silent ㅇ-onset', () => {
		expect(romanizeSyllable('한')).toBe('han');
		expect(romanizeSyllable('국')).toBe('guk');
		expect(romanizeSyllable('거')).toBe('geo');
		expect(romanizeSyllable('으')).toBe('eu');
		expect(romanizeSyllable('막')).toBe('mak');
		expect(romanizeSyllable('를')).toBe('reul');
		expect(romanizeSyllable('써')).toBe('sseo');
		expect(romanizeSyllable('께')).toBe('kke');
		expect(romanizeSyllable('이')).toBe('i');
	});

	it('joins blocks with hyphens', () => {
		expect(romanizeWord('한구거')).toBe('han-gu-geo');
		expect(romanizeWord('강이')).toBe('gang-i');
		expect(romanizeWord(applyLiaison('없어'))).toBe('eop-sseo');
		expect(romanizeWord(applyLiaison('한글을'))).toBe('han-geu-reul');
		expect(romanizeWord(applyLiaison('읽어요'))).toBe('il-geo-yo');
	});

	it('returns empty string for a non-syllable', () => {
		expect(romanizeSyllable('ㄱ')).toBe('');
		expect(romanizeWord('한!')).toBe('');
	});
});
