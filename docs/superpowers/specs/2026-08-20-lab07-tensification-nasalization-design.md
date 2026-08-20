# Lab 07 — Tensification and nasalization design

**Date:** 2026-08-20
**Status:** ready to implement
**Prerequisite:** Lab 06 complete (liaison). Writing system and 연음 already exist.
**Source of record:** 표준 발음법 (1988) **Article 23** (경음화 after a stop) and **Article 18** (비음화 of ㄱ/ㄷ/ㅂ before ㄴ/ㅁ).

## Why this lab, why now

Labs 01–06 taught the page and the first sound change (a batchim filling a following ㅇ). The remaining hole is the other reason a word you can already read still surprises the ear: two stops in a row (학교 → [학꾜]) and a stop before a nasal (입니다 → [임니다]).

Those two rules are one sitting because they share a junction: a stop batchim (ㄱ/ㄷ/ㅂ after neutralization) plus the next onset. The next letter decides which rule fires. Teaching them apart would hide that.

Success for this sitting: given a written word whose first block ends in a stop, the learner can choose **tense the next letter**, **nasalize the batchim**, or **stay**, and the deck retains written-word → spoken-form cards for both rules.

## Constraints (inherited, non-negotiable)

- Interactive lab, not an article. Explanation only as feedback on an action.
- Prefer discovery to exposition. The learner operates the junction; they are not told “this is tensification” until they have done it.
- Lessons never hard-code an answer the domain can derive. Widget and deck spoken forms come from `applyTensification` / `applyNasalization`.
- Widget answers retry until correct (`onNudge`, not advance), same as `liaison` / `cluster`.
- Exhaustive `switch` / `{#if}` on `Step['type']` keeps a `never` default.
- Phone and desktop are equal. The widget is three large taps, not a typed answer.
- No mic, no speech scoring, no XP/streaks. Playback audio is out of this lab (still only Lab 01 clips).
- One lab, two rules, one tier `lab07`. Not “the remaining seven sound changes.”
- Session data: `minutes: 10`, `steps.length === 16` (≤18).

## Approaches considered

**A. Choice-only quizzes.** Fast. Recognition-only. Rejected as the primary surface.

**B. Two labs (nasalization, then tensification).** Cleaner grain. Rejected for this sitting: the decision procedure is one junction. Split only if 16 cards cannot hold both; they can.

**C. Contact widget (recommended).** One tap among Tense / Nasal / Stay. The domain derives the winner from the written word. Wrong rule is the lesson. Same family as Lab 05/06 one-tap widgets.

## The rules, as the domain must implement them

Two functions. Each applies **only its own rule**. They do not chain. They do not palatalize, drop ㅎ, apply liaison, or assimilate ㄹ.

Walk adjacent syllables. Skip a junction when any of: no batchim; the batchim is a cluster (`isCluster`); the batchim is ㅎ; the next lead is ㅇ (liaison); the next lead is ㅎ (aspiration).

`stop` means `batchimSound(final)` is `ㄱ`, `ㄷ`, or `ㅂ`.

### `applyTensification(word)` — Article 23 only

When `stop` and the next lead is in `{ㄱ, ㄷ, ㅂ, ㅅ, ㅈ}`:

1. Set the first syllable’s final to `batchimSound(final)` (옆집 → 엽… so ㅍ is not left written).
2. Tense the next lead: ㄱ→ㄲ, ㄷ→ㄸ, ㅂ→ㅃ, ㅅ→ㅆ, ㅈ→ㅉ.

Examples the tests lock:

| Written | Spoken |
|---|---|
| 학교 | 학꾜 |
| 먹다 | 먹따 |
| 잡지 | 잡찌 |
| 식당 | 식땅 |
| 국밥 | 국빱 |
| 옆집 | 엽찝 |

No-ops: 입니다, 국물, 한국, 음악, 좋아요, 없다 (cluster), empty string, any non-syllable.

### `applyNasalization(word)` — Article 18 only

When `stop` and the next lead is `ㄴ` or `ㅁ`, replace the first syllable’s final:

| `batchimSound` | Becomes |
|---|---|
| ㄱ | ㅇ |
| ㄷ | ㄴ |
| ㅂ | ㅁ |

Examples the tests lock:

| Written | Spoken |
|---|---|
| 국물 | 궁물 |
| 입니다 | 임니다 |
| 학년 | 항년 |
| 닫는 | 단는 |
| 밥물 | 밤물 |
| 앞문 | 암문 |

No-ops: 학교, 한국, 음악, 좋아요, 없다, empty string, any non-syllable.

### `contactAction(word)` / `applyContact(word)`

```
contactAction:
  applyTensification(word) !== word → { type: 'tense' }
  else applyNasalization(word) !== word → { type: 'nasal' }
  else → { type: 'stay' }

applyContact:
  tensed = applyTensification(word)
  tensed !== word ? tensed : applyNasalization(word)
```

`SOUND_CHANGES` entries `tensification` and `nasalization` set `scored: true`. Their `examples` must match these functions (already 학교/잡지 and 국물/입니다).

**Out of scope for these functions (lock with tests):**

- Article 19 (ㄱ/ㄷ/ㅂ before ㄹ → nasal plus ㄹ→ㄴ). `applyNasalization('독립')` stays `독립`.
- Aspiration, ㅎ-deletion, palatalization, liaison, general cluster simplification.
- 없다 as a tensification widget word (cluster). Lab 05 already showed [업따]. A choice card may point at that; the widget must not use clusters.

## The widget (`type: 'contact'`)

Looks and behaves like `LiaisonStep`.

1. Large written word, optional gloss.
2. Prompt: “A stop, then another consonant. Tense the next letter, nasalize the batchim, or stay?”
3. Three buttons, always, in this order: **Tense** · **Nasal** · **Stay**.
4. Correct tap → `onSettle()`, then reveal: `{word}` is said `[{applyContact(word)}]`.
5. Wrong tap → `onNudge` (blocking). Copy is specific:
   - Stay on a tense word: two plain stops in a row; the second tenses.
   - Stay on a nasal word: you cannot hold a stop and then open the nose for ㄴ/ㅁ; the stop becomes a nasal.
   - Nasal on a tense word: the next letter is a plain ㄱ/ㄷ/ㅂ/ㅅ/ㅈ, not ㄴ/ㅁ. The stop stays; the next letter tenses.
   - Tense on a nasal word: the next letter is ㄴ or ㅁ. A stop cannot stay a stop in front of a nasal.
   - Tense or nasal on a stay word: the first block does not end in a stop (한국: ㄴ is already a nasal).

Do **not** use this widget for: ㅇ-onset (liaison), ㅎ contact, ㄹ contact, clusters. Stay would “win” for the wrong reason, or teach the wrong spoken form.

## Review deck (`kind: 'pron'`, tier `lab07`)

Same shape as `lab06`: front is the written word; answers are hyphenated RR of the *spoken* blocks plus spoken Hangul. Derived, never authored as the source of truth.

Ten cards (one daily new-card cap):

| id | front | function | spoken | ASCII | note gist |
|---|---|---|---|---|---|
| p-학교 | 학교 | tense | 학꾜 | hak-kkyo | stop + ㄱ → tense |
| p-먹다 | 먹다 | tense | 먹따 | meok-tta | stop + ㄷ → tense |
| p-잡지 | 잡지 | tense | 잡찌 | jap-jji | stop + ㅈ → tense |
| p-식당 | 식당 | tense | 식땅 | sik-ttang | stop + ㄷ → tense |
| p-국밥 | 국밥 | tense | 국빱 | guk-ppap | stop + ㅂ → tense |
| p-국물 | 국물 | nasal | 궁물 | gung-mul | ㄱ before ㅁ → ㅇ |
| p-입니다 | 입니다 | nasal | 임니다 | im-ni-da | ㅂ before ㄴ → ㅁ |
| p-학년 | 학년 | nasal | 항년 | hang-nyeon | ㄱ before ㄴ → ㅇ |
| p-닫는 | 닫는 | nasal | 단는 | dan-neun | ㄷ before ㄴ → ㄴ |
| p-밥물 | 밥물 | nasal | 밤물 | bam-mul | ㅂ before ㅁ → ㅁ |

한국 is a lab Stay card, not a deck card (same as 좋아요 in Lab 06).

`checkAnswer` already has a `pron` path. Review UI already swaps placeholder for `pron`. No new review chrome.

## The sixteen cards

Title: **The Stop and Its Neighbor**
Standfirst: *Liaison filled an empty ㅇ. The other surprises are what a stop does to the letter that follows — tense it, or become a nasal.*
Minutes: 10. Unlocks: `lab07`. Requires: `0006`.

Finish title: **Two stops, or a stop plus a nasal**
Finish summary: *A ㄱ/ㄷ/ㅂ batchim tenses a following plain ㄱ/ㄷ/ㅂ/ㅅ/ㅈ, and becomes ㅇ/ㄴ/ㅁ before ㄴ/ㅁ. Same junction, different neighbor. Next: ㅎ — aspiration and ㅎ-deletion, the letter Lab 06 refused to cram into liaison.*

Option-length rule still applies.

### Act 1 · the mismatch (2 choice)

**1. What tensed**
- Stage: 학교 “as written” → 학꾜 “as said”
- Do: You can read this. Spoken Korean tenses a letter. Which one, and how?
- Options (stack): The next ㄱ became a tense ㄲ / The first ㄱ jumped into 교 / The first ㄱ became a nasal / The two blocks fused into one
- Teach: 학 ends with an unreleased ㄱ. 교 starts with a plain ㄱ. Two plain stops in a row: the second becomes ㄲ. The spelling still writes 학교. Next you operate that junction.

**2. Why a stop**
- Stage: 학 + 교
- Do: Why did 교’s ㄱ tense, instead of jumping or vanishing?
- Options (stack): A stop batchim tenses a following plain stop / A stop batchim nasalizes every next letter / A stop batchim jumps into a following ㅇ / A stop batchim always doubles itself instead
- Miss: Lab 06’s jump needed an empty ㅇ. 교 does not start with ㅇ.
- Teach: A following ㅇ is liaison. A following ㄴ/ㅁ is a different rule, later this sitting. A following plain ㄱ/ㄷ/ㅂ/ㅅ/ㅈ tenses. Source: Article 23.

### Act 2 · tense it (4 contact)

**3. 학교** (school) — Tense. Teach: [학꾜]. The first ㄱ stays; the second tenses.

**4. 먹다** (to eat) — Tense. Teach: [먹따]. ㄱ + ㄷ. The ㄷ becomes ㄸ. Verb stems do this constantly.

**5. 잡지** (magazine) — Tense. Teach: [잡찌]. ㅂ + ㅈ → ㅉ. Same rule, different pair.

**6. 식당** (restaurant) — Tense. Teach: [식땅]. ㄱ + ㄷ again, in a word on every street.

### Act 3 · name it, and Stay (2)

**7. Name the rule** (choice, stack)
- Do: In one sentence, tensification is…
- Options: After a stop, the next plain consonant tenses / After a stop, the next vowel becomes tense / After a nasal, the next stop always tenses / After a stop, the batchim itself becomes ㅇ
- Teach: 경음화. Article 23. ㄱ/ㄷ/ㅂ at the end, then ㄱ/ㄷ/ㅂ/ㅅ/ㅈ at the start. Lab 05’s [업따] was this after a cluster threw a letter away. This lab is the simple-batchim case.

**8. 한국** (contact — Stay is correct)
- Gloss: Korea
- Teach: [한국], not [한꾹]. 한 ends in ㄴ, not a stop. Tensification does not fire. The rule is picky about *which* letter closes the first block.

### Act 4 · the other neighbor (2 choice)

**9. What nasalized**
- Stage: 입니다 “as written” → 임니다 “as said”
- Do: Same kind of junction, different next letter. What happened to ㅂ?
- Options (stack): The ㅂ became ㅁ before ㄴ / The ㅂ jumped into the next block / The ㅂ tensed the following ㄴ / The ㅂ vanished leaving an empty ㅇ
- Teach: 입 ends in a stop. 니 starts with ㄴ. You cannot hold a ㅂ and then open the nose. The ㅂ becomes ㅁ: [임니다].

**10. Why nasals**
- Do: ㄱ/ㄷ/ㅂ before ㄴ or ㅁ become…
- Options (stack): Stops become nasals before ㄴ and ㅁ / Stops become tense before ㄴ and ㅁ / Stops jump into ㄴ like into ㅇ / A stop always becomes ㅇ, even before ㄱ
- Miss: 학교 already showed what a following ㄱ does.
- Teach: ㄱ→ㅇ, ㄷ→ㄴ, ㅂ→ㅁ. Same place of articulation, nasal. Article 18. That is 비음화.

### Act 5 · nasalize it (3 contact)

**11. 국물** (broth) — Nasal. Teach: [궁물]. ㄱ before ㅁ becomes ㅇ.

**12. 입니다** (it is, polite) — Nasal. Teach: [임니다]. The copula. This is why 입니다 does not sound like the spelling.

**13. 학년** (school year) — Nasal. Teach: [항년]. ㄱ before ㄴ becomes ㅇ. Names and school words do this constantly.

### Act 6 · one junction (1 choice + 2 read)

**14. Same ㄱ, two neighbors** (choice, stack)
- Stage: 학교 vs 국물
- Do: Both start with 국-class ㄱ. Why do they split?
- Options: ㄱ then ㄱ tenses; ㄱ then ㅁ nasalizes / ㄱ then ㄱ nasalizes; ㄱ then ㅁ tenses / Both of these words tense the second block / Both of these words nasalize the first batchim
- Teach: The first letter is the same job (a stop). The *next* letter picks the rule. That is the whole sitting.

**15. 학교** (read) → a school / a student / a classroom / a lesson
- Teach: hak-gyo, said [학꾜]. You derived the ㄲ. The deck will keep it.

**16. 입니다** (read) → it is / it was / you are / we are
- Teach: im-ni-da, said [임니다]. The polite copula, as actually said. Next sound-change lab is ㅎ.

## What this lab does not teach

- Aspiration, ㅎ-deletion (beyond Lab 06’s inoculation), palatalization, ㄹ assimilation, Article 19 (stop + ㄹ).
- Cluster tensification as a widget (없다). Named in card 7 only.
- Producing tense consonants. Recognizing ㄲ/ㄸ/ㅃ/ㅆ/ㅉ in the spoken form is enough.
- Audio. Do not block this lab on recordings.
- Hangul composition as the review answer. `pron` cards stay hyphenated RR + Hangul, same as lab06.

## File-level shape

New:

- `app/src/lib/content/lab07.ts`
- `app/src/lib/components/steps/ContactStep.svelte`
- `app/src/lib/components/steps/ContactStep.test.ts`

Extend:

- `hangul.ts` — `applyTensification`, `applyNasalization`, `applyContact`, `contactAction`; mark the two SOUND_CHANGES scored
- `types.ts` — `ContactStep`; add to `Step` union
- `content/index.ts` — register lab07
- `deck.ts` — ten `lab07` `pron` cards; `TIERS` entry
- `LabRunner.svelte` — dispatch `contact` (retry-until-correct); exhaustive `never` stays intact
- `content.test.ts` — contact steps: syllables; `contactAction` matches `applyContact`; forbidden words absent; Stay-correct 한국 present
- `deck.test.ts` — ten cards derived from the matching function
- `+page.svelte`, `review/+page.svelte`, `drill/+page.svelte` — add `lab07` to the hardcoded unlocked-tier lists (sprint inventory still ignores it; review queue uses SRS unlocks, but the lists must not drift)
- `lab06.ts` finish copy — this lab is no longer “next”
- `NOTES.md` — Lab 07 built; next is ㅎ
- `app/README.md` — `lab01..lab07.ts`; `deployConfig.test.ts` matcher

## Open risks, already decided

- **Two rules, one lab.** PR 116 split them. This spec keeps one sitting because the decision procedure is shared. If authoring blows past 18 cards, cut read cards 15–16 first, not a rule.
- **한국 as Stay, not 학원.** 학원 is liaison (ㅇ). Forbidden in the widget.
- **No Article 19.** 독립 stays 독립 in `applyNasalization`. A later ㄹ lab owns it.
- **옆집 in tests, not in the lab.** Proves ㅍ→ㅂ neutralization plus tensification. The sitting does not need that extra pair.
- **Sprint lists.** Adding `lab07` to the three unlocked-tier arrays does not change generated blocks. Do not invent a sound-change sprint generator here.

## Self-review

- No TBD. Article 19, clusters, ㅎ, liaison, and audio each have an explicit in-or-out.
- 16 cards, 10 minutes, 10 deck cards.
- Widget and deck answers are derived.
- 한국 is Stay; 음악/좋아요/없다/독립 are not widget cards.
- Tensification and nasalization examples on the reference page match the functions.
