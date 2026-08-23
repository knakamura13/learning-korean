import type { ContrastOverrides, DesignSystem, Palette } from './types';
import { expect } from 'vitest';
import { contrastRatio } from './contrast';

type PaletteKey = keyof Palette;

export interface PalettePairing {
	fg: PaletteKey;
	bg: PaletteKey;
	min: number;
}

/**
 * Text and status colours the UI actually paints.
 * Floors are WCAG 2.2 AAA (7:1) for normal text — issue #142 stretch.
 * Soft-surface status inks are included; they used to sit at AA only.
 */
export const TEXT_PAIRINGS: readonly PalettePairing[] = [
	{ fg: 'inkFaint', bg: 'paper', min: 7 },
	{ fg: 'inkFaint', bg: 'paperRaised', min: 7 },
	{ fg: 'inkFaint', bg: 'paperSunk', min: 7 },
	{ fg: 'inkSoft', bg: 'paper', min: 7 },
	{ fg: 'inkSoft', bg: 'paperSunk', min: 7 },
	{ fg: 'ink', bg: 'paper', min: 7 },
	{ fg: 'ink', bg: 'paperSunk', min: 7 },
	{ fg: 'accent', bg: 'paper', min: 7 },
	{ fg: 'accent', bg: 'paperRaised', min: 7 },
	{ fg: 'accent', bg: 'paperSunk', min: 7 },
	{ fg: 'accent', bg: 'accentSoft', min: 7 },
	{ fg: 'accent', bg: 'accentInk', min: 7 },
	{ fg: 'rose', bg: 'paper', min: 7 },
	{ fg: 'rose', bg: 'roseSoft', min: 7 },
	{ fg: 'good', bg: 'paper', min: 7 },
	{ fg: 'good', bg: 'goodSoft', min: 7 },
	{ fg: 'blue', bg: 'paper', min: 7 },
	{ fg: 'warn', bg: 'paper', min: 7 },
	{ fg: 'warn', bg: 'warnSoft', min: 7 },
	{ fg: 'bad', bg: 'paper', min: 7 },
	{ fg: 'bad', bg: 'badSoft', min: 7 }
];

/** Control borders that identify inputs, chips, and lanes (WCAG 1.4.11). */
export const BORDER_PAIRINGS: readonly PalettePairing[] = [
	{ fg: 'ruleStrong', bg: 'paper', min: 3 },
	{ fg: 'ruleStrong', bg: 'paperRaised', min: 3 },
	{ fg: 'ruleStrong', bg: 'paperSunk', min: 3 }
];

export type ResolvedPaletteState = {
	system: DesignSystem;
	scheme: 'light' | 'dark';
	contrastMore: boolean;
	palette: Palette;
};

export function resolvePalette(
	system: DesignSystem,
	scheme: 'light' | 'dark',
	contrastMore: boolean
): Palette {
	const base = system[scheme];
	if (!contrastMore) return base;
	const overrides: ContrastOverrides | undefined =
		scheme === 'light' ? system.contrastMoreLight : system.contrastMoreDark;
	return overrides ? { ...base, ...overrides } : base;
}

export function paletteStates(system: DesignSystem): ResolvedPaletteState[] {
	const states: ResolvedPaletteState[] = [];
	for (const scheme of ['light', 'dark'] as const) {
		for (const contrastMore of [false, true]) {
			states.push({
				system,
				scheme,
				contrastMore,
				palette: resolvePalette(system, scheme, contrastMore)
			});
		}
	}
	return states;
}

export function pairingLabel(
	state: ResolvedPaletteState,
	pairing: PalettePairing
): string {
	const contrast = state.contrastMore ? '/contrast-more' : '';
	return `${state.system.id}/${state.scheme}${contrast} ${pairing.fg} on ${pairing.bg}`;
}

export function assertPairings(
	states: readonly ResolvedPaletteState[],
	pairings: readonly PalettePairing[]
): void {
	for (const state of states) {
		for (const pairing of pairings) {
			const ratio = contrastRatio(state.palette[pairing.fg], state.palette[pairing.bg]);
			expect(ratio, pairingLabel(state, pairing)).toBeGreaterThanOrEqual(pairing.min);
		}
	}
}

/** sRGB color-mix(in srgb, a pct%, b) for derived hero copy. */
export function mixSrgb(a: string, b: string, pctA: number): string {
	const parse = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
	const ca = parse(a);
	const cb = parse(b);
	const w = pctA / 100;
	const mixed = ca.map((c, i) => Math.round(c * w + cb[i]! * (1 - w)));
	return `#${mixed.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
