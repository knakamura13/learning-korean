/**
 * @vitest-environment jsdom
 */
import { mount, unmount } from 'svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import PlayButton from './PlayButton.svelte';

beforeEach(() => {
	HTMLMediaElement.prototype.pause = () => {};
});

describe('PlayButton', () => {
	it('does not render a lead control for a vowel glyph', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);
		const app = mount(PlayButton, {
			target: host,
			props: { jamo: 'ㅏ', audioSlot: 'lead' }
		});
		expect(host.querySelector('button')).toBeNull();
		unmount(app);
		host.remove();
	});

	it('renders a control for a vowel in the vowel slot', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);
		const app = mount(PlayButton, {
			target: host,
			props: { jamo: 'ㅏ', audioSlot: 'vowel' }
		});
		expect(host.querySelector('button')).not.toBeNull();
		expect(host.querySelectorAll('source').length).toBe(2);
		unmount(app);
		host.remove();
	});

	it('does not render when an explicit src is missing', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);
		const app = mount(PlayButton, {
			target: host,
			props: { jamo: 'ㄱ', audioSlot: 'lead', src: null }
		});
		expect(host.querySelector('button')).toBeNull();
		unmount(app);
		host.remove();
	});
});
