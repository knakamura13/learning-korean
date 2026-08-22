# Ubiquitous Language

Product and learning-system vocabulary. Korean script terms live in `GLOSSARY.md` and are
not repeated here; this file covers the words we use to talk about the app itself.

## Teaching path

| Term            | Definition                                                                                  | Aliases to avoid                     |
| --------------- | ------------------------------------------------------------------------------------------- | ------------------------------------ |
| **Lab**         | A single-sitting teaching unit that makes the learner derive one rule                        | Lesson, module, chapter, course unit |
| **Action card** | One screen inside a lab that demands an action, where explanation appears only as feedback   | Card, slide, exercise, question      |
| **Step type**   | The interaction kind an action card uses — `mouth`, `choice`, `assemble`, `liaison`, `read`  | Widget, component, activity          |
| **Derive**      | Reaching a rule by acting on material rather than being told it                              | Discover, explore, learn             |
| **Reference**   | The scannable prose-and-table surface, exempt from the action-card rule                      | Docs, guide, notes, cheat sheet      |

## Retention system

| Term          | Definition                                                                        | Aliases to avoid                        |
| ------------- | --------------------------------------------------------------------------------- | --------------------------------------- |
| **Deck card** | One scheduled item in spaced repetition, with a front, accepted answers, and state | Card, flashcard, question               |
| **Tier**      | The group of deck cards a specific lab releases into rotation                      | Level, stage, group, unit               |
| **Review**    | The scheduled spaced-repetition surface, where the SM-2 interval is authoritative  | Practice, drill, quiz, study            |
| **Grade**     | The scheduling verdict derived from correctness plus latency, never self-rated     | Score, rating, difficulty               |
| **Unlock**    | Releasing a tier into the deck, which only lab completion does today               | Open, enable, complete                  |
| **Open**      | Granting access to a lab, which skip-ahead does without unlocking its tier         | Unlock, start                           |

## Retrieval pressure

| Term                   | Definition                                                                             | Aliases to avoid                          |
| ---------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------- |
| **Retrieval pressure** | Timers, accuracy, and speed targets applied to material the learner has already met     | Gamification, engagement, challenge       |
| **Automaticity**       | Decoding fast enough that working memory is free for meaning — the ~2-second target     | Fluency, mastery, proficiency             |
| **Decode**             | Reading a written block and producing its sound                                         | Read, recognize, translate                |
| **Predict**            | Deriving how a written word will sound after the sound changes apply                    | Pronounce, sound out                      |
| **Mill**               | A non-scheduled timed drill that runs only after the rule is known and teaches nothing  | Drill, practice, game, grind              |
| **Sitting**            | One continuous stretch of use, between about 10 and 60 minutes                          | Session, lesson, day, streak              |

## R&D process

| Term                | Definition                                                                              | Aliases to avoid                    |
| ------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------- |
| **Addition**        | One product change with one outcome and one main surface, spec-able as a single piece    | Feature, improvement, enhancement   |
| **Lock**            | A constraint that a candidate must satisfy rather than argue with                        | Requirement, rule, guideline        |
| **Comparison set**  | The named products this app must beat as a script decoder                                | Competitors, market, alternatives   |
| **Stranger**        | A learner who must finish the Hangul path with no access to Kyle                         | User, beginner, new user            |
| **Surface**         | The route or component an addition mainly lives on                                       | Screen, page, place, area           |

## Relationships

- A **Lab** contains many **Action cards** and unlocks exactly one **Tier**
- A **Tier** contains many **Deck cards**; a **Deck card** belongs to exactly one **Tier**
- **Review** schedules **Deck cards**; a **Mill** generates its own items and schedules none
- A **Mill** may run only after the **Lab** that derives its rule is complete
- One **Sitting** may contain several **Labs**, one **Review** queue, and any number of
  **Mill** rounds
- An **Addition** targets one **Surface** and is measured against every **Lock**

## Example dialogue

> **Dev:** "If the sprint is a mill, can it introduce blocks the learner has not met?"

> **Domain expert:** "No. A mill may not teach a rule. It generates from the tiers that are
> already unlocked, so every block in it is made of jamo some lab already derived."

> **Dev:** "Then a stranger who skips ahead gets an empty sprint, because skip-ahead opens
> the lab without unlocking the tier?"

> **Domain expert:** "Right, and that is the bug. Open and unlock are two different things
> today — you can open Lab 05 and still have nothing in Review."

> **Dev:** "So the placement drill is retrieval pressure used as a gate, not a lab."

> **Domain expert:** "Exactly. It demands an action and unlocks tiers on the result. It
> derives nothing, so it is not a lab, and it schedules nothing, so it is not Review."

## Flagged ambiguities

- **"card"** is used for three unrelated things: an **Action card** inside a lab, a
  **Deck card** in spaced repetition, and the bordered box used as a layout element. Say
  which one every time. The third is presentation and has no place in domain conversation.
- **"session"** has been used for both a **Sitting** (a stretch of use) and the persisted
  per-lab resume state. Use **Sitting** for the human-facing span; reserve "session" for
  the stored lab position.
- **"unlock"** and **"open"** are distinct operations that have been used interchangeably.
  **Open** grants lab access; **Unlock** releases a tier into the deck. Their conflation is
  a live gap in the product, not just a naming problem.
- **"gamification"** is overloaded to the point of being useless. In this workspace it
  means **Retrieval pressure** and nothing else. XP, streaks, leaderboards and loot are
  disqualified, so the word should not be reached for at all.
- **"fast"** currently means two different numbers: the grading threshold of 3.5 seconds
  and the mission target of about 2 seconds. Never say "fast" without saying which.
- **"streak"** today means consecutive days with a review, which is a habit counter. If we
  ever want consecutive correct answers under pressure, that is a different word — it is
  not a **Streak**, and reusing the term would hide the fact that one is disqualified.
- **"drill"** has been used for **Review**, for a **Mill**, and for any exercise at all.
  **Review** is scheduled and authoritative; a **Mill** is timed and schedules nothing.
