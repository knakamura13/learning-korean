// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DRAG_THRESHOLD_PX } from '$lib/domain/composerSnap';
import { bindLabDrag } from './labDrag.client';

if (typeof PointerEvent === 'undefined') {
	class PointerEventPolyfill extends MouseEvent {
		pointerId: number;
		pointerType: string;
		constructor(type: string, init: MouseEventInit & { pointerId?: number; pointerType?: string } = {}) {
			super(type, init);
			this.pointerId = init.pointerId ?? 0;
			this.pointerType = init.pointerType ?? '';
		}
	}
	Object.defineProperty(globalThis, 'PointerEvent', { value: PointerEventPolyfill });
}

function firePointer(target: EventTarget, type: string, x: number, y: number) {
	target.dispatchEvent(
		new PointerEvent(type, {
			bubbles: true,
			cancelable: true,
			button: 0,
			clientX: x,
			clientY: y,
			pointerId: 1,
			pointerType: 'mouse'
		})
	);
}

async function frame() {
	await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function chipBox() {
	const root = document.createElement('div');
	const chip = document.createElement('button');
	chip.type = 'button';
	chip.className = 'chip draggable';
	chip.textContent = 'ㅜ';
	root.append(chip);
	document.body.append(root);
	return { root, chip };
}

describe('bindLabDrag', () => {
	const cleanups: Array<() => void> = [];

	afterEach(() => {
		while (cleanups.length) cleanups.pop()!();
		document.body.innerHTML = '';
	});

	it('does not start a drag for a short pointer jitter', async () => {
		const { root, chip } = chipBox();
		const onStart = vi.fn();
		cleanups.push(bindLabDrag(root, { draggable: '.chip.draggable', onStart }));

		firePointer(chip, 'pointerdown', 10, 10);
		firePointer(window, 'pointermove', 10 + DRAG_THRESHOLD_PX - 1, 10);
		await frame();

		expect(onStart).not.toHaveBeenCalled();
		expect(document.querySelector('.ghost')).toBeNull();
	});

	it('starts a Shopify drag and shows a ghost once the pointer travels 8px', async () => {
		const { root, chip } = chipBox();
		const onStart = vi.fn();
		const onMove = vi.fn();
		cleanups.push(bindLabDrag(root, { draggable: '.chip.draggable', onStart, onMove }));

		firePointer(chip, 'pointerdown', 10, 10);
		firePointer(window, 'pointermove', 10 + DRAG_THRESHOLD_PX, 10);
		await frame();

		expect(onStart).toHaveBeenCalledTimes(1);
		expect(onStart.mock.calls[0][0].originalSource).toBe(chip);
		expect(document.querySelector('.ghost')?.textContent).toContain('ㅜ');

		firePointer(window, 'pointermove', 40, 50);
		await frame();
		expect(onMove).toHaveBeenCalled();
		expect(onMove.mock.calls.at(-1)?.[0].x).toBe(40);
		expect(onMove.mock.calls.at(-1)?.[0].y).toBe(50);
	});

	it('reports the release point on stop', async () => {
		const { root, chip } = chipBox();
		const onStop = vi.fn();
		cleanups.push(bindLabDrag(root, { draggable: '.chip.draggable', onStop }));

		firePointer(chip, 'pointerdown', 10, 10);
		firePointer(window, 'pointermove', 10 + DRAG_THRESHOLD_PX, 10);
		await frame();
		firePointer(window, 'pointerup', 240, 40);
		await frame();

		expect(onStop).toHaveBeenCalledTimes(1);
		expect(onStop.mock.calls[0][0].x).toBe(240);
		expect(onStop.mock.calls[0][0].y).toBe(40);
		expect(document.querySelector('.ghost')).toBeNull();
	});
});
