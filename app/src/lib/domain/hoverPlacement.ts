/**
 * hoverPlacement.ts — cursor-follow, hover-bridge, and press/escape for rails.
 *
 * Shared by the Labs and Reference rails via HoverPreview. Lab chip copy stays
 * in labPreview.ts so Reference never imports a lab status model.
 */

export const POPOVER_OFFSET_PX = 12;
export const POPOVER_PAD_PX = 8;
export const PREVIEW_HOVER_BUFFER_PX = 4;
/** 0.5rem at a 16px root — lift the card above the cursor / number midline. */
export const PREVIEW_LIFT_PX = 8;
export const HOVER_CLOSE_MS = 160;

export interface ViewportBox {
	w: number;
	h: number;
}

export interface PanelBox {
	w: number;
	h: number;
}

export interface CursorPoint {
	x: number;
	y: number;
}

export interface AnchorRect {
	x: number;
	y: number;
	width: number;
	height: number;
	top: number;
	right: number;
}

export interface HoverBox {
	left: number;
	top: number;
	right: number;
	bottom: number;
}

export type PopoverAnchor = CursorPoint | AnchorRect;

export interface PopoverPlacement {
	left: number;
	top: number;
}

export type PreviewOpenMode = 'pointer' | 'keyboard' | 'press';

/** Hover/focus may already have `openId`; that is not a second tap. */
export interface RailPressState {
	openId: string | null;
	openedBy: PreviewOpenMode | null;
	armedForNavigate: string | null;
}

export type UnlockedPressDecision =
	| { action: 'navigate' }
	| { action: 'preview'; mode: 'press'; preventDefault: true };

export type WindowEscapeDecision =
	| { action: 'ignore' }
	| { action: 'close' }
	| { action: 'dismiss'; restoreId: string };

export type ItemFocusOpenDecision = { action: 'skip' } | { action: 'open' };

/** Finger/stylus on this event — not matchMedia hover capability. */
export function isPressPointerType(pointerType: string): boolean {
	return pointerType === 'touch' || pointerType === 'pen';
}

/** Mouse (and empty pointerType) can hover; touch/pen must tap. */
export function isHoverPointerType(pointerType: string): boolean {
	return !isPressPointerType(pointerType);
}

/**
 * Hover Escape hides the overlay without claiming the key, so a lab picker
 * can still handle it. Keyboard and press claim it so a panel that stole
 * focus can close and return to the number — but only while focus is still
 * inside the rail-and-panel group. Once tab moves past the panel, Escape
 * should close without yanking focus back to the rail.
 */
export function decideWindowEscape(
	openId: string | null,
	mode: PreviewOpenMode,
	focusInPreviewGroup = true
): WindowEscapeDecision {
	if (openId === null) return { action: 'ignore' };
	switch (mode) {
		case 'pointer':
			return { action: 'close' };
		case 'keyboard':
		case 'press':
			return focusInPreviewGroup
				? { action: 'dismiss', restoreId: openId }
				: { action: 'close' };
		default: {
			const _exhaustive: never = mode;
			return _exhaustive;
		}
	}
}

/**
 * Escape restores focus to the number on the same tick. That focus must not
 * reopen the preview. Consume the suppress flag once; a later real focus opens.
 */
export function decideItemFocusOpen(suppressFocusOpen: boolean): ItemFocusOpenDecision {
	return suppressFocusOpen ? { action: 'skip' } : { action: 'open' };
}

/**
 * First touch/pen on an unlocked number opens the preview. A later press on the
 * same id (after that press armed navigation) goes through. Mouse click-through
 * still navigates. Focus/hover opening the panel does not arm.
 */
export function decideUnlockedPress(
	state: RailPressState,
	itemId: string,
	pointerType: string
): UnlockedPressDecision {
	// Callers pass openId/openedBy because focus/hover may already show this id.
	// That is not a second tap — only armedForNavigate is.
	if (!isPressPointerType(pointerType)) {
		return { action: 'navigate' };
	}
	if (state.armedForNavigate === itemId) {
		return { action: 'navigate' };
	}
	return { action: 'preview', mode: 'press', preventDefault: true };
}

function isRect(cursor: PopoverAnchor): cursor is AnchorRect {
	return 'width' in cursor;
}

/** 12px to the right of the number; top edge 0.5rem above the cursor / number midline. */
export function anchorPopover(
	cursor: PopoverAnchor,
	panel: PanelBox,
	viewport: ViewportBox
): PopoverPlacement {
	const origin = isRect(cursor)
		? { x: cursor.right, y: cursor.top + cursor.height / 2 }
		: { x: cursor.x, y: cursor.y };

	let left = origin.x + POPOVER_OFFSET_PX;
	let top = origin.y - PREVIEW_LIFT_PX;

	if (left + panel.w > viewport.w - POPOVER_PAD_PX) {
		left = origin.x - POPOVER_OFFSET_PX - panel.w;
	}

	if (left < POPOVER_PAD_PX) left = POPOVER_PAD_PX;
	if (left + panel.w > viewport.w - POPOVER_PAD_PX) {
		left = Math.max(POPOVER_PAD_PX, viewport.w - POPOVER_PAD_PX - panel.w);
	}

	if (top + panel.h > viewport.h - POPOVER_PAD_PX) {
		top = viewport.h - POPOVER_PAD_PX - panel.h;
	}
	if (top < POPOVER_PAD_PX) top = POPOVER_PAD_PX;

	return { left, top };
}

export function expandHoverBox(box: HoverBox, buffer = PREVIEW_HOVER_BUFFER_PX): HoverBox {
	return {
		left: box.left - buffer,
		top: box.top - buffer,
		right: box.right + buffer,
		bottom: box.bottom + buffer
	};
}

export type HoverIntentDecision =
	| { action: 'stay'; freezeFollow: boolean }
	| { action: 'close' };

/** Keep the preview while the pointer is on the number, the card, or the path between. */
export function decideHoverIntent(
	overItem: boolean,
	overPanel: boolean,
	inBridge: boolean
): HoverIntentDecision {
	if (overItem) return { action: 'stay', freezeFollow: false };
	if (overPanel || inBridge) return { action: 'stay', freezeFollow: true };
	return { action: 'close' };
}

export function hoverBridgePolygon(
	apex: CursorPoint,
	panel: HoverBox
): [CursorPoint, CursorPoint, CursorPoint] {
	const panelCx = (panel.left + panel.right) / 2;
	const overlap = 4;
	if (apex.x <= panelCx) {
		return [
			apex,
			{ x: panel.left + overlap, y: panel.top },
			{ x: panel.left + overlap, y: panel.bottom }
		];
	}
	return [
		apex,
		{ x: panel.right - overlap, y: panel.top },
		{ x: panel.right - overlap, y: panel.bottom }
	];
}

export function svgPolygonPoints(points: CursorPoint[]): string {
	return points.map((p) => `${p.x},${p.y}`).join(' ');
}

export function isPointInHoverBridge(
	point: CursorPoint,
	apex: CursorPoint,
	panel: HoverBox
): boolean {
	if (
		point.x >= panel.left &&
		point.x <= panel.right &&
		point.y >= panel.top &&
		point.y <= panel.bottom
	) {
		return true;
	}
	return pointInPolygon(point, hoverBridgePolygon(apex, panel));
}

function pointInPolygon(point: CursorPoint, polygon: CursorPoint[]): boolean {
	let inside = false;
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const a = polygon[i];
		const b = polygon[j];
		const crosses = a.y > point.y !== b.y > point.y;
		if (!crosses) continue;
		const atX = ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;
		if (point.x < atX) inside = !inside;
	}
	return inside;
}
