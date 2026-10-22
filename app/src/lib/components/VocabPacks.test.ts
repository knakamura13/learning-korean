/**
 * @vitest-environment jsdom
 */
import { mount, unmount } from 'svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import VocabPacks from './VocabPacks.svelte';
import { toastStore } from '$lib/stores/toast.svelte';

describe('VocabPacks', () => {
	beforeEach(() => {
		toastStore.clear();
	});

	it('renders locked pack with descriptive aria-label on the Open button', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);

		const packs = [
			{
				id: 'vocab01',
				label: 'Basic Words',
				unlocked: false,
				mature: 0,
				young: 0,
				unseen: 25,
				size: 25,
				seen: 0
			}
		];

		const app = mount(VocabPacks, {
			target: host,
			props: { packs, ready: true, openable: true }
		});

		const button = host.querySelector('button.open-pack');
		expect(button).not.toBeNull();
		expect(button?.getAttribute('aria-label')).toBe('Open Basic Words pack (25 cards)');

		unmount(app);
		host.remove();
	});

	it('triggers toast notification when opening a pack', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);

		const packs = [
			{
				id: 'vocab01',
				label: 'Basic Words',
				unlocked: false,
				mature: 0,
				young: 0,
				unseen: 25,
				size: 25,
				seen: 0
			}
		];

		const app = mount(VocabPacks, {
			target: host,
			props: { packs, ready: true, openable: true }
		});

		const button = host.querySelector('button.open-pack') as HTMLButtonElement;
		button.click();

		expect(toastStore.toasts).toHaveLength(1);
		expect(toastStore.toasts[0].message).toBe('Unlocked Basic Words pack');

		unmount(app);
		host.remove();
	});
});
