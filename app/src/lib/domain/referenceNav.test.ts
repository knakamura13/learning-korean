import { describe, expect, it } from 'vitest';
import { pickActiveSection, REFERENCE_SECTIONS } from './referenceNav';

describe('reference jump list', () => {
	it('covers every long-page heading with a short chip label', () => {
		const ids = REFERENCE_SECTIONS.map((s) => s.id);
		expect(ids).toEqual([
			'consonants',
			'simple-vowels',
			'compound-vowels',
			'batchim',
			'clusters',
			'derivation',
			'block-layouts',
			'sound-changes',
			'dictionary-order',
			'sources'
		]);
		for (const section of REFERENCE_SECTIONS) {
			expect(section.nav.length).toBeLessThanOrEqual(14);
			expect(section.nav).not.toMatch(/\.\.\./);
		}
	});

	it('prefers the intersecting section nearest the header', () => {
		expect(
			pickActiveSection(
				[
					{ id: 'consonants', ratio: 0.2, top: 240 },
					{ id: 'batchim', ratio: 0.4, top: 48 },
					{ id: 'sources', ratio: 0, top: 900 }
				],
				'consonants'
			)
		).toBe('batchim');
	});

	it('keeps the last chip when nothing is intersecting', () => {
		expect(pickActiveSection([{ id: 'clusters', ratio: 0, top: -80 }], 'clusters')).toBe(
			'clusters'
		);
		expect(pickActiveSection([], null)).toBeNull();
	});
});
