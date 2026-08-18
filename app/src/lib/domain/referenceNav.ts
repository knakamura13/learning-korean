/**
 * Jump targets for the letter-and-rule reference. Short `nav` labels are
 * meant to wrap as chips on a phone so every section stays on screen —
 * a horizontally scrolled TOC hid most of the page with no affordance.
 */
export const REFERENCE_SECTIONS = [
	{ id: 'consonants', nav: 'Consonants' },
	{ id: 'simple-vowels', nav: 'Vowels' },
	{ id: 'compound-vowels', nav: 'Compounds' },
	{ id: 'batchim', nav: 'Batchim' },
	{ id: 'clusters', nav: 'Clusters' },
	{ id: 'derivation', nav: 'Derivation' },
	{ id: 'block-layouts', nav: 'Layouts' },
	{ id: 'sound-changes', nav: 'Sound changes' },
	{ id: 'dictionary-order', nav: 'Dictionary' },
	{ id: 'sources', nav: 'Sources' }
] as const;

export type ReferenceSectionId = (typeof REFERENCE_SECTIONS)[number]['id'];

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
