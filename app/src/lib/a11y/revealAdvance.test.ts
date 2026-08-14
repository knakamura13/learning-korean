import { describe, expect, it, vi } from 'vitest';
import { revealAdvanceIntoView, shouldRevealAdvance } from './revealAdvance';

function nodeAt(bottom: number): HTMLElement {
	return {
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
		}),
		scrollIntoView: vi.fn()
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
	it('does nothing when there is no node', () => {
		expect(() => revealAdvanceIntoView(null)).not.toThrow();
	});

	it('does not scroll when the advance block is already fully in view', () => {
		const node = nodeAt(500);
		revealAdvanceIntoView(node, { viewportBottom: 700 });
		expect(node.scrollIntoView).not.toHaveBeenCalled();
	});

	it('scrolls when the block is in view but tight against the viewport edge', () => {
		const node = nodeAt(698);
		revealAdvanceIntoView(node, { viewportBottom: 700 });
		expect(node.scrollIntoView).toHaveBeenCalled();
	});

	it('scrolls the block to the end of the viewport when it sits below the fold', () => {
		const node = nodeAt(900);
		revealAdvanceIntoView(node, { viewportBottom: 700 });
		expect(node.scrollIntoView).toHaveBeenCalledWith({
			behavior: 'smooth',
			block: 'end',
			inline: 'nearest'
		});
	});

	it('uses instant scrolling when the learner prefers reduced motion', () => {
		const node = nodeAt(900);
		revealAdvanceIntoView(node, { viewportBottom: 700, prefersReducedMotion: true });
		expect(node.scrollIntoView).toHaveBeenCalledWith({
			behavior: 'auto',
			block: 'end',
			inline: 'nearest'
		});
	});
});
