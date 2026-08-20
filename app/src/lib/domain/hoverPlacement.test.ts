import { describe, expect, it } from 'vitest';
import {
	anchorPopover,
	decideHoverIntent,
	decideItemFocusOpen,
	decideUnlockedPress,
	decideWindowEscape,
	expandHoverBox,
	hoverBridgePolygon,
	isHoverPointerType,
	isPointInHoverBridge,
	svgPolygonPoints,
	type PreviewOpenMode
} from './hoverPlacement';

describe('anchorPopover', () => {
	it('places the panel 12px to the right and 0.5rem above the cursor', () => {
		const viewport = { w: 1200, h: 800 };
		const panel = { w: 320, h: 220 };
		const open = anchorPopover({ x: 80, y: 120 }, panel, viewport);
		expect(open.left).toBe(92);
		expect(open.top).toBe(112);
		const flipped = anchorPopover({ x: 1100, y: 120 }, panel, viewport);
		expect(flipped.left).toBeLessThan(1100 - 320);
	});

	it('clamps onto the viewport rather than overflowing', () => {
		const placed = anchorPopover({ x: 10, y: 790 }, { w: 320, h: 220 }, { w: 400, h: 800 });
		expect(placed.left).toBeGreaterThanOrEqual(8);
		expect(placed.top + 220).toBeLessThanOrEqual(800);
	});

	it('anchors a number box to the right edge and 0.5rem above the vertical center', () => {
		const rect = { x: 20, y: 40, width: 44, height: 44, top: 40, right: 64 };
		const placed = anchorPopover(rect, { w: 320, h: 220 }, { w: 1200, h: 800 });
		expect(placed.left).toBe(76);
		expect(placed.top).toBe(54);
	});
});

describe('isHoverPointerType', () => {
	it('treats mouse as hover and touch/pen as press, ignoring matchMedia', () => {
		expect(isHoverPointerType('mouse')).toBe(true);
		expect(isHoverPointerType('')).toBe(true);
		expect(isHoverPointerType('touch')).toBe(false);
		expect(isHoverPointerType('pen')).toBe(false);
	});
});

describe('expandHoverBox', () => {
	it('adds a 4px halo on every side so the pointer can leave the number without dropping the card', () => {
		const box = { left: 76, top: 120, right: 396, bottom: 400 };
		expect(expandHoverBox(box)).toEqual({ left: 72, top: 116, right: 400, bottom: 404 });
		const apex = { x: 64, y: 142 };
		const hit = expandHoverBox({ left: 76, top: 142, right: 396, bottom: 400 });
		expect(isPointInHoverBridge({ x: 73, y: 200 }, apex, hit)).toBe(true);
	});
});

describe('hoverBridgePolygon', () => {
	const apex = { x: 42, y: 222 };
	const panel = { left: 76, top: 212, right: 396, bottom: 480 };

	it('covers the 12px gap and the diagonal path toward Open anyway', () => {
		const poly = hoverBridgePolygon(apex, panel);
		expect(poly).toHaveLength(3);
		expect(isPointInHoverBridge({ x: 70, y: 220 }, apex, panel)).toBe(true);
		expect(isPointInHoverBridge({ x: 70, y: 360 }, apex, panel)).toBe(true);
		expect(isPointInHoverBridge({ x: 42, y: 296 }, apex, panel)).toBe(false);
		expect(isPointInHoverBridge({ x: 10, y: 100 }, apex, panel)).toBe(false);
		expect(isPointInHoverBridge({ x: 500, y: 300 }, apex, panel)).toBe(false);
	});

	it('connects the left edge when the panel flips past the number', () => {
		const flipped = { left: 8, top: 40, right: 328, bottom: 260 };
		const apexRight = { x: 1122, y: 100 };
		expect(isPointInHoverBridge({ x: 340, y: 100 }, apexRight, flipped)).toBe(true);
		expect(isPointInHoverBridge({ x: 800, y: 400 }, apexRight, flipped)).toBe(false);
	});

	it('serializes SVG polygon points', () => {
		expect(svgPolygonPoints(hoverBridgePolygon(apex, panel))).toMatch(/^\d/);
	});
});

describe('decideHoverIntent', () => {
	it('does not freeze cursor-follow while the pointer is still on the number', () => {
		expect(decideHoverIntent(true, false, true)).toEqual({ action: 'stay', freezeFollow: false });
	});

	it('stays open and freezes follow on the card or the bridge', () => {
		expect(decideHoverIntent(false, true, false)).toEqual({ action: 'stay', freezeFollow: true });
		expect(decideHoverIntent(false, false, true)).toEqual({ action: 'stay', freezeFollow: true });
	});

	it('closes once the pointer leaves the number, card, and bridge', () => {
		expect(decideHoverIntent(false, false, false)).toEqual({ action: 'close' });
	});
});

describe('decideUnlockedPress', () => {
	it('does not treat a focus-opened panel as a second tap', () => {
		const decision = decideUnlockedPress(
			{ openId: '0001', openedBy: 'keyboard', armedForNavigate: null },
			'0001',
			'touch'
		);
		expect(decision.action).toBe('preview');
		if (decision.action === 'preview') expect(decision.preventDefault).toBe(true);
	});
});

/**
 * Today's bug: closePreview(); number.focus(); onItemFocus always opened.
 * This is the same sequence LabIndexRail runs on Escape from the panel.
 */
function previewAfterEscapeRestoreFocus(
	openId: string | null,
	mode: PreviewOpenMode
): string | null {
	const escape = decideWindowEscape(openId, mode);
	switch (escape.action) {
		case 'ignore':
			return openId;
		case 'close':
			return null;
		case 'dismiss': {
			const focus = decideItemFocusOpen(true);
			switch (focus.action) {
				case 'skip':
					return null;
				case 'open':
					return escape.restoreId;
				default: {
					const _exhaustive: never = focus;
					return _exhaustive;
				}
			}
		}
		default: {
			const _exhaustive: never = escape;
			return _exhaustive;
		}
	}
}

function legacyEscapeRestoreWouldReopen(): boolean {
	let openId: string | null = '0001';
	openId = null;
	openId = '0001';
	return openId !== null;
}

describe('Escape restore-focus must not reopen the preview', () => {
	it('stays closed when close is followed by synthetic focus on the number', () => {
		expect(legacyEscapeRestoreWouldReopen()).toBe(true);
		expect(previewAfterEscapeRestoreFocus('0001', 'keyboard')).toBeNull();
		expect(previewAfterEscapeRestoreFocus('0001', 'press')).toBeNull();
	});

	it('closes a hover-only preview on Escape without restoring focus', () => {
		expect(decideWindowEscape('0001', 'pointer')).toEqual({ action: 'close' });
		expect(previewAfterEscapeRestoreFocus('0001', 'pointer')).toBeNull();
	});

	it('ignores Escape when nothing is open', () => {
		expect(decideWindowEscape(null, 'keyboard')).toEqual({ action: 'ignore' });
		expect(previewAfterEscapeRestoreFocus(null, 'press')).toBeNull();
	});

	it('opens on a later real focus after the restore-focus skip', () => {
		expect(decideItemFocusOpen(true)).toEqual({ action: 'skip' });
		expect(decideItemFocusOpen(false)).toEqual({ action: 'open' });
	});
});
