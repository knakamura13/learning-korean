# Lab 06 — Liaison (연음) Design

**Date:** 2026-08-15
**Status:** ready to implement
**Prerequisite:** Lab 05 complete (clusters). All 72 letter cards already exist.
**Source of record:** 표준 발음법 (1988) Articles 12–17, especially **13** and **14**. Article 15 is explicitly out of scope.

## Why this lab, why now

Labs 01–05 taught the writing system. Lab 05’s finish copy already points here: nothing further is added to the page; what changes is how the page sounds when letters meet.

Liaison is the highest-leverage of the eight sound changes already listed in `SOUND_CHANGES`:

- It is why a word Kyle can decode still sounds unfamiliar (한국어 is not han-guk-eo in speech).
- It pays off Lab 04’s aside that 밭 keeps ㅌ in spelling “so that when a vowel follows, the real ㅌ comes back.”
- It reinterprets Lab 05: Rule A/B is what happens when a cluster *must* throw a letter away. A following ㅇ means it does not have to.

Success for this sitting: given a written word whose next block starts with placeholder ㅇ, he can produce the spoken form — including “this one does not jump” for ㅇ-batchim, and “both letters surface” for a cluster.

## Constraints (inherited, non-negotiable)

- One sitting, ≤10 minutes, ≤18 steps. This lab is **16 cards**.
- Interactive lab, not an article. Explanation only as feedback on an action.
- Prefer discovery to exposition. Where a rule can be derived, derive it.
- Typed review stays ASCII-first (no Korean IME required), with Hangul accepted as an alternate.
- Lessons never hard-code an answer the domain can derive. Cluster cards already obey this; liaison cards must too.
- Honest difficulty. Do not invent a mnemonic for Article 14’s “moved ㅅ tenses.”
- Real text where it exists: 한국어, 음악, 한글을, 부엌에, 좋아요.

## Approaches considered

**A. Choice-only.** Four Hangul pronunciations per word. Fast to ship. Violates the standing rule that recognition-only drills waste the sitting. Rejected as the primary teaching surface (choice cards remain for *naming* a rule after it has been felt).

**B. Rebuild with assemble trays.** Learner composes each spoken syllable from jamo trays. Matches the composer pattern, but two or three full trays per card is slow, and the action (building 으 then 막) hides the actual rule (ㅁ moved). Rejected.

**C. Move / stay widget (recommended).** One tap, same family as the Lab 05 cluster widget. The domain decides the correct action from the written word. Wrong taps retry (`onNudge`, not advance). This is the design below.

## The rule, as the domain must implement it

`applyLiaison(word)` implements **Articles 13–14 only**. It walks adjacent syllables. When syllable *i* has a batchim and syllable *i+1* has lead ㅇ:

| Written final | Action | Example |
|---|---|---|
| Simple consonant except ㅇ, ㅎ | Whole letter moves to the next onset; first syllable loses its batchim | 옷이 → 오시 |
| 쌍받침 ㄲ or ㅆ | The double moves as itself (onset ㄲ/ㅆ) | 밖에 → 바께, 있어 → 이써 |
| Cluster except ㄶ/ㅀ | First member stays as batchim; second member becomes the next onset | 읽어요 → 일거요, 앉아 → 안자 |
| Cluster whose second member is ㅅ (ㄳ, ㄽ, ㅄ) | Same split, **and the moved ㅅ tenses to ㅆ** (Article 14 parenthetical) | 없어 → 업써 |
| ㅇ | No-op. ng is already a sound; moving it into an onset would silence it | 강이 → 강이 |
| ㅎ, ㄶ, ㅀ | No-op. That is Article 12 (ㅎ-deletion / aspiration), not liaison | 좋아요 stays 좋아요 |

Critical non-goals of this function (lock these in with tests):

- **Must not palatalize.** `applyLiaison('밭이')` is `바티`, not `바치`. Article 17 is a later lab. Lab 06 therefore uses **밭에** (official Article 13 example: [바테]), never 밭이.
- **Must not apply Article 15.** When two *content* morphemes meet (밭 아래 → [바다래]), the *representative* ㄷ moves, not written ㅌ. `applyLiaison` always moves the written letter, so it would produce the wrong 바타래. Lab 06 only uses 조사 / 어미 / 접미사. Compounds like 겉옷, 꽃 위, 맛없다 are forbidden in this lab and this deck tier.
- **Must not do tensification in general.** 학교 → 학꾜 is Lab 07. The sole tensing this function does is Article 14’s moved-ㅅ → ㅆ.

`liaisonAction(word)` derives the widget’s correct tap:

- If `applyLiaison(word) === word` → `{ type: 'stay' }`
- Else → `{ type: 'move', jamo }` where `jamo` is the **written** letter that jumps (ㅅ, not ㅆ, for 없어)

`liaisonSources(word)` lists the tappable letters: the batchim, or both cluster members, of every syllable whose next lead is ㅇ (skipping ㅎ-clusters). The widget always adds a **Stay** control, so every card has a wrong answer.

## The widget (`type: 'liaison'`)

Looks and behaves like `ClusterStep`, not like `AssembleStep`.

1. Large written word, optional gloss.
2. Prompt: “Which letter jumps into the next ㅇ? Or does it stay?”
3. Buttons: each source jamo, plus **Stay**.
4. Correct tap → `onSettle()`, then a reveal: `한국어` is said `[한구거]` (spoken form **derived**, never authored).
5. Wrong tap → `onNudge` (blocking, not soft). Copy is specific:
   - Stay on a jumping word: the next block starts with an empty ㅇ; something can fill it.
   - Wrong cluster member (the one that should stay): that letter keeps the first block closed; the crowded-out one jumps.
   - Moving ㅇ-batchim: if it leaves, it becomes a silent placeholder and the ng vanishes.

No two-step “pick then drop.” Destination is always the following ㅇ. One tap, like Lab 05.

Do **not** use this widget for 좋아요. Stay would “win” because `applyLiaison` is a no-op, which would teach the wrong spoken form. 좋아요 is a choice card that names a *different* future rule.

## Review deck (`kind: 'pron'`, tier `lab06`)

Letter cards cannot hold this skill: 한국어 romanized letter-by-letter is already `hangugeo`, same as the spoken cut without hyphens. The front is the **written word**; the answer is the **spoken syllable cuts**.

Accepted answers, derived, never hand-typed as the source of truth:

1. Hyphenated Revised Romanization of the *spoken* blocks (`han-gu-geo`). Hyphens required for ASCII answers so `hangugeo` / `han-guk-eo` do not pass.
2. Spoken Hangul (`한구거`), optional brackets.

`checkAnswer` gains a `pron` path: lowercase, strip spaces and `[]`, **keep hyphens**, NFC. Existing letter cards are unchanged (they still strip spaces/punctuation and ignore hyphens).

Review UI: placeholder and empty-hint swap to “spoken cuts, with hyphens — or Hangul” when `card.kind === 'pron'`. No consonant `PlayButton` (front is a word, not a jamo).

Ten cards (one daily new-card cap). Notes are teaching, not confirmation:

| id | front | spoken | ASCII | note gist |
|---|---|---|---|---|
| p-한국어 | 한국어 | 한구거 | han-gu-geo | ㄱ jumped into the placeholder |
| p-음악 | 음악 | 으막 | eu-mak | ㅁ would rather be an onset |
| p-옷이 | 옷이 | 오시 | o-si | ㅅ comes back; not [오디] |
| p-밭에 | 밭에 | 바테 | ba-te | ㅌ comes back; 밭이 palatalizes later |
| p-부엌에 | 부엌에 | 부어케 | bu-eo-ke | ㅋ comes back, not ㄱ |
| p-강이 | 강이 | 강이 | gang-i | ng stays; moving it would silence it |
| p-읽어요 | 읽어요 | 일거요 | il-geo-yo | cluster splits; Rule B was isolation |
| p-앉아 | 앉아 | 안자 | an-ja | 앉다 threw ㅈ away; here it jumps |
| p-없어 | 없어 | 업써 | eop-sseo | ㅅ jumps and tenses (Article 14) |
| p-한글을 | 한글을 | 한그를 | han-geu-reul | particle 을, real-sentence form |

좋아요 is not a deck card. Romanization of spoken blocks uses the same conventions as the labs: onset ㄱ/ㄷ/ㅂ/ㄹ = g/d/b/r, batchim ㄱ/ㄷ/ㅂ/ㄹ/ㅇ = k/t/p/l/ng, ㅇ-onset empty.

## The sixteen cards

Title: **The Letter That Jumps**
Standfirst: *You can read every block. Spoken Korean still surprises you. One rule does most of that work — and you already have the pieces.*
Minutes: 10. Unlocks: `lab06`. Requires: `0005`.

Finish title: **Spoken Korean just became readable**
Finish summary: *A batchim plus a placeholder ㅇ is not a mystery any more: the letter jumps, unless it is already ng. Clusters split instead of sacrificing a letter. Isolation flattening reverses. Next: tensification — why 학교 is [학꾜], the other reason a word you can read still surprises your ear.*

Option-length rule still applies (choice: within one **word**; read: character length within 2).

### Act 1 · the mismatch (2 choice)

**1. What moved**
- Stage: 한국어 “as written” → 한구거 “as said”
- Do: You can read this. Spoken Korean says the thing on the right. What happened to the ㄱ?
- Options (stack): It jumped into the next block / It turned into a vowel / It was deleted as silent / It doubled the last block
- Teach: The ㄱ that sat under 국 is now the start of 거. 어 begins with a placeholder ㅇ. The ㄱ filled the hole. That is the whole rule — next you operate it.

**2. Why ㅇ is a hole**
- Stage: 국 + 어
- Do: Why was 어 the hole that ㄱ could fall into?
- Options (5 words each): The leading ㅇ is silent / The leading ㅇ says ng / The suffix 어 deletes consonants / Korean always drops final consonants
- Miss: You met this letter in Lab 01 in two jobs.
- Teach: ㅇ on top holds the slot open and says nothing. ㅇ at the bottom says ng. Liaison is what happens when a real batchim meets a placeholder ㅇ.

### Act 2 · do the jump (4 liaison)

**3. 음악** (music) — pure jump, no neutralization. Teach: 음+악 → [으막]. Spelling still writes 음 because that is the word.

**4. 옷이** (clothes + subject) — identity. Teach: [오시], not [오디]. Isolation flattened ㅅ to ㄷ; the spelling kept ㅅ so a vowel could bring it back. Lab 04 paid off.

**5. 밭에** (in the field) — identity, official Article 13 example. Teach: [바테]. ㅌ returns as ㅌ. *Do not use 밭이* — that palatalizes to [바치] (Article 17). 에 keeps the card honest. Say that out loud in the teach so the later lab is seeded, not spoiled.

**6. 부엌에** (in the kitchen) — identity for the k-family. Teach: [부어케]. ㅋ, not ㄱ. Three collapses reversed in one act: ㅅ, ㅌ, ㅋ.

### Act 3 · name it, and the ㅇ exception (2)

**7. Name the rule** (choice, stack)
- Do: In one sentence, liaison is…
- Options (8 words each): A batchim fills the next block's empty ㅇ / A batchim always becomes a new vowel / A silent ㅇ deletes the previous block / Two written blocks fuse into one letter
- Teach: 연음. Spelling is morphophonemic: it writes identity, not a recording. Source: Article 13.

**8. 강이** (liaison widget — Stay is correct)
- Gloss: river + subject particle
- Teach: [강이], not [가이]. That ㅇ is already ng. Move it into the next onset and it becomes the silent placeholder — the sound vanishes. Same letter, two jobs; only the placeholder is a hole.

### Act 4 · clusters split (3)

**9. Predict** (choice)
- Stage: 읽다 [익따] vs 읽어요 ?
- Do: 읽다 is [익따] — Rule B, only ㄱ survives. 읽어요 has a vowel after the cluster. What happens?
- Options (7–8 words): Both letters surface — ㄹ stays, ㄱ jumps / Only the ㄱ survives, as in 읽다 / Only the ㄹ survives, Rule B flips / The whole cluster deletes into a vowel
- Teach: Isolation Rule A/B was “which one, when you can keep only one.” Article 14: the second letter jumps; the first stays as batchim.

**10. 읽어요** (liaison) — to read, polite. Teach: [일거요]. Lab 05’s Rule B still holds before a consonant or pause.

**11. 앉아** (liaison) — sit. Teach: [안자]. 앉다 threw ㅈ away and tensed 다. Same spelling, different neighbor.

### Act 5 · two inoculations (2 choice)

**12. Moved ㅅ tenses**
- Stage: 없어
- Do: Article 14 has one extra clause: when the jumper is ㅅ, it tenses. 없어 is…
- Options: `[업써]` / `[업서]` / `[업더]` / `[언서]` (all four characters)
- Miss: The ㅅ that 없다 threw away comes back — and it comes back tense.
- Teach: [업써]. ㅂ stays; ㅅ jumps and tenses to ㅆ. No deeper reason. The deck will hold this one. Do not invent a mnemonic.

**13. 좋아요 is not liaison**
- Do: 좋아요 looks like ㅎ should jump into 아. What actually happens?
- Options (5–6 words): The ㅎ vanishes (later rule) / The ㅎ jumps into [조하요] / The ㅎ flattens into a ㄷ / The ㅎ tenses the next sound
- Teach: [조아요] is what you will hear, and it is not liaison. Batchim ㅎ before a vowel drops (Article 12). Do not cram it into this rule. Later labs take the rest one at a time.

### Act 6 · read it cold (3 read)

Same shape as previous labs: tap each block to check the *written* reading, then identify the word. Teach reveals the spoken form. Reuse is deliberate (Lab 04 built 김 then read 김치).

**14. 한국어** → Korean language / Korean grammar / Korean history / Korean culture
- Teach: han-guk-eo, said [한구거]. The name of the language, and why it does not sound like the spelling.

**15. 부엌에** → in the kitchen / in the hallway / in the bathroom / in the basement
- Teach: bu-eok-e, said [부어케]. The ㅋ restored in Act 2, in a phrase he might text.

**16. 한글을** → the Korean script / the Korean letter / the Korean block / the Korean vowel
- Do: Particle 을 marks the object. Read it, then flatten it.
- Teach: han-geul-eul, said [한그를]. The writing system’s name as it appears in a real sentence. Liaison is why 을 does not sound like a separate “eul” after 글.

## What this lab does not teach

- Tensification (경음화) except Article 14’s moved-ㅅ. Lab 05 already teased 없다 → [업따]; Lab 07 is 학교 → [학꾜].
- Nasalization, aspiration, ㅎ-deletion (beyond the inoculation), palatalization, ㄹ assimilation.
- Article 15 (content-morpheme liaison with representative sounds).
- Names part 2, handwriting, romanization traps.
- Producing tense consonants. Recognizing [업써] is enough.

## File-level shape (so the plan can be typed against it)

New:

- `app/src/lib/content/lab06.ts`
- `app/src/lib/components/steps/LiaisonStep.svelte`

Extend:

- `hangul.ts` — `applyLiaison`, `liaisonSources`, `liaisonAction`, `romanizeWord` (and syllable helpers)
- `types.ts` — `LiaisonStep`; add to `Step` union
- `content/index.ts` — register lab06
- `deck.ts` — `CardKind` includes `'pron'`; tier `lab06`; ten cards derived from `applyLiaison` + `romanizeWord`
- `LabRunner.svelte` — dispatch `liaison` (retry-until-correct, same as cluster); exhaustive `never` stays intact
- `review/+page.svelte` — placeholder/hint for `pron`
- `content.test.ts` — liaison steps: word is syllables; derived spoken matches `applyLiaison`; sources include the winner; Stay-only words are in the stay set
- `NOTES.md` — Lab 06 built; next is tensification
- `learning-records/0004-liaison-lab.md` — after ship, not before: this spec is not evidence of learning

## Open risks, already decided

- **없어 as [업써] not [업서].** Lab 05 wrote 없다 → [업따]. The spoken form with a vowel is [업써] per Article 14. Teach it honestly; do not “simplify” to 업서.
- **Hyphens in review.** Required for ASCII so 한국어 cannot be gamed with `hangugeo`. Hangul answers do not use hyphens.
- **No audio for these words.** RESOURCES.md: only Lab 01 consonant clips exist. Do not block Lab 06 on recordings. How To Study Korean remains the external model.
- **Kyle may still be on Lab 01.** Learning record 0003 said so. That does not change which lab to *author*. The deck remains the diagnostic for remedial labs.

## Self-review

- No TBD. Article 15, palatalization, ㅎ, and ㅅ-tensing each have an explicit in-or-out.
- 16 cards, 10 minutes, 10 deck cards.
- Widget answers are derived; 좋아요 is not a widget card.
- 밭에 not 밭이; 앉아 not 앉다; 없어 uses ㅆ.
