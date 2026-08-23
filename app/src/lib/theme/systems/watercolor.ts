import type { DesignSystem, Palette } from '../types.ts';
import {
	CORMORANT_FALLBACKS,
	LORA_FALLBACKS,
	optionalLatinFace
} from './latinFallbacks.ts';
import { HANGUL_WITH_FALLBACK, NOTO_SANS_KR_FALLBACK } from './hangulFallbacks.ts';

const SERIF =
	"'Cormorant Garamond', 'Cormorant Garamond Fallback', 'Noto Serif KR', Georgia, 'Palatino Linotype', Palatino, serif";
const SANS = "'Lora', 'Lora Fallback', 'Noto Sans KR', Georgia, 'Iowan Old Style', serif";
const MONO = "'SF Mono', ui-monospace, 'JetBrains Mono', Menlo, monospace";
const HANGUL = HANGUL_WITH_FALLBACK;

const light: Palette = {
	ink: '#3d4852',
	inkSoft: '#485164',
	inkFaint: '#46525c',
	paper: '#f9f6f2',
	paperSunk: '#f5f0e8',
	paperRaised: '#fffef8',
	rule: '#e8e2d8',
	ruleStrong: '#b18057',
	accent: '#444c5e',
	accentInk: '#fffef8',
	accentSoft: '#e6e8ec',
	blue: '#2d3748',
	blueSoft: '#e8eaf0',
	good: '#3e543c',
	goodSoft: '#e8eee6',
	bad: '#72423c',
	badSoft: '#f6ebe9',
	warn: '#654930',
	warnSoft: '#f4ece4',
	rose: '#76403a',
	roseSoft: '#f6ebe9',
	shadow1: '0 2px 8px rgba(74, 85, 104, 0.08), 0 1px 3px rgba(74, 85, 104, 0.08)',
	shadow2: '0 4px 15px rgba(74, 85, 104, 0.12), 0 4px 20px rgba(74, 85, 104, 0.08)',
	shadow3: '0 8px 25px rgba(74, 85, 104, 0.12), 0 12px 35px rgba(74, 85, 104, 0.12)'
};

const dark: Palette = {
	ink: '#fffef8',
	inkSoft: '#e8e2d8',
	inkFaint: '#b8c2cc',
	paper: '#1a1e26',
	paperSunk: '#14171e',
	paperRaised: '#242a34',
	rule: '#323844',
	ruleStrong: '#6c737f',
	accent: '#b5bfcc',
	accentInk: '#1a1e26',
	accentSoft: '#2a3140',
	blue: '#c4bbd8',
	blueSoft: '#262033',
	good: '#a8c4a2',
	goodSoft: '#1c2a1e',
	bad: '#dc9b93',
	badSoft: '#2a1e1c',
	warn: '#ddb892',
	warnSoft: '#2a2318',
	rose: '#e8a8a2',
	roseSoft: '#3a2428',
	shadow1: '0 1px 2px rgba(26, 30, 38, 0.45)',
	shadow2: '0 2px 8px rgba(26, 30, 38, 0.5), 0 10px 24px rgba(74, 85, 104, 0.28)',
	shadow3: '0 10px 30px rgba(0, 0, 0, 0.5), 0 24px 60px rgba(74, 85, 104, 0.22)'
};

/**
 * Pigment washes on paper: indigo, ochre, sage, coral, lavender.
 * Tokens follow https://ggprompts.com/styles/watercolor.html, with caption
 * inks and action colours lifted to WCAG AAA (7:1) against paper and soft
 * surfaces. Dark is a night indigo wash of the same pigments (the guide is
 * light-only).
 */
export const watercolor: DesignSystem = {
	id: 'watercolor',
	name: 'Watercolor',
	summary: 'Pigment washes on paper.',
	htmlSize: '106.25%',
	leading: '1.7',
	shape: {
		rSm: '12px',
		rMd: '18px 28px 22px 16px / 24px 18px 22px 20px',
		rLg: '20px 36px 28px 24px / 28px 20px 32px 24px',
		rPill: '40% 60% 55% 45% / 55% 45% 55% 45%'
	},
	type: {
		display: SERIF,
		serif: SERIF,
		sans: SANS,
		mono: MONO,
		hangul: HANGUL
	},
	fonts: [
		optionalLatinFace({
			family: 'Cormorant Garamond',
			file: 'CormorantGaramond-Regular.woff2',
			style: 'normal',
			weight: '400'
		}),
		optionalLatinFace({
			family: 'Cormorant Garamond',
			file: 'CormorantGaramond-Italic.woff2',
			style: 'italic',
			weight: '400'
		}),
		optionalLatinFace({
			family: 'Lora',
			file: 'Lora-Regular.woff2',
			style: 'normal',
			weight: '400'
		}),
		optionalLatinFace({
			family: 'Lora',
			file: 'Lora-Italic.woff2',
			style: 'italic',
			weight: '400'
		}),
		...CORMORANT_FALLBACKS,
		...LORA_FALLBACKS,
		{
			family: 'Noto Sans KR',
			file: 'NotoSansKR-subset.woff2',
			style: 'normal',
			weight: '400 600',
			display: 'optional'
		},
		{
			family: 'Noto Serif KR',
			file: 'NotoSerifKR-subset.woff2',
			style: 'normal',
			weight: '400 600',
			display: 'optional'
		},
		NOTO_SANS_KR_FALLBACK
	],
	light,
	dark,
	contrastMoreLight: {
		inkFaint: '#2d3748',
		rule: '#c4b8a5',
		ruleStrong: '#a67c52',
		accent: '#2d3748',
		accentSoft: '#d5d8de',
		rose: '#6b3532',
		roseSoft: '#f0d6d4'
	},
	contrastMoreDark: {
		inkFaint: '#e8e2d8',
		rule: '#5c6570',
		ruleStrong: '#8795a1',
		accent: '#c4cad0',
		accentSoft: '#2a3140',
		rose: '#f0c4c0',
		roseSoft: '#3a2428'
	}
};
