/**
 * labPreview.ts — placement and copy for the 01–06 lab rail preview.
 *
 * Pure functions so cursor-follow math, hover-bridge geometry, and honest chips
 * can be tested without mounting the rail. Chip kinds follow `labCardState` so
 * the preview never invents a status the home cards would not show.
 */

import { labCardState, type CourseLab, type CourseNavView, type LabCardState } from './courseNav';

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

export type PreviewChipKind = 'locked' | 'resume' | 'done' | 'start' | 'available';

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
 * Hover-only previews must not steal Escape from the page. Keyboard and press
 * claim it so a panel that stole focus can close and return to the number.
 */
export function decideWindowEscape(
	openId: string | null,
	mode: PreviewOpenMode
): WindowEscapeDecision {
	if (openId === null) return { action: 'ignore' };
	switch (mode) {
		case 'pointer':
			return { action: 'ignore' };
		case 'keyboard':
		case 'press':
			return { action: 'dismiss', restoreId: openId };
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

export interface LabPreviewModel {
	id: string;
	href: string;
	numberLabel: string;
	eyebrow: string;
	title: string;
	standfirst: string;
	minutes: number;
	cardCount: number;
	chip: string;
	chipKind: PreviewChipKind;
	actionLabel: 'Open lab' | 'Open anyway';
	accessibleName: string;
	locked: boolean;
}

function padLab(n: number): string {
	return String(n).padStart(2, '0');
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

export function expandHoverBox(
	box: HoverBox,
	buffer = PREVIEW_HOVER_BUFFER_PX
): HoverBox {
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

export function hoverBridgePolygon(apex: CursorPoint, panel: HoverBox): [CursorPoint, CursorPoint, CursorPoint] {
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

export function isPointInHoverBridge(point: CursorPoint, apex: CursorPoint, panel: HoverBox): boolean {
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

export function previewChipKind(state: LabCardState): PreviewChipKind {
	if (state.locked) return 'locked';
	if (state.resumeAt !== null) return 'resume';
	if (state.done) return 'done';
	if (state.startHere) return 'start';
	return 'available';
}

function chipCopy(
	kind: PreviewChipKind,
	lab: CourseLab,
	state: LabCardState,
	prior: CourseLab | null
): { chip: string; actionLabel: 'Open lab' | 'Open anyway'; statusPhrase: string } {
	switch (kind) {
		case 'locked':
			return {
				chip: prior ? `Finish Lab ${padLab(prior.number)} first` : 'Finish the previous lab first',
				actionLabel: 'Open anyway',
				statusPhrase: 'locked'
			};
		case 'resume':
			return {
				chip: `resume · card ${(state.resumeAt ?? 0) + 1} of ${lab.stepCount}`,
				actionLabel: 'Open lab',
				statusPhrase: 'resume'
			};
		case 'done':
			return {
				chip: '',
				actionLabel: 'Open lab',
				statusPhrase: 'completed'
			};
		case 'start':
			return {
				chip: 'start here',
				actionLabel: 'Open lab',
				statusPhrase: 'start here'
			};
		case 'available':
			return {
				chip: '',
				actionLabel: 'Open lab',
				statusPhrase: 'available'
			};
		default: {
			const _exhaustive: never = kind;
			return _exhaustive;
		}
	}
}

export function labPreviewModel(
	lab: CourseLab,
	standfirst: string,
	state: LabCardState,
	prior: CourseLab | null
): LabPreviewModel {
	const kind = previewChipKind(state);
	const copy = chipCopy(kind, lab, state, prior);
	const numberLabel = padLab(lab.number);
	const eyebrow = `Lab ${numberLabel}`;
	return {
		id: lab.id,
		href: `/lab/${lab.id}`,
		numberLabel,
		eyebrow,
		title: lab.title,
		standfirst,
		minutes: lab.minutes,
		cardCount: lab.stepCount,
		chip: copy.chip,
		chipKind: kind,
		actionLabel: copy.actionLabel,
		accessibleName: `${eyebrow}, ${lab.title}, ${copy.statusPhrase}`,
		locked: kind === 'locked'
	};
}

export function labPreviewModels(
	labs: CourseLab[],
	standfirsts: Record<string, string>,
	view: CourseNavView,
	required: (requires: string | undefined) => CourseLab | null
): LabPreviewModel[] {
	return labs.map((lab) =>
		labPreviewModel(lab, standfirsts[lab.id] ?? '', labCardState(lab, labs, view), required(lab.requires))
	);
}
