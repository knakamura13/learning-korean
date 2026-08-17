import { describe, expect, it } from 'vitest';
import { buildVowel, sidesFor } from './hangul';
import {
	EMPTY_BOARD,
	PALETTE,
	applyLift,
	applyStamp,
	clearDock,
	compatibleStamps,
	dockInDirection,
	dockPosition,
	liftDock,
	occupant,
	snapDock,
	snapRadiusPx,
	stampLabel,
	visibleDocks,
	vowelOf,
	type BoardState,
	type DockId
} from './vowelBoard';

function board(partial: Partial<BoardState> = {}): BoardState {
	return { ...EMPTY_BOARD, ...partial };
}

describe('visible docks', () => {
	it('shows only the centre until a base is seated', () => {
		expect(visibleDocks(EMPTY_BOARD)).toEqual(['base']);
	});

	it('opens left/right on ㅣ and above/below on ㅡ', () => {
		expect(visibleDocks(board({ base: 'ㅣ' }))).toEqual(['base', 'left', 'right']);
		expect(visibleDocks(board({ base: 'ㅡ' }))).toEqual(['base', 'above', 'below']);
	});

	it('opens the second-tick dock on the occupied side only', () => {
		expect(visibleDocks(board({ base: 'ㅣ', ticks: 1, side: 'right' }))).toEqual([
			'base',
			'left',
			'right',
			'right2'
		]);
		expect(visibleDocks(board({ base: 'ㅡ', ticks: 2, side: 'below' }))).toContain('below2');
		expect(visibleDocks(board({ base: 'ㅡ', ticks: 2, side: 'below' }))).not.toContain('above2');
	});
});

describe('stamping', () => {
	it('builds every simple vowel from stamps', () => {
		const built = new Set<string>();
		for (const base of ['ㅣ', 'ㅡ'] as const) {
			const withBase = applyStamp(EMPTY_BOARD, 'base', base);
			expect(withBase).not.toBeNull();
			built.add(vowelOf(withBase!));
			for (const side of sidesFor(base)) {
				const one = applyStamp(withBase!, side, 'tick');
				expect(one).not.toBeNull();
				built.add(vowelOf(one!));
				const two = applyStamp(one!, `${side}2`, 'tick');
				expect(two).not.toBeNull();
				built.add(vowelOf(two!));
			}
		}
		expect([...built].sort()).toEqual(
			['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ'].sort()
		);
	});

	it('rejects a tick before a base, and a base on a tick dock', () => {
		expect(applyStamp(EMPTY_BOARD, 'right', 'tick')).toBeNull();
		expect(applyStamp(EMPTY_BOARD, 'base', 'tick')).toBeNull();
		const withI = applyStamp(EMPTY_BOARD, 'base', 'ㅣ')!;
		expect(applyStamp(withI, 'right', 'ㅣ')).toBeNull();
	});

	it('moves existing ticks when the opposite primary is stamped', () => {
		const a = applyStamp(applyStamp(EMPTY_BOARD, 'base', 'ㅣ')!, 'right', 'tick')!;
		expect(vowelOf(a)).toBe('ㅏ');
		const eo = applyStamp(a, 'left', 'tick')!;
		expect(vowelOf(eo)).toBe('ㅓ');
		expect(eo.ticks).toBe(1);
	});

	it('keeps the iotation stack when the opposite primary is stamped', () => {
		const ya = applyStamp(
			applyStamp(applyStamp(EMPTY_BOARD, 'base', 'ㅣ')!, 'right', 'tick')!,
			'right2',
			'tick'
		)!;
		expect(vowelOf(ya)).toBe('ㅑ');
		expect(vowelOf(applyStamp(ya, 'left', 'tick')!)).toBe('ㅕ');
	});

	it('clears ticks when the base stroke is replaced', () => {
		const a = applyStamp(applyStamp(EMPTY_BOARD, 'base', 'ㅣ')!, 'right', 'tick')!;
		const eu = applyStamp(a, 'base', 'ㅡ')!;
		expect(vowelOf(eu)).toBe('ㅡ');
		expect(eu.ticks).toBe(0);
		expect(eu.side).toBeNull();
	});

	it('is a no-op to restamp the same base', () => {
		const withI = applyStamp(EMPTY_BOARD, 'base', 'ㅣ')!;
		expect(applyStamp(withI, 'base', 'ㅣ')).toEqual(withI);
	});
});

describe('clear and lift', () => {
	it('clears a primary tick and drops the second-tick dock', () => {
		const a = applyStamp(applyStamp(EMPTY_BOARD, 'base', 'ㅣ')!, 'right', 'tick')!;
		const cleared = clearDock(a, 'right');
		expect(vowelOf(cleared)).toBe('ㅣ');
		expect(visibleDocks(cleared)).not.toContain('right2');
	});

	it('clears only the outer tick from a secondary dock', () => {
		const ya = applyStamp(
			applyStamp(applyStamp(EMPTY_BOARD, 'base', 'ㅣ')!, 'right', 'tick')!,
			'right2',
			'tick'
		)!;
		expect(vowelOf(clearDock(ya, 'right2'))).toBe('ㅏ');
	});

	it('clears the whole board from the base dock', () => {
		const a = applyStamp(applyStamp(EMPTY_BOARD, 'base', 'ㅣ')!, 'right', 'tick')!;
		expect(clearDock(a, 'base')).toEqual(EMPTY_BOARD);
	});

	it('lifts a two-tick stack from the primary dock as count 2', () => {
		const ya = applyStamp(
			applyStamp(applyStamp(EMPTY_BOARD, 'base', 'ㅣ')!, 'right', 'tick')!,
			'right2',
			'tick'
		)!;
		const lifted = liftDock(ya, 'right');
		expect(lifted).toEqual({
			lift: { stamp: 'tick', count: 2 },
			remaining: board({ base: 'ㅣ' })
		});
		expect(vowelOf(applyLift(lifted!.remaining, 'left', lifted!.lift)!)).toBe('ㅕ');
	});

	it('lifts one tick from the secondary dock', () => {
		const ya = applyStamp(
			applyStamp(applyStamp(EMPTY_BOARD, 'base', 'ㅣ')!, 'right', 'tick')!,
			'right2',
			'tick'
		)!;
		const lifted = liftDock(ya, 'right2');
		expect(lifted?.lift).toEqual({ stamp: 'tick', count: 1 });
		expect(vowelOf(lifted!.remaining)).toBe('ㅏ');
	});

	it('reports occupants for seated pieces', () => {
		const a = applyStamp(applyStamp(EMPTY_BOARD, 'base', 'ㅣ')!, 'right', 'tick')!;
		expect(occupant(a, 'base')).toBe('ㅣ');
		expect(occupant(a, 'right')).toBe('tick');
		expect(occupant(a, 'left')).toBeNull();
		expect(occupant(a, 'right2')).toBeNull();
	});
});

describe('snap', () => {
	it('floors the radius at 44px', () => {
		expect(snapRadiusPx(100)).toBe(44);
		expect(snapRadiusPx(300)).toBe(60);
	});

	it('snaps to the nearest compatible dock inside the radius', () => {
		const withI = applyStamp(EMPTY_BOARD, 'base', 'ㅣ')!;
		const right = dockPosition('right');
		const hit = snapDock(withI, { stamp: 'tick', count: 1 }, right.x * 200, right.y * 200, 200);
		expect(hit).toBe('right');
	});

	it('bounces when the drop is outside every dock radius', () => {
		const withI = applyStamp(EMPTY_BOARD, 'base', 'ㅣ')!;
		expect(snapDock(withI, { stamp: 'tick', count: 1 }, 0, 0, 200)).toBeNull();
	});

	it('ignores nearer docks that cannot take the stamp', () => {
		const withI = applyStamp(EMPTY_BOARD, 'base', 'ㅣ')!;
		const base = dockPosition('base');
		expect(snapDock(withI, { stamp: 'tick', count: 1 }, base.x * 200, base.y * 200, 200)).toBeNull();
	});
});

describe('vowelOf', () => {
	it('delegates to buildVowel and is empty with no base', () => {
		expect(vowelOf(EMPTY_BOARD)).toBe('');
		expect(vowelOf(board({ base: 'ㅣ', ticks: 1, side: 'right' }))).toBe(
			buildVowel('ㅣ', 'right', 1)
		);
	});
});

describe('spatial dock arrows', () => {
	it('sends ArrowRight from the standing base to the right tick, not the left', () => {
		const withI = board({ base: 'ㅣ' });
		expect(dockInDirection(withI, 'base', 'right')).toBe('right');
		expect(dockInDirection(withI, 'base', 'left')).toBe('left');
		expect(dockInDirection(withI, 'right', 'left')).toBe('base');
		expect(dockInDirection(withI, 'left', 'right')).toBe('base');
	});

	it('does not wrap around the board', () => {
		const withI = board({ base: 'ㅣ' });
		expect(dockInDirection(withI, 'base', 'up')).toBe('base');
		expect(dockInDirection(withI, 'left', 'left')).toBe('left');
		expect(dockInDirection(withI, 'right', 'right')).toBe('right');
		const iotated = board({ base: 'ㅣ', ticks: 1, side: 'right' });
		expect(dockInDirection(iotated, 'right', 'right')).toBe('right2');
		expect(dockInDirection(iotated, 'right2', 'right')).toBe('right2');
	});

	it('sends ArrowUp from the earth base to the above tick', () => {
		const withEu = board({ base: 'ㅡ' });
		expect(dockInDirection(withEu, 'base', 'up')).toBe('above');
		expect(dockInDirection(withEu, 'base', 'down')).toBe('below');
		expect(dockInDirection(withEu, 'base', 'left')).toBe('base');
		expect(dockInDirection(withEu, 'above', 'down')).toBe('base');
	});
});

describe('palette and positions', () => {
	it('lists stamps a dock will actually accept', () => {
		expect(compatibleStamps(EMPTY_BOARD, 'base')).toEqual(['ㅣ', 'ㅡ']);
		expect(compatibleStamps(EMPTY_BOARD, 'right')).toEqual([]);
		const withI = applyStamp(EMPTY_BOARD, 'base', 'ㅣ')!;
		expect(compatibleStamps(withI, 'right')).toEqual(['tick']);
		expect(compatibleStamps(withI, 'base')).toEqual(['ㅣ', 'ㅡ']);
		expect(compatibleStamps(withI, 'above')).toEqual([]);
	});

	it('places every dock on the unit square', () => {
		const ids: DockId[] = [
			'base',
			'left',
			'left2',
			'right',
			'right2',
			'above',
			'above2',
			'below',
			'below2'
		];
		for (const id of ids) {
			const { x, y } = dockPosition(id);
			expect(x).toBeGreaterThanOrEqual(0);
			expect(x).toBeLessThanOrEqual(1);
			expect(y).toBeGreaterThanOrEqual(0);
			expect(y).toBeLessThanOrEqual(1);
		}
	});
});
