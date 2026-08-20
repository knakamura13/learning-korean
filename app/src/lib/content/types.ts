/**
 * types.ts — the shape of lesson content.
 *
 * Lessons are data, not markup. In the old app each lab was a standalone HTML
 * file with its step config inlined in a <script> tag, which meant content
 * could not be typechecked, reused, or tested without scraping the page.
 * Here a lab is a typed module the compiler checks.
 */

/** A jamo shown large on the "stage" above a question. */
export interface StageItem {
	glyph: string;
	caption?: string;
}

interface BaseStep {
	/** Small label above the instruction, e.g. "Act 2 · build it". */
	act?: string;
	/** The instruction. Inline HTML allowed for jamo spans and emphasis. */
	do: string;
	/** One line of setup under the instruction. */
	hint?: string;
	/** Shown after a correct answer — the teaching, not just confirmation. */
	teach: string;
	/** Shown after a wrong answer as a retry hint. Must not name the answer. */
	miss?: string;
}

/** Click the place in the vocal tract where a sound is made. */
export interface MouthStep extends BaseStep {
	type: 'mouth';
	zone: ZoneId;
	jamo: string;
	/** Zones already solved by earlier steps, shown locked. */
	solved?: { zone: ZoneId; jamo: string }[];
}

export type ZoneId = 'labial' | 'dental' | 'alveolar' | 'velar' | 'glottal';

/** Look at glyphs, pick an answer. */
export interface ChoiceStep extends BaseStep {
	type: 'choice';
	stage?: StageItem[];
	/** Separator drawn between stage items, e.g. "→" or "vs". */
	vs?: string;
	options: string[];
	answer: number;
	/** One option per row rather than a grid — for sentence-length options. */
	stack?: boolean;
}

/** Derive a letter by applying +stroke / ×double. */
export interface BuildStep extends BaseStep {
	type: 'build';
	start: string;
	target: string;
	targetName?: string;
}

/** Combine jamo into a syllable block. */
export interface AssembleStep extends BaseStep {
	type: 'assemble';
	target: string;
	targetName?: string;
	consonants: string[];
	vowels: string[];
	/** Present for CVC blocks; omit for CV. */
	finals?: string[];
}

/** Stamp strokes onto docks to build a simple vowel. */
export interface VowelStep extends BaseStep {
	type: 'vowel';
	target: string;
	targetName?: string;
}

/** Fuse two vowels into a compound. */
export interface FusionStep extends BaseStep {
	type: 'fusion';
	target: string;
	targetName?: string;
	first: string[];
	second: string[];
}

/** Decide which member of a cluster survives. */
export interface ClusterStep extends BaseStep {
	type: 'cluster';
	word: string;
	cluster: string;
	/** The real pronunciation, revealed on a correct answer. */
	pron: string;
	gloss?: string;
}

export interface LiaisonStep extends BaseStep {
	type: 'liaison';
	word: string;
	gloss?: string;
}

export interface ContactStep extends BaseStep {
	type: 'contact';
	word: string;
	gloss?: string;
}

/** Decode a real word block by block, then identify it. */
export interface ReadStep extends BaseStep {
	type: 'read';
	blocks: { block: string; reading: string }[];
	options: string[];
	answer: number;
}

export type Step =
	| MouthStep
	| ChoiceStep
	| BuildStep
	| AssembleStep
	| VowelStep
	| FusionStep
	| ClusterStep
	| LiaisonStep
	| ContactStep
	| ReadStep;

export interface Lab {
	/** Zero-padded, matches the route: /lab/0001 */
	id: string;
	number: number;
	title: string;
	standfirst: string;
	/** Rough completion time in minutes. */
	minutes: number;
	/** Deck tier released on completion. */
	unlocks: string;
	/** Lab id that should be finished first, if any. */
	requires?: string;
	finish: { title: string; summary: string };
	steps: Step[];
}
