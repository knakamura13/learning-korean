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

export const CLICK_POPOVER_PAD_PX = 8;

/** Place the panel at the click, flipping toward the start/up if it would overflow. */
export function placeClickPopover(
	point: ClickPoint,
	panel: PanelBox,
	viewport: ViewportBox,
	pad = CLICK_POPOVER_PAD_PX
): PopoverPlacement {
	let left = point.x;
	let top = point.y;

	if (left + panel.w > viewport.w - pad) left = point.x - panel.w;
	if (left < pad) left = pad;
	if (left + panel.w > viewport.w - pad) {
		left = Math.max(pad, viewport.w - pad - panel.w);
	}

	if (top + panel.h > viewport.h - pad) top = point.y - panel.h;
	if (top < pad) top = pad;
	if (top + panel.h > viewport.h - pad) {
		top = Math.max(pad, viewport.h - pad - panel.h);
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
