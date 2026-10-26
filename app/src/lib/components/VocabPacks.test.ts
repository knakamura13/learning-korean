/**
 * @vitest-environment jsdom
 */
import { mount, unmount } from 'svelte';
import { describe, expect, it } from 'vitest';
import VocabPacks from './VocabPacks.svelte';

describe('VocabPacks', () => {
	it('renders track tooltips and status legend for unlocked packs', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);

		const packs = [
			{
				id: 'pack-1',
				label: 'Core Words',
				unlocked: true,
				mature: 5,
				young: 3,
				seen: 8,
				unseen: 2,
				size: 10
			}
		];

		const app = mount(VocabPacks, {
			target: host,
			props: { packs, ready: true, openable: true }
		});

		const matureSpan = host.querySelector('.track .m');
		expect(matureSpan).not.toBeNull();
		expect(matureSpan!.getAttribute('title')).toBe('5 mastered (50%)');

		const youngSpan = host.querySelector('.track .y');
		expect(youngSpan).not.toBeNull();
		expect(youngSpan!.getAttribute('title')).toBe('3 learning (30%)');

		const unseenSpan = host.querySelector('.track .n');
		expect(unseenSpan).not.toBeNull();
		expect(unseenSpan!.getAttribute('title')).toBe('2 not started (20%)');

		const legend = host.querySelector('.legend');
		expect(legend).not.toBeNull();
		expect(legend!.textContent).toMatch(/mastered \(21\+ day gap\)/);
		expect(legend!.textContent).toMatch(/learning/);
		expect(legend!.textContent).toMatch(/not started/);

		unmount(app);
		host.remove();
	});
});
