// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { DRAG_THRESHOLD_PX } from '$lib/domain/composerSnap';
import { fireMouseDrag, fireMouseJitter } from './fireMouseDrag';
import { labDraggable, type LabDraggableOptions } from './labDraggable';

const cleanups: Array<() => void> = [];

afterEach(() => {
	while (cleanups.length) cleanups.pop()?.();
	document.body.replaceChildren();
});

function mountChip(handlers: Omit<LabDraggableOptions, 'draggable'>): HTMLButtonElement {
	const root = document.createElement('div');
	const chip = document.createElement('button');
	chip.type = 'button';
	chip.className = 'chip';
	chip.dataset.item = 'ㅜ';
	chip.textContent = 'ㅜ';
	root.append(chip);
	document.body.append(root);
	const destroy = labDraggable({ draggable: '.chip', ...handlers })(root);
	if (destroy) cleanups.push(destroy);
	return chip;
}

describe('labDraggable', () => {
	it('does not start a drag inside the click threshold', async () => {
		let started = false;
		const chip = mountChip({
			onStart: () => {
				started = true;
			}
		});
		await fireMouseJitter(chip);
		expect(started).toBe(false);
		expect(DRAG_THRESHOLD_PX).toBe(8);
	});

	it('reports drop coordinates after a real drag', async () => {
		const drops: Array<{ x: number; y: number; item: string }> = [];
		const chip = mountChip({
			onDrop: ({ x, y, source }) => {
				drops.push({ x, y, item: source.dataset.item ?? '' });
			}
		});
		await fireMouseDrag(chip, { x: 240, y: 40 });
		expect(drops).toEqual([{ x: 240, y: 40, item: 'ㅜ' }]);
	});
});
