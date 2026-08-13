const SHORTCUT_GUARD = 'a, button, input, textarea, select, [role="button"]';

/** True when a window shortcut would steal keys from the focused control. */
export function shouldIgnoreShortcut(target: EventTarget | null): boolean {
	if (!(target instanceof Element)) return false;
	return target.closest(SHORTCUT_GUARD) !== null;
}
