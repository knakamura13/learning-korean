/**
 * @vitest-environment jsdom
 */
import { flushSync, mount, unmount } from 'svelte';
import { describe, expect, it } from 'vitest';
import VocabPacks from './VocabPacks.svelte';

describe('VocabPacks', () => {
	it('shows loading message when not ready', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);

		const app = mount(VocabPacks, {
			target: host,
			props: {
				packs: [],
				ready: false,
				openable: false
			}
		});

		expect(host.textContent).toMatch(/Loading packs…/);

		unmount(app);
		host.remove();
	});

	it('shows lab 05 requirement copy when not openable', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);

		const app = mount(VocabPacks, {
			target: host,
			props: {
				packs: [],
				ready: true,
				openable: false
			}
		});

		expect(host.textContent).toMatch(/Word packs open after Lab 05/);

		unmount(app);
		host.remove();
	});

	it('renders pack list and descriptive aria-label on locked pack buttons when openable', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);

		const samplePacks = [
			{
				id: 'vocab-food',
				label: 'Food & menus',
				size: 15,
				seen: 0,
				mature: 0,
				young: 0,
				unseen: 15,
				unlocked: false
			},
			{
				id: 'vocab-names',
				label: 'Names & people',
				size: 10,
				seen: 7,
				mature: 5,
				young: 2,
				unseen: 3,
				unlocked: true
			}
		];

		const app = mount(VocabPacks, {
			target: host,
			props: {
				packs: samplePacks,
				ready: true,
				openable: true
			}
		});

		flushSync();

		const openBtn = host.querySelector<HTMLButtonElement>('button.open-pack');
		expect(openBtn).not.toBeNull();
		expect(openBtn!.getAttribute('aria-label')).toBe('Open Food & menus pack (15 cards)');

		unmount(app);
		host.remove();
	});
});
