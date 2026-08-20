import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { compose, romanizeSyllable } from './hangul';
import {
	BLOCK_COUNTS,
	blockEntries,
	blockInventory,
	pickSpread
} from './blockDeck';
import { sprintInventory } from './sprint';

describe('blockInventory', () => {
	it('is CV only for lab02', () => {
		const blocks = blockInventory('lab02');
		expect(blocks).toContain('가');
		expect(blocks).toContain(compose('ㅇ', 'ㅏ'));
		expect(blocks).not.toContain('개');
		expect(blocks).not.toContain('각');
		expect(blocks).toHaveLength(sprintInventory(['lab01', 'lab02']).length);
	});

	it('adds only new shapes for later tiers', () => {
		expect(blockInventory('lab03')).toContain('개');
		expect(blockInventory('lab03')).not.toContain('가');
		expect(blockInventory('lab04')).toContain('각');
		expect(blockInventory('lab04')).not.toContain('가');
		expect(blockInventory('lab04')).not.toContain('앉');
		expect(blockInventory('lab05')).toContain('앉');
		expect(blockInventory('lab01')).toEqual([]);
		expect(blockInventory('lab06')).toEqual([]);
	});
});

describe('pickSpread', () => {
	it('is deterministic, sorted, and unique', () => {
		const items = ['다', '가', '나', '라', '마'];
		expect(pickSpread(items, 3)).toEqual(pickSpread(items, 3));
		expect(pickSpread(items, 10)).toEqual([...items].sort((a, b) => a.localeCompare(b, 'ko')));
		const picked = pickSpread(items, 3);
		expect(new Set(picked).size).toBe(3);
	});
});

describe('blockEntries', () => {
	it('emits the catalog counts with derived readings', () => {
		const entries = blockEntries();
		expect(entries.filter((e) => e.tier === 'lab02')).toHaveLength(BLOCK_COUNTS.lab02);
		expect(entries.filter((e) => e.tier === 'lab03')).toHaveLength(BLOCK_COUNTS.lab03);
		expect(entries.filter((e) => e.tier === 'lab04')).toHaveLength(BLOCK_COUNTS.lab04);
		expect(entries.filter((e) => e.tier === 'lab05')).toHaveLength(BLOCK_COUNTS.lab05);
		expect(entries).toHaveLength(
			BLOCK_COUNTS.lab02 + BLOCK_COUNTS.lab03 + BLOCK_COUNTS.lab04 + BLOCK_COUNTS.lab05
		);
		const ids = entries.map((e) => e.id);
		expect(new Set(ids).size).toBe(ids.length);
		for (const e of entries) {
			expect(e.id).toBe(`blk-${e.front}`);
			expect(e.kind).toBe('block');
			expect(e.ask).toBe('how does this block sound?');
			expect(e.note).toBe('Read the whole syllable, not the letters.');
			expect(e.answers).toEqual([romanizeSyllable(e.front)]);
			expect(e.answers[0].length).toBeGreaterThan(0);
		}
	});
});

describe('blockDeck isolation', () => {
	it('does not import srs', () => {
		const src = readFileSync(new URL('./blockDeck.ts', import.meta.url), 'utf8');
		expect(src).not.toMatch(/from '\.\/srs'/);
		expect(src).not.toMatch(/from '\.\/deck'/);
	});
});
