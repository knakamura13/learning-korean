import type { Lab } from './types';
import { lab01 } from './lab01';
import { lab02 } from './lab02';
import { lab03 } from './lab03';
import { lab04 } from './lab04';
import { lab05 } from './lab05';
import { lab06 } from './lab06';

/** Every lab, in course order. */
export const LABS: Lab[] = [lab01, lab02, lab03, lab04, lab05, lab06];

export const LABS_BY_ID: Record<string, Lab> = Object.fromEntries(LABS.map((l) => [l.id, l]));

export function labForTier(tier: string): Lab | undefined {
	return LABS.find((l) => l.unlocks === tier);
}

export * from './types';
