/**
 * pipRail.ts — scroll math for the numbered lab-card rail.
 *
 * On a phone the 17 pips do not fit. Overflow must fade at the *rail*
 * edge (not beside the "12 / 17" counter), and the current pip should
 * sit in view so a circular mark is never hard-clipped into a sliver.
 *
 * Closed ends still need a short fade (and a matching leading/trailing
 * pad in the rail) so the selected pip's drop-shadow is not cut into a
 * hard vertical line when there is nothing left to scroll.
 */

const EDGE_SLOP = 8;

export function pipRailMaxScroll(
	scrollWidth: number,
	clientWidth: number,
	furthestRightEdge?: number
): number {
	const rawMax = Math.max(0, scrollWidth - clientWidth);
	if (furthestRightEdge !== undefined && Number.isFinite(furthestRightEdge)) {
		const furthestMax = Math.max(0, furthestRightEdge - clientWidth);
		return Math.max(0, Math.min(rawMax, furthestMax));
	}
	return rawMax;
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
 * ScrollLeft that puts the pip's center on the rail's center, clamped.
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
 * `startPad` is the leading glow spacer; snap in pip steps after that pad
 * so the spacer does not shift every mark into a sliver.
 */
export function pipRailSnapScrollLeft(
	desired: number,
	stride: number,
	maxScroll: number,
	startPad = 0
): number {
	const clamped = Math.max(0, Math.min(maxScroll, desired));
	if (stride <= 0 || maxScroll <= 0) return clamped;
	if (clamped >= maxScroll - 0.5) return maxScroll;
	if (startPad > 0 && clamped <= startPad + 0.5) return 0;
	const fromPad = Math.max(0, clamped - startPad);
	const snapped = startPad + Math.floor((fromPad + 0.5) / stride) * stride;
	return Math.max(0, Math.min(maxScroll, snapped));
}
