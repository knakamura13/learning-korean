/**
 * Skip-to-content has to move keyboard focus into `<main>`, but a permanent
 * `tabindex="-1"` makes that landmark a click-focus target for the whole page.
 * Arm the target only while the skip link is used, then drop it on blur.
 */

export function armSkipLanding(el: HTMLElement): void {
	el.tabIndex = -1;
	el.dataset.skipLanded = '';
	el.focus();
}

export function disarmSkipLanding(el: HTMLElement): void {
	el.removeAttribute('tabindex');
	delete el.dataset.skipLanded;
}
