/**
 * hangul.ts — the phonology and orthography of Korean, as pure functions.
 *
 * Everything the labs and the review deck know about how Hangul works lives
 * here and nowhere else. Lessons never hard-code an answer they could derive:
 * a cluster card asks this module which letter survives, so a lesson can not
 * drift out of agreement with the deck that tests it.
 *
 * Sources: National Institute of Korean Language, Standard Pronunciation Rules
 * (표준 발음법, 1988) — Articles 8–12 for finals, neutralization and clusters.
 */

/** Initial-consonant slot (초성), in Unicode order. */
export const LEADS = [
	'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
	'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
] as const;

/** Vowel slot (중성), in Unicode order. */
export const VOWELS = [
	'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ',
	'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'
] as const;

/** Final slot (종성). Index 0 is "no batchim". */
export const FINALS = [
	'', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ',
	'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ',
	'ㅌ', 'ㅍ', 'ㅎ'
] as const;

export type Lead = (typeof LEADS)[number];
export type Vowel = (typeof VOWELS)[number];
export type Final = (typeof FINALS)[number];

// Pre-built maps for O(1) index lookup in compose() to avoid repeated linear Array.prototype.indexOf scans
const LEAD_MAP = new Map<string, number>(LEADS.map((x, i) => [x, i]));
const VOWEL_MAP = new Map<string, number>(VOWELS.map((x, i) => [x, i]));
const FINAL_MAP = new Map<string, number>(FINALS.map((x, i) => [x, i]));

const SYL_BASE = 0xac00;
const SYL_LAST = 0xd7a3;

/** Compose a syllable block. Returns '' if the pieces are not valid. */
export function compose(lead: string, vowel: string, final = ''): string {
	const l = LEAD_MAP.get(lead);
	const v = VOWEL_MAP.get(vowel);
	if (l === undefined || v === undefined) return '';
	const t = final ? FINAL_MAP.get(final) : 0;
	if (t === undefined) return '';
	return String.fromCharCode(SYL_BASE + (l * 21 + v) * 28 + t);
}

export interface Decomposed {
	lead: string;
	vowel: string;
	final: string;
}

// Cache decomposition results for bounded valid Hangul syllables (max 11,172 entries)
const DECOMPOSE_CACHE = new Map<string, Readonly<Decomposed>>();

/** Split a syllable block back into its three slots. */
export function decompose(syllable: string): Decomposed | null {
	if (syllable.length !== 1) return null;
	const code = syllable.charCodeAt(0) - SYL_BASE;
	if (code < 0 || code > SYL_LAST - SYL_BASE) return null;

	const cached = DECOMPOSE_CACHE.get(syllable);
	if (cached !== undefined) return cached;

	const res: Readonly<Decomposed> = Object.freeze({
		lead: LEADS[Math.floor(code / 588)],
		vowel: VOWELS[Math.floor((code % 588) / 28)],
		final: FINALS[code % 28]
	});
	DECOMPOSE_CACHE.set(syllable, res);
	return res;
}

/** True for a composed Hangul syllable block (not a bare jamo). */
export function isSyllable(ch: string): boolean {
	return decompose(ch) !== null;
}

/* ------------------------------------------------------------------ *
 * Consonant derivation
 * ------------------------------------------------------------------ */

/** The five shapes drawn from the articulators; everything else derives. */
export const BASE_SHAPES = ['ㄱ', 'ㄴ', 'ㅁ', 'ㅅ', 'ㅇ'] as const;

export type Derivation = 'stroke' | 'double';

/** Add a stroke to add breath; double the letter to tense it. */
const DERIVE: Record<string, Partial<Record<Derivation, string>>> = {
	'ㄱ': { stroke: 'ㅋ', double: 'ㄲ' },
	'ㄴ': { stroke: 'ㄷ' },
	'ㄷ': { stroke: 'ㅌ', double: 'ㄸ' },
	'ㅁ': { stroke: 'ㅂ' },
	'ㅂ': { stroke: 'ㅍ', double: 'ㅃ' },
	'ㅅ': { stroke: 'ㅈ', double: 'ㅆ' },
	'ㅈ': { stroke: 'ㅊ', double: 'ㅉ' },
	'ㅇ': { stroke: 'ㅎ' }
};

export function derive(letter: string, op: Derivation): string {
	return DERIVE[letter]?.[op] ?? '';
}

export function derivations(letter: string): Derivation[] {
	const entry = DERIVE[letter];
	if (!entry) return [];
	return (Object.keys(entry) as Derivation[]).filter((k) => !!entry[k]);
}

/** The base shape a consonant ultimately comes from, following derivations back. */
export function baseShapeOf(letter: string): string {
	if ((BASE_SHAPES as readonly string[]).includes(letter)) return letter;
	for (const [from, ops] of Object.entries(DERIVE)) {
		for (const target of Object.values(ops)) {
			if (target === letter) return baseShapeOf(from);
		}
	}
	return '';
}

/* ------------------------------------------------------------------ *
 * Vowels
 * ------------------------------------------------------------------ */

/** Vowel harmony classes. Neutral vowels (ㅡ ㅣ) are in neither set. */
export const BRIGHT = new Set(['ㅏ', 'ㅑ', 'ㅗ', 'ㅛ', 'ㅐ', 'ㅒ']);
export const DARK = new Set(['ㅓ', 'ㅕ', 'ㅜ', 'ㅠ', 'ㅔ', 'ㅖ']);

export type Harmony = 'bright' | 'dark' | 'neutral';

export function harmony(v: string): Harmony {
	if (BRIGHT.has(v)) return 'bright';
	if (DARK.has(v)) return 'dark';
	return 'neutral';
}

/**
 * Simple vowels built from a base stroke, a tick count, and a tick side.
 * This is the generative rule Lab 02 has the learner operate directly.
 */
const STROKE_TABLE: Record<string, Record<string, [string, string]>> = {
	'ㅣ': { right: ['ㅏ', 'ㅑ'], left: ['ㅓ', 'ㅕ'] },
	'ㅡ': { above: ['ㅗ', 'ㅛ'], below: ['ㅜ', 'ㅠ'] }
};

export type TickSide = 'left' | 'right' | 'above' | 'below';

export function sidesFor(base: string): TickSide[] {
	return base === 'ㅣ' ? ['left', 'right'] : base === 'ㅡ' ? ['above', 'below'] : [];
}

/** Build a simple vowel. `ticks` of 0 yields the bare base stroke. */
export function buildVowel(base: string, side: TickSide | null, ticks: number): string {
	if (!STROKE_TABLE[base]) return '';
	if (ticks === 0) return base;
	if (!side) return '';
	const pair = STROKE_TABLE[base][side];
	return pair ? (pair[ticks - 1] ?? '') : '';
}

/** The eleven compound vowels, as ordered pairs of simple vowels. */
const FUSIONS: Record<string, string> = {
	'ㅏ+ㅣ': 'ㅐ', 'ㅑ+ㅣ': 'ㅒ', 'ㅓ+ㅣ': 'ㅔ', 'ㅕ+ㅣ': 'ㅖ',
	'ㅗ+ㅏ': 'ㅘ', 'ㅗ+ㅐ': 'ㅙ', 'ㅗ+ㅣ': 'ㅚ',
	'ㅜ+ㅓ': 'ㅝ', 'ㅜ+ㅔ': 'ㅞ', 'ㅜ+ㅣ': 'ㅟ',
	'ㅡ+ㅣ': 'ㅢ'
};

// Pre-computed inverse lookup for fusionParts() to avoid O(N) iteration and string splitting on every lookup
const FUSION_PARTS_MAP: Record<string, [string, string]> = Object.fromEntries(
	Object.entries(FUSIONS).map(([key, value]) => [value, key.split('+') as [string, string]])
);

/** Fuse two vowels into a compound. '' when no such vowel exists. */
export function fuse(a: string, b: string): string {
	if (!a || !b) return '';
	return FUSIONS[`${a}+${b}`] ?? '';
}

/** The parts a compound vowel is built from, or null if it is not a compound. */
export function fusionParts(compound: string): [string, string] | null {
	return FUSION_PARTS_MAP[compound] ?? null;
}

/**
 * Vowels that merged in modern Seoul speech. Reading still distinguishes them;
 * hearing does not. Grouped by the sound they share.
 */
export const VOWEL_MERGERS: string[][] = [
	['ㅐ', 'ㅔ'],
	['ㅒ', 'ㅖ'],
	['ㅙ', 'ㅚ', 'ㅞ']
];

export function mergedWith(v: string): string[] {
	const group = VOWEL_MERGERS.find((g) => g.includes(v));
	return group ? group.filter((x) => x !== v) : [];
}

/* ------------------------------------------------------------------ *
 * Finals — neutralization and clusters
 * ------------------------------------------------------------------ */

/** The seven sounds every batchim collapses to (대표음). */
export const REPRESENTATIVE = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅇ'] as const;
export type Representative = (typeof REPRESENTATIVE)[number];

const NEUTRALISE: Record<string, Representative> = {
	// [k] — Article 9 plus cluster Articles 10/11
	'ㄱ': 'ㄱ', 'ㄲ': 'ㄱ', 'ㅋ': 'ㄱ', 'ㄳ': 'ㄱ', 'ㄺ': 'ㄱ',
	// [n]
	'ㄴ': 'ㄴ', 'ㄵ': 'ㄴ', 'ㄶ': 'ㄴ',
	// [t] — the largest group, and the source of most homophones
	'ㄷ': 'ㄷ', 'ㅅ': 'ㄷ', 'ㅆ': 'ㄷ', 'ㅈ': 'ㄷ', 'ㅊ': 'ㄷ', 'ㅌ': 'ㄷ', 'ㅎ': 'ㄷ',
	// [l]
	'ㄹ': 'ㄹ', 'ㄼ': 'ㄹ', 'ㄽ': 'ㄹ', 'ㄾ': 'ㄹ', 'ㅀ': 'ㄹ',
	// [m]
	'ㅁ': 'ㅁ', 'ㄻ': 'ㅁ',
	// [p]
	'ㅂ': 'ㅂ', 'ㅍ': 'ㅂ', 'ㄿ': 'ㅂ', 'ㅄ': 'ㅂ',
	// [ŋ]
	'ㅇ': 'ㅇ'
};

/** Which of the seven sounds a written final actually makes. */
export function batchimSound(final: string): Representative | '' {
	return NEUTRALISE[final] ?? '';
}

/** The two consonants sharing a cluster's slot, in written order. */
const CLUSTER_PARTS: Record<string, [string, string]> = {
	'ㄳ': ['ㄱ', 'ㅅ'], 'ㄵ': ['ㄴ', 'ㅈ'], 'ㄶ': ['ㄴ', 'ㅎ'],
	'ㄺ': ['ㄹ', 'ㄱ'], 'ㄻ': ['ㄹ', 'ㅁ'], 'ㄼ': ['ㄹ', 'ㅂ'],
	'ㄽ': ['ㄹ', 'ㅅ'], 'ㄾ': ['ㄹ', 'ㅌ'], 'ㄿ': ['ㄹ', 'ㅍ'],
	'ㅀ': ['ㄹ', 'ㅎ'], 'ㅄ': ['ㅂ', 'ㅅ']
};

export const CLUSTERS = Object.keys(CLUSTER_PARTS);

export function isCluster(final: string): boolean {
	return final in CLUSTER_PARTS;
}

export function clusterParts(final: string): [string, string] | null {
	const parts = CLUSTER_PARTS[final];
	return parts ? [parts[0], parts[1]] : null;
}

/**
 * Which member of a cluster survives before a consonant or a pause.
 * 'first' is Article 10, 'second' is Article 11. ㅎ-clusters keep their first
 * member in the slot but spend the ㅎ aspirating whatever follows.
 */
export type ClusterRule = 'first' | 'second' | 'h';

export function clusterRule(final: string): ClusterRule | null {
	const parts = clusterParts(final);
	if (!parts) return null;
	if (parts[1] === 'ㅎ') return 'h';
	return batchimSound(final) === batchimSound(parts[0]) ? 'first' : 'second';
}

/* ------------------------------------------------------------------ *
 * Liaison (연음) — Articles 13–14
 * ------------------------------------------------------------------ */

/**
 * Move a batchim into the following placeholder ㅇ.
 *
 * Articles 13–14 only. Does not palatalize (밭이 → 바티, not 바치),
 * does not drop ㅎ, and does not apply Article 15 representative-sound
 * liaison across content morphemes. Cluster-final ㅅ tenses to ㅆ
 * when it jumps; other tensification is out of scope.
 */
export function applyLiaison(word: string): string {
	const chars = [...word];
	if (chars.length === 0) return word;
	const parts = chars.map((ch) => decompose(ch));
	if (parts.some((p) => p === null)) return word;

	const out = parts.map((p) => ({ ...p! }));
	for (let i = 0; i < out.length - 1; i++) {
		const cur = out[i];
		const next = out[i + 1];
		if (!cur.final || next.lead !== 'ㅇ') continue;
		if (cur.final === 'ㅇ' || cur.final === 'ㅎ') continue;
		const cluster = clusterParts(cur.final);
		if (cluster) {
			if (cluster[1] === 'ㅎ') continue;
			cur.final = cluster[0];
			next.lead = cluster[1] === 'ㅅ' ? 'ㅆ' : cluster[1];
		} else {
			next.lead = cur.final;
			cur.final = '';
		}
	}
	return out.map((p) => compose(p.lead, p.vowel, p.final)).join('');
}

/** Written batchim letters that could jump (cluster members, not tensed ㅆ). */
export function liaisonSources(word: string): string[] {
	const parts = [...word].map((ch) => decompose(ch));
	const sources: string[] = [];
	for (let i = 0; i < parts.length - 1; i++) {
		const cur = parts[i];
		const next = parts[i + 1];
		if (!cur || !next || !cur.final || next.lead !== 'ㅇ') continue;
		if (cur.final === 'ㅎ') continue;
		const cluster = clusterParts(cur.final);
		if (cluster) {
			if (cluster[1] === 'ㅎ') continue;
			sources.push(cluster[0], cluster[1]);
		} else {
			sources.push(cur.final);
		}
	}
	return sources;
}

export type LiaisonAction = { type: 'stay' } | { type: 'move'; jamo: string };

/** The one tap the widget should accept for this written word. */
export function liaisonAction(word: string): LiaisonAction {
	if (applyLiaison(word) === word) return { type: 'stay' };
	const before = [...word].map((ch) => decompose(ch));
	const after = [...applyLiaison(word)].map((ch) => decompose(ch));
	for (let i = 0; i < before.length; i++) {
		const a = before[i];
		const b = after[i];
		if (!a || !b || a.final === b.final) continue;
		const parts = clusterParts(a.final);
		if (parts) return { type: 'move', jamo: parts[1] };
		return { type: 'move', jamo: a.final };
	}
	return { type: 'stay' };
}

/* ------------------------------------------------------------------ *
 * Tensification / nasalization — Articles 23 and 18
 * ------------------------------------------------------------------ */

const STOP_BATCHIM = new Set(['ㄱ', 'ㄷ', 'ㅂ']);
const TENSEABLE_LEAD = new Set(['ㄱ', 'ㄷ', 'ㅂ', 'ㅅ', 'ㅈ']);
const TENSE_LEAD: Record<string, string> = {
	'ㄱ': 'ㄲ', 'ㄷ': 'ㄸ', 'ㅂ': 'ㅃ', 'ㅅ': 'ㅆ', 'ㅈ': 'ㅉ'
};
const NASAL_LEAD = new Set(['ㄴ', 'ㅁ']);
const NASAL_FROM_STOP: Record<string, string> = {
	'ㄱ': 'ㅇ', 'ㄷ': 'ㄴ', 'ㅂ': 'ㅁ'
};

function skipContactJunction(cur: { lead: string; vowel: string; final: string }, next: { lead: string; vowel: string; final: string }): boolean {
	if (!cur.final) return true;
	if (isCluster(cur.final)) return true;
	if (cur.final === 'ㅎ') return true;
	if (next.lead === 'ㅇ' || next.lead === 'ㅎ') return true;
	return false;
}

function mapSyllables(word: string, fn: (out: { lead: string; vowel: string; final: string }[]) => void): string {
	const chars = [...word];
	if (chars.length === 0) return word;
	const parts = chars.map((ch) => decompose(ch));
	if (parts.some((p) => p === null)) return word;
	const out = parts.map((p) => ({ ...p! }));
	fn(out);
	return out.map((p) => compose(p.lead, p.vowel, p.final)).join('');
}

/**
 * Tense a following plain ㄱ/ㄷ/ㅂ/ㅅ/ㅈ after a stop batchim.
 * Article 23 only. Clusters, ㅎ, liaison, and nasalization are out of scope.
 */
export function applyTensification(word: string): string {
	return mapSyllables(word, (out) => {
		for (let i = 0; i < out.length - 1; i++) {
			const cur = out[i];
			const next = out[i + 1];
			if (skipContactJunction(cur, next)) continue;
			const stop = batchimSound(cur.final);
			if (!STOP_BATCHIM.has(stop) || !TENSEABLE_LEAD.has(next.lead)) continue;
			const tensed = TENSE_LEAD[next.lead];
			if (!tensed) continue;
			cur.final = stop;
			next.lead = tensed;
		}
	});
}

/**
 * ㄱ/ㄷ/ㅂ become ㅇ/ㄴ/ㅁ before ㄴ or ㅁ.
 * Article 18 only. Article 19 (stop + ㄹ) is out of scope.
 */
export function applyNasalization(word: string): string {
	return mapSyllables(word, (out) => {
		for (let i = 0; i < out.length - 1; i++) {
			const cur = out[i];
			const next = out[i + 1];
			if (skipContactJunction(cur, next)) continue;
			const stop = batchimSound(cur.final);
			if (!STOP_BATCHIM.has(stop) || !NASAL_LEAD.has(next.lead)) continue;
			const nasal = NASAL_FROM_STOP[stop];
			if (!nasal) continue;
			cur.final = nasal;
		}
	});
}

export function applyContact(word: string): string {
	const tensed = applyTensification(word);
	if (tensed !== word) return tensed;
	return applyNasalization(word);
}

export type ContactAction = { type: 'stay' } | { type: 'tense' } | { type: 'nasal' };

export function contactAction(word: string): ContactAction {
	if (applyTensification(word) !== word) return { type: 'tense' };
	if (applyNasalization(word) !== word) return { type: 'nasal' };
	return { type: 'stay' };
}

/* ------------------------------------------------------------------ *
 * ㅎ at a junction — Article 12 (aspiration, ㅎ-deletion)
 * ------------------------------------------------------------------ */

/** ㅎ merging into a following plain consonant (ㅎ-batchim direction). */
const ASPIRATED_FROM_LEAD: Record<string, string> = {
	'ㄱ': 'ㅋ', 'ㄷ': 'ㅌ', 'ㅈ': 'ㅊ'
};

/** A stop representative merging with a following ㅎ (stop-batchim direction). */
const ASPIRATED_FROM_STOP: Record<string, string> = {
	'ㄱ': 'ㅋ', 'ㄷ': 'ㅌ', 'ㅂ': 'ㅍ'
};

/** What an ㅎ-family batchim leaves behind once its ㅎ is spent. */
const H_REMAINDER: Record<string, string> = {
	'ㅎ': '', 'ㄶ': 'ㄴ', 'ㅀ': 'ㄹ'
};

/**
 * Fuse ㅎ with an adjacent plain consonant into its aspirated twin.
 * Article 12 ①, both directions: an ㅎ-family batchim (ㅎ/ㄶ/ㅀ) before
 * ㄱ/ㄷ/ㅈ, or a stop batchim before an ㅎ lead. ㅎ+ㅅ→ㅆ and cluster
 * batchims before ㅎ (밝히다) are out of scope, like Article 15 is for
 * liaison — the widget words never need them.
 */
export function applyAspiration(word: string): string {
	return mapSyllables(word, (out) => {
		for (let i = 0; i < out.length - 1; i++) {
			const cur = out[i];
			const next = out[i + 1];
			if (!cur.final) continue;
			if (cur.final in H_REMAINDER && next.lead in ASPIRATED_FROM_LEAD) {
				next.lead = ASPIRATED_FROM_LEAD[next.lead];
				cur.final = H_REMAINDER[cur.final];
				continue;
			}
			if (next.lead !== 'ㅎ' || isCluster(cur.final)) continue;
			const stop = batchimSound(cur.final);
			const aspirated = ASPIRATED_FROM_STOP[stop];
			if (!aspirated) continue;
			next.lead = aspirated;
			cur.final = '';
		}
	});
}

/**
 * Drop an ㅎ-family batchim before a vowel. Article 12 ④: plain ㅎ simply
 * vanishes (좋아요 → 조아요); ㄶ/ㅀ spend the ㅎ and liaise the survivor
 * (많아 → 마나) — the jump applyLiaison deliberately refused to make.
 */
export function applyHDeletion(word: string): string {
	return mapSyllables(word, (out) => {
		for (let i = 0; i < out.length - 1; i++) {
			const cur = out[i];
			const next = out[i + 1];
			if (next.lead !== 'ㅇ' || !(cur.final in H_REMAINDER)) continue;
			const survivor = H_REMAINDER[cur.final];
			cur.final = '';
			if (survivor) next.lead = survivor;
		}
	});
}

export function applyHMerge(word: string): string {
	const aspirated = applyAspiration(word);
	if (aspirated !== word) return aspirated;
	return applyHDeletion(word);
}

export type HMergeAction = { type: 'stay' } | { type: 'aspirate' } | { type: 'delete' };

export function hMergeAction(word: string): HMergeAction {
	if (applyAspiration(word) !== word) return { type: 'aspirate' };
	if (applyHDeletion(word) !== word) return { type: 'delete' };
	return { type: 'stay' };
}

/* ------------------------------------------------------------------ *
 * ㄹ at a junction — Articles 20 and 19 (lateralization, ㄹ → ㄴ)
 * ------------------------------------------------------------------ */

const R_TO_N_HOSTS = new Set(['ㅁ', 'ㅇ']);

/**
 * ㄴ and ㄹ meeting in either order both come out ㄹㄹ.
 * Article 20 only. The lexical exceptions it lists (의견란-type
 * Sino-Korean compounds, which nasalize instead) are out of scope.
 */
export function applyLateralization(word: string): string {
	return mapSyllables(word, (out) => {
		for (let i = 0; i < out.length - 1; i++) {
			const cur = out[i];
			const next = out[i + 1];
			if (cur.final === 'ㄴ' && next.lead === 'ㄹ') cur.final = 'ㄹ';
			else if (cur.final === 'ㄹ' && next.lead === 'ㄴ') next.lead = 'ㄹ';
		}
	});
}

/**
 * A lead ㄹ after ㅁ or ㅇ becomes ㄴ. Article 19's nasal-host half only —
 * the stop-host chains (독립 → 동닙, two rules stacking) stay out of the
 * widget's scope and are named honestly in the lab instead.
 */
export function applyRToN(word: string): string {
	return mapSyllables(word, (out) => {
		for (let i = 0; i < out.length - 1; i++) {
			const cur = out[i];
			const next = out[i + 1];
			if (R_TO_N_HOSTS.has(cur.final) && next.lead === 'ㄹ') next.lead = 'ㄴ';
		}
	});
}

export function applyFlow(word: string): string {
	const lateral = applyLateralization(word);
	if (lateral !== word) return lateral;
	return applyRToN(word);
}

export type FlowAction = { type: 'stay' } | { type: 'lateral' } | { type: 'nasal' };

export function flowAction(word: string): FlowAction {
	if (applyLateralization(word) !== word) return { type: 'lateral' };
	if (applyRToN(word) !== word) return { type: 'nasal' };
	return { type: 'stay' };
}

/**
 * Every drilled junction rule chained to a fixpoint. Derivation order: ㅎ
 * resolves first (it decides whether liaison even sees the junction), then
 * liaison fills empty onsets, then the stop rules, then ㄹ. Covers exactly
 * what the labs cover — words needing ㄴ-insertion (서울역), stop-host ㄹ
 * chains (독립), or palatalization (같이) are outside this function and must
 * not enter the vocabulary corpus; the corpus test enforces that by checking
 * every entry's authored spoken form against this derivation.
 */
export function pronounceWord(word: string): string {
	let out = word;
	for (let i = 0; i < 4; i++) {
		const next = applyFlow(applyContact(applyLiaison(applyHMerge(out))));
		if (next === out) return out;
		out = next;
	}
	return out;
}

const LEAD_RR: Record<string, string> = {
	'ㄱ': 'g', 'ㄲ': 'kk', 'ㄴ': 'n', 'ㄷ': 'd', 'ㄸ': 'tt', 'ㄹ': 'r', 'ㅁ': 'm',
	'ㅂ': 'b', 'ㅃ': 'pp', 'ㅅ': 's', 'ㅆ': 'ss', 'ㅇ': '', 'ㅈ': 'j', 'ㅉ': 'jj',
	'ㅊ': 'ch', 'ㅋ': 'k', 'ㅌ': 't', 'ㅍ': 'p', 'ㅎ': 'h'
};

const VOWEL_RR: Record<string, string> = {
	'ㅏ': 'a', 'ㅐ': 'ae', 'ㅑ': 'ya', 'ㅒ': 'yae', 'ㅓ': 'eo', 'ㅔ': 'e',
	'ㅕ': 'yeo', 'ㅖ': 'ye', 'ㅗ': 'o', 'ㅘ': 'wa', 'ㅙ': 'wae', 'ㅚ': 'oe',
	'ㅛ': 'yo', 'ㅜ': 'u', 'ㅝ': 'wo', 'ㅞ': 'we', 'ㅟ': 'wi', 'ㅠ': 'yu',
	'ㅡ': 'eu', 'ㅢ': 'ui', 'ㅣ': 'i'
};

const FINAL_RR: Record<string, string> = {
	'': '', 'ㄱ': 'k', 'ㄲ': 'k', 'ㄳ': 'k', 'ㄴ': 'n', 'ㄵ': 'n', 'ㄶ': 'n',
	'ㄷ': 't', 'ㄹ': 'l', 'ㄺ': 'k', 'ㄻ': 'm', 'ㄼ': 'l', 'ㄽ': 'l', 'ㄾ': 'l',
	'ㄿ': 'p', 'ㅀ': 'l', 'ㅁ': 'm', 'ㅂ': 'p', 'ㅄ': 'p', 'ㅅ': 't', 'ㅆ': 't',
	'ㅇ': 'ng', 'ㅈ': 't', 'ㅊ': 't', 'ㅋ': 'k', 'ㅌ': 't', 'ㅍ': 'p', 'ㅎ': 't'
};

/** Phonetic job of a composer cell — not a tray label. */
export type JamoSlot = 'lead' | 'vowel' | 'batchim';

/**
 * Isolated Revised Romanization of one jamo in that job.
 * Empty when the glyph is missing, not a jamo, or silent (ㅇ as lead).
 */
export function jamoReading(jamo: string, slot: JamoSlot): string {
	switch (slot) {
		case 'lead':
			return LEAD_RR[jamo] ?? '';
		case 'vowel':
			return VOWEL_RR[jamo] ?? '';
		case 'batchim':
			return FINAL_RR[jamo] ?? '';
		default: {
			const _exhaustive: never = slot;
			void _exhaustive;
			return '';
		}
	}
}

// Cache romanization results for valid Hangul syllables to avoid repeated formatting (max 11,172 entries)
const ROMANIZE_SYLLABLE_CACHE = new Map<string, string>();

export function romanizeSyllable(ch: string): string {
	if (ch.length !== 1) return '';
	const cached = ROMANIZE_SYLLABLE_CACHE.get(ch);
	if (cached !== undefined) return cached;

	const parts = decompose(ch);
	if (!parts) return '';

	const res = `${jamoReading(parts.lead, 'lead')}${jamoReading(parts.vowel, 'vowel')}${jamoReading(parts.final, 'batchim')}`;
	ROMANIZE_SYLLABLE_CACHE.set(ch, res);
	return res;
}

/** Hyphenated RR of each block. Empty if any character is not a syllable. */
export function romanizeWord(word: string): string {
	const chars = [...word];
	if (chars.length === 0) return '';
	const parts = chars.map((ch) => romanizeSyllable(ch));
	if (parts.some((p) => p === '')) return '';
	return parts.join('-');
}

/* ------------------------------------------------------------------ *
 * Sound changes
 * ------------------------------------------------------------------ */

/**
 * The eight changes that stand between spelling and speech.
 *
 * Korean spelling is morphophonemic: it preserves the identity of a word part
 * rather than transcribing what you hear. These rules are that gap. Every
 * change except palatalization now has an apply function and a lab that
 * drills it; `scored` marks which ones the course covers.
 *
 * Source: 표준 발음법 (Standard Pronunciation Rules, 1988), Articles 12–23.
 */
export interface SoundChange {
	id: string;
	name: string;
	korean: string;
	trigger: string;
	examples: { written: string; spoken: string; gloss?: string }[];
	/** All but palatalization are scored lab steps. */
	scored: boolean;
}

export const SOUND_CHANGES: SoundChange[] = [
	{
		id: 'liaison',
		name: 'Liaison',
		korean: '연음',
		scored: true,
		trigger: 'a batchim followed by a syllable starting with ㅇ',
		examples: [
			{ written: '한국어', spoken: '한구거', gloss: 'Korean language' },
			{ written: '음악', spoken: '으막', gloss: 'music' }
		]
	},
	{
		id: 'tensification',
		name: 'Tensification',
		korean: '경음화',
		scored: true,
		trigger: 'a plain consonant after a ㄱ/ㄷ/ㅂ stop becomes tense',
		examples: [
			{ written: '학교', spoken: '학꾜', gloss: 'school' },
			{ written: '잡지', spoken: '잡찌', gloss: 'magazine' }
		]
	},
	{
		id: 'nasalization',
		name: 'Nasalization',
		korean: '비음화',
		scored: true,
		trigger: 'ㄱ/ㄷ/ㅂ before ㄴ/ㅁ become ㅇ/ㄴ/ㅁ',
		examples: [
			{ written: '국물', spoken: '궁물', gloss: 'broth' },
			{ written: '입니다', spoken: '임니다', gloss: 'it is' }
		]
	},
	{
		id: 'aspiration',
		name: 'Aspiration',
		korean: '격음화',
		scored: true,
		trigger: 'ㅎ next to ㄱ/ㄷ/ㅂ/ㅈ gives ㅋ/ㅌ/ㅍ/ㅊ',
		examples: [
			{ written: '좋고', spoken: '조코', gloss: 'good and…' },
			{ written: '축하', spoken: '추카', gloss: 'congratulations' }
		]
	},
	{
		id: 'lateralization',
		name: 'Lateralization',
		korean: '유음화',
		scored: true,
		trigger: 'ㄴ+ㄹ or ㄹ+ㄴ become ㄹㄹ',
		examples: [
			{ written: '신라', spoken: '실라', gloss: 'Silla' },
			{ written: '한라산', spoken: '할라산', gloss: 'Mt. Halla' }
		]
	},
	{
		id: 'r-to-n',
		name: 'ㄹ becomes ㄴ',
		korean: 'ㄹ의 비음화',
		scored: true,
		trigger: 'ㄹ after ㅁ/ㅇ/ㄱ/ㅂ becomes ㄴ',
		examples: [
			{ written: '대통령', spoken: '대통녕', gloss: 'president' },
			{ written: '심리', spoken: '심니', gloss: 'psychology' }
		]
	},
	{
		id: 'h-deletion',
		name: 'ㅎ deletion',
		korean: 'ㅎ 탈락',
		scored: true,
		trigger: 'a ㅎ batchim before a vowel simply drops',
		examples: [
			{ written: '좋아요', spoken: '조아요', gloss: 'it is good' },
			{ written: '많아', spoken: '마나', gloss: 'many' }
		]
	},
	{
		id: 'palatalization',
		name: 'Palatalization',
		korean: '구개음화',
		scored: false,
		trigger: 'ㄷ/ㅌ followed by 이 become ㅈ/ㅊ',
		examples: [
			{ written: '같이', spoken: '가치', gloss: 'together' },
			{ written: '굳이', spoken: '구지', gloss: 'insistently' }
		]
	}
];

/* ------------------------------------------------------------------ *
 * Orthographic reference
 * ------------------------------------------------------------------ */

/** South Korean dictionary order (가나다순). North Korea orders differently. */
export const GANADA_CONSONANTS = LEADS;
export const GANADA_VOWELS = VOWELS;

/** How a syllable block is laid out, decided entirely by the vowel's shape. */
export const BLOCK_LAYOUTS = [
	{ kind: 'tall vowel', vowels: 'ㅏ ㅑ ㅓ ㅕ ㅣ ㅐ ㅔ ㅒ ㅖ', rule: 'consonant sits to the left', examples: '가 나 미' },
	{ kind: 'wide vowel', vowels: 'ㅗ ㅛ ㅜ ㅠ ㅡ', rule: 'consonant sits on top', examples: '고 무 트' },
	{ kind: 'wrapping vowel', vowels: 'ㅘ ㅙ ㅚ ㅝ ㅞ ㅟ ㅢ', rule: 'consonant tucks into the top-left', examples: '과 위 의' },
	{ kind: 'with a batchim', vowels: 'any', rule: 'the final consonant goes underneath everything', examples: '강 곰 관' }
];

/**
 * Named exceptions in Article 10/11. These are lexical, not derivable — the
 * lab says so out loud rather than inventing a rule for them.
 */
export const CLUSTER_EXCEPTIONS = [
	{ stem: '밟', cluster: 'ㄼ', says: 'ㅂ', example: '밟다', pron: '밥따',
	  note: 'Before a consonant, 밟- takes ㅂ instead of the expected ㄹ.' },
	{ stem: '넓', cluster: 'ㄼ', says: 'ㅂ', example: '넓죽하다', pron: '넙쭈카다',
	  note: 'A short list of 넓- compounds behaves like 밟-.' },
	{ stem: '읽', cluster: 'ㄺ', says: 'ㄹ', example: '읽고', pron: '일꼬',
	  note: 'A verb stem in ㄺ keeps ㄹ when the next sound is ㄱ — Rule B inverts.' }
] as const;
