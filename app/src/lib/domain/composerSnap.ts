/**
 * composerSnap.ts — drop geometry for assemble / fusion trays.
 *
 * Each tray maps onto one named slot. A drag seats the piece only when the
 * pointer is inside that slot, or within the 44px snap floor of its edge.
 * A click never consults this module: the tray fills its own slot directly.
 */
export const DRAG_THRESHOLD_PX = 8;
export const SLOT_SNAP_MIN_PX = 44;

export interface SlotBox {
	id: string;
	left: number;
	top: number;
	right: number;
	bottom: number;
}

export function movedEnough(x0: number, y0: number, x1: number, y1: number): boolean {
	return Math.hypot(x1 - x0, y1 - y0) >= DRAG_THRESHOLD_PX;
}

function distToBox(x: number, y: number, box: SlotBox): number {
	const cx = Math.min(Math.max(x, box.left), box.right);
	const cy = Math.min(Math.max(y, box.top), box.bottom);
	return Math.hypot(x - cx, y - cy);
}

export function snapSlot(
	slots: readonly SlotBox[],
	x: number,
	y: number,
	fromId: string
): string | null {
	let best: string | null = null;
	let bestDist = Infinity;
	for (const box of slots) {
		if (!box.id || box.id !== fromId) continue;
		const dist = distToBox(x, y, box);
		if (dist <= SLOT_SNAP_MIN_PX && dist < bestDist) {
			best = box.id;
			bestDist = dist;
		}
	}
	return best;
}
