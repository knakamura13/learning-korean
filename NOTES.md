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
  and grammars will land. Unicode/normalisation angles on Hangul may genuinely
  interest him rather than distract.

## Teaching decisions made

- **Consonants before vowels** (Lesson 01). Rationale: the consonant derivation
  system is the more dramatic compression (19 → 5 + 2 rules), so it buys the most
  motivation per minute, and it makes the featural nature of the script concrete
  immediately. Vowels are a cleaner system but a smaller "aha".
- **Loanwords as the first real text.** Only four borrowed vowels are needed to read
  피자 / 바나나 / 사우나 / 라디오 / 기타 / 소파. Instant payoff, zero vocabulary load,
  and it demonstrates that decoding — not memorising — is the transferable skill.
- **Merged vowels framed as good news.** ㅐ=ㅔ and ㅙ=ㅚ=ㅞ will be presented as a
  reduction in workload, not an irregularity to fear. Pre-empts the common beginner
  panic about not hearing a distinction that native speakers no longer make either.
- **Tense-consonant production explicitly deferred.** Recognising the series is a
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

- `app/src/lib/domain/deck.ts` — 72 cards covering the full inventory: 19 consonants,
  10 basic vowels, 11 compound vowels + 5 construction cards, 16 batchim values,
  11 clusters.
- `app/src/lib/domain/srs.ts` — SM-2 variant, pure, clock injected.
- `/review` — the daily session.

**Three design decisions worth preserving:**

1. **Typed answers, not multiple choice.** Recognising a letter among four options is
   far easier than producing its sound cold, and the easy version inflates the sense
   of mastery. Answers are typed as Revised Romanization — ASCII, so no Korean IME is
   needed — and multiple spellings are accepted where romanisation is genuinely
   ambiguous (ㄱ → "g" or "k").
2. **Grades come from the clock, not self-rating.** Self-assessment is unreliable
   early on. Grade is derived from correctness plus latency: correct under 3.5s is
   "easy", under 9s "good", slower is "hard". Hesitation is the honest signal that a
   card is not secure.
3. **Tier gating.** Cards only enter rotation when the lab teaching them is finished,
   so the deck never quizzes unmet material. Lab 01 unlocks `lab01` (19 consonants);
   labs 02–05 unlock vowels, compounds, batchim, clusters.

New cards are capped at 10/day to hold sessions near the 10-minute budget.

**Known constraint:** localStorage is unreliable on `file://` origins in some
browsers. `storage.ts` probes on startup and `/review` shows a loud warning when
writes will not survive. `progress.export()` / `progress.import()` are the escape hatch.

**Fixed (2026-08-15):** that escape hatch had no UI — `export()`/`import()` sat
unused since the rewrite, so the only way out of the durability warning, or to
move a deck to a new browser/device, was the devtools console. `/review` now has
a "Back up or restore your progress" disclosure (`ProgressBackup.svelte`,
domain helpers in `domain/backup.ts`) that downloads the export as a dated JSON
file and restores from one, with an inline (not `confirm()`) warning before a
restore overwrites the current deck. Opens itself when storage is not durable,
since that is exactly when backing up right now matters.

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
  with an injected clock), `deck.ts` (the 72 cards), `storage.ts` (persistence port).
- `src/lib/content/` — lessons as typed data. `types.ts` defines the step union;
  `lab01..lab05.ts` are the course. `content.test.ts` validates the whole course
  against the domain.
- `src/lib/components/` — `LabRunner.svelte` plus one component per step type:
  `mouth`, `choice`, `build`, `assemble`, `vowel`, `fusion`, `cluster`, `read`.
  Wrong answers on `mouth`, `build`, `assemble`, `vowel`, `fusion` and `cluster` do
  *not* advance; `choice` and `read` resolve either way, because their teaching is in
  the explanation rather than in retrying.
- `src/routes/` — `/` dashboard, `/lab/[id]`, `/review`, `/reference`.

**`onNudge(html, soft)`** — composer widgets pass `soft: true` so valid intermediate
states (building ㅗ on the way to ㅛ) don't count against the first-try tally.
Penalising exploration would discourage the poking-around the widget exists for.
`assemble` stays hard-graded: there a completed wrong block really is a wrong answer.

**`onSettle(teach?, correct?)`** — an earlier miss dents the tally but must never turn
a correct final answer into a "not quite". Only `choice`/`read` pass `correct: false`.

**The reference page is generated from `hangul.ts`**, including the eight sound
changes, ganada order, block layouts and the 표준 발음법 citations that used to live in
the old `reference/hangul-complete.html`. Content parity was verified before deleting
that file. Do not hand-write reference tables that the domain can produce.

**Authoring rule, now enforced by test:** all options within a card must be the same
length. It has already caught one real slip (Lab 02's correct answer was the only
seven-word option among five- and six-word distractors).

## Backlog of lesson ideas

**Built:** Lab 01 (consonants, `lab01`) · Lab 02 (basic vowels, `lab02`) ·
Lab 03 (compound vowels, `lab03`) · Lab 04 (batchim, `lab04`) · Lab 05 (clusters,
`lab05`). **All 72 deck cards are now reachable — the writing system is fully covered.**

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
`T` index. Neutralisation is drilled with plain `choice` cards whose options are
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

### Beyond the writing system — sound changes

The page is now fully covered. What remains is how the page *sounds* when letters
meet, which is where reading turns into hearing. Suggested order:

1. **Liaison (연음)** — batchim + ㅇ moves forward: 한국어 → [한구거]. Highest leverage
   single rule; it is why spoken Korean does not sound like the spelling. Also the
   payoff for Lab 04's "spelling preserves identity" aside. (Next.)
2. **Tensification + nasalisation** — 학교 → [학꾜], 입니다 → [임니다]. The two changes
   that most often make a known word unrecognisable by ear.
3. **Aspiration, ㅎ-deletion, palatalisation, ㄹ assimilation** — the remaining four.
4. **Names, part 2** — full names, honorific suffixes, and how Korean addresses people.
   Ties off the "people in my life" half of the mission.
5. **Handwriting** — stroke order, one session.
6. **Romanisation traps** — why RR misleads, so he stops trusting it entirely.

A **new deck tier** will be needed for sound-change cards (tier `lab06`+). These are
rule-application cards, not letter cards, so the front should be a written word and
the answer its pronunciation — consider a `pron` card kind in `deck.js`.
4. **Liaison** — the single highest-leverage sound rule for understanding speech.
5. **Clusters** — Rule A / Rule B, and the three exceptions.
6. **Nasalisation + tensification** — the two changes that make spoken Korean
   unrecognisable from the page.
7. **Names** — reading real Korean surnames and given names. Ties directly to the
   "people in my life" half of the mission; needs batchim first (김, 박, 정, 강).
8. **Handwriting** — stroke order, one session.
9. **Romanisation traps** — why Revised Romanization misleads (ㅡ as "eu",
   initial ㄱ as "g" vs "k"), so he stops trusting it and reads Hangul directly.
