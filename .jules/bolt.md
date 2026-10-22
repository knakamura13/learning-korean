## 2025-05-18 - Single-Pass HTML Scanner for Hangul Wrapping
**Learning:** `withLangKo` in `src/lib/a11y/lang.ts` previously re-scanned the entire HTML string from index 0 on every Hangul match using a secondary regex loop to calculate `langKoDepth(before)`. For HTML containing multiple tags and Hangul runs (such as all authored lab copy), this resulted in O(N²) regex execution overhead during lab copy sanitization.
**Action:** Use a single-pass tokenizing regex matching tags and Hangul runs in sequence while maintaining a running open-tag depth state, eliminating quadratic string slicing and regex instantiation.

## 2025-05-19 - Pre-grouped Domain Lookups & O(1) Set Unlock Checks
**Learning:** `cardsOfTier`, `wordsOfPack`, `tierReviewProgress`, and `pool` were re-filtering static domain collections (`DECK` and `WORDS`) on every access, and `tierReviewProgress` performed nested O(T × N) array filtering across SRS tiers.
**Action:** Pre-group static domain datasets (`CARDS_BY_TIER` and `WORDS_BY_PACK`) at module initialization for O(1) lookups, memoize `romanizeSyllable`, and use single-pass Map grouping with Set lookups in SRS calculations.
