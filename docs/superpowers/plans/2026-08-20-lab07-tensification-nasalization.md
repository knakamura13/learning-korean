# Lab 07 Tensification and Nasalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> Spec: `docs/superpowers/specs/2026-08-20-lab07-tensification-nasalization-design.md`
>
> Svelte: any `.svelte` file MUST be written via the `svelte-file-editor` subagent (or `svelte-code-writer` + Svelte MCP `svelte-autofixer`) and re-checked until the autofixer is clean. Dispatch that work with Grok 4.6.

**Goal:** Ship Lab 07 as a 16-card sitting that teaches Article 23 (경음화 after a stop) and Article 18 (비음화 of ㄱ/ㄷ/ㅂ before ㄴ/ㅁ), unlocking ten `lab07` `pron` review cards.

**Architecture:** Phonology first (`applyTensification` / `applyNasalization` in `hangul.ts`). A `contact` step is a one-tap Tense / Nasal / Stay widget in the Lab 05/06 family. Choice/read cards name the rules and cold-read. Deck answers are derived spoken forms, never authored as the source of truth.

**Tech Stack:** SvelteKit 2 + Svelte 5 runes, TypeScript, Vitest, existing `adapter-static` app in `app/`.

## Global Constraints

- Session budget: `minutes <= 10`, `steps.length === 16` (cap 18).
- Labs are action-cards; explanation only as feedback. No prose sections.
- Widget and deck answers are **derived** from `applyTensification` / `applyNasalization` / `applyContact` / `romanizeWord`. Never author a spoken form those functions could compute.
- Each phonology function is **only its own rule**. No chaining, no palatalization, no Article 15/19, no liaison, no ㅎ-deletion, no cluster simplification.
- Skip junctions that are clusters, ㅎ-batchim, next lead ㅇ, or next lead ㅎ.
- Widget forbidden words: 음악, 좋아요, 없다, 독립, 학원, 밭이. Stay-correct widget word is 한국.
- `contact` retries until correct, like `liaison`. Choice/read still use their existing runners.
- Exhaustive `switch` / `{#if}` on `Step['type']` must keep a `never` default.
- Imports at top of file. Run `cd app && pnpm test` and `cd app && pnpm check` before claiming the task done.
- Do not commit debug logs. Commit after each task as specified.
- No mic, no speech scoring, no XP, no new audio files, no Hangul-composition review control.

## File map

- Create: `app/src/lib/content/lab07.ts`
- Create: `app/src/lib/components/steps/ContactStep.svelte`
- Create: `app/src/lib/components/steps/ContactStep.test.ts`
- Modify: `app/src/lib/domain/hangul.ts`
- Modify: `app/src/lib/domain/hangul.test.ts`
- Modify: `app/src/lib/content/types.ts`
- Modify: `app/src/lib/content/index.ts`
- Modify: `app/src/lib/content/content.test.ts`
- Modify: `app/src/lib/content/lab06.ts` (finish copy only)
- Modify: `app/src/lib/domain/deck.ts`
- Modify: `app/src/lib/domain/deck.test.ts`
- Modify: `app/src/lib/components/LabRunner.svelte`
- Modify: `app/src/routes/+page.svelte` (add `lab07` to the unlocked-tier list)
- Modify: `app/src/routes/review/+page.svelte` (same)
- Modify: `app/src/routes/drill/+page.svelte` (same)
- Modify: `app/src/lib/polish.test.ts` (ContactStep `.arr` size, same as LiaisonStep)
- Modify: `app/README.md` and `app/src/lib/deployConfig.test.ts`
- Modify: `NOTES.md`

`entries()` in `app/src/routes/lab/[id]/+page.ts` already prerenders from `LABS`.

---

### Task 1: Tensification and nasalization phonology

**Files:**
- Modify: `app/src/lib/domain/hangul.ts` (insert after `liaisonAction`, before `LEAD_RR`; set `tensification` and `nasalization` `scored: true`)
- Test: `app/src/lib/domain/hangul.test.ts`

**Interfaces:**
- Consumes: `decompose`, `compose`, `batchimSound`, `isCluster` already in this file
- Produces:
  - `applyTensification(word: string): string`
  - `applyNasalization(word: string): string`
  - `applyContact(word: string): string`
  - `type ContactAction = { type: 'stay' } | { type: 'tense' } | { type: 'nasal' }`
  - `contactAction(word: string): ContactAction`

- [ ] **Step 1: Write the failing tests**

Add the new names to the existing `./hangul` import in `hangul.test.ts`. Append:

```typescript
describe('tensification (Article 23)', () => {
	it('tenses a plain ㄱ/ㄷ/ㅂ/ㅅ/ㅈ after a stop batchim', () => {
		expect(applyTensification('학교')).toBe('학꾜');
		expect(applyTensification('먹다')).toBe('먹따');
		expect(applyTensification('잡지')).toBe('잡찌');
		expect(applyTensification('식당')).toBe('식땅');
		expect(applyTensification('국밥')).toBe('국빱');
		expect(applyTensification('옆집')).toBe('엽찝');
	});

	it('does not tense nasals, liaison, clusters, or ㅎ', () => {
		expect(applyTensification('입니다')).toBe('입니다');
		expect(applyTensification('국물')).toBe('국물');
		expect(applyTensification('한국')).toBe('한국');
		expect(applyTensification('음악')).toBe('음악');
		expect(applyTensification('좋아요')).toBe('좋아요');
		expect(applyTensification('없다')).toBe('없다');
	});

	it('agrees with the reference-page tensification examples', () => {
		const row = SOUND_CHANGES.find((s) => s.id === 'tensification');
		expect(row).toBeDefined();
		expect(row!.scored).toBe(true);
		for (const ex of row!.examples) {
			expect(applyTensification(ex.written), ex.written).toBe(ex.spoken);
		}
	});

	it('returns the input unchanged when any character is not a syllable', () => {
		expect(applyTensification('학교!')).toBe('학교!');
		expect(applyTensification('')).toBe('');
	});
});

describe('nasalization (Article 18)', () => {
	it('turns ㄱ/ㄷ/ㅂ into ㅇ/ㄴ/ㅁ before ㄴ or ㅁ', () => {
		expect(applyNasalization('국물')).toBe('궁물');
		expect(applyNasalization('입니다')).toBe('임니다');
		expect(applyNasalization('학년')).toBe('항년');
		expect(applyNasalization('닫는')).toBe('단는');
		expect(applyNasalization('밥물')).toBe('밤물');
		expect(applyNasalization('앞문')).toBe('암문');
	});

	it('does not nasalize tensification, liaison, clusters, ㅎ, or Article 19', () => {
		expect(applyNasalization('학교')).toBe('학교');
		expect(applyNasalization('한국')).toBe('한국');
		expect(applyNasalization('음악')).toBe('음악');
		expect(applyNasalization('좋아요')).toBe('좋아요');
		expect(applyNasalization('없다')).toBe('없다');
		expect(applyNasalization('독립')).toBe('독립');
	});

	it('agrees with the reference-page nasalization examples', () => {
		const row = SOUND_CHANGES.find((s) => s.id === 'nasalization');
		expect(row).toBeDefined();
		expect(row!.scored).toBe(true);
		for (const ex of row!.examples) {
			expect(applyNasalization(ex.written), ex.written).toBe(ex.spoken);
		}
	});

	it('returns the input unchanged when any character is not a syllable', () => {
		expect(applyNasalization('국물!')).toBe('국물!');
		expect(applyNasalization('')).toBe('');
	});
});

describe('contactAction', () => {
	it('derives tense, nasal, or stay', () => {
		expect(contactAction('학교')).toEqual({ type: 'tense' });
		expect(contactAction('먹다')).toEqual({ type: 'tense' });
		expect(contactAction('국물')).toEqual({ type: 'nasal' });
		expect(contactAction('입니다')).toEqual({ type: 'nasal' });
		expect(contactAction('한국')).toEqual({ type: 'stay' });
		expect(contactAction('음악')).toEqual({ type: 'stay' });
	});

	it('applyContact uses tensification when it fires, otherwise nasalization', () => {
		expect(applyContact('학교')).toBe('학꾜');
		expect(applyContact('국물')).toBe('궁물');
		expect(applyContact('한국')).toBe('한국');
		expect(romanizeWord(applyContact('학교'))).toBe('hak-kkyo');
		expect(romanizeWord(applyContact('입니다'))).toBe('im-ni-da');
		expect(romanizeWord(applyContact('국밥'))).toBe('guk-ppap');
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd app && pnpm test src/lib/domain/hangul.test.ts`

Expected: FAIL — `applyTensification` is not exported.

- [ ] **Step 3: Implement the functions**

In `hangul.ts`, immediately after `liaisonAction` and before `const LEAD_RR`, add:

```typescript
/* ------------------------------------------------------------------ *
 * Tensification / nasalization — Articles 23 and 18
 * ------------------------------------------------------------------ */

const STOP_BATCHIM = new Set(['ㄱ', 'ㄷ', 'ㅂ']);
const TENSEABLE_LEAD = new Set(['ㄱ', 'ㄷ', 'ㅂ', 'ㅅ', 'ㅈ']);
const TENSE_LEAD: Record<string, string> = {
	'ㄱ': 'ㄲ', 'ㄷ': 'ㄸ', 'ㅂ': 'ㅃ', 'ㅅ': 'ㅆ', 'ㅈ': 'ㅉ'
};
const NASAL_LEAD = new Set(['ㄴ', 'ㅁ']);
const NASAL_FROM_STOP: Record<string, string> = {
	'ㄱ': 'ㅇ', 'ㄷ': 'ㄴ', 'ㅂ': 'ㅁ'
};

function skipContactJunction(cur: { lead: string; vowel: string; final: string }, next: { lead: string; vowel: string; final: string }): boolean {
	if (!cur.final) return true;
	if (isCluster(cur.final)) return true;
	if (cur.final === 'ㅎ') return true;
	if (next.lead === 'ㅇ' || next.lead === 'ㅎ') return true;
	return false;
}

function mapSyllables(word: string, fn: (out: { lead: string; vowel: string; final: string }[]) => void): string {
	const chars = [...word];
	if (chars.length === 0) return word;
	const parts = chars.map((ch) => decompose(ch));
	if (parts.some((p) => p === null)) return word;
	const out = parts.map((p) => ({ ...p! }));
	fn(out);
	return out.map((p) => compose(p.lead, p.vowel, p.final)).join('');
}

/**
 * Tense a following plain ㄱ/ㄷ/ㅂ/ㅅ/ㅈ after a stop batchim.
 * Article 23 only. Clusters, ㅎ, liaison, and nasalization are out of scope.
 */
export function applyTensification(word: string): string {
	return mapSyllables(word, (out) => {
		for (let i = 0; i < out.length - 1; i++) {
			const cur = out[i];
			const next = out[i + 1];
			if (skipContactJunction(cur, next)) continue;
			const stop = batchimSound(cur.final);
			if (!STOP_BATCHIM.has(stop) || !TENSEABLE_LEAD.has(next.lead)) continue;
			const tensed = TENSE_LEAD[next.lead];
			if (!tensed) continue;
			cur.final = stop;
			next.lead = tensed;
		}
	});
}

/**
 * ㄱ/ㄷ/ㅂ become ㅇ/ㄴ/ㅁ before ㄴ or ㅁ.
 * Article 18 only. Article 19 (stop + ㄹ) is out of scope.
 */
export function applyNasalization(word: string): string {
	return mapSyllables(word, (out) => {
		for (let i = 0; i < out.length - 1; i++) {
			const cur = out[i];
			const next = out[i + 1];
			if (skipContactJunction(cur, next)) continue;
			const stop = batchimSound(cur.final);
			if (!STOP_BATCHIM.has(stop) || !NASAL_LEAD.has(next.lead)) continue;
			const nasal = NASAL_FROM_STOP[stop];
			if (!nasal) continue;
			cur.final = nasal;
		}
	});
}

export function applyContact(word: string): string {
	const tensed = applyTensification(word);
	if (tensed !== word) return tensed;
	return applyNasalization(word);
}

export type ContactAction = { type: 'stay' } | { type: 'tense' } | { type: 'nasal' };

export function contactAction(word: string): ContactAction {
	if (applyTensification(word) !== word) return { type: 'tense' };
	if (applyNasalization(word) !== word) return { type: 'nasal' };
	return { type: 'stay' };
}
```

Set `scored: true` on the `tensification` and `nasalization` objects in `SOUND_CHANGES`.

Do not extract `skipContactJunction` / `mapSyllables` to another file.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd app && pnpm test src/lib/domain/hangul.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/domain/hangul.ts app/src/lib/domain/hangul.test.ts
git commit -m "feat(hangul): Article 23 tensification and Article 18 nasalization"
```

---

### Task 2: `contact` step type and widget

**Files:**
- Modify: `app/src/lib/content/types.ts`
- Create: `app/src/lib/components/steps/ContactStep.svelte`
- Create: `app/src/lib/components/steps/ContactStep.test.ts`
- Modify: `app/src/lib/components/LabRunner.svelte`
- Modify: `app/src/lib/polish.test.ts` (import ContactStep raw; assert `.arr` is `0.75rem` like LiaisonStep)

**Interfaces:**
- Consumes: `applyContact`, `contactAction` from Task 1
- Produces: `ContactStep` in the `Step` union; LabRunner dispatches `type === 'contact'`

This task is Svelte-heavy. The implementer must use Svelte MCP `svelte-autofixer` on `ContactStep.svelte` and `LabRunner.svelte` until clean. Copy `LiaisonStep` layout (word, gloss, prompt, picks, derived spoken reveal). Three buttons always, in order: Tense, Nasal, Stay. Labels those exact English strings (tests click by text).

- [ ] **Step 1: Write the failing widget tests**

Create `app/src/lib/components/steps/ContactStep.test.ts` modeled on `LiaisonStep.test.ts` (jsdom, `Element.prototype.animate` mock, `mount`/`unmount`/`flushSync`):

```typescript
// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount, type Component } from 'svelte';
import ContactStep from './ContactStep.svelte';
import type { ContactStep as ContactStepData } from '$lib/content/types';

beforeAll(() => {
	Element.prototype.animate = vi.fn().mockReturnValue({
		finished: Promise.resolve(),
		cancel: vi.fn(),
		finish: vi.fn(),
		play: vi.fn(),
		pause: vi.fn()
	});
});

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

const base = {
	type: 'contact' as const,
	do: 'Pick the change.',
	teach: '<p>teach</p>'
};

function click(el: HTMLElement, label: string) {
	const btn = [...el.querySelectorAll('button')].find((b) => b.textContent?.trim() === label);
	if (!btn) throw new Error(`no button "${label}"`);
	btn.click();
	flushSync();
}

describe('ContactStep', () => {
	it('settles Tense on 학교 and reveals derived speech', () => {
		const onSettle = vi.fn();
		const onNudge = vi.fn();
		const step: ContactStepData = { ...base, word: '학교', gloss: 'school' };
		const el = render(ContactStep, { step, onSettle, onNudge });
		expect(el.textContent).toContain('학교');
		click(el, 'Tense');
		expect(onSettle).toHaveBeenCalledTimes(1);
		expect(onNudge).not.toHaveBeenCalled();
		expect(el.textContent).toContain('학꾜');
	});

	it('nudges Nasal on a tensification word and does not settle', () => {
		const onSettle = vi.fn();
		const onNudge = vi.fn();
		const step: ContactStepData = { ...base, word: '학교' };
		const el = render(ContactStep, { step, onSettle, onNudge });
		click(el, 'Nasal');
		expect(onSettle).not.toHaveBeenCalled();
		expect(onNudge).toHaveBeenCalledTimes(1);
		expect(onNudge.mock.calls[0][1] ?? false).toBeFalsy();
	});

	it('settles Nasal on 국물 and reveals 궁물', () => {
		const onSettle = vi.fn();
		const onNudge = vi.fn();
		const step: ContactStepData = { ...base, word: '국물', gloss: 'broth' };
		const el = render(ContactStep, { step, onSettle, onNudge });
		click(el, 'Nasal');
		expect(onSettle).toHaveBeenCalledTimes(1);
		expect(el.textContent).toContain('궁물');
	});

	it('settles Stay on 한국', () => {
		const onSettle = vi.fn();
		const onNudge = vi.fn();
		const step: ContactStepData = { ...base, word: '한국', gloss: 'Korea' };
		const el = render(ContactStep, { step, onSettle, onNudge });
		click(el, 'Stay');
		expect(onSettle).toHaveBeenCalledTimes(1);
		click(el, 'Tense');
		expect(onNudge).not.toHaveBeenCalled();
	});
});
```

- [ ] **Step 2: Run the widget test to verify it fails**

Run: `cd app && pnpm test src/lib/components/steps/ContactStep.test.ts`

Expected: FAIL — module or `ContactStep` type missing.

- [ ] **Step 3: Add the type**

In `types.ts`, after `LiaisonStep`:

```typescript
export interface ContactStep extends BaseStep {
	type: 'contact';
	word: string;
	gloss?: string;
}
```

Add `ContactStep` to the `Step` union.

- [ ] **Step 4: Implement ContactStep.svelte**

Mirror `LiaisonStep.svelte` (same CSS tokens, same `.arr { font-size: 0.75rem }`). Script:

- Import `applyContact`, `contactAction` from `$lib/domain/hangul` and `ContactStep` from `$lib/content/types`.
- Props: `{ step, onSettle, onNudge }` with `onSettle: (teach?: string) => void` and `onNudge: (html: string, soft?: boolean) => void`.
- `spoken = applyContact(step.word)`, `want = contactAction(step.word)`.
- `picked` is `'tense' | 'nasal' | 'stay' | null`.
- `solved` when `picked === want.type`.
- `missCopy(which)`:
  - stay + want tense: two plain stops in a row; the second tenses.
  - stay + want nasal: cannot hold a stop then open the nose for ㄴ/ㅁ.
  - nasal + want tense: next letter is a plain ㄱ/ㄷ/ㅂ/ㅅ/ㅈ, not ㄴ/ㅁ.
  - tense + want nasal: next letter is ㄴ or ㅁ.
  - else (stay word): the first block does not end in a stop.
- `pick(which)`: if solved return; set picked; if `which === want.type` then `onSettle()` else `onNudge(missCopy(which))` with no `soft: true`.
- Markup: word + gloss; prompt “A stop, then another consonant. Tense the next letter, nasalize the batchim, or stay?”; three buttons with visible text `Tense`, `Nasal`, `Stay` (Stay may keep the `.stay` class like LiaisonStep); on solved, reveal `{step.word} is said [{spoken}]`.
- Button order: Tense, Nasal, Stay.
- `aria-label` group: “Contact choices”.
- After settle, disable buttons. Wrong pick uses `.wrong`; right uses `.right`.

Run Svelte autofixer until clean.

- [ ] **Step 5: Dispatch in LabRunner.svelte**

Import `ContactStep`. In the well `{#if}` chain, after liaison and before read:

```svelte
{:else if step.type === 'contact'}
	<ContactStep {step} {onSettle} {onNudge} />
```

Keep the `{:else} {@const _exhaustive: never = step}` branch. Autofixer until clean.

- [ ] **Step 6: Polish assertion**

In `polish.test.ts`, import `contactStep` from `./components/steps/ContactStep.svelte?raw` next to `liaisonStep`. Add:

```typescript
expect(styleBlock(contactStep)).toMatch(/\.arr\s*\{[^}]*font-size:\s*0\.75rem/s);
```

beside the existing liaison `.arr` assertion.

- [ ] **Step 7: Run tests**

Run: `cd app && pnpm test src/lib/components/steps/ContactStep.test.ts src/lib/polish.test.ts && pnpm check`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add app/src/lib/content/types.ts app/src/lib/components/steps/ContactStep.svelte app/src/lib/components/steps/ContactStep.test.ts app/src/lib/components/LabRunner.svelte app/src/lib/polish.test.ts
git commit -m "feat(lab): contact widget for tensify / nasalize / stay"
```

---

### Task 3: Lab 07 content and `lab07` deck tier

**Files:**
- Create: `app/src/lib/content/lab07.ts`
- Modify: `app/src/lib/content/index.ts`
- Modify: `app/src/lib/content/lab06.ts` (finish.summary only)
- Modify: `app/src/lib/content/content.test.ts`
- Modify: `app/src/lib/domain/deck.ts`
- Modify: `app/src/lib/domain/deck.test.ts`

**Interfaces:**
- Consumes: `ContactStep`, `applyTensification`, `applyNasalization`, `applyContact`, `contactAction`, `romanizeWord`
- Produces: lab id `0007` unlocking `lab07`; ten `pron` cards; `TIERS` entry `{ id: 'lab07', label: 'Stops', lab: '0007', size: 10 }`

`content.test.ts` requires every `TIERS` id to be unlocked by exactly one lab. Register the lab and the deck tier in this same task.

- [ ] **Step 1: Write failing course/deck tests**

Append to `content.test.ts` (extend the hangul import with `applyContact`, `contactAction`):

```typescript
describe('contact steps agree with the phonology', () => {
	it('uses real syllables and derives speech from applyContact', () => {
		for (const { lab, step, i } of ALL_STEPS) {
			if (step.type !== 'contact') continue;
			for (const ch of [...step.word]) {
				expect(decompose(ch), `${where(lab, i)}: ${ch}`).not.toBeNull();
			}
			const spoken = applyContact(step.word);
			expect(spoken.length, `${where(lab, i)}: applyContact returned empty`).toBeGreaterThan(0);
			const action = contactAction(step.word);
			if (action.type === 'stay') {
				expect(spoken, `${where(lab, i)}: ${step.word} should stay`).toBe(step.word);
			} else {
				expect(spoken, `${where(lab, i)}: ${step.word} should change`).not.toBe(step.word);
			}
		}
	});

	it('never uses liaison, cluster, ㅎ, or Article 19 words as a contact widget', () => {
		const banned = ['음악', '좋아요', '없다', '독립', '학원', '밭이'];
		for (const { step } of ALL_STEPS) {
			if (step.type !== 'contact') continue;
			expect(banned).not.toContain(step.word);
		}
	});

	it('includes Stay-correct 한국 and both rule families', () => {
		const words = ALL_STEPS.filter((s) => s.step.type === 'contact').map((s) =>
			s.step.type === 'contact' ? s.step.word : ''
		);
		expect(words).toContain('한국');
		expect(words).toContain('학교');
		expect(words).toContain('국물');
		expect(contactAction('한국')).toEqual({ type: 'stay' });
		expect(contactAction('학교')).toEqual({ type: 'tense' });
		expect(contactAction('국물')).toEqual({ type: 'nasal' });
	});
});
```

Append to `deck.test.ts` (import `applyTensification`, `applyNasalization`):

```typescript
describe('lab07 / pron cards', () => {
	it('unlocks ten lab07 cards derived from tensification or nasalization', () => {
		const cards = cardsOfTier('lab07');
		expect(cards).toHaveLength(10);
		expect(TIERS.find((t) => t.id === 'lab07')).toMatchObject({ lab: '0007', size: 10 });
		for (const c of cards) {
			expect(c.kind).toBe('pron');
			const spoken =
				applyTensification(c.front) !== c.front
					? applyTensification(c.front)
					: applyNasalization(c.front);
			expect(c.answers).toContain(spoken);
			expect(c.answers).toContain(romanizeWord(spoken));
		}
	});

	it('requires hyphenated ASCII for 학교', () => {
		const card = CARDS_BY_ID['p-학교'];
		expect(checkAnswer(card, 'hak-kkyo')).toBe(true);
		expect(checkAnswer(card, '학꾜')).toBe(true);
		expect(checkAnswer(card, 'hakgyo')).toBe(false);
		expect(checkAnswer(card, 'hak-gyo')).toBe(false);
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd app && pnpm test src/lib/content/content.test.ts src/lib/domain/deck.test.ts`

Expected: FAIL — no `lab07` / no contact steps.

- [ ] **Step 3: Author `lab07.ts`**

Create `app/src/lib/content/lab07.ts` as a `Lab` with:

- `id: '0007'`, `number: 7`
- `title: 'The Stop and Its Neighbor'`
- `standfirst: 'Liaison filled an empty ㅇ. The other surprises are what a stop does to the letter that follows — tense it, or become a nasal.'`
- `minutes: 10`, `unlocks: 'lab07'`, `requires: '0006'`
- `finish.title: 'Two stops, or a stop plus a nasal'`
- `finish.summary: 'A ㄱ/ㄷ/ㅂ batchim tenses a following plain ㄱ/ㄷ/ㅂ/ㅅ/ㅈ, and becomes ㅇ/ㄴ/ㅁ before ㄴ/ㅁ. Same junction, different neighbor. Next: ㅎ — aspiration and ㅎ-deletion, the letter Lab 06 refused to cram into liaison.'`
- Exactly 16 steps, matching the spec card-for-card (copy option strings and teach HTML from the spec). Contact steps: words 학교, 먹다, 잡지, 식당, 한국, 국물, 입니다, 학년. Choice/read as specified. `teach` is HTML with `jamo` / `hg` / `rom` spans like lab06.
- Do not put a spoken form in a contact `teach` that disagrees with `applyContact` (the widget already reveals the derived form; teach may repeat it).

Register in `index.ts`: import `lab07`, append to `LABS`.

In `lab06.ts`, replace the finish.summary last sentence so it no longer says tensification is next. New last sentence: `Lab 07 takes the other neighbor: a stop that tenses, or a stop that becomes a nasal.`

- [ ] **Step 4: Add the deck tier**

In `deck.ts`, after the liaison block, add `CONTACT_NOTES` and `contact` cards using the spec table. Each card:

```typescript
const spoken = applyTensification(written) !== written
	? applyTensification(written)
	: applyNasalization(written);
```

Ids `p-${written}`. Kind `'pron'`, tier `'lab07'`. Answers `[romanizeWord(spoken), spoken]`. Import `applyTensification` and `applyNasalization` next to `applyLiaison`.

Spread `...contact` into `DECK` after `...liaison`. Add TIERS entry after lab06:

```typescript
{ id: 'lab07', label: 'Stops', lab: '0007', size: contact.length }
```

- [ ] **Step 5: Run tests**

Run: `cd app && pnpm test src/lib/content/content.test.ts src/lib/domain/deck.test.ts src/lib/domain/hangul.test.ts`

Expected: PASS, including option-length and “unlocks each deck tier exactly once”.

- [ ] **Step 6: Commit**

```bash
git add app/src/lib/content/lab07.ts app/src/lib/content/index.ts app/src/lib/content/lab06.ts app/src/lib/content/content.test.ts app/src/lib/domain/deck.ts app/src/lib/domain/deck.test.ts
git commit -m "feat(lab07): tensification and nasalization sitting plus review tier"
```

---

### Task 4: Course wiring and notes

**Files:**
- Modify: `app/src/routes/+page.svelte`
- Modify: `app/src/routes/review/+page.svelte`
- Modify: `app/src/routes/drill/+page.svelte`
- Modify: `app/README.md`
- Modify: `app/src/lib/deployConfig.test.ts`
- Modify: `NOTES.md`

**Interfaces:**
- Consumes: `lab07` already registered
- Produces: hardcoded unlocked-tier lists include `'lab07'`; README documents seven labs

Sprint inventory still ignores `lab07` (no new blocks). Add the id so the three lists cannot drift from `TIERS`.

- [ ] **Step 1: Extend the three unlocked-tier arrays**

In `+page.svelte`, `review/+page.svelte`, and `drill/+page.svelte`, every `['lab01', …, 'lab06']` (including the `as const` variants and the review `order` used by `cumulativeInventory`) becomes `['lab01', 'lab02', 'lab03', 'lab04', 'lab05', 'lab06', 'lab07']`.

Drill page has the list twice (derived unlocked + inside `start()`). Change both.

- [ ] **Step 2: README and deployConfig**

`app/README.md`: `lab01..lab06.ts` → `lab01..lab07.ts`.

`deployConfig.test.ts`: matcher `/lab01\.\.lab06/` → `/lab01\.\.lab07/` and rename the test from “six-lab course” to “seven-lab course”.

- [ ] **Step 3: NOTES.md**

In “Backlog of lesson ideas” / sound-change list: Lab 07 is built (tensification + nasalization). Next to implement is aspiration + ㅎ-deletion. Do not rewrite unrelated history.

- [ ] **Step 4: Run the suite**

Run: `cd app && pnpm test && pnpm check`

Expected: all passing, 0 `svelte-check` errors.

- [ ] **Step 5: Commit**

```bash
git add app/src/routes/+page.svelte app/src/routes/review/+page.svelte app/src/routes/drill/+page.svelte app/README.md app/src/lib/deployConfig.test.ts NOTES.md
git commit -m "chore: wire lab07 into nav, sprint lists, and notes"
```

---

## Self-review

**1. Spec coverage:** Phonology, widget, 16 cards, 10 pron cards, scored SOUND_CHANGES, forbidden words, lab06 finish pointer, hardcoded tier lists, README. No audio, no composition, no Article 19.

**2. Placeholder scan:** No TBD. Full test bodies and function bodies inlined.

**3. Type consistency:** `ContactAction` / `contactAction` / `applyContact` / `ContactStep.type === 'contact'` used the same way in Tasks 1–3. Deck uses `applyTensification` then `applyNasalization`, matching `applyContact`.
