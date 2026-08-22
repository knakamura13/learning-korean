# Lab 10 — names, part 2

**Date:** 2026-08-22 · **Status:** implemented 2026-08-22 · **Slice:** the mission's
"people in my life" half, closed — full names, the vocative, and the address suffixes.

## What ships

1. **Lab 10 — The Names in Your Phone** (`0010`, requires `0009`, unlocks `lab10`):
   17 steps, ≤10 minutes. Teaches (a) full-name shape — family name first, no
   space, one-syllable surname + two-syllable given name as the dominant form;
   (b) that names run through every drilled junction rule (박은지 → [바근지],
   박보검 → [박뽀검], 박나래 → [방나래], 김백현 → [김배켠]); (c) how Korean
   addresses people — bare name + 아/야 vocative for close friends (with the
   liaison it triggers: 하늘아 → [하느라]), 씨 on the full or given name and
   never the bare surname, 님 on roles and titles (선생님, 고객님 → [고갱님]).
2. **Deck tier `lab10`** — ten `pron` cards (`p-<name>`), TIERS entry
   `{ id: 'lab10', label: 'Names', lab: '0010' }`. Every answer is
   `[romanizeWord(spoken), spoken]` with `spoken = pronounceWord(front)`,
   run through `withLlVariant`, cross-checked in `deck.test.ts`. The
   sound-change mill picks the tier up automatically (it draws from all
   unlocked pron tiers).

## Decisions worth preserving

- **No new step types.** Names reuse `choice`, `liaison`, `contact`, `hmerge`,
  and `read` — which *is* the lab's thesis: a name is ordinary Korean at every
  junction. The existing content tests therefore validate every widget word
  against the phonology for free.
- **Every carded name is engine-derivable**, verified against
  `pronounceWord` before authoring. Rejected classes, kept out on purpose:
  - **ㄴ-insertion boundaries** — given names starting 이/야/여/요/유 after a
    batchim surname (김연아, 박열): the engine liaises (기며나) but real speech
    commonly ㄴ-inserts at the name boundary ([김녀나]). Ambiguous → banned.
  - **Stop-host ㄹ chains** — stop batchim + ㄹ-initial given name (박라온):
    needs the 독립-class two-rule stack the engine deliberately excludes; the
    engine returns the word unchanged, which would card a wrong "stay".
  - **씨 forms** (은지 씨) — the space breaks block-cut romanization, so 씨 is
    taught in choice cards (including the 김-씨-is-an-insult trap) and never
    becomes a deck front.
- **Two honest Stay cards** (김민준, 지우야), following lab06's 강이 precedent:
  most names have no junction to operate, and 야 exists precisely because a
  vowel-final name gives 아 nothing to do.
- Celebrity names used where the derivation is safe (박보검, 박나래) — real
  text per the mission; generic full names elsewhere, no claims attached.
- The 고객님 card double-dips: the honorific suffix is *itself* a nasalization
  site ([고갱님]), so the address-term act re-drills Lab 07 without a detour.

## Out of scope

Grammar of address (speech levels, 반말/존댓말 as systems); job-title inventory
beyond 선생님/사장님/고객님; ㄴ-insertion and the stop-host ㄹ chain as engine
rules (still named honestly in copy only); handwriting and romanization traps
(next backlog items).
