# Timed Block Sprint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a `/drill` timed block sprint that trains cold syllable-block decoding on unlocked letters only, reports median correct-tap milliseconds, and never writes the Review scheduler.

**Architecture:** Pure domain in `sprint.ts` (inventory, trial, round; clock and RNG injected). `SprintChoices.svelte` is a one-shot 2×2 tap grid. `/drill` is a prerendered client page that hydrates eligibility from `progress`. Nav, Home, and Review-clear are entry points only.

**Tech Stack:** SvelteKit 2 + Svelte 5 runes, TypeScript, Vitest (node for domain, jsdom docblock for components), existing `hangul.ts` `compose` / `romanizeSyllable` / `LEADS` / `VOWELS` / `FINALS` / `CLUSTERS`.

**Spec:** `docs/superpowers/specs/2026-08-20-timed-block-sprint-design.md`

## File structure

- Create: `app/src/lib/domain/sprint.ts` — eligibility, inventory, trial, round, score
- Create: `app/src/lib/domain/sprint.test.ts`
- Create: `app/src/lib/components/SprintChoices.svelte` — one-shot four-option grid
- Create: `app/src/lib/components/SprintChoices.test.ts`
- Create: `app/src/routes/drill/+page.svelte`
- Create: `app/src/routes/drill/drill-page.test.ts`
- Modify: `app/src/routes/+layout.svelte` — Drill nav item
- Modify: `app/src/routes/+page.svelte` — Block sprint section
- Modify: `app/src/routes/review/+page.svelte` — clear-state CTA
- Modify: `app/src/lib/polish.test.ts` — nav / home / review copy contracts

## Global Constraints

- No mic, no speech scoring, no XP, streaks, loot, or leaderboards.
- Mill only on `unlocked` tiers, never skip-ahead `openedLabs`.
- Do not import `srs.ts` from `sprint.ts`. Do not call `progress.answer` or `grade` from `/drill`.
- Four options, identical string length, unique, derived via `romanizeSyllable`.
- Phone and desktop share the same 2×2 tap grid; 44px minimum targets.
- `SPRINT_MS` is `60000`. Headline score is median correct milliseconds.
- Teaching copy is forbidden: no Hangul primer on `/drill`.
- One-shot taps: a mill must not retry-until-correct like lab `Options.svelte`.
- TDD: failing test first, watch it fail, then implement.
- Work from the repo root. App tests: `cd app && pnpm test <path>`.
- Commit per task. Do not push unless asked. Do not change files outside the task Files list.

---

### Task 1: Sprint domain engine

**Files:**
- Create: `app/src/lib/domain/sprint.ts`
- Test: `app/src/lib/domain/sprint.test.ts`

**Interfaces:**
- Consumes: `compose`, `romanizeSyllable`, `LEADS`, `VOWELS`, `FINALS`, `CLUSTERS`, `isCluster` from `./hangul`
- Produces: `SPRINT_MS`, `OPTION_COUNT`, `BASIC_VOWELS`, `Rng`, `SprintTrial`, `SprintRound`, `sprintEligible`, `sprintMissingLab`, `sprintInventory`, `nextTrial`, `medianMs`, `idleRound`, `startRound`, `tickRound`, `answerRound`, `sprintScore`

- [ ] **Step 1: Write the failing domain tests**

Create `app/src/lib/domain/sprint.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { compose, isCluster, romanizeSyllable } from './hangul';
import {
	BASIC_VOWELS,
	OPTION_COUNT,
	SPRINT_MS,
	answerRound,
	idleRound,
	medianMs,
	nextTrial,
	sprintEligible,
	sprintInventory,
	sprintMissingLab,
	sprintScore,
	startRound,
	tickRound,
	type Rng
} from './sprint';

function seq(values: number[]): Rng {
	let i = 0;
	return () => values[Math.min(i++, values.length - 1)] ?? 0;
}

describe('sprintEligible', () => {
	it('requires both lab01 and lab02 unlocked, ignoring skip-ahead', () => {
		expect(sprintEligible([])).toBe(false);
		expect(sprintEligible(['lab01'])).toBe(false);
		expect(sprintEligible(['lab02'])).toBe(false);
		expect(sprintEligible(['lab01', 'lab02'])).toBe(true);
		expect(sprintEligible(['lab05'])).toBe(false);
	});
});

describe('sprintMissingLab', () => {
	it('points at Lab 01 until consonants exist, then Lab 02', () => {
		expect(sprintMissingLab([])).toEqual({ id: '0001', number: 1 });
		expect(sprintMissingLab(['lab01'])).toEqual({ id: '0002', number: 2 });
		expect(sprintMissingLab(['lab01', 'lab02'])).toBeNull();
	});
});

describe('sprintInventory', () => {
	it('is empty until eligible', () => {
		expect(sprintInventory(['lab01'])).toEqual([]);
	});

	it('builds CV blocks from lab01+lab02 only', () => {
		const blocks = sprintInventory(['lab01', 'lab02']);
		expect(blocks).toContain('가');
		expect(blocks).toContain(compose('ㅇ', 'ㅏ'));
		expect(blocks).not.toContain('개');
		expect(blocks).not.toContain('각');
		expect(blocks).not.toContain('앉');
		expect(blocks).toHaveLength(19 * 10);
		for (const block of blocks) {
			expect(block).toHaveLength(1);
			expect(romanizeSyllable(block).length).toBeGreaterThan(0);
		}
	});

	it('adds compound vowels, simple batchim, then clusters with later tiers', () => {
		expect(sprintInventory(['lab01', 'lab02', 'lab03'])).toContain('개');
		expect(sprintInventory(['lab01', 'lab02', 'lab04'])).toContain('각');
		expect(sprintInventory(['lab01', 'lab02', 'lab04'])).not.toContain('앉');
		expect(sprintInventory(['lab01', 'lab02', 'lab05'])).toContain('앉');
		expect(sprintInventory(['lab01', 'lab02', 'lab06'])).toEqual(
			sprintInventory(['lab01', 'lab02'])
		);
	});

	it('never emits a block the domain cannot compose', () => {
		const blocks = sprintInventory(['lab01', 'lab02', 'lab03', 'lab04', 'lab05']);
		expect(new Set(blocks).size).toBe(blocks.length);
		for (const block of blocks) {
			expect(romanizeSyllable(block)).not.toBe('');
		}
	});
});

describe('nextTrial', () => {
	it('builds four unique same-length derived romanizations', () => {
		const blocks = sprintInventory(['lab01', 'lab02']);
		const trial = nextTrial(blocks, seq([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
		expect(trial).not.toBeNull();
		if (!trial) return;
		expect(trial.options).toHaveLength(OPTION_COUNT);
		expect(new Set(trial.options).size).toBe(OPTION_COUNT);
		const len = trial.options[0].length;
		for (const option of trial.options) expect(option.length).toBe(len);
		expect(trial.options[trial.answerIndex]).toBe(romanizeSyllable(trial.block));
		expect(blocks).toContain(trial.block);
	});

	it('avoids the previous block when the pool allows', () => {
		const blocks = sprintInventory(['lab01', 'lab02']);
		const first = nextTrial(blocks, () => 0);
		expect(first).not.toBeNull();
		const second = nextTrial(blocks, () => 0.99, first?.block);
		expect(second).not.toBeNull();
		expect(second?.block).not.toBe(first?.block);
	});
});

describe('medianMs', () => {
	it('returns null for no samples and averages the two centres when even', () => {
		expect(medianMs([])).toBeNull();
		expect(medianMs([3])).toBe(3);
		expect(medianMs([1, 3])).toBe(2);
		expect(medianMs([1, 2, 100])).toBe(2);
	});
});

describe('round', () => {
	const blocks = () => sprintInventory(['lab01', 'lab02']);
	const rng: Rng = () => 0;

	it('starts a 60s round and records only correct latencies', () => {
		const t0 = 1_000_000;
		let round = startRound(t0, blocks(), rng);
		expect(round.phase).toBe('running');
		expect(round.endsAt).toBe(t0 + SPRINT_MS);
		expect(round.trial).not.toBeNull();
		const trial = round.trial!;
		round = answerRound(round, trial.answerIndex, t0 + 240, blocks(), rng);
		expect(round.correct).toBe(1);
		expect(round.seen).toBe(1);
		expect(round.correctMs).toEqual([240]);
		round = answerRound(round, (trial.answerIndex + 1) % OPTION_COUNT, t0 + 400, blocks(), rng);
		expect(round.correct).toBe(1);
		expect(round.seen).toBe(2);
		expect(round.correctMs).toEqual([240]);
		expect(sprintScore(round).medianMs).toBe(240);
	});

	it('ends when the clock hits zero and ignores answers after that', () => {
		const t0 = 5_000;
		let round = startRound(t0, blocks(), rng);
		round = tickRound(round, t0 + SPRINT_MS);
		expect(round.phase).toBe('done');
		expect(round.trial).toBeNull();
		const after = answerRound(round, 0, t0 + SPRINT_MS + 10, blocks(), rng);
		expect(after).toBe(round);
		expect(idleRound().phase).toBe('idle');
	});
});

describe('boundaries', () => {
	it('does not import the scheduler', () => {
		const src = readFileSync(new URL('./sprint.ts', import.meta.url), 'utf8');
		expect(src).not.toMatch(/srs/);
		expect(src).not.toMatch(/progress/);
	});

	it('treats every simple lab04 final as non-cluster', () => {
		const blocks = sprintInventory(['lab01', 'lab02', 'lab04']);
		expect(blocks.some((b) => romanizeSyllable(b).endsWith('k'))).toBe(true);
		expect(isCluster('ㄱ')).toBe(false);
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /workspace/app && pnpm test src/lib/domain/sprint.test.ts`

Expected: FAIL because `./sprint` cannot be resolved.

- [ ] **Step 3: Implement `sprint.ts`**

Create `app/src/lib/domain/sprint.ts`:

```ts
import {
	CLUSTERS,
	FINALS,
	LEADS,
	VOWELS,
	compose,
	isCluster,
	romanizeSyllable,
	type Vowel
} from './hangul';

export const SPRINT_MS = 60_000;
export const OPTION_COUNT = 4;

export const BASIC_VOWELS: readonly Vowel[] = [
	'ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ'
];

export type Rng = () => number;

export interface SprintTrial {
	block: string;
	options: string[];
	answerIndex: number;
}

export type SprintPhase = 'idle' | 'running' | 'done';

export interface SprintRound {
	phase: SprintPhase;
	endsAt: number;
	trial: SprintTrial | null;
	trialStartedAt: number;
	correctMs: number[];
	seen: number;
	correct: number;
}

export function sprintEligible(unlocked: readonly string[]): boolean {
	return unlocked.includes('lab01') && unlocked.includes('lab02');
}

export function sprintMissingLab(
	unlocked: readonly string[]
): { id: string; number: number } | null {
	if (!unlocked.includes('lab01')) return { id: '0001', number: 1 };
	if (!unlocked.includes('lab02')) return { id: '0002', number: 2 };
	return null;
}

function vowelsFor(unlocked: readonly string[]): string[] {
	const out: string[] = [];
	if (unlocked.includes('lab02')) out.push(...BASIC_VOWELS);
	if (unlocked.includes('lab03')) {
		for (const vowel of VOWELS) {
			if (!(BASIC_VOWELS as readonly string[]).includes(vowel)) out.push(vowel);
		}
	}
	return out;
}

function leadsFor(unlocked: readonly string[]): string[] {
	return unlocked.includes('lab01') ? [...LEADS] : [];
}

function finalsFor(unlocked: readonly string[]): string[] {
	const out = [''];
	if (unlocked.includes('lab04')) {
		for (const final of FINALS) {
			if (final && !isCluster(final)) out.push(final);
		}
	}
	if (unlocked.includes('lab05')) out.push(...CLUSTERS);
	return out;
}

export function sprintInventory(unlocked: readonly string[]): string[] {
	if (!sprintEligible(unlocked)) return [];
	const blocks: string[] = [];
	for (const lead of leadsFor(unlocked)) {
		for (const vowel of vowelsFor(unlocked)) {
			for (const final of finalsFor(unlocked)) {
				const block = compose(lead, vowel, final);
				if (block) blocks.push(block);
			}
		}
	}
	return blocks;
}

function pickIndex(length: number, rng: Rng): number {
	if (length <= 0) return 0;
	return Math.min(length - 1, Math.floor(rng() * length));
}

function shuffled<T>(items: readonly T[], rng: Rng): T[] {
	const next = items.slice();
	for (let i = next.length - 1; i > 0; i--) {
		const j = pickIndex(i + 1, rng);
		[next[i], next[j]] = [next[j], next[i]];
	}
	return next;
}

const MAX_TRIAL_ATTEMPTS = 40;

export function nextTrial(
	blocks: readonly string[],
	rng: Rng,
	avoid?: string
): SprintTrial | null {
	if (blocks.length < OPTION_COUNT) return null;
	const pool = avoid && blocks.some((block) => block !== avoid)
		? blocks.filter((block) => block !== avoid)
		: blocks.slice();
	for (let attempt = 0; attempt < MAX_TRIAL_ATTEMPTS; attempt++) {
		const block = pool[pickIndex(pool.length, rng)];
		if (!block) continue;
		const answer = romanizeSyllable(block);
		if (!answer) continue;
		const distractors = new Set<string>();
		for (const other of blocks) {
			if (other === block) continue;
			const reading = romanizeSyllable(other);
			if (reading && reading !== answer && reading.length === answer.length) {
				distractors.add(reading);
			}
		}
		if (distractors.size < OPTION_COUNT - 1) continue;
		const picked: string[] = [];
		const available = [...distractors];
		while (picked.length < OPTION_COUNT - 1 && available.length > 0) {
			const index = pickIndex(available.length, rng);
			picked.push(available.splice(index, 1)[0]);
		}
		if (picked.length < OPTION_COUNT - 1) continue;
		const options = shuffled([answer, ...picked], rng);
		return { block, options, answerIndex: options.indexOf(answer) };
	}
	return null;
}

export function medianMs(samples: readonly number[]): number | null {
	if (samples.length === 0) return null;
	const sorted = [...samples].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	if (sorted.length % 2 === 1) return sorted[mid];
	return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export function idleRound(): SprintRound {
	return {
		phase: 'idle',
		endsAt: 0,
		trial: null,
		trialStartedAt: 0,
		correctMs: [],
		seen: 0,
		correct: 0
	};
}

export function startRound(now: number, blocks: readonly string[], rng: Rng): SprintRound {
	const trial = nextTrial(blocks, rng);
	if (!trial) return idleRound();
	return {
		phase: 'running',
		endsAt: now + SPRINT_MS,
		trial,
		trialStartedAt: now,
		correctMs: [],
		seen: 0,
		correct: 0
	};
}

export function tickRound(round: SprintRound, now: number): SprintRound {
	if (round.phase !== 'running') return round;
	if (now < round.endsAt) return round;
	return { ...round, phase: 'done', trial: null };
}

export function answerRound(
	round: SprintRound,
	optionIndex: number,
	now: number,
	blocks: readonly string[],
	rng: Rng
): SprintRound {
	if (round.phase !== 'running' || !round.trial) return round;
	const trial = round.trial;
	const correct = optionIndex === trial.answerIndex;
	const correctMs = correct
		? [...round.correctMs, now - round.trialStartedAt]
		: round.correctMs;
	const next: SprintRound = {
		...round,
		seen: round.seen + 1,
		correct: round.correct + (correct ? 1 : 0),
		correctMs
	};
	if (now >= round.endsAt) return { ...next, phase: 'done', trial: null };
	const following = nextTrial(blocks, rng, trial.block);
	if (!following) return { ...next, phase: 'done', trial: null };
	return { ...next, trial: following, trialStartedAt: now };
}

export function sprintScore(round: SprintRound): {
	medianMs: number | null;
	correct: number;
	seen: number;
} {
	return {
		medianMs: medianMs(round.correctMs),
		correct: round.correct,
		seen: round.seen
	};
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /workspace/app && pnpm test src/lib/domain/sprint.test.ts`

Expected: PASS, output pristine.

If the CV inventory length is not `19 * 10`, fix the test or the vowel list — do not hard-code a wrong count. Re-read `LEADS` (19) and `BASIC_VOWELS` (10).

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/domain/sprint.ts app/src/lib/domain/sprint.test.ts
git commit -m "feat: add timed block sprint domain engine"
```

---

### Task 2: Drill page and one-shot choices

**Files:**
- Create: `app/src/lib/components/SprintChoices.svelte`
- Create: `app/src/lib/components/SprintChoices.test.ts`
- Create: `app/src/routes/drill/+page.svelte`
- Create: `app/src/routes/drill/drill-page.test.ts`

**Interfaces:**
- Consumes: Task 1 exports; `progress` store (`isUnlocked`, `tick`); `resolve` from `$app/paths`; `choiceKeyScheme`, `choiceKeyLabel`, `choiceIndexFromKey` from `$lib/a11y/choiceKeys`; `shouldIgnoreShortcut` from `$lib/a11y/shortcuts`
- Produces: `/drill` route; `SprintChoices` with `options: string[]`, `onPick: (index: number) => void`, optional `disabled?: boolean`

- [ ] **Step 1: Write failing SprintChoices tests**

Create `app/src/lib/components/SprintChoices.test.ts`:

```ts
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount, type Component } from 'svelte';
import SprintChoices from './SprintChoices.svelte';

const mounted: Record<string, never>[] = [];

function render<P extends Record<string, unknown>>(component: Component<P>, props: P): HTMLElement {
	const instance = mount(component, { target: document.body, props });
	mounted.push(instance);
	flushSync();
	return document.body;
}

afterEach(() => {
	while (mounted.length) unmount(mounted.pop()!);
	document.body.innerHTML = '';
});

describe('SprintChoices', () => {
	it('fires onPick once and ignores a second tap', () => {
		const onPick = vi.fn();
		const el = render(SprintChoices, { options: ['ga', 'na', 'da', 'ma'], onPick });
		const buttons = [...el.querySelectorAll<HTMLButtonElement>('button.opt')];
		expect(buttons).toHaveLength(4);
		buttons[0].click();
		flushSync();
		buttons[1].click();
		flushSync();
		expect(onPick).toHaveBeenCalledTimes(1);
		expect(onPick).toHaveBeenCalledWith(0);
	});

	it('keeps 44px targets and a two-by-two grid', () => {
		const src = readSrc();
		expect(src).toMatch(/min-height:\s*44px/);
		expect(src).toMatch(/min-width:\s*44px/);
		expect(src).toMatch(/grid-template-columns:\s*1fr 1fr/);
	});
});

function readSrc(): string {
	return (
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		''
	);
}
```

Do **not** ship that `readSrc` stub. Use this instead of the stub:

```ts
import src from './SprintChoices.svelte?raw';
```

and `expect(src).toMatch(...)` in the 44px test. Delete the `readSrc` helper.

- [ ] **Step 2: Run the component test to see RED**

Run: `cd /workspace/app && pnpm test src/lib/components/SprintChoices.test.ts`

Expected: FAIL, module not found.

- [ ] **Step 3: Implement SprintChoices**

Create `app/src/lib/components/SprintChoices.svelte`. Svelte 5 runes. One-shot: after the first `onPick`, set local `locked = true` and ignore further clicks. Use `choiceKeyScheme` / `choiceKeyLabel`. Expose `keyPick(key: string)` like `Options.svelte`. Grid is always `1fr 1fr`. Tokens: `--paper-raised`, `--rule-strong`, `--r-md`, `--ink`, `--accent`, `--fast`, `--ease`. `min-width: 44px; min-height: 44px`. `lang` omitted (romanization is Latin). `role="group"` `aria-label="answer choices"`.

Export `keyPick` for the page window listener.

Do not reuse `Options.svelte` (it retries until correct).

- [ ] **Step 4: Write failing drill page source contracts**

Create `app/src/routes/drill/drill-page.test.ts` that imports `./+page.svelte?raw` and asserts:

- title Block sprint / Timed drill
- `sprintEligible` / `sprintMissingLab` / `startRound` / `tickRound` / `answerRound` / `sprintScore`
- no `progress.answer` and no `grade(`
- `SprintChoices`
- `lang="ko"` on the glyph
- `role="timer"`
- `Start 60-second round`
- `Another round`
- `median`
- `running` boolean used to gate the interval (the word `running` as a `$state` flag, not `round` inside `$effect` in a way that retriggers every tick). Assert the source contains `let running = $state(false)` and `$effect(() => {` that reads `running`.

- [ ] **Step 5: Run RED for the page test**

Run: `cd /workspace/app && pnpm test src/routes/drill/drill-page.test.ts`

Expected: FAIL, page missing.

- [ ] **Step 6: Implement `/drill`**

Create `app/src/routes/drill/+page.svelte`.

Pattern: `onMount` → `progress.tick(); ready = true`. Unlocked list: `['lab01','lab02','lab03','lab04','lab05','lab06'].filter((tier) => progress.isUnlocked(tier))`.

`let round = $state(idleRound())`
`let running = $state(false)`
`let now = $state(0)` — only for remaining-seconds display, updated inside the interval callback, **not** read by the `$effect`.

```ts
$effect(() => {
	if (!running) return;
	const id = setInterval(() => {
		const t = Date.now();
		now = t;
		round = tickRound(round, t);
		if (round.phase !== 'running') running = false;
	}, 100);
	return () => clearInterval(id);
});
```

Start: `progress.tick(); const unlocked = ...; const blocks = sprintInventory(unlocked); round = startRound(Date.now(), blocks, Math.random); running = round.phase === 'running'; now = Date.now();`

Pick: `round = answerRound(round, index, Date.now(), blocks, Math.random); if (round.phase !== 'running') running = false;`

Remaining seconds: `Math.max(0, Math.ceil((round.endsAt - now) / 1000))` while running.

Views:

- `!ready`: a loading card, `aria-busy="true"`, copy `Loading drill…`
- `ready && missing`: locked card, “Finish Lab 0N to unlock the sprint.” Button to `resolve('/lab/[id]', { id: missing.id })`.
- `ready && idle`: standfirst + Start 60-second round
- `ready && running && trial`: glyph + timer + `SprintChoices` `{#key round.trial.block + round.seen}` so a new trial remounts
- `ready && done`: `<p class="median">{score.medianMs === null ? '—' : `${score.medianMs} ms`}</p>` plus `{score.correct} of {score.seen} correct`. Another round. Links to `/` and `/review`.

Window keydown: if running and not `shouldIgnoreShortcut`, `choices.keyPick(e.key)`.

Shell class: `shell narrow` like Review. Semantic CSS variables only. No hover-only affordance as the sole hit state.

Use `$effect` only for the clock. Do not update state from an effect except `now`, `round` via `tickRound`, and `running = false` when done.

After writing, run `npx @sveltejs/mcp svelte-autofixer` on both `.svelte` files (or the Svelte MCP `svelte-autofixer` tool) and fix issues until clean.

- [ ] **Step 7: GREEN**

Run: `cd /workspace/app && pnpm test src/lib/components/SprintChoices.test.ts src/routes/drill/drill-page.test.ts src/lib/domain/sprint.test.ts`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add app/src/lib/components/SprintChoices.svelte app/src/lib/components/SprintChoices.test.ts app/src/routes/drill/+page.svelte app/src/routes/drill/drill-page.test.ts
git commit -m "feat: add /drill timed block sprint page"
```

---

### Task 3: Entry points

**Files:**
- Modify: `app/src/routes/+layout.svelte`
- Modify: `app/src/routes/+page.svelte`
- Modify: `app/src/routes/review/+page.svelte`
- Modify: `app/src/lib/polish.test.ts`

**Interfaces:**
- Consumes: `sprintEligible`, `sprintMissingLab` from `$lib/domain/sprint`; `resolve('/drill')`
- Produces: Drill in main nav; Home sprint section; Review-clear CTA

- [ ] **Step 1: Write failing polish / source contracts**

In `app/src/lib/polish.test.ts`:

- Import `drill from '../routes/drill/+page.svelte?raw'`
- Change the test `keeps a labeled Labs / Review / Reference header without journal chrome` to also `expect(layout).toMatch(/label: 'Drill'/);` and keep Labs/Review/Reference.
- Add a test that `home` contains `sec-sprint-heading` and `Block sprint`.
- Add a test that `review` contains `Read blocks against the clock` and `does not write the Review schedule`.
- Add a test that `layout` treats `/drill` as active via `item.href === '/drill'` or `pathname.startsWith(item.href)` (existing generic startsWith already works if href is `/drill`).

In `app/src/routes/review/+page.svelte` we will only show the CTA when eligible, so the source must still contain that copy (it's in the template under `{#if drillOpen}`).

- [ ] **Step 2: Run RED**

Run: `cd /workspace/app && pnpm test src/lib/polish.test.ts`

Expected: FAIL on Drill label / headings / copy.

- [ ] **Step 3: Wire layout, home, review**

`+layout.svelte` nav array:

```ts
const nav = [
	{ href: '/', label: 'Labs' },
	{ href: '/review', label: 'Review' },
	{ href: '/drill', label: 'Drill' },
	{ href: '/reference', label: 'Reference' }
] as const;
```

Home: after the Review pile `</section>`, add:

```svelte
<section aria-labelledby="sec-sprint-heading">
	<h2 id="sec-sprint-heading" class="sec">Block sprint</h2>
	{#if !ready}
		<p class="pile-empty">Loading drill…</p>
	{:else if sprintMissing}
		<p class="pile-empty">
			Finish Lab {String(sprintMissing.number).padStart(2, '0')} to unlock the sprint.
			It only uses letters you have already derived.
		</p>
		<a class="btn" href={resolve('/lab/[id]', { id: sprintMissing.id })}>
			Go to Lab {String(sprintMissing.number).padStart(2, '0')}
		</a>
	{:else}
		<p class="pile-empty">
			One minute of unfamiliar syllable blocks. The number is your median time.
		</p>
		<a class="btn" href={resolve('/drill')}>Start a round</a>
	{/if}
</section>
```

Compute `sprintMissing` from `sprintMissingLab` on the same unlocked-tier list as `/drill`.

Review clear card: import `sprintEligible`. `const drillOpen = $derived(sprintEligible(/* unlocked tiers from stats or progress */));`

`stats` does not list tier ids. Use:

```ts
const unlockedTiers = $derived(
	(['lab01', 'lab02', 'lab03', 'lab04', 'lab05', 'lab06'] as const).filter((tier) =>
		progress.isUnlocked(tier)
	)
);
const drillOpen = $derived(sprintEligible(unlockedTiers));
```

Inside `body === 'clear'`, after the muted spacing paragraph, if `drillOpen`:

```svelte
<p>
	<a class="btn" href={resolve('/drill')}>Read blocks against the clock</a>
</p>
<p class="muted tiny">The sprint is not review — it does not write the Review schedule.</p>
```

Keep the existing “Reviewing early would only weaken the spacing” sentence.

- [ ] **Step 4: GREEN**

Run: `cd /workspace/app && pnpm test src/lib/polish.test.ts src/routes/drill/drill-page.test.ts src/lib/domain/sprint.test.ts src/lib/components/SprintChoices.test.ts`

Expected: PASS.

Then: `cd /workspace/app && pnpm check`

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/src/routes/+layout.svelte app/src/routes/+page.svelte app/src/routes/review/+page.svelte app/src/lib/polish.test.ts
git commit -m "feat: link the block sprint from nav, home, and review"
```
