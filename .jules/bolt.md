## 2025-05-18 - Map Index Lookups for Card Tiers and Vocabulary Packs
**Learning:** `tierReviewProgress`, `cardsOfTier`, and `wordsOfPack` performed repeated linear array scans (`.filter()`) on full deck and vocabulary lists every time progress stats or cards of a tier/pack were queried. In progress store reactive getters iterating through all tiers, this resulted in O(N * M) filtering passes.
**Action:** Pre-index static dataset exports (`DECK`, `WORDS`) into `Map` tables and perform a single-pass grouping pass in `tierReviewProgress`, reducing lookup complexity to O(1) / O(N + M).

## 2025-05-18 - Single-Pass HTML Scanner for Hangul Wrapping
**Learning:** `withLangKo` in `src/lib/a11y/lang.ts` previously re-scanned the entire HTML string from index 0 on every Hangul match using a secondary regex loop to calculate `langKoDepth(before)`. For HTML containing multiple tags and Hangul runs (such as all authored lab copy), this resulted in O(N²) regex execution overhead during lab copy sanitization.
**Action:** Use a single-pass tokenizing regex matching tags and Hangul runs in sequence while maintaining a running open-tag depth state, eliminating quadratic string slicing and regex instantiation.
