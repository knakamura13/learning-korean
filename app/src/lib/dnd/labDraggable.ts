/**
 * Svelte 5 attachment around @shopify/draggable.
 *
 * Labs are not sortable lists: chips stay in the tray and stamp a matching
 * slot. Shopify's Droppable/Sortable move DOM nodes, which fights Svelte, so
 * this wraps the base `Draggable` (mirror + sensors only) and applies results
 * through callbacks after the library restores the original node.
 */
import { Draggable, type DragEvent, type DraggableOptions, type MirrorCreatedEvent } from '@shopify/draggable';
import type { Attachment } from 'svelte/attachments';
import { DRAG_THRESHOLD_PX } from '$lib/domain/composerSnap';

export type LabDragPointer = {
	x: number;
	y: number;
	source: HTMLElement;
	mirror: HTMLElement | null;
};

export type LabDraggableOptions = {
	/** CSS selector for draggable children inside the attached container. */
	draggable: string;
	canDrag?: (source: HTMLElement) => boolean;
	decorateMirror?: (mirror: HTMLElement, source: HTMLElement) => void;
	onStart?: (pointer: LabDragPointer) => void;
	onMove?: (pointer: LabDragPointer) => void;
	/**
	 * Synchronous with `drag:stop` — still inside Shopify's teardown.
	 * Use for flags (skip-click) and highlight clearing, not list mutations.
	 */
	onStop?: (pointer: LabDragPointer) => void;
	/**
	 * Runs in a microtask after Draggable reinserts the original node.
	 * Safe for Svelte state that re-renders the dragged list.
	 */
	onDrop?: (pointer: LabDragPointer) => void;
};

type DraggableInit = DraggableOptions & {
	exclude?: {
		plugins?: unknown[];
		sensors?: unknown[];
	};
};

function pointerFrom(event: DragEvent, fallback: LabDragPointer | null): LabDragPointer {
	const source = event.originalSource ?? event.source;
	const x = event.sensorEvent?.clientX ?? fallback?.x ?? 0;
	const y = event.sensorEvent?.clientY ?? fallback?.y ?? 0;
	return { x, y, source, mirror: event.mirror ?? fallback?.mirror ?? null };
}

/**
 * Returns an attachment. Call once per component instance so `{@attach}` does
 * not tear the library down on every render.
 */
export function labDraggable(options: LabDraggableOptions): Attachment<HTMLElement> {
	return (element) => {
		const init: DraggableInit = {
			draggable: options.draggable,
			distance: DRAG_THRESHOLD_PX,
			delay: { mouse: 0, drag: 0, touch: 100 },
			mirror: {
				constrainDimensions: true,
				appendTo: 'body'
			},
			// Focusable rewrites tabindex and would fight roving radios.
			exclude: { plugins: [Draggable.Plugins.Focusable] }
		};
		const instance = new Draggable(element, init);
		let last: LabDragPointer | null = null;

		instance.on('drag:start', (event) => {
			if (options.canDrag && !options.canDrag(event.originalSource)) {
				event.cancel();
				return;
			}
			last = pointerFrom(event, last);
			options.onStart?.(last);
		});

		instance.on('drag:move', (event) => {
			last = pointerFrom(event, last);
			options.onMove?.(last);
		});

		instance.on('mirror:created', (event: MirrorCreatedEvent) => {
			if (!options.decorateMirror) return;
			options.decorateMirror(event.mirror, event.originalSource);
		});

		instance.on('drag:stop', (event) => {
			const pointer = pointerFrom(event, last);
			last = pointer;
			options.onStop?.(pointer);
			queueMicrotask(() => options.onDrop?.(pointer));
		});

		return () => instance.destroy();
	};
}
