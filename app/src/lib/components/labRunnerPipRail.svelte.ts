/**
 * labRunnerPipRail.svelte.ts — keep the selected pip in view.
 *
 * Scroll math lives in pipRail.ts. This module is the attachment that
 * wires ResizeObserver / scroll / rAF to that math.
 */

import {
	pipRailCenteredScrollLeft,
	pipRailEdgeFades,
	pipRailMaxScroll,
	pipRailSnapScrollLeft
} from '$lib/domain/pipRail';

export function attachPipRail(
	getIndex: () => number,
	getFurthest: () => number,
	setFades: (left: boolean, right: boolean) => void
) {
	return (node: HTMLOListElement) => {
		function getMaxScroll(): number {
			const furthestIdx = getFurthest();
			const items = node.children;
			let furthestRightEdge: number | undefined;
			if (items.length > 0 && furthestIdx >= 0 && furthestIdx < items.length) {
				const item = items[furthestIdx] as HTMLElement;
				furthestRightEdge = item.offsetLeft + item.offsetWidth;
			}
			return pipRailMaxScroll(node.scrollWidth, node.clientWidth, furthestRightEdge);
		}

		function applyFades() {
			const max = getMaxScroll();
			if (node.scrollLeft > max) {
				node.scrollLeft = max;
			}
			const fades = pipRailEdgeFades(node.scrollLeft, max);
			setFades(fades.left, fades.right);
		}

		function scrollSelected() {
			const max = getMaxScroll();
			const pip = node.querySelector<HTMLElement>('[data-selected]');
			if (!pip) {
				if (node.scrollLeft > max) {
					node.scrollLeft = max;
				}
				applyFades();
				return;
			}
			const pipRect = pip.getBoundingClientRect();
			const railRect = node.getBoundingClientRect();
			const first = node.querySelector('li');
			const stride = first?.getBoundingClientRect().width ?? 0;
			const startPad = first?.offsetLeft ?? 0;
			node.scrollLeft = pipRailSnapScrollLeft(
				pipRailCenteredScrollLeft(
					pipRect.left,
					pipRect.width,
					railRect.left,
					railRect.width,
					node.scrollLeft,
					max
				),
				stride,
				max,
				startPad
			);
			applyFades();
		}

		$effect(() => {
			const ro =
				typeof ResizeObserver === 'function' ? new ResizeObserver(() => scrollSelected()) : null;
			ro?.observe(node);
			node.addEventListener('scroll', applyFades, { passive: true });
			return () => {
				ro?.disconnect();
				node.removeEventListener('scroll', applyFades);
			};
		});

		$effect(() => {
			void getIndex();
			const raf = requestAnimationFrame(() => scrollSelected());
			return () => cancelAnimationFrame(raf);
		});
	};
}
