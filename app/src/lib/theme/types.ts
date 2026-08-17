/**
 * Semantic tokens every design system must fill.
 *
 * Components speak only this vocabulary (`var(--ink)`, `var(--paper)`, …).
 * A new look is a new `DesignSystem` that maps its palette, type, shape,
 * and webfonts onto these names.
 */
export interface Palette {
	ink: string;
	inkSoft: string;
	inkFaint: string;
	paper: string;
	paperSunk: string;
	paperRaised: string;
	rule: string;
	ruleStrong: string;
	accent: string;
	accentInk: string;
	accentSoft: string;
	blue: string;
	blueSoft: string;
	good: string;
	goodSoft: string;
	bad: string;
	badSoft: string;
	warn: string;
	warnSoft: string;
	/** Mugunghwa rose — due, resume, hot review. Distinct from moss `--accent`. */
	rose: string;
	roseInk: string;
	roseSoft: string;
	shadow1: string;
	shadow2: string;
	shadow3: string;
}

export interface TypeStacks {
	/** Journal nameplate and sitting titles (Newsreader). Named `--display`. */
	display: string;
	/** Article body (Source Serif 4). Headings fall back here if display is unset. */
	serif: string;
	/** Body and UI chrome. Named `--sans` in CSS for historical reasons. */
	sans: string;
	mono: string;
	hangul: string;
}

export interface ShapeTokens {
	rSm: string;
	rMd: string;
	rLg: string;
	rPill: string;
}

/** High-contrast ink/rule/accent/rose overrides. Not a full palette. */
export interface ContrastOverrides {
	inkFaint: string;
	rule: string;
	ruleStrong: string;
	accent: string;
	accentSoft: string;
	rose: string;
	roseSoft: string;
}

export interface FontFaceSpec {
	family: string;
	file: string;
	style?: 'normal' | 'italic';
	weight?: string;
	display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
	unicodeRange?: string;
}

export interface DesignSystem {
	id: string;
	name: string;
	fonts: FontFaceSpec[];
	type: TypeStacks;
	shape: ShapeTokens;
	/** Root `html` font-size (`--html-size`). */
	htmlSize: string;
	leading: string;
	light: Palette;
	dark: Palette;
	contrastMoreLight?: ContrastOverrides;
	contrastMoreDark?: ContrastOverrides;
}

export const PALETTE_CSS_VARS = {
	ink: '--ink',
	inkSoft: '--ink-soft',
	inkFaint: '--ink-faint',
	paper: '--paper',
	paperSunk: '--paper-sunk',
	paperRaised: '--paper-raised',
	rule: '--rule',
	ruleStrong: '--rule-strong',
	accent: '--accent',
	accentInk: '--accent-ink',
	accentSoft: '--accent-soft',
	blue: '--blue',
	blueSoft: '--blue-soft',
	good: '--good',
	goodSoft: '--good-soft',
	bad: '--bad',
	badSoft: '--bad-soft',
	warn: '--warn',
	warnSoft: '--warn-soft',
	rose: '--rose',
	roseInk: '--rose-ink',
	roseSoft: '--rose-soft',
	shadow1: '--shadow-1',
	shadow2: '--shadow-2',
	shadow3: '--shadow-3'
} as const satisfies Record<keyof Palette, string>;

export const TYPE_CSS_VARS = {
	display: '--display',
	serif: '--serif',
	sans: '--sans',
	mono: '--mono',
	hangul: '--hangul'
} as const satisfies Record<keyof TypeStacks, string>;

export const SHAPE_CSS_VARS = {
	rSm: '--r-sm',
	rMd: '--r-md',
	rLg: '--r-lg',
	rPill: '--r-pill'
} as const satisfies Record<keyof ShapeTokens, string>;

export const CONTRAST_CSS_VARS = {
	inkFaint: '--ink-faint',
	rule: '--rule',
	ruleStrong: '--rule-strong',
	accent: '--accent',
	accentSoft: '--accent-soft',
	rose: '--rose',
	roseSoft: '--rose-soft'
} as const satisfies Record<keyof ContrastOverrides, string>;
