import type { DesignSystem, Palette } from '../types.ts';
import {
	CORMORANT_FALLBACKS,
	LIBRE_BASKERVILLE_FALLBACKS,
	LORA_FALLBACKS,
	optionalLatinFace
} from './latinFallbacks.ts';

const DISPLAY =
	"'Cormorant Garamond', 'Cormorant Garamond Fallback', Georgia, 'Palatino Linotype', Palatino, serif";
const SERIF =
	"'Libre Baskerville', 'Libre Baskerville Fallback', 'Noto Serif KR', Georgia, 'Palatino Linotype', Palatino, serif";
const SANS = "'Lora', 'Lora Fallback', Georgia, 'Palatino Linotype', Palatino, serif";
const MONO = "'SF Mono', ui-monospace, 'JetBrains Mono', Menlo, monospace";
const HANGUL = "'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', 'Nanum Gothic', sans-serif";

const light: Palette = {
	ink: '#2a1e14',
	inkSoft: '#4a3b2e',
	inkFaint: '#584e42',
	paper: '#faf6ee',
	paperSunk: '#f5efe3',
	paperRaised: '#fff9f0',
	rule: '#ede5d5',
	ruleStrong: '#e3d9c6',
	accent: '#5c3d2e',
	accentInk: '#faf6ee',
	accentSoft: '#ede5d5',
	blue: '#5c3d2e',
	blueSoft: '#ede5d5',
	good: '#425a34',
	goodSoft: '#e4ebe3',
	bad: '#8a3a38',
	badSoft: '#f4e6e2',
	warn: '#62521c',
	warnSoft: '#f3ebd4',
	/** Bronze, not honey `#d4a843` — that ornament is ~2:1 on cream. */
	rose: '#6b4e12',
	roseSoft: '#f3ebd4',
	shadow1: '0 2px 16px rgba(42, 30, 20, 0.06)',
	shadow2: '0 4px 24px rgba(42, 30, 20, 0.08)',
	shadow3: '0 8px 32px rgba(42, 30, 20, 0.1)'
};

const dark: Palette = {
	ink: '#f4f1e8',
	inkSoft: '#d9d0c0',
	inkFaint: '#c8b89a',
	paper: '#2a1a0a',
	paperSunk: '#1f1208',
	paperRaised: '#3d2914',
	rule: '#5c4630',
	ruleStrong: '#9a7b4f',
	/** Lifted burgundy so `color: var(--accent)` stays 4.5:1 on brown paper. */
	accent: '#c47a82',
	accentInk: '#2a1a0a',
	accentSoft: '#4a1c23',
	blue: '#f4f1e8',
	blueSoft: '#3d2914',
	good: '#84b49e',
	goodSoft: '#1a2f26',
	bad: '#f09080',
	badSoft: '#4a1c23',
	warn: '#dead40',
	warnSoft: '#3d2914',
	rose: '#d4a843',
	roseSoft: '#3d2914',
	shadow1: '0 4px 24px rgba(0, 0, 0, 0.4)',
	shadow2: '0 4px 24px rgba(0, 0, 0, 0.4), 0 0 20px rgba(184, 134, 11, 0.15)',
	shadow3: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 24px rgba(184, 134, 11, 0.12)'
};

/**
 * Light Academia (light) + Dark Academia (dark).
 * Palettes follow https://ggprompts.com/styles/light-academia.html
 * and https://ggprompts.com/styles/dark-academia.html, mapped onto the
 * shared `DesignSystem` contract. Honey gold is `--rose` only where it
 * meets 4.5:1 (dark); light rose is bronze so due/resume chrome stays
 * readable. Type is one stack (Cormorant / Baskerville / Lora) because
 * `TypeStacks` is not per-mode. Academia is selected at runtime
 * (`data-look='academia'`), not by swapping `activeSystem`.
 */
export const academia: DesignSystem = {
	id: 'academia',
	name: 'Academia',
	summary: 'Library lamp, scholarly serif.',
	htmlSize: '106.25%',
	leading: '1.75',
	shape: {
		rSm: '0px',
		rMd: '0px',
		rLg: '0px',
		rPill: '0px'
	},
	type: {
		display: DISPLAY,
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
			family: 'Libre Baskerville',
			file: 'LibreBaskerville-Regular.woff2',
			style: 'normal',
			weight: '400'
		}),
		optionalLatinFace({
			family: 'Libre Baskerville',
			file: 'LibreBaskerville-Italic.woff2',
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
		...LIBRE_BASKERVILLE_FALLBACKS,
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
		}
	],
	light,
	dark,
	contrastMoreLight: {
		inkFaint: '#4a3b2e',
		rule: '#c4b394',
		ruleStrong: '#a88b3d',
		accent: '#3e2518',
		accentSoft: '#ede5d5',
		rose: '#4a3b12',
		roseSoft: '#f3ebd4'
	},
	contrastMoreDark: {
		inkFaint: '#e8e4d9',
		rule: '#9a7b4f',
		ruleStrong: '#dead40',
		accent: '#e8a8a2',
		accentSoft: '#4a1c23',
		rose: '#dead40',
		roseSoft: '#3d2914'
	}
};
