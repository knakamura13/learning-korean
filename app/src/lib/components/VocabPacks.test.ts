/**
 * @vitest-environment jsdom
 */
import { mount, unmount } from 'svelte';
import { describe, expect, it } from 'vitest';
import VocabPacks from './VocabPacks.svelte';

describe('VocabPacks', () => {
	it('renders empty message when openable is false', () => {
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

		expect(host.textContent).toContain('Word packs open after Lab 05');

		unmount(app);
		host.remove();
	});

	it('renders unlocked packs with segment tooltips and legend', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);
		const samplePacks = [
			{
				id: 'vocab1',
				label: 'Core 100',
				size: 100,
				seen: 80,
				mature: 50,
				young: 30,
				unseen: 20,
				unlocked: true,
				due: 0
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

		const matureSpan = host.querySelector('.m');
		const youngSpan = host.querySelector('.y');
		const unseenSpan = host.querySelector('.n');

		expect(matureSpan?.getAttribute('title')).toBe('50 mastered (50%)');
		expect(youngSpan?.getAttribute('title')).toBe('30 learning (30%)');
		expect(unseenSpan?.getAttribute('title')).toBe('20 not started (20%)');

		const legend = host.querySelector('.legend');
		expect(legend).not.toBeNull();
		expect(legend?.textContent).toContain('mastered');
		expect(legend?.textContent).toContain('learning');
		expect(legend?.textContent).toContain('not started');

		unmount(app);
		host.remove();
	});

	it('renders open button for locked packs', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);
		const samplePacks = [
			{
				id: 'vocab2',
				label: 'Core 300',
				size: 200,
				seen: 0,
				mature: 0,
				young: 0,
				unseen: 200,
				unlocked: false,
				due: 0
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

		const openBtn = host.querySelector('button.open-pack');
		expect(openBtn).not.toBeNull();
		expect(openBtn?.textContent).toContain('Open · 200 cards');

		unmount(app);
		host.remove();
	});
});
