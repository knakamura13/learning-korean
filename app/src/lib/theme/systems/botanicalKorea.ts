import type { DesignSystem, FontFaceSpec, Palette } from '../types.ts';

/**
 * Botanical Korea — live brand for the Pressed Fascicle shell.
 *
 * Hangul stays self-hosted Noto Sans KR (never grain, never a display face).
 * Latin faces are self-hosted woff2 subsets (no Google Fonts CDN).
 */
const DISPLAY =
	"'Newsreader', 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif";
const SERIF =
	"'Source Serif 4', 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif";
const SANS = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const MONO = "'IBM Plex Mono', 'SF Mono', ui-monospace, 'JetBrains Mono', Menlo, monospace";
const HANGUL = "'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', 'Nanum Gothic', sans-serif";

/** Latin + punctuation the UI uses. Hangul never matches this range. */
export const LATIN_UNICODE_RANGE =
	'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2190-2193, U+2212, U+2215, U+FEFF, U+FFFD';

function latinFace(
	partial: Pick<FontFaceSpec, 'family' | 'file' | 'style' | 'weight' | 'display'>
): FontFaceSpec {
	return { ...partial, unicodeRange: LATIN_UNICODE_RANGE };
}

const light: Palette = {
	ink: '#3e352c',
	inkSoft: '#5c5047',
	inkFaint: '#4a4038',
	paper: '#faf5ee',
	paperSunk: '#f5edd9',
	paperRaised: '#fffdf8',
	rule: '#e8dcc8',
	ruleStrong: '#c4b8a5',
	accent: '#315c45',
	accentInk: '#fffdf8',
	accentSoft: '#e7f0ea',
	blue: '#3d5a7a',
	blueSoft: '#e7eef4',
	good: '#2f6b45',
	goodSoft: '#e8f1eb',
	bad: '#9c2f28',
	badSoft: '#faeae8',
	warn: '#7a5e18',
	warnSoft: '#faf2e0',
	rose: '#7a3e46',
	roseInk: '#fffdf8',
	roseSoft: '#f3e6e8',
	shadow1: '0 1px 2px rgba(62, 53, 44, 0.05), 0 1px 3px rgba(62, 53, 44, 0.04)',
	shadow2: '0 2px 6px rgba(62, 53, 44, 0.07), 0 8px 20px rgba(62, 53, 44, 0.05)',
	shadow3: '0 8px 24px rgba(62, 53, 44, 0.1), 0 20px 48px rgba(62, 53, 44, 0.07)'
};

const dark: Palette = {
	ink: '#f5edd9',
	inkSoft: '#c4b8a5',
	inkFaint: '#d4c4a8',
	paper: '#1a2420',
	paperSunk: '#141c19',
	paperRaised: '#24302b',
	rule: '#2f3d37',
	ruleStrong: '#4a5c54',
	accent: '#a6c1ae',
	accentInk: '#1a2420',
	accentSoft: '#24352c',
	blue: '#8aa8c4',
	blueSoft: '#1e2c34',
	good: '#8fbf9e',
	goodSoft: '#1e2e26',
	bad: '#d98984',
	badSoft: '#2a1e1e',
	warn: '#d4bc7a',
	warnSoft: '#2a2618',
	rose: '#e8b4ba',
	roseInk: '#1a2420',
	roseSoft: '#3a2a2c',
	shadow1: '0 1px 2px rgba(0, 0, 0, 0.4)',
	shadow2: '0 2px 8px rgba(0, 0, 0, 0.45), 0 10px 24px rgba(0, 0, 0, 0.3)',
	shadow3: '0 10px 30px rgba(0, 0, 0, 0.5), 0 24px 60px rgba(0, 0, 0, 0.35)'
};

/** Pressed-flowers paper, verdant moss, mugunghwa rose. */
export const botanicalKorea: DesignSystem = {
	id: 'botanicalKorea',
	name: 'Botanical Korea',
	htmlSize: '106.25%',
	leading: '1.6',
	shape: {
		rSm: '6px',
		rMd: '10px',
		rLg: '16px',
		rPill: '999px'
	},
	type: {
		display: DISPLAY,
		serif: SERIF,
		sans: SANS,
		mono: MONO,
		hangul: HANGUL
	},
	fonts: [
		{
			family: 'Noto Sans KR',
			file: 'NotoSansKR-subset.woff2',
			style: 'normal',
			weight: '400 600',
			display: 'optional'
		},
		latinFace({
			family: 'Newsreader',
			file: 'Newsreader-latin.woff2',
			style: 'normal',
			weight: '300 400',
			display: 'optional'
		}),
		latinFace({
			family: 'Newsreader',
			file: 'Newsreader-Italic-latin.woff2',
			style: 'italic',
			weight: '400',
			display: 'optional'
		}),
		latinFace({
			family: 'Source Serif 4',
			file: 'SourceSerif4-latin.woff2',
			style: 'normal',
			weight: '400',
			display: 'optional'
		}),
		latinFace({
			family: 'Inter',
			file: 'Inter-latin.woff2',
			style: 'normal',
			weight: '400 600',
			display: 'swap'
		}),
		latinFace({
			family: 'IBM Plex Mono',
			file: 'IBMPlexMono-Regular-latin.woff2',
			style: 'normal',
			weight: '400',
			display: 'swap'
		}),
		latinFace({
			family: 'IBM Plex Mono',
			file: 'IBMPlexMono-Medium-latin.woff2',
			style: 'normal',
			weight: '500',
			display: 'swap'
		})
	],
	light,
	dark,
	contrastMoreLight: {
		inkFaint: '#3d342c',
		rule: '#b8a88e',
		ruleStrong: '#8f806c',
		accent: '#1e3d2c',
		accentSoft: '#cfe0d6',
		rose: '#5c2c33',
		roseSoft: '#e4c9cc'
	},
	contrastMoreDark: {
		inkFaint: '#e2d4b8',
		rule: '#5a6e66',
		ruleStrong: '#7a9086',
		accent: '#c4dccb',
		accentSoft: '#2c4638',
		rose: '#f0c8cc',
		roseSoft: '#4a3234'
	}
};
