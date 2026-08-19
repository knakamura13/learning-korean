/**
 * First keyboard landing in a lab well after the card changes.
 * Audio play buttons are supplementary, so they never win.
 */
const CANDIDATES = 'a[href], button, input:not([type="hidden"]), select, textarea, [tabindex]';
const SKIP_TREE = '[aria-hidden="true"], [hidden], [inert]';

export function firstWellControl(root: ParentNode | null | undefined): HTMLElement | null {
	if (!root) return null;
	for (const el of root.querySelectorAll<HTMLElement>(CANDIDATES)) {
		if (el.classList.contains('play')) continue;
		if (el.tabIndex < 0) continue;
		if (isDisabled(el)) continue;
		if (el.closest(SKIP_TREE)) continue;
		return el;
	}
	return null;
}

function isDisabled(el: HTMLElement): boolean {
	if (
		el instanceof HTMLButtonElement ||
		el instanceof HTMLInputElement ||
		el instanceof HTMLSelectElement ||
		el instanceof HTMLTextAreaElement
	) {
		return el.disabled;
	}
	return el.getAttribute('aria-disabled') === 'true';
}
