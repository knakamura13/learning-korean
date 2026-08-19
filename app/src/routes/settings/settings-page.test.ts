// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { LOOKS, PAPER_LIGHT } from '$lib/theme';
import SettingsPage from './+page.svelte';
import src from './+page.svelte?raw';

let instance: ReturnType<typeof mount> | undefined;

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

function render() {
	instance = mount(SettingsPage, { target: document.body, props: {} });
	flushSync();
	return document.body;
}

function selectRadio(root: ParentNode, name: string, value: string) {
	const radio = root.querySelector<HTMLInputElement>(`input[type="radio"][name="${name}"][value="${value}"]`);
	if (!radio) throw new Error(`no radio ${name}=${value}`);
	radio.checked = true;
	radio.dispatchEvent(new Event('change', { bubbles: true }));
	flushSync();
}

beforeEach(() => {
	localStorage.clear();
	document.documentElement.removeAttribute('data-theme');
	document.documentElement.removeAttribute('data-look');
	document.documentElement.style.colorScheme = '';
	document.head.innerHTML = `
		<meta name="color-scheme" content="light dark" />
		<meta name="theme-color" content="${PAPER_LIGHT}" data-resolved />
	`;
	stubScheme(false);
});

afterEach(() => {
	if (instance) unmount(instance);
	instance = undefined;
	document.body.innerHTML = '';
	localStorage.clear();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe('Settings page — Appearance', () => {
	it('sets document title Settings and shows Appearance chrome', () => {
		expect(src).toMatch(/<title>Settings<\/title>/);
		expect(src).toMatch(/max-width:\s*var\(--shell\)/);
		expect(src).not.toMatch(/shell\.narrow|\.shell\.narrow|class="shell narrow"/);

		const root = render();
		expect(root.querySelector('h1')?.textContent?.trim()).toBe('Settings');
		expect(root.querySelector('h2')?.textContent?.trim()).toBe('Appearance');
		expect(root.querySelector('#backup')).toBeNull();
	});

	it('lists four locked look names and summaries plus Color radios', () => {
		const root = render();

		for (const system of LOOKS) {
			expect(root.textContent).toContain(system.name);
			expect(root.textContent).toContain(system.summary);
		}

		const lookRadios = root.querySelectorAll('input[type="radio"][name="look"]');
		expect(lookRadios).toHaveLength(4);
		expect(root.querySelector('input[name="color"][value="light"]')).toBeTruthy();
		expect(root.querySelector('input[name="color"][value="dark"]')).toBeTruthy();
		expect(root.querySelector('input[name="color"][value="system"]')).toBeTruthy();
	});

	it('clicking Taegeuk sets data-look; Dark then System toggles data-theme', () => {
		const root = render();

		selectRadio(root, 'look', 'taegeuk');
		expect(document.documentElement.dataset.look).toBe('taegeuk');

		selectRadio(root, 'color', 'dark');
		expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

		selectRadio(root, 'color', 'system');
		expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
	});
});
