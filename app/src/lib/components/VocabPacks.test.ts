// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import VocabPacks from './VocabPacks.svelte';

let instance: ReturnType<typeof mount> | undefined;

afterEach(() => {
	if (instance) unmount(instance);
	instance = undefined;
	document.body.innerHTML = '';
});

function render(props: Parameters<typeof VocabPacks>[1]) {
	instance = mount(VocabPacks, { target: document.body, props });
	flushSync();
	return document.body;
}

describe('VocabPacks', () => {
	it('renders locked pack buttons with descriptive aria-label', () => {
		const packs = [
			{
				id: 'vocab-nouns',
				label: 'Basic Nouns',
				unlocked: false,
				mature: 0,
				young: 0,
				seen: 0,
				unseen: 40,
				size: 40
			}
		];

		const root = render({ packs, ready: true, openable: true });
		const button = root.querySelector<HTMLButtonElement>('.open-pack');
		expect(button).not.toBeNull();
		expect(button?.getAttribute('aria-label')).toBe('Open Basic Nouns pack (40 cards)');
	});
});
