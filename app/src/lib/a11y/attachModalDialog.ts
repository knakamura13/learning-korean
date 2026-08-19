/**
 * Native <dialog> attach helper. jsdom has no showModal, so the open
 * attribute is the test fallback; real browsers get the modal overlay.
 */
export function attachModalDialog(node: HTMLDialogElement, onCancel?: () => void): () => void {
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
	};
}
