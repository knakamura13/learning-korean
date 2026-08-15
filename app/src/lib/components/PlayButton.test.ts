/**
 * @vitest-environment jsdom
 */
import { mount, unmount } from 'svelte';
import { describe, expect, it } from 'vitest';
import PlayButton from './PlayButton.svelte';

describe('PlayButton', () => {
	it('does not render a control when the jamo has no clip', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);
		const app = mount(PlayButton, { target: host, props: { jamo: 'ㅏ' } });
		expect(host.querySelector('button')).toBeNull();
		expect(host.querySelector('audio')).toBeNull();
		unmount(app);
		host.remove();
	});

	it('does not render when an explicit src is missing', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);
		const app = mount(PlayButton, {
			target: host,
			props: { jamo: 'ㄱ', src: null }
		});
		expect(host.querySelector('button')).toBeNull();
		unmount(app);
		host.remove();
	});
});
