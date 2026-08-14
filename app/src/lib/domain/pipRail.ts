/**
 * pipRail.ts — scroll math for the numbered lab-card rail.
 *
 * On a phone the 17 pips do not fit. Overflow must fade at the *rail*
 * edge (not beside the "12 / 17" counter), and the current pip should
 * sit in view so a circular mark is never hard-clipped into a sliver.
 */

const EDGE_SLOP = 8;

export function pipRailMaxScroll(scrollWidth: number, clientWidth: number): number {
	return Math.max(0, scrollWidth - clientWidth);
}

export function pipRailEdgeFades(
	scrollLeft: number,
	maxScroll: number,
	slop = EDGE_SLOP
): { left: boolean; right: boolean } {
	if (maxScroll <= slop) return { left: false, right: false };
	return {
		left: scrollLeft > slop,
		right: maxScroll - scrollLeft > slop
	};
}

/**
 * ScrollLeft that puts the pip's centre on the rail's centre, clamped.
 * Viewport boxes (getBoundingClientRect) plus the current scrollLeft.
 */
export function pipRailCenteredScrollLeft(
	pipLeft: number,
	pipWidth: number,
	railLeft: number,
	railWidth: number,
	currentScrollLeft: number,
	maxScroll: number
): number {
	const delta = pipLeft + pipWidth / 2 - (railLeft + railWidth / 2);
	return Math.max(0, Math.min(maxScroll, currentScrollLeft + delta));
}

/**
 * Pull scrollLeft back onto a pip stride so the left edge is a whole mark,
 * never a 2px ring sliver. Remainder belongs on the faded right edge.
 */
export function pipRailSnapScrollLeft(
	desired: number,
	stride: number,
	maxScroll: number
): number {
	const clamped = Math.max(0, Math.min(maxScroll, desired));
	if (stride <= 0 || maxScroll <= 0) return clamped;
	if (clamped >= maxScroll - 0.5) return maxScroll;
	const snapped = Math.floor((clamped + 0.5) / stride) * stride;
	return Math.max(0, Math.min(maxScroll, snapped));
}
