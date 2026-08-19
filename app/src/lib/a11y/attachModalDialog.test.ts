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
});
