// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { LOOKS, PAPER_LIGHT } from '$lib/theme';
import SettingsPage from './+page.svelte';
import src from './+page.svelte?raw';
import layout from '../+layout.svelte?raw';
import review from '../review/+page.svelte?raw';

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
		expect(root.querySelector('.appearance h2')?.textContent?.trim()).toBe('Appearance');
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

describe('Settings page — Backup', () => {
	it('exposes #backup with Backup heading, note copy, and ProgressBackup — not a details fold', () => {
		expect(src).toMatch(/id="backup"/);
		expect(src).toMatch(/<h2[^>]*>Backup<\/h2>/);
		expect(src).toMatch(/ProgressBackup/);
		expect(src).toMatch(/wrapExport\(progress\.export\(\), labSession\.snapshot\)/);
		expect(src).toMatch(/unwrapImport/);
		expect(src).toMatch(/labSession\.replaceAll/);
		expect(src).toMatch(/Your progress lives only in this browser/);
		expect(src).toMatch(/as a precaution\./);
		expect(src).toMatch(/right now, since this browser will not keep it for you\./);
		expect(src).toMatch(/Saved progress could not be read/);
		expect(src).toMatch(/This browser did not save your look or color\./);
		expect(src).not.toMatch(/<details/);
		expect(src).not.toMatch(/backup-fold/);
		expect(src).not.toMatch(/progress-backup/);
		expect(src).toMatch(
			/#backup\s*\{[^}]*scroll-margin-top:\s*calc\(44px \+ env\(safe-area-inset-top\) \+ 0\.75rem\)/s
		);

		const root = render();
		const section = root.querySelector('#backup');
		expect(section).toBeTruthy();
		expect(section?.querySelector('h2')?.textContent?.trim()).toBe('Backup');
		expect(section?.querySelector('.backup-note')).toBeTruthy();
	});

	it('importJson does not apply look or theme from the backup file', () => {
		const importBody = src.match(/function importJson\([\s\S]*?\n\t\}/)?.[0] ?? '';
		expect(importBody).toMatch(/unwrapImport/);
		expect(importBody).not.toMatch(/writeLookId/);
		expect(importBody).not.toMatch(/writeThemePref/);
		expect(importBody).not.toMatch(/applyLook/);
	});

	it('appends the persist-fail sentence to the Backup note when look write fails', () => {
		const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string) => {
			if (key === 'korean-look') throw new Error('quota');
		});

		const root = render();
		selectRadio(root, 'look', 'taegeuk');

		const note = root.querySelector('.backup-note');
		expect(note?.textContent).toContain('This browser did not save your look or color.');
		setItem.mockRestore();
	});
});

describe('Settings backup deep link — layout and Review', () => {
	it('layout no longer mounts SiteFooter', () => {
		expect(layout).not.toMatch(/SiteFooter/);
	});

	it('Review storage warnings deep-link to Settings #backup', () => {
		expect(review).toMatch(/href="\{resolve\('\/settings'\)\}#backup"/);
		expect(review).not.toMatch(/#progress-backup/);
		expect(review).toMatch(/Download a backup/);
		expect(review).not.toMatch(/ProgressBackup/);
	});
});
