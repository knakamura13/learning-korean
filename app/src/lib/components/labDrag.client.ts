import type { DragMoveEvent, DragStartEvent, DragStopEvent, DraggableOptions, MirrorCreatedEvent } from '@shopify/draggable';
import { DRAG_THRESHOLD_PX } from '$lib/domain/composerSnap';
import { PointerSensor } from './pointerSensor';
import { ShopifyDraggable, type LabDraggableOptions } from './shopifyRuntime';

export type LabDragPoint = {
	source: HTMLElement;
	originalSource: HTMLElement;
	x: number;
	y: number;
};

export type LabDragHandlers = {
	draggable: string;
	onStart?: (point: LabDragPoint) => void | false;
	onMove?: (point: LabDragPoint) => void;
	onStop?: (point: LabDragPoint) => void;
	decorateMirror?: (mirror: HTMLElement, original: HTMLElement) => void;
};

function pointFrom(event: DragStartEvent | DragMoveEvent | DragStopEvent): LabDragPoint {
	const sensor = event.sensorEvent;
	const original = event.originalEvent as PointerEvent | MouseEvent | undefined;
	return {
		source: event.source,
		originalSource: event.originalSource,
		x: sensor?.clientX ?? original?.clientX ?? 0,
		y: sensor?.clientY ?? original?.clientY ?? 0
	};
}

/**
 * Shopify Draggable with a pointer sensor, the built-in mirror, and no
 * Focusable/Announcement plugins (those fight lab radiogroups).
 */
export function bindLabDrag(container: HTMLElement, handlers: LabDragHandlers): () => void {
	const options: LabDraggableOptions = {
		draggable: handlers.draggable,
		distance: DRAG_THRESHOLD_PX,
		delay: 0,
		mirror: {
			appendTo: document.body,
			constrainDimensions: true
		},
		sensors: [PointerSensor],
		exclude: {
			sensors: [ShopifyDraggable.Sensors.MouseSensor, ShopifyDraggable.Sensors.TouchSensor],
			plugins: [
				ShopifyDraggable.Plugins.Focusable,
				ShopifyDraggable.Plugins.Announcement,
				ShopifyDraggable.Plugins.Scrollable
			]
		},
		classes: {
			mirror: ['draggable-mirror', 'ghost']
		}
	};

	const draggable = new ShopifyDraggable(container, options as DraggableOptions);

	const onStart = (event: DragStartEvent) => {
		if (handlers.onStart?.(pointFrom(event)) === false) event.cancel();
	};
	const onMove = (event: DragMoveEvent) => {
		handlers.onMove?.(pointFrom(event));
	};
	const onStop = (event: DragStopEvent) => {
		handlers.onStop?.(pointFrom(event));
	};
	const onMirror = (event: MirrorCreatedEvent) => {
		handlers.decorateMirror?.(event.mirror, event.originalSource);
	};

	draggable.on('drag:start', onStart);
	draggable.on('drag:move', onMove);
	draggable.on('drag:stop', onStop);
	draggable.on('mirror:created', onMirror);

	return () => draggable.destroy();
}
