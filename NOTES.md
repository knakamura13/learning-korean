# Working notes

## Stated preferences (2026-08-05, session 1)

- **10 minutes, most days.** Hard constraint. If a lesson cannot be finished in one
  sitting it will not be finished at all. Ruthlessly cut scope rather than run long.
- **Explain the system, don't hand over lists.** Kyle explicitly chose "show me why
  Hangul is built the way it is" over rote coverage. Lead every lesson with the
  underlying logic, then let the inventory fall out of it. Cite the logic — he is
  the kind of learner who will notice an unsupported claim.
- **Timed drills.** Wants a clock on retrieval. Build speed targets into drills, not
  just accuracy.
- **Real text.** Wants authentic Korean — signs, menus, product names, song titles —
  as the practice substrate, not invented example words.
- **Handwriting is secondary**, not zero. He selected it as a lower priority than the
  three above. Worth one dedicated lesson eventually; not a per-lesson component.

## Inferred, treat as provisional

- Has self-built a JLPT N5 flashcard deck (850+ cards, 24 topics) for the Lingo
  Legend app — see `../japanese-jlpt-n5-flashcards/`. Implications: comfortable with
  non-Latin script, comfortable with SRS/flashcard workflows, and willing to build
  his own study materials. **Possible high-value output:** a Lingo Legend CSV of
  Hangul syllable drills in the same format he already uses, once the reading
  foundation is in. That format supports a `3 – Script` topic type explicitly.
- Software engineer (HighPoint, monorepo work). Analogies from parsing, encoding,
  and grammars will land. Unicode/normalization angles on Hangul may genuinely
  interest him rather than distract.

## Teaching decisions made

- **Consonants before vowels** (Lesson 01). Rationale: the consonant derivation
  system is the more dramatic compression (19 → 5 + 2 rules), so it buys the most
  motivation per minute, and it makes the featural nature of the script concrete
  immediately. Vowels are a cleaner system but a smaller "aha".
- **Loanwords as the first real text.** Only four borrowed vowels are needed to read
  피자 / 바나나 / 사우나 / 라디오 / 기타 / 소파. Instant payoff, zero vocabulary load,
  and it demonstrates that decoding — not memorizing — is the transferable skill.
- **Merged vowels framed as good news.** ㅐ=ㅔ and ㅙ=ㅚ=ㅞ will be presented as a
  reduction in workload, not an irregularity to fear. Pre-empts the common beginner
  panic about not hearing a distinction that native speakers no longer make either.
- **Tense-consonant production explicitly deferred.** Recognizing the series is a
  Lesson 01 goal; producing it is a months-long project. Said out loud in the lesson
  so a genuine difficulty does not read as personal failure.

## Hard rule: lessons are labs, not articles (2026-08-05, session 1)

Kyle rejected the first version of Lesson 01: *"I want to learn interactively, not by
reading a blog-post styled tutorial."* This is a standing constraint, not a one-off.

**What this means concretely.** A lesson is a single-track sequence of cards where
each card demands an action, and explanatory text appears *only as feedback on what
the learner just did*. If a card can be understood without touching it, it does not
belong in a lab. No prose sections, no "here is the theory, now a quiz."

**Discovery over exposition.** Where possible the learner should *derive* the rule
rather than be told it. Lab 01 does not state "a stroke means aspiration" — it shows
ㄱ next to ㅋ, asks what changed, then has them hold a palm to their mouth and say
both, and only then names what they felt. Rules found this way stick; rules read do not.

**Reference material is exempt.** The `/reference` route stays prose and tables —
reference material is meant to be scanned, and that is a different job from teaching.
The objection was to *lessons* that read like articles.

## Spaced repetition (added at Kyle's request, session 1)

Kyle asked for SRS to master every letter, sound, and compound. Built as:

- `app/src/lib/domain/deck.ts` — originally 72 cards covering the letter
  inventory (now 299: generated block cards, the lab06–lab10 pronunciation
  tiers, and the vocabulary packs joined later): 19 consonants,
  10 basic vowels, 11 compound vowels + 5 construction cards, 16 batchim values,
  11 clusters.
- `app/src/lib/domain/srs.ts` — SM-2 variant, pure, clock injected.
- `/review` — the daily session.

**Three design decisions worth preserving:**

1. **Typed answers, not multiple choice.** Recognizing a letter among four options is
   far easier than producing its sound cold, and the easy version inflates the sense
   of mastery. Answers are typed as Revised Romanization — ASCII, so no Korean IME is
   needed — and multiple spellings are accepted where romanization is genuinely
   ambiguous (ㄱ → "g" or "k").
2. **Grades come from the clock, not self-rating.** Self-assessment is unreliable
   early on. Grade is derived from correctness plus latency: correct under 3.5s is
   "easy", under 9s "good", slower is "hard". Hesitation is the honest signal that a
   card is not secure.
3. **Tier gating.** Cards only enter rotation when the lab teaching them is finished,
   so the deck never quizzes unmet material. Lab 01 unlocks `lab01` (19 consonants);
   labs 02–06 unlock vowels, compounds, batchim, clusters, liaison.

New cards are capped at 10/day to hold sessions near the 10-minute budget.

**Known constraint:** localStorage is unreliable on `file://` origins in some
browsers. `storage.ts` probes on startup and `/review` shows a loud warning when
writes will not survive. `progress.export()` / `progress.import()` are the escape hatch.

**Fixed (2026-08-15):** that escape hatch had no UI — `export()`/`import()` sat
unused since the rewrite, so the only way out of the durability warning, or to
move a deck to a new browser/device, was the devtools console. Backup now lives
on Settings (`/settings#backup`) via `ProgressBackup.svelte` and domain helpers
in `domain/backup.ts`: download a dated JSON export and restore from one, with
an inline (not `confirm()`) warning before a restore overwrites the current deck.
Review storage warnings deep-link there when writes will not survive.

## The app was rebuilt in SvelteKit (2026-08-12)

Kyle asked to rebuild with a modern framework, citing code quality, authoring
friction, missing capability, and polish. I pushed back — the fix for most of that
was not a framework, and the highest-leverage spend was audio — but he reaffirmed the
full rebuild, so it was built.

**Live app:** `app/` (SvelteKit + TS + Vite + Vitest, `adapter-static`).
**Legacy static app:** deleted 2026-08-12 after parity was verified. Gone for good.

What actually improved, so nobody re-litigates it later:

- **Content is typed data.** `src/lib/content/lab0N.ts` instead of a standalone HTML
  file per lab. The compiler checks it, and `content.test.ts` validates the *whole
  course* against the domain in milliseconds — build-target reachability, tray
  solvability, cluster pronunciations, option-length parity. All of that previously
  required driving a browser.
- **Domain is pure and framework-free.** `hangul.ts`, `srs.ts`, `deck.ts`. The
  scheduler takes the clock as a parameter, so the interval curve is testable; the
  old one called `Date.now()` inline and could not be.
- **No string-built DOM.** The 816-line `innerHTML` concatenation is gone; composers
  update reactively instead of wiping and rebuilding.
- **Storage is a port** with a durability probe, rather than a swallowed try/catch.

**Migration:** the old app wrote its version field as `v`; the new one uses `version`.
`reviveState` accepts both — otherwise serving the new build from the old origin would
silently discard the learner's entire history. There is a test for this. Do not
"tidy" that compatibility branch away.

**Cutover (done 2026-08-12):** `pnpm study` builds and serves on **port 8777**, the
origin the old app used, so `localStorage` carried over with no export/import step.
One-click launch lives in `../.claude/launch.json` as `korean-study`.

**Use `localhost`, never `127.0.0.1`.** Vite preview binds IPv6 `[::1]`, and the two
hostnames are different localStorage origins — the wrong one silently shows an empty
deck rather than an error.

## Where things live (SvelteKit app)

The legacy static app was **deleted on 2026-08-12** once the rewrite reached parity.
A copy of it is archived at `scratchpad/legacy-static-app-backup.tar.gz` for the life
of that session only — treat it as gone. Everything below is in `app/`.

- `src/lib/domain/` — pure logic, no framework, no I/O.
  `hangul.ts` (phonology, orthography, derivation, sound changes), `srs.ts` (SM-2
  with an injected clock), `deck.ts` + `blockDeck.ts` (the 147 cards),
  `merge.ts` (sync reconciliation), `storage.ts` (persistence port).
- `src/lib/content/` — lessons as typed data. `types.ts` defines the step union;
  `lab01..lab07.ts` are the course. `content.test.ts` validates the whole course
  against the domain.
- `src/lib/components/` — `LabRunner.svelte` plus one component per step type:
  `mouth`, `choice`, `build`, `assemble`, `vowel`, `fusion`, `cluster`, `liaison`,
  `contact`, `read`. Wrong answers do *not* advance on any step type; `choice` and `read`
  mark the missed option and ask the learner to try again, revealing the
  teaching only after a correct pick.
- `src/routes/` — `/` dashboard, `/lab/[id]`, `/review`, `/drill` (60s block
  sprint, never writes the scheduler), `/reference`, `/settings` (appearance,
  account, backup), `/healthz`, and `/api/*` (the optional account/sync API).
- `src/lib/server/` + `src/lib/sync/` — the accounts layer (see below).

**`onNudge(html, soft)`** — composer widgets pass `soft: true` so valid intermediate
states (building ㅗ on the way to ㅛ) don't count against the first-try tally.
Penalising exploration would discourage the poking-around the widget exists for.
`assemble` stays hard-graded: there a completed wrong block really is a wrong answer.

**`onSettle(teach?, correct?)`** — an earlier miss dents the tally but must never turn
a correct final answer into a "not quite". Steps settle only on a correct answer.

**The reference page is generated from `hangul.ts`**, including the eight sound
changes, ganada order, block layouts and the 표준 발음법 citations that used to live in
the old `reference/hangul-complete.html`. Content parity was verified before deleting
that file. Do not hand-write reference tables that the domain can produce.

**Authoring rule, now enforced by test:** all options within a card must be the same
length. It has already caught one real slip (Lab 02's correct answer was the only
seven-word option among five- and six-word distractors).

## Accounts & cross-device sync (added 2026-08-22, production push)

Grilling session 2026-08-21 settled the shape; PRs #121–#124 built it.
Decisions worth preserving:

- **Audience is a small circle** (Kyle + friends/family), not a public product.
  Google OAuth only — hand-rolled code+PKCE flow in `server/googleOauth.ts`
  because the small OAuth libraries are unmaintained (arctic is published as
  "no longer supported") and the flow is two URLs and a fetch.
- **The server is a dumb, revision-checked document store.** The wire format is
  the existing v2 backup envelope; all merge/revive intelligence stays in the
  pure client domain. `srs.ts`, `labSession.ts`, and `storage.ts` were not
  touched — the "a future sync backend slots in without touching this file"
  promise held.
- **Login-and-load with deterministic merge** (`domain/merge.ts`): per-card
  latest-review-wins (review instant recovered from the schedule), days take
  max, whole-sitting-wins per lab. **The learner is never asked to pick a save
  point** — a hard constraint from the grilling session.
- **Guest mode is the app.** Without `DATABASE_URL` every API route answers
  unavailable and the client runs exactly as before; a static build behaves
  identically. First sign-in adopts the local deck; corrupt-quarantined state
  makes the sync engine fully inert (pushing would clobber the account copy).
- **Railway private networking only** for app↔DB (`postgres.railway.internal`)
  — no egress fees. Runbook in the root README.
- Study pacing (new/day, reviews/sitting) is an account preference with UI in
  Settings; appearance stays device-local by design.
- iOS note that motivated all this: an installed PWA gets storage partitioned
  from the Safari tab, and ITP can evict localStorage — server state is the
  durability fix, not just convenience.

## Vocabulary packs (added 2026-08-22)

MISSION.md's vocabulary exclusion was amended: words *as reading substrate* are
in scope; word-list chasing is not. Design decisions:

- **Corpus** (`domain/words.ts`): 100 words in four packs (names & people,
  food & menus, messages, signs & places). Every entry's spoken form is both
  authored and derived — the test asserts `pronounceWord(hangul) === spoken`,
  so a word needing an unmodeled rule (ㄴ-insertion 서울역, stop-host ㄹ 독립,
  palatalization 같이) cannot ship. Pick a different word, never weaken the check.
- **Two lanes per word**: a meaning card (typed English) for all 100, and a
  pronunciation card only where a sound change makes the spelling lie (22) —
  and never when a lab tier already quizzes that word (학교, 좋아요, …).
- **Separate daily budget**: the scheduler grew a second pin triple
  (`vocabNew*` on `SrsState`, additive and backup-compatible) with its own cap
  (5/day, compiled — a Settings knob is deferred). Words can never starve
  letters out of the day, or vice versa. Reviews of both tracks share one
  sitting, oldest due first.
- **Packs unlock by hand, gated on Lab 05** — real words use the whole letter
  inventory. Opening a pack is `unlock(['vocab-food'])`, same machinery as labs.
- **Block cards flipped to composition** (same PR): the front is now the
  sound; the learner builds the block from tap-trays (`domain/blockCompose.ts`,
  `ReviewCompose.svelte`). Trays honor unlock state — no compound vowels
  before Lab 03, no clusters before Lab 05, even as distractors.

## Backlog of lesson ideas

**Built:** Lab 01 (consonants, `lab01`) · Lab 02 (basic vowels, `lab02`) ·
Lab 03 (compound vowels, `lab03`) · Lab 04 (batchim, `lab04`) · Lab 05 (clusters,
`lab05`) · Lab 06 (liaison, `lab06`) · Lab 07 (tensification + nasalization, `lab07`) ·
Lab 08 (aspiration + ㅎ-deletion, `lab08`) · Lab 09 (lateralization + ㄹ→ㄴ, `lab09`) ·
Lab 10 (names & address, `lab10`).
**All 72 letter cards are reachable — the writing system is fully covered.** Each of
labs 06–10 adds ten pronunciation cards to its own tier.

Lab 02 scope note: it teaches the **10 basic vowels only**, deliberately matching deck
tier `lab02`. Compound vowels and the mergers were split out into Lab 03 rather than
crammed in — Lab 02 already runs 16 cards, and the compounds have their own deck tier
(`lab03`, 16 cards) plus their own rule (fusion, not tick-placement). Block layout
(tall vs wide) was folded into Lab 02's Act 5 instead of being its own lesson, since
`assemble` cards teach it in about 40 seconds.

Lab 03 scope note: the `fusion` step type lets the learner select **impossible** pairs
(ㅗ+ㅓ) and answers honestly — dashed box, ✕, and an explanation naming the bright/dark
clash. That failure *is* the lesson: vowel harmony is discovered by trying a pair that
does not exist, then being asked to name the rule. Do not "helpfully" hide invalid
options in future composer widgets; the impossible states are teaching surface.

Lab 04 scope note: rather than a new step type, `assemble` gained an **optional
`finals` tray** — a third slot that composes the full CVC block via the Unicode
`T` index. Neutralization is drilled with plain `choice` cards whose options are
single jamo (ㄱ/ㄴ/ㄷ/ㅂ), which keeps all four options exactly one character long.
`Lab.batchim(jamo)` exposes the 27→7 map and is **cross-checked in testing against
the `lab04` deck answers**, so the lab and the SRS deck cannot drift apart. Keep that
assertion in any future batchim work.

Lab 05 scope note: the `cluster` step **derives the correct answer** from
`Lab.batchim()` rather than taking it from the card, and its two options come from
`CLUSTER_PARTS` — so a cluster card cannot disagree with the phonology map, and the
options are always exactly one character each. The test suite additionally decomposes
each authored `pron` string and asserts its batchim equals the derived winner. Keep
that audit: it is what caught nothing this round only because the map was already right.

Lab 05 also states plainly that Rule A vs Rule B **is not derivable** — it is an
eleven-item list. Do not invent a mnemonic rule for it; the honest framing ("this is
what the SRS deck is for") is deliberate and Kyle responds to it.

Lab 06 scope note: the `liaison` step type derives jump/stay/split from
`liaisonAction()` and `applyLiaison()` — the card cannot disagree with the phonology
map. Batchim ㅇ stays put (already _ng_); clusters split per 표준 발음법 Article 14
rather than dropping a letter. The finish card names ㅎ-deletion (좋아요) as *not*
liaison so it does not get crammed into this rule. Keep that boundary in later labs.

### Beyond the writing system — sound changes

The page is now fully covered, and so are the drilled sound changes: labs 06–09
cover liaison, tensification + nasalization, aspiration + ㅎ-deletion, and the
ㄹ rules; only palatalization stays reference-only. Suggested order was:

1. **Tensification + nasalization** — 학교 → [학꾜], 입니다 → [임니다]. **Built as Lab 07.**
2. **Aspiration + ㅎ-deletion**, then the ㄹ rules. **Built as Labs 08–09.**
3. **Names, part 2** — full names, honorific suffixes, and how Korean addresses people.
   Ties off the "people in my life" half of the mission. **Built as Lab 10.**
4. **Handwriting** — stroke order, one session.
5. **Romanization traps** — why RR misleads, so he stops trusting it entirely.

Sound-change deck tiers (`lab06`+) use rule-application cards: front is a written
word, answer is its pronunciation. Lab 06 established the `pron` card kind in
`deck.ts`; labs 06–10 each add ten.

Lab 10 scope note: every name on a widget or deck card is **derivable by the
engine** — `pronounceWord` chains the drilled rules, and the deck derives each
answer from it, so a name whose real-life sound needs an unmodeled rule cannot
ship. Two rejection classes to respect when adding names: given names starting
이/야/여/요/유 after a batchim surname (김연아, 박열 — real speech ㄴ-inserts at
the name boundary, the engine liaises), and stop batchim + ㄹ-initial given
names (박라온 — the 독립-class two-rule chain the engine deliberately refuses).
씨 forms need a space (은지 씨), which breaks block-cut romanization — 씨/님
attachment is taught in choice cards, and only space-free forms (고객님,
vocatives) become deck fronts. No new step types: names reuse `liaison`,
`contact`, and `hmerge` widgets, which proves the point the lab makes — names
are ordinary Korean at every junction.
