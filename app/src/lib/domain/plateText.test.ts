import { describe, expect, it } from 'vitest';
import {
	PLATE_TEXT_CATALOG,
	isPlateTextId,
	plateTextForLabId,
	plateTextFromHash,
	plateTextKind,
	plateTextMeta,
	plateTextPermalink,
	type PlateTextId
} from './plateText';

describe('plateText catalog', () => {
	it('covers six lab plates plus two always-open apparatus plates', () => {
		const labs = PLATE_TEXT_CATALOG.filter((plate) => plate.kind === 'lab');
		const apparatus = PLATE_TEXT_CATALOG.filter((plate) => plate.kind === 'apparatus');
		expect(labs.map((plate) => plate.id)).toEqual(['0001', '0002', '0003', '0004', '0005', '0006']);
		expect(apparatus.map((plate) => plate.id)).toEqual(['dictionary-order', 'sources']);
		for (const plate of labs) {
			expect(plateTextKind(plate.id)).toBe('lab');
			expect(plate.labNumber).toBeGreaterThan(0);
		}
		for (const plate of apparatus) {
			expect(plateTextKind(plate.id)).toBe('apparatus');
			expect(plate.labNumber).toBeNull();
		}
	});

	it('resolves share hashes and accession ids', () => {
		expect(plateTextFromHash('#batchim')).toBe('0004');
		expect(plateTextFromHash('consonants')).toBe('0001');
		expect(plateTextFromHash('derivation')).toBe('0001');
		expect(plateTextFromHash('#simple-vowels')).toBe('0002');
		expect(plateTextFromHash('block-layouts')).toBe('0002');
		expect(plateTextFromHash('compound-vowels')).toBe('0003');
		expect(plateTextFromHash('clusters')).toBe('0005');
		expect(plateTextFromHash('sound-changes')).toBe('0006');
		expect(plateTextFromHash('#dictionary-order')).toBe('dictionary-order');
		expect(plateTextFromHash('sources')).toBe('sources');
		expect(plateTextFromHash('0003')).toBe('0003');
		expect(plateTextFromHash('')).toBeNull();
		expect(plateTextFromHash('#missing')).toBeNull();
	});

	it('keeps permalinks on the first hash so /reference#batchim stays shareable', () => {
		expect(plateTextPermalink('0004')).toBe('/reference#batchim');
		expect(plateTextPermalink('0001')).toBe('/reference#consonants');
		expect(plateTextPermalink('sources')).toBe('/reference#sources');
	});

	it('maps lab ids to plate text and rejects unknown accessions', () => {
		expect(plateTextForLabId('0002')).toBe('0002');
		expect(plateTextForLabId('review')).toBeNull();
		expect(isPlateTextId('0006')).toBe(true);
		expect(isPlateTextId('0007')).toBe(false);
		expect(plateTextMeta('0005').caption).toMatch(/Two consonants/);
	});

	it('returns a kind for every catalog id', () => {
		const ids: PlateTextId[] = PLATE_TEXT_CATALOG.map((plate) => plate.id);
		for (const id of ids) {
			expect(plateTextKind(id) === 'lab' || plateTextKind(id) === 'apparatus').toBe(true);
			expect(plateTextMeta(id).id).toBe(id);
		}
	});
});
