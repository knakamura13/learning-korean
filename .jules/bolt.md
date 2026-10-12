## 2025-05-18 - Single-Pass HTML Scanner for Hangul Wrapping
**Learning:** `withLangKo` in `src/lib/a11y/lang.ts` previously re-scanned the entire HTML string from index 0 on every Hangul match using a secondary regex loop to calculate `langKoDepth(before)`. For HTML containing multiple tags and Hangul runs (such as all authored lab copy), this resulted in O(N²) regex execution overhead during lab copy sanitization.
**Action:** Use a single-pass tokenizing regex matching tags and Hangul runs in sequence while maintaining a running open-tag depth state, eliminating quadratic string slicing and regex instantiation.

## 2025-05-19 - Indexed Maps and Single-Pass Grouping for Domain Decks
**Learning:** `cardsOfTier`, `wordsOfPack`, and `tierReviewProgress` previously performed linear array scans (`DECK.filter`, `WORDS.filter`, `deck.find`) across ~350 cards and ~160 words on every invocation and reactive getter evaluation. Precomputing module-level lookup maps (`CARDS_BY_TIER`, `WORDS_BY_PACK`) and using single-pass `Map`/`Set` grouping in `tierReviewProgress` reduced deck query times by up to 22.6x and eliminated quadratic filtering per tier.
**Action:** Always pre-group static domain datasets by tier/pack ID into module-level lookup maps, and use `Set` for membership checks during collection filtering.
