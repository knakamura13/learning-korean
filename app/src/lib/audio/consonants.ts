import { letterAudioSources } from './letters';
import { LEADS, type Lead } from '$lib/domain/hangul';

export { LEAD_AUDIO_SLUG as CONSONANT_AUDIO_SLUG } from './letters';

export function isConsonantLead(jamo: string): jamo is Lead {
	return (LEADS as readonly string[]).includes(jamo);
}

export function consonantAudioSrc(jamo: string): string | null {
	return letterAudioSources(jamo, 'lead')?.opus ?? null;
}
