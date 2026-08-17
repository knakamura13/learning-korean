import { DRAG_THRESHOLD_PX } from '$lib/domain/composerSnap';

/** Shopify MouseSensor calls this on move/up; jsdom does not implement it. */
if (typeof document.elementFromPoint !== 'function') {
	document.elementFromPoint = () => null;
}

/**
 * jsdom helper that drives Shopify MouseSensor: document-capture mousedown,
 * then document mousemove/mouseup. Distance uses pageX/pageY, which jsdom
 * often leaves at 0 unless we stamp them.
 */
export function mousePoint(type: string, x: number, y: number): MouseEvent {
	const event = new MouseEvent(type, {
		bubbles: true,
		cancelable: true,
		clientX: x,
		clientY: y,
		screenX: x,
		screenY: y,
		button: 0,
		buttons: type === 'mouseup' ? 0 : 1
	});
	Object.defineProperty(event, 'pageX', { configurable: true, value: x });
	Object.defineProperty(event, 'pageY', { configurable: true, value: y });
	return event;
}

export function startMouseDrag(
	source: EventTarget,
	from: { x: number; y: number } = { x: 10, y: 10 }
): void {
	source.dispatchEvent(mousePoint('mousedown', from.x, from.y));
	document.dispatchEvent(mousePoint('mousemove', from.x + DRAG_THRESHOLD_PX, from.y));
}

export async function endMouseDrag(to: { x: number; y: number }): Promise<void> {
	document.dispatchEvent(mousePoint('mouseup', to.x, to.y));
	await Promise.resolve();
}

export async function fireMouseDrag(
	source: EventTarget,
	to: { x: number; y: number },
	from: { x: number; y: number } = { x: 10, y: 10 }
): Promise<void> {
	startMouseDrag(source, from);
	document.dispatchEvent(mousePoint('mousemove', to.x, to.y));
	await endMouseDrag(to);
}

export async function fireMouseJitter(
	source: EventTarget,
	from: { x: number; y: number } = { x: 10, y: 10 },
	delta = DRAG_THRESHOLD_PX - 1
): Promise<void> {
	source.dispatchEvent(mousePoint('mousedown', from.x, from.y));
	document.dispatchEvent(mousePoint('mousemove', from.x + delta, from.y));
	document.dispatchEvent(mousePoint('mouseup', from.x + delta, from.y));
	await Promise.resolve();
}
