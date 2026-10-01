/**
 * @vitest-environment jsdom
 */
import { mount, unmount } from 'svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import VocabPacks from './VocabPacks.svelte';
import { toastStore } from '$lib/stores/toast.svelte';
import { progress } from '$lib/stores/progress.svelte';

describe('VocabPacks', () => {
	beforeEach(() => {
		toastStore.clear();
		progress.reset();
	});

	it('renders locked pack with descriptive ARIA label on open button', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);

		const packs = [
			{
				id: 'sino_numbers',
				label: 'Sino-Korean 0-10',
				size: 20,
				unlocked: false,
				mature: 0,
				young: 0,
				unseen: 20,
				seen: 0,
				due: 0
			}
		];

		const app = mount(VocabPacks, {
			target: host,
			props: { packs, ready: true, openable: true }
		});

		const button = host.querySelector<HTMLButtonElement>('.open-pack');
		expect(button).not.toBeNull();
		expect(button?.getAttribute('aria-label')).toBe('Open Sino-Korean 0-10 pack (20 cards)');

		unmount(app);
		host.remove();
	});

	it('unlocks pack and shows toast notification when open button is clicked', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);

		const packs = [
			{
				id: 'sino_numbers',
				label: 'Sino-Korean 0-10',
				size: 20,
				unlocked: false,
				mature: 0,
				young: 0,
				unseen: 20,
				seen: 0,
				due: 0
			}
		];

		const app = mount(VocabPacks, {
			target: host,
			props: { packs, ready: true, openable: true }
		});

		const button = host.querySelector<HTMLButtonElement>('.open-pack')!;
		button.click();

		expect(progress.isUnlocked('sino_numbers')).toBe(true);
		expect(toastStore.toasts).toHaveLength(1);
		expect(toastStore.toasts[0].message).toBe(
			'Sino-Korean 0-10 unlocked — cards added to Daily Review'
		);

		unmount(app);
		host.remove();
	});
});
