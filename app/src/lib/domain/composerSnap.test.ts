import { describe, expect, it } from 'vitest';
import {
	DRAG_THRESHOLD_PX,
	SLOT_SNAP_MIN_PX,
	movedEnough,
	snapSlot,
	type SlotBox
} from './composerSnap';

const cons: SlotBox = { id: 'consonant', left: 0, top: 0, right: 80, bottom: 80 };
const vowel: SlotBox = { id: 'vowel', left: 200, top: 0, right: 280, bottom: 80 };
const batchim: SlotBox = { id: 'batchim', left: 100, top: 120, right: 180, bottom: 200 };

describe('movedEnough', () => {
	it('stays a click inside the 8px threshold', () => {
		expect(movedEnough(10, 10, 10, 10)).toBe(false);
		expect(movedEnough(0, 0, DRAG_THRESHOLD_PX - 1, 0)).toBe(false);
	});

	it('becomes a drag at the 8px threshold', () => {
		expect(movedEnough(0, 0, DRAG_THRESHOLD_PX, 0)).toBe(true);
		expect(movedEnough(0, 0, 6, 6)).toBe(true);
	});
});

describe('snapSlot', () => {
	it('seats a matching piece when the pointer is inside the slot', () => {
		expect(snapSlot([cons, vowel], 240, 40, 'vowel')).toBe('vowel');
		expect(snapSlot([cons, vowel], 40, 40, 'consonant')).toBe('consonant');
	});

	it('rejects a drop on a different slot even when the pointer is inside it', () => {
		expect(snapSlot([cons, vowel], 40, 40, 'vowel')).toBeNull();
		expect(snapSlot([cons, vowel], 240, 40, 'consonant')).toBeNull();
	});

	it('snaps when the pointer is within 44px of the matching slot edge', () => {
		expect(snapSlot([cons, vowel], vowel.right + 20, 40, 'vowel')).toBe('vowel');
		expect(SLOT_SNAP_MIN_PX).toBe(44);
	});

	it('bounces when farther than the snap floor from every matching slot', () => {
		expect(snapSlot([cons, vowel], 500, 500, 'vowel')).toBeNull();
		expect(snapSlot([cons, vowel], vowel.right + SLOT_SNAP_MIN_PX + 1, 40, 'vowel')).toBeNull();
	});

	it('ignores empty or unnamed boxes', () => {
		expect(snapSlot([], 40, 40, 'consonant')).toBeNull();
		expect(
			snapSlot([{ id: '', left: 0, top: 0, right: 80, bottom: 80 }], 40, 40, 'consonant')
		).toBeNull();
	});

	it('picks the nearest matching slot when two share an id', () => {
		const left: SlotBox = { id: 'vowel', left: 0, top: 0, right: 40, bottom: 40 };
		const right: SlotBox = { id: 'vowel', left: 80, top: 0, right: 120, bottom: 40 };
		expect(snapSlot([left, right], 100, 20, 'vowel')).toBe('vowel');
	});

	it('snaps a batchim piece onto the bottom slot and not the lead', () => {
		expect(snapSlot([cons, vowel, batchim], 140, 160, 'batchim')).toBe('batchim');
		expect(snapSlot([cons, vowel, batchim], 40, 40, 'batchim')).toBeNull();
	});
});
