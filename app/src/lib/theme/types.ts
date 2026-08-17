/**
 * Semantic colour tokens every design system must fill.
 *
 * Components speak only this vocabulary (`var(--ink)`, `var(--paper)`, …).
 * A new look is a new `DesignSystem` that maps its palette onto these names.
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
	shadow1: string;
	shadow2: string;
	shadow3: string;
	/** Headings. */
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

export interface FontFaceSpec {
	family: string;
	file: string;
	style?: 'normal' | 'italic';
	weight?: string;
}

export interface DesignSystem {
	id: string;
	name: string;
	fonts: FontFaceSpec[];
	shape: ShapeTokens;
	/** Root `html` font-size. */
	htmlSize: string;
	leading: string;
	light: Palette;
	dark: Palette;
	contrastMoreLight?: Partial<Palette>;
	contrastMoreDark?: Partial<Palette>;
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
	shadow1: '--shadow-1',
	shadow2: '--shadow-2',
	shadow3: '--shadow-3',
	serif: '--serif',
	sans: '--sans',
	mono: '--mono',
	hangul: '--hangul'
} as const satisfies Record<keyof Palette, string>;
