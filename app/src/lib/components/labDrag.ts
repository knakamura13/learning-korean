import type { Attachment } from 'svelte/attachments';
import type { LabDragHandlers } from './labDrag.client';

export type { LabDragHandlers, LabDragPoint } from './labDrag.client';

/**
 * Client-only attachment. `@shopify/draggable` touches `window` at import
 * time, so the binder is loaded from inside the attachment (effects do not
 * run during SSR).
 */
export function labDrag(handlers: LabDragHandlers): Attachment {
	return (element) => {
		let destroy: (() => void) | undefined;
		let gone = false;
		void import('./labDrag.client').then(({ bindLabDrag }) => {
			if (gone) return;
			destroy = bindLabDrag(element as HTMLElement, handlers);
		});
		return () => {
			gone = true;
			destroy?.();
		};
	};
}

/** Resolve the dynamic binder so tests can drag in the same turn. */
export async function flushLabDrag(): Promise<void> {
	await import('./labDrag.client');
	await Promise.resolve();
}
