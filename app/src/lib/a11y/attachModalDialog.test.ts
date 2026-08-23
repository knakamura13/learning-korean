/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest';
import { attachModalDialog } from './attachModalDialog';

describe('attachModalDialog', () => {
	it('falls back to the open attribute when showModal is missing', () => {
		const node = document.createElement('dialog');
		node.showModal = () => {
			throw new Error('no modal');
		};
		const onCancel = vi.fn();
		const destroy = attachModalDialog(node, onCancel);
		expect(node.getAttribute('open')).toBe('');
		destroy();
		expect(node.hasAttribute('open')).toBe(false);
	});

	it('opens with showModal when the browser implements it', () => {
		const node = document.createElement('dialog');
		const showModal = vi.fn(function (this: HTMLDialogElement) {
			this.setAttribute('open', '');
		});
		node.showModal = showModal;
		attachModalDialog(node);
		expect(showModal).toHaveBeenCalledOnce();
	});

	it('returns focus to the opener when the dialog is destroyed by {#if}', () => {
		const opener = document.createElement('button');
		document.body.appendChild(opener);
		opener.focus();
		expect(document.activeElement).toBe(opener);

		const node = document.createElement('dialog');
		const cancel = document.createElement('button');
		node.appendChild(cancel);
		document.body.appendChild(node);
		node.showModal = () => {
			node.setAttribute('open', '');
			cancel.focus();
		};
		node.close = () => {
			node.removeAttribute('open');
		};

		const destroy = attachModalDialog(node);
		expect(document.activeElement).toBe(cancel);

		// Svelte {#if} unmount removes the dialog before native close can restore focus.
		node.remove();
		destroy();

		expect(document.activeElement).toBe(opener);
		opener.remove();
	});
});
