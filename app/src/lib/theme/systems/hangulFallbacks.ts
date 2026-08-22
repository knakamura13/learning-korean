/**
 * hangulFallbacks.ts — the metric-matched Hangul fallback face, shared by
 * every look. Botanical Korea shipped this guard first (see its inline
 * definition); the other looks reference the same stack and face so a slow
 * Noto Sans KR load cannot shift layout on any of them. The overrides map
 * the platform Gothic faces onto Noto Sans KR's vertical metrics.
 */

import type { FontFaceSpec } from '../types.ts';

export const HANGUL_WITH_FALLBACK =
	"'Noto Sans KR', 'Noto Sans KR Fallback', 'Apple SD Gothic Neo', 'Malgun Gothic', 'Nanum Gothic', sans-serif";

export const NOTO_SANS_KR_FALLBACK: FontFaceSpec = {
	family: 'Noto Sans KR Fallback',
	local: ['Apple SD Gothic Neo', 'Malgun Gothic', 'Nanum Gothic'],
	style: 'normal',
	weight: '400',
	display: 'optional',
	ascentOverride: '116%',
	descentOverride: '28.8%',
	lineGapOverride: '0%'
};
