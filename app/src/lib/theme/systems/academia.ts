import type { DesignSystem, Palette } from '../types.ts';

const DISPLAY = "'Cormorant Garamond', Georgia, 'Palatino Linotype', Palatino, serif";
const MONO = "'SF Mono', ui-monospace, 'JetBrains Mono', Menlo, monospace";
const HANGUL = "'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', 'Nanum Gothic', sans-serif";

const light: Palette = {
	ink: '#2A1E14',
	inkSoft: '#4A3B2E',
	inkFaint: '#584E42',
	paper: '#FAF6EE',
	paperSunk: '#F5EFE3',
	paperRaised: '#FFF9F0',
	rule: '#E3D9C6',
	ruleStrong: '#C4B394',
	accent: '#5C3D2E',
	accentInk: '#FAF6EE',
	accentSoft: '#EDE5D5',
	blue: '#425A34',
	blueSoft: '#E4EBE3',
	good: '#425A34',
	goodSoft: '#E4EBE3',
	bad: '#8A3A38',
	badSoft: '#F4E6E2',
	warn: '#62521C',
	warnSoft: '#F3EBD4',
	shadow1: '0 2px 16px rgba(42, 30, 20, 0.06)',
	shadow2: '0 4px 24px rgba(42, 30, 20, 0.08)',
	shadow3: '0 8px 32px rgba(42, 30, 20, 0.1)',
	display: DISPLAY,
	serif: "'Libre Baskerville', Georgia, 'Palatino Linotype', Palatino, serif",
	sans: "'Lora', Georgia, 'Palatino Linotype', Palatino, serif",
	mono: MONO,
	hangul: HANGUL,
	atmosphere: 'radial-gradient(ellipse at 30% 20%, rgba(255, 240, 200, 0.28) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(245, 230, 200, 0.16) 0%, transparent 50%)',
	textureOpacity: '0.03'
};

const dark: Palette = {
	ink: '#F4F1E8',
	inkSoft: '#D9D0C0',
	inkFaint: '#C8B89A',
	paper: '#2A1A0A',
	paperSunk: '#1F1208',
	paperRaised: '#3D2914',
	rule: '#5C4630',
	ruleStrong: '#9A7B4F',
	accent: '#DEAD40',
	accentInk: '#1C1612',
	accentSoft: '#3D2914',
	blue: '#84B49E',
	blueSoft: '#1A2F26',
	good: '#84B49E',
	goodSoft: '#1A2F26',
	bad: '#F09080',
	badSoft: '#4A1C23',
	warn: '#DEAD40',
	warnSoft: '#3D2914',
	shadow1: '0 4px 24px rgba(0, 0, 0, 0.4)',
	shadow2: '0 4px 24px rgba(0, 0, 0, 0.4), 0 0 20px rgba(184, 134, 11, 0.15)',
	shadow3: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 24px rgba(184, 134, 11, 0.12)',
	display: DISPLAY,
	serif: "'EB Garamond', Georgia, 'Palatino Linotype', Palatino, serif",
	sans: "'Source Serif 4', Georgia, 'Palatino Linotype', Palatino, serif",
	mono: MONO,
	hangul: HANGUL,
	atmosphere: 'radial-gradient(ellipse at center, transparent 0%, rgba(26, 16, 10, 0.45) 100%)',
	textureOpacity: '0.04'
};

/**
 * Light Academia (light) + Dark Academia (dark).
 * Palettes follow https://ggprompts.com/styles/light-academia.html
 * and https://ggprompts.com/styles/dark-academia.html, with caption-size
 * inks lifted to 7:1 against paper.
 */
export const academia: DesignSystem = {
	id: 'academia',
	name: 'Academia',
	htmlSize: '106.25%',
	leading: '1.75',
	shape: {
		rSm: '2px',
		rMd: '3px',
		rLg: '4px',
		rPill: '999px'
	},
	fonts: [
		{ family: 'Cormorant Garamond', file: 'CormorantGaramond-Regular.woff2', weight: '400' },
		{
			family: 'Cormorant Garamond',
			file: 'CormorantGaramond-Italic.woff2',
			style: 'italic',
			weight: '400'
		},
		{ family: 'Libre Baskerville', file: 'LibreBaskerville-Regular.woff2', weight: '400' },
		{
			family: 'Libre Baskerville',
			file: 'LibreBaskerville-Italic.woff2',
			style: 'italic',
			weight: '400'
		},
		{ family: 'Libre Baskerville', file: 'LibreBaskerville-Bold.woff2', weight: '700' },
		{ family: 'Lora', file: 'Lora-Regular.woff2', weight: '400' },
		{ family: 'Lora', file: 'Lora-Italic.woff2', style: 'italic', weight: '400' },
		{ family: 'EB Garamond', file: 'EBGaramond-Regular.woff2', weight: '400' },
		{ family: 'EB Garamond', file: 'EBGaramond-Italic.woff2', style: 'italic', weight: '400' },
		{ family: 'Source Serif 4', file: 'SourceSerif4-Regular.woff2', weight: '400' },
		{
			family: 'Source Serif 4',
			file: 'SourceSerif4-Italic.woff2',
			style: 'italic',
			weight: '400'
		}
	],
	light,
	dark,
	contrastMoreLight: {
		inkFaint: '#4A3B2E',
		rule: '#C4B394',
		ruleStrong: '#A88B3D',
		accent: '#3E2518'
	},
	contrastMoreDark: {
		inkFaint: '#E8E4D9',
		rule: '#9A7B4F',
		ruleStrong: '#DEAD40',
		accent: '#E8C56B'
	}
};
