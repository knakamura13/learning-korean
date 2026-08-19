// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	isThemePref,
	PAPER_DARK,
	PAPER_LIGHT,
	resolvedTheme,
	subscribeSystemTheme,
	THEME_KEY,
	writeThemePref
} from './index';
import { activeSystem } from './active';
import { LOOK_KEY } from './look';
import { academia } from './systems/academia';
import layoutSrc from '../../routes/+layout.svelte?raw';

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

	it('returns false when removeItem throws for system', () => {
		localStorage.setItem(THEME_KEY, 'dark');
		vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
			throw new Error('blocked');
		});

		expect(writeThemePref('system')).toBe(false);
	});
});

describe('subscribeSystemTheme', () => {
	let changeHandler: (() => void) | null = null;
	let removeListener: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		localStorage.clear();
		changeHandler = null;
		removeListener = vi.fn();
		document.head.innerHTML = `
			<meta name="color-scheme" content="light dark" />
			<meta name="theme-color" content="${PAPER_LIGHT}" data-resolved />
		`;
		document.documentElement.removeAttribute('data-theme');
		document.documentElement.removeAttribute('data-look');
		vi.stubGlobal('matchMedia', (query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addEventListener: (_event: string, handler: () => void) => {
				changeHandler = handler;
			},
			removeEventListener: removeListener,
			dispatchEvent: vi.fn()
		}));
	});

	afterEach(() => {
		localStorage.clear();
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it('re-applies system theme-color when OS scheme flips and pref is system', () => {
		localStorage.setItem(LOOK_KEY, 'academia');
		const unsubscribe = subscribeSystemTheme();

		expect(changeHandler).toBeTypeOf('function');
		vi.stubGlobal('matchMedia', (query: string) => ({
			matches: query.includes('prefers-color-scheme: dark'),
			media: query,
			onchange: null,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn()
		}));

		changeHandler?.();

		const themeColor = document.querySelector<HTMLMetaElement>(
			'meta[name="theme-color"][data-resolved]'
		);
		expect(themeColor?.content).toBe(academia.dark.paper);

		unsubscribe();
		expect(removeListener).toHaveBeenCalled();
	});

	it('ignores OS flips when an explicit theme is stored', () => {
		localStorage.setItem(THEME_KEY, 'light');
		localStorage.setItem(LOOK_KEY, 'academia');
		subscribeSystemTheme();

		const before = document.querySelector<HTMLMetaElement>(
			'meta[name="theme-color"][data-resolved]'
		)?.content;

		vi.stubGlobal('matchMedia', (query: string) => ({
			matches: query.includes('prefers-color-scheme: dark'),
			media: query,
			onchange: null,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn()
		}));
		changeHandler?.();

		expect(
			document.querySelector<HTMLMetaElement>('meta[name="theme-color"][data-resolved]')?.content
		).toBe(before);
	});
});

describe('layout appearance reconciliation', () => {
	it('paints applyLook on mount and uses subscribeSystemTheme', () => {
		expect(layoutSrc).toMatch(/onMount\s*\(/);
		expect(layoutSrc).toMatch(/applyLook\s*\(\s*readLookId\s*\(\s*\)\s*,\s*readThemePref\s*\(\s*\)\s*\)/);
		expect(layoutSrc).toMatch(/subscribeSystemTheme\s*\(/);
	});
});
