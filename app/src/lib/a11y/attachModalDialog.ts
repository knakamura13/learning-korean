/**
 * Native <dialog> attach helper. jsdom has no showModal, so the open
 * attribute is the test fallback; real browsers get the modal overlay.
 *
 * Capture the opener before showModal steals focus: Svelte `{#if}` unmounts
 * destroy the dialog before the UA can restore focus, which otherwise drops
 * activeElement to `<body>` (WCAG 2.4.3).
 *
 * Backdrop fade pairs with app.css dialog::backdrop transitions. Call
 * requestModalClose before `{#if}` unmount so the exit animation can finish.
 */

/** Matches app.css --med; keep in sync for close timing. */
export const MODAL_BACKDROP_MS = 240;

function prefersReducedMotion(): boolean {
	return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function finishModalClose(node: HTMLDialogElement): void {
	delete node.dataset.closing;
	try {
		if (node.open) node.close();
	} catch {
		/* jsdom */
	}
	node.removeAttribute('open');
}

/** Fade the native backdrop out, then run onDone (typically unmount the {#if}). */
export function requestModalClose(node: HTMLDialogElement, onDone?: () => void): void {
	if (!node.open) {
		onDone?.();
		return;
	}
	if (prefersReducedMotion() || node.dataset.closing !== undefined) {
		finishModalClose(node);
		onDone?.();
		return;
	}
	node.dataset.closing = '';
	let settled = false;
	const settle = () => {
		if (settled) return;
		settled = true;
		finishModalClose(node);
		onDone?.();
	};
	node.addEventListener(
		'transitionend',
		(e) => {
			if (e.target === node && e.propertyName === 'opacity') settle();
		},
		{ once: true }
	);
	setTimeout(settle, MODAL_BACKDROP_MS + 50);
}

export function attachModalDialog(node: HTMLDialogElement, onCancel?: () => void): () => void {
	const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
	try {
		node.showModal();
	} catch {
		node.setAttribute('open', '');
	}
	const requestClose = () => requestModalClose(node, onCancel);
	const handleCancel = (e: Event) => {
		e.preventDefault();
		requestClose();
	};
	if (onCancel) node.addEventListener('cancel', handleCancel);
	return () => {
		if (onCancel) node.removeEventListener('cancel', handleCancel);
		finishModalClose(node);
		if (opener?.isConnected) opener.focus();
	};
}
