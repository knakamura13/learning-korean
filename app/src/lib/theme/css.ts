import {
	CONTRAST_CSS_VARS,
	PALETTE_CSS_VARS,
	SHAPE_CSS_VARS,
	TYPE_CSS_VARS,
	type ContrastOverrides,
	type DesignSystem,
	type FontFaceSpec
} from './types.ts';

function cssVars<K extends string>(vars: Record<K, string>, values: Record<K, string>): string {
	return (Object.keys(vars) as K[]).map((key) => `	${vars[key]}: ${values[key]};`).join('\n');
}

function fontSrc(face: FontFaceSpec): string {
	const parts: string[] = [];
	for (const name of face.local ?? []) {
		parts.push(`local('${name}')`);
	}
	if (face.file) {
		parts.push(`url('/fonts/${face.file}') format('woff2')`);
	}
	return parts.length ? `\n	src: ${parts.join(', ')};` : '';
}

function fontFaceCss(face: FontFaceSpec): string {
	const style = face.style ?? 'normal';
	const weight = face.weight ?? '400';
	const display = face.display ?? 'swap';
	const range = face.unicodeRange ? `\n	unicode-range: ${face.unicodeRange};` : '';
	const ascent = face.ascentOverride ? `\n	ascent-override: ${face.ascentOverride};` : '';
	const descent = face.descentOverride ? `\n	descent-override: ${face.descentOverride};` : '';
	const lineGap = face.lineGapOverride ? `\n	line-gap-override: ${face.lineGapOverride};` : '';
	return `@font-face {
	font-family: '${face.family}';
	font-style: ${style};
	font-weight: ${weight};
	font-display: ${display};${fontSrc(face)}${range}${ascent}${descent}${lineGap}
}`;
}

function contrastBlock(selector: string, overrides: ContrastOverrides): string {
	return `	${selector} {
${cssVars(CONTRAST_CSS_VARS, overrides)}
	}`;
}

function contrastCss(system: DesignSystem): string {
	const light = system.contrastMoreLight;
	const dark = system.contrastMoreDark;
	if (!light && !dark) return '';

	const blocks: string[] = [];
	if (light) blocks.push(contrastBlock(':root', light));
	if (dark) blocks.push(contrastBlock(":root[data-theme='dark']", dark));

	let css = `@media (prefers-contrast: more) {
${blocks.join('\n\n')}
}`;
	if (dark) {
		css += `

@media (prefers-color-scheme: dark) and (prefers-contrast: more) {
${contrastBlock(":root:not([data-theme='light'])", dark)}
}`;
	}
	return css;
}

function rootDeclarations(system: DesignSystem): string {
	return [
		cssVars(PALETTE_CSS_VARS, system.light),
		cssVars(TYPE_CSS_VARS, system.type),
		cssVars(SHAPE_CSS_VARS, system.shape),
		`	--html-size: ${system.htmlSize};`,
		`	--leading: ${system.leading};`
	].join('\n');
}

/** CSS custom properties + font faces for a design system. App chrome stays in app.css. */
export function designSystemCss(system: DesignSystem): string {
	const faces = system.fonts.map(fontFaceCss).join('\n\n');
	const dark = cssVars(PALETTE_CSS_VARS, system.dark);
	const more = contrastCss(system);

	return `/* Generated from src/lib/theme/systems/${system.id}.ts — do not edit by hand. */

${faces}

:root {
${rootDeclarations(system)}
}

:root[data-theme='dark'] {
${dark}
}

@media (prefers-color-scheme: dark) {
	:root:not([data-theme='light']) {
${dark}
	}
}

${more}
`;
}
