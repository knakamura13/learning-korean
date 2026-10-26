/**
 * @vitest-environment jsdom
 */
import { mount, unmount } from 'svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FlagButton from './FlagButton.svelte';
import flagButtonRaw from './FlagButton.svelte?raw';
import { toastStore } from '$lib/stores/toast.svelte';

function styleBlock(markup: string): string {
	const match = markup.match(/<style>([\s\S]*?)<\/style>/);
	if (!match) throw new Error('FlagButton.svelte has no style block');
	return match[1];
}

describe('FlagButton', () => {
	beforeEach(() => {
		toastStore.clear();
	});

	it('renders bookmark button with inactive labels and title tooltip', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);
		const onclick = vi.fn();
		const app = mount(FlagButton, {
			target: host,
			props: { active: false, onclick }
		});

		const button = host.querySelector('button')!;
		expect(button).not.toBeNull();
		expect(button.getAttribute('aria-label')).toBe('Bookmark for review');
		expect(button.getAttribute('title')).toBe('Bookmark for review');
		expect(button.getAttribute('aria-pressed')).toBe('false');
		expect(button.querySelector('svg path')?.getAttribute('fill')).toBe('none');

		unmount(app);
		host.remove();
	});

	it('renders active bookmark button with removal labels and filled icon', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);
		const onclick = vi.fn();
		const app = mount(FlagButton, {
			target: host,
			props: { active: true, onclick }
		});

		const button = host.querySelector('button')!;
		expect(button).not.toBeNull();
		expect(button.getAttribute('aria-label')).toBe('Remove bookmark');
		expect(button.getAttribute('title')).toBe('Remove bookmark');
		expect(button.getAttribute('aria-pressed')).toBe('true');
		expect(button.querySelector('svg path')?.getAttribute('fill')).toBe('currentColor');

		unmount(app);
		host.remove();
	});

	it('triggers onclick and toast message on click', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);
		const onclick = vi.fn();
		const app = mount(FlagButton, {
			target: host,
			props: { active: false, onclick }
		});

		const button = host.querySelector('button')!;
		button.click();

		expect(onclick).toHaveBeenCalledOnce();
		expect(toastStore.toasts).toHaveLength(1);
		expect(toastStore.toasts[0].message).toBe('Bookmarked — cards added to Daily Review');

		unmount(app);
		host.remove();
	});

	it('has accessible focus-visible ring styles and forced-colors rules', () => {
		const css = styleBlock(flagButtonRaw);
		expect(css).toMatch(/\.flag-btn:focus-visible\s*\{[^}]*box-shadow:\s*var\(--focus-ring\)/s);
		expect(css).toMatch(/\.flag-btn:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--paper\)/s);
		expect(css).toMatch(/@media\s*\(forced-colors:\s*active\)/);
	});

	it('triggers removal toast message when unbookmarking active button', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);
		const onclick = vi.fn();
		const app = mount(FlagButton, {
			target: host,
			props: { active: true, onclick }
		});

		const button = host.querySelector('button')!;
		button.click();

		expect(onclick).toHaveBeenCalledOnce();
		expect(toastStore.toasts).toHaveLength(1);
		expect(toastStore.toasts[0].message).toBe('Bookmark removed');

		unmount(app);
		host.remove();
	});
});
