// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_LOOK_ID, LOOK_IDS } from './catalog';
import { LOOK_KEY } from './look';
import { THEME_KEY } from './index';
import {
	applyAppearanceDom,
	resolveAppearanceBoot,
	themeBootScript,
	type AppearanceBootInput
} from './boot';

const testPapers: Record<string, { light: string; dark: string }> = {
	botanicalKorea: { light: '#faf5ee', dark: '#1a2420' },
	taegeuk: { light: '#fffef9', dark: '#131316' },
	watercolor: { light: '#f9f6f2', dark: '#1a1e26' },
	academia: { light: '#faf6ee', dark: '#2a1a0a' }
};

const knownLookIds = LOOK_IDS;

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

function setupDom() {
	document.documentElement.removeAttribute('data-look');
	document.documentElement.removeAttribute('data-theme');
	document.documentElement.style.colorScheme = '';
	document.head.innerHTML = `
		<meta name="color-scheme" content="light dark" />
		<meta name="theme-color" content="#placeholder" data-resolved />
		<link rel="manifest" href="/manifest.webmanifest" />
	`;
}

function runBootScript(
	look: string | null,
	theme: string | null,
	prefersDark: boolean
) {
	stubScheme(prefersDark);
	localStorage.clear();
	if (look !== null) localStorage.setItem(LOOK_KEY, look);
	if (theme !== null) localStorage.setItem(THEME_KEY, theme);

	const script = themeBootScript(testPapers);
	// eslint-disable-next-line no-eval
	expect(() => eval(script)).not.toThrow();
}

function expectDomMatchesResolver(
	input: Omit<AppearanceBootInput, 'knownLookIds'>,
	papers = testPapers
) {
	setupDom();
	const boot = resolveAppearanceBoot({ ...input, knownLookIds });
	const themeColor = document.querySelector<HTMLMetaElement>(
		'meta[name="theme-color"][data-resolved]'
	);
	const colorScheme = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
	applyAppearanceDom(document.documentElement, boot, papers, themeColor, colorScheme);

	const expectedLook = document.documentElement.getAttribute('data-look');
	const expectedTheme = document.documentElement.getAttribute('data-theme');
	const expectedPaper = themeColor?.getAttribute('content');
	const expectedScheme = colorScheme?.getAttribute('content');
	const expectedColorScheme = document.documentElement.style.colorScheme;
	const expectedManifest = document
		.querySelector('link[rel="manifest"]:not([media])')
		?.getAttribute('href');

	setupDom();
	runBootScript(input.look, input.theme, input.prefersDark);

	expect(document.documentElement.getAttribute('data-look')).toBe(expectedLook);
	expect(document.documentElement.getAttribute('data-theme')).toBe(expectedTheme);
	expect(document.documentElement.style.colorScheme).toBe(expectedColorScheme);
	expect(
		document.querySelector<HTMLMetaElement>('meta[name="theme-color"][data-resolved]')?.getAttribute(
			'content'
		)
	).toBe(expectedPaper);
	expect(document.querySelector('meta[name="color-scheme"]')?.getAttribute('content')).toBe(
		expectedScheme
	);
	expect(document.querySelector('link[rel="manifest"]:not([media])')?.getAttribute('href')).toBe(
		expectedManifest
	);
}

describe('resolveAppearanceBoot', () => {
	it('defaults look and follows system dark when look and theme are missing', () => {
		expect(
			resolveAppearanceBoot({
				look: null,
				theme: null,
				prefersDark: true,
				knownLookIds
			})
		).toEqual({
			look: DEFAULT_LOOK_ID,
			themeAttr: null,
			dark: true
		});
	});

	it('keeps taegeuk and explicit light even when OS prefers dark', () => {
		expect(
			resolveAppearanceBoot({
				look: 'taegeuk',
				theme: 'light',
				prefersDark: true,
				knownLookIds
			})
		).toEqual({
			look: 'taegeuk',
			themeAttr: 'light',
			dark: false
		});
	});

	it('falls back to botanicalKorea for unknown look without writing storage', () => {
		expect(
			resolveAppearanceBoot({
				look: 'nope',
				theme: null,
				prefersDark: false,
				knownLookIds
			})
		).toEqual({
			look: DEFAULT_LOOK_ID,
			themeAttr: null,
			dark: false
		});
	});

	it('treats auto theme as system (themeAttr null)', () => {
		expect(
			resolveAppearanceBoot({
				look: 'watercolor',
				theme: 'auto',
				prefersDark: true,
				knownLookIds
			})
		).toEqual({
			look: 'watercolor',
			themeAttr: null,
			dark: true
		});
	});
});

describe('applyAppearanceDom', () => {
	beforeEach(setupDom);

	it('sets theme-color from the resolved look and dark flag', () => {
		const boot = resolveAppearanceBoot({
			look: 'taegeuk',
			theme: 'dark',
			prefersDark: false,
			knownLookIds
		});
		const themeColor = document.querySelector<HTMLMetaElement>(
			'meta[name="theme-color"][data-resolved]'
		);
		const colorScheme = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');

		applyAppearanceDom(document.documentElement, boot, testPapers, themeColor, colorScheme);

		expect(document.documentElement.getAttribute('data-look')).toBe('taegeuk');
		expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
		expect(themeColor?.getAttribute('content')).toBe(testPapers.taegeuk.dark);
		expect(colorScheme?.getAttribute('content')).toBe('dark');
		expect(document.querySelector('link[rel="manifest"]:not([media])')?.getAttribute('href')).toBe(
			'/manifest-dark.webmanifest'
		);
	});

	it('restores the light manifest when appearance is light', () => {
		const boot = resolveAppearanceBoot({
			look: 'botanicalKorea',
			theme: 'light',
			prefersDark: true,
			knownLookIds
		});
		const themeColor = document.querySelector<HTMLMetaElement>(
			'meta[name="theme-color"][data-resolved]'
		);
		applyAppearanceDom(document.documentElement, boot, testPapers, themeColor, null);
		expect(document.querySelector('link[rel="manifest"]:not([media])')?.getAttribute('href')).toBe(
			'/manifest.webmanifest'
		);
	});
});

describe('themeBootScript', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		localStorage.clear();
	});

	it('matches resolveAppearanceBoot + applyAppearanceDom for missing look+theme with prefersDark', () => {
		expectDomMatchesResolver({ look: null, theme: null, prefersDark: true });
	});

	it('matches for taegeuk + light + prefersDark', () => {
		expectDomMatchesResolver({ look: 'taegeuk', theme: 'light', prefersDark: true });
	});

	it('matches for explicit dark theme and sets colorScheme', () => {
		expectDomMatchesResolver({ look: 'academia', theme: 'dark', prefersDark: false });
		expect(document.documentElement.style.colorScheme).toBe('dark');
	});

	it('matches for unknown look without rewriting storage', () => {
		setupDom();
		stubScheme(false);
		localStorage.setItem(LOOK_KEY, 'nope');
		const setItem = vi.spyOn(Storage.prototype, 'setItem');
		const removeItem = vi.spyOn(Storage.prototype, 'removeItem');

		const boot = resolveAppearanceBoot({
			look: 'nope',
			theme: null,
			prefersDark: false,
			knownLookIds
		});
		const themeColor = document.querySelector<HTMLMetaElement>(
			'meta[name="theme-color"][data-resolved]'
		);
		const colorScheme = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
		applyAppearanceDom(document.documentElement, boot, testPapers, themeColor, colorScheme);

		const expectedLook = document.documentElement.getAttribute('data-look');
		const expectedTheme = document.documentElement.getAttribute('data-theme');
		const expectedPaper = themeColor?.getAttribute('content');

		setupDom();
		const script = themeBootScript(testPapers);
		// eslint-disable-next-line no-eval
		eval(script);

		expect(document.documentElement.getAttribute('data-look')).toBe(expectedLook);
		expect(document.documentElement.getAttribute('data-theme')).toBe(expectedTheme);
		expect(
			document
				.querySelector<HTMLMetaElement>('meta[name="theme-color"][data-resolved]')
				?.getAttribute('content')
		).toBe(expectedPaper);
		expect(setItem).not.toHaveBeenCalled();
		expect(removeItem).not.toHaveBeenCalled();
		setItem.mockRestore();
		removeItem.mockRestore();
	});

	it('matches for auto theme (system)', () => {
		expectDomMatchesResolver({ look: 'watercolor', theme: 'auto', prefersDark: true });
	});

	it('paints defaults when getItem throws and does not throw', () => {
		setupDom();
		stubScheme(true);
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new Error('blocked');
		});

		const script = themeBootScript(testPapers);
		expect(() => {
			// eslint-disable-next-line no-eval
			eval(script);
		}).not.toThrow();

		expect(document.documentElement.getAttribute('data-look')).toBe(DEFAULT_LOOK_ID);
		expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
		expect(
			document
				.querySelector<HTMLMetaElement>('meta[name="theme-color"][data-resolved]')
				?.getAttribute('content')
		).toBe(testPapers.botanicalKorea.dark);
	});
});

describe('look font preloads', () => {
	// The getItem-throws test above leaves a Storage.prototype spy behind.
	beforeEach(() => {
		vi.restoreAllMocks();
	});
	afterEach(() => {
		vi.unstubAllGlobals();
		localStorage.clear();
	});

	const testFonts: Record<string, string[]> = {
		botanicalKorea: ['NotoSansKR-subset.woff2', 'Newsreader-Italic-latin.woff2'],
		watercolor: ['CormorantGaramond-Regular.woff2', 'NotoSansKR-subset.woff2']
	};

	function preloadHrefs(): string[] {
		return [...document.querySelectorAll<HTMLLinkElement>('link[rel="preload"][as="font"]')].map(
			(l) => l.getAttribute('href') ?? ''
		);
	}

	function bootWithFonts(look: string | null) {
		setupDom();
		stubScheme(false);
		localStorage.clear();
		if (look !== null) localStorage.setItem(LOOK_KEY, look);
		const script = themeBootScript(testPapers, testFonts);
		// eslint-disable-next-line no-eval
		expect(() => eval(script)).not.toThrow();
	}

	it('injects preloads for a stored non-default look, pre-paint', () => {
		bootWithFonts('watercolor');
		expect(document.documentElement.getAttribute('data-look')).toBe('watercolor');
		expect(preloadHrefs()).toEqual([
			'/fonts/CormorantGaramond-Regular.woff2',
			'/fonts/NotoSansKR-subset.woff2'
		]);
		const link = document.querySelector<HTMLLinkElement>('link[rel="preload"]');
		expect(link?.getAttribute('type')).toBe('font/woff2');
		expect(link?.crossOrigin).toBe('anonymous');
	});

	it('injects preloads for the default look too — layout does not bake them', () => {
		bootWithFonts(null);
		expect(preloadHrefs()).toEqual([
			'/fonts/NotoSansKR-subset.woff2',
			'/fonts/Newsreader-Italic-latin.woff2'
		]);
		bootWithFonts(DEFAULT_LOOK_ID);
		expect(preloadHrefs()).toEqual([
			'/fonts/NotoSansKR-subset.woff2',
			'/fonts/Newsreader-Italic-latin.woff2'
		]);
	});

	it('injects nothing for a look with no map entry', () => {
		bootWithFonts('taegeuk');
		expect(preloadHrefs()).toEqual([]);
	});
});
