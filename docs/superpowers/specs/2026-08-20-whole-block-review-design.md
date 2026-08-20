# Whole-block review tier

**Date:** 2026-08-20
**Status:** ready to implement
**Slice:** generated syllable-block cards in Review. Same unlock gating as today’s letter cards. No audio, no Hangul composition, no new lab, no sprint changes beyond a reusable trial helper.

## Why this, why now

The sprint trains cold block reading for one minute and writes nothing. Review still only schedules single jamo (and ten liaison words). Sprint speed can evaporate between sittings. The win condition is reading an unfamiliar syllable block cold. The retention system must test that.

This is the scheduled half of the same gap. Drill stays the unbounded mill. Review holds a finite, generated catalog of blocks until they are automatic.

## Constraints (locked)

- Hangul-first decoder, not a language app. No mic, no speech scoring, no XP/streaks/loot/leaderboards.
- Block cards never teach a rule. They mill letters whose lab is already unlocked.
- One addition, one surface: `/review`. No second route.
- Do not import `srs.ts` from `sprint.ts` or from `blockDeck.ts`.
- Answers are derived: `romanizeSyllable(block)` via `compose`. Do not author a reading by hand. Do not accept the Hangul glyph as an answer (that is copying, not decoding).
- Four tap options, identical string length, unique. Phone and desktop share the same 2×2 grid (`SprintChoices`). Minimum 44px targets.
- Letter cards keep typed Revised Romanization. This slice does not replace that mechanic.
- Labs still unlock one existing tier id (`lab01`…`lab06`). Do not add a new `TIERS` id (content tests require a 1:1 lab→tier map). Block cards live inside `lab02`–`lab05`.
- Skip-ahead `openedLabs` does not unlock block cards. They follow `unlocked` like every other card.
- The block is the item. No gloss, no vocabulary, no meaning question.
- Do not write sprint results into `SrsState`.

## Approaches considered

**A. Put every legal syllable in the deck.** After batchim that is thousands of unseen cards. Stats lie, letter cards starve in the 10/day new cap. Rejected.

**B. Typed romanization on block cards.** Same field as letters. Rejected: the clock would measure typing, and a phone would lose to a hardware keyboard. The sprint already rejected this.

**C. Finite generated catalog, tap-to-answer (recommended).** A stable subset of `sprintInventory`, assigned to the lab tier that introduces that shape (CV, compounds, simple batchim, clusters). Review shows the Hangul block and `SprintChoices`. SM-2 grades the tap.

## Domain

### `trialForBlock` in `sprint.ts`

`nextTrial` picks a random target. Review needs a trial for a **specific** block.

```ts
export function trialForBlock(
  block: string,
  pool: readonly string[],
  rng: Rng
): SprintTrial | null
```

- `options` length is `OPTION_COUNT` (4). Unique. Same `.length`. Derived only from `romanizeSyllable`.
- `options[answerIndex] === romanizeSyllable(block)`.
- Distractors are romanizations of *other* members of `pool`.
- If three same-length unique distractors cannot be found in `pool`, return `null` (caller may retry with a larger pool).
- Extract a shared helper so `nextTrial` and `trialForBlock` do not duplicate option construction.

### `blockDeck.ts` (pure, no Svelte, no `srs`)

Constants:

```ts
export const BLOCK_COUNTS = {
  lab02: 20,
  lab03: 10,
  lab04: 15,
  lab05: 10
} as const;
```

`blockInventory(tier)` is the exclusive slice of `sprintInventory` that this tier introduces:

| Tier | Pool |
| --- | --- |
| `lab02` | `sprintInventory(['lab01','lab02'])` (CV) |
| `lab03` | inventory through lab03 minus through lab02 (compound vowels) |
| `lab04` | through lab04 minus through lab03 (simple batchim CVC) |
| `lab05` | through lab05 minus through lab04 (cluster CVC) |
| anything else | `[]` |

`pickSpread(items, n)`: sort with `localeCompare(..., 'ko')`, then take `n` evenly spaced unique indices. If `items.length <= n`, return the sorted copy. Deterministic. No RNG.

`blockCard(block, tier): Card`:

- `id`: `blk-${block}`
- `front`: `block`
- `ask`: `how does this block sound?`
- `answers`: `[romanizeSyllable(block)]` — skip the block if that string is empty
- `note`: `Read the whole syllable, not the letters.`
- `kind`: `'block'`
- `tier`: the lab tier above

`blockCards()`: for each of `lab02`…`lab05`, `pickSpread(blockInventory(tier), BLOCK_COUNTS[tier])` mapped through `blockCard`. Concatenate. Stable across runs.

### `deck.ts`

- Extend `CardKind` with `'block'`.
- Append `blockCards()` onto `DECK`.
- Update `TIERS[].size` so each row still equals `cardsOfTier(id).length`.
- Labels (honest about mixed content):
  - lab02: `Vowels · blocks`
  - lab03: `Compounds · blocks`
  - lab04: `Batchim · blocks`
  - lab05: `Clusters · blocks`
- `checkAnswer` for `kind === 'block'` uses the same ASCII normalize path as letter cards. Empty string is still wrong.

Existing tests that assume every `lab04` / `lab05` card is a jamo must filter on `kind`.

## Review UI

`app/src/routes/review/+page.svelte` only.

When `card.kind === 'block'`:

1. On `reset` / new card, build `trial = trialForBlock(card.front, blockInventory(card.tier), Math.random)`. If null, retry with `sprintInventory` of `['lab01'..card.tier]`. If still null, fall back to the existing typed field (should not happen for CV).
2. Hide the text input. Show `SprintChoices` with `trial.options`.
3. First tap calls `progress.answer(card.id, checkAnswer(card, trial.options[index]), ms)` and shows the existing feedback block. Further taps ignored (`disabled={answered}` plus SprintChoices lock).
4. Digit/letter shortcuts via `SprintChoices.keyPick`, same as `/drill`. Enter still advances after a grade.
5. Do not autofocus a hidden input. Focus is the first choice button only if cheap; otherwise leave it. Do not `preventScroll` focus a missing input.
6. `{#key}` must remount choices per card (index is already the sitting key).

Letter and `pron` cards are unchanged.

## Out of scope (explicit)

- Audio, mic, Hangul IME, composing the shown block.
- New labs, sound-change prediction mills, authentic-text corpus.
- Replacing typed RR on letter cards.
- Changing `DEFAULT_NEW_PER_DAY` / `DEFAULT_REVIEW_PER_SITTING`.
- Persisting last sprint median, removing the day-streak tile.
- Accounts, sync, PWA service worker.
- A separate `/review` “blocks only” filter.

## Testing

- `trialForBlock`: target is the given block; option length parity; unique; derived; null when pool cannot supply distractors.
- `blockDeck`: counts, exclusive inventories (CV vs 개 vs 각 vs 앉), deterministic spread, every id `blk-…`, every answer equals `romanizeSyllable(front)`, no Hangul-as-answer, no `srs` import.
- `deck`: `CardKind` includes `block`; TIERS sizes match; no duplicate ids; batchim/cluster assertions filter by kind; `checkAnswer` accepts the derived RR and rejects the glyph and a wrong reading.
- Review source: `kind === 'block'` uses `SprintChoices`; does not bind the text input for that branch; still uses `progress.answer`; still does not import drill round helpers into a mill that writes SRS (answer path stays `progress.answer`).

## Error handling

- Empty `romanizeSyllable`: that block is not a card.
- `trialForBlock` null after fallback: typed field, same as letter cards.
- Hydration: existing `ready` / `progress.tick()` pattern. Block trials are built only after `ready` when a sitting card is a block card.
