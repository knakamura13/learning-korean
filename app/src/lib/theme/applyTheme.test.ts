// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyTheme, PAPER_DARK, PAPER_LIGHT } from './index';

function stubScheme(prefersDark: boolean) {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: query.includes('prefers-color-scheme: dark') ? prefersDark : false,
		media: query,
		onchange: null,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	}));
}

describe('applyTheme theme-color', () => {
	beforeEach(() => {
		document.documentElement.removeAttribute('data-theme');
		document.documentElement.style.colorScheme = '';
		document.head.innerHTML = `
			<meta name="color-scheme" content="light dark" />
			<meta name="theme-color" content="${PAPER_LIGHT}" data-resolved />
		`;
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('writes dark paper onto the resolved tag for an explicit dark choice', () => {
		stubScheme(false);
		applyTheme('dark');
		const tag = document.querySelector('meta[name="theme-color"][data-resolved]');
		expect(tag?.getAttribute('content')).toBe(PAPER_DARK);
		expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
		expect(document.querySelector('meta[name="color-scheme"]')?.getAttribute('content')).toBe('dark');
	});

	it('writes light paper when the in-app choice is light even if the OS is dark', () => {
		stubScheme(true);
		applyTheme('light');
		const tag = document.querySelector('meta[name="theme-color"][data-resolved]');
		expect(tag?.getAttribute('content')).toBe(PAPER_LIGHT);
		expect(document.documentElement.getAttribute('data-theme')).toBe('light');
	});

	it('follows the OS when pref is system', () => {
		stubScheme(true);
		applyTheme('system');
		const tag = document.querySelector('meta[name="theme-color"][data-resolved]');
		expect(tag?.getAttribute('content')).toBe(PAPER_DARK);
		expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
		expect(document.querySelector('meta[name="color-scheme"]')?.getAttribute('content')).toBe(
			'light dark'
		);
	});
});
