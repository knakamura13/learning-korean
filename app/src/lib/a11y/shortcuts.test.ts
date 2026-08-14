import { describe, expect, it, vi } from 'vitest';
import { focusWhen } from './shortcuts';

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
