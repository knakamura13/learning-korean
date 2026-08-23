import type { DesignSystem, Palette } from '../types.ts';
import { HANGUL_WITH_FALLBACK, NOTO_SANS_KR_FALLBACK } from './hangulFallbacks.ts';

const SERIF = "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif";
const SANS = "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif";
const MONO = "'SF Mono', ui-monospace, 'JetBrains Mono', Menlo, monospace";
const HANGUL = HANGUL_WITH_FALLBACK;

const light: Palette = {
	ink: '#1a1a18',
	inkSoft: '#53514d',
	inkFaint: '#53514b',
	paper: '#fffef9',
	paperSunk: '#f4f2ea',
	paperRaised: '#ffffff',
	rule: '#e2ded1',
	ruleStrong: '#918b79',
	accent: '#902d26',
	accentInk: '#ffffff',
	accentSoft: '#f9ece9',
	blue: '#24507a',
	blueSoft: '#eaf1f7',
	good: '#28593a',
	goodSoft: '#e8f1eb',
	bad: '#902b25',
	badSoft: '#faeae8',
	warn: '#6b4c11',
	warnSoft: '#faf2e0',
	rose: '#902d26',
	roseSoft: '#f9ece9',
	shadow1: '0 1px 2px rgba(26, 26, 24, 0.05), 0 1px 3px rgba(26, 26, 24, 0.04)',
	shadow2: '0 2px 6px rgba(26, 26, 24, 0.07), 0 8px 20px rgba(26, 26, 24, 0.05)',
	shadow3: '0 8px 24px rgba(26, 26, 24, 0.1), 0 20px 48px rgba(26, 26, 24, 0.07)'
};

const dark: Palette = {
	ink: '#e9e7e0',
	inkSoft: '#a9a69c',
	inkFaint: '#b0aca2',
	paper: '#131316',
	paperSunk: '#1b1b20',
	paperRaised: '#212127',
	rule: '#32323a',
	ruleStrong: '#6b6b76',
	accent: '#e7978e',
	accentInk: '#1a1a18',
	accentSoft: '#2d1e1c',
	blue: '#8ab7e0',
	blueSoft: '#182531',
	good: '#83c99e',
	goodSoft: '#17251d',
	bad: '#e99187',
	badSoft: '#2a1a18',
	warn: '#d8b055',
	warnSoft: '#2a2312',
	rose: '#e7978e',
	roseSoft: '#2d1e1c',
	shadow1: '0 1px 2px rgba(0, 0, 0, 0.4)',
	shadow2: '0 2px 8px rgba(0, 0, 0, 0.45), 0 10px 24px rgba(0, 0, 0, 0.3)',
	shadow3: '0 10px 30px rgba(0, 0, 0, 0.5), 0 24px 60px rgba(0, 0, 0, 0.35)'
};

/** Current ink-and-paper system (태극 red / blue). */
export const taegeuk: DesignSystem = {
	id: 'taegeuk',
	name: 'Taegeuk',
	summary: 'Ink on paper, 태극 red and blue.',
	htmlSize: '106.25%',
	leading: '1.6',
	shape: {
		rSm: '6px',
		rMd: '10px',
		rLg: '16px',
		rPill: '999px'
	},
	type: {
		display: SERIF,
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
		NOTO_SANS_KR_FALLBACK
	],
	light,
	dark,
	contrastMoreLight: {
		inkFaint: '#4f4d48',
		rule: '#b8b19f',
		ruleStrong: '#928b77',
		accent: '#8a2a22',
		accentSoft: '#f5e8e5',
		rose: '#8a2a22',
		roseSoft: '#f5e8e5'
	},
	contrastMoreDark: {
		inkFaint: '#b0aca2',
		rule: '#5c5c68',
		ruleStrong: '#767684',
		accent: '#f09990',
		accentSoft: '#2d1815',
		rose: '#f09990',
		roseSoft: '#2d1815'
	}
};
