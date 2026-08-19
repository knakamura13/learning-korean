import type { DesignSystem, FontFaceSpec, Palette } from '../types.ts';

const DISPLAY =
	"'Newsreader', 'Newsreader Fallback', 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif";
const SERIF =
	"'Noto Serif KR', 'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif";
const SANS = "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif";
const MONO = "'SF Mono', ui-monospace, 'JetBrains Mono', Menlo, monospace";
const HANGUL =
	"'Noto Sans KR', 'Noto Sans KR Fallback', 'Apple SD Gothic Neo', 'Malgun Gothic', 'Nanum Gothic', sans-serif";

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
	inkFaint: '#5c5047',
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
	roseSoft: '#f3e6e8',
	shadow1: '0 1px 2px rgba(62, 53, 44, 0.05), 0 1px 3px rgba(62, 53, 44, 0.04)',
	shadow2: '0 2px 6px rgba(62, 53, 44, 0.07), 0 8px 20px rgba(62, 53, 44, 0.05)',
	shadow3: '0 8px 24px rgba(62, 53, 44, 0.1), 0 20px 48px rgba(62, 53, 44, 0.07)'
};

const dark: Palette = {
	ink: '#f5edd9',
	inkSoft: '#c5d1c4',
	inkFaint: '#b8c4b0',
	paper: '#1a2420',
	paperSunk: '#141c19',
	paperRaised: '#24302b',
	rule: '#2f3d37',
	ruleStrong: '#3d4f47',
	accent: '#a6c1ae',
	accentInk: '#1a2420',
	accentSoft: '#24352d',
	blue: '#8ab7e0',
	blueSoft: '#182531',
	good: '#83c99e',
	goodSoft: '#17251d',
	bad: '#e88b81',
	badSoft: '#2a1a18',
	warn: '#d8b055',
	warnSoft: '#2a2312',
	rose: '#e8b4ba',
	roseSoft: '#3a2428',
	shadow1: '0 1px 2px rgba(0, 0, 0, 0.4)',
	shadow2: '0 2px 8px rgba(0, 0, 0, 0.45), 0 10px 24px rgba(0, 0, 0, 0.3)',
	shadow3: '0 10px 30px rgba(0, 0, 0, 0.5), 0 24px 60px rgba(0, 0, 0, 0.35)'
};

/** Pressed-flowers paper, verdant moss, mugunghwa rose. */
export const botanicalKorea: DesignSystem = {
	id: 'botanicalKorea',
	name: 'Botanical Korea',
	summary: 'Pressed-flowers paper and moss green.',
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
			file: 'Newsreader-Italic-latin.woff2',
			style: 'italic',
			weight: '400',
			display: 'optional'
		}),
		{
			family: 'Newsreader Fallback',
			local: ['Iowan Old Style', 'Palatino Linotype', 'Palatino', 'Georgia'],
			style: 'italic',
			weight: '400',
			display: 'optional',
			ascentOverride: '73.5%',
			descentOverride: '26.5%',
			lineGapOverride: '0%'
		},
		{
			family: 'Noto Sans KR Fallback',
			local: ['Apple SD Gothic Neo', 'Malgun Gothic', 'Nanum Gothic'],
			style: 'normal',
			weight: '400',
			display: 'optional',
			ascentOverride: '116%',
			descentOverride: '28.8%',
			lineGapOverride: '0%'
		}
	],
	light,
	dark,
	contrastMoreLight: {
		inkFaint: '#4a4038',
		rule: '#b8a990',
		ruleStrong: '#8a7a64',
		accent: '#1e3d2c',
		accentSoft: '#d5e4db',
		rose: '#5c2c33',
		roseSoft: '#f0d6d9'
	},
	contrastMoreDark: {
		inkFaint: '#c5d1c4',
		rule: '#4a5c54',
		ruleStrong: '#6a8076',
		accent: '#c5dbc5',
		accentSoft: '#24352d',
		rose: '#f0c9ce',
		roseSoft: '#3a2428'
	}
};
