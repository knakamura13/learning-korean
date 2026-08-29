import { describe, expect, it } from 'vitest';
import {
	pipRailCenteredScrollLeft,
	pipRailEdgeFades,
	pipRailMaxScroll,
	pipRailSnapScrollLeft
} from './pipRail';

describe('pipRailMaxScroll', () => {
	it('is zero when every pip already fits', () => {
		expect(pipRailMaxScroll(320, 320)).toBe(0);
		expect(pipRailMaxScroll(200, 320)).toBe(0);
	});

	it('is the leftover width when the rail overflows', () => {
		expect(pipRailMaxScroll(500, 320)).toBe(180);
	});

	it('clamps max scroll to the right edge of the furthest unlocked card', () => {
		// total scrollWidth = 1000, clientWidth = 300
		// furthest card right edge = 450 (e.g. card 6)
		// max scroll allowed should be 450 - 300 = 150 (not 700)
		expect(pipRailMaxScroll(1000, 300, 450)).toBe(150);
	});

	it('returns 0 if furthest right edge is less than clientWidth', () => {
		expect(pipRailMaxScroll(1000, 300, 200)).toBe(0);
	});
});

describe('pipRailEdgeFades', () => {
	it('hides both fades when nothing overflows', () => {
		expect(pipRailEdgeFades(0, 0)).toEqual({ left: false, right: false });
	});

	it('fades only the right edge at the start of an overflowing rail', () => {
		expect(pipRailEdgeFades(0, 180)).toEqual({ left: false, right: true });
	});

	it('fades only the left edge at the end of an overflowing rail', () => {
		expect(pipRailEdgeFades(180, 180)).toEqual({ left: true, right: false });
	});

	it('fades both edges when the current card sits in the middle', () => {
		expect(pipRailEdgeFades(90, 180)).toEqual({ left: true, right: true });
	});

	it('treats sub-pixel leftover as fully scrolled, so a clipped sliver does not linger', () => {
		expect(pipRailEdgeFades(0.4, 180)).toEqual({ left: false, right: true });
		expect(pipRailEdgeFades(179.6, 180)).toEqual({ left: true, right: false });
	});

	it('ignores a few leftover pixels so a fitted row does not grow an edge fade', () => {
		expect(pipRailEdgeFades(0, 4)).toEqual({ left: false, right: false });
		expect(pipRailEdgeFades(4, 4)).toEqual({ left: false, right: false });
	});
});

describe('pipRailCenteredScrollLeft', () => {
	it('keeps the first pip at the start instead of scrolling into negative', () => {
		expect(pipRailCenteredScrollLeft(0, 36, 0, 200, 0, 400)).toBe(0);
	});

	it('centers a pip that sits past the visible rail', () => {
		// pip at x=400, 36px wide; rail is 200px at x=0; already at scroll 0
		expect(pipRailCenteredScrollLeft(400, 36, 0, 200, 0, 400)).toBe(318);
	});

	it('does not move when the selected pip is already centered', () => {
		expect(pipRailCenteredScrollLeft(82, 36, 0, 200, 50, 400)).toBe(50);
	});

	it('clamps to the last reachable scroll so the end pip is not past the rail', () => {
		expect(pipRailCenteredScrollLeft(500, 36, 0, 200, 0, 200)).toBe(200);
	});
});

describe('pipRailSnapScrollLeft', () => {
	it('does not move when already on a pip boundary', () => {
		expect(pipRailSnapScrollLeft(152, 38, 400)).toBe(152);
	});

	it('scrolls back to the previous pip so a left-edge sliver becomes a whole mark', () => {
		// 7.6 pips in: 0.6 of a pip is a 23px sliver on the left
		expect(pipRailSnapScrollLeft(7.6 * 38, 38, 400)).toBe(7 * 38);
	});

	it('stays at 0 and at max scroll', () => {
		expect(pipRailSnapScrollLeft(0, 38, 400)).toBe(0);
		expect(pipRailSnapScrollLeft(400, 38, 400)).toBe(400);
		expect(pipRailSnapScrollLeft(395, 38, 400)).toBe(380);
	});

	it('is a no-op when pips have no width yet', () => {
		expect(pipRailSnapScrollLeft(40, 0, 400)).toBe(40);
	});

	it('accounts for a leading glow pad so snap still lands on a whole pip', () => {
		const pad = 12;
		const stride = 38;
		expect(pipRailSnapScrollLeft(pad + 7.6 * stride, stride, 400, pad)).toBe(
			pad + 7 * stride
		);
	});

	it('snaps to the start when the desired offset is still inside the glow pad', () => {
		expect(pipRailSnapScrollLeft(8, 38, 400, 12)).toBe(0);
	});
});
