import type { DesignSystem, FontFaceSpec, Palette } from './types.ts';
import { PALETTE_CSS_VARS } from './types.ts';

const HANGUL_FACE = `@font-face {
	font-family: 'Noto Sans KR';
	font-style: normal;
	font-weight: 400 600;
	font-display: optional;
	src: url('/fonts/NotoSansKR-subset.woff2') format('woff2');
}`;

function fontFaceCss(face: FontFaceSpec): string {
	const style = face.style ?? 'normal';
	const weight = face.weight ?? '400';
	return `@font-face {
	font-family: '${face.family}';
	font-style: ${style};
	font-weight: ${weight};
	font-display: swap;
	src: url('/fonts/${face.file}') format('woff2');
}`;
}

function paletteDeclarations(palette: Palette, extra?: Partial<Palette>): string {
	const merged = { ...palette, ...extra };
	const lines: string[] = [];
	for (const key of Object.keys(PALETTE_CSS_VARS) as (keyof Palette)[]) {
		lines.push(`	${PALETTE_CSS_VARS[key]}: ${merged[key]};`);
	}
	return lines.join('\n');
}

function shapeDeclarations(system: DesignSystem): string {
	return [
		`	--r-sm: ${system.shape.rSm};`,
		`	--r-md: ${system.shape.rMd};`,
		`	--r-lg: ${system.shape.rLg};`,
		`	--r-pill: ${system.shape.rPill};`
	].join('\n');
}

function sharedDeclarations(system: DesignSystem): string {
	return [
		`	--s1: 0.25rem;`,
		`	--s2: 0.5rem;`,
		`	--s3: 0.75rem;`,
		`	--s4: 1rem;`,
		`	--s5: 1.5rem;`,
		`	--s6: 2rem;`,
		`	--s7: 3rem;`,
		`	--s8: 4rem;`,
		`	--s9: 6rem;`,
		shapeDeclarations(system),
		`	--focus-ring: 0 0 0 3px color-mix(in srgb, var(--blue) 35%, transparent), 0 0 0 1px var(--blue);`,
		`	--ease: cubic-bezier(0.22, 1, 0.36, 1);`,
		`	--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);`,
		`	--fast: 130ms;`,
		`	--med: 240ms;`,
		`	--slow: 420ms;`,
		`	--measure: 36rem;`,
		`	--shell: 62rem;`,
		`	--leading: ${system.leading};`
	].join('\n');
}

function darkBlock(system: DesignSystem): string {
	return paletteDeclarations(system.dark);
}

/** CSS custom properties + font faces for a design system. */
export function designSystemCss(system: DesignSystem): string {
	const faces = [HANGUL_FACE, ...system.fonts.map(fontFaceCss)].join('\n\n');
	const dark = darkBlock(system);
	const moreLight = system.contrastMoreLight
		? paletteDeclarations(system.light, system.contrastMoreLight)
		: '';
	const moreDark = system.contrastMoreDark
		? paletteDeclarations(system.dark, system.contrastMoreDark)
		: '';

	return `/* Generated from src/lib/theme/systems/${system.id}.ts — do not edit by hand. */

${faces}

:root {
${paletteDeclarations(system.light)}
${sharedDeclarations(system)}
}

:root[data-theme='dark'] {
${dark}
}

@media (prefers-color-scheme: dark) {
	:root:not([data-theme='light']) {
${dark}
	}
}

${
	moreLight
		? `@media (prefers-contrast: more) {
	:root {
${moreLight}
	}

	:root[data-theme='dark'] {
${moreDark}
	}
}

@media (prefers-color-scheme: dark) and (prefers-contrast: more) {
	:root:not([data-theme='light']) {
${moreDark}
	}
}`
		: ''
}

html {
	font-size: ${system.htmlSize};
}

body {
	line-height: var(--leading);
	background-color: var(--paper);
	background-image: var(--atmosphere);
}
`;
}
