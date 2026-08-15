/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest';
import {
	focusWhen,
	shouldIgnoreArrowNav,
	shouldIgnoreShortcut
} from './shortcuts';

describe('focusWhen', () => {
	it('focuses the node when active, without scrolling when asked', () => {
		const focus = vi.fn();
		const node = { focus } as unknown as HTMLElement;
		focusWhen(node, { active: true, preventScroll: true });
		expect(focus).toHaveBeenCalledWith({ preventScroll: true });
	});

	it('does not focus when inactive', () => {
		const focus = vi.fn();
		const node = { focus } as unknown as HTMLElement;
		focusWhen(node, false);
		expect(focus).not.toHaveBeenCalled();
	});
});

describe('shortcuts guards', () => {
	it('ignores shortcuts when focused on enabled inputs or buttons', () => {
		const button = document.createElement('button');
		document.body.appendChild(button);
		expect(shouldIgnoreShortcut(button)).toBe(true);

		const disabledButton = document.createElement('button');
		disabledButton.disabled = true;
		document.body.appendChild(disabledButton);
		expect(shouldIgnoreShortcut(disabledButton)).toBe(false);

		button.remove();
		disabledButton.remove();
	});

	it('distinguishes editable typing targets from controls during arrow navigation', () => {
		const input = document.createElement('input');
		document.body.appendChild(input);
		expect(shouldIgnoreArrowNav(input)).toBe(true);

		input.disabled = true;
		expect(shouldIgnoreArrowNav(input)).toBe(false);

		const button = document.createElement('button');
		document.body.appendChild(button);
		expect(shouldIgnoreArrowNav(button)).toBe(false);

		input.remove();
		button.remove();
	});
});
