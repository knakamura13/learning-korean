# Whole-Block Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Schedule a finite generated catalog of syllable-block cards in Review, answered by the same 2×2 tap grid as the sprint, without writing sprint results into SRS.

**Architecture:** Reuse `sprintInventory` for pools. Add `trialForBlock` in `sprint.ts` for a fixed target. `blockDeck.ts` builds deterministic `Card` records assigned to `lab02`–`lab05`. Review shows `SprintChoices` when `kind === 'block'` and grades via `progress.answer`.

**Tech Stack:** SvelteKit 2 + Svelte 5 runes, TypeScript, Vitest (node for domain, jsdom already used for SprintChoices). Existing `hangul.ts` `compose` / `romanizeSyllable`. Existing `SprintChoices.svelte`.

**Spec:** `docs/superpowers/specs/2026-08-20-whole-block-review-design.md`

## File structure

- Modify: `app/src/lib/domain/sprint.ts` — add `trialForBlock`; share option construction with `nextTrial`
- Modify: `app/src/lib/domain/sprint.test.ts` — `trialForBlock` tests
- Create: `app/src/lib/domain/blockDeck.ts` — counts, exclusive inventory, spread pick, cards
- Create: `app/src/lib/domain/blockDeck.test.ts`
- Modify: `app/src/lib/domain/deck.ts` — `CardKind`, `DECK`, `TIERS` labels/sizes
- Modify: `app/src/lib/domain/deck.test.ts` — kind filters, block grading
- Modify: `app/src/routes/review/+page.svelte` — tap UI for block cards
- Modify: `app/src/routes/review/reviewAnswerField.test.ts` — SprintChoices contract
- Modify: `app/src/lib/domain/reviewChrome.ts` / `reviewChrome.test.ts` only if placeholder grows a `block` branch (not required for tap UI)

## Global Constraints

- No mic, no speech scoring, no XP, streaks, loot, or leaderboards.
- Block cards mill unlocked letters only. No new `TIERS` id. Tiers stay `lab01`…`lab06`.
- `blockDeck.ts` and `sprint.ts` must not import `srs.ts`.
- Answers derived via `romanizeSyllable` only. Do not accept the Hangul glyph as an answer.
- Four unique same-length tap options. `SprintChoices` 2×2, 44px targets.
- Letter and `pron` cards stay typed. Do not change `DEFAULT_NEW_PER_DAY` or `DEFAULT_REVIEW_PER_SITTING`.
- Grade block taps with `progress.answer`, never `answerRound`.
- TDD: failing test first, watch it fail, then implement.
- Work from the repo root. App tests: `cd app && pnpm test <path>`.
- Commit per task. Do not push unless asked. Do not change files outside the task Files list.
- Svelte 5: run `npx @sveltejs/mcp svelte-autofixer` on any edited `.svelte` file before commit. Imports at top of file. Exhaustive `switch` on `CardKind` uses a `never` default if a switch is introduced.

---

### Task 1: trialForBlock

**Files:**
- Modify: `app/src/lib/domain/sprint.ts`
- Test: `app/src/lib/domain/sprint.test.ts`

**Interfaces:**
- Consumes: existing `SprintTrial`, `Rng`, `OPTION_COUNT`, `romanizeSyllable`, `nextTrial` internals
- Produces: `trialForBlock(block: string, pool: readonly string[], rng: Rng): SprintTrial | null`

- [ ] **Step 1: Write the failing tests**

Append to `app/src/lib/domain/sprint.test.ts` (add `trialForBlock` to the import list):

```ts
describe('trialForBlock', () => {
	it('uses the given block as the target with four unique same-length readings', () => {
		const pool = sprintInventory(['lab01', 'lab02']);
		const trial = trialForBlock('가', pool, seq([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
		expect(trial).not.toBeNull();
		if (!trial) return;
		expect(trial.block).toBe('가');
		expect(trial.options).toHaveLength(OPTION_COUNT);
		expect(new Set(trial.options).size).toBe(OPTION_COUNT);
		const len = trial.options[0].length;
		for (const option of trial.options) expect(option.length).toBe(len);
		expect(trial.options[trial.answerIndex]).toBe(romanizeSyllable('가'));
	});

	it('returns null when the pool cannot supply three same-length distractors', () => {
		expect(trialForBlock('가', ['가'], () => 0)).toBeNull();
		expect(trialForBlock('가', ['가', '나', '다'], () => 0)).toBeNull();
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /workspace/app && pnpm test src/lib/domain/sprint.test.ts`

Expected: FAIL because `trialForBlock` is not exported.

- [ ] **Step 3: Implement trialForBlock by extracting a shared helper**

In `sprint.ts`, extract the distractor/option construction currently inside `nextTrial` into a file-local function:

```ts
function optionsForBlock(
	block: string,
	pool: readonly string[],
	rng: Rng
): { options: string[]; answerIndex: number } | null {
	const answer = romanizeSyllable(block);
	if (!answer) return null;
	const distractors = new Set<string>();
	for (const other of pool) {
		if (other === block) continue;
		const reading = romanizeSyllable(other);
		if (reading && reading !== answer && reading.length === answer.length) {
			distractors.add(reading);
		}
	}
	if (distractors.size < OPTION_COUNT - 1) return null;
	const picked: string[] = [];
	const available = [...distractors];
	while (picked.length < OPTION_COUNT - 1 && available.length > 0) {
		const index = pickIndex(available.length, rng);
		picked.push(available.splice(index, 1)[0]);
	}
	if (picked.length < OPTION_COUNT - 1) return null;
	const options = shuffled([answer, ...picked], rng);
	return { options, answerIndex: options.indexOf(answer) };
}
```

`nextTrial` must call `optionsForBlock` after choosing `block` instead of duplicating that loop.

Add:

```ts
export function trialForBlock(
	block: string,
	pool: readonly string[],
	rng: Rng
): SprintTrial | null {
	if (!pool.includes(block)) return null;
	const built = optionsForBlock(block, pool, rng);
	if (!built) return null;
	return { block, options: built.options, answerIndex: built.answerIndex };
}
```

Do not import `srs`. Do not change `SPRINT_MS` or round helpers.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /workspace/app && pnpm test src/lib/domain/sprint.test.ts`

Expected: PASS. Existing `nextTrial` tests still pass.

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/domain/sprint.ts app/src/lib/domain/sprint.test.ts
git commit -m "feat: add trialForBlock for a fixed syllable target"
```

---

### Task 2: Generated block catalog

**Files:**
- Create: `app/src/lib/domain/blockDeck.ts`
- Create: `app/src/lib/domain/blockDeck.test.ts`

**Interfaces:**
- Consumes: `sprintInventory` from `./sprint`; `romanizeSyllable` from `./hangul`; `Card` type from `./deck` — **if importing `Card` from `deck.ts` creates a cycle, define the card object inline and type it in Task 3**. Prefer: `blockDeck.ts` does **not** import `deck.ts`. Export a plain object shape Task 3 maps, OR export functions that return `Card` after Task 3 moves the type. **Resolution:** put `blockInventory`, `pickSpread`, `BLOCK_COUNTS` in `blockDeck.ts`. Export `rawBlockEntries()` returning `{ id, front, ask, answers, note, tier, kind: 'block' }[]` without importing `deck.ts`. Task 3 types them as `Card`.
- Produces: `BLOCK_COUNTS`, `blockInventory`, `pickSpread`, `blockEntries`

- [ ] **Step 1: Write the failing tests**

Create `app/src/lib/domain/blockDeck.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /workspace/app && pnpm test src/lib/domain/blockDeck.test.ts`

Expected: FAIL, module not found.

- [ ] **Step 3: Implement blockDeck.ts**

Create `app/src/lib/domain/blockDeck.ts`:

```ts
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
```

The `default` branch of the `switch` must return `[]`. Do not import `deck.ts` or `srs.ts`.

If `blockEntries()` yields fewer than `BLOCK_COUNTS[tier]` because some readings are empty, that is a bug: fix the skip so tests fail until every picked block has a reading (inventory already comes from `compose`). Do not skip unless reading is empty; tests require exact counts, so empty readings must not occur. If they do, pick the next unused block from the sorted inventory until the count is met (still deterministic).

Preferred count-stable picker: `pickSpread` first, then if a reading is empty, walk the sorted inventory for replacements not already chosen until the count is met or the inventory is exhausted. Tests expect exact `BLOCK_COUNTS` — with current `sprintInventory` every block romanizes, so the simple map is enough. Use the simple map.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /workspace/app && pnpm test src/lib/domain/blockDeck.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/domain/blockDeck.ts app/src/lib/domain/blockDeck.test.ts
git commit -m "feat: generate a finite syllable-block review catalog"
```

---

### Task 3: Wire block cards into DECK

**Files:**
- Modify: `app/src/lib/domain/deck.ts`
- Modify: `app/src/lib/domain/deck.test.ts`

**Interfaces:**
- Consumes: `blockEntries` from `./blockDeck`
- Produces: `CardKind` includes `'block'`; `DECK` includes those entries as `Card`; `TIERS` sizes/labels match spec

- [ ] **Step 1: Write the failing tests**

In `app/src/lib/domain/deck.test.ts`, change phonology tests that assume every card in a tier is a jamo, and add a block describe:

Replace the lab04 loop to filter `kind === 'batchim'`. Replace the lab05 `toHaveLength(CLUSTERS.length)` to count `kind === 'cluster'` only.

Add import of `BLOCK_COUNTS` from `./blockDeck`.

Add:

```ts
describe('block cards', () => {
	it('schedules generated blocks inside lab02–lab05', () => {
		const blocks = DECK.filter((c) => c.kind === 'block');
		expect(blocks).toHaveLength(
			BLOCK_COUNTS.lab02 + BLOCK_COUNTS.lab03 + BLOCK_COUNTS.lab04 + BLOCK_COUNTS.lab05
		);
		expect(cardsOfTier('lab02').filter((c) => c.kind === 'block')).toHaveLength(BLOCK_COUNTS.lab02);
		expect(TIERS.find((t) => t.id === 'lab02')).toMatchObject({
			label: 'Vowels · blocks',
			size: cardsOfTier('lab02').length
		});
		expect(TIERS.find((t) => t.id === 'lab03')?.label).toBe('Compounds · blocks');
		expect(TIERS.find((t) => t.id === 'lab04')?.label).toBe('Batchim · blocks');
		expect(TIERS.find((t) => t.id === 'lab05')?.label).toBe('Clusters · blocks');
	});

	it('grades the derived reading and rejects the glyph', () => {
		const card = DECK.find((c) => c.kind === 'block');
		expect(card).toBeDefined();
		if (!card) return;
		expect(checkAnswer(card, card.answers[0])).toBe(true);
		expect(checkAnswer(card, card.front)).toBe(false);
		expect(checkAnswer(card, '')).toBe(false);
	});
});
```

The existing `gives every batchim card the sound` test must use `cardsOfTier('lab04').filter((c) => c.kind === 'batchim')`.

The existing `gives every cluster card` test must use `cardsOfTier('lab05').filter((c) => c.kind === 'cluster')` and expect that list’s length to equal `CLUSTERS.length`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /workspace/app && pnpm test src/lib/domain/deck.test.ts`

Expected: FAIL on missing `kind === 'block'` cards and old labels.

- [ ] **Step 3: Minimal deck.ts changes**

1. `import { blockEntries } from './blockDeck';`
2. `export type CardKind = 'consonant' | 'vowel' | 'compound' | 'build' | 'batchim' | 'cluster' | 'pron' | 'block';`
3. After assembling letter arrays, `const blockCatalog: Card[] = blockEntries();`
4. `export const DECK: Card[] = [ ...existing, ...blockCatalog ];`
5. Update `TIERS`:

```ts
export const TIERS: Tier[] = [
	{ id: 'lab01', label: 'Consonants', lab: '0001', size: consonants.length },
	{ id: 'lab02', label: 'Vowels · blocks', lab: '0002', size: vowels.length + BLOCK_COUNTS.lab02 },
	{ id: 'lab03', label: 'Compounds · blocks', lab: '0003', size: compounds.length + construction.length + BLOCK_COUNTS.lab03 },
	{ id: 'lab04', label: 'Batchim · blocks', lab: '0004', size: batchim.length + BLOCK_COUNTS.lab04 },
	{ id: 'lab05', label: 'Clusters · blocks', lab: '0005', size: clusters.length + BLOCK_COUNTS.lab05 },
	{ id: 'lab06', label: 'Liaison', lab: '0006', size: liaison.length }
];
```

Import `BLOCK_COUNTS` from `./blockDeck` for those sizes. Prefer `size: cardsOfTier` is computed after DECK — but `cardsOfTier` uses DECK, so either compute sizes from array lengths as above or:

```ts
size: vowels.length + blockCatalog.filter((c) => c.tier === 'lab02').length
```

Use `blockCatalog.filter` so sizes cannot drift from `BLOCK_COUNTS` vs skipped empty readings.

`checkAnswer` stays as-is for non-pron (block uses ASCII normalize). Confirm `card.front` Hangul does not equal `answers[0]` so glyph rejection works without a special case.

- [ ] **Step 4: Run tests**

Run: `cd /workspace/app && pnpm test src/lib/domain/deck.test.ts src/lib/content/content.test.ts src/lib/domain/reviewChrome.test.ts src/lib/stores/progress.test.ts`

Expected: PASS. `content.test.ts` still 1:1 lab unlocks to TIERS ids.

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/domain/deck.ts app/src/lib/domain/deck.test.ts
git commit -m "feat: add generated block cards to the review deck"
```

---

### Task 4: Review tap UI for block cards

**Files:**
- Modify: `app/src/routes/review/+page.svelte`
- Modify: `app/src/routes/review/reviewAnswerField.test.ts`

**Interfaces:**
- Consumes: `trialForBlock` from `$lib/domain/sprint`; `blockInventory` from `$lib/domain/blockDeck`; `SprintChoices`; `sprintInventory` as fallback pool
- Produces: block cards answered by one tap; `progress.answer` still records the grade

- [ ] **Step 1: Write the failing source tests**

Append to `app/src/routes/review/reviewAnswerField.test.ts`:

```ts
	it('answers block cards with SprintChoices, not the typed field', () => {
		expect(src).toMatch(/from '\$lib\/components\/SprintChoices\.svelte'/);
		expect(src).toMatch(/trialForBlock/);
		expect(src).toMatch(/blockInventory/);
		expect(src).toMatch(/card\.kind === 'block'/);
		expect(src).toMatch(/progress\.answer\(card\.id/);
		expect(src).not.toMatch(/answerRound/);
	});
```

Keep existing input-label tests: they may still match the letter-card branch that remains in the file. If a test requires the input to always exist, that is wrong for the block branch — keep the input in the letter/`pron` branch only. Existing tests that `src` matches `id="review-answer"` still pass because that markup stays for non-block cards.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /workspace/app && pnpm test src/routes/review/reviewAnswerField.test.ts`

Expected: FAIL, no SprintChoices import.

- [ ] **Step 3: Implement the Review branch**

In `+page.svelte`:

Imports at top (no inline imports):

```ts
import SprintChoices from '$lib/components/SprintChoices.svelte';
import { sprintInventory, trialForBlock, type SprintTrial } from '$lib/domain/sprint';
import { blockInventory } from '$lib/domain/blockDeck';
```

State:

```ts
let blockTrial = $state<SprintTrial | null>(null);
let choices = $state<SprintChoices | undefined>();
```

`const blockCard = $derived(card?.kind === 'block');`

Add helper (module-level in the script, not inside a function if it needs no closure — it can be a function in the script):

```ts
function poolForBlock(tier: string): string[] {
	const exclusive = blockInventory(tier);
	const order = ['lab01', 'lab02', 'lab03', 'lab04', 'lab05', 'lab06'];
	const idx = order.indexOf(tier);
	const fallback = sprintInventory(order.slice(0, Math.max(idx + 1, 2)));
	return exclusive.length ? exclusive : fallback;
}

function makeBlockTrial(front: string, tier: string): SprintTrial | null {
	const rng = Math.random;
	return (
		trialForBlock(front, blockInventory(tier), rng) ??
		trialForBlock(front, poolForBlock(tier), rng)
	);
}
```

In `reset()`, after setting `startedAt`:

```ts
blockTrial = null;
const current = queue[index];
if (current?.kind === 'block') {
	blockTrial = makeBlockTrial(current.front, current.tier);
}
sittingNew = Boolean(current && !progress.state.cards[current.id]);
await tick();
if (!current || current.kind === 'block') {
	/* do not focus the missing input */
} else {
	input?.focus({ preventScroll: true });
}
```

Do not call `input?.focus` when `current?.kind === 'block'` or when `current` is missing.

`pickBlock(index: number)`:

```ts
function pickBlock(index: number) {
	if (answered || !blockTrial || !card) return;
	const value = blockTrial.options[index];
	if (!value) return;
	const ms = Date.now() - startedAt;
	const ok = checkAnswer(card, value);
	const result = progress.answer(card.id, ok, ms);
	answered = true;
	shown += 1;
	if (ok) right += 1;
	verdict = {
		ok,
		speed: ok ? attemptSpeed(ms) : '',
		when: reviewIntervalCopy(result.card.ivl)
	};
}
```

Reuse the same verdict shape as `submit()`.

`onKey`: if `blockCard && !answered`, `choices?.keyPick(e.key)` then return (still ignore when `shouldIgnoreShortcut`). Keep Enter-to-next when `answered`.

Markup inside the sitting card: wrap the existing `<form>…</form>` in `{#if !blockCard || !blockTrial}`. In `{:else}` show:

```svelte
<div class="block-answer">
	{#key index}
		<SprintChoices
			bind:this={choices}
			options={blockTrial.options}
			onPick={pickBlock}
			disabled={answered}
		/>
	{/key}
	{#if answered}
		<button class="btn" type="button" use:focusWhen={answered} onclick={next}>Next</button>
		<span class="kb">or press Enter</span>
	{/if}
</div>
```

Use `blockTrial` non-null in that branch (`{:else if blockTrial}`).

Keep the feedback block as-is (answers[0] reveal is the derived RR).

CSS: `.block-answer` uses the same vertical gap as the form. Next button `min-height: 44px`. 2×2 grid comes from SprintChoices. Do not add a timer.

After edits, from `app/`:

```bash
npx @sveltejs/mcp svelte-autofixer src/routes/review/+page.svelte
```

Fix any issues it reports. Then re-run it until clean.

- [ ] **Step 4: Run tests**

Run: `cd /workspace/app && pnpm test src/routes/review/reviewAnswerField.test.ts src/lib/domain/deck.test.ts src/lib/domain/blockDeck.test.ts src/lib/domain/sprint.test.ts src/lib/polish.test.ts`

Then: `cd /workspace/app && pnpm check`

Expected: tests PASS, `pnpm check` 0 errors.

- [ ] **Step 5: Commit**

```bash
git add app/src/routes/review/+page.svelte app/src/routes/review/reviewAnswerField.test.ts
git commit -m "feat: grade review block cards with the sprint tap grid"
```

---

## Self-review

1. Spec coverage: `trialForBlock` → Task 1. Catalog → Task 2. DECK/TIERS/kind → Task 3. Review UI, fallback pool, no `answerRound` → Task 4. Out-of-scope items have no tasks.
2. No TBD placeholders.
3. Names: `trialForBlock`, `blockInventory`, `blockEntries`, `BLOCK_COUNTS`, `BlockEntry.kind: 'block'` match across tasks.
