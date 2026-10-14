/**
 * @vitest-environment jsdom
 */
import { flushSync, mount, unmount } from 'svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import AudioClip from './AudioClip.svelte';

beforeEach(() => {
	HTMLMediaElement.prototype.pause = () => {};
});

describe('AudioClip', () => {
	it('keeps a disabled control after playback error', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);
		const app = mount(AudioClip, {
			target: host,
			props: {
				jamo: 'ㄱ',
				opus: '/audio/consonants/g.opus',
				mp3: '/audio/consonants/g.mp3'
			}
		});

		expect(host.querySelectorAll('source').length).toBe(2);
		const audio = host.querySelector('audio');
		expect(audio).not.toBeNull();
		audio!.dispatchEvent(new Event('error'));
		flushSync();

		const button = host.querySelector('button');
		expect(button).not.toBeNull();
		expect(button!.title).toBe("Couldn't play audio");
		expect(button!.getAttribute('aria-disabled')).toBe('true');
		expect(button!.textContent).toMatch(/Couldn't play/);
		expect(button!.querySelector('[lang="ko"]')?.textContent).toBe('ㄱ');
		expect(button!.getAttribute('aria-label')).toBeNull();

		unmount(app);
		host.remove();
	});

	it('provides a helpful tooltip title before playback', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);
		const app = mount(AudioClip, {
			target: host,
			props: {
				jamo: 'ㄴ',
				opus: '/audio/consonants/n.opus',
				mp3: '/audio/consonants/n.mp3'
			}
		});

		const button = host.querySelector('button');
		expect(button).not.toBeNull();
		expect(button!.title).toBe('Play audio');

		unmount(app);
		host.remove();
	});
});
