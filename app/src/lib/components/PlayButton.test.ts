/**
 * @vitest-environment jsdom
 */
import { mount, unmount } from 'svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import { letterAudioSources } from '$lib/audio/letters';
import PlayButton from './PlayButton.svelte';
import playButtonSrc from './PlayButton.svelte?raw';

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

	it('mirrors the recording gate: no control until the clip is ingested', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);
		const app = mount(PlayButton, {
			target: host,
			props: { jamo: 'ㅏ', audioSlot: 'vowel' }
		});
		if (letterAudioSources('ㅏ', 'vowel') === null) {
			expect(host.querySelector('button')).toBeNull();
		} else {
			expect(host.querySelector('button')).not.toBeNull();
			expect(host.querySelectorAll('source').length).toBe(2);
		}
		unmount(app);
		host.remove();
	});

	it('still renders a control when given an explicit src override', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);
		const app = mount(PlayButton, {
			target: host,
			props: { jamo: 'ㅏ', audioSlot: 'vowel', src: '/audio/vowels/a.opus' }
		});
		expect(host.querySelector('button')).not.toBeNull();
		expect(host.querySelectorAll('source').length).toBe(2);
		unmount(app);
		host.remove();
	});

	it('keys the clip by jamo as well as codec URLs so shared finals remount', () => {
		expect(playButtonSrc).toMatch(/\{#key [^}\n]*jamo/);
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
