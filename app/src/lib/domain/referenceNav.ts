/**
 * Jump targets for the letter-and-rule reference. Short `nav` labels wrap on a
 * phone so every section stays on screen — a horizontally scrolled TOC hid most
 * of the page with no affordance. `title` and `covers` feed the hover preview.
 */
export const REFERENCE_SECTIONS = [
	{
		id: 'consonants',
		nav: 'Consonants',
		title: '19 consonants',
		covers: 'Names, romanization, final sounds, and audio for every lead letter.'
	},
	{
		id: 'simple-vowels',
		nav: 'Vowels',
		title: '10 simple vowels',
		covers: 'The ten basic vowels with romanization and yin/yang harmony.'
	},
	{
		id: 'compound-vowels',
		nav: 'Compounds',
		title: '11 compound vowels',
		covers: 'How two simple vowels fuse, and which pairs merge in speech.'
	},
	{
		id: 'batchim',
		nav: 'Batchim',
		title: 'Batchim — 27 finals, 7 sounds',
		covers: 'Every final letter grouped under the seven representative sounds.'
	},
	{
		id: 'clusters',
		nav: 'Clusters',
		title: '11 clusters',
		covers: 'Which letter wins in a double final, plus the named exceptions.'
	},
	{
		id: 'derivation',
		nav: 'Derivation',
		title: 'The derivation map',
		covers: 'Five articulator shapes; a stroke adds breath, doubling adds tension.'
	},
	{
		id: 'block-layouts',
		nav: 'Layouts',
		title: 'Block layouts',
		covers: 'How a syllable packs around a vertical, horizontal, or mixed vowel.'
	},
	{
		id: 'sound-changes',
		nav: 'Sound changes',
		title: 'The eight sound changes',
		covers: 'The pronunciation rules that kick in when letters meet across a syllable.'
	},
	{
		id: 'dictionary-order',
		nav: 'Dictionary',
		title: 'Dictionary order (가나다순)',
		covers: 'South Korean consonant and vowel sort order, named for 가나다.'
	},
	{
		id: 'sources',
		nav: 'Sources',
		title: 'Sources',
		covers: 'The regulators, rules, and references this sheet is built from.'
	}
] as const;

export type ReferenceSection = (typeof REFERENCE_SECTIONS)[number];
export type ReferenceSectionId = ReferenceSection['id'];

export interface ReferencePreviewModel {
	id: ReferenceSectionId;
	nav: string;
	title: string;
	covers: string;
}

export function referencePreviewModel(section: ReferenceSection): ReferencePreviewModel {
	return {
		id: section.id,
		nav: section.nav,
		title: section.title,
		covers: section.covers
	};
}

export interface SectionHit {
	id: string;
	ratio: number;
	top: number;
}

/** Sticky header band used as the scroll-spy line and jump landing. */
export const REFERENCE_ACTIVATION_LINE = 88;

export type JumpScrollKind = 'programmatic' | 'user';

/** Keep a clicked chip lit until the user scrolls; ignore jump animation. */
export function shouldReleaseJumpPin(kind: JumpScrollKind): boolean {
	return kind === 'user';
}

/**
 * True once the jumped heading has reached the activation band, so the
 * previous section is no longer sitting in that band.
 */
export function jumpClearedPreviousSections(
	hits: SectionHit[],
	targetId: string,
	activationLine = REFERENCE_ACTIVATION_LINE
): boolean {
	const target = hits.find((hit) => hit.id === targetId);
	if (!target) return false;
	return target.top <= activationLine;
}

/** Document Y that places `sectionTop` on the activation line. */
export function jumpScrollY(sectionTop: number, pageYOffset: number, offset: number): number {
	return Math.max(0, pageYOffset + sectionTop - offset);
}

/**
 * Phone: land below the wrapping sticky chips. Wide rail sits beside the
 * page, so only the header band should remain above the heading.
 */
export function referenceJumpOffset(
	viewportWidth: number,
	stickyRailBottom: number | null,
	wideBreakpointPx = 72 * 16
): number {
	if (viewportWidth < wideBreakpointPx && stickyRailBottom != null) {
		return Math.round(stickyRailBottom + 8);
	}
	return REFERENCE_ACTIVATION_LINE;
}

/**
 * Among sections that have crossed the sticky header band, pick the last one.
 * `pinnedId` is a clicked jump and wins until the pin is released.
 * `fallback` keeps the last chip lit when the observer reports a gap.
 */
export function pickActiveSection(
	hits: SectionHit[],
	fallback: string | null,
	pinnedId: string | null = null
): string | null {
	if (pinnedId) return pinnedId;
	const crossed = hits.filter((hit) => hit.top <= REFERENCE_ACTIVATION_LINE);
	if (crossed.length === 0) {
		const visible = hits.filter((hit) => hit.ratio > 0);
		if (visible.length === 0) return fallback;
		visible.sort((a, b) => a.top - b.top);
		return visible[0]?.id ?? fallback;
	}
	crossed.sort((a, b) => b.top - a.top);
	return crossed[0]?.id ?? fallback;
}
