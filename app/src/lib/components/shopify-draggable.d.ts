import type {
	DragMoveSensorEvent,
	DragStartSensorEvent,
	DragStopSensorEvent
} from '@shopify/draggable';

declare module '@shopify/draggable' {
	export interface SensorEventData {
		clientX: number;
		clientY: number;
		target: HTMLElement;
		container: HTMLElement;
		originalSource: HTMLElement;
		originalEvent?: Event;
		pressure?: number;
	}

	export interface DraggableOptions {
		exclude?: {
			plugins?: unknown[];
			sensors?: unknown[];
		};
	}

	export const Sensors: {
		DragStartSensorEvent: typeof DragStartSensorEvent;
		DragMoveSensorEvent: typeof DragMoveSensorEvent;
		DragStopSensorEvent: typeof DragStopSensorEvent;
	};
}
