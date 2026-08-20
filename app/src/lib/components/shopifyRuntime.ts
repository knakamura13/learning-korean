import {
	Draggable,
	MouseSensor,
	Sensors,
	TouchSensor,
	type DraggableOptions,
	type SensorEvent
} from '@shopify/draggable';

export type SensorEventData = {
	clientX: number;
	clientY: number;
	target: HTMLElement;
	container: HTMLElement;
	originalSource: HTMLElement;
	originalEvent?: Event;
};

export type SensorEventLike = SensorEvent & { canceled(): boolean };

type SensorCtor = new (
	containers: HTMLElement[],
	options?: Record<string, unknown>
) => {
	attach(): unknown;
	detach(): unknown;
};

type DraggableRuntime = typeof Draggable & {
	Sensors: { MouseSensor: typeof MouseSensor; TouchSensor: typeof TouchSensor };
};

export const ShopifyDraggable = Draggable as DraggableRuntime;
export const DragStartSensorEvent = Sensors.DragStartSensorEvent;
export const DragMoveSensorEvent = Sensors.DragMoveSensorEvent;
export const DragStopSensorEvent = Sensors.DragStopSensorEvent;

export type LabDraggableOptions = Omit<DraggableOptions, 'sensors' | 'classes'> & {
	sensors?: SensorCtor[];
	classes?: Partial<NonNullable<DraggableOptions['classes']>>;
};
