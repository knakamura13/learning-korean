/**
 * @vitest-environment jsdom
 */
import { flushSync, mount, unmount } from 'svelte';
import { describe, expect, it } from 'vitest';
import VocabPacks from './VocabPacks.svelte';

describe('VocabPacks', () => {
	it('provides a descriptive aria-label on locked pack open buttons', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);

		const packs = [
			{
				id: 'numbers',
				label: 'Numbers',
				size: 20,
				unlocked: false,
				mature: 0,
				young: 0,
				unseen: 20,
				seen: 0
			},
			{
				id: 'greetings',
				label: 'Greetings',
				size: 15,
				unlocked: true,
				mature: 5,
				young: 5,
				unseen: 5,
				seen: 10
			}
		];

		const app = mount(VocabPacks, {
			target: host,
			props: {
				packs,
				ready: true,
				openable: true
			}
		});

		flushSync();

		const buttons = host.querySelectorAll<HTMLButtonElement>('button.open-pack');
		expect(buttons).toHaveLength(1);
		expect(buttons[0].getAttribute('aria-label')).toBe('Open Numbers pack (20 cards)');

		unmount(app);
		host.remove();
	});
});
