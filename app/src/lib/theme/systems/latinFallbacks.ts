import type { FontFaceSpec } from '../types.ts';
import { LATIN_UNICODE_RANGE } from './botanicalKorea.ts';

const SERIF_LOCALS = ['Iowan Old Style', 'Palatino Linotype', 'Palatino', 'Georgia'] as const;

/** Self-hosted Latin face: optional display so a late swap cannot shift layout. */
export function optionalLatinFace(
	partial: Pick<FontFaceSpec, 'family' | 'file' | 'style' | 'weight'>
): FontFaceSpec {
	return { ...partial, display: 'optional', unicodeRange: LATIN_UNICODE_RANGE };
}

function metricFallback(
	family: string,
	style: 'normal' | 'italic',
	ascentOverride: string,
	descentOverride: string
): FontFaceSpec {
	return {
		family,
		local: [...SERIF_LOCALS],
		style,
		weight: '400',
		display: 'optional',
		ascentOverride,
		descentOverride,
		lineGapOverride: '0%'
	};
}

/** hhea metrics from CormorantGaramond-Regular/Italic.woff2 (1000 UPM). */
export const CORMORANT_FALLBACKS: FontFaceSpec[] = [
	metricFallback('Cormorant Garamond Fallback', 'normal', '92.4%', '28.7%'),
	metricFallback('Cormorant Garamond Fallback', 'italic', '92.4%', '28.7%')
];

/** hhea metrics from Lora-Regular/Italic.woff2 (1000 UPM). */
export const LORA_FALLBACKS: FontFaceSpec[] = [
	metricFallback('Lora Fallback', 'normal', '100.6%', '27.4%'),
	metricFallback('Lora Fallback', 'italic', '100.6%', '27.4%')
];

/** hhea metrics from LibreBaskerville-Regular/Italic.woff2 (1000 UPM). */
export const LIBRE_BASKERVILLE_FALLBACKS: FontFaceSpec[] = [
	metricFallback('Libre Baskerville Fallback', 'normal', '97%', '27%'),
	metricFallback('Libre Baskerville Fallback', 'italic', '97%', '27%')
];
