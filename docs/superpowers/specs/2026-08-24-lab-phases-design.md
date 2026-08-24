# Lab phases: first-class teaching sections

**Date:** 2026-08-24
**Status:** ready to implement (written spec pending review)
**Issue:** [#169](https://github.com/knakamura13/learning-korean/issues/169)
**Supersedes:** [#164](https://github.com/knakamura13/learning-korean/issues/164) (research spike)
**Interim:** [#165](https://github.com/knakamura13/learning-korean/pull/165) already strips `Act N ·` at display time. This spec replaces that stopgap.

## Problem

Labs are authored in teaching chunks, but the learner UI does not say which chunk you are in or what it is for. After #165 the leftover step eyebrow is `2 OF 5` or `THE MISMATCH` (CSS-uppercased). The pip rail is a flat 14–17 dots. `Card N of M` already answers overall position. About thirteen `do` / `hint` / `teach` strings still say `Act N`.

A stranger on Lab 01 card 2 (`Say mmm. Hold it.`) cannot tell they are collecting the five base shapes.

## Constraints (locked)

- Interactive labs. Phase chrome names the job. It does not teach the rule. Explanation still arrives as feedback on an action.
- Card order does not change. No cards added, removed, or reordered.
- Learner-facing copy never says Act, Phase, Part, or Section as a unit word.
- Repo and docs say **phase**. Never **block** for this (syllable block already owns that word).
- No 1-card learner-facing phase.
- A 2-card phase is allowed only if all four hold:
  1. The two cards share one job a stranger can say as a verb phrase.
  2. Merging into a neighbor would mix two jobs.
  3. A third card would be padding, not more of the same job.
  4. It is not a door into the next job (mismatch → operate) and not a caption on the last one (name it / Stay).
- Phase titles are chapter titles: clear alone, not catchphrases, no jargon verbs (`jump`, `tense`, `aspirate` as verbs).
- Hangul in titles: one already-known letter as the subject, or two already-known letters for a contact rule. No cluster glyphs, no jamo lists, no Hangul words.
- One progress story: lab `h1` stays, `Card N of M` stays, leftover per-card subtitles die, no within-phase `2 of 5`.
- Phone and desktop are equal. No extra pip width (no gaps). Forced-colors and `prefers-reduced-motion` keep working.
- `#165`’s `formatStepEyebrow` goes away with the `act` field. Do not keep a display-time Act stripper.

## Approaches considered

**1. Quiet chrome.** Kill leftover eyebrows. Keep `Card N of M` and a flat rail. Rejected: card 2 of Lab 01 still cannot name the teaching job.

**2. Nested `phases[].steps`. ** Reshape every lab into trees of steps. Rejected: widgets, session resume, and pip state are a flat index. Nesting buys nothing the runner needs.

**3. Title plus dimmed pips, flat `steps`, `lab.phases` metadata (locked).** Replace the leftover eyebrow with the chapter title. Keep the numbered rail. Dim pips outside the active phase. Author counts on `Lab`, not per-card `act` strings.

## Architecture

### Data

Add to `app/src/lib/content/types.ts`:

```ts
export interface LabPhase {
	title: string;
	count: number;
}
```

`Lab` gains `phases: LabPhase[]`. Remove `act?: string` from `BaseStep`.

`count` is the number of consecutive action cards in that phase, in order. Sum of counts must equal `steps.length`. Every count is an integer `>= 2`.

Pure helpers in a new `app/src/lib/domain/labPhase.ts` (flat index in, title and bounds out):

```ts
export function phaseIndexAt(phases: readonly LabPhase[], cardIndex: number): number
export function phaseAt(phases: readonly LabPhase[], cardIndex: number): LabPhase
export function phaseBounds(phases: readonly LabPhase[], phaseIndex: number): {
	start: number
	end: number
} // start inclusive, end exclusive
export function cardInActivePhase(
	phases: readonly LabPhase[],
	cardIndex: number,
	currentIndex: number
): boolean
```

Out-of-range `cardIndex` throws in tests and is not reachable from `LabRunner` (it only passes `0..steps.length-1`).

Delete `app/src/lib/content/formatStepEyebrow.ts` and its test.

Author comments in lab files may read `/* ---- Find the five shapes ---- */`. They are not learner-facing.

### Surfaces

**Header (unchanged).** `Lab 01 · ~9 minutes` stays `.eyebrow`. Compact head still drops the standfirst after card 1. Lab `h1` stays the lab title on every card.

**Pip rail.** Still numbered 1..N. Still `Card {n} of {total}`. Jump rules unchanged (`pipState.ts`). `LabPipRail` takes `phases` (or `activeStart` / `activeEnd`) and marks each pip `data-phase="current" | "other"`. Current-phase pips keep today’s styling. Other-phase pips use `opacity: 0.4`. The selected pip is always current-phase and never dimmed.

Forced-colors: do not rely on opacity. `[data-phase='other']` uses `GrayText`. Current-phase pips keep today’s Highlight / ButtonText rules.

`prefers-reduced-motion`: no extra motion. Dimming is instant.

Nav accessible name: `Lab card navigation, {phase title}`. Per-pip `pipLabel` stays card-based (no phase title stuffed into every dot).

**Prompt.** The leftover `{#if step.act}` eyebrow is replaced by an always-on phase title:

```html
<p class="phase-title">{phaseAt(lab.phases, index).title}</p>
<h2 class="do">…</h2>
```

`.phase-title` is **not** `.eyebrow`. `.eyebrow` stays uppercase tracked 0.75rem for `Lab 01 · ~9 minutes` only.

`.phase-title`:

- UI sans (same family as `.do`)
- `font-size: 0.85rem`
- `font-weight: 600`
- `letter-spacing: normal`
- `text-transform: none`
- `color: var(--accent)`
- `line-height: 1.35`
- `margin: 0 0 var(--s2)`
- wraps; two lines on a phone are allowed. Do not truncate.

### Copy rules (authoring)

Titles are chapter titles. They must make sense with the lab chrome hidden.

Forbidden in titles: Act, Phase, Part, Section, catchphrases, jargon verbs, cluster glyphs (`ㄺ`), jamo inventories (`ㅏ ㅓ ㅗ ㅜ`), Hangul words (`김`, `밟다`).

Allowed: one known letter (`ㄹ`, `ㅎ`, `ㅇ`, `ㅗ`, `ㅜ`, `ㅅ`, `ㅆ`) when that letter is the subject. Two known letters when the rule is contact (`ㄴ` meets `ㄹ`, `ㄴ or ㅁ` as the environment pair).

Every lab’s last phase title is exactly `Read from the letters alone`.

Callbacks name the action or drop the history. They never name a phase. `do` lines on recap reads do not say `You already`.

### Docs

Add **Phase** to `UBIQUITOUS_LANGUAGE.md` under Teaching path:

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Phase** | A named teaching job inside a lab, one chapter title, two or more consecutive action cards | Act, Part, Section, block (block is a syllable) |

Relationships: a **Lab** contains ordered **Phases**; a **Phase** contains consecutive **Action cards**.

## Phase inventory (locked)

Card numbers are 1-based inclusive, matching the pip numbers. Counts must match `steps` in each `labNN.ts`.

### Lab 01 — 17 cards

| Cards | Count | Title |
| --- | --- | --- |
| 1–5 | 5 | Find the five shapes |
| 6–10 | 5 | A stroke adds a puff of air |
| 11–12 | 2 | Doubling makes a tense consonant |
| 13–14 | 2 | Where the consonant sits in the block |
| 15–17 | 3 | Read from the letters alone |

Merges: old Act 3 (two builds) into the stroke-rule phase. Act 4 doubling and Act 5 layout stay 2-card (test pass: merging them mixes two jobs).

### Lab 02 — 16 cards

| Cards | Count | Title |
| --- | --- | --- |
| 1–2 | 2 | Vowels are a long stroke and a tick |
| 3–6 | 4 | Build the four one-tick vowels |
| 7–9 | 3 | A second tick adds a y-glide |
| 10–11 | 2 | The vowel with no tick, and the rounded o |
| 12–13 | 2 | Build a tall block and a wide block |
| 14–16 | 3 | Read from the letters alone |

### Lab 03 — 16 cards

| Cards | Count | Title |
| --- | --- | --- |
| 1–5 | 5 | Compounds built from ㅗ |
| 6–9 | 4 | Compounds built from ㅜ |
| 10–11 | 2 | Three compound spellings, one sound |
| 12–13 | 2 | Wrapping vowels put the consonant in the corner |
| 14–16 | 3 | Read from the letters alone |

### Lab 04 — 14 cards

| Cards | Count | Title |
| --- | --- | --- |
| 1–3 | 3 | A third slot opens under the vowel |
| 4–9 | 6 | Sixteen batchim letters make seven sounds |
| 10–11 | 2 | Build the two most common surnames |
| 12–14 | 3 | Read from the letters alone |

### Lab 05 — 14 cards

| Cards | Count | Title |
| --- | --- | --- |
| 1–4 | 4 | Most clusters pronounce the first letter |
| 5–7 | 3 | Three clusters drop ㄹ |
| 8–9 | 2 | Clusters with ㅎ make the next consonant aspirated |
| 10–11 | 2 | Two verb stems break the cluster rules |
| 12–14 | 3 | Read from the letters alone |

### Lab 06 — 16 cards

| Cards | Count | Title |
| --- | --- | --- |
| 1–8 | 8 | A batchim fills the next empty ㅇ |
| 9–11 | 3 | A cluster splits when a vowel follows |
| 12–13 | 2 | ㅅ moves and becomes ㅆ |
| 14–16 | 3 | Read from the letters alone |

Merges: mismatch intro and “name it / ㅇ Stay” into the jump operate (8 cards, one job).

### Lab 07 — 16 cards

| Cards | Count | Title |
| --- | --- | --- |
| 1–8 | 8 | A stop makes the next plain consonant tense |
| 9–13 | 5 | A stop is pronounced through the nose before ㄴ or ㅁ |
| 14–16 | 3 | Read from the letters alone |

Merges: mismatch intro and “name it / Stay” into tensify. Nasal intro into nasal operate. Last phase includes the “one junction” choice, then two reads. Title stays the shared last-phase string.

### Lab 08 — 16 cards

| Cards | Count | Title |
| --- | --- | --- |
| 1–4 | 4 | ㅎ plus a stop becomes aspirated |
| 5–8 | 4 | A stop plus ㅎ becomes aspirated |
| 9–12 | 4 | ㅎ before a vowel is not pronounced |
| 13–14 | 2 | The next letter decides what ㅎ does |
| 15–16 | 2 | Read from the letters alone |

Merge: mismatch intro into the first aspirate operate.

### Lab 09 — 16 cards

| Cards | Count | Title |
| --- | --- | --- |
| 1–5 | 5 | When ㄴ meets ㄹ, both are pronounced ㄹ |
| 6–9 | 4 | When ㄹ meets ㄴ, both are pronounced ㄹ |
| 10–13 | 4 | ㄹ after a nasal becomes ㄴ |
| 14–16 | 3 | Read from the letters alone |

Merges: mismatch intro into the first flow operate. The single last read merges into Stay + flow vs yield (1-card ban). Last phase is two discriminate cards and one read. Title stays the shared last-phase string.

### Lab 10 — 17 cards

| Cards | Count | Title |
| --- | --- | --- |
| 1–2 | 2 | The family name is the first syllable |
| 3–8 | 6 | Sound changes still apply inside a name |
| 9–12 | 4 | The close-friend name suffixes |
| 13–15 | 3 | The polite suffix and the honorific |
| 16–17 | 2 | Read from the letters alone |

## Callback copy (locked)

Only these learner-facing strings change. Surrounding HTML and the rest of each sentence stay as they are today, except the replaced clause.

| Id | File | Field | Replace | With |
| --- | --- | --- | --- | --- |
| C1 | `lab01.ts` 사우나 teach | ` from Act 1` | *(delete that substring)* |
| C2 | `lab01.ts` 기타 teach | `the letter you derived in Act 3` | `the ㅌ you built by adding a stroke` |
| C3 | `lab03.ts` ㅙ hint | `one of the vowels you built in Act 1 behind it.` | `ㅐ behind it.` |
| C4 | `lab06.ts` 부엌에 do | `You jumped this one in Act 2. Now read it as a phrase.` | `Read it as a phrase.` |
| C5 | `lab06.ts` 부엌에 teach | `The ㅋ you restored in Act 2,` | `The ㅋ you restored,` |
| C6 | `lab07.ts` 학교 read do | `You tensed this in Act 2. Now read it as a word.` | `Read it as a word.` |
| C7 | `lab07.ts` 입니다 read do | `You nasalized this in Act 5. Now read it as a phrase.` | `Read it as a phrase.` |
| C8 | `lab08.ts` 축하 do | `You fused this in Act 3. Now read it as a word.` | `Read it as a word.` |
| C9 | `lab08.ts` 좋아요 do | `You deleted this in Act 4. Now read it as a phrase.` | `Read it as a phrase.` |
| C10 | `lab09.ts` 대통령 do | `You made this yield in Act 4… at presidential scale. Read it as a word.` | `Read it as a word.` |
| C11 | `lab10.ts` 민준아 do | `Act 1's contact gets called over. Operate the junction.` | `A close friend calls 민준. Operate the junction.` |
| C12 | `lab10.ts` 박은지 read do | `You operated this in Act 2. The blocks read as written — which cuts does the mouth actually say?` | `The blocks read as written — which cuts does the mouth actually say?` |
| C13 | `lab10.ts` 고객님 do | `You nasalized this in Act 4. Now read it as an address.` | `Read it as an address.` |

C10’s presidential color stays in that card’s existing teach. Do not add `You already` anywhere.

After these edits, no `do` / `hint` / `teach` / `miss` string in `app/src/lib/content/lab*.ts` contains `Act`. Author comments may still say Act until they are rewritten to the phase title; they are not learner-facing. Implementation should rewrite those comments to the locked titles in the same pass so the files do not keep two vocabularies.

## Tests (required)

- `labPhase.ts`: index 0 of Lab 01 → title `Find the five shapes`; index 5 → `A stroke adds a puff of air`; last index → `Read from the letters alone`. Bounds do not overlap and cover `0..n`.
- `content.test.ts`: for every lab in `LABS`, `phases.reduce((n, p) => n + p.count, 0) === steps.length`; every `count >= 2`; last phase title is `Read from the letters alone`; no `act` on any step; `/\bAct\b/` does not match `do`, `hint`, `teach`, or `miss`.
- Component: `LabRunner` prompt contains `.phase-title` with the current title and does not call `formatStepEyebrow`. `LabPipRail` sets `data-phase="other"` on a pip outside the current bounds (Lab 01 card 1: pips 6–17 are other).
- Delete `formatStepEyebrow` tests with the module.
- `polish.test.ts`: `.phase-title` is not `text-transform: uppercase`. Existing `.eyebrow` contract for the lab header is unchanged.

## Out of scope

- Changing card pedagogy, widgets, or unlocks.
- A within-phase counter.
- Pip gaps or a second row of phase pips.
- Resume, session persistence, or SRS.
- Labs page index copy (lab titles and standfirsts stay).

## Implementation order

1. Types + `labPhase.ts` + tests (red, then green).
2. Point `LabRunner` / `LabPipRail` at phases; delete `act` and `formatStepEyebrow`. Visual: sentence-case title, dim other-phase pips.
3. Author `phases` on all ten labs, drop `act`, apply C1–C13, rewrite Act comments to phase titles.
4. Content inventory tests. Ubiquitous language row.
5. `pnpm test` and `pnpm check` in `app/`.
