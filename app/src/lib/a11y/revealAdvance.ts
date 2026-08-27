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
	const padding = 32;
	const slack = 12;
	const rect = node.getBoundingClientRect();
	if (rect.bottom <= bottom - padding - slack) return;

	const reduce = options.prefersReducedMotion ?? prefersReducedMotion();

	// Check if node is inside a scrollable container (e.g. .spread-col on desktop wide layout)
	let container: HTMLElement | null = null;
	let parent = node.parentElement;
	while (parent && parent !== document.body && parent !== document.documentElement) {
		const overflowY = typeof window !== 'undefined' ? window.getComputedStyle(parent).overflowY : '';
		if ((overflowY === 'auto' || overflowY === 'scroll') && parent.scrollHeight > parent.clientHeight) {
			container = parent;
			break;
		}
		parent = parent.parentElement;
	}

	if (container) {
		const containerRect = container.getBoundingClientRect();
		const extra = rect.bottom + padding - containerRect.bottom;
		if (extra > 0) {
			container.scrollBy({
				top: extra,
				behavior: reduce ? 'auto' : 'smooth'
			});
		}
	} else if (typeof window !== 'undefined') {
		const targetScrollY = window.scrollY + (rect.bottom + padding - bottom);
		window.scrollTo({
			top: Math.max(0, targetScrollY),
			behavior: reduce ? 'auto' : 'smooth'
		});
	}
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
