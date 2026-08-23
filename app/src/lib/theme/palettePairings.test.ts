import { describe, expect, it } from 'vitest';
import { LOOKS } from './catalog';
import { contrastRatio } from './contrast';
import {
	assertPairings,
	BORDER_PAIRINGS,
	mixSrgb,
	paletteStates,
	TEXT_PAIRINGS
} from './palettePairings';
import { academia } from './systems/academia';

describe('palette pairings', () => {
	for (const system of LOOKS) {
		it(`keeps painted text and status pairings for ${system.id}`, () => {
			assertPairings(paletteStates(system), TEXT_PAIRINGS);
		});

		it(`keeps control-border pairings for ${system.id}`, () => {
			assertPairings(paletteStates(system), BORDER_PAIRINGS);
		});
	}

	it('keeps academia dark hero card body copy at least 4.5:1 on accent', () => {
		const { accent, accentInk } = academia.dark;
		const heroBody = mixSrgb(accentInk, accent, 92);
		expect(contrastRatio(heroBody, accent)).toBeGreaterThanOrEqual(4.5);
	});
});
