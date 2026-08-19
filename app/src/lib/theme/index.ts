export type ThemePref = 'light' | 'dark' | 'system';

export { activeSystem } from './active';
export type { ContrastOverrides, DesignSystem, Palette, TypeStacks } from './types';
export { DEFAULT_LOOK_ID, isLookId, LOOKS, type LookId } from './catalog';
export { LOOK_KEY, paperFor, readLookId, writeLookId } from './look';

import { activeSystem } from './active';
import type { LookId } from './catalog';
import { paperFor, readLookId } from './look';

export const THEME_KEY = 'korean-theme';
export const PAPER_LIGHT = activeSystem.light.paper;
export const PAPER_DARK = activeSystem.dark.paper;

export function isThemePref(value: string | null): value is ThemePref {
	return value === 'light' || value === 'dark' || value === 'system';
}

export function readThemePref(): ThemePref {
	try {
		const value = localStorage.getItem(THEME_KEY);
		if (isThemePref(value)) return value;
	} catch {
		/* file:// or blocked storage */
	}
	return 'system';
}

export function writeThemePref(pref: ThemePref): boolean {
	try {
		if (pref === 'system') localStorage.removeItem(THEME_KEY);
		else localStorage.setItem(THEME_KEY, pref);
		return true;
	} catch {
		return false;
	}
}

export function systemPrefersDark(): boolean {
	return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
}

export function resolvedTheme(pref: ThemePref, prefersDark = systemPrefersDark()): 'light' | 'dark' {
	if (pref === 'system') return prefersDark ? 'dark' : 'light';
	return pref;
}

export function themePrefLabel(pref: ThemePref): string {
	switch (pref) {
		case 'light':
			return 'Light';
		case 'dark':
			return 'Dark';
		case 'system':
			return 'System';
		default: {
			const _exhaustive: never = pref;
			return _exhaustive;
		}
	}
}

export function applyTheme(pref: ThemePref, lookId: LookId = readLookId()): void {
	const root = document.documentElement;
	if (pref === 'light' || pref === 'dark') {
		root.setAttribute('data-theme', pref);
		root.style.colorScheme = pref;
	} else {
		root.removeAttribute('data-theme');
		root.style.colorScheme = '';
	}

	const color = paperFor(lookId, resolvedTheme(pref));
	const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"][data-resolved]');
	if (themeColor) themeColor.content = color;
	const scheme = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
	if (scheme) scheme.content = pref === 'system' ? 'light dark' : pref;
}

/** Paint the selected look onto the DOM. Does not touch localStorage. */
export function applyLook(id: LookId, pref: ThemePref = readThemePref()): void {
	document.documentElement.setAttribute('data-look', id);
	applyTheme(pref, id);
}
