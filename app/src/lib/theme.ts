export type ThemePref = 'light' | 'dark' | 'system';

export const THEME_KEY = 'korean-theme';
export const PAPER_LIGHT = '#fffef9';
export const PAPER_DARK = '#131316';

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

export function writeThemePref(pref: ThemePref): void {
	try {
		if (pref === 'system') localStorage.removeItem(THEME_KEY);
		else localStorage.setItem(THEME_KEY, pref);
	} catch {
		/* ignore */
	}
}

export function systemPrefersDark(): boolean {
	return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
}

export function resolvedTheme(pref: ThemePref, prefersDark = systemPrefersDark()): 'light' | 'dark' {
	if (pref === 'system') return prefersDark ? 'dark' : 'light';
	return pref;
}

/** Next value for the single-button theme control. */
export function nextThemePref(pref: ThemePref): ThemePref {
	switch (pref) {
		case 'light':
			return 'dark';
		case 'dark':
			return 'system';
		case 'system':
			return 'light';
		default: {
			const _exhaustive: never = pref;
			return _exhaustive;
		}
	}
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

export function applyTheme(pref: ThemePref): void {
	const root = document.documentElement;
	if (pref === 'light' || pref === 'dark') {
		root.setAttribute('data-theme', pref);
		root.style.colorScheme = pref;
	} else {
		root.removeAttribute('data-theme');
		root.style.colorScheme = '';
	}

	const color = resolvedTheme(pref) === 'dark' ? PAPER_DARK : PAPER_LIGHT;
	const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"][data-resolved]');
	if (themeColor) themeColor.content = color;
	const scheme = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
	if (scheme) scheme.content = pref === 'system' ? 'light dark' : pref;
}
