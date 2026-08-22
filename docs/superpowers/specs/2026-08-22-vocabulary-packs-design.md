# Vocabulary packs, the word corpus, and composition answers

**Date:** 2026-08-22 · **Status:** implemented 2026-08-22 · **Slice:** steps 3, 6, 7 of the post-production roadmap, one PR. MISSION.md's vocabulary exclusion amended the same day.

## What ships

1. **The corpus** (`domain/words.ts`): 100 real words, four packs — names &
   people, food & menus, messages, signs & places. Chosen for the mission's
   life, not frequency lists.
2. **Vocabulary deck vertical**: a meaning card per word (typed English,
   normalize-checked) and a pronunciation card only where the spelling lies
   (22 words) and no lab tier already owns the word. Packs unlock by hand
   from the home dashboard, gated on Lab 05.
3. **Per-track scheduling**: `SrsState` grows a second pin triple
   (`vocabNewDate/Count/Ids`, additive, backup- and legacy-compatible), with
   its own daily cap (`DEFAULT_VOCAB_NEW_PER_DAY = 5`). Both tracks share one
   sitting; reviews merge oldest-due-first. The merge function reconciles the
   new triple with the same later-date-wins rule.
4. **Composition answers** (R&D #8): block cards flip direction — the front
   shows the sound, the learner *builds* the block from lead/vowel/batchim
   tap-trays (`domain/blockCompose.ts`, `ReviewCompose.svelte`). Hard-graded:
   a completed wrong block is a wrong answer, exactly like `assemble`.

## Decisions worth preserving

- **Derive-don't-author extends to the corpus, with teeth**: every entry's
  `spoken` form must equal `pronounceWord(hangul)` (the new composite that
  chains ㅎ → liaison → stops → ㄹ to a fixpoint). Words needing unmodeled
  rules (ㄴ-insertion 서울역, stop-host ㄹ chains 독립, palatalization 같이)
  are structurally unshippable. Replace the word; never weaken the check.
- **Typed answers hold on both lanes**: pronunciation stays typed RR /
  Hangul; meaning is typed English with forgiving alternates. No multiple
  choice, no IME.
- **Budget isolation is the design center**: the second pin triple exists so
  a 30-card pack landing can never displace the day's letters. Study-prefs UI
  for the vocab cap is deliberately deferred until someone needs a different
  number.
- **Trays honor unlock state even for distractors**: no compound vowel
  before Lab 03, no cluster before Lab 05.

## Out of scope

Word-level audio (RESOURCES.md gap stands); a vocab pacing knob in Settings;
English→Hangul production; spaced multi-word phrases; ㄴ-insertion and
palatalization words (blocked by the derivation check until those rules ship).
