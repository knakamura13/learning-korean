import type { Attachment } from 'svelte/attachments';
import type { LabDragHandlers } from './labDrag.client';

export type { LabDragHandlers, LabDragPoint } from './labDrag.client';

type StartFn = () => Promise<void>;

const pendingStarts: StartFn[] = [];

function scheduleIdle(fn: () => void): () => void {
	if (typeof requestIdleCallback === 'function') {
		const id = requestIdleCallback(() => fn(), { timeout: 2000 });
		return () => cancelIdleCallback(id);
	}
	const id = setTimeout(fn, 1);
	return () => clearTimeout(id);
}

/**
 * Client-only attachment. `@shopify/draggable` registers a window `touchmove`
 * listener at import time, so the binder loads on idle or first pointerdown
 * instead of at mount (attachments do not run during SSR).
 */
export function labDrag(handlers: LabDragHandlers): Attachment {
	return (element) => {
		let destroy: (() => void) | undefined;
		let gone = false;
		let startPromise: Promise<void> | undefined;

		const start: StartFn = () => {
			if (gone) return Promise.resolve();
			if (startPromise) return startPromise;
			startPromise = import('./labDrag.client').then(({ bindLabDrag }) => {
				if (gone) return;
				destroy = bindLabDrag(element as HTMLElement, handlers);
			});
			return startPromise;
		};

		pendingStarts.push(start);
		const cancelIdle = scheduleIdle(() => {
			void start();
		});
		const onPointerDown = () => {
			void start();
		};
		element.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true });

		return () => {
			gone = true;
			cancelIdle();
			const i = pendingStarts.indexOf(start);
			if (i >= 0) pendingStarts.splice(i, 1);
			element.removeEventListener('pointerdown', onPointerDown, { capture: true });
			destroy?.();
		};
	};
}

/** Resolve pending binders so tests can drag in the same turn. */
export async function flushLabDrag(): Promise<void> {
	const batch = pendingStarts.splice(0);
	await Promise.all(batch.map((start) => start()));
	await Promise.resolve();
}
