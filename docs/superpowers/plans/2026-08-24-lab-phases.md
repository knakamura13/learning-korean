# Lab Phases Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make lab teaching chunks first-class: a stranger on Lab 01 card 2 sees **Find the five shapes**, the pip rail dims cards outside the active phase, `Card 2 of 17` is the only count, and no learner-facing string contains `Act`.

**Architecture:** Keep `steps` a flat array. Author `lab.phases: { title, count }[]` on `Lab`. Pure helpers map a card index to a title and half-open bounds. `LabRunner` always renders `.phase-title`. `LabPipRail` marks each pip `data-phase="current" | "other"`. Delete `BaseStep.act` and `formatStepEyebrow`.

**Tech Stack:** Svelte 5 (`$props`, `$derived`), TypeScript, Vitest (unit + `?raw` source contracts), pnpm in `app/`.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-24-lab-phases-design.md`. Spec wins. Do not redesign titles, ranges, C1–C13, chrome, or tests.
- Issue: [#169](https://github.com/knakamura13/learning-korean/issues/169). Supersedes #164. Interim #165 (`formatStepEyebrow`) is deleted with `act`.
- Card order does not change. No cards added, removed, or reordered.
- Learner-facing copy never says Act, Phase, Part, or Section as a unit word.
- Repo and docs say **phase**. Never **block** for this (syllable block already owns that word).
- No 1-card learner-facing phase in authored labs. Every `count >= 2`. Sum of counts equals `steps.length`.
- Last phase title on every lab is exactly `Read from the letters alone`.
- Header stays `Lab 01 · ~9 minutes` on `.eyebrow`. Compact head still drops the standfirst after card 1. Lab `h1` stays.
- Pip rail stays numbered 1..N. `Card {n} of {total}` stays. Jump rules in `pipState.ts` do not change. No pip gaps, no extra pip width, no within-phase `2 of 5`.
- Dimming is instant. `prefers-reduced-motion` gets no extra motion for phases.
- Forced-colors: `[data-phase='other']` uses `GrayText`. Do not rely on opacity.
- Author comments may read `/* ---- Find the five shapes ---- */`. Rewrite Act comments to locked titles in the same pass as dropping `act`.
- `pnpm test` and `pnpm check` in `app/`. Package manager is pnpm.
- Svelte 5: imports at top of file. Exhaustive `switch` uses `never` in `default`. Run `svelte-autofixer` on every `.svelte` edit.
- Test fixtures that construct `Lab` must include `phases` whose counts cover `steps.length`. Course inventory `count >= 2` applies to `LABS`, not one-card runner fixtures.
- Out of scope: card pedagogy, widgets, unlocks, resume/session/SRS, Labs page index copy, pip gaps, second pip row.

## File map

- Create: `app/src/lib/domain/labPhase.ts` — `phaseIndexAt`, `phaseAt`, `phaseBounds`, `cardInActivePhase`
- Create: `app/src/lib/domain/labPhase.test.ts`
- Modify: `app/src/lib/content/types.ts` — add `LabPhase`; `Lab.phases`; remove `act` from `BaseStep`
- Modify: `app/src/lib/content/lab01.ts` … `lab10.ts` — `phases`, drop `act`, C1–C13, phase comments
- Modify: `app/src/lib/components/LabRunner.svelte` — always-on `.phase-title`; pass `phases` to the rail; delete `formatStepEyebrow`
- Modify: `app/src/lib/components/LabPipRail.svelte` — `phases` prop, `data-phase`, nav name, other-phase opacity + forced-colors `GrayText`
- Modify: `app/src/lib/components/labRunnerRail.test.ts` — nav name, `data-phase`
- Modify: `app/src/lib/polish.test.ts` — `.phase-title` not uppercase; nav name
- Modify: `app/src/lib/content/content.test.ts` — inventory + no `act` + no `\bAct\b` in learner fields
- Modify: `app/src/lib/components/labRunnerPersist.test.ts` — `phases` on fixtures
- Modify: `app/src/lib/components/labRunnerFocus.test.ts` — `phases` on fixtures
- Modify: `UBIQUITOUS_LANGUAGE.md` — **Phase** row and Lab/Phase/Action-card relationship
- Delete: `app/src/lib/content/formatStepEyebrow.ts`
- Delete: `app/src/lib/content/formatStepEyebrow.test.ts`

## Locked inventory (1-based cards; titles exact)

Lab 01 (17): 5 Find the five shapes | 5 A stroke adds a puff of air | 2 Doubling makes a tense consonant | 2 Where the consonant sits in the block | 3 Read from the letters alone

Lab 02 (16): 2 Vowels are a long stroke and a tick | 4 Build the four one-tick vowels | 3 A second tick adds a y-glide | 2 The vowel with no tick, and the rounded o | 2 Build a tall block and a wide block | 3 Read from the letters alone

Lab 03 (16): 5 Compounds built from ㅗ | 4 Compounds built from ㅜ | 2 Three compound spellings, one sound | 2 Wrapping vowels put the consonant in the corner | 3 Read from the letters alone

Lab 04 (14): 3 A third slot opens under the vowel | 6 Sixteen batchim letters make seven sounds | 2 Build the two most common surnames | 3 Read from the letters alone

Lab 05 (14): 4 Most clusters pronounce the first letter | 3 Three clusters drop ㄹ | 2 Clusters with ㅎ make the next consonant aspirated | 2 Two verb stems break the cluster rules | 3 Read from the letters alone

Lab 06 (16): 8 A batchim fills the next empty ㅇ | 3 A cluster splits when a vowel follows | 2 ㅅ moves and becomes ㅆ | 3 Read from the letters alone

Lab 07 (16): 8 A stop makes the next plain consonant tense | 5 A stop is pronounced through the nose before ㄴ or ㅁ | 3 Read from the letters alone

Lab 08 (16): 4 ㅎ plus a stop becomes aspirated | 4 A stop plus ㅎ becomes aspirated | 4 ㅎ before a vowel is not pronounced | 2 The next letter decides what ㅎ does | 2 Read from the letters alone

Lab 09 (16): 5 When ㄴ meets ㄹ, both are pronounced ㄹ | 4 When ㄹ meets ㄴ, both are pronounced ㄹ | 4 ㄹ after a nasal becomes ㄴ | 3 Read from the letters alone

Lab 10 (17): 2 The family name is the first syllable | 6 Sound changes still apply inside a name | 4 The close-friend name suffixes | 3 The polite suffix and the honorific | 2 Read from the letters alone

## Locked C1–C13 (replace the clause only)

| Id | File / field | Replace | With |
| --- | --- | --- | --- |
| C1 | lab01 사우나 teach | ` from Act 1` | delete |
| C2 | lab01 기타 teach | `the letter you derived in Act 3` | `the ㅌ you built by adding a stroke` |
| C3 | lab03 ㅙ hint | `one of the vowels you built in Act 1 behind it.` | `ㅐ behind it.` |
| C4 | lab06 부엌에 do | `You jumped this one in Act 2. Now read it as a phrase.` | `Read it as a phrase.` |
| C5 | lab06 부엌에 teach | `The ㅋ you restored in Act 2,` (keep the existing `<span class="jamo">ㅋ</span>`) | `The ㅋ you restored,` |
| C6 | lab07 학교 read do | `You tensed this in Act 2. Now read it as a word.` | `Read it as a word.` |
| C7 | lab07 입니다 read do | `You nasalized this in Act 5. Now read it as a phrase.` | `Read it as a phrase.` |
| C8 | lab08 축하 do | `You fused this in Act 3. Now read it as a word.` | `Read it as a word.` |
| C9 | lab08 좋아요 do | `You deleted this in Act 4. Now read it as a phrase.` | `Read it as a phrase.` |
| C10 | lab09 대통령 do | `You made this yield in Act 4… at presidential scale. Read it as a word.` | `Read it as a word.` |
| C11 | lab10 민준아 do | `Act 1's contact gets called over. Operate the junction.` | `A close friend calls 민준. Operate the junction.` |
| C12 | lab10 박은지 read do | `You operated this in Act 2. The blocks read as written — which cuts does the mouth actually say?` | `The blocks read as written — which cuts does the mouth actually say?` |
| C13 | lab10 고객님 do | `You nasalized this in Act 4. Now read it as an address.` | `Read it as an address.` |

C10’s presidential color stays in that card’s existing teach. After edits, `/\bAct\b/` must not match `do` / `hint` / `teach` / `miss` in `lab*.ts`.

---

### Task 1: Phase helpers

**Files:**
- Modify: `app/src/lib/content/types.ts` — add `LabPhase` only (do not add `Lab.phases` or remove `act` yet, so existing labs still typecheck)
- Create: `app/src/lib/domain/labPhase.ts`
- Test: `app/src/lib/domain/labPhase.test.ts`

**Interfaces:**
- Consumes: `LabPhase` from `app/src/lib/content/types.ts`
- Produces: `phaseIndexAt(phases, cardIndex): number`; `phaseAt(phases, cardIndex): LabPhase`; `phaseBounds(phases, phaseIndex): { start: number; end: number }` (start inclusive, end exclusive); `cardInActivePhase(phases, cardIndex, currentIndex): boolean`. Out-of-range `cardIndex` / `phaseIndex` throws.

- [ ] **Step 1: Write the failing test**

Create `app/src/lib/domain/labPhase.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { LabPhase } from '$lib/content/types';
import { cardInActivePhase, phaseAt, phaseBounds, phaseIndexAt } from './labPhase';

const LAB01: readonly LabPhase[] = [
	{ title: 'Find the five shapes', count: 5 },
	{ title: 'A stroke adds a puff of air', count: 5 },
	{ title: 'Doubling makes a tense consonant', count: 2 },
	{ title: 'Where the consonant sits in the block', count: 2 },
	{ title: 'Read from the letters alone', count: 3 }
];

describe('labPhase', () => {
	it('names Lab 01 cards from the locked inventory', () => {
		expect(phaseAt(LAB01, 0).title).toBe('Find the five shapes');
		expect(phaseAt(LAB01, 4).title).toBe('Find the five shapes');
		expect(phaseAt(LAB01, 5).title).toBe('A stroke adds a puff of air');
		expect(phaseAt(LAB01, 16).title).toBe('Read from the letters alone');
		expect(phaseIndexAt(LAB01, 0)).toBe(0);
		expect(phaseIndexAt(LAB01, 5)).toBe(1);
		expect(phaseIndexAt(LAB01, 16)).toBe(4);
	});

	it('covers 0..n with non-overlapping half-open bounds', () => {
		const n = LAB01.reduce((sum, phase) => sum + phase.count, 0);
		expect(n).toBe(17);
		let cursor = 0;
		for (let i = 0; i < LAB01.length; i++) {
			const bounds = phaseBounds(LAB01, i);
			expect(bounds.start).toBe(cursor);
			expect(bounds.end).toBe(cursor + LAB01[i].count);
			cursor = bounds.end;
		}
		expect(cursor).toBe(n);
	});

	it('marks Lab 01 card 1 as current for cards 1–5 and other for 6–17', () => {
		for (let i = 0; i < 5; i++) expect(cardInActivePhase(LAB01, i, 0)).toBe(true);
		for (let i = 5; i < 17; i++) expect(cardInActivePhase(LAB01, i, 0)).toBe(false);
	});

	it('throws on an out-of-range card index', () => {
		expect(() => phaseAt(LAB01, -1)).toThrow();
		expect(() => phaseAt(LAB01, 17)).toThrow();
		expect(() => phaseIndexAt(LAB01, 17)).toThrow();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && pnpm exec vitest run src/lib/domain/labPhase.test.ts`

Expected: FAIL — `labPhase` is not a module.

- [ ] **Step 3: Write minimal implementation**

In `app/src/lib/content/types.ts`, add after `BaseStep` (leave `act` in place for this commit):

```ts
export interface LabPhase {
	title: string;
	count: number;
}
```

Create `app/src/lib/domain/labPhase.ts`:

```ts
import type { LabPhase } from '$lib/content/types';

function cardCount(phases: readonly LabPhase[]): number {
	return phases.reduce((sum, phase) => sum + phase.count, 0);
}

export function phaseIndexAt(phases: readonly LabPhase[], cardIndex: number): number {
	const n = cardCount(phases);
	if (!Number.isInteger(cardIndex) || cardIndex < 0 || cardIndex >= n) {
		throw new RangeError(`cardIndex ${cardIndex} is out of range 0..${n - 1}`);
	}
	let start = 0;
	for (let i = 0; i < phases.length; i++) {
		const end = start + phases[i].count;
		if (cardIndex < end) return i;
		start = end;
	}
	throw new RangeError(`cardIndex ${cardIndex} is out of range 0..${n - 1}`);
}

export function phaseAt(phases: readonly LabPhase[], cardIndex: number): LabPhase {
	return phases[phaseIndexAt(phases, cardIndex)];
}

export function phaseBounds(
	phases: readonly LabPhase[],
	phaseIndex: number
): { start: number; end: number } {
	if (!Number.isInteger(phaseIndex) || phaseIndex < 0 || phaseIndex >= phases.length) {
		throw new RangeError(`phaseIndex ${phaseIndex} is out of range 0..${phases.length - 1}`);
	}
	let start = 0;
	for (let i = 0; i < phaseIndex; i++) start += phases[i].count;
	return { start, end: start + phases[phaseIndex].count };
}

export function cardInActivePhase(
	phases: readonly LabPhase[],
	cardIndex: number,
	currentIndex: number
): boolean {
	const { start, end } = phaseBounds(phases, phaseIndexAt(phases, currentIndex));
	return cardIndex >= start && cardIndex < end;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && pnpm exec vitest run src/lib/domain/labPhase.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/content/types.ts app/src/lib/domain/labPhase.ts app/src/lib/domain/labPhase.test.ts
git commit -m "feat(labs): add phase lookup helpers"
```

---

### Task 2: Runner chrome

**Files:**
- Modify: `app/src/lib/content/types.ts` — `Lab.phases: LabPhase[]`; remove `act?: string` from `BaseStep` and its comment
- Modify: `app/src/lib/components/LabRunner.svelte`
- Modify: `app/src/lib/components/LabPipRail.svelte`
- Modify: `app/src/lib/components/labRunnerRail.test.ts`
- Modify: `app/src/lib/polish.test.ts`
- Modify: `app/src/lib/components/labRunnerPersist.test.ts`
- Modify: `app/src/lib/components/labRunnerFocus.test.ts`
- Delete: `app/src/lib/content/formatStepEyebrow.ts`
- Delete: `app/src/lib/content/formatStepEyebrow.test.ts`

This task and Task 3 must land in an order that keeps `pnpm check` green: add `phases` on every `Lab` object in the same change that makes the field required, and drop `act` from objects in the same change that removes it from `BaseStep`. Implement Task 3’s lab authorship in the same working tree before this commit if typecheck would otherwise fail. Prefer one commit for chrome+authorship if that is the only way to stay independently typecheckable; otherwise commit Task 3 first (labs still have `act`, `phases` still optional) then this task. The required, independently typecheckable split is:

1. Keep `act` until chrome no longer reads it.
2. Add required `phases` only when every `Lab` literal has the array.

Practical sequence inside this task: apply Task 3 lab edits first if they are not already committed, then chrome, then delete the stopgap.

**Interfaces:**
- Consumes: `phaseAt`, `cardInActivePhase`, `Lab.phases`
- Produces: prompt `.phase-title`; pip `data-phase`; nav `Lab card navigation, {phase title}`

- [ ] **Step 1: Write the failing chrome tests**

Append to `app/src/lib/components/labRunnerRail.test.ts`:

```ts
	it('names the rail with the active phase and marks other-phase pips', () => {
		expect(labPipRail).toMatch(/aria-label="Lab card navigation, \{/);
		expect(labPipRail).toMatch(/data-phase=\{/);
		expect(labPipRail).toMatch(/cardInActivePhase/);
		expect(labPipRail).toMatch(/opacity:\s*0\.4/);
		expect(labPipRail).toMatch(/\[data-phase='other'\][^{]*\{[^}]*GrayText/s);
		expect(labRunner).toMatch(/class="phase-title"/);
		expect(labRunner).toMatch(/phaseAt\(lab\.phases,\s*index\)/);
		expect(labRunner).not.toMatch(/formatStepEyebrow/);
		expect(labRunner).not.toMatch(/step\.act/);
	});
```

In `app/src/lib/polish.test.ts`, change the pip-rail assertion from exact `aria-label="Lab card navigation"` to the same `Lab card navigation, {` pattern used above. Add:

```ts
	it('keeps phase titles in sentence case, not the uppercase eyebrow', () => {
		expect(styleBlock(labRunner)).toMatch(
			/\.phase-title\s*\{[^}]*text-transform:\s*none/s
		);
		expect(styleBlock(labRunner)).not.toMatch(
			/\.phase-title\s*\{[^}]*text-transform:\s*uppercase/s
		);
		expect(appCss).toMatch(/\.eyebrow\s*\{[^}]*font-size:\s*0\.75rem/s);
		expect(appCss).toMatch(/\.eyebrow\s*\{[^}]*text-transform:\s*uppercase/s);
	});
```

Keep the existing `sizes eyebrow chrome at 0.75rem` test unchanged.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd app && pnpm exec vitest run src/lib/components/labRunnerRail.test.ts src/lib/polish.test.ts`

Expected: FAIL — rail still has `aria-label="Lab card navigation"` with no phase title; no `.phase-title`.

- [ ] **Step 3: Point chrome at phases**

`LabPipRail.svelte` script: add top-level imports

```ts
import type { LabPhase } from '$lib/content/types';
import { cardInActivePhase, phaseAt } from '$lib/domain/labPhase';
```

Add `phases: LabPhase[]` to `$props()`. Change the nav to:

```svelte
<nav class="rail-wrap" aria-label="Lab card navigation, {phaseAt(phases, index).title}">
```

Inside the each, after `selected`, add `{@const inPhase = cardInActivePhase(phases, i, index)}` and set `data-phase={inPhase ? 'current' : 'other'}` on both the `<button class="pip">` and the `<span class="pip">`.

Add CSS (no extra pip width, no new gaps):

```css
.pip[data-phase='other'] {
	opacity: 0.4;
}
```

Inside the existing `@media (forced-colors: active)` block, add:

```css
.pip[data-phase='other'] {
	opacity: 1;
	color: GrayText;
}
.pip[data-phase='other']::before {
	background: Canvas;
	border-color: GrayText;
}
```

Do not add phase motion under `prefers-reduced-motion`.

`LabRunner.svelte`: remove `formatStepEyebrow` import. Add:

```ts
import { phaseAt } from '$lib/domain/labPhase';
```

Pass `phases={lab.phases}` into `<LabPipRail>`. Replace `{#if step.act}...{/if}` with:

```svelte
<p class="phase-title">{phaseAt(lab.phases, index).title}</p>
<h2 class="do">{@html labHtml(step.do)}</h2>
```

Add `.phase-title` in this component’s `<style>` (not `.eyebrow`):

```css
.phase-title {
	font-family: var(--sans);
	font-size: 0.85rem;
	font-weight: 600;
	letter-spacing: normal;
	text-transform: none;
	color: var(--accent);
	line-height: 1.35;
	margin: 0 0 var(--s2);
}
```

Header `.eyebrow` (`Lab {nn} · ~{minutes} minutes`) stays. Do not truncate `.phase-title`.

Delete `formatStepEyebrow.ts` and `formatStepEyebrow.test.ts`.

Runner fixtures: every `Lab` literal needs `phases` covering `steps.length`. One-card persist fixture:

```ts
phases: [{ title: 'Read from the letters alone', count: 1 }],
```

Two-card focus fixture:

```ts
phases: [{ title: 'Read from the letters alone', count: 2 }],
```

`twoStep` and `hangulLab` overrides must set `phases` to match their new `steps.length`.

Run `svelte-autofixer` on `LabRunner.svelte` and `LabPipRail.svelte` until clean.

- [ ] **Step 4: Run chrome tests**

Run: `cd app && pnpm exec vitest run src/lib/components/labRunnerRail.test.ts src/lib/polish.test.ts src/lib/components/labRunnerFocus.test.ts src/lib/components/labRunnerPersist.test.ts`

Expected: PASS once Task 3 lab objects exist. If `pnpm check` fails because `Lab.phases` is missing on course labs, finish Task 3 before committing.

- [ ] **Step 5: Commit** (after Task 3 if this commit includes both)

```bash
git add app/src/lib/components/LabRunner.svelte app/src/lib/components/LabPipRail.svelte \
  app/src/lib/components/labRunnerRail.test.ts app/src/lib/polish.test.ts \
  app/src/lib/components/labRunnerPersist.test.ts app/src/lib/components/labRunnerFocus.test.ts \
  app/src/lib/content/types.ts
git rm app/src/lib/content/formatStepEyebrow.ts app/src/lib/content/formatStepEyebrow.test.ts
git commit -m "feat(labs): show phase titles and dim other-phase pips"
```

---

### Task 3: Author phases on all ten labs

**Files:**
- Modify: `app/src/lib/content/lab01.ts` through `lab10.ts`
- Modify: `app/src/lib/content/types.ts` if Task 2 has not yet made `phases` required / removed `act`

**Interfaces:**
- Consumes: locked inventory and C1–C13
- Produces: every `export const labNN: Lab` has `phases` whose counts sum to `steps.length`; no `act` on any step; learner fields contain no `\bAct\b`; section comments use locked titles

- [ ] **Step 1: Add `phases` and drop `act`**

On each lab object, insert `phases` immediately before `steps`, using the locked inventory. Example Lab 01:

```ts
	phases: [
		{ title: 'Find the five shapes', count: 5 },
		{ title: 'A stroke adds a puff of air', count: 5 },
		{ title: 'Doubling makes a tense consonant', count: 2 },
		{ title: 'Where the consonant sits in the block', count: 2 },
		{ title: 'Read from the letters alone', count: 3 }
	],
	steps: [
```

Delete every `act: '…'` line. Do not add, remove, or reorder step objects.

- [ ] **Step 2: Apply C1–C13 and rewrite comments**

Apply the locked replacements. For C5 keep `<span class="jamo">ㅋ</span>` and drop ` in Act 2` from that clause (`The <span class="jamo">ㅋ</span> you restored,`).

Lab 01 comments become:

```
/* ---- Find the five shapes ---- */
/* ---- A stroke adds a puff of air ---- */
/* ---- Doubling makes a tense consonant ---- */
/* ---- Where the consonant sits in the block ---- */
/* ---- Read from the letters alone ---- */
```

Delete the leftover `Act 3: build with rule one` comment (those two builds belong to the stroke-rule phase).

On labs 02–10, insert `/* ---- {title} ---- */` at each phase’s first step. Do not leave `Act` in comments.

- [ ] **Step 3: Confirm no learner-facing `Act`**

`rg '\\bAct\\b' app/src/lib/content/lab*.ts` may still match nothing in `do`/`hint`/`teach`/`miss`. Comments must not say Act either after this pass.

- [ ] **Step 4: Commit** (fold into Task 2’s commit if that is required for typecheck)

```bash
git add app/src/lib/content/lab0*.ts app/src/lib/content/lab10.ts app/src/lib/content/types.ts
git commit -m "feat(labs): author phase metadata and drop act labels"
```

---

### Task 4: Content inventory tests and ubiquitous language

**Files:**
- Modify: `app/src/lib/content/content.test.ts`
- Modify: `UBIQUITOUS_LANGUAGE.md`

**Interfaces:**
- Consumes: `LABS`, `lab.phases`, learner fields on `Step`
- Produces: inventory contract; **Phase** in Teaching path

- [ ] **Step 1: Write the failing inventory tests**

Append to `app/src/lib/content/content.test.ts`:

```ts
describe('lab phases', () => {
	it('covers every action card with counts of at least two', () => {
		for (const lab of LABS) {
			const total = lab.phases.reduce((n, phase) => n + phase.count, 0);
			expect(total, lab.id).toBe(lab.steps.length);
			for (const phase of lab.phases) {
				expect(phase.count, `${lab.id} ${phase.title}`).toBeGreaterThanOrEqual(2);
				expect(phase.title, lab.id).toBeTruthy();
			}
			expect(lab.phases.at(-1)?.title, lab.id).toBe('Read from the letters alone');
		}
	});

	it('does not keep per-card act labels or learner-facing Act', () => {
		for (const { lab, step, i } of ALL_STEPS) {
			expect(step, where(lab, i)).not.toHaveProperty('act');
			for (const field of ['do', 'hint', 'teach', 'miss'] as const) {
				const text = step[field];
				if (!text) continue;
				expect(text, `${where(lab, i)} ${field}`).not.toMatch(/\bAct\b/);
			}
		}
	});
});
```

- [ ] **Step 2: Run to verify (should pass once Task 3 is done)**

Run: `cd app && pnpm exec vitest run src/lib/content/content.test.ts`

Expected: PASS after Task 3.

- [ ] **Step 3: Ubiquitous language**

In `UBIQUITOUS_LANGUAGE.md` Teaching path table, add after **Action card**:

```md
| **Phase**       | A named teaching job inside a lab, one chapter title, two or more consecutive action cards | Act, Part, Section, block (block is a syllable) |
```

In Relationships, change `A **Lab** contains many **Action cards** and unlocks exactly one **Tier**` to:

```md
- A **Lab** contains ordered **Phases** and unlocks exactly one **Tier**
- A **Phase** contains consecutive **Action cards**
```

- [ ] **Step 4: Full verification**

Run: `cd app && pnpm test && pnpm check`

Expected: all tests pass; svelte-check reports no errors.

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/content/content.test.ts UBIQUITOUS_LANGUAGE.md
git commit -m "test(labs): lock phase inventory and drop Act from learner copy"
```

---

## Spec coverage

- Data model `LabPhase` / `Lab.phases` / no `act` — Tasks 1–3
- Helpers and Lab 01 index tests — Task 1
- Header unchanged, prompt `.phase-title`, pip dimming, forced-colors, nav name — Task 2
- Locked inventory, C1–C13, comments — Task 3
- `content.test.ts`, `polish.test.ts`, delete `formatStepEyebrow` — Tasks 2 and 4
- `UBIQUITOUS_LANGUAGE.md` Phase row — Task 4
- Out of scope left untouched
