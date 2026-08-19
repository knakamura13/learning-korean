// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	isThemePref,
	PAPER_DARK,
	PAPER_LIGHT,
	resolvedTheme,
	THEME_KEY,
	writeThemePref
} from './index';
import { activeSystem } from './active';

describe('isThemePref', () => {
	it('accepts stored light and dark, and leftover system', () => {
		expect(isThemePref('light')).toBe(true);
		expect(isThemePref('dark')).toBe(true);
		expect(isThemePref('system')).toBe(true);
		expect(isThemePref('auto')).toBe(false);
		expect(isThemePref(null)).toBe(false);
	});
});

describe('resolvedTheme', () => {
	it('honors an explicit choice', () => {
		expect(resolvedTheme('light', true)).toBe('light');
		expect(resolvedTheme('dark', false)).toBe('dark');
	});

	it('follows the system flag when unset', () => {
		expect(resolvedTheme('system', true)).toBe('dark');
		expect(resolvedTheme('system', false)).toBe('light');
	});
});

describe('paper colours', () => {
	it('come from the active design system', () => {
		expect(PAPER_LIGHT).toBe(activeSystem.light.paper);
		expect(PAPER_DARK).toBe(activeSystem.dark.paper);
	});
});

describe('writeThemePref', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(() => {
		localStorage.clear();
		vi.restoreAllMocks();
	});

	it('persists dark under korean-theme', () => {
		expect(writeThemePref('dark')).toBe(true);
		expect(localStorage.getItem(THEME_KEY)).toBe('dark');
	});

	it('removes korean-theme when pref is system', () => {
		localStorage.setItem(THEME_KEY, 'dark');
		expect(writeThemePref('system')).toBe(true);
		expect(localStorage.getItem(THEME_KEY)).toBeNull();
	});

	it('returns false when setItem throws', () => {
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new Error('quota');
		});

		expect(writeThemePref('light')).toBe(false);
	});
});
