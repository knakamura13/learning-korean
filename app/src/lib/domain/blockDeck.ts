import { romanizeSyllable } from './hangul';
import { sprintInventory } from './sprint';

export const BLOCK_COUNTS = {
	lab02: 20,
	lab03: 10,
	lab04: 15,
	lab05: 10
} as const;

export type BlockTier = keyof typeof BLOCK_COUNTS;

const ASK = 'how does this block sound?';
const NOTE = 'Read the whole syllable, not the letters.';

export function blockInventory(tier: string): string[] {
	switch (tier) {
		case 'lab02':
			return sprintInventory(['lab01', 'lab02']);
		case 'lab03':
			return minus(
				sprintInventory(['lab01', 'lab02', 'lab03']),
				sprintInventory(['lab01', 'lab02'])
			);
		case 'lab04':
			return minus(
				sprintInventory(['lab01', 'lab02', 'lab03', 'lab04']),
				sprintInventory(['lab01', 'lab02', 'lab03'])
			);
		case 'lab05':
			return minus(
				sprintInventory(['lab01', 'lab02', 'lab03', 'lab04', 'lab05']),
				sprintInventory(['lab01', 'lab02', 'lab03', 'lab04'])
			);
		default: {
			return [];
		}
	}
}

function minus(full: string[], subtract: string[]): string[] {
	const drop = new Set(subtract);
	return full.filter((block) => !drop.has(block));
}

export function pickSpread(items: readonly string[], n: number): string[] {
	const sorted = [...items].sort((a, b) => a.localeCompare(b, 'ko'));
	if (sorted.length <= n) return sorted;
	const out: string[] = [];
	const used = new Set<number>();
	for (let i = 0; i < n; i++) {
		let idx = Math.floor(((i + 0.5) * sorted.length) / n);
		idx = Math.min(sorted.length - 1, Math.max(0, idx));
		while (used.has(idx)) idx = (idx + 1) % sorted.length;
		used.add(idx);
		out.push(sorted[idx]);
	}
	return out;
}

export interface BlockEntry {
	id: string;
	front: string;
	ask: string;
	answers: string[];
	note: string;
	tier: BlockTier;
	kind: 'block';
}

export function blockEntries(): BlockEntry[] {
	const tiers: BlockTier[] = ['lab02', 'lab03', 'lab04', 'lab05'];
	const out: BlockEntry[] = [];
	for (const tier of tiers) {
		for (const block of pickSpread(blockInventory(tier), BLOCK_COUNTS[tier])) {
			const reading = romanizeSyllable(block);
			if (!reading) continue;
			out.push({
				id: `blk-${block}`,
				front: block,
				ask: ASK,
				answers: [reading],
				note: NOTE,
				tier,
				kind: 'block'
			});
		}
	}
	return out;
}
