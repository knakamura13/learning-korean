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
	boardDocks,
	placeholderDocks,
	recipeDocks,
	towardTarget,
	visibleDocks,
	vowelOf,
	type BoardState,
	type DockId
} from './vowelBoard';

function board(partial: Partial<BoardState> = {}): BoardState {
	return { ...EMPTY_BOARD, ...partial };
}

describe('visible docks', () => {
	it('shows only the center until a base is seated', () => {
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

describe('target placeholders', () => {
	it('lists every slot the target letter still needs, and none once it is complete', () => {
		expect(recipeDocks('ㅏ')).toEqual(['base', 'right']);
		expect(recipeDocks('ㅑ')).toEqual(['base', 'right', 'right2']);
		expect(recipeDocks('ㅣ')).toEqual(['base']);
		expect(placeholderDocks(EMPTY_BOARD, 'ㅏ')).toEqual(['base', 'right']);
		expect(placeholderDocks(board({ base: 'ㅣ' }), 'ㅏ')).toEqual(['right']);
		expect(placeholderDocks(board({ base: 'ㅣ', ticks: 1, side: 'right' }), 'ㅏ')).toEqual([]);
		expect(placeholderDocks(board({ base: 'ㅣ', ticks: 1, side: 'right' }), 'ㅑ')).toEqual([
			'right2'
		]);
		expect(placeholderDocks(board({ base: 'ㅣ' }), 'ㅣ')).toEqual([]);
	});

	it('does not leave an opposite-side or extra-tick hole on a finished letter', () => {
		const a = board({ base: 'ㅣ', ticks: 1, side: 'right' });
		expect(placeholderDocks(a, 'ㅏ')).not.toContain('left');
		expect(placeholderDocks(a, 'ㅏ')).not.toContain('right2');
	});

	it('treats a correct unfinished recipe as progress, not a miss', () => {
		expect(towardTarget(board({ base: 'ㅣ' }), 'ㅏ')).toBe(true);
		expect(towardTarget(board({ base: 'ㅣ', ticks: 1, side: 'right' }), 'ㅑ')).toBe(true);
		expect(towardTarget(board({ base: 'ㅡ' }), 'ㅏ')).toBe(false);
		expect(towardTarget(EMPTY_BOARD, 'ㅏ')).toBe(false);
		expect(towardTarget(board({ base: 'ㅣ', ticks: 2, side: 'right' }), 'ㅏ')).toBe(false);
	});

	it('keeps empty-board silhouettes, then drops tick holes that the seated base cannot take', () => {
		expect(placeholderDocks(EMPTY_BOARD, 'ㅛ')).toEqual(['base', 'above', 'above2']);
		expect(placeholderDocks(board({ base: 'ㅡ' }), 'ㅛ')).toEqual(['above', 'above2']);
		expect(placeholderDocks(board({ base: 'ㅡ' }), 'ㅏ')).toEqual([]);
		expect(boardDocks(board({ base: 'ㅡ' }), 'ㅏ')).toEqual(['base']);
		expect(placeholderDocks(board({ base: 'ㅣ' }), 'ㅗ')).toEqual([]);
		expect(boardDocks(board({ base: 'ㅣ' }), 'ㅗ')).toEqual(['base']);
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

	it('lets the first ㅛ tick land on either hole without jumping to the glide', () => {
		const withEu = applyStamp(EMPTY_BOARD, 'base', 'ㅡ')!;
		const fromOuter = applyStamp(withEu, 'above2', 'tick');
		expect(fromOuter).not.toBeNull();
		expect(fromOuter?.ticks).toBe(1);
		expect(vowelOf(fromOuter!)).toBe('ㅗ');
		expect(vowelOf(applyStamp(fromOuter!, 'above2', 'tick')!)).toBe('ㅛ');
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

	it('snaps a ㅛ tick to the paired hole it was dropped on', () => {
		const withEu = applyStamp(EMPTY_BOARD, 'base', 'ㅡ')!;
		const shown: DockId[] = ['base', 'above', 'above2'];
		expect(
			snapDock(withEu, { stamp: 'tick', count: 1 }, 0.65 * 200, 0.22 * 200, 200, shown)
		).toBe('above2');
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
		expect(dockInDirection(iotated, 'right', 'right')).toBe('right');
		expect(dockInDirection(iotated, 'right', 'down')).toBe('right2');
		expect(dockInDirection(iotated, 'right2', 'down')).toBe('right2');
	});

	it('sends ArrowUp from the earth base to the above tick', () => {
		const withEu = board({ base: 'ㅡ' });
		expect(dockInDirection(withEu, 'base', 'up')).toBe('above');
		expect(dockInDirection(withEu, 'base', 'down')).toBe('below');
		expect(dockInDirection(withEu, 'base', 'left')).toBe('base');
		expect(dockInDirection(withEu, 'above', 'down')).toBe('base');
	});

	it('moves sideways between ㅛ ticks and down between ㅑ ticks', () => {
		const yo: DockId[] = ['base', 'above', 'above2'];
		expect(dockInDirection(EMPTY_BOARD, 'above', 'right', yo)).toBe('above2');
		expect(dockInDirection(EMPTY_BOARD, 'above2', 'left', yo)).toBe('above');
		expect(dockInDirection(EMPTY_BOARD, 'above', 'up', yo)).toBe('above');
		const ya: DockId[] = ['base', 'right', 'right2'];
		expect(dockInDirection(EMPTY_BOARD, 'right', 'down', ya)).toBe('right2');
		expect(dockInDirection(EMPTY_BOARD, 'right2', 'up', ya)).toBe('right');
		expect(dockInDirection(EMPTY_BOARD, 'right', 'right', ya)).toBe('right');
	});
});

describe('palette and positions', () => {
	it('exposes the three stamps', () => {
		expect(PALETTE).toEqual(['ㅣ', 'ㅡ', 'tick']);
		expect(stampLabel('ㅣ')).toBe('standing stroke');
		expect(stampLabel('ㅡ')).toBe('earth stroke');
		expect(stampLabel('tick')).toBe('tick');
	});

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

	it('keeps a lone ㅗ tick on the vertical midline', () => {
		expect(dockPosition('above', ['base', 'above'])).toEqual({ x: 0.5, y: 0.22 });
	});

	it('sits ㅛ ticks side by side above the earth stroke', () => {
		const shown: DockId[] = ['base', 'above', 'above2'];
		const above = dockPosition('above', shown);
		const above2 = dockPosition('above2', shown);
		expect(above.y).toBe(above2.y);
		expect(above.x).toBeLessThan(above2.x);
		expect(above.y).toBeLessThan(dockPosition('base', shown).y);
	});

	it('stacks ㅑ ticks on the right of the standing stroke', () => {
		const shown: DockId[] = ['base', 'right', 'right2'];
		const right = dockPosition('right', shown);
		const right2 = dockPosition('right2', shown);
		expect(right.x).toBe(right2.x);
		expect(right.y).toBeLessThan(right2.y);
		expect(right.x).toBeGreaterThan(dockPosition('base', shown).x);
	});

	it('sits ㅠ ticks side by side below the earth stroke', () => {
		const shown: DockId[] = ['base', 'below', 'below2'];
		const below = dockPosition('below', shown);
		const below2 = dockPosition('below2', shown);
		expect(below.y).toBe(below2.y);
		expect(below.x).toBeLessThan(below2.x);
		expect(below.y).toBeGreaterThan(dockPosition('base', shown).y);
	});

	it('stacks ㅕ ticks on the left of the standing stroke', () => {
		const shown: DockId[] = ['base', 'left', 'left2'];
		const left = dockPosition('left', shown);
		const left2 = dockPosition('left2', shown);
		expect(left.x).toBe(left2.x);
		expect(left.y).toBeLessThan(left2.y);
		expect(left.x).toBeLessThan(dockPosition('base', shown).x);
	});
});
