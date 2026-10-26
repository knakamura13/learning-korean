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
import {
	applyLiaison, applyTensification, applyNasalization, applyHMerge, applyFlow,
	batchimSound, fusionParts, pronounceWord, romanizeWord
} from './hangul';
import { VOCAB_PACKS, WORDS } from './words';

export type CardKind =
	| 'consonant' | 'vowel' | 'compound' | 'build' | 'batchim' | 'cluster'
	| 'pron' | 'block' | 'meaning';

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
	'ㅅ': 'Neutralizes to [ㄷ]. This is why 낫 (nat, "sickle") and 낮 (nat, "daytime") sound identical.',
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
	'ㄳ': 'First letter wins. 몫 (mok, "share") → [목] (mok).',
	'ㄵ': 'First letter wins. 앉다 (anj-da, "to sit") → [안따] (an-tta).',
	'ㄶ': 'ㅎ leaves the slot but aspirates what follows. 많다 (man-ta, "to be many") → [만타] (man-ta).',
	'ㄺ': 'SECOND letter wins. 읽다 (ik-da, "to read") → [익따] (ik-tta). Exception: a verb stem before ㄱ → [ㄹ].',
	'ㄻ': 'Second letter wins. 삶 (sam, "life") → [삼] (sam).',
	'ㄼ': 'First letter wins. 여덟 (yeo-deol, "eight") → [여덜] (yeo-deol). Exception: 밟다 (bap-da, "to step on") → [밥따] (bap-tta).',
	'ㄽ': 'First letter wins. 외곬 (oe-gol, "single path") → [외골] (oe-gol).',
	'ㄾ': 'First letter wins. 핥다 (halt-da, "to lick") → [할따] (hal-tta).',
	'ㄿ': 'Second letter wins. 읊다 (eup-da, "to recite") → [읍따] (eup-tta).',
	'ㅀ': 'ㅎ leaves the slot but aspirates what follows. 싫다 (sil-ta, "to dislike") → [실타] (sil-ta).',
	'ㅄ': 'First letter wins. 없다 (eop-da, "to not exist") → [업따] (eop-tta).'
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
	'한국어': 'ㄱ jumps into the placeholder. han-guk-eo is the spelling; [한구거] (han-gu-geo) is the sound.',
	'음악': 'ㅁ would rather be an onset than an unreleased stop: [으막] (eu-mag).',
	'옷이': 'Isolation flattened ㅅ to ㄷ. A vowel brings ㅅ back: [오시] (o-si), not [오디] (o-di).',
	'밭에': 'ㅌ comes back as ㅌ: [바테] (ba-te). 밭이 (bat-i) palatalizes later — that is not this card.',
	'부엌에': 'ㅋ comes back as ㅋ, not ㄱ: [부어케] (bu-eo-ke).',
	'강이': 'ㅇ-batchim is already ng. Moving it would silence it: [강이] (gang-i), not [가이] (ga-i).',
	'읽어요': 'Cluster splits: ㄹ stays, ㄱ jumps: [일거요] (il-geo-yo). Rule B was isolation only.',
	'앉아': '앉다 (anj-da, "to sit") threw ㅈ away. Here it jumps: [안자] (an-ja).',
	'없어': 'ㅂ stays; ㅅ jumps and tenses: [업써] (eop-sseo).',
	'한글을': 'Particle 을 (eul). ㄹ jumps: [한그를] (han-geu-reul).'
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
	'학교': 'A stop then ㄱ tenses the next letter: [학꾜] (hak-kkyo).',
	'먹다': 'A stop then ㄷ tenses: [먹따] (meok-tta).',
	'잡지': 'A stop then ㅈ tenses: [잡찌] (jap-jji).',
	'식당': 'A stop then ㄷ tenses: [식땅] (sik-ttang).',
	'국밥': 'A stop then ㅂ tenses: [국빱] (guk-ppap).',
	'국물': 'ㄱ before ㅁ becomes ㅇ: [궁물] (gung-mul).',
	'입니다': 'ㅂ before ㄴ becomes ㅁ: [임니다] (im-ni-da).',
	'학년': 'ㄱ before ㄴ becomes ㅇ: [항년] (hang-nyeon).',
	'닫는': 'ㄷ before ㄴ becomes ㄴ: [단는] (dan-neun).',
	'밥물': 'ㅂ before ㅁ becomes ㅁ: [밤물] (bam-mul).'
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

/* ---------- tier lab08: ㅎ at the junction ---------- */

const HMERGE_NOTES: Record<string, string> = {
	'좋고': 'ㅎ hands its puff to ㄱ: [조코] (jo-ko).',
	'좋다': 'ㅎ + ㄷ fuse into ㅌ: [조타] (jo-ta).',
	'놓지': 'ㅎ + ㅈ fuse into ㅊ: [노치] (no-chi).',
	'많다': 'ㄶ keeps ㄴ and spends its ㅎ on ㄷ: [만타] (man-ta).',
	'싫다': 'ㅀ keeps ㄹ and spends its ㅎ on ㄷ: [실타] (sil-ta).',
	'축하': 'The stop fuses forward into ㅋ: [추카] (chu-ka).',
	'입학': 'ㅂ + ㅎ fuse into ㅍ: [이팍] (i-pak).',
	'못하다': 'ㅅ neutralizes to [ㄷ] first, then fuses into ㅌ: [모타다] (mo-ta-da).',
	'좋아요': 'ㅎ before a vowel is simply not said: [조아요] (jo-a-yo).',
	'많아': 'The ㅎ dies and ㄴ makes the jump: [마나] (ma-na).'
};

const hmerge: Card[] = Object.keys(HMERGE_NOTES).map((written) => {
	const spoken = applyHMerge(written);
	return card(
		`p-${written}`,
		written,
		'how is this said? (hyphenated cuts, or Hangul)',
		[romanizeWord(spoken), spoken],
		HMERGE_NOTES[written],
		'lab08',
		'pron'
	);
});

/* ---------- tier lab09: ㄹ at the junction ---------- */

const FLOW_NOTES: Record<string, string> = {
	'신라': 'ㄴ meets ㄹ and flows: [실라] (sil-la).',
	'한라산': 'Same flow inside the mountain\'s name: [할라산] (hal-la-san).',
	'연락': 'ㄴ + ㄹ flows: [열락] (yeol-lak). 연락해 (yeol-lak-hae) — text me.',
	'편리': 'ㄴ + ㄹ flows: [펼리] (pyeol-li).',
	'설날': 'ㄹ first, same outcome: [설랄] (seol-lal).',
	'실내': 'ㄹ + ㄴ flows: [실래] (sil-lae).',
	'심리': 'Behind the ㅁ wall the ㄹ yields: [심니] (sim-ni).',
	'종로': 'Behind the ㅇ wall: [종노] (jong-no) — hence the Jongno signage.',
	'음료수': 'ㅁ then ㄹ: the ㄹ yields to ㄴ: [음뇨수] (eum-nyo-su).',
	'대통령': 'ㅇ then ㄹ: [대통녕] (dae-tong-nyeong).'
};

/** Lead-ㄹ blocks romanize with r; the assimilated l-l spelling is accepted too. */
function withLlVariant(answers: string[]): string[] {
	const variants = answers.map((a) => a.replace(/l-r/g, 'l-l')).filter((v) => !answers.includes(v));
	return [...answers, ...variants];
}

const flow: Card[] = Object.keys(FLOW_NOTES).map((written) => {
	const spoken = applyFlow(written);
	return card(
		`p-${written}`,
		written,
		'how is this said? (hyphenated cuts, or Hangul)',
		withLlVariant([romanizeWord(spoken), spoken]),
		FLOW_NOTES[written],
		'lab09',
		'pron'
	);
});

/* ---------- tier lab10: names and address (the people in the mission) ---------- */

/**
 * Fronts are real full names, vocatives, and one honorific — words a message
 * from a Korean speaker actually contains. Spoken forms derive from the full
 * pronunciation chain, so a name whose real-life sound needs an unmodeled
 * rule (ㄴ-insertion 김연아, stop-host ㄹ chains 박라온) cannot appear here.
 */
const NAME_NOTES: Record<string, string> = {
	'김민준': 'A nasal batchim, then plain consonants: nothing fires. Most names read as written.',
	'박은지': 'The surname\'s ㄱ jumps into 은: [바근지] (ba-geun-ji).',
	'박보검': 'A stop then ㅂ tenses: [박뽀검] (bak-ppo-geom).',
	'박서준': 'A stop then ㅅ tenses: [박써준] (bak-sseo-jun).',
	'박나래': 'ㄱ before ㄴ nasalizes: [방나래] (bang-na-rae).',
	'김백현': 'ㄱ + ㅎ fuse into ㅋ: [김배켠] (gim-bae-kyeon).',
	'하늘아': 'The vocative hands ㄹ a vowel to jump into: [하느라] (ha-neu-ra).',
	'민준아': 'Calling 민준 (min-jun) — the ㄴ jumps: [민주나] (min-ju-na).',
	'지우야': '야 after a vowel: no batchim, nothing to move.',
	'고객님': 'The honorific\'s ㄴ nasalizes the ㄱ: [고갱님] (go-gaeng-nim).'
};

const names: Card[] = Object.keys(NAME_NOTES).map((written) => {
	const spoken = pronounceWord(written);
	return card(
		`p-${written}`,
		written,
		'how is this said? (hyphenated cuts, or Hangul)',
		withLlVariant([romanizeWord(spoken), spoken]),
		NAME_NOTES[written],
		'lab10',
		'pron'
	);
});

/* ---------- vocabulary packs: meaning + pronunciation lanes ---------- */

/** Words the lab tiers already quiz for pronunciation — no duplicate lane. */
const LAB_PRON_FRONTS = new Set([
	...Object.keys(LIAISON_NOTES),
	...Object.keys(CONTACT_NOTES),
	...Object.keys(HMERGE_NOTES),
	...Object.keys(FLOW_NOTES),
	...Object.keys(NAME_NOTES)
]);

const vocabMeaning: Card[] = WORDS.map((word) =>
	card(
		`wm-${word.hangul}`,
		word.hangul,
		'what does this mean?',
		word.glosses,
		word.note ??
			(word.hangul === word.spoken ? 'Reads exactly as written.' : `Said [${word.spoken}].`),
		word.pack,
		'meaning'
	)
);

/** Pronunciation lane only where a sound change makes the spelling lie. */
const vocabPron: Card[] = WORDS.filter(
	(word) => word.hangul !== word.spoken && !LAB_PRON_FRONTS.has(word.hangul)
).map((word) =>
	card(
		`wp-${word.hangul}`,
		word.hangul,
		'how is this said? (hyphenated cuts, or Hangul)',
		withLlVariant([romanizeWord(word.spoken), word.spoken]),
		word.note ?? `Said [${word.spoken}].`,
		word.pack,
		'pron'
	)
);

export interface VocabTier {
	id: string;
	label: string;
	size: number;
}

export const VOCAB_TIERS: VocabTier[] = VOCAB_PACKS.map((pack) => ({
	id: pack.id,
	label: pack.label,
	size: vocabMeaning.filter((c) => c.tier === pack.id).length +
		vocabPron.filter((c) => c.tier === pack.id).length
}));

/* ---------- assembly ---------- */

const blockCatalog: Card[] = blockEntries();

export const DECK: Card[] = [
	...consonants, ...vowels, ...compounds, ...construction, ...batchim, ...clusters,
	...liaison, ...contact, ...hmerge, ...flow, ...names, ...blockCatalog,
	...vocabMeaning, ...vocabPron
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
	{ id: 'lab07', label: 'Stops', lab: '0007', size: contact.length },
	{ id: 'lab08', label: 'ㅎ merges', lab: '0008', size: hmerge.length },
	{ id: 'lab09', label: 'ㄹ flows', lab: '0009', size: flow.length },
	{ id: 'lab10', label: 'Names', lab: '0010', size: names.length }
];

export function cardsOfTier(tier: string): Card[] {
	return DECK.filter((c) => c.tier === tier);
}

/**
 * Normalize a typed answer for comparison: case, spacing, stray punctuation,
 * and apostrophes — glosses are authored apostrophe-free, so "I'm hungry"
 * and "im hungry" must both pass.
 */
export function normalize(input: string): string {
	return input.toLowerCase().replace(/\s+/g, '').replace(/[.,!?'’]/g, '');
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
