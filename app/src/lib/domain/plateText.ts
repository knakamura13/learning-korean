/**
 * plateText.ts — encyclopedia as sequenced plate text, not nine peer sections.
 */

export type PlateTextId =
	| '0001'
	| '0002'
	| '0003'
	| '0004'
	| '0005'
	| '0006'
	| 'dictionary-order'
	| 'sources';

export type PlateTextKind = 'lab' | 'apparatus';

export interface PlateTextMeta {
	id: PlateTextId;
	/** Hash fragments that open this plate (`/reference#batchim`). */
	hashes: string[];
	labNumber: number | null;
	title: string;
	caption: string;
	jamo: string;
	kind: PlateTextKind;
}

export const PLATE_TEXT_CATALOG: PlateTextMeta[] = [
	{
		id: '0001',
		hashes: ['consonants', 'derivation'],
		labNumber: 1,
		title: '19 consonants',
		caption: 'Five mouth shapes; a stroke adds breath, doubling adds tension.',
		jamo: 'ㄱㄴㅁ',
		kind: 'lab'
	},
	{
		id: '0002',
		hashes: ['simple-vowels', 'block-layouts'],
		labNumber: 2,
		title: '10 simple vowels',
		caption: 'Two strokes, ticks, and where the consonant sits in the block.',
		jamo: 'ㅏㅓㅗ',
		kind: 'lab'
	},
	{
		id: '0003',
		hashes: ['compound-vowels'],
		labNumber: 3,
		title: '11 compound vowels',
		caption: 'Two simple vowels fused; some pairs merged in Seoul speech.',
		jamo: 'ㅐㅘㅢ',
		kind: 'lab'
	},
	{
		id: '0004',
		hashes: ['batchim'],
		labNumber: 4,
		title: 'Batchim — 7 sounds',
		caption: 'Twenty-seven finals collapse to seven representative sounds.',
		jamo: 'ㄱㄴㅇ',
		kind: 'lab'
	},
	{
		id: '0005',
		hashes: ['clusters'],
		labNumber: 5,
		title: '11 clusters',
		caption: 'Two consonants in one slot; one letter wins, except by name.',
		jamo: 'ㄳㄼㅀ',
		kind: 'lab'
	},
	{
		id: '0006',
		hashes: ['sound-changes'],
		labNumber: 6,
		title: 'The eight sound changes',
		caption: 'Spelling keeps identity; these rules are how the page sounds.',
		jamo: '학교',
		kind: 'lab'
	},
	{
		id: 'dictionary-order',
		hashes: ['dictionary-order'],
		labNumber: null,
		title: 'Dictionary order',
		caption: 'South Korean 가나다순 — consonants, then vowels.',
		jamo: '가나다',
		kind: 'apparatus'
	},
	{
		id: 'sources',
		hashes: ['sources'],
		labNumber: null,
		title: 'Sources',
		caption: 'National Institute of Korean Language and the 1988 rules.',
		jamo: '표준',
		kind: 'apparatus'
	}
];

const HASH_TO_ID: Record<string, PlateTextId> = Object.fromEntries(
	PLATE_TEXT_CATALOG.flatMap((plate) => plate.hashes.map((hash) => [hash, plate.id]))
) as Record<string, PlateTextId>;

export function isPlateTextId(value: string): value is PlateTextId {
	return PLATE_TEXT_CATALOG.some((plate) => plate.id === value);
}

export function plateTextMeta(id: PlateTextId): PlateTextMeta {
	const found = PLATE_TEXT_CATALOG.find((plate) => plate.id === id);
	if (!found) {
		const _exhaustive: never = id as never;
		return _exhaustive;
	}
	return found;
}

export function plateTextFromHash(hash: string): PlateTextId | null {
	const key = hash.replace(/^#/, '').trim();
	if (!key) return null;
	if (isPlateTextId(key)) return key;
	return HASH_TO_ID[key] ?? null;
}

export function plateTextForLabId(labId: string): PlateTextId | null {
	return isPlateTextId(labId) ? labId : null;
}

export function plateTextKind(id: PlateTextId): PlateTextKind {
	switch (id) {
		case '0001':
		case '0002':
		case '0003':
		case '0004':
		case '0005':
		case '0006':
			return 'lab';
		case 'dictionary-order':
		case 'sources':
			return 'apparatus';
		default: {
			const _exhaustive: never = id;
			return _exhaustive;
		}
	}
}

export function plateTextPermalink(id: PlateTextId): string {
	const primary = plateTextMeta(id).hashes[0];
	return `/reference#${primary}`;
}
