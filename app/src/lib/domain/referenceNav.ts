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

/**
 * Among intersecting sections, pick the one nearest the sticky header band.
 * `fallback` keeps the last chip lit when the observer reports a gap.
 */
export function pickActiveSection(hits: SectionHit[], fallback: string | null): string | null {
	const visible = hits.filter((hit) => hit.ratio > 0);
	if (visible.length === 0) return fallback;
	visible.sort((a, b) => {
		const byTop = Math.abs(a.top) - Math.abs(b.top);
		if (byTop !== 0) return byTop;
		return b.ratio - a.ratio;
	});
	return visible[0]?.id ?? fallback;
}
