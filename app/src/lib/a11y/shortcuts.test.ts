/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest';
import {
	focusWhen,
	shouldAdvanceOnEnter,
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

	it('keeps all four arrows for an enabled radio chip, so a Tray can rove between them', () => {
		const group = document.createElement('div');
		group.setAttribute('role', 'radiogroup');
		const radio = document.createElement('button');
		radio.setAttribute('role', 'radio');
		group.appendChild(radio);
		document.body.appendChild(group);

		expect(shouldIgnoreArrowNav(radio)).toBe(true);

		radio.disabled = true;
		expect(shouldIgnoreArrowNav(radio)).toBe(false);

		group.remove();
	});

	it('keeps arrows for an enabled control on the vowel dock board', () => {
		const board = document.createElement('div');
		board.setAttribute('data-dock-board', '');
		const dock = document.createElement('button');
		board.appendChild(dock);
		document.body.appendChild(board);

		expect(shouldIgnoreArrowNav(dock)).toBe(true);

		dock.disabled = true;
		expect(shouldIgnoreArrowNav(dock)).toBe(false);

		board.remove();
	});

	it('does not advance on an Enter the dock already handled', () => {
		const dock = document.createElement('button');
		dock.disabled = true;
		document.body.appendChild(dock);

		const handled = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
		Object.defineProperty(handled, 'target', { value: dock });
		handled.preventDefault();
		expect(shouldAdvanceOnEnter(handled, true)).toBe(false);

		const leftover = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
		Object.defineProperty(leftover, 'target', { value: dock });
		expect(shouldAdvanceOnEnter(leftover, true)).toBe(true);

		expect(shouldAdvanceOnEnter(leftover, false)).toBe(false);

		dock.remove();
	});
});
