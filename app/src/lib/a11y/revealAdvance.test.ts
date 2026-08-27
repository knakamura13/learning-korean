/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { revealAdvanceIntoView, shouldRevealAdvance } from './revealAdvance';

function nodeAt(bottom: number, parent: HTMLElement | null = null): HTMLElement {
	return {
		parentElement: parent,
		getBoundingClientRect: () => ({
			top: bottom - 120,
			bottom,
			left: 0,
			right: 320,
			width: 320,
			height: 120,
			x: 0,
			y: bottom - 120,
			toJSON: () => ({})
		})
	} as unknown as HTMLElement;
}

describe('shouldRevealAdvance', () => {
	it('reveals only after a correct settle — not after a miss', () => {
		expect(shouldRevealAdvance(true, 'right')).toBe(true);
		expect(shouldRevealAdvance(true, 'wrong')).toBe(false);
		expect(shouldRevealAdvance(false, 'wrong')).toBe(false);
		expect(shouldRevealAdvance(false, 'right')).toBe(false);
		expect(shouldRevealAdvance(true, undefined)).toBe(false);
	});
});

describe('revealAdvanceIntoView', () => {
	beforeEach(() => {
		vi.stubGlobal('scrollTo', vi.fn());
		vi.stubGlobal('scrollY', 100);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('does nothing when there is no node', () => {
		expect(() => revealAdvanceIntoView(null)).not.toThrow();
	});

	it('does not scroll when the advance block is already fully in view with extra padding', () => {
		const node = nodeAt(500);
		revealAdvanceIntoView(node, { viewportBottom: 700 });
		expect(window.scrollTo).not.toHaveBeenCalled();
	});

	it('scrolls when the block is tight against the viewport edge (lacking padding)', () => {
		const node = nodeAt(680);
		revealAdvanceIntoView(node, { viewportBottom: 700 });
		expect(window.scrollTo).toHaveBeenCalledWith({
			top: 100 + (680 + 32 - 700),
			behavior: 'smooth'
		});
	});

	it('scrolls the window past the block bottom plus padding when it sits below the fold', () => {
		const node = nodeAt(900);
		revealAdvanceIntoView(node, { viewportBottom: 700 });
		expect(window.scrollTo).toHaveBeenCalledWith({
			top: 100 + (900 + 32 - 700),
			behavior: 'smooth'
		});
	});

	it('uses instant scrolling when the learner prefers reduced motion', () => {
		const node = nodeAt(900);
		revealAdvanceIntoView(node, { viewportBottom: 700, prefersReducedMotion: true });
		expect(window.scrollTo).toHaveBeenCalledWith({
			top: 100 + (900 + 32 - 700),
			behavior: 'auto'
		});
	});

	it('scrolls a scrollable parent container instead of window when inside one', () => {
		const container = document.createElement('div');
		Object.defineProperty(container, 'scrollHeight', { value: 1000, configurable: true });
		Object.defineProperty(container, 'clientHeight', { value: 500, configurable: true });
		container.getBoundingClientRect = () => ({ top: 0, bottom: 500, left: 0, right: 300, width: 300, height: 500, x: 0, y: 0, toJSON: () => ({}) });
		const scrollBy = vi.fn();
		container.scrollBy = scrollBy;

		vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
			if (el === container) return { overflowY: 'auto' } as CSSStyleDeclaration;
			return {} as CSSStyleDeclaration;
		});

		const child = document.createElement('div');
		child.getBoundingClientRect = () => ({ top: 400, bottom: 680, left: 0, right: 300, width: 300, height: 280, x: 0, y: 400, toJSON: () => ({}) });
		container.appendChild(child);
		document.body.appendChild(container);

		revealAdvanceIntoView(child, { viewportBottom: 700 });

		expect(scrollBy).toHaveBeenCalledWith({
			top: 680 + 32 - 500,
			behavior: 'smooth'
		});
		expect(window.scrollTo).not.toHaveBeenCalled();
		document.body.removeChild(container);
	});
});
