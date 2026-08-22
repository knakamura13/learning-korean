import { describe, it, expect } from 'vitest';
import {
	LEADS, VOWELS, FINALS, REPRESENTATIVE, CLUSTERS, CLUSTER_EXCEPTIONS, SOUND_CHANGES,
	GANADA_CONSONANTS, GANADA_VOWELS,
	compose, decompose, isSyllable, harmony, sidesFor, buildVowel,
	fuse, fusionParts, mergedWith, batchimSound, clusterParts, clusterRule, isCluster,
	applyLiaison, liaisonSources, liaisonAction,
	applyTensification, applyNasalization, applyContact, contactAction,
	applyAspiration, applyHDeletion, applyHMerge, hMergeAction,
	applyLateralization, applyRToN, applyFlow, flowAction,
	romanizeSyllable, romanizeWord, jamoReading
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

	it('recognizes clusters and single finals apart', () => {
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

	it('does not implement ㅎ-deletion or palatalization', () => {
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
		expect(liaison!.scored).toBe(true);
		for (const ex of liaison!.examples) {
			expect(applyLiaison(ex.written), ex.written).toBe(ex.spoken);
		}
	});

	it('marks unimplemented sound changes so reference copy cannot claim they are scored', () => {
		const unimplemented = SOUND_CHANGES.filter((s) => !s.scored);
		expect(unimplemented.map((s) => s.id)).toEqual(['palatalization']);
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

describe('romanize spoken syllables', () => {
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

describe('jamoReading', () => {
	it('names isolated vowels with Revised Romanization', () => {
		expect(jamoReading('ㅕ', 'vowel')).toBe('yeo');
		expect(jamoReading('ㅣ', 'vowel')).toBe('i');
		expect(jamoReading('ㅖ', 'vowel')).toBe('ye');
	});

	it('uses onset g and batchim k for ㄱ, and leaves lead ㅇ silent', () => {
		expect(jamoReading('ㄱ', 'lead')).toBe('g');
		expect(jamoReading('ㄱ', 'batchim')).toBe('k');
		expect(jamoReading('ㅇ', 'lead')).toBe('');
		expect(jamoReading('ㅇ', 'batchim')).toBe('ng');
	});

	it('returns empty for a missing glyph or the wrong slot', () => {
		expect(jamoReading('', 'vowel')).toBe('');
		expect(jamoReading('ㄱ', 'vowel')).toBe('');
		expect(jamoReading('ㅕ', 'lead')).toBe('');
	});
});

describe('ganada order', () => {
	it('is the Unicode lead and vowel tables, not a second copy', () => {
		expect(GANADA_CONSONANTS).toBe(LEADS);
		expect(GANADA_VOWELS).toBe(VOWELS);
	});
});

describe('tensification (Article 23)', () => {
	it('tenses a plain ㄱ/ㄷ/ㅂ/ㅅ/ㅈ after a stop batchim', () => {
		expect(applyTensification('학교')).toBe('학꾜');
		expect(applyTensification('먹다')).toBe('먹따');
		expect(applyTensification('잡지')).toBe('잡찌');
		expect(applyTensification('식당')).toBe('식땅');
		expect(applyTensification('국밥')).toBe('국빱');
		expect(applyTensification('옆집')).toBe('엽찝');
	});

	it('does not tense nasals, liaison, clusters, or ㅎ', () => {
		expect(applyTensification('입니다')).toBe('입니다');
		expect(applyTensification('국물')).toBe('국물');
		expect(applyTensification('한국')).toBe('한국');
		expect(applyTensification('음악')).toBe('음악');
		expect(applyTensification('좋아요')).toBe('좋아요');
		expect(applyTensification('없다')).toBe('없다');
	});

	it('agrees with the reference-page tensification examples', () => {
		const row = SOUND_CHANGES.find((s) => s.id === 'tensification');
		expect(row).toBeDefined();
		expect(row!.scored).toBe(true);
		for (const ex of row!.examples) {
			expect(applyTensification(ex.written), ex.written).toBe(ex.spoken);
		}
	});

	it('returns the input unchanged when any character is not a syllable', () => {
		expect(applyTensification('학교!')).toBe('학교!');
		expect(applyTensification('')).toBe('');
	});
});

describe('nasalization (Article 18)', () => {
	it('turns ㄱ/ㄷ/ㅂ into ㅇ/ㄴ/ㅁ before ㄴ or ㅁ', () => {
		expect(applyNasalization('국물')).toBe('궁물');
		expect(applyNasalization('입니다')).toBe('임니다');
		expect(applyNasalization('학년')).toBe('항년');
		expect(applyNasalization('닫는')).toBe('단는');
		expect(applyNasalization('밥물')).toBe('밤물');
		expect(applyNasalization('앞문')).toBe('암문');
	});

	it('does not nasalize tensification, liaison, clusters, ㅎ, or Article 19', () => {
		expect(applyNasalization('학교')).toBe('학교');
		expect(applyNasalization('한국')).toBe('한국');
		expect(applyNasalization('음악')).toBe('음악');
		expect(applyNasalization('좋아요')).toBe('좋아요');
		expect(applyNasalization('없다')).toBe('없다');
		expect(applyNasalization('독립')).toBe('독립');
	});

	it('agrees with the reference-page nasalization examples', () => {
		const row = SOUND_CHANGES.find((s) => s.id === 'nasalization');
		expect(row).toBeDefined();
		expect(row!.scored).toBe(true);
		for (const ex of row!.examples) {
			expect(applyNasalization(ex.written), ex.written).toBe(ex.spoken);
		}
	});

	it('returns the input unchanged when any character is not a syllable', () => {
		expect(applyNasalization('국물!')).toBe('국물!');
		expect(applyNasalization('')).toBe('');
	});
});

describe('contactAction', () => {
	it('derives tense, nasal, or stay', () => {
		expect(contactAction('학교')).toEqual({ type: 'tense' });
		expect(contactAction('먹다')).toEqual({ type: 'tense' });
		expect(contactAction('국물')).toEqual({ type: 'nasal' });
		expect(contactAction('입니다')).toEqual({ type: 'nasal' });
		expect(contactAction('한국')).toEqual({ type: 'stay' });
		expect(contactAction('음악')).toEqual({ type: 'stay' });
	});

	it('applyContact uses tensification when it fires, otherwise nasalization', () => {
		expect(applyContact('학교')).toBe('학꾜');
		expect(applyContact('국물')).toBe('궁물');
		expect(applyContact('한국')).toBe('한국');
		expect(romanizeWord(applyContact('학교'))).toBe('hak-kkyo');
		expect(romanizeWord(applyContact('입니다'))).toBe('im-ni-da');
		expect(romanizeWord(applyContact('국밥'))).toBe('guk-ppap');
	});
});

describe('aspiration and ㅎ-deletion (Article 12)', () => {
	it('an ㅎ-family batchim aspirates a following plain ㄱ/ㄷ/ㅈ', () => {
		expect(applyAspiration('좋고')).toBe('조코');
		expect(applyAspiration('좋다')).toBe('조타');
		expect(applyAspiration('놓지')).toBe('노치');
		// ㄶ/ㅀ spend the ㅎ and keep their first member in the slot.
		expect(applyAspiration('많다')).toBe('만타');
		expect(applyAspiration('싫다')).toBe('실타');
	});

	it('a stop batchim before an ㅎ lead fuses into the aspirate', () => {
		expect(applyAspiration('축하')).toBe('추카');
		expect(applyAspiration('입학')).toBe('이팍');
		// ㅅ neutralizes to the [ㄷ] representative first, then aspirates.
		expect(applyAspiration('못하다')).toBe('모타다');
	});

	it('deletes an ㅎ batchim before a vowel, liaising cluster survivors', () => {
		expect(applyHDeletion('좋아요')).toBe('조아요');
		expect(applyHDeletion('놓아')).toBe('노아');
		expect(applyHDeletion('많아')).toBe('마나');
		expect(applyHDeletion('싫어')).toBe('시러');
	});

	it('fires neither rule when no ㅎ is at the junction', () => {
		expect(applyAspiration('학교')).toBe('학교');
		expect(applyHDeletion('한국어')).toBe('한국어');
		expect(applyHMerge('음악')).toBe('음악');
		expect(applyAspiration('국물!')).toBe('국물!');
	});

	it('hMergeAction derives aspirate, delete, or stay', () => {
		expect(hMergeAction('좋고')).toEqual({ type: 'aspirate' });
		expect(hMergeAction('축하')).toEqual({ type: 'aspirate' });
		expect(hMergeAction('좋아요')).toEqual({ type: 'delete' });
		expect(hMergeAction('많아')).toEqual({ type: 'delete' });
		expect(hMergeAction('학교')).toEqual({ type: 'stay' });
	});

	it('romanizes the merged forms the deck will accept', () => {
		expect(romanizeWord(applyHMerge('축하'))).toBe('chu-ka');
		expect(romanizeWord(applyHMerge('좋아요'))).toBe('jo-a-yo');
		expect(romanizeWord(applyHMerge('많다'))).toBe('man-ta');
	});
});

describe('lateralization and ㄹ→ㄴ (Articles 20 and 19)', () => {
	it('ㄴ and ㄹ meeting in either order come out ㄹㄹ', () => {
		expect(applyLateralization('신라')).toBe('실라');
		expect(applyLateralization('한라산')).toBe('할라산');
		expect(applyLateralization('연락')).toBe('열락');
		expect(applyLateralization('편리')).toBe('펼리');
		expect(applyLateralization('설날')).toBe('설랄');
		expect(applyLateralization('실내')).toBe('실래');
	});

	it('a lead ㄹ after ㅁ or ㅇ becomes ㄴ', () => {
		expect(applyRToN('심리')).toBe('심니');
		expect(applyRToN('종로')).toBe('종노');
		expect(applyRToN('음료수')).toBe('음뇨수');
		expect(applyRToN('대통령')).toBe('대통녕');
		expect(applyRToN('정류장')).toBe('정뉴장');
	});

	it('fires neither rule at other junctions', () => {
		expect(applyLateralization('한국')).toBe('한국');
		expect(applyRToN('학교')).toBe('학교');
		expect(applyFlow('입니다')).toBe('입니다');
		expect(applyRToN('신라!')).toBe('신라!');
	});

	it('flowAction derives lateral, nasal, or stay', () => {
		expect(flowAction('신라')).toEqual({ type: 'lateral' });
		expect(flowAction('설날')).toEqual({ type: 'lateral' });
		expect(flowAction('심리')).toEqual({ type: 'nasal' });
		expect(flowAction('종로')).toEqual({ type: 'nasal' });
		expect(flowAction('한국')).toEqual({ type: 'stay' });
	});

	it('romanizes the flowed forms the deck will accept', () => {
		// Block-cut romanization writes lead ㄹ as r; the deck also accepts
		// the assimilated 'l-l' spelling on its flow cards.
		expect(romanizeWord(applyFlow('신라'))).toBe('sil-ra');
		expect(romanizeWord(applyFlow('심리'))).toBe('sim-ni');
		expect(romanizeWord(applyFlow('대통령'))).toBe('dae-tong-nyeong');
	});
});

describe('all eight sound changes are now scored', () => {
	it('marks aspiration, ㅎ-deletion, lateralization, and ㄹ→ㄴ as drilled', () => {
		const scored = SOUND_CHANGES.filter((c) => c.scored).map((c) => c.id).sort();
		expect(scored).toEqual(
			['aspiration', 'h-deletion', 'lateralization', 'liaison', 'nasalization', 'r-to-n', 'tensification'].sort()
		);
		expect(SOUND_CHANGES.find((c) => c.id === 'palatalization')?.scored).toBe(false);
	});
});
