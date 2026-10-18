## 2025-05-18 - Single-Pass HTML Scanner for Hangul Wrapping
**Learning:** `withLangKo` in `src/lib/a11y/lang.ts` previously re-scanned the entire HTML string from index 0 on every Hangul match using a secondary regex loop to calculate `langKoDepth(before)`. For HTML containing multiple tags and Hangul runs (such as all authored lab copy), this resulted in O(N²) regex execution overhead during lab copy sanitization.
**Action:** Use a single-pass tokenizing regex matching tags and Hangul runs in sequence while maintaining a running open-tag depth state, eliminating quadratic string slicing and regex instantiation.

## 2025-05-19 - Safe Pure Function Memoization for Syllable Processing and Tier Cards
**Learning:** Returning cached array references directly in memoized pure functions (such as `sprintInventory` and `cardsOfTier`) can leak mutable internal references and risk accidental cache corruption if callers mutate the array. Shallow copying cached arrays (`.slice()`) and using `Map` for cache stores eliminates redundant 11,000+ iteration loops and linear array scans while preserving caller isolation.
**Action:** Always return a `.slice()` copy when returning memoized array results, and use `Map` instead of standard objects for cache stores.
