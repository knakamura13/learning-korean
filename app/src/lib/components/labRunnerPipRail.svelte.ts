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
	setFades: (left: boolean, right: boolean) => void
) {
	return (node: HTMLOListElement) => {
		function applyFades() {
			const max = pipRailMaxScroll(node.scrollWidth, node.clientWidth);
			const fades = pipRailEdgeFades(node.scrollLeft, max);
			setFades(fades.left, fades.right);
		}

		function scrollSelected() {
			const pip = node.querySelector<HTMLElement>('[data-selected]');
			if (!pip) {
				applyFades();
				return;
			}
			const pipRect = pip.getBoundingClientRect();
			const railRect = node.getBoundingClientRect();
			const max = pipRailMaxScroll(node.scrollWidth, node.clientWidth);
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
