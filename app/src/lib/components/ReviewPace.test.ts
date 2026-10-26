// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import ReviewPace from './ReviewPace.svelte';
import { session } from '$lib/stores/session.svelte';

let instance: ReturnType<typeof mount> | undefined;

function render() {
	instance = mount(ReviewPace, { target: document.body, props: {} });
	flushSync();
	return document.body;
}

beforeEach(() => {
	vi.spyOn(session, 'status', 'get').mockReturnValue('signed-in');
});

afterEach(() => {
	if (instance) unmount(instance);
	instance = undefined;
	document.body.innerHTML = '';
	vi.restoreAllMocks();
});

describe('ReviewPace', () => {
	it('renders inputs and submit button when signed in', () => {
		const root = render();
		const form = root.querySelector('form.prefs');
		expect(form).toBeTruthy();
		const inputs = root.querySelectorAll<HTMLInputElement>('.fields input');
		expect(inputs).toHaveLength(2);
		expect(inputs[0].disabled).toBe(false);
		expect(inputs[1].disabled).toBe(false);
		const btn = root.querySelector<HTMLButtonElement>('button[type="submit"]');
		expect(btn?.textContent?.trim()).toBe('Save study pace');
		expect(btn?.disabled).toBe(false);
	});

	it('disables inputs and shows Saving… during save operation', async () => {
		let resolveSave: (value: boolean) => void = () => {};
		const savePromise = new Promise<boolean>((resolve) => {
			resolveSave = resolve;
		});
		vi.spyOn(session, 'savePrefs').mockReturnValue(savePromise);

		const root = render();
		const form = root.querySelector<HTMLFormElement>('form.prefs')!;

		form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
		flushSync();

		const inputs = root.querySelectorAll<HTMLInputElement>('.fields input');
		expect(inputs[0].disabled).toBe(true);
		expect(inputs[1].disabled).toBe(true);

		const btn = root.querySelector<HTMLButtonElement>('button[type="submit"]');
		expect(btn?.disabled).toBe(true);
		expect(btn?.textContent?.trim()).toBe('Saving…');

		resolveSave(true);
		await savePromise;
		await Promise.resolve();
		flushSync();

		expect(inputs[0].disabled).toBe(false);
		expect(inputs[1].disabled).toBe(false);
		expect(btn?.disabled).toBe(false);
		expect(btn?.textContent?.trim()).toBe('Save study pace');
	});
});
