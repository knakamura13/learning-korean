import { describe, it, expect, beforeEach } from 'vitest';
import { toastStore } from './toast.svelte';

describe('toastStore', () => {
	beforeEach(() => {
		toastStore.clear();
	});

	it('starts with an empty toast list', () => {
		expect(toastStore.toasts).toEqual([]);
	});

	it('adds a toast message', () => {
		toastStore.show('Test toast message', 0);
		expect(toastStore.toasts).toHaveLength(1);
		expect(toastStore.toasts[0].message).toBe('Test toast message');
	});

	it('dismisses a toast message by id', () => {
		toastStore.show('Message 1', 0);
		toastStore.show('Message 2', 0);
		const id = toastStore.toasts[0].id;

		toastStore.dismiss(id);
		expect(toastStore.toasts).toHaveLength(1);
		expect(toastStore.toasts[0].message).toBe('Message 2');
	});

	it('clears all toast messages', () => {
		toastStore.show('Message 1', 0);
		toastStore.show('Message 2', 0);
		toastStore.clear();

		expect(toastStore.toasts).toEqual([]);
	});
});
