import { describe, expect, it } from 'vitest';
import { DEFAULT_LOOK_ID, isLookId, LOOK_IDS, LOOKS } from './catalog';
import { botanicalKorea } from './systems/botanicalKorea';
import { taegeuk } from './systems/taegeuk';
import { watercolor } from './systems/watercolor';
import { academia } from './systems/academia';

describe('LOOKS catalog', () => {
	it('lists the four looks in picker order with locked summaries', () => {
		expect(LOOK_IDS).toEqual(['botanicalKorea', 'taegeuk', 'watercolor', 'academia']);
		expect(LOOKS.map((s) => s.id)).toEqual([...LOOK_IDS]);
		expect(DEFAULT_LOOK_ID).toBe('botanicalKorea');
		expect(LOOKS[0]).toBe(botanicalKorea);
		expect(LOOKS[1]).toBe(taegeuk);
		expect(LOOKS[2]).toBe(watercolor);
		expect(LOOKS[3]).toBe(academia);
		expect(botanicalKorea.summary).toBe('Pressed-flowers paper and moss green.');
		expect(taegeuk.summary).toBe('Ink on paper, 태극 red and blue.');
		expect(watercolor.summary).toBe('Pigment washes on paper.');
		expect(academia.summary).toBe('Library lamp, scholarly serif.');
	});

	it('accepts only the four ids', () => {
		expect(isLookId('botanicalKorea')).toBe(true);
		expect(isLookId('taegeuk')).toBe(true);
		expect(isLookId('watercolor')).toBe(true);
		expect(isLookId('academia')).toBe(true);
		expect(isLookId('system')).toBe(false);
		expect(isLookId('')).toBe(false);
		expect(isLookId(null)).toBe(false);
	});
});
