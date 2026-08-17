/** sRGB relative luminance (WCAG 2). */
export function relativeLuminance(hex: string): number {
	const raw = hex.replace('#', '');
	const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
	const toLinear = (channel: number) => {
		const c = channel / 255;
		return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	};
	const r = toLinear(parseInt(full.slice(0, 2), 16));
	const g = toLinear(parseInt(full.slice(2, 4), 16));
	const b = toLinear(parseInt(full.slice(4, 6), 16));
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
	const l1 = relativeLuminance(a);
	const l2 = relativeLuminance(b);
	const hi = Math.max(l1, l2);
	const lo = Math.min(l1, l2);
	return (hi + 0.05) / (lo + 0.05);
}
