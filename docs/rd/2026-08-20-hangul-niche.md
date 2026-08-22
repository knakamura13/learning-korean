# Hangul-niche R&D — ranked additions

The product is a SvelteKit Hangul labs + SRS trainer, and the win condition is being the best **script decoder** available: any syllable block read cold, sound changes predicted from writing, unfamiliar blocks under ~2 seconds once the rule is unlocked. It is not a full language app, and a full speech trainer is out of scope. The comparison set is How To Study Korean Unit 0, Talk To Me In Korean, LingoDeer, Drops, Duolingo's Hangeul tab, and the dedicated Hangul reading trainers (Batchim, SpeedKorean, Hangul Lab, TenguGo, Hangul Tactica, Korean Graded Readers). Method was O1: a UX Researcher and a Game Designer gathered candidates independently (36 and 40, both fields approved on review), and this document merges those 76 raw candidates into 50 additions, drops the disqualified, scores the remainder on the six rubric items, and ranks a Top 10. **Rank is impact, not a build order.** Merge ids (`A1`–`A50`) are not rank numbers: `A10` is rank 5. The only ordering implied is what rank implies, plus two hard constraints that override rubric position: a phone-only or desk-only win cannot rank at all, and a mill for rule X cannot rank above the lab that teaches rule X. A gated mill may rank above later labs whose rules it does not yet serve.

Score convention for `D/S/P/L/T/C`, all 1–5 integers: **D**ecode/predict automaticity including post-rule speed; **S**tranger can finish the Hangul path without Kyle; **P**arity, where 5 means the outcome lands identically on phone and desktop or repairs an existing gap and 1 means the outcome only exists on one platform (fail gate); **L**abs + retrieval pressure rather than exposition or XP; **T**en-and-sixty, impact across both sitting lengths; **C**ost/complexity where 5 is cheap, used as a tie-break only and never as a veto.

## Top 10

### 1. Syllable blocks in the review deck

- **Outcome:** An arbitrary syllable block, generated from letters the learner has already unlocked, is scheduled for retrieval until it can be read cold.
- **Main surface:** `/review` — a new `block` card kind and tier in `deck.ts`.
- **Why it scores:** Decode 5 — `CardKind` is `consonant | vowel | compound | build | batchim | cluster | pron`, so the 82-card deck retains the parts and never the assembled unit; blocks exist only inside labs, met once and never scheduled again, which means the thing retained is not the thing the win condition measures. Stranger 4 — the Hangul path today finishes able to name jamo, and a learner with nobody to tell them the block gap exists cannot see it; this makes the path end where the win condition is. Parity 4 — same answer control on both devices, no new device-specific interaction. Labs+retrieval 5 — gated to unlocked tiers and generated from `compose()`, so it teaches nothing and is pure retrieval pressure on material Labs 02 and 04 already derived. Ten-and-sixty 5 — blocks fold into the existing ≤10 queue for a short sitting, and it is the first tier with an effectively unbounded item pool for a long one. Cost 4 — the generator, tier gating and answer derivation all exist in domain code, and content authoring is near zero.
- **Beats:** HTSK's combinatorial block grid, which is the same item type on paper and is untimed, unscheduled and ungraded; LingoDeer, Duolingo and Drops, which drill recognition of pre-selected blocks instead of cold production; and it puts the reading trainers' item type (Batchim's Syllable Sprint, SpeedKorean's 받침 tiers) inside a spaced schedule that none of them has.
- **Lock:** 10 — the letters are taught by Labs 01–04 and assembly by the `assemble` steps, so the block is a legal post-rule mill; also 11 (one change, one surface) and 14/1.
- **Not:** not vocabulary — blocks are decoded, not glossed; not a lab, not a new rule, not the timed sprint, not authentic text.
- **Sources:** U1, G15.
- **Score:** `5/4/4/5/5/4`

### 2. Nasalization lab and its tier

- **Outcome:** The learner derives why 입니다 is [임니다] and predicts the change from spelling, with a scored tier behind it.
- **Main surface:** `/lab/[id]` plus its `deck.ts` tier.
- **Why it scores:** Decode 5 — `nasalization` is `scored: false`, and it is the change that most often makes a word the learner can already read unrecognizable by ear, so it moves the predict half of the win condition further than any other single rule. Stranger 4 — a lab is the stranger path by construction (action-cards, no Kyle in the room), and the rule is currently reachable only as prose on `/reference`. Parity 4 — the derivation runs through a composer widget, and `Tray` already supports finger, mouse and arrow-key input at 44px targets. Labs+retrieval 5 — the canonical lock-11 shape: one teaching unit plus its SRS tier, with a rule-application widget instead of the four-option `choice` cards that would make it exposition with a quiz. Ten-and-sixty 4 — one lab is a short sitting on its own, and the tier feeds every later sitting. Cost 3 — the most expensive of the rule labs, because the rule-application widget is absorbed here as the first sound-change lab that needs it.
- **Beats:** TTMIK, which sells nasalization inside a separate paid Korean Pronunciation Guide rather than the Hangeul course; HTSK, which names the rules and defers them to audio clips as "beyond the scope of this lesson"; LingoDeer, Duolingo and Drops, which never model a sound rule at all; Batchim, which drills the six changes but requires you to already read 가/나/다 and derives nothing.
- **Lock:** 8 — action-cards, never an article; also 10 (system first, mill after), 11 (a lab plus its tier is one candidate), 3 (principles teach the mechanism; hearing the model is rank 6 and rank 7).
- **Not:** not tensification, not a listening exercise, not a general phonology engine, not the prediction mill.
- **Sources:** U7 (split), G24, U11 (absorbed).
- **Score:** `5/4/4/5/4/3`

### 3. Tensification lab and its tier

- **Outcome:** The learner derives why 학교 is [학꾜] and predicts tensing after a stop batchim from spelling, with a scored tier behind it.
- **Main surface:** `/lab/[id]` plus its `deck.ts` tier.
- **Why it scores:** Decode 5 — `tensification` is `scored: false`, it fires constantly in ordinary words (학교, 식당, 잡지), and together with nasalization it is what `NOTES.md` calls the pair that most often breaks recognition by ear. Stranger 4 — same lab-as-path argument, and the rule currently exists only as reference prose with a 표준 발음법 citation. Parity 4 — composer-widget derivation, equally operable by thumb and keyboard. Labs+retrieval 5 — one mechanism, one derivation, one tier. Ten-and-sixty 4 — a lab-sized sitting plus a permanent tier. Cost 3 — scored excluding the shared rule-application widget so this lab and rank 2 are priced identically; whichever of the two is built first carries the widget.
- **Beats:** the same set as rank 2, and specifically TTMIK's fortition lessons behind the $16.99/mo subscription, plus Batchim's rule drills, which are iOS-only and pattern-based rather than derived.
- **Lock:** 8, 10, 11.
- **Not:** not nasalization (different mechanism, which is why the backlog's single "tensification + nasalization" line was split), not liaison, not the mill.
- **Sources:** U7 (split), G23.
- **Score:** `5/4/4/5/4/3`

### 4. Timed block sprint

- **Outcome:** A fixed-duration round of generated syllable blocks, scored as correct blocks per minute, turning known letters into automatic decoding through volume.
- **Main surface:** A new `/drill` route.
- **Why it scores:** Decode 5 — the win condition is a speed target and nothing in the product is timed; spaced repetition supplies durability but structurally cannot supply the repetition density automaticity needs. Stranger 3 — usable without Kyle, but it makes a finished path fast rather than making the path finishable. Parity 4 — the round has to score a thumb the same as a hardware keyboard, which makes the answer control load-bearing here more than anywhere else. Labs+retrieval 5 — timers, accuracy and speed are exactly the permitted form of pressure; no XP, no cross-session score, and items are generated only from unlocked jamo so nothing is taught. Ten-and-sixty 5 — a 60-second round is the best short-sitting unit in the field and this is the only surface that can absorb sixty minutes. Cost 3 — new route, item generator, scoring UI. Tied with rank 5 on all six scores; sprint is first because the writing system is already fully taught and the empty long sitting is the sharper hole, while the mill's item pool still grows as later labs land.
- **Beats:** the mechanic the entire reading-trainer category converged on and this app has none of — Batchim's Syllable Sprint with its CPM ladder and sub-0.5s per-syllable target, SpeedKorean's 60-second rounds where decode speed *is* the score, Hangul Tactica's Pair Rush. It would be the first timed decode surface sitting on top of a derived writing system instead of assuming you already read 가/나/다.
- **Lock:** 6 — gamification as retrieval pressure only; also 10 (post-rule, tier-gated) and 4 (session length is not a cap).
- **Not:** not XP, streaks or a leaderboard; not a teaching surface; does not write SRS intervals or due dates; not a replacement for `/review`.
- **Sources:** U2, G4.
- **Score:** `5/3/4/5/5/3`

### 5. Gated sound-change prediction mill

- **Outcome:** Written word in, predicted spoken form out, at volume, for every rule whose lab the learner has finished — including words that fire two rules at once.
- **Main surface:** A `/drill` prediction lane (equivalently, a generated extension of the `pron` tier).
- **Why it scores:** Decode 5 — prediction only becomes automatic with volume, the entire current supply is ten liaison cards, and multi-rule words (밟는다, 옷 한 벌, 읽히다) are where sub-2s prediction is actually built, because rules taught one lab at a time are known in isolation and not in competition. Stranger 3. Parity 4. Labs+retrieval 5 — hard-gated to rules whose lab is unlocked, so it can never be the first place a learner meets a rule. Ten-and-sixty 5 — the clearest long-sitting shape in the field after the sprint. Cost 3. It ranks above the ㅎ and ㄹ labs because lock 10 is per-rule: liaison is already unlocked, and ranks 2–3 unlock the two highest-frequency remaining changes. The mill does not serve ㅎ or ㄹ until those labs exist, which is why those labs still rank as teaching units rather than as a reason to hold the mill down.
- **Beats:** Batchim's Batchim Rules module, which is the same drill on iOS only and without the derivation underneath; and the entire mainstream set, which does not train prediction from spelling at all — TTMIK charges separately for it, HTSK names and defers it, LingoDeer, Drops and Duolingo do not model it.
- **Lock:** 10 — the hard gate is the candidate; also 6 (pressure, not XP) and 4.
- **Not:** not a lab, not a teaching surface, not the reference page; it must never introduce a rule, and the ungated version of it is dropped below.
- **Sources:** G22, U12.
- **Score:** `5/3/4/5/5/3`

### 6. Predict-then-hear reveal

- **Outcome:** The learner commits to a predicted pronunciation and the model of the real spoken form plays immediately on the reveal, so a wrong prediction is corrected by ear rather than only by a bracketed string.
- **Main surface:** `/review` reveal state, backed by whole-word and sound-change clip pairs.
- **Why it scores:** Decode 4 — a prediction the learner never hears confirmed is checked against notation they have never heard; the ear is what makes a correct prediction stable. Held at 4 rather than 5 because the payoff scales with how many prediction tiers exist. Stranger 5 — 19 isolated consonant clips and `consonantAudioSrc()` returns null for everything else, so a learner with no Korean speaker present has no source of truth for spoken forms. Parity 5 — audio is identical on phone and desktop. Labs+retrieval 5 — it fires after commitment and never before, so it cannot leak the answer; it is the mechanic that converts spoken-form clips from assets into practice. Ten-and-sixty 4. Cost 3 — recording or licensing a spoken-form set, plus autoplay-policy handling and silent-switch behaviour on phones. The spoken-form clips are not a second inventory addition: unlike rank 7's letter clips, which attach to cards that already exist, these clips have nothing to attach to until the reveal mechanic exists, so the mechanic and its corpus are one outcome.
- **Beats:** HTSK, whose pronunciation teaching *is* audio but is never a graded prediction; TTMIK's listening-discrimination quizzes, which test the ear and not the prediction from spelling; Batchim, which has audio on every item with no derivation under it; Duolingo, whose Korean audio quality is a standing complaint and which explains nothing about why a block's initial and final ㅈ differ.
- **Lock:** 3 — playback audio may rank, no mic and no speech scoring; also 6 and 14/1.
- **Not:** not dictation (that runs sound → spelling), not mic-scored or self-recorded, not a listening course, not the isolated-letter inventory.
- **Sources:** U13, U15, G36, G37.
- **Score:** `4/5/5/5/4/3`

### 7. Full letter-audio inventory

- **Outcome:** Nothing the deck quizzes is unhearable — vowels, compounds, batchim values and clusters all have a native model, not just the 19 consonant leads.
- **Main surface:** The `audio/` module feeding `PlayButton` on `/review` and `/reference`.
- **Why it scores:** Decode 4 — the vowel system is where an English ear actually fails (ㅓ/ㅗ, ㅡ/ㅜ) and romanization cannot carry the distinction, so this raises decode accuracy, but it is inventory rather than retrieval pressure. Stranger 5 — Labs 02–06 are entirely silent and roughly 63 of 82 cards have no model, so the merger claims the course asserts (ㅐ=ㅔ, ㅙ=ㅚ=ㅞ) must be taken on faith. Parity 5. Labs+retrieval 4 — it plugs into cards that already exist and adds no exposition, but it is an asset set, not a drill. Ten-and-sixty 4. Cost 3 — on the order of sixty recordings.
- **Beats:** the clearest competitive deficit in the whole comparison set. HTSK's clickable consonant × vowel matrix, LingoDeer's human per-letter recordings across three charts, TTMIK's native instructor, Duolingo and Drops all ship full-inventory audio; this app ships 19 clips and a `null`.
- **Lock:** 3 — playback may rank, no mic; also 9 (must work on both, including silent-switch phones) and 14/2.
- **Not:** not sound-change audio (rank 6), not runtime TTS, not a listening course, not pronunciation coaching, not a mic.
- **Sources:** U14, G35.
- **Score:** `4/5/5/4/4/3`

### 8. Hangul composition as the graded answer

- **Outcome:** Where the answer is a sound-bearing form, the learner produces it in Hangul from an in-app composer instead of typing Revised Romanization.
- **Main surface:** The `/review` answer control.
- **Why it scores:** Decode 4 — RR leaks in exactly the places the labs taught as mergers (`x-ae` and `x-e` both accept `e`; `x-wae`, `x-oe` and `x-we` all accept `we`), so three separate compound cards clear on the same two keystrokes, and the anti-inflation mechanic re-inflates where the writing system makes a distinction speech does not. Composition closes the leak and makes production the graded act. Held at 4, not 5, because composing adds motor time inside the measured latency window, which is the defect the cut candidate A16 exists to fix. Stranger 4 — no OS IME required, which was `deck.ts`'s original reason for choosing RR, and `pron` cards already accept Hangul with no way to type it. Parity 5 — `Tray` already handles drag, click and a roving-tabindex arrow-key radiogroup, so this is the one modality that needs no keyboard on either device. Labs+retrieval 5 — it uses the labs' best interaction as the retention mechanic, closing the gap between nine lab step types and one text field. Ten-and-sixty 4. Cost 3.
- **Beats:** LingoDeer's romanization toggle and Duolingo's 2026 per-sentence transliteration, which make RR *more* available rather than removable; Hangul Lab, whose "Romanized Hangul Type" mode is the same typed-RR modality this app uses today; Drops, which avoids text entry by testing recognition instead of production.
- **Lock:** 7 — answer modality is unlocked, explicitly including composition and dropping RR; also 9 and 8 (an in-app composer is not an IME lesson).
- **Not:** not an OS keyboard requirement, not handwriting, not a global romanization ban (that is the cut A28), not a lesson about RR's traps.
- **Sources:** U19, U21, G8, G13.
- **Score:** `4/4/5/5/4/3`

### 9. The ㅎ lab: aspiration and ㅎ-deletion, with its tier

- **Outcome:** The learner predicts what a ㅎ does to its neighbour — 축하 → [추카] — and when it simply vanishes — 좋아요 → [조아요].
- **Main surface:** `/lab/[id]` plus its `deck.ts` tier.
- **Why it scores:** Decode 4 — two of the seven unscored changes in one derivation, and ㅎ is the one letter whose value is entirely contextual; below nasalization and tensification only on how often a beginner meets the affected words. Stranger 4 — this is a named, unpaid debt in the existing course: Lab 06 calls ㅎ-deletion out loud as *not* liaison, and Lab 05's ㄶ/ㅀ cards already assert that "ㅎ leaves the slot but aspirates what follows" with no lab behind it, so a stranger hits a dangling forward reference with nowhere to go. Parity 4. Labs+retrieval 5. Ten-and-sixty 4. Cost 3.
- **Beats:** TTMIK's paid Korean Pronunciation Guide, which is where aspiration lives for that product; HTSK's audio-only deferral; Batchim's underived rule drills; and every course app in the set, none of which touches it.
- **Lock:** 11 — kept deliberately fused because both behaviours are one mechanism seen from two sides (what a ㅎ spends itself on), which is the lock-11 test; also 8 and 10.
- **Not:** not palatalization, not liaison, not the ㅎ-versus-ㅇ batchim inventory question.
- **Sources:** U8, G25.
- **Score:** `4/4/4/5/4/3`

### 10. The ㄹ-assimilation lab: lateralization and ㄹ→ㄴ, with its tier

- **Outcome:** The learner predicts 신라 → [실라] and 대통령 → [대통녕] from the spelling.
- **Main surface:** `/lab/[id]` plus its `deck.ts` tier.
- **Why it scores:** Decode 4 — both are `scored: false`, they are frequent in place names and Sino-Korean compounds, and they are one decision procedure for what happens when ㄹ meets a neighbouring consonant: ㄴ+ㄹ or ㄹ+ㄴ become ㄹㄹ (`lateralization`), and ㄹ after ㅁ/ㅇ/ㄱ/ㅂ becomes ㄴ (`r-to-n`). Splitting them would teach half the contact rule. Stranger 4 — the rule is reference prose today, and names (a stated critical path) trigger it. Parity 4. Labs+retrieval 5. Ten-and-sixty 4. Cost 3. Tied with rank 9 on all six scores; ㅎ ranks first because Labs 05–06 already name it as unpaid debt, and ㄹ is not yet named as a next step in the labs.
- **Beats:** TTMIK, which teaches assimilation twice over inside the paid pronunciation course; HTSK's deferral; Batchim's iOS-only liquid-assimilation drills with no derivation.
- **Lock:** 11 — this is the half of the Game Designer's fused G26 that survives as one addition, split from palatalization because ㄷ/ㅌ + 이 shares no mechanism with ㄴ/ㄹ contact; also 8 and 10.
- **Not:** not palatalization, not ㄹ's initial-versus-final allophony (already a card note), not ㄴ-insertion (which the domain does not model).
- **Sources:** U9, G26 (split).
- **Score:** `4/4/4/5/4/3`

## Next-tier kill list

Deferred, not forbidden. About ten items that almost ranked or are the field's most-expected misses. The rest of the scored field is in the appendix as `cut`.

- **K1 Loanword decode mill** (A11, G21) — ties the ㅎ lab on all six scores and loses on substance: more volume on already-decodable text is worth less than a new predictive rule, and it needs rank 4's drill surface first.
- **K2 Production widgets in place of lab choice steps** (A12, G31) — 30 of 93 lab steps still grade on four-option recognition, which `deck.ts` rejected by name; rewriting six labs is the most invasive change in the field for equal decode impact.
- **K3 Practice after the queue is clear** (A13, U4, G33) — discharges lock 4 exactly, but it is a doorway onto ranks 4 and 5, not a skill.
- **K4 Lapse-targeted drill** (A14, U34, G5) — cheapest real retrieval win (`weakest()` exists and is called from nowhere); loses because it re-serves material the scheduler already brings round.
- **K5 Decode-target verdict on the card** (A15, U5, G1) — makes speed visible where the strip currently shows a banned day streak, but it reports rather than trains.
- **K6 Modality-fair decode clock** (A16, U6, G3) — a genuine parity defect inside grading (`startedAt` before focus; 3.5s/9s applied to thumbs and hardware keyboards alike); loses as a correction rather than an addition, and should be fixed regardless of rank.
- **K7 Real-text decode mill, gated** (A19, U30, G18) — the honest test of decoding; loses on cost and on needing a filter to unlocked letters *and* unlocked rules, without which it is disqualified.
- **K8 Accounts and cross-device sync** (A20, U27, G38) — parity 5 and the seam already exists, but decode impact is indirect. Lock 5 gives it no reserved rank; deferred on rubric 1, not on cost.
- **K9 First-run orientation as action-cards** (A22, U23, G40) — strongest stranger-completion item in the field (S=5) and near-zero on the win condition (D=2).
- **K10 Palatalization lab and tier** (A32, U10, G26a) — remaining unscored sound change; thinnest rule lab (narrow environment, lower beginner frequency than ㅎ or ㄹ).

## Fused candidates split or merged

- **U7 "tensification + nasalization" lab — split** into ranks 2 and 3. Two mechanisms (assimilation to a following nasal versus tensing after a stop) are two additions under lock 11, which is also how the Game Designer gathered them (G23, G24). `NOTES.md` pairs them; that is backlog formatting, not one outcome.
- **G26 "palatalization + ㄹ assimilation" lab — split** as required. ㄷ/ㅌ + 이 and ㄴ/ㄹ contact share no mechanism. ㄹ assimilation became rank 10; palatalization became A32 on the kill list as the thinnest of the rule labs.
- **U11 rule-application composer widget — absorbed, not ranked.** It has no learner outcome on its own and is the mechanism that keeps the rule labs from degrading into `choice` cards. It is folded into rank 2 as the first sound-change lab that needs it, and its cost is carried there. Ranks 2 and 3 are both priced at C=3 so the widget's placement does not decide their order.
- **U8 / G25 aspiration + ㅎ-deletion — kept fused** as rank 9. One derivation seen from two sides; splitting it would teach half of what a ㅎ does.
- **U9 / G26b lateralization + ㄹ→ㄴ — kept fused** as rank 10. One decision procedure for ㄹ meeting a neighbouring consonant.
- **U13 + U15 + G36 + G37 — merged** as rank 6. U15/G36 were the asset set, U13 the card mechanic, G37 the auto-play. Rank 7's letter clips attach to cards that already exist; these spoken-form clips have nothing to attach to until the reveal mechanic exists, so mechanic and corpus are one outcome.
- **U14 + G35 — merged** as rank 7. Same outcome (complete the audible inventory), same surface. Ranked separately from rank 6 because the clips attach to existing cards and need no new mechanic.
- **U19 + U21 + G8 + G13 — merged** as rank 8. G13 (Hangul-only `pron` answers) is the minimal scope of the same change rather than a second addition; U21's block composition is the same composer used as an answer widget.
- **U20 romanization-off mode — kept separate** (A28, cut). Different surface (a settings toggle propagating to `/review` and `/reference`) and it is unusable before rank 8 lands.
- **U1 + G15 — merged** as rank 1, and deliberately **not** merged with rank 4. Merging the block tier with the sprint would write sprint answers into the SRS curve and corrupt the interval data.
- **U2 + G4 — merged** as rank 4. Both are the same fixed-duration block round on a new drill surface.
- **U12 + G22 — merged** as rank 5. Rule-collision items are the top of the same gated ladder, not a separate mill; the merged outcome is "predict the spoken form at volume for unlocked rules." The mill ranks above the ㅎ and ㄹ labs because lock 10 is per-rule, not "all remaining labs first."
- **U4 + G33 — merged** as A13, and kept separate from A33 (sitting-length selector). One resizes the *scheduled* queue; the other adds an *unscheduled* surface after it empties.
- **U3 + G34 — merged** as A37 (per-letter speed and weakness map), absorbing both the session-trend readout and the retirement of the live day-streak tile. This is the loosest merge in the document: two surfaces were proposed (the `/review` stats strip and the dashboard) and one addition can only have one.
- **U5 + G1 — merged** as A15; **U6 + G3 — merged** as A16; **G2 kept separate** as A26. Three changes to one mechanic with three outcomes: report the speed, measure the right window, calibrate the threshold.
- **U33 + G7 — merged** as A29 (miss diagnosis names the confusion).
- **U34 + G5 — merged** as A14, and kept separate from A18: one selects from this learner's SRS history, the other from the writing system's structural confusions.
- **U17 + G10 — merged** as A36 (dictation); **U22 + G14 — merged** as A46 (IME setup card); **U23 + G40 — merged** as A22 (first-run action-cards, with G40's minimal single-action form as its floor).
- **U27 + G38 — merged** as A20, with U28 (A45, account-free handoff) and U29 (A49, merge on restore) kept separate as cheaper substitutes in the same family rather than folded in.
- **U30 + G18 — merged** as A19; **G19 kept separate** as A27. Single-item decode speed and sustained passage reading are different outcomes that compete rather than combine.
- **U31 names lab and G20 names mill — kept separate** (A40, A17). A teaching unit and a mill are not the same addition, and U31's scope stays at reading and pronouncing names — `NOTES.md`'s "how Korean addresses people" bundle is not restored.

## Dropped without scoring

- Mic-scored pronunciation, speech scoring, and any AI pronunciation tutor (Lingrow-style) — locks 3 and 12.
- Listen-and-repeat with recorded self-comparison — a mic feature in costume; locks 3 and 12.
- XP, levels, gems, loot, cosmetics, streaks, leaderboards, daily goals, reminder nags — locks 6 and 12. Retiring the day-streak tile that ships today is a removal riding on A37, not an addition.
- Native iOS or Android app, and an Apple Watch companion — lock 9. PWA/install stays eligible as A21.
- Hangul tutorial articles, a prose "how Hangul works" primer, or a written first-run explainer — lock 8, which is a veto including first-run.
- A stroke-order or handwriting-tracing *product* — lock 12 and the win condition. The single handwriting lab is a different scope and is scored as A50.
- Growth, social, sharing, referral, public profiles — lock 12.
- Grammar, particles, conjugation, vocabulary-as-goal, TOPIK prep, conversation, translation — lock 1.
- A time-gated free tier or Drops-style 5-minute cap — a monetization mechanic that also contradicts lock 4.
- Mnemonic-image letter systems ("ㅂ is a bucket") — not a listed disqualifier but a positioning reversal against the derivation teaching this app is built on, and it would teach a second, weaker rule for the same 19 consonants.
- A romanization-first drill ladder — deepens the RR ceiling instead of escaping it.
- **Ungated sound-change mill** — any prediction mill spanning rules whose labs do not exist teaches the rule. Illegal under lock 10; only the gated form (rank 5) is scored.
- **Unfiltered authentic-text mill** — real text does not respect tier boundaries, so a menu item carrying tensification or a name carrying liquid assimilation teaches by exposure. Illegal under lock 10; only the forms filtered to unlocked letters *and* unlocked rules (A19, A27, A17, A11) are scored.

## Appendix: scored field

All 50 merged candidates. `D S P L T C` as defined at the top; Parity 1 is a fail gate.

| id | title | D | S | P | L | T | C | rank-or-cut | aliases |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A1 | Syllable blocks in the review deck | 5 | 4 | 4 | 5 | 5 | 4 | rank 1 | U1, G15 |
| A2 | Nasalization lab and tier | 5 | 4 | 4 | 5 | 4 | 3 | rank 2 | U7, G24, U11 |
| A3 | Tensification lab and tier | 5 | 4 | 4 | 5 | 4 | 3 | rank 3 | U7, G23 |
| A4 | Timed block sprint | 5 | 3 | 4 | 5 | 5 | 3 | rank 4 | U2, G4 |
| A5 | Predict-then-hear reveal | 4 | 5 | 5 | 5 | 4 | 3 | rank 6 | U13, U15, G36, G37 |
| A6 | Full letter-audio inventory | 4 | 5 | 5 | 4 | 4 | 3 | rank 7 | U14, G35 |
| A7 | Hangul composition as the graded answer | 4 | 4 | 5 | 5 | 4 | 3 | rank 8 | U19, U21, G8, G13 |
| A8 | ㅎ lab: aspiration and ㅎ-deletion, and tier | 4 | 4 | 4 | 5 | 4 | 3 | rank 9 | U8, G25 |
| A9 | ㄹ-assimilation lab and tier | 4 | 4 | 4 | 5 | 4 | 3 | rank 10 | U9, G26b |
| A10 | Gated sound-change prediction mill | 5 | 3 | 4 | 5 | 5 | 3 | rank 5 | G22, U12 |
| A11 | Loanword decode mill | 4 | 4 | 4 | 5 | 4 | 3 | kill list | G21 |
| A12 | Production widgets in place of lab choice steps | 4 | 4 | 4 | 5 | 4 | 2 | kill list | G31 |
| A13 | Practice after the queue is clear | 4 | 3 | 5 | 5 | 5 | 4 | kill list | U4, G33 |
| A14 | Lapse-targeted drill | 4 | 3 | 5 | 5 | 4 | 5 | kill list | U34, G5 |
| A15 | Decode-target verdict on the card | 4 | 3 | 5 | 5 | 4 | 5 | kill list | U5, G1 |
| A16 | Modality-fair decode clock | 4 | 3 | 5 | 4 | 4 | 4 | kill list | U6, G3 |
| A17 | Korean names mill | 4 | 3 | 4 | 5 | 4 | 3 | cut | G20 |
| A18 | Minimal-pair contrast drill | 4 | 3 | 4 | 5 | 4 | 4 | cut | G16 |
| A19 | Real-text decode mill (gated) | 4 | 3 | 4 | 4 | 5 | 2 | kill list | U30, G18 |
| A20 | Accounts and cross-device sync | 3 | 3 | 5 | 3 | 3 | 1 | kill list | U27, G38 |
| A21 | Offline-capable install | 3 | 4 | 5 | 3 | 4 | 3 | cut | U18, G39 |
| A22 | First-run orientation as action-cards | 2 | 5 | 4 | 4 | 3 | 4 | kill list | U23, G40 |
| A23 | Cold placement check | 3 | 5 | 4 | 3 | 3 | 3 | cut | U24 |
| A24 | Timed cold-read step in labs | 4 | 3 | 4 | 5 | 3 | 5 | cut | G30 |
| A25 | Countdown pressure mode | 4 | 2 | 4 | 5 | 3 | 4 | cut | G6 |
| A26 | Grade thresholds recalibrated to the decode target | 4 | 2 | 4 | 4 | 3 | 5 | cut | G2 |
| A27 | Connected-text passage reading | 4 | 3 | 3 | 4 | 4 | 2 | cut | G19 |
| A28 | Romanization-off mode | 4 | 3 | 4 | 3 | 3 | 4 | cut | U20 |
| A29 | Miss diagnosis in review | 3 | 4 | 5 | 4 | 4 | 4 | cut | U33, G7 |
| A30 | One-handed phone review | 3 | 4 | 5 | 4 | 4 | 5 | cut | U36 |
| A31 | Retrieval warm-up at the head of each lab | 3 | 3 | 5 | 5 | 4 | 5 | cut | G29 |
| A32 | Palatalization lab and tier | 3 | 4 | 4 | 5 | 3 | 4 | kill list | U10, G26a |
| A33 | Sitting-length selector | 3 | 3 | 5 | 4 | 4 | 5 | cut | G32 |
| A34 | Plain / aspirated / tense ear check | 3 | 4 | 4 | 4 | 3 | 3 | cut | U16 |
| A35 | Paste-your-own-text decoder | 3 | 4 | 5 | 3 | 4 | 3 | cut | U32 |
| A36 | Dictation cards (sound → spelling) | 3 | 3 | 4 | 4 | 4 | 3 | cut | U17, G10 |
| A37 | Per-letter speed and weakness map | 3 | 3 | 4 | 3 | 4 | 4 | cut | U3, G34 |
| A38 | Romanization-traps lab | 3 | 3 | 4 | 4 | 3 | 4 | cut | G27 |
| A39 | On-screen romanization keypad | 3 | 3 | 4 | 3 | 3 | 4 | cut | G9 |
| A40 | Korean names lab and tier | 3 | 3 | 4 | 4 | 3 | 3 | cut | U31 |
| A41 | Contrast-aware queue interleaving | 3 | 2 | 5 | 4 | 3 | 5 | cut | G17 |
| A42 | Reference lookup without leaving the sitting | 2 | 4 | 5 | 2 | 3 | 4 | cut | U35 |
| A43 | Sound-first choice cards (see block, pick clip) | 2 | 3 | 4 | 2 | 3 | 4 | cut | G12 |
| A44 | One next-action card | 2 | 3 | 4 | 2 | 3 | 5 | cut | U26 |
| A45 | Account-free device handoff | 2 | 3 | 5 | 2 | 2 | 4 | cut | U28 |
| A46 | Korean IME setup card | 2 | 4 | 3 | 2 | 2 | 5 | cut | U22, G14 |
| A47 | Say-then-compare cards | 2 | 2 | 4 | 2 | 3 | 4 | cut | G11 |
| A48 | Durability disclosed at first run | 1 | 4 | 4 | 2 | 2 | 5 | cut | U25 |
| A49 | Merge on restore instead of overwrite | 1 | 3 | 4 | 2 | 2 | 4 | cut | U29 |
| A50 | Handwriting lab | 1 | 2 | 1 | 3 | 2 | 2 | cut — parity 1 | G28 |

## Self-review

**Rankings I am uneasy about.**

- **Ranks 2 and 3 are a genuine tie.** Nasalization and tensification score identically on all six items. Nasalization is first because it more often makes a word the learner can already read unrecognizable by ear, and because it fires in every polite form they will be shown. That is a substantive argument, not a rubric one. Both are priced at C=3 so the shared rule-application widget does not decide their order.
- **Rank 5 (gated mill) used to sit tenth.** The first merge pass treated lock 10 as "no mill above any remaining rule lab." That over-applies the lock. The mill is per-rule: liaison is already unlocked, and ranks 2–3 unlock the two highest-frequency remaining changes. Holding it below ㅎ and ㄹ labs would have been an impact error. The mill still cannot mill ㅎ or ㄹ until those labs exist.
- **Rank 8 (Hangul composition) is the entry I trust least.** Composing adds motor time inside the same measured latency window that A16 exists to repair, so if A16 never lands, rank 8 could make the graded clock *worse* on a phone even while it makes the answer honest. It is also the merge most likely to be two additions: "compose the answer in-app" and "stop accepting romanization for the `pron` tier" (G13) could reasonably be specced as separate pieces of work.
- **Rank 6's merge is mechanic plus corpus.** Letter clips (rank 7) attach to cards that already exist; spoken-form clips have nothing to attach to until the reveal exists. A split would still be defensible; the scores would then have to be re-run.
- **Rank 1's decode score is partly contingent on rank 8.** If block cards are answered in typed Revised Romanization, the tier measures Hangul → RR rather than Hangul → sound, which is the leak rank 8 exists to close. A1 is scored at 5 on the structural gap (zero block cards against a block-level win condition) rather than on the modality it lands with.
- **A37 is the loosest merge in the document.** U3 proposed the `/review` stats strip and G34 the dashboard; they were merged into one diagnostic addition. It was cut anyway, so nothing in the Top 10 rests on it.
- **Sync sitting at A20 will read as wrong** to anyone holding lock 5's "intended soon." It has no reserved rank, it passes the parity gate at 5, and it loses on rubric 1 and rubric 4. Its C=1 did not decide anything; cost was tie-break only.
- **Four mills share one missing host.** A11, A17, A18 and A19 all need rank 4's drill surface. Rank 4 and rank 5 are the Top-10 entries that serve a long sitting with unbounded material.

**Comparison claims I did not re-verify.** I performed no independent competitive research; every "Beats" line inherits the two gatherers' confidence, and both disclosed limits. Specifically unverified from primary sources: TTMIK's paid course interiors (table of contents verified, lessons not seen), HTSK's *Pronunciation Tips* lesson (inferred from the Unit 0 index and PDF), SpeedKorean's sprint interior and per-letter map (search snapshot only), Batchim's grading behaviour and its CPM ladder / sub-0.5s target (marketing, blog and App Store copy; app not installed), Duolingo's July 2026 Hangeul tab (existence verified, contents inferred from reviews), Drops' current Hangul coverage, and Hangul Tactica's "Pair Rush" naming. The Batchim speed figures and SpeedKorean's rounds are the load-bearing claims for rank 4, and Batchim's rule module is load-bearing for ranks 2, 3, 5, 9 and 10. In-repo claims are a different matter: I re-confirmed the seven `scored: false` sound changes, `CardKind` containing no block kind, the live day-streak tile on `/review`, and `FAST_MS`/`STEADY_MS`/`DEFAULT_NEW_PER_DAY`/`DEFAULT_REVIEW_PER_SITTING` directly. I used the corrected deck arithmetic from the Task 1 review (82 cards = 72 jamo + 10 `pron`), not the report's "72."

**Candidates that still feel like two additions.** Rank 8 (composer input versus dropping RR for `pron`), rank 6 (reveal mechanic versus spoken-form corpus), and A19 (a corpus plus a mill that consumes it). Rank 9 and rank 10 are fused on purpose: the ㅎ pair is what a ㅎ spends itself on, and the ㄹ pair is one contact rule discriminated by which neighbouring consonant.

**One thing the rubric arguably underrates.** A35, the paste-your-own-text decoder, is the mission's literal sentence and the only candidate in the field that no comparison product could answer, because every one of them only serves its own content. It scored 3 on decode and 3 on labs+retrieval because a tool that shows the predicted pronunciation does the retrieval *for* the learner. I stand by the score under this rubric and note that a rubric weighted toward "useful the moment a Korean message arrives" would rank it far higher.
