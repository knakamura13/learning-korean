/**
 * Scroll the Yes / Next block into view after a correct settle.
 * Wrong answers leave the viewport alone so the learner can re-read the prompt.
 */

import { tick } from 'svelte';

export function shouldRevealAdvance(
	settled: boolean,
	tone: 'right' | 'wrong' | undefined
): boolean {
	return settled && tone === 'right';
}

export type RevealAdvanceOptions = {
	viewportBottom?: number;
	prefersReducedMotion?: boolean;
};

function viewportBottom(): number {
	const visual = typeof window !== 'undefined' ? window.visualViewport : null;
	if (visual) return visual.offsetTop + visual.height;
	return typeof window !== 'undefined' ? window.innerHeight : 0;
}

function prefersReducedMotion(): boolean {
	return (
		typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
	);
}

export function revealAdvanceIntoView(
	node: HTMLElement | null | undefined,
	options: RevealAdvanceOptions = {}
): void {
	if (!node) return;
	const bottom = options.viewportBottom ?? viewportBottom();
	const slack = 12;
	if (node.getBoundingClientRect().bottom <= bottom - slack) return;
	const reduce = options.prefersReducedMotion ?? prefersReducedMotion();
	node.scrollIntoView({
		behavior: reduce ? 'auto' : 'smooth',
		block: 'end',
		inline: 'nearest'
	});
}

/** Svelte action: reveal on mount (and if `shouldReveal` later becomes true). */
export function revealAdvance(node: HTMLElement, shouldReveal: boolean) {
	function apply(on: boolean) {
		if (!on) return;
		void tick().then(() => revealAdvanceIntoView(node));
	}
	apply(shouldReveal);
	return {
		update(on: boolean) {
			apply(on);
		}
	};
}
