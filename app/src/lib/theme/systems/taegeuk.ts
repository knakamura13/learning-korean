import type { DesignSystem, Palette } from '../types.ts';

const SERIF = "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif";
const SANS = "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif";
const MONO = "'SF Mono', ui-monospace, 'JetBrains Mono', Menlo, monospace";
const HANGUL = "'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', 'Nanum Gothic', sans-serif";

const light: Palette = {
	ink: '#1a1a18',
	inkSoft: '#55534e',
	inkFaint: '#585650',
	paper: '#fffef9',
	paperSunk: '#f4f2ea',
	paperRaised: '#ffffff',
	rule: '#e2ded1',
	ruleStrong: '#cdc7b5',
	accent: '#a4342b',
	accentInk: '#ffffff',
	accentSoft: '#f9ece9',
	gold: '#a4342b',
	goldSoft: '#f9ece9',
	cardSheen: '#a4342b',
	blue: '#2b5c8a',
	blueSoft: '#eaf1f7',
	good: '#2f6b45',
	goodSoft: '#e8f1eb',
	bad: '#9c2f28',
	badSoft: '#faeae8',
	warn: '#8a6316',
	warnSoft: '#faf2e0',
	shadow1: '0 1px 2px rgba(26, 26, 24, 0.05), 0 1px 3px rgba(26, 26, 24, 0.04)',
	shadow2: '0 2px 6px rgba(26, 26, 24, 0.07), 0 8px 20px rgba(26, 26, 24, 0.05)',
	shadow3: '0 8px 24px rgba(26, 26, 24, 0.1), 0 20px 48px rgba(26, 26, 24, 0.07)',
	display: SERIF,
	serif: SERIF,
	sans: SANS,
	mono: MONO,
	hangul: HANGUL,
	atmosphere: 'none',
	textureOpacity: '0'
};

const dark: Palette = {
	ink: '#e9e7e0',
	inkSoft: '#a8a49a',
	inkFaint: '#a5a099',
	paper: '#131316',
	paperSunk: '#1b1b20',
	paperRaised: '#212127',
	rule: '#32323a',
	ruleStrong: '#454550',
	accent: '#e28379',
	accentInk: '#1a1a18',
	accentSoft: '#2d1e1c',
	gold: '#e28379',
	goldSoft: '#2d1e1c',
	cardSheen: '#e28379',
	blue: '#8ab7e0',
	blueSoft: '#182531',
	good: '#83c99e',
	goodSoft: '#17251d',
	bad: '#e88b81',
	badSoft: '#2a1a18',
	warn: '#d8b055',
	warnSoft: '#2a2312',
	shadow1: '0 1px 2px rgba(0, 0, 0, 0.4)',
	shadow2: '0 2px 8px rgba(0, 0, 0, 0.45), 0 10px 24px rgba(0, 0, 0, 0.3)',
	shadow3: '0 10px 30px rgba(0, 0, 0, 0.5), 0 24px 60px rgba(0, 0, 0, 0.35)',
	display: SERIF,
	serif: SERIF,
	sans: SANS,
	mono: MONO,
	hangul: HANGUL,
	atmosphere: 'none',
	textureOpacity: '0'
};

/** Previous ink-and-paper system, kept so a prototype can switch back in one line. */
export const taegeuk: DesignSystem = {
	id: 'taegeuk',
	name: 'Taegeuk',
	htmlSize: '106.25%',
	leading: '1.6',
	shape: {
		rSm: '6px',
		rMd: '10px',
		rLg: '16px',
		rPill: '999px'
	},
	fonts: [],
	light,
	dark,
	contrastMoreLight: {
		inkFaint: '#4f4d48',
		rule: '#b8b19f',
		ruleStrong: '#9a937f',
		accent: '#8a2a22',
		accentSoft: '#edd0cb'
	},
	contrastMoreDark: {
		inkFaint: '#b0aca2',
		rule: '#5c5c68',
		ruleStrong: '#767684',
		accent: '#f09990',
		accentSoft: '#4a2a26'
	}
};
