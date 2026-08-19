// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { LOOK_KEY, LOOKS, PAPER_LIGHT, THEME_KEY } from '$lib/theme';
import LookPicker from './LookPicker.svelte';
import src from './LookPicker.svelte?raw';

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

function render(props: { onPersistFail?: () => void } = {}) {
	instance = mount(LookPicker, { target: document.body, props });
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

describe('LookPicker structure', () => {
	it('renders Look and Color fieldsets with locked catalog copy', () => {
		const root = render();

		expect(root.querySelector('fieldset legend')?.textContent).toMatch(/Look/);
		const legends = [...root.querySelectorAll('fieldset legend')].map((el) => el.textContent?.trim());
		expect(legends).toContain('Look');
		expect(legends).toContain('Color');

		const lookRadios = root.querySelectorAll<HTMLInputElement>('input[type="radio"][name="look"]');
		expect(lookRadios).toHaveLength(4);
		expect([...lookRadios].map((r) => r.value)).toEqual(LOOKS.map((l) => l.id));

		for (const system of LOOKS) {
			expect(root.textContent).toContain(system.name);
			expect(root.textContent).toContain(system.summary);
		}

		const colorRadios = root.querySelectorAll<HTMLInputElement>('input[type="radio"][name="color"]');
		expect([...colorRadios].map((r) => r.value)).toEqual(['light', 'dark', 'system']);
		expect(root.textContent).toMatch(/Light/);
		expect(root.textContent).toMatch(/Dark/);
		expect(root.textContent).toMatch(/System/);
	});

	it('defaults Botanical Korea look and System color when storage is empty', () => {
		const root = render();
		expect(root.querySelector<HTMLInputElement>('input[name="look"][value="botanicalKorea"]')?.checked).toBe(
			true
		);
		expect(root.querySelector<HTMLInputElement>('input[name="color"][value="system"]')?.checked).toBe(true);
	});

	it('keeps decorative chips aria-hidden and paints resolved palette tokens', () => {
		localStorage.setItem(THEME_KEY, 'dark');
		stubScheme(false);
		const root = render();

		const taegeuk = LOOKS.find((l) => l.id === 'taegeuk')!;
		const asCssColor = (hex: string) => {
			const probe = document.createElement('span');
			probe.style.background = hex;
			return probe.style.background;
		};
		const chips = root.querySelectorAll<HTMLElement>('[data-look-card="taegeuk"] [data-chip]');
		expect(chips).toHaveLength(4);
		for (const chip of chips) {
			expect(chip.getAttribute('aria-hidden')).toBe('true');
		}

		const byToken = (token: string) =>
			root.querySelector<HTMLElement>(`[data-look-card="taegeuk"] [data-chip="${token}"]`);
		expect(byToken('paper')?.style.background).toBe(asCssColor(taegeuk.dark.paper));
		expect(byToken('ink')?.style.background).toBe(asCssColor(taegeuk.dark.ink));
		expect(byToken('accent')?.style.background).toBe(asCssColor(taegeuk.dark.accent));
		expect(byToken('rose')?.style.background).toBe(asCssColor(taegeuk.dark.rose));
	});

	it('uses 44px hit targets, reduced-motion, and forced-colors chrome', () => {
		const css = src.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '';
		expect(css).toMatch(/min-width:\s*44px/);
		expect(css).toMatch(/min-height:\s*44px/);
		expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
		expect(css).toMatch(/@media\s*\(forced-colors:\s*active\)/);
		expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}/);
	});
});

describe('LookPicker selection', () => {
	it('paints then persists look on Taegeuk select', () => {
		const root = render();
		selectRadio(root, 'look', 'taegeuk');

		expect(document.documentElement.getAttribute('data-look')).toBe('taegeuk');
		expect(localStorage.getItem(LOOK_KEY)).toBe('taegeuk');
	});

	it('paints dark theme then persists; System clears data-theme', () => {
		const root = render();
		selectRadio(root, 'color', 'dark');
		expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
		expect(localStorage.getItem(THEME_KEY)).toBe('dark');

		selectRadio(root, 'color', 'system');
		expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
		expect(localStorage.getItem(THEME_KEY)).toBeNull();
	});

	it('calls onPersistFail when look write returns false', () => {
		const onPersistFail = vi.fn();
		const root = render({ onPersistFail });
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string) => {
			if (key === LOOK_KEY) throw new Error('quota');
		});

		selectRadio(root, 'look', 'watercolor');
		expect(document.documentElement.getAttribute('data-look')).toBe('watercolor');
		expect(onPersistFail).toHaveBeenCalledOnce();
	});

	it('calls onPersistFail when theme write returns false', () => {
		const onPersistFail = vi.fn();
		const root = render({ onPersistFail });
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string) => {
			if (key === THEME_KEY) throw new Error('quota');
		});

		selectRadio(root, 'color', 'light');
		expect(document.documentElement.getAttribute('data-theme')).toBe('light');
		expect(onPersistFail).toHaveBeenCalledOnce();
	});
});
