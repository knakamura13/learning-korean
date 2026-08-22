import { describe, it, expect } from 'vitest';
import { DECK, CARDS_BY_ID, TIERS, VOCAB_TIERS, cardsOfTier, checkAnswer, normalize } from './deck';
import { BLOCK_COUNTS } from './blockDeck';
import { applyLiaison, applyTensification, applyNasalization, batchimSound, fusionParts, CLUSTERS, romanizeWord } from './hangul';

describe('deck integrity', () => {
	it('has no duplicate ids', () => {
		const ids = DECK.map((c) => c.id);
		expect(new Set(ids).size).toBe(ids.length);
		expect(Object.keys(CARDS_BY_ID)).toHaveLength(DECK.length);
	});

	it('gives every card a front, an answer, a note and a tier', () => {
		for (const c of DECK) {
			expect(c.front, c.id).toBeTruthy();
			expect(c.answers.length, c.id).toBeGreaterThan(0);
			expect(c.answers.every((a) => a.length > 0), c.id).toBe(true);
			expect(c.note, c.id).toBeTruthy();
			expect(c.tier, c.id).toBeTruthy();
		}
	});

	it('accepts each card by its own canonical answer', () => {
		for (const c of DECK) {
			expect(checkAnswer(c, c.answers[0]), c.id).toBe(true);
		}
	});

	it('accepts every listed alternate spelling', () => {
		for (const c of DECK) {
			for (const a of c.answers) expect(checkAnswer(c, a), `${c.id} / ${a}`).toBe(true);
		}
	});

	it('rejects an empty or wrong answer', () => {
		const g = CARDS_BY_ID['c-g'];
		expect(checkAnswer(g, '')).toBe(false);
		expect(checkAnswer(g, '   ')).toBe(false);
		expect(checkAnswer(g, 'n')).toBe(false);
	});

	it('is forgiving about case, spacing and punctuation only', () => {
		const g = CARDS_BY_ID['c-g'];
		expect(checkAnswer(g, ' G ')).toBe(true);
		expect(checkAnswer(g, 'g.')).toBe(true);
		expect(normalize(' A B ')).toBe('ab');
	});

	it('keeps ㅡ and ㅜ answers from colliding', () => {
		// "eu" and "u" are different vowels; a slip here would silently mark
		// a wrong answer correct.
		expect(checkAnswer(CARDS_BY_ID['v-eu'], 'eu')).toBe(true);
		expect(checkAnswer(CARDS_BY_ID['v-eu'], 'u')).toBe(false);
		expect(checkAnswer(CARDS_BY_ID['v-u'], 'u')).toBe(true);
		expect(checkAnswer(CARDS_BY_ID['v-u'], 'eu')).toBe(false);
	});
});

describe('tiers', () => {
	it('declares a size matching the cards it actually holds', () => {
		for (const t of TIERS) {
			expect(cardsOfTier(t.id), t.id).toHaveLength(t.size);
		}
	});

	it('covers every card exactly once across lab and vocab tiers', () => {
		const counted = [...TIERS, ...VOCAB_TIERS].reduce(
			(n, t) => n + cardsOfTier(t.id).length,
			0
		);
		expect(counted).toBe(DECK.length);
	});

	it('sizes each vocab pack and never duplicates a lab pronunciation card', () => {
		for (const tier of VOCAB_TIERS) {
			expect(cardsOfTier(tier.id), tier.id).toHaveLength(tier.size);
		}
		const ids = DECK.map((c) => c.id);
		expect(new Set(ids).size).toBe(ids.length);
		// A lab-tier pron front must not reappear as a vocab pron card.
		const labProns = new Set(
			DECK.filter((c) => c.kind === 'pron' && !c.tier.startsWith('vocab')).map((c) => c.front)
		);
		for (const c of DECK.filter((c) => c.kind === 'pron' && c.tier.startsWith('vocab'))) {
			expect(labProns.has(c.front), c.front).toBe(false);
		}
	});

	it('points each tier at the lab that unlocks it', () => {
		for (const t of TIERS) expect(t.lab).toMatch(/^\d{4}$/);
		expect(new Set(TIERS.map((t) => t.lab)).size).toBe(TIERS.length);
	});
});

describe('answers derived from the phonology module', () => {
	const ROMAN: Record<string, string> = {
		'ㄱ': 'k', 'ㄴ': 'n', 'ㄷ': 't', 'ㄹ': 'l', 'ㅁ': 'm', 'ㅂ': 'p', 'ㅇ': 'ng'
	};

	it('gives every batchim card the sound the rules predict', () => {
		for (const c of cardsOfTier('lab04').filter((c) => c.kind === 'batchim')) {
			expect(c.answers[0], `${c.front} as a batchim`).toBe(ROMAN[batchimSound(c.front)]);
		}
	});

	it('gives every cluster card the surviving sound', () => {
		const cards = cardsOfTier('lab05').filter((c) => c.kind === 'cluster');
		expect(cards).toHaveLength(CLUSTERS.length);
		for (const c of cards) {
			expect(c.answers[0], `${c.front}`).toBe(ROMAN[batchimSound(c.front)]);
		}
	});

	it('builds construction answers from the fusion table', () => {
		for (const c of cardsOfTier('lab03').filter((x) => x.kind === 'build')) {
			const parts = fusionParts(c.front);
			expect(parts, c.front).not.toBeNull();
			// The jamo form is always accepted alongside the romanized one.
			expect(checkAnswer(c, `${parts![0]}+${parts![1]}`)).toBe(true);
		}
	});
});

describe('liaison / pron cards', () => {
	it('unlocks ten lab06 cards derived from applyLiaison', () => {
		const cards = cardsOfTier('lab06');
		expect(cards).toHaveLength(10);
		expect(TIERS.find((t) => t.id === 'lab06')).toMatchObject({ lab: '0006', size: 10 });
		for (const c of cards) {
			expect(c.kind).toBe('pron');
			const spoken = applyLiaison(c.front);
			expect(c.answers).toContain(spoken);
			expect(c.answers).toContain(romanizeWord(spoken));
		}
	});

	it('requires hyphenated ASCII so spelling-RR cannot pass', () => {
		const card = CARDS_BY_ID['p-한국어'];
		expect(checkAnswer(card, 'han-gu-geo')).toBe(true);
		expect(checkAnswer(card, '한구거')).toBe(true);
		expect(checkAnswer(card, '[한구거]')).toBe(true);
		expect(checkAnswer(card, 'hangugeo')).toBe(false);
		expect(checkAnswer(card, 'han-guk-eo')).toBe(false);
	});

	it('accepts stay-words as themselves', () => {
		const card = CARDS_BY_ID['p-강이'];
		expect(checkAnswer(card, 'gang-i')).toBe(true);
		expect(checkAnswer(card, '강이')).toBe(true);
		expect(checkAnswer(card, 'ga-i')).toBe(false);
	});

	it('leaves existing letter-card grading alone', () => {
		expect(checkAnswer(CARDS_BY_ID['c-g'], 'g')).toBe(true);
		expect(checkAnswer(CARDS_BY_ID['v-eu'], 'eu')).toBe(true);
	});
});

describe('lab07 / pron cards', () => {
	it('unlocks ten lab07 cards derived from tensification or nasalization', () => {
		const cards = cardsOfTier('lab07');
		expect(cards).toHaveLength(10);
		expect(TIERS.find((t) => t.id === 'lab07')).toMatchObject({ lab: '0007', size: 10 });
		for (const c of cards) {
			expect(c.kind).toBe('pron');
			const spoken =
				applyTensification(c.front) !== c.front
					? applyTensification(c.front)
					: applyNasalization(c.front);
			expect(c.answers).toContain(spoken);
			expect(c.answers).toContain(romanizeWord(spoken));
		}
	});

	it('requires hyphenated ASCII for 학교', () => {
		const card = CARDS_BY_ID['p-학교'];
		expect(checkAnswer(card, 'hak-kkyo')).toBe(true);
		expect(checkAnswer(card, '학꾜')).toBe(true);
		expect(checkAnswer(card, 'hakgyo')).toBe(false);
		expect(checkAnswer(card, 'hak-gyo')).toBe(false);
	});
});

describe('block cards', () => {
	it('schedules generated blocks inside lab02–lab05', () => {
		const blocks = DECK.filter((c) => c.kind === 'block');
		expect(blocks).toHaveLength(
			BLOCK_COUNTS.lab02 + BLOCK_COUNTS.lab03 + BLOCK_COUNTS.lab04 + BLOCK_COUNTS.lab05
		);
		expect(cardsOfTier('lab02').filter((c) => c.kind === 'block')).toHaveLength(BLOCK_COUNTS.lab02);
		expect(TIERS.find((t) => t.id === 'lab02')).toMatchObject({
			label: 'Vowels · blocks',
			size: cardsOfTier('lab02').length
		});
		expect(TIERS.find((t) => t.id === 'lab03')?.label).toBe('Compounds · blocks');
		expect(TIERS.find((t) => t.id === 'lab04')?.label).toBe('Batchim · blocks');
		expect(TIERS.find((t) => t.id === 'lab05')?.label).toBe('Clusters · blocks');
	});

	it('grades the derived reading and rejects the glyph', () => {
		const card = DECK.find((c) => c.kind === 'block');
		expect(card).toBeDefined();
		if (!card) return;
		expect(checkAnswer(card, card.answers[0])).toBe(true);
		expect(checkAnswer(card, card.front)).toBe(false);
		expect(checkAnswer(card, '')).toBe(false);
	});
});
