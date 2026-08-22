# Labs 08–09 and the sound-change prediction mill

**Date:** 2026-08-22 · **Status:** implemented 2026-08-22 · **Slice:** steps 1, 2, 4 of the post-production roadmap, one PR.

## What ships

1. **Lab 08 — The Letter That Is Only Breath** (`0008`, unlocks `lab08`):
   aspiration + ㅎ-deletion, 표준 발음법 Article 12. 16 cards, new `hmerge`
   step type (Aspirate / Delete / Stay), ten `lab08` pron cards.
2. **Lab 09 — The Flap and the Wall** (`0009`, unlocks `lab09`):
   lateralization + ㄹ→ㄴ, Articles 20 and 19. 16 cards, new `flow` step type
   (Flow ㄹㄹ / Yield ㄴ / Stay), ten `lab09` pron cards. With this, **7 of the
   8 sound changes are drilled**; only palatalization stays reference-only.
3. **Sound-change mill** — a second `/drill` lane. Written word → tap how it
   is actually said, 60 seconds, median-ms score. Draws exclusively from
   unlocked pron tiers (lab06–09), so it needs no corpus and never quizzes an
   underived rule. Like the block sprint, it **never writes the scheduler**.

## Decisions worth preserving

- **Domain functions mirror the contact pattern**: `applyAspiration` /
  `applyHDeletion` / `applyHMerge` / `hMergeAction`, and `applyLateralization`
  / `applyRToN` / `applyFlow` / `flowAction` — each rule scoped to its
  article, widgets derive answers from the map, content.test cross-checks
  every authored word. Deliberate scope exclusions, named in code: ㅎ+ㅅ→ㅆ,
  cluster batchims before ㅎ (밝히다), Article 20's lexical exceptions
  (의견란), and the stop-host ㄹ chains (독립 → 동닙 — two rules stacking).
  Lab 09's copy names the ridge/wall mechanics instead of pretending these
  don't exist.
- **Mill distractors are plausible misreadings, not random strings**: the
  as-spelled romanization (the classic trap) plus the *other* junction rules
  misapplied to the same word, padded from other cards' answers when a word
  has too few. Anything a card accepts as correct (e.g. the `l-l` alternate
  on flow cards) can never appear as a trap — tested.
- **The round machinery generalized, not duplicated**: `sprint.ts` gained a
  `TrialSource` seam (`startRoundFrom`/`answerRoundFrom`); the block sprint's
  exports are now thin wrappers, behavior-identical, old tests untouched.
- **Hardcoded tier lists removed**: home, review, and drill derive their tier
  order from `TIERS`, so the next tier cannot silently miss a surface.
- Flow deck cards accept both the block-cut romanization (`sil-ra`) and the
  assimilated spelling (`sil-la`).

## Out of scope

Word corpus, vocabulary tiers, composition answers (the follow-up PR);
word-level audio (RESOURCES.md gap — mill and labs are text-only); a mill
personal-best (sprint results stay ephemeral by design); palatalization.
