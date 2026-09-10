/**
 * @vitest-environment jsdom
 */
import { tick } from 'svelte';
import { flushSync, mount, unmount } from 'svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { session } from '$lib/stores/session.svelte';
import ReviewPace from './ReviewPace.svelte';

describe('ReviewPace', () => {
	beforeEach(() => {
		vi.spyOn(session, 'status', 'get').mockReturnValue('signed-in');
	});

	it('shows "Saving…" on the submit button while save is in progress', async () => {
		let resolveSave: (value: boolean) => void = () => {};
		const savePromise = new Promise<boolean>((resolve) => {
			resolveSave = resolve;
		});

		vi.spyOn(session, 'savePrefs').mockImplementation(() => savePromise);

		const host = document.createElement('div');
		document.body.appendChild(host);

		const app = mount(ReviewPace, {
			target: host,
			props: {}
		});

		flushSync();

		const submitBtn = host.querySelector<HTMLButtonElement>('button[type="submit"]');
		expect(submitBtn).not.toBeNull();
		expect(submitBtn?.textContent?.trim()).toBe('Save study pace');

		const form = host.querySelector('form');
		form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
		flushSync();

		expect(submitBtn?.disabled).toBe(true);
		expect(submitBtn?.textContent?.trim()).toBe('Saving…');

		resolveSave(true);
		await savePromise;
		await tick();
		flushSync();

		expect(submitBtn?.disabled).toBe(false);
		expect(submitBtn?.textContent?.trim()).toBe('Save study pace');

		unmount(app);
		host.remove();
	});
});
