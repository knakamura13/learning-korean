import * as shopify from '@shopify/draggable';
import type { Draggable, DraggableOptions, SensorEvent } from '@shopify/draggable';

export type SensorEventData = {
	clientX: number;
	clientY: number;
	target: HTMLElement;
	container: HTMLElement;
	originalSource: HTMLElement;
	originalEvent?: Event;
};

export type SensorEventLike = SensorEvent & { canceled(): boolean };

type EventCtor = new (data: SensorEventData) => SensorEventLike;

type SensorCtor = new (
	containers: HTMLElement[],
	options?: Record<string, unknown>
) => {
	attach(): unknown;
	detach(): unknown;
};

type DraggableCtor = typeof Draggable & {
	Sensors: { MouseSensor: SensorCtor; TouchSensor: SensorCtor };
	Plugins: {
		Focusable: unknown;
		Announcement: unknown;
		Scrollable: unknown;
	};
};

/**
 * `@shopify/draggable`'s published types omit the runtime `Sensors` export
 * and the static `Draggable.Sensors` / `exclude` options. This wrapper is
 * the typed seam for those.
 */
const runtime = shopify as unknown as {
	Draggable: DraggableCtor;
	Sensors: {
		DragStartSensorEvent: EventCtor;
		DragMoveSensorEvent: EventCtor;
		DragStopSensorEvent: EventCtor;
	};
};

export const ShopifyDraggable = runtime.Draggable;
export const DragStartSensorEvent = runtime.Sensors.DragStartSensorEvent;
export const DragMoveSensorEvent = runtime.Sensors.DragMoveSensorEvent;
export const DragStopSensorEvent = runtime.Sensors.DragStopSensorEvent;

export type LabDraggableOptions = Omit<DraggableOptions, 'sensors' | 'classes'> & {
	exclude?: {
		plugins?: unknown[];
		sensors?: unknown[];
	};
	sensors?: SensorCtor[];
	classes?: Partial<NonNullable<DraggableOptions['classes']>>;
};
