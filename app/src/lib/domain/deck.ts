/**
 * deck.ts — the full Hangul review deck.
 *
 * Cards are answered by typing Revised Romanization, so no Korean keyboard is
 * needed and grading is objective rather than self-reported. Several letters
 * have more than one defensible romanization (ㄱ is g or k depending on
 * position); every reasonable spelling is accepted, and only genuinely wrong
 * answers are marked wrong.
 *
 * A card belongs to a tier, and a tier only enters rotation once the lab that
 * teaches it is finished — the deck never quizzes unmet material.
 */

import { blockEntries } from './blockDeck';
import { applyLiaison, applyTensification, applyNasalization, batchimSound, fusionParts, romanizeWord } from './hangul';

export type CardKind = 'consonant' | 'vowel' | 'compound' | 'build' | 'batchim' | 'cluster' | 'pron' | 'block';

export interface Card {
	id: string;
	/** What is shown, large, on the front. */
	front: string;
	/** The question asked about the front. */
	ask: string;
	/** Accepted answers; the first is canonical and shown on reveal. */
	answers: string[];
	/** Shown after answering — the teaching, not just the correction. */
	note: string;
	tier: string;
	kind: CardKind;
}

const card = (
	id: string, front: string, ask: string, answers: string[],
	note: string, tier: string, kind: CardKind
): Card => ({ id, front, ask, answers, note, tier, kind });

const INITIAL = 'sound at the start of a block';

/* ---------- tier lab01: the 19 consonants ---------- */
const consonants: Card[] = [
	card('c-g', 'ㄱ', INITIAL, ['g', 'k'], 'Velar — back of the tongue. Aspirated twin ㅋ, tense twin ㄲ.', 'lab01', 'consonant'),
	card('c-kk', 'ㄲ', INITIAL, ['kk', 'gg'], 'Tense velar: throat tight, no puff of air.', 'lab01', 'consonant'),
	card('c-n', 'ㄴ', INITIAL, ['n'], 'Tongue tip on the ridge behind the teeth. A base shape.', 'lab01', 'consonant'),
	card('c-d', 'ㄷ', INITIAL, ['d', 't'], 'ㄴ plus one stroke. Aspirated twin ㅌ, tense twin ㄸ.', 'lab01', 'consonant'),
	card('c-tt', 'ㄸ', INITIAL, ['tt', 'dd'], 'Tense alveolar. Never appears as a batchim.', 'lab01', 'consonant'),
	card('c-r', 'ㄹ', INITIAL, ['r', 'l'], 'A quick flap initially, an l finally. One letter, both sounds.', 'lab01', 'consonant'),
	card('c-m', 'ㅁ', INITIAL, ['m'], 'The closed mouth, face-on. Base shape of the lip family.', 'lab01', 'consonant'),
	card('c-b', 'ㅂ', INITIAL, ['b', 'p'], 'ㅁ plus one stroke. Aspirated twin ㅍ, tense twin ㅃ.', 'lab01', 'consonant'),
	card('c-pp', 'ㅃ', INITIAL, ['pp', 'bb'], 'Tense labial. Never appears as a batchim.', 'lab01', 'consonant'),
	card('c-s', 'ㅅ', INITIAL, ['s'], 'A tooth, pointed. Becomes "sh" before ㅣ or a y-glide.', 'lab01', 'consonant'),
	card('c-ss', 'ㅆ', INITIAL, ['ss'], 'Tense sibilant. Sharper and shorter than ㅅ, not louder.', 'lab01', 'consonant'),
	card('c-ng0', 'ㅇ', 'sound at the START of a block', ['silent', 'none', 'nothing', '-'], 'A placeholder holding the consonant slot open. 아 says only "a".', 'lab01', 'consonant'),
	card('c-j', 'ㅈ', INITIAL, ['j'], 'ㅅ plus one stroke. Aspirated twin ㅊ, tense twin ㅉ.', 'lab01', 'consonant'),
	card('c-jj', 'ㅉ', INITIAL, ['jj'], 'Tense sibilant stop. Never appears as a batchim.', 'lab01', 'consonant'),
	card('c-ch', 'ㅊ', INITIAL, ['ch'], 'Aspirated. Two strokes up from ㅅ.', 'lab01', 'consonant'),
	card('c-k', 'ㅋ', INITIAL, ['k'], 'Aspirated velar — ㄱ with a stroke, and an audible puff.', 'lab01', 'consonant'),
	card('c-t', 'ㅌ', INITIAL, ['t'], 'Aspirated alveolar — the puffed twin of ㄷ.', 'lab01', 'consonant'),
	card('c-p', 'ㅍ', INITIAL, ['p'], 'Aspirated labial — ㅁ → ㅂ → ㅍ.', 'lab01', 'consonant'),
	card('c-h', 'ㅎ', INITIAL, ['h'], 'The throat circle with strokes stacked on top.', 'lab01', 'consonant')
];

/* ---------- tier lab02: the 10 basic vowels ---------- */
const V = 'vowel sound';
const vowels: Card[] = [
	card('v-a', 'ㅏ', V, ['a'], 'As in father. Tall vowel — consonant sits left.', 'lab02', 'vowel'),
	card('v-ya', 'ㅑ', V, ['ya'], 'ㅏ with a second tick: adds a y-glide.', 'lab02', 'vowel'),
	card('v-eo', 'ㅓ', V, ['eo', 'uh'], 'Unrounded, back — like the vowel in "duh". Not ㅗ.', 'lab02', 'vowel'),
	card('v-yeo', 'ㅕ', V, ['yeo'], 'ㅓ plus the y-glide tick.', 'lab02', 'vowel'),
	card('v-o', 'ㅗ', V, ['o'], 'Rounded lips. Wide vowel — consonant sits on top.', 'lab02', 'vowel'),
	card('v-yo', 'ㅛ', V, ['yo'], 'ㅗ plus the y-glide tick.', 'lab02', 'vowel'),
	card('v-u', 'ㅜ', V, ['u', 'oo'], 'As in moon. Wide vowel — consonant on top.', 'lab02', 'vowel'),
	card('v-yu', 'ㅠ', V, ['yu'], 'ㅜ plus the y-glide tick.', 'lab02', 'vowel'),
	card('v-eu', 'ㅡ', V, ['eu'], 'No English equivalent. Lips spread, unrounded, back of the mouth.', 'lab02', 'vowel'),
	card('v-i', 'ㅣ', V, ['i', 'ee'], 'As in machine. Tall vowel.', 'lab02', 'vowel')
];

/* ---------- tier lab03: the 11 compounds, plus construction ---------- */
const compounds: Card[] = [
	card('x-ae', 'ㅐ', V, ['ae', 'e'], 'ㅏ + ㅣ. Merged with ㅔ in modern Seoul speech.', 'lab03', 'compound'),
	card('x-yae', 'ㅒ', V, ['yae', 'ye'], 'ㅑ + ㅣ. Merged with ㅖ.', 'lab03', 'compound'),
	card('x-e', 'ㅔ', V, ['e'], 'ㅓ + ㅣ. Merged with ㅐ — 개 and 게 are homophones.', 'lab03', 'compound'),
	card('x-ye', 'ㅖ', V, ['ye'], 'ㅕ + ㅣ.', 'lab03', 'compound'),
	card('x-wa', 'ㅘ', V, ['wa'], 'ㅗ + ㅏ. A wrapping vowel — consonant sits top-left.', 'lab03', 'compound'),
	card('x-wae', 'ㅙ', V, ['wae', 'we'], 'ㅗ + ㅐ. Merged with ㅚ and ㅞ.', 'lab03', 'compound'),
	card('x-oe', 'ㅚ', V, ['oe', 'we'], 'ㅗ + ㅣ. Merged with ㅙ and ㅞ.', 'lab03', 'compound'),
	card('x-wo', 'ㅝ', V, ['wo'], 'ㅜ + ㅓ.', 'lab03', 'compound'),
	card('x-we', 'ㅞ', V, ['we'], 'ㅜ + ㅔ. Merged with ㅙ and ㅚ.', 'lab03', 'compound'),
	card('x-wi', 'ㅟ', V, ['wi'], 'ㅜ + ㅣ.', 'lab03', 'compound'),
	card('x-ui', 'ㅢ', V, ['ui', 'eui'], 'ㅡ + ㅣ. Says "i" mid-word, "e" as the possessive particle.', 'lab03', 'compound')
];

/**
 * Construction cards. The accepted answers are derived from the same fusion
 * table the labs use, so these can never disagree with the lesson.
 */
const ROMAN: Record<string, string> = {
	'ㅏ': 'a', 'ㅑ': 'ya', 'ㅓ': 'eo', 'ㅕ': 'yeo', 'ㅗ': 'o', 'ㅛ': 'yo',
	'ㅜ': 'u', 'ㅠ': 'yu', 'ㅡ': 'eu', 'ㅣ': 'i', 'ㅐ': 'ae', 'ㅔ': 'e'
};

const construction: Card[] = ['ㅐ', 'ㅘ', 'ㅝ', 'ㅟ', 'ㅢ'].map((compound) => {
	const parts = fusionParts(compound)!;
	const roman = `${ROMAN[parts[0]]}+${ROMAN[parts[1]]}`;
	return card(
		`k-${compound}`, compound, 'which two vowels build this? (e.g. "a+i")',
		[roman, `${parts[0]}+${parts[1]}`],
		`${parts[0]} + ${parts[1]}.`, 'lab03', 'build'
	);
});

/* ---------- tier lab04: the 16 finals ---------- */
const FINAL_ROMAN: Record<string, string> = {
	'ㄱ': 'k', 'ㄴ': 'n', 'ㄷ': 't', 'ㄹ': 'l', 'ㅁ': 'm', 'ㅂ': 'p', 'ㅇ': 'ng'
};

const FINAL_NOTES: Record<string, string> = {
	'ㄱ': 'Unreleased k. ㄱ ㄲ ㅋ all land here.',
	'ㄲ': 'Neutralizes to [ㄱ].',
	'ㅋ': 'Neutralizes to [ㄱ] — aspiration is a top-of-block luxury.',
	'ㄴ': 'Stays n.',
	'ㄷ': 'Unreleased t — the largest group.',
	'ㅅ': 'Neutralizes to [ㄷ]. This is why 낫 and 낮 sound identical.',
	'ㅆ': 'Neutralizes to [ㄷ].',
	'ㅈ': 'Neutralizes to [ㄷ].',
	'ㅊ': 'Neutralizes to [ㄷ].',
	'ㅌ': 'Neutralizes to [ㄷ].',
	'ㅎ': 'Neutralizes to [ㄷ] — though it usually aspirates the next sound instead.',
	'ㄹ': 'Becomes a clear l at the bottom of a block.',
	'ㅁ': 'Stays m.',
	'ㅂ': 'Unreleased p.',
	'ㅍ': 'Neutralizes to [ㅂ].',
	'ㅇ': 'Here the circle finally makes a sound: ng, as in sing.'
};

/** Answers derive from the phonology module — deck and lab cannot drift. */
const batchim: Card[] = Object.keys(FINAL_NOTES).map((jamo) =>
	card(
		`b-${jamo}`, jamo, 'sound as a BATCHIM (bottom of the block)',
		[FINAL_ROMAN[batchimSound(jamo)]],
		FINAL_NOTES[jamo], 'lab04', 'batchim'
	)
);

/* ---------- tier lab05: the 11 clusters ---------- */
const CLUSTER_NOTES: Record<string, string> = {
	'ㄳ': 'First letter wins. 몫 → [목].',
	'ㄵ': 'First letter wins. 앉다 → [안따].',
	'ㄶ': 'ㅎ leaves the slot but aspirates what follows. 많다 → [만타].',
	'ㄺ': 'SECOND letter wins. 읽다 → [익따]. Exception: a verb stem before ㄱ → [ㄹ].',
	'ㄻ': 'Second letter wins. 삶 → [삼].',
	'ㄼ': 'First letter wins. 여덟 → [여덜]. Exception: 밟다 → [밥따].',
	'ㄽ': 'First letter wins. 외곬 → [외골].',
	'ㄾ': 'First letter wins. 핥다 → [할따].',
	'ㄿ': 'Second letter wins. 읊다 → [읍따].',
	'ㅀ': 'ㅎ leaves the slot but aspirates what follows. 싫다 → [실타].',
	'ㅄ': 'First letter wins. 없다 → [업따].'
};

const clusters: Card[] = Object.keys(CLUSTER_NOTES).map((jamo) =>
	card(
		`g-${jamo}`, jamo, 'which sound survives before a consonant or pause?',
		[FINAL_ROMAN[batchimSound(jamo)]],
		CLUSTER_NOTES[jamo], 'lab05', 'cluster'
	)
);

/* ---------- tier lab06: liaison (written word → spoken form) ---------- */

const LIAISON_NOTES: Record<string, string> = {
	'한국어': 'ㄱ jumps into the placeholder. han-guk-eo is the spelling; [한구거] is the sound.',
	'음악': 'ㅁ would rather be an onset than an unreleased stop: [으막].',
	'옷이': 'Isolation flattened ㅅ to ㄷ. A vowel brings ㅅ back: [오시], not [오디].',
	'밭에': 'ㅌ comes back as ㅌ: [바테]. 밭이 palatalizes later — that is not this card.',
	'부엌에': 'ㅋ comes back as ㅋ, not ㄱ: [부어케].',
	'강이': 'ㅇ-batchim is already ng. Moving it would silence it. [강이], not [가이].',
	'읽어요': 'Cluster splits: ㄹ stays, ㄱ jumps. [일거요]. Rule B was isolation only.',
	'앉아': '앉다 threw ㅈ away. Here it jumps: [안자].',
	'없어': 'ㅂ stays; ㅅ jumps and tenses. [업써]. Article 14 just says so.',
	'한글을': 'Particle 을. ㄹ jumps: [한그를].'
};

const liaison: Card[] = Object.keys(LIAISON_NOTES).map((written) => {
	const spoken = applyLiaison(written);
	return card(
		`p-${written}`,
		written,
		'how is this said? (hyphenated cuts, or Hangul)',
		[romanizeWord(spoken), spoken],
		LIAISON_NOTES[written],
		'lab06',
		'pron'
	);
});

/* ---------- tier lab07: tensification and nasalization ---------- */

const CONTACT_NOTES: Record<string, string> = {
	'학교': 'A stop then ㄱ tenses the next letter: [학꾜].',
	'먹다': 'A stop then ㄷ tenses: [먹따].',
	'잡지': 'A stop then ㅈ tenses: [잡찌].',
	'식당': 'A stop then ㄷ tenses: [식땅].',
	'국밥': 'A stop then ㅂ tenses: [국빱].',
	'국물': 'ㄱ before ㅁ becomes ㅇ: [궁물].',
	'입니다': 'ㅂ before ㄴ becomes ㅁ: [임니다].',
	'학년': 'ㄱ before ㄴ becomes ㅇ: [항년].',
	'닫는': 'ㄷ before ㄴ becomes ㄴ: [단는].',
	'밥물': 'ㅂ before ㅁ becomes ㅁ: [밤물].'
};

const contact: Card[] = Object.keys(CONTACT_NOTES).map((written) => {
	const spoken = applyTensification(written) !== written
		? applyTensification(written)
		: applyNasalization(written);
	return card(
		`p-${written}`,
		written,
		'how is this said? (hyphenated cuts, or Hangul)',
		[romanizeWord(spoken), spoken],
		CONTACT_NOTES[written],
		'lab07',
		'pron'
	);
});

/* ---------- assembly ---------- */

const blockCatalog: Card[] = blockEntries();

export const DECK: Card[] = [
	...consonants, ...vowels, ...compounds, ...construction, ...batchim, ...clusters,
	...liaison, ...contact, ...blockCatalog
];

export const CARDS_BY_ID: Record<string, Card> = Object.fromEntries(
	DECK.map((c) => [c.id, c])
);

export interface Tier {
	id: string;
	label: string;
	lab: string;
	size: number;
}

export const TIERS: Tier[] = [
	{ id: 'lab01', label: 'Consonants', lab: '0001', size: consonants.length },
	{ id: 'lab02', label: 'Vowels · blocks', lab: '0002', size: vowels.length + blockCatalog.filter((c) => c.tier === 'lab02').length },
	{ id: 'lab03', label: 'Compounds · blocks', lab: '0003', size: compounds.length + construction.length + blockCatalog.filter((c) => c.tier === 'lab03').length },
	{ id: 'lab04', label: 'Batchim · blocks', lab: '0004', size: batchim.length + blockCatalog.filter((c) => c.tier === 'lab04').length },
	{ id: 'lab05', label: 'Clusters · blocks', lab: '0005', size: clusters.length + blockCatalog.filter((c) => c.tier === 'lab05').length },
	{ id: 'lab06', label: 'Liaison', lab: '0006', size: liaison.length },
	{ id: 'lab07', label: 'Stops', lab: '0007', size: contact.length }
];

export function cardsOfTier(tier: string): Card[] {
	return DECK.filter((c) => c.tier === tier);
}

/** Normalize a typed answer for comparison: case, spacing and stray punctuation. */
export function normalize(input: string): string {
	return input.toLowerCase().replace(/\s+/g, '').replace(/[.,!?]/g, '');
}

export function normalizePron(input: string): string {
	return input.normalize('NFC').toLowerCase().replace(/\s+/g, '').replace(/[\[\].,!?]/g, '');
}

export function checkAnswer(card: Card, typed: string): boolean {
	if (card.kind === 'pron') {
		const t = normalizePron(typed);
		return t.length > 0 && card.answers.some((a) => normalizePron(a) === t);
	}
	const t = normalize(typed);
	return t.length > 0 && card.answers.some((a) => normalize(a) === t);
}
