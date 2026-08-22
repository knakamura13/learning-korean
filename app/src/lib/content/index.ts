import type { Lab } from './types';
import { lab01 } from './lab01';
import { lab02 } from './lab02';
import { lab03 } from './lab03';
import { lab04 } from './lab04';
import { lab05 } from './lab05';
import { lab06 } from './lab06';
import { lab07 } from './lab07';
import { lab08 } from './lab08';
import { lab09 } from './lab09';
import { lab10 } from './lab10';

/** Every lab, in course order. */
export const LABS: Lab[] = [lab01, lab02, lab03, lab04, lab05, lab06, lab07, lab08, lab09, lab10];

export const LABS_BY_ID: Record<string, Lab> = Object.fromEntries(LABS.map((l) => [l.id, l]));

export function labForTier(tier: string): Lab | undefined {
	return LABS.find((l) => l.unlocks === tier);
}

export * from './types';
