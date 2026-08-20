# Hangul-niche R&D Plan

> **For agentic workers:** Use superpowers:subagent-driven-development. This plan is research only. Do not implement product code. Do not write a speech-trainer spec. Do not re-grill product positioning.

**Goal:** Identify the 10 highest-impact additions that would make this app a market leader in Hangul / script-decoding trainers (not a Duolingo-class full language app). Rank by impact. Grammar, vocab-as-goal, TOPIK, conversation, and mic-scored speaking are out.

**Output of this plan:** `docs/rd/2026-08-20-hangul-niche.md` plus `UBIQUITOUS_LANGUAGE.md`. No app code.

---

## Product snapshot (facts, not a wishlist)

SvelteKit Hangul labs + SRS. Live app in `app/`. Static client (`adapter-static`) with localStorage and JSON backup on Settings. Railway Node adapter exists. PWA webmanifests exist (`display: standalone`); no service worker / offline cache.

**Labs 01–06 (writing system complete):**

| Lab | Title | Unlocks | Teaching unit |
| --- | --- | --- | --- |
| 01 | Find the Letters in Your Mouth | `lab01` 19 consonants | mouth → derive stroke/double → assemble → read loanwords |
| 02 | Ten Vowels From Two Strokes | `lab02` 10 vowels | vowel dock board, tall vs wide, assemble |
| 03 | Eleven Compounds, Seven Sounds | `lab03` compounds | fusion widget; impossible pairs teach vowel harmony; mergers as workload reduction |
| 04 | The Bottom of the Block | `lab04` batchim | assemble + finals tray; 27→7 neutralization |
| 05 | Two Letters, One Slot | `lab05` clusters | cluster widget; Rule A vs B is an 11-item list, not derivable |
| 06 | The Letter That Jumps | `lab06` 10 `pron` cards | liaison widget; ㅎ-deletion named as *not* this rule |

**Deck:** 72 cards. Typed Revised Romanization. Grade from correctness + latency (easy < 3.5s, good < 9s). New cards capped at 10/day. Tier gating: never quiz unmet labs.

**Audio:** 19 isolated C+으 consonant clips (`app/src/lib/audio/consonants.ts`, PlayButton on review for those leads). Vowels, compounds, batchim, words, and sound-change models are missing.

**Sound changes in domain (`SOUND_CHANGES` in `hangul.ts`):** liaison scored; tensification, nasalization, aspiration, lateralization, ㄹ→ㄴ, ㅎ-deletion, palatalization are reference-only (`scored: false`).

**Surfaces:** `/` labs dashboard, `/lab/[id]`, `/review`, `/reference` (prose/tables, generated from domain), `/settings` (look + JSON backup/restore). First-run is empty localStorage: Lab 01 “start here”, empty review pile copy.

**NOTES.md backlog (input, not a lock — reorder, defer, or drop if outranked):** tensification + nasalization labs; remaining sound changes; names part 2; handwriting; RR traps.

**Known constraints still in repo docs that this R&D overrides:** `MISSION.md` / `NOTES.md` still say a ~10-minute session cap. **This brief’s lock governs:** session length is not a product cap. Kyle swings ~10 and ~60 minutes. Rank for both. Do not optimize for a 35-minute average.

---

## Win condition

Decode and predict from spelling: any syllable block read cold, sound changes predicted from writing. Target: unfamiliar blocks under ~2 seconds once the rule is unlocked. Handwriting stays secondary. A full speech trainer is future work and must not appear in the 10.

Win vs comparison set = best **script decoder** among: How To Study Korean Unit 0; Hangul units in TTMIK, Lingodeer, Drops, and Duolingo; dedicated Hangul reading trainers. Do not become a stroke-order app to beat Write It.

---

## Users

Kyle is the design target. A stranger must still finish the Hangul path without him in the room. No growth, marketing, or social features. First-run, playback audio, and durability may rank.

---

## Global Constraints

Copy these verbatim into every task brief and review.

1. **Do not re-grill.** Product is a Hangul / script-decoding trainer. Not a full language app. Do not reopen grammar, vocab-as-goal, TOPIK, conversation.
2. **Do not implement.** No product code, no lab content files, no speech-trainer spec.
3. **Playback audio may rank** (letters, words, sound changes). **No mic. No speech scoring.** Principles teach the mechanism; they do not replace hearing a model.
4. **Session length is not a product cap.** Kyle swings between ~10 and ~60 minutes. Rank for both sittings. Do not optimize for a 35-minute average.
5. **Stack is unlocked.** Accounts, sync, and hosting may rank. Sync is intended soon so progress survives device switches, but it still competes for a slot. No reserved rank.
6. **“Gamification” means retrieval pressure only:** timers, accuracy, speed to automaticity. No XP, streaks, leaderboards, or loot.
7. **Answer modality is unlocked.** Hangul input, composition, or dropping RR may rank, including as the review mechanic.
8. **Lab rule is a veto, including first-run:** teaching paths are action-cards. No Hangul tutorial articles. Korean IME/OS keyboard setup is settings (or one setup card), not a lesson.
9. **Phone and desktop are equal first-class.** The app must be as good on mobile as on desktop and vice versa. PWA/install may rank. Native iOS/Android may not.
10. **System-first default.** A mill may rank only after the rule is known, and only if that is how you get sub-2s decoding. A mill may not teach a rule.
11. **An addition is one product change with one outcome and one main surface**, later spec-able as a single piece of work. “Polish,” “gamification,” or “beat HTSK” are not additions. If two ideas do not share a reason to exist, they are two candidates. A lab plus its SRS tier may be one candidate if they are the same teaching unit.
12. **Hard disqualifiers (do not score):** mic-scored speech, XP/streaks/loot/leaderboards, native apps, Hangul tutorial articles, stroke-order product, growth/social.
13. **NOTES.md backlog is input, not a lock.**
14. **Score remaining candidates on:** (1) Impact on decode/predict automaticity including post-rule speed; (2) Stranger can complete the Hangul path without Kyle; (3) Phone/desktop parity — a desk-only or phone-only win fails; (4) Fits labs + retrieval pressure, not exposition or XP; (5) Impact if Kyle sits 10 minutes, and if he sits 60; (6) Cost/complexity only as a tie-break, not as a veto.

---

## Method (O1)

Rubric over a wide field. UX Researcher and Game Designer independently gather candidates from this app’s gaps, the comparison set, first-run, phone/desktop parity, playback audio, sync, answer modality, post-rule mills, interactiveness, and polish.

Then merge, disqualify, score, and rank. Do not recommend an implementation order except as implied by the rank.

---

## Task 1: UX Researcher candidate field

**Role:** UX Researcher. Independent gather. Do not coordinate with Game Designer. Do not produce the final Top 10.

**Read first:** this task text; Global Constraints above; `MISSION.md`, `NOTES.md`, `RESOURCES.md`, `GLOSSARY.md`, `learning-records/0001-starting-point-and-mission.md`, `learning-records/0002-lessons-must-be-interactive.md`, `learning-records/0003-writing-system-complete.md`; dashboard/review/settings/reference routes; `app/src/lib/domain/deck.ts`, `hangul.ts` `SOUND_CHANGES`, `app/src/lib/audio/consonants.ts`.

**Gather from:** this app’s gaps; comparison set (HTSK Unit 0; Hangul units in TTMIK, Lingodeer, Drops, Duolingo; dedicated Hangul *reading* trainers — not Write It as a product to beat on stroke order); first-run; phone/desktop parity; playback audio; sync/durability; answer modality; post-rule mills as a UX question (when does drilling belong); interactiveness; polish that unblocks decode or stranger completion.

**Competitive work:** Use web search. For each comparison product, record: how Hangul is taught (article vs drill vs game), whether audio is playback-only, whether they teach sound-change prediction from spelling, answer modality (MC, romanization, Hangul tap, handwriting), mobile vs desktop quality, and the one thing they do that this app currently cannot.

**Produce 20–40 candidates.** Each candidate must have:

- `id` (U1, U2, …)
- one-sentence **outcome** (what the learner can do after)
- **main surface** (one route or widget)
- **why it exists** (gap or competitor beat)
- **locks it touches**
- **what it is not**
- note if it is **two additions fused**

Drop hard disqualifiers without scoring. Do not rank a final 10. Do not write specs. Do not implement.

Write the full field to the report file.

---

## Task 2: Game Designer candidate field

**Role:** Game Designer. Independent gather. Do not coordinate with UX Researcher. Do not produce the final Top 10.

**Read first:** this task text; Global Constraints above; same product files as Task 1, plus lab step types in `app/src/lib/content/types.ts` and `app/src/lib/domain/srs.ts` (clock grades, new-card cap).

**Gather from:** retrieval pressure (timers, accuracy, speed to automaticity); answer modality as the review mechanic; post-rule mills that only exist after the rule is known and only if they buy sub-2s; lab interactiveness (action-cards, derive-then-feedback); 10-minute vs 60-minute sitting shapes; this app’s gaps vs the comparison set as *practice design* (what they mill, what they never mill); playback as a model in a drill, not a speech trainer.

**Design lens:** Recognition-only inflates mastery. Typed RR is the current anti-inflation mechanic and also a ceiling if the skill is Hangul→sound, not Hangul→romanization. A mill may not teach a rule. Labs unlock; SRS retains; a mill is a third shape only if automaticity needs volume after the mechanism is known.

**Produce 20–40 candidates.** Each candidate must have:

- `id` (G1, G2, …)
- one-sentence **outcome**
- **main surface**
- **why it exists**
- **locks it touches**
- **what it is not**
- note if it is **two additions fused**

Drop hard disqualifiers without scoring. Do not rank a final 10. Do not write specs. Do not implement.

Write the full field to the report file.

---

## Task 3: Rubric merge and ranked output

**Role:** Controller synthesis (may be a subagent). Read Task 1 and Task 2 report files. Merge overlapping candidates (keep one id, note aliases). Split fused candidates. Apply hard disqualifiers. Score every remaining candidate on the six rubric items. Rank a Top 10.

**Each Top 10 entry must include:** one-sentence outcome, main surface, why it scores, what it beats in the comparison set, what lock it satisfies, and what it is not.

**Also:** next-tier kill list (~10) with one-line reasons; note any candidate that is really two additions incorrectly fused; do not recommend an implementation order except as implied by rank.

Write `docs/rd/2026-08-20-hangul-niche.md`.

Then write `UBIQUITOUS_LANGUAGE.md` at repo root from this R&D conversation’s domain terms (labs, mill, decode, predict, retrieval pressure, stranger path, etc.), using the ubiquitous-language skill format. Do not replace `GLOSSARY.md` (that file is learner-facing script terms).
