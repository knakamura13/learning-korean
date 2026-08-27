/**
 * toast.svelte.ts — Simple reactive toast notification store.
 */

export interface ToastMessage {
	id: number;
	message: string;
}

let toasts = $state<ToastMessage[]>([]);
let nextId = 0;

export const toastStore = {
	get toasts() {
		return toasts;
	},
	show(message: string, duration = 3500) {
		const id = ++nextId;
		toasts = [...toasts, { id, message }];
		if (duration > 0) {
			setTimeout(() => {
				toasts = toasts.filter((t) => t.id !== id);
			}, duration);
		}
	},
	dismiss(id: number) {
		toasts = toasts.filter((t) => t.id !== id);
	},
	clear() {
		toasts = [];
	}
};
