// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount, tick } from 'svelte';
import { session } from '$lib/stores/session.svelte';
import ReviewPace from './ReviewPace.svelte';

let instance: ReturnType<typeof mount> | undefined;

function render() {
	instance = mount(ReviewPace, { target: document.body, props: {} });
	flushSync();
	return document.body;
}

afterEach(() => {
	if (instance) unmount(instance);
	instance = undefined;
	document.body.innerHTML = '';
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe('ReviewPace', () => {
	it('renders study pace form when signed in and handles save lifecycle', async () => {
		vi.spyOn(session, 'status', 'get').mockReturnValue('signed-in');

		const root = render();

		const heading = root.querySelector('#review-heading');
		expect(heading?.textContent).toBe('Review');

		const submitBtn = root.querySelector<HTMLButtonElement>('button[type="submit"]');
		expect(submitBtn).toBeTruthy();
		expect(submitBtn?.textContent?.trim()).toBe('Save study pace');
		expect(submitBtn?.disabled).toBe(false);

		let resolveSave: ((val: boolean) => void) | undefined;
		const savePromise = new Promise<boolean>((resolve) => {
			resolveSave = resolve;
		});

		vi.spyOn(session, 'savePrefs').mockImplementation(() => savePromise);

		const form = root.querySelector('form');
		expect(form).toBeTruthy();
		form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
		flushSync();

		// While save is in progress, the button should be disabled and show "Saving…"
		expect(submitBtn?.disabled).toBe(true);
		expect(submitBtn?.textContent?.trim()).toBe('Saving…');

		// Resolve the save operation and wait for microtasks/ticks
		resolveSave!(true);
		await savePromise;
		await tick();
		await new Promise((r) => setTimeout(r, 0));
		flushSync();

		// Once completed, button becomes enabled and returns to "Save study pace"
		expect(submitBtn?.disabled).toBe(false);
		expect(submitBtn?.textContent?.trim()).toBe('Save study pace');

		const status = root.querySelector('.status');
		expect(status?.getAttribute('data-tone')).toBe('right');
		expect(status?.textContent).toMatch(/saved/i);
	});
});
