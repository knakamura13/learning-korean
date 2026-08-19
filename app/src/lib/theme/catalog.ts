import { academia } from './systems/academia';
import { botanicalKorea } from './systems/botanicalKorea';
import { taegeuk } from './systems/taegeuk';
import { watercolor } from './systems/watercolor';
import type { DesignSystem } from './types';

export const LOOK_IDS = ['botanicalKorea', 'taegeuk', 'watercolor', 'academia'] as const;
export type LookId = (typeof LOOK_IDS)[number];
export const DEFAULT_LOOK_ID: LookId = 'botanicalKorea';
export const LOOKS: DesignSystem[] = [botanicalKorea, taegeuk, watercolor, academia];

export function isLookId(value: string | null): value is LookId {
	return value !== null && (LOOK_IDS as readonly string[]).includes(value);
}
