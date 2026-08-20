# Timed block sprint

**Date:** 2026-08-20
**Status:** ready to implement
**Slice:** v1 random-legal-block generator only. No sound-change mill, no authentic text, no SRS block tier, no native audio, no Hangul composition, no accounts/sync.

## Why this, why now

The win condition is: read an unfamiliar syllable block cold, under ~2 seconds, once the letters are known. Labs 01–06 teach the writing system. Review schedules single jamo (and ten liaison words). Nothing tests a block, nothing measures the two-second line, and a sitting longer than the 10-card review cap runs out of product.

This sprint is the missing practice surface: a one-minute round of generated syllable blocks, scored as median correct-decode time in milliseconds. It is a mill, not a lesson. It never teaches a rule and never writes Review intervals.

## Constraints (locked)

- Hangul-first decoder, not a language app. No mic, no speech scoring, no XP/streaks/loot/leaderboards.
- Teaching paths stay labs. This route is a drill, not a primer. Copy does not explain Hangul.
- Phone and desktop are equal. A desk-only or phone-only win fails.
- A mill may run only on letters whose lab is unlocked (`unlocked` tiers, not skip-ahead `openedLabs`).
- One addition, one surface: `/drill`. Entry links are part of shipping the surface, not a second product.
- Lessons never hard-code an answer the domain can derive. Option text is `romanizeSyllable` of a composed block.
- Answer options in a trial are the same string length. Unequal options leak the answer by shape.
- Session length is not a cap. A 60-second round is a real 10-minute sitting; repeating rounds is the 60-minute sitting.
- Do not import or call `srs.ts` from the sprint module. A sprint answer must be structurally unable to `grade` a card.

## Approaches considered

**A. Typed Revised Romanization.** Same mechanic as Review. Rejected for this slice: the clock would measure typing, and a phone would lose to a hardware keyboard.

**B. Compose the visible block from jamo trays.** Matches lab widgets. Rejected: that is copying glyphs, not decoding sound.

**C. One tap among four same-length romanizations (recommended).** Stimulus is the Hangul block. Response is a tap. Clock stops on the tap. Phone and desktop share the same control. Distractors are other legal blocks whose romanization has the same character length, so shape does not leak and you still have to read.

## Domain

Pure module: `app/src/lib/domain/sprint.ts`. Clock and RNG are injected. No I/O, no Svelte, no `srs`.

### Eligibility

`sprintEligible(unlocked)` is true only when `unlocked` contains both `lab01` and `lab02`. Skip-ahead access to later labs does not count. Without a vowel, no syllable exists.

### Inventory

`sprintInventory(unlocked)` returns the unique set of syllable blocks that can be composed from:

| Tier | Adds |
| --- | --- |
| `lab01` | All 19 `LEADS` |
| `lab02` | The 10 basic vowels `ㅏ ㅑ ㅓ ㅕ ㅗ ㅛ ㅜ ㅠ ㅡ ㅣ` |
| `lab03` | The remaining `VOWELS` (compounds) |
| `lab04` | Non-empty `FINALS` that are not clusters (simple batchim, including doubles ㄲ/ㅆ) |
| `lab05` | Cluster finals (`CLUSTERS`) |
| `lab06` | Nothing. Liaison is a later generator. |

CV (empty batchim) is always in the pool once eligible. `compose` is the only way a block is built.

### Trial

`nextTrial(blocks, rng, avoid?)` returns `{ block, options, answerIndex }` or `null`.

- `block` is a member of `blocks`, not equal to `avoid` when another choice exists.
- `options` has length 4. Each entry is `romanizeSyllable` of some pool block. All four strings have the same `.length`. All four strings are unique.
- `options[answerIndex] === romanizeSyllable(block)`.
- The three distractors are romanizations of *other* blocks, chosen with `rng`.
- If a candidate cannot find three same-length unique distractor romanizations, try another target. After exhausting reasonable attempts, return `null`.

`OPTION_COUNT` is 4. Do not author option text by hand.

### Round

`SPRINT_MS` is `60_000`.

```ts
type SprintPhase = 'idle' | 'running' | 'done';

interface SprintRound {
  phase: SprintPhase;
  endsAt: number;
  trial: SprintTrial | null;
  trialStartedAt: number;
  correctMs: number[];
  seen: number;
  correct: number;
}
```

- `idleRound()` — empty idle state.
- `startRound(now, blocks, rng)` — `phase: 'running'`, `endsAt: now + SPRINT_MS`, first trial, `trialStartedAt: now`. If no trial can be built, stay idle with `trial: null`.
- `tickRound(round, now)` — if running and `now >= endsAt`, go `done` and drop `trial`. Otherwise unchanged identity is allowed when still running.
- `answerRound(round, optionIndex, now, blocks, rng)` — ignored unless `phase === 'running'` and a trial exists. Increments `seen`. If the index is the answer, append `now - trialStartedAt` to `correctMs` and increment `correct`. Wrong taps do not retry and do not enter `correctMs`. If time remains, replace `trial` with `nextTrial(..., avoid: previous block)` and set `trialStartedAt` to `now`. If time is up, go `done`.
- `sprintScore(round)` — `{ medianMs, correct, seen }`. `medianMs` is `null` when `correctMs` is empty. Median of an even list is the rounded mean of the two central values after sorting.

The reported number is **median milliseconds of correct taps**. `correct` / `seen` is supporting copy, not the headline.

## UI

Route: `app/src/routes/drill/+page.svelte`. Prerendered like every other route (`+layout.ts` already sets `prerender = true`).

Phases match the domain: idle, running, done. Plus a **locked** view when `!sprintEligible(progress unlocked tiers)` after client hydrate.

### Locked

No Hangul lesson. Point at the missing lab: Lab 01 if `lab01` is missing, otherwise Lab 02. One button to that lab.

### Idle (eligible)

Title: **Block sprint**. Eyebrow: **Timed drill**. One-sentence standfirst: read each block, tap its sound, one minute, the number is your median time. Primary button: **Start 60-second round**.

### Running

- Large Hangul `trial.block` (`lang="ko"`).
- Four tap targets via `SprintChoices.svelte` — one shot, not lab `Options` (labs retry until correct; a mill must not).
- Visible remaining seconds, `role="timer"`, `aria-live="off"` (do not announce every tick).
- Same 2×2 grid on phone and desktop. Each target `min-width` and `min-height` 44px.
- Digit/letter shortcuts via existing `choiceKeys` helpers, same as labs.
- No “lives”, no combo, no streak. The round ends because the clock ran out.

Timer wiring: a `$effect` that depends only on a boolean `running` flag, uses `setInterval` 100ms, calls `tickRound`, and clears on cleanup. Do not put `round` itself in the effect’s implicit graph in a way that resets the interval every tick.

### Done

Headline is the median, e.g. `428 ms`, or `—` if there were zero correct taps. Supporting line: `14 of 20 correct`. Buttons: **Another round** (eligible startRound again) and a text link back to Labs / Review.

## Entry points (this slice)

1. Main nav: Labs, Review, **Drill**, Reference. Active when pathname starts with `/drill`.
2. Home: a **Block sprint** section under Review pile. Eligible: link to `/drill`. Locked: the same missing-lab sentence as the locked page, not a dead button that looks like a lab card.
3. Review **clear** state: when eligible, a link “Read blocks against the clock” to `/drill`, plus one line that the sprint does not write the Review schedule. When not eligible, do not mention the sprint.

## Out of scope (explicit)

- Writing `SrsState`, new card kinds, or reviewing early.
- Audio, mic, Hangul IME, typed RR, composing the shown block.
- Sound-change / real-text / confusion-pair generators (same `/drill` shell later).
- Persisting last median, leaderboards, daily goals.
- Sitting-size settings, speed gates on lab exit.
- Removing the Review day-streak (separate lock-compliance; not this slice).

## Testing

- Domain: eligibility, inventory per tier, `compose`/`romanizeSyllable` derivation, option-length parity, unique options, injected RNG, median, wrong tap excluded from median, round does not import `srs`, time-up ends the round.
- `SprintChoices`: one tap fires `onPick` once; a second tap is ignored; 44px targets.
- Page source contracts: locked copy, idle copy, no `progress.answer`, no `grade(`, `SPRINT_MS` / domain imports, 2×2 grid, `lang="ko"`.
- Polish audit: nav includes Drill; home has the sprint section; review clear links when we assert the copy.

## Error handling

- Empty inventory or `nextTrial` null: do not start. Stay idle with “Not enough unlocked letters to build a round.” (Should not happen when eligible; lab01+lab02 is ~190 CV blocks.)
- Hydration: locked/idle decided after `progress.tick()` on mount, same `ready` pattern as Home/Review, so prerender does not flash the wrong CTA.
