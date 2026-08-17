const SHORTCUT_GUARD = 'a, button, input, textarea, select, [role="button"]';

function isDisabledControl(el: Element): boolean {
	if (
		el instanceof HTMLButtonElement ||
		el instanceof HTMLInputElement ||
		el instanceof HTMLTextAreaElement ||
		el instanceof HTMLSelectElement
	) {
		return el.disabled;
	}
	return el.getAttribute('aria-disabled') === 'true' || el.hasAttribute('disabled');
}

/** True when a window shortcut would steal keys from the focused control. */
export function shouldIgnoreShortcut(target: EventTarget | null): boolean {
	if (!(target instanceof Element)) return false;
	const control = target.closest(SHORTCUT_GUARD);
	if (!control) return false;
	// Disabled controls cannot act on the key, so Enter/Space should still
	// advance after a lab/review settle (focus often remains on the control
	// just used). Enabled inputs keep their keys so typing is never stolen.
	if (isDisabledControl(control)) return false;
	return true;
}

/**
 * Arrow card-nav should still work when a pip or Next is focused.
 * Typing surfaces keep Left/Right, a `role="radio"` chip (Tray) keeps
 * all four arrows for the roving-tabindex pattern its group implements,
 * and vowel dock buttons keep arrows so they can move between docks —
 * without this, the global card-jump listener would fire on the same
 * keypress those widgets use to move.
 */
export function shouldIgnoreArrowNav(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	if (target.isContentEditable) return true;
	const radio = target.closest('[role="radio"]');
	if (radio) return !isDisabledControl(radio);
	const dockBoard = target.closest('[data-dock-board]');
	if (dockBoard) return !isDisabledControl(target);
	const field = target.closest('input, textarea');
	if (!(field instanceof HTMLInputElement) && !(field instanceof HTMLTextAreaElement)) {
		return false;
	}
	return !field.disabled && !field.readOnly;
}

/** Enter/Space after a settle advances — unless this key already did the settle. */
export function shouldAdvanceOnEnter(e: KeyboardEvent, settled: boolean): boolean {
	if (!settled) return false;
	if (e.defaultPrevented) return false;
	if (e.metaKey || e.ctrlKey || e.altKey) return false;
	if (e.key !== 'Enter' && e.key !== ' ') return false;
	return !shouldIgnoreShortcut(e.target);
}

export type FocusWhenParam = boolean | { active: boolean; preventScroll?: boolean };

/** Focus `node` when `active` is true, including on mount. */
export function focusWhen(node: HTMLElement, param: FocusWhenParam) {
	function apply(next: FocusWhenParam) {
		const active = typeof next === 'boolean' ? next : next.active;
		if (!active) return;
		const preventScroll = typeof next === 'object' && next.preventScroll === true;
		node.focus({ preventScroll });
	}
	apply(param);
	return {
		update(next: FocusWhenParam) {
			apply(next);
		}
	};
}
