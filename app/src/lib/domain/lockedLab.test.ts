import { describe, expect, it } from 'vitest';
import { emptyState, isOpened, isUnlocked, openLab, reviveState } from './srs';
import { lockedLabPopoverCopy, placeClickPopover, popoverPadWithSafeArea } from './lockedLab';

describe('placeClickPopover', () => {
	it('pins the panel’s start edge to the click when it fits', () => {
		expect(placeClickPopover({ x: 120, y: 80 }, { w: 280, h: 200 }, { w: 800, h: 600 })).toEqual({
			left: 120,
			top: 80
		});
	});

	it('flips up and toward the start when the click is in the end corner', () => {
		const placed = placeClickPopover({ x: 760, y: 540 }, { w: 280, h: 200 }, { w: 800, h: 600 });
		expect(placed.left).toBe(480);
		expect(placed.top).toBe(340);
		expect(placed.left + 280).toBeLessThanOrEqual(800 - 12);
		expect(placed.top + 200).toBeLessThanOrEqual(600 - 12);
	});

	it('never leaves the viewport, even on a small phone', () => {
		const placed = placeClickPopover({ x: 10, y: 700 }, { w: 300, h: 240 }, { w: 390, h: 720 });
		expect(placed.left).toBeGreaterThanOrEqual(12);
		expect(placed.top).toBeGreaterThanOrEqual(12);
		expect(placed.left + 300).toBeLessThanOrEqual(390 - 12);
		expect(placed.top + 240).toBeLessThanOrEqual(720 - 12);
	});

	it('keeps a safe-area floor, not a bare 8px clamp', () => {
		const placed = placeClickPopover(
			{ x: 4, y: 4 },
			{ w: 280, h: 200 },
			{ w: 390, h: 720 },
			popoverPadWithSafeArea({ top: 47, left: 16 })
		);
		expect(placed.left).toBeGreaterThanOrEqual(28);
		expect(placed.top).toBeGreaterThanOrEqual(59);
	});
});

describe('lockedLabPopoverCopy', () => {
	it('names the prerequisite and keeps skip and dismiss as boxed actions', () => {
		const copy = lockedLabPopoverCopy(
			{ number: 2, title: 'Ten Vowels From Two Strokes' },
			{ number: 1, title: 'Find the Letters in Your Mouth' }
		);
		expect(copy.title).toBe('Lab 02 is locked');
		expect(copy.body).toMatch(/Finish Lab 01 first/);
		expect(copy.priorLabel).toBe('Open Lab 01');
		expect(copy.skipLabel).toBe('Open Lab 02 anyway');
		expect(copy.dismissLabel).toBe('Go back');
	});
});

describe('openLab access', () => {
	it('grants a later lab without unlocking its review tier', () => {
		const next = openLab(emptyState(), '0002');
		expect(isOpened(next, '0002')).toBe(true);
		expect(isUnlocked(next, 'lab02')).toBe(false);
		expect(openLab(next, '0002')).toBe(next);
	});

	it('revives opened labs from storage and treats a missing field as none', () => {
		expect(reviveState({ version: 1, unlocked: [], cards: {}, openedLabs: ['0002', 9] }).openedLabs).toEqual([
			'0002'
		]);
		expect(reviveState({ version: 1, unlocked: [], cards: {} }).openedLabs).toEqual([]);
		expect(emptyState().openedLabs).toEqual([]);
	});
});
