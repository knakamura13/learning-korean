/**
 * Native <dialog> attach helper. jsdom has no showModal, so the open
 * attribute is the test fallback; real browsers get the modal overlay.
 *
 * Capture the opener before showModal steals focus: Svelte `{#if}` unmounts
 * destroy the dialog before the UA can restore focus, which otherwise drops
 * activeElement to `<body>` (WCAG 2.4.3).
 */
export function attachModalDialog(node: HTMLDialogElement, onCancel?: () => void): () => void {
	const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
	try {
		node.showModal();
	} catch {
		node.setAttribute('open', '');
	}
	const handleCancel = () => onCancel?.();
	if (onCancel) node.addEventListener('cancel', handleCancel);
	return () => {
		if (onCancel) node.removeEventListener('cancel', handleCancel);
		try {
			if (node.open) node.close();
		} catch {
			/* jsdom */
		}
		node.removeAttribute('open');
		if (opener?.isConnected) opener.focus();
	};
}
