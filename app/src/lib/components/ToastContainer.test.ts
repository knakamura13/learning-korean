/**
 * @vitest-environment jsdom
 */
import { mount, unmount, flushSync } from 'svelte';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import ToastContainer from './ToastContainer.svelte';
import { toastStore } from '$lib/stores/toast.svelte';

beforeAll(() => {
	Element.prototype.animate = vi.fn().mockReturnValue({
		finished: Promise.resolve(),
		cancel: vi.fn(),
		finish: vi.fn(),
		play: vi.fn(),
		pause: vi.fn()
	});
});

describe('ToastContainer', () => {
	beforeEach(() => {
		toastStore.clear();
	});

	it('renders empty toast container when no toasts exist', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);
		const app = mount(ToastContainer, { target: host });
		flushSync();

		const container = host.querySelector('.toast-container');
		expect(container).not.toBeNull();
		expect(container?.children.length).toBe(0);

		unmount(app);
		host.remove();
	});

	it('renders toast message and close button with proper aria-label', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);
		const app = mount(ToastContainer, { target: host });

		toastStore.show('Settings updated', 0);
		flushSync();

		const toastItem = host.querySelector('.toast-item');
		expect(toastItem).not.toBeNull();
		expect(host.querySelector('.toast-text')?.textContent).toBe('Settings updated');

		const closeButton = host.querySelector<HTMLButtonElement>('.toast-close');
		expect(closeButton).not.toBeNull();
		expect(closeButton?.getAttribute('aria-label')).toBe('Dismiss message');

		unmount(app);
		host.remove();
	});

	it('dismisses toast when close button is clicked', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);
		const app = mount(ToastContainer, { target: host });

		toastStore.show('Notice message', 0);
		flushSync();
		expect(toastStore.toasts).toHaveLength(1);

		const closeButton = host.querySelector<HTMLButtonElement>('.toast-close');
		closeButton?.click();
		flushSync();

		expect(toastStore.toasts).toHaveLength(0);

		unmount(app);
		host.remove();
	});
});
