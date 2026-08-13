# The writing system is fully covered — the curriculum now pivots to sound

With Lab 05 built, all five structural labs exist and all 72 deck cards are reachable:
consonants, basic vowels, compound vowels, batchim, and clusters. Nothing further gets
*added to the page*. Every remaining lesson is about what happens to those letters when
they meet each other in speech.

This is a real hinge in the curriculum, and it changes what a lesson looks like.

## Implications

- **Card shape has to change.** Every deck card so far is *letter → sound*. Sound-change
  cards are *written word → spoken form* (한국어 → [한구거]), which is rule application,
  not recall of a symbol. `deck.js` will need a new card kind and a new tier
  (`lab06`+); do not try to force these into the existing letter tiers.
- **Liaison first.** Of the eight sound changes, 연음 does the most work: it is the main
  reason a word Kyle can read correctly still sounds unfamiliar. It also pays off the
  aside in Lab 04 about spelling preserving a word's identity — the "real" ㅌ in 밭
  reappears when a vowel follows.
- **The composer pattern generalises.** Four labs now use build-it-yourself widgets
  (`vowel`, `fusion`, `assemble`+finals, `cluster`). A sound-change lab wants the same
  treatment — likely a widget that shows a written word and lets the learner apply a
  rule to produce the spoken form, rather than a multiple-choice card.
- **Honest difficulty is landing.** Lab 05 states outright that Rule A vs Rule B is a
  memorised list with no derivable pattern, and points at the SRS deck as the reason
  that is fine. Keep that register — do not manufacture false structure to make
  material feel tidier than it is.

## Not yet evidence of learning

This records that the *material* is complete, not that Kyle has mastered it. As of
writing he was still working through Lab 01. Actual mastery signal should come from
the review deck (`SRS.weakest()` surfaces the cards with the most lapses) — consult it
before designing the next lab rather than guessing at weak points.
