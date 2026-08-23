/**
 * lockedLab.ts — click-anchored skip-ahead popover, as pure data.
 *
 * Locked home cards are one control. The popover sits on the click, names the
 * prerequisite, and can grant access to this lab without unlocking its review
 * tier (that still happens when the sitting is finished).
 */

export interface ClickPoint {
	x: number;
	y: number;
}

export interface PanelBox {
	w: number;
	h: number;
}

export interface ViewportBox {
	w: number;
	h: number;
}

export interface PopoverPlacement {
	left: number;
	top: number;
}

export const CLICK_POPOVER_PAD_PX = 12;

export interface EdgePad {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

export function popoverPadWithSafeArea(
	insets: Partial<EdgePad> = {},
	base = CLICK_POPOVER_PAD_PX
): EdgePad {
	return {
		top: base + (insets.top ?? 0),
		right: base + (insets.right ?? 0),
		bottom: base + (insets.bottom ?? 0),
		left: base + (insets.left ?? 0)
	};
}

function resolvePad(pad: number | EdgePad): EdgePad {
	if (typeof pad === 'number') return { top: pad, right: pad, bottom: pad, left: pad };
	return pad;
}

/** Place the panel at the click, flipping toward the start/up if it would overflow. */
export function placeClickPopover(
	point: ClickPoint,
	panel: PanelBox,
	viewport: ViewportBox,
	pad: number | EdgePad = CLICK_POPOVER_PAD_PX
): PopoverPlacement {
	const edge = resolvePad(pad);
	let left = point.x;
	let top = point.y;

	if (left + panel.w > viewport.w - edge.right) left = point.x - panel.w;
	if (left < edge.left) left = edge.left;
	if (left + panel.w > viewport.w - edge.right) {
		left = Math.max(edge.left, viewport.w - edge.right - panel.w);
	}

	if (top + panel.h > viewport.h - edge.bottom) top = point.y - panel.h;
	if (top < edge.top) top = edge.top;
	if (top + panel.h > viewport.h - edge.bottom) {
		top = Math.max(edge.top, viewport.h - edge.bottom - panel.h);
	}

	return { left, top };
}

function padLab(n: number): string {
	return String(n).padStart(2, '0');
}

export interface LockedLabPopoverCopy {
	title: string;
	body: string;
	priorLabel: string | null;
	skipLabel: string;
	dismissLabel: string;
}

export function lockedLabPopoverCopy(
	lab: { number: number; title: string },
	prior: { number: number; title: string } | null
): LockedLabPopoverCopy {
	if (!prior) {
		return {
			title: `Lab ${padLab(lab.number)} is locked`,
			body: 'Finish the previous lab first.',
			priorLabel: null,
			skipLabel: `Open Lab ${padLab(lab.number)} anyway`,
			dismissLabel: 'Go back'
		};
	}
	return {
		title: `Lab ${padLab(lab.number)} is locked`,
		body: `Finish Lab ${padLab(prior.number)} first. ${lab.title} assumes you already have that sitting.`,
		priorLabel: `Open Lab ${padLab(prior.number)}`,
		skipLabel: `Open Lab ${padLab(lab.number)} anyway`,
		dismissLabel: 'Go back'
	};
}
