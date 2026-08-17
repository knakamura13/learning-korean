import {
	DragMoveSensorEvent,
	DragStartSensorEvent,
	DragStopSensorEvent
} from './shopifyRuntime';

/**
 * Shopify's default TouchSensor waits 100ms before a drag. Labs need an
 * immediate pointer lift (click vs 8px drag), so this sensor drives
 * Draggable from pointer events instead of mouse/touch pairs.
 */
function asElement(target: EventTarget | null): Element | null {
	if (target instanceof Element) return target;
	if (target instanceof Text) return target.parentElement;
	return null;
}

function containerOf(target: Element | null, containers: HTMLElement[]): HTMLElement | null {
	if (!target) return null;
	return containers.find((container) => container === target || container.contains(target)) ?? null;
}

function preventNativeDragStart(event: Event) {
	event.preventDefault();
}

function elementAt(x: number, y: number, fallback: HTMLElement): HTMLElement {
	const hit = typeof document.elementFromPoint === 'function' ? document.elementFromPoint(x, y) : null;
	return hit instanceof HTMLElement ? hit : fallback;
}

export class PointerSensor {
	containers: HTMLElement[];
	options: { draggable?: string; distance?: number };
	dragging = false;
	currentContainer: HTMLElement | null = null;
	originalSource: HTMLElement | null = null;
	startEvent: PointerEvent | null = null;

	private onPointerDown = (event: PointerEvent) => this.handlePointerDown(event);
	private onDistanceChange = (event: PointerEvent) => this.handleDistanceChange(event);
	private onPointerMove = (event: PointerEvent) => this.handlePointerMove(event);
	private onPointerUp = (event: PointerEvent) => this.handlePointerUp(event);

	constructor(containers: HTMLElement[] = [], options: Record<string, unknown> = {}) {
		this.containers = [...containers];
		this.options = options;
	}

	attach() {
		document.addEventListener('pointerdown', this.onPointerDown, true);
		return this;
	}

	detach() {
		document.removeEventListener('pointerdown', this.onPointerDown, true);
		this.unbindTracking();
		return this;
	}

	addContainer(...containers: HTMLElement[]) {
		this.containers = [...this.containers, ...containers];
	}

	removeContainer(...containers: HTMLElement[]) {
		this.containers = this.containers.filter((container) => !containers.includes(container));
	}

	/**
	 * Draggable's drag:stop handler reads `event.sensorEvent` on the native
	 * Event, not `event.detail` (which Sensor.trigger sets). Mirror both.
	 */
	trigger(element: HTMLElement, sensorEvent: { type: string }) {
		const event = document.createEvent('Event') as Event & {
			detail: unknown;
			sensorEvent: unknown;
		};
		event.detail = sensorEvent;
		event.sensorEvent = sensorEvent;
		event.initEvent(sensorEvent.type, true, true);
		element.dispatchEvent(event);
		return sensorEvent;
	}

	private handlePointerDown(event: PointerEvent) {
		if (event.button !== 0 || event.ctrlKey || event.metaKey) return;
		const from = asElement(event.target);
		const container = containerOf(from, this.containers);
		if (!container || !from) return;

		const selector =
			typeof this.options.draggable === 'string' ? this.options.draggable : '.draggable-source';
		const originalSource = from.closest(selector);
		if (!(originalSource instanceof HTMLElement)) return;
		if (originalSource instanceof HTMLButtonElement && originalSource.disabled) return;

		this.currentContainer = container;
		this.originalSource = originalSource;
		this.startEvent = event;

		document.addEventListener('dragstart', preventNativeDragStart);
		window.addEventListener('pointermove', this.onDistanceChange);
		window.addEventListener('pointerup', this.onPointerUp);
		window.addEventListener('pointercancel', this.onPointerUp);
	}

	private handleDistanceChange(event: PointerEvent) {
		if (!this.currentContainer || !this.startEvent) return;
		const start = this.startEvent;
		const distance = Number(this.options.distance ?? 0);
		const travelled = Math.hypot(event.clientX - start.clientX, event.clientY - start.clientY);
		if (travelled < distance) return;

		window.removeEventListener('pointermove', this.onDistanceChange);
		this.startDrag();
	}

	private startDrag() {
		const startEvent = this.startEvent;
		const container = this.currentContainer;
		const originalSource = this.originalSource;
		if (!startEvent || !container || !originalSource) return;

		const dragStartEvent = new DragStartSensorEvent({
			clientX: startEvent.clientX,
			clientY: startEvent.clientY,
			target: (asElement(startEvent.target) as HTMLElement | null) ?? originalSource,
			container,
			originalSource,
			originalEvent: startEvent
		});

		this.trigger(container, dragStartEvent);
		this.dragging = !dragStartEvent.canceled();
		if (this.dragging) {
			window.addEventListener('pointermove', this.onPointerMove);
		}
	}

	private handlePointerMove(event: PointerEvent) {
		if (!this.dragging || !this.currentContainer) return;
		const target = elementAt(
			event.clientX,
			event.clientY,
			this.originalSource ?? this.currentContainer
		);
		const dragMoveEvent = new DragMoveSensorEvent({
			clientX: event.clientX,
			clientY: event.clientY,
			target,
			container: this.currentContainer,
			originalSource: this.originalSource ?? this.currentContainer,
			originalEvent: event
		});
		this.trigger(this.currentContainer, dragMoveEvent);
	}

	private handlePointerUp(event: PointerEvent) {
		const wasDragging = this.dragging;
		const container = this.currentContainer;
		this.unbindTracking();
		if (!wasDragging || !container) return;

		const target = elementAt(event.clientX, event.clientY, this.originalSource ?? container);
		const dragStopEvent = new DragStopSensorEvent({
			clientX: event.clientX,
			clientY: event.clientY,
			target,
			container,
			originalSource: this.originalSource ?? container,
			originalEvent: event
		});
		this.trigger(container, dragStopEvent);
		this.dragging = false;
		this.currentContainer = null;
		this.originalSource = null;
		this.startEvent = null;
	}

	private unbindTracking() {
		document.removeEventListener('dragstart', preventNativeDragStart);
		window.removeEventListener('pointermove', this.onDistanceChange);
		window.removeEventListener('pointermove', this.onPointerMove);
		window.removeEventListener('pointerup', this.onPointerUp);
		window.removeEventListener('pointercancel', this.onPointerUp);
	}
}
