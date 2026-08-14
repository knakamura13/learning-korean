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
 * Only typing surfaces keep Left/Right.
 */
export function shouldIgnoreArrowNav(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	if (target.isContentEditable) return true;
	const field = target.closest('input, textarea');
	if (!(field instanceof HTMLInputElement) && !(field instanceof HTMLTextAreaElement)) {
		return false;
	}
	return !field.disabled && !field.readOnly;
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
