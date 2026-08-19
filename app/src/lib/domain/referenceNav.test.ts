import { describe, expect, it } from 'vitest';
import {
	jumpClearedPreviousSections,
	jumpScrollY,
	pickActiveSection,
	REFERENCE_ACTIVATION_LINE,
	REFERENCE_SECTIONS,
	referenceJumpOffset,
	referencePreviewModel,
	shouldReleaseJumpPin
} from './referenceNav';

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

	it('gives each jump a heading and a covers line for the hover preview', () => {
		for (const section of REFERENCE_SECTIONS) {
			const preview = referencePreviewModel(section);
			expect(preview.id).toBe(section.id);
			expect(preview.nav).toBe(section.nav);
			expect(preview.title.length).toBeGreaterThan(0);
			expect(preview.covers.length).toBeGreaterThan(20);
			expect(preview.covers).not.toMatch(/\.\.\./);
			expect(JSON.stringify(preview)).not.toMatch(/title=/);
		}
		expect(referencePreviewModel(REFERENCE_SECTIONS[0]).title).toMatch(/19 consonants/i);
		expect(referencePreviewModel(REFERENCE_SECTIONS[0]).covers).toMatch(/lead|consonant/i);
		expect(referencePreviewModel(REFERENCE_SECTIONS[3]).title).toMatch(/batchim/i);
		expect(referencePreviewModel(REFERENCE_SECTIONS[7]).covers).toMatch(/sound change|pronunciation/i);
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

	it('honors a clicked section while the previous heading is still nearer the header', () => {
		expect(
			pickActiveSection(
				[
					{ id: 'compound-vowels', ratio: 0.55, top: 36 },
					{ id: 'batchim', ratio: 0.2, top: 280 }
				],
				'compound-vowels',
				'batchim'
			)
		).toBe('batchim');
	});

	it('picks the last section that has crossed the activation line once the jump settles', () => {
		expect(
			pickActiveSection(
				[
					{ id: 'compound-vowels', ratio: 0.1, top: -140 },
					{ id: 'batchim', ratio: 0.7, top: 64 }
				],
				'compound-vowels'
			)
		).toBe('batchim');
	});
});

describe('reference jump pin', () => {
	it('keeps the pin until the user scrolls, not while the jump itself is scrolling', () => {
		expect(shouldReleaseJumpPin('programmatic')).toBe(false);
		expect(shouldReleaseJumpPin('user')).toBe(true);
	});

	it('treats the jump as short of the target when the heading is still below the activation band', () => {
		expect(
			jumpClearedPreviousSections(
				[
					{ id: 'compound-vowels', ratio: 0.5, top: 40 },
					{ id: 'batchim', ratio: 0.2, top: 260 }
				],
				'batchim'
			)
		).toBe(false);
		expect(
			jumpClearedPreviousSections(
				[
					{ id: 'compound-vowels', ratio: 0.05, top: -160 },
					{ id: 'batchim', ratio: 0.8, top: 56 }
				],
				'batchim'
			)
		).toBe(true);
	});

	it('scrolls the section to the activation line so the previous heading leaves the band', () => {
		expect(jumpScrollY(260, 400, 72)).toBe(588);
		expect(jumpScrollY(40, 0, 72)).toBe(0);
	});

	it('uses the sticky chip bar on a phone and the header band on the wide rail', () => {
		expect(referenceJumpOffset(400, 176)).toBe(184);
		expect(referenceJumpOffset(1280, 640)).toBe(REFERENCE_ACTIVATION_LINE);
	});
});
