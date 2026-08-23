import { DEFAULT_LOOK_ID } from './catalog';
import { LOOK_KEY } from './look';
import { THEME_KEY } from './index';
import type { DesignSystem } from './types.ts';

/** Self-hosted files per look, for the boot script's pre-paint font preloads. */
export function lookFontFiles(systems: readonly DesignSystem[]): Record<string, string[]> {
	return Object.fromEntries(
		systems.map((s) => [s.id, s.fonts.flatMap((f) => (f.file ? [f.file] : []))])
	);
}

export interface AppearanceBootInput {
	look: string | null;
	theme: string | null;
	prefersDark: boolean;
	knownLookIds: readonly string[];
}

export interface AppearanceBoot {
	look: string;
	themeAttr: 'light' | 'dark' | null;
	dark: boolean;
}

export function resolveAppearanceBoot(input: AppearanceBootInput): AppearanceBoot {
	const look =
		input.look !== null && input.knownLookIds.includes(input.look)
			? input.look
			: DEFAULT_LOOK_ID;
	const themeAttr =
		input.theme === 'light' || input.theme === 'dark' ? input.theme : null;
	const dark = themeAttr === 'dark' || (themeAttr !== 'light' && input.prefersDark);

	return { look, themeAttr, dark };
}

export function applyAppearanceDom(
	root: HTMLElement,
	boot: AppearanceBoot,
	papers: Record<string, { light: string; dark: string }>,
	themeColor: HTMLMetaElement | null,
	colorScheme: HTMLMetaElement | null
): void {
	root.setAttribute('data-look', boot.look);

	if (boot.themeAttr) {
		root.setAttribute('data-theme', boot.themeAttr);
		root.style.colorScheme = boot.themeAttr;
		if (colorScheme) colorScheme.setAttribute('content', boot.themeAttr);
	}

	const paperSet = papers[boot.look];
	if (paperSet && themeColor) {
		themeColor.setAttribute('content', paperSet[boot.dark ? 'dark' : 'light']);
	}

	const manifest = document.querySelector<HTMLLinkElement>('link[rel="manifest"]:not([media])');
	if (manifest) {
		const href = manifest.getAttribute('href') ?? '/manifest.webmanifest';
		manifest.setAttribute(
			'href',
			boot.dark
				? href.replace(/manifest(?:-dark)?\.webmanifest/, 'manifest-dark.webmanifest')
				: href.replace(/manifest-dark\.webmanifest/, 'manifest.webmanifest')
		);
	}
}

export function themeBootScript(
	lookPapers: Record<string, { light: string; dark: string }>,
	lookFonts: Record<string, string[]> = {}
): string {
	const papersJson = JSON.stringify(lookPapers);
	const fontsJson = JSON.stringify(lookFonts);

	// Prerendered HTML cannot know the visitor's stored look, so this
	// parser-blocking classic script injects font preloads for *every* look
	// (including the default) before paint. Returning academia/watercolor
	// visitors then download only their look's fonts, not the default's too.
	return `(function(){try{var look=null,theme=null;try{look=localStorage.getItem(${JSON.stringify(LOOK_KEY)});theme=localStorage.getItem(${JSON.stringify(THEME_KEY)});}catch(e){}var lookPapers=${papersJson};var knownIds=Object.keys(lookPapers);var lookId=look&&knownIds.indexOf(look)!==-1?look:${JSON.stringify(DEFAULT_LOOK_ID)};var themeAttr=theme==='light'||theme==='dark'?theme:null;var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var dark=themeAttr==='dark'||(themeAttr!=='light'&&prefersDark);var root=document.documentElement;root.setAttribute('data-look',lookId);if(themeAttr){root.setAttribute('data-theme',themeAttr);root.style.colorScheme=themeAttr;var cs=document.querySelector('meta[name="color-scheme"]');if(cs)cs.setAttribute('content',themeAttr);}var m=document.querySelector('meta[name="theme-color"][data-resolved]');if(m){var p=lookPapers[lookId];if(p)m.setAttribute('content',dark?p.dark:p.light);}var man=document.querySelector('link[rel="manifest"]:not([media])');if(man){var href=man.getAttribute('href')||'/manifest.webmanifest';man.setAttribute('href',dark?href.replace(/manifest(?:-dark)?\\.webmanifest/,'manifest-dark.webmanifest'):href.replace(/manifest-dark\\.webmanifest/,'manifest.webmanifest'));}var lookFonts=${fontsJson};var files=lookFonts[lookId]||[];for(var i=0;i<files.length;i++){var l=document.createElement('link');l.setAttribute('rel','preload');l.setAttribute('href','/fonts/'+files[i]);l.setAttribute('as','font');l.setAttribute('type','font/woff2');l.setAttribute('crossorigin','anonymous');document.head.appendChild(l);}}catch(e){}})();`;
}
