# Hangul-niche R&D: the ten highest-impact additions

Date: 2026-08-20. Method: O1 — rubric over a wide field. Two researchers (UX, game design)
gathered candidates independently from this app's gaps, the comparison set, first-run,
phone/desktop parity, playback audio, sync, answer modality, post-rule mills,
interactiveness, and polish. Fields were merged, deduped, and scored here.

No implementation. No speech-trainer spec. Rank does not imply an implementation order
beyond what the rank itself implies.

---

## Scoring rubric

Every surviving candidate was scored on:

1. Impact on decode/predict automaticity, including post-rule speed
2. A stranger can complete the Hangul path without Kyle
3. Phone/desktop parity — a desk-only or phone-only win fails
4. Fits labs + retrieval pressure, not exposition or XP
5. Impact at a 10-minute sitting and at a 60-minute sitting
6. Cost/complexity, as a tie-break only

Hard disqualifiers, not scored: mic-scored speech; XP, streaks, loot, leaderboards;
native apps; Hangul tutorial articles; a stroke-order product; growth or social.

---

## What both researchers found independently, verified in the tree

These findings drive most of the ranking. Each was re-checked directly.

**F1 — The product never tests its own win condition.** Every card front in
`app/src/lib/domain/deck.ts` is a single jamo. `CardKind` is
`consonant | vowel | compound | build | batchim | cluster | pron`. There is no block
kind and no block card. A learner can reach 72/72 mature having never been asked to
read an unfamiliar syllable block cold, which is the first line of `MISSION.md`.

**F2 — Nothing measures the two-second target.** `CardState` in
`app/src/lib/domain/srs.ts` stores `ease, ivl, reps, lapses, due` and no latency.
Latency is computed once in `app/src/routes/review/+page.svelte`, converted to a grade
bucket, and discarded. The app's own "fast" is `FAST_MS = 3500` against a mission
target of 2000.

**F3 — The same threshold grades one keystroke and twelve.** `FAST_MS` applies
identically to `ㄱ → g` and to a `pron` card answered `han-geu-reul`. Part of every
grade is typing speed, and it differs between a phone and a laptop. That is a parity
break inside the scheduler.

**F4 — A 60-minute sitting runs out of product at about minute 12.**
`DEFAULT_NEW_PER_DAY = 10` and `DEFAULT_REVIEW_PER_SITTING = 10` are constants with no
UI. When the queue empties, `/review` renders the clear state and argues against
continuing: "Reviewing early would only weaken the spacing." That is correct about
spacing and wrong about speed, because there is no non-SRS practice surface at all.

**F5 — Seven of the eight sound changes are inert data.** `SOUND_CHANGES` in
`app/src/lib/domain/hangul.ts` carries eight entries; exactly one has `scored: true`.
Only `applyLiaison()` exists as a function.

**F6 — Audio is 19 synthesized consonant clips.** `CONSONANT_AUDIO_SLUG` covers `LEADS`
only. `/review` shows a play button when `card.kind === 'consonant' || isConsonantLead(...)`.
Vowels, compounds, batchim, clusters and every word are silent. `RESOURCES.md` lists
this first under Gaps and points at How To Study Korean as the substitute — the
recommended fix for our app is currently another app.

**F7 — The course's most decoding-shaped step asks nothing.** `ReadStep.svelte` reveals
`b.reading` on tap with no answer required; only the meaning multiple-choice is graded.
Its own comment says "the point is to sound the word out," and nothing verifies that
anything was sounded out. `read` is the second most-used step type (18 uses, against 30
`choice`).

**F8 — Skip-ahead grants the lab but not the deck.** `openLab()` and `unlock()` are
separate in `srs.ts`, and only lab completion calls `unlock()`. A learner who skips
ahead can open Lab 05 and still be told "Nothing in Review yet."

**F9 — The two honest difficulty signals are computed and never rendered.** `weakest()`
is exposed as `progress.weakest` in `app/src/lib/stores/progress.svelte.ts` and consumed
by no route. `stats.lapsing` is computed and never displayed.

**F10 — A disqualified mechanic already ships.** `/review` renders
`{stats.streak}` labelled "day streak". Under the retrieval-pressure-only lock, that is
habit gamification, not retrieval pressure.

**F11 — Installable, not installable-and-useful.** `static/manifest.webmanifest`
declares `display: standalone`; there is no service worker anywhere in the repo. On
iOS, Home Screen installation is also the exemption from WebKit's seven-day eviction of
script-writable storage, so the missing service worker is both an offline gap and a
durability gap.

### The shape of the hole in the market

Nobody owns both halves. The explainers — How To Study Korean Unit 0, Elon.io, TTMIK —
teach the system and never make you fast. The gyms — Batchim, Hangul Blocks, SpeedKorean,
Hangul Punch — make you fast and refuse to teach the system. Batchim's own FAQ requires
that you already read 가/나/다 before starting. SpeedKorean's sprint tiers are the
mechanic to beat, and it teaches with picture mnemonics ("ㄱ is a gun") rather than the
featural system. Duolingo and LingoDeer skip batchim sound change almost entirely.

This app is currently an explainer with a scheduler. The single largest strategic gap is
that six derivation labs never hand off to a speed surface.

---

# The top 10

## 1. Timed block sprint

**Outcome.** A short timed round of generated, unfamiliar syllable blocks that reports
one number: median decode time in milliseconds.

**Main surface.** A new `/drill` route, entered from `/` and from the `/review` clear state.

**Why it scores.** Criterion 1, decisively: it is the only candidate that both trains and
reports the win condition, and F1 plus F4 mean nothing in the product does either today.
Blocks generate from `compose()` in `hangul.ts` constrained to unlocked tiers, so the mill
can never quiz unmet material. Criterion 5 is the other reason it leads — a 60-second
round is a real 10-minute sitting, and repeated rounds are the only honest answer to
"I have an hour," which the product currently answers with "come back tomorrow."
Criterion 3 holds if answers are taps or short composition rather than long typing.
Criterion 2 is neutral, and only stays neutral if the sprint is gated behind the labs.

**What it beats.** Batchim's Syllable Sprint and SpeedKorean's 60-second sprint are the
same mechanic, and both sit in front of learners who had to learn Hangul elsewhere. Ours
would be the only sprint downstream of a derivation the learner just completed. Against
How To Study Korean it beats an explainer with zero retrieval and zero timing.

**Lock it satisfies.** System-first: a mill that runs only after the rule is known and
teaches nothing. Retrieval pressure as the only permitted gamification. Both sitting
lengths.

**What it is not.** Not a second SRS — sprint results must never write `SrsState`
intervals. Not an arcade mode: no falling blocks, no combos, no lives. The round ends
because the clock ran out, not because you died.

## 2. Whole-block review tier

**Outcome.** Review starts scheduling syllable blocks — 강, 읽, 부엌 — so the retention
system holds the actual skill rather than its parts.

**Main surface.** `/review`, via a new tier and card kind in `deck.ts`.

**Why it scores.** Criterion 1 high and criterion 2 strongly positive: F1 means the deck
currently drills the inventory while the mission names the block, and this is the missing
rung between "I know 19 consonants" and "I can read a sign." Criterion 4 is a perfect fit
— tier-gated exactly like every existing tier, no exposition needed. Criterion 5 favours
the 10-minute sitting, because it makes the existing capped queue worth more per card.
It is the cheaper half of the same structural gap that ranks candidate 1 first, and it is
what stops sprint gains from decaying between sittings.

**What it beats.** How To Study Korean Unit 0 closes on a Quick Reference chart of
letters, not blocks. This is precisely the gap Batchim's entire product exists to fill
for people who finished a letter course elsewhere — filled here inside the course.

**Lock it satisfies.** Retrieval pressure, tier-gated so it cannot teach a rule.

**What it is not.** Not vocabulary. The block is the item; meaning is not asked and not
scored.

## 3. Honest decode-speed measurement

**Outcome.** Per-item decode latency is measured fairly, persisted, and shown against an
explicit two-second line — and the day-streak counter goes away.

**Main surface.** `srs.ts` state and grading, the `/review` feedback block, and the stats
strip on `/`.

**Why it scores.** Criterion 1 through measurement: F2 means a learner cannot tell whether
they are getting faster, and the app's own "fast" is 3.5s against a 2s goal. Criterion 3
is the sharp one — F3 means the current grade partly measures typing speed, so a phone
user is penalised for owning a phone at the level of the scheduler. Fixing that is a
parity fix, not a nicety, and without it candidates 1 and 2 report a partly fictional
number. Criterion 4 makes the streak deletion part of this candidate rather than a side
effect: F10 is a disqualified mechanic already shipping, and the honest signals in F9 are
built and unrendered.

**What it beats.** Hangul Punch reports words-per-minute buried in a boxing metaphor;
Batchim advertises reading speed as a marketing claim. Nobody exposes per-item decode
latency as a diagnostic. SpeedKorean's mastery-coloured letter map is the shape to beat,
and it is beatable because theirs is coarse where ours can be a millisecond figure.

**Lock it satisfies.** Retrieval pressure only — timers, accuracy, speed to automaticity,
with the one habit-loop mechanic in the product removed.

**What it is not.** Not an analytics page. Two questions only: how fast am I, and what am
I slow on. No daily-volume charts, no history graphs, no vanity totals.

## 4. Lab 07 — tensification and nasalization

**Outcome.** The learner derives why 학교 is [학꾜] and 입니다 is [임니다], and the deck
gains a tier of written-word to spoken-form cards for both rules.

**Main surface.** `/lab/0007` plus a `lab07` tier in `deck.ts`.

**Why it scores.** Criterion 1 on the half candidates 1–3 do not touch: predict from
spelling. F5 means seven of eight rules are inert reference prose, and these two are the
pair that most often make a known word unrecognisable. Criterion 2 is the strongest in the
field — this is the hole every free Hangul course leaves, so it is exactly what a stranger
cannot self-serve elsewhere in interactive form. Criterion 4 is the brief's own named
example of a legitimate single candidate: a lab plus its SRS tier, same teaching unit.
Criterion 5 fits the established ~10-minute lab shape, and the tier then pays into every
later sitting.

**What it beats.** Duolingo never explains that a bottom ㅈ says *t*; LingoDeer and Drops
skip sound change; TTMIK spends the equivalent slot on stroke order. Batchim drills all
six rules and derives none of them.

**Lock it satisfies.** Lab rule — action-cards, rule derived rather than told, explanation
only as feedback. System-first, since the rule lands before any mill drills it.

**What it is not.** Not "the remaining seven sound changes." One lab, two rules, one tier.
Lab 06 set the precedent of explicitly excluding ㅎ-deletion to keep a rule boundary
clean; keep it.

## 5. Native audio across the whole inventory

**Outcome.** Every jamo in every slot, every merged vowel pair, and every word in the
drill corpus has a human model clip that plays on every device.

**Main surface.** `static/audio/` plus the `PlayButton` call sites already wired into
`/reference`, `/review`, `MouthStep`, `BuildStep` and `Stage`.

**Why it scores.** Criterion 2 near-blocking: F6 means the app teaches ㅐ=ㅔ and ㅙ=ㅚ=ㅞ
as mergers with no way to hear that they merged, and teaches a tense series that is
unlearnable from text. A stranger cannot verify a guess about ㅓ from romanization, and
romanization is the crutch the product elsewhere plans to remove. Criterion 1 is indirect
but real: a wrong internal model slows every subsequent read. Criterion 3 is where this
candidate has a hidden failure — only `.opus` ships and `ConsonantClip.svelte` renders
nothing when playback fails, so a phone on older iOS silently loses a control the desktop
shows. Delivery is part of this candidate's definition of done, not a separate win.

**What it beats.** Every product in the comparison set ships full audio, including the
free ones. We are below the floor, and `RESOURCES.md` concedes it by naming How To Study
Korean as the substitute.

**Lock it satisfies.** Playback audio, explicitly permitted. No mic, no scoring — the
principle still teaches the mechanism, the clip supplies the model.

**What it is not.** Not a listening course, not a step toward speech scoring, and not
text-to-speech for the tense contrast — synthetic voices are least trustworthy on exactly
the distinction Lab 01 spends five cards deriving.

## 6. Hangul composition as the answer modality

**Outcome.** The learner answers by composing the block in Hangul instead of typing
Revised Romanization.

**Main surface.** The answer control on `/review`, and later `/drill`, reusing the
`Tray`/`Slots` composition vocabulary the labs already own.

**Why it scores.** Criterion 1 high: it removes a Latin-alphabet hop from every retrieval
and makes production of the block the thing being retrieved. `deck.ts` justifies typed
Revised Romanization so "no Korean keyboard is needed" — a constraint the brief has now
unlocked — while `NOTES.md` separately backlogs teaching that romanization misleads. The
deck currently trains the crutch the roadmap plans to remove. Criterion 3 is the strongest
phone-parity win in the field: an on-screen pad is better on a phone than an ASCII field,
and Korea's own 천지인 layout builds every vowel from `·` + `ㅡ` + `ㅣ`, which is the
generative rule `VowelStep.svelte` and `vowelBoard.ts` already teach. Criterion 2 is the
risk and the reason it sits at 6 rather than higher: without an on-screen pad, a stranger
with no IME is locked out on day one. Criterion 5 costs the 10-minute sitting before it
pays back at 60.

**What it beats.** Hangul Lab still grades romanized typing; Duolingo's romanization
dependence is its most-cited Korean criticism. HanGuldle and Type Hangeul both prove
in-browser jamo composition works with no OS keyboard.

**Lock it satisfies.** Answer modality explicitly unlocked, including dropping Revised
Romanization and including as the review mechanic. Lab rule respected — the pad is an
input device, not a lesson, and IME setup stays in settings.

**What it is not.** Not a typing tutor. Korean words-per-minute is not the goal, and its
speed contribution must be factored out of candidate 3's measurement.

## 7. Placement drill that actually unlocks

**Outcome.** Someone who already reads some Hangul proves it once and receives the
matching deck tiers, instead of opening a lab into an empty review queue.

**Main surface.** The skip-ahead popover on `/`, upgraded from a confirmation into a short
proving drill.

**Why it scores.** Criterion 2 is the highest in the field and this is the only candidate
that is purely about it: F8 is a live wall, not a hypothesis — skip-ahead grants lab
access while the deck stays locked, so the stranger the brief describes hits a dead end on
their first decision. Criterion 4 is satisfied because the proving drill is retrieval, so
no tutorial screen is needed to fix it. Criterion 1 is low, which is why it does not rank
higher; criterion 6 is the tie-break that keeps it in, since the mechanism is already
built and simply not connected.

**What it beats.** Duolingo rebuilt its Korean course partly because returning learners
could not find their level; Kana Pro solves the same problem with automatic versus manual
set selection. No Hangul trainer in the set lets a partial reader enter mid-path and keep
a scheduler.

**Lock it satisfies.** Lab rule, including first-run — a drill you pass or do not, never a
placement article. Stranger-completes-the-path.

**What it is not.** Not a level test with a score, and not a wall. Failing costs nothing
but the labs you then take.

## 8. Real-text corpus

**Outcome.** Drills, reads and block cards draw from authentic short Korean — signs,
menus, product names, station names — instead of hand-authored example words.

**Main surface.** A content module feeding `read` steps, `/drill`, and the block tier.

**Why it scores.** Criterion 1 as an enabler with unusual leverage: frequency-weighted
real blocks are what make candidates 1 and 2 transfer to a street sign rather than to more
of themselves, and every item-hungry candidate is bottlenecked on it. Today the entire
authentic-text surface is 18 hand-authored `read` steps. Criterion 2 is strong because it
is the moment the skill visibly pays off, which is the best evidence a stranger has that
the path worked. Criterion 5 is good at both lengths, and it is what stops a 60-minute
sitting exhausting the item pool. `MISSION.md` and `NOTES.md` both name real text as a
stated preference and `RESOURCES.md` lists its absence as an open gap.

**What it beats.** Batchim's Korean Scenarios are authored dialogue; SpeedKorean's top
tier is "real words" without a source. Nobody in the set drills the ambient text the
mission actually names.

**Lock it satisfies.** System-first — it is ammunition for mills that run after the rule,
never a teaching surface itself.

**What it is not.** Not vocabulary instruction. A gloss exists so the block is decodable,
not so the word is learned.

## 9. Predict-then-hear sound-change cards

**Outcome.** The learner commits to a predicted pronunciation before the model plays, so
audio confirms or corrects a prediction rather than being absorbed passively.

**Main surface.** `/review`, as a card behaviour for the `pron` kind.

**Why it scores.** Criterion 1 on prediction specifically: it is the only candidate that
closes the loop between a sound the learner predicted from spelling and a real one.
Criterion 2 strongly positive — it is the closest substitute for having a Korean speaker
in the room, which is the resource a stranger most obviously lacks. Criterion 4 is a clean
fit: the prediction is the retrieval and the audio is feedback on what the learner just
did, which is the lab rule applied to a review card. It ranks below 5 because it is
worthless before it, and below 4 because it needs `pron` tiers worth predicting.

**What it beats.** How To Study Korean gives models with no retrieval; TTMIK's listening
questions cannot withhold, because a book cannot ask you to commit first. Playing audio
before the answer — which is what everyone else does — converts a production card into a
recognition card.

**Lock it satisfies.** Playback audio, no mic, no speech scoring. The learner is never
recorded and never rated on production.

**What it is not.** Not shadowing, not dictation, not a pronunciation grade.

## 10. Graded cold read

**Outcome.** The `read` step asks the learner to produce each block's reading before it is
revealed, so the reveal becomes feedback instead of a free look.

**Main surface.** `ReadStep.svelte`.

**Why it scores.** Criterion 1 medium-high for almost no cost: F7 means the course's most
decoding-shaped step, used 18 times, currently verifies nothing — its own comment states
the intent that the code does not enforce. `MISSION.md` says outright that
recognition-only exercises waste a session. Criterion 2 is positive because a stranger is
exactly the person who taps through and believes they read it. Criterion 4 strengthens an
existing step rather than adding a surface, which is why it survives a field where
everything above it is larger.

**What it beats.** This is the same self-report weakness in LingoDeer's and Duolingo's
alphabet units, where tapping to reveal counts as practice.

**Lock it satisfies.** Lab rule — every card demands an action, and the explanation arrives
only as feedback on what the learner just did.

**What it is not.** Not a new step type, and not a place for a clock. Labs are where rules
are derived, and timing a teaching card punishes thinking.

---

# Next-tier kill list

Ordered roughly by how close each came.

1. **Offline install (service worker + PWA)** — the closest miss; scores zero on criterion
   1, and only ranks at all because F11 makes it simultaneously the offline fix and the
   iOS storage-eviction exemption.
2. **Accounts and cross-device sync** — scores zero on criterion 1 and orthogonal on 4;
   it is the parity feature, but it converts a static folder into a service with a
   permanent operating burden, and Hangul Blocks proves iCloud sync is not why anyone
   picks a trainer.
3. **QR or one-time-code device handoff** — 80% of sync's value at 20% of its cost, but it
   is a one-shot copy that must never claim to be continuous, and it still moves no
   decoding metric.
4. **First-run orientation card** — high on criterion 2 and near-free, but candidate 7
   removes the actual wall while this removes an explanation, and it is the easiest
   candidate in the field to accidentally turn into a tutorial.
5. **Weak-card clinic** — surfaces `weakest()` and `stats.lapsing` from F9 as a targeted
   round; loses because candidate 3 already has to render weak items, and a clinic without
   a drill surface is a list you read.
6. **Lapse escalation back into the lab** — the honest system-first move when a mill fails,
   and the cleanest expression of "a mill may not teach a rule"; deferred because it needs
   candidates 1 and 3 to know what a lapse means.
7. **Confusion-pair discrimination drill** — high on criterion 1, but it is an item
   generator for candidate 1 rather than an addition; see the fusion notes.
8. **Decode a message you were actually sent** — the field's biggest differentiator, since
   no competitor accepts learner-supplied text and `hangul.ts` can already do most of it;
   loses on criterion 4, because the honest version is a results page and the pressure
   version is candidate 4's tier.
9. **Names lab** — squarely in `MISSION.md` and unowned by any competitor, but it is a
   narrower teaching unit than Lab 07 and depends on the same sound changes.
10. **Romanization-traps lab** — it is the argument for candidate 6, not a peer of it;
    shipping it before the answer modality changes produces a lab that contradicts the
    product it lives in.
11. **Typeface variation in drills** — genuinely protects speed outside the app and nobody
    does it, but it is a difficulty dimension on candidate 1, and the cost is font
    licensing rather than product.
12. **Speed gate on lab exit** — the most aggressive read of system-first-then-automaticity
    and the worst score on criterion 2 in the entire field; a gate that fires on a bad day
    is how a stranger abandons the path, and it penalises phones harder until F3 is fixed.

Also dropped, without a rank: sitting-size control in settings (a setting is not an
addition, and it answers "I have an hour" by pulling scheduled cards forward, which the
app itself correctly calls harmful); per-jamo confidence model (real, but it is candidate
1's selection logic); warm-up ladder; repair-on-miss burst; wrong-answer capture;
listen-first cards; practice-this-row links from `/reference`; Korean IME setup card;
replacing SM-2 with FSRS; Anki or Lingo Legend export; notifications.

---

# Candidates that are really two additions fused

**The sprint and its item generator.** Candidate 1 is a shell — clock, scoring, round
shape. Deciding *which* blocks appear is separate work: random legal blocks is one
generator, confusable pairs is another, frequency-weighted real text is a third, and
rule-application (written word to spoken form) is a fourth. Random-block sprint is
shippable and much cheaper. Any spec must say which generator it is funding, or the
cheap version will be quoted and the expensive one built.

**Rule-application sprint is not a separate product.** Both researchers proposed it
independently. It is candidate 1 with the fourth generator: same route, same clock, same
gating. It appears here rather than in the top 10 for that reason.

**Candidate 1 and the block deck tier (candidate 2)** share a block generator but are two
additions: one is timed non-scheduled pressure, the other is scheduled retention, and
they live on different surfaces. Do not merge them into "block support."

**Candidate 4 and a `transform` step type.** Lab 07 is only a derivation lab if a step
type exists where the learner *operates* the rule on a written block. Built from `choice`
cards it becomes a quiz about tensification. The step type is reusable infrastructure for
Labs 07 through 10 being paid for out of one lab's budget — allowable as one candidate
under the lab-plus-tier rule, but the spec must own that cost explicitly.

**Candidate 3 fuses three things**, and only two of them belong together: persisting
latency and displaying it against the 2s line are one outcome; making the measurement
length-fair (F3) is a grading correctness fix that the display depends on; deleting the
day-streak counter (F10) is a lock-compliance subtraction that needs no dashboard to
justify it and should not be held hostage to one.

**Candidate 5 fuses content and delivery.** Recording or licensing native audio is one
piece of work; a second codec and a visible failed state is another. They are separated
here only to note that delivery has no independent value while the library is 19
synthesised consonants — it is the second half of one definition of done.

**Candidate 6, the IME setup card, and the romanization-traps lab are a chain, not a
candidate.** The traps lab is the argument, the composition input is the change, the
setup card is the escape hatch for hardware-keyboard users. Shipping the change without
the escape hatch breaks the stranger test.

**Sync, offline install, and Safari storage survival are three products with one
symptom.** Progress disappears. Installing to the Home Screen is both the offline
mechanism and the WebKit eviction exemption, so two of the three share an implementation
while answering different failure modes. Sync is genuinely separate and genuinely more
expensive.

**Sitting-size control and a practice surface are competing answers to one question**, not
two additions. Both exist because a 60-minute sitting runs out of product. If candidate 1
ships, the settings control loses its reason to exist.

---

# Where sync landed, stated plainly

Sync was given no reserved rank and did not earn one. It scores zero on criterion 1,
neutral on 2 and 4, and wins only criterion 3 — where offline install wins much of the
same ground far more cheaply and also fixes iOS storage eviction. Sync remains the right
answer to a real problem; it is not one of the ten changes that would make this the best
script decoder on the market.
