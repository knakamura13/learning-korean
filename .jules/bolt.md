## 2025-05-18 - Pre-grouped Deck Tier Lookups & O(N) Tier Progress Grouping
**Learning:** `cardsOfTier` filtered `DECK` ($O(N)$) on every call, and `tierReviewProgress` ran `deck.filter()` $M$ times for $M$ tiers ($O(M \times N)$). Pre-grouping `DECK` into `CARDS_BY_TIER` at module initialization reduced `cardsOfTier` to an $O(1)$ lookup (~25x speedup in benchmarks). Grouping `deck` cards by tier in a single pass $O(N)$ inside `tierReviewProgress` reduced execution time by 21%.
**Action:** When mapping or calculating progress across fixed categories/tiers, pre-group items in a single pass into a Map or Record rather than running repeated `.filter()` scans over the full array.

## 2025-05-18 - Single-Pass HTML Scanner for Hangul Wrapping
**Learning:** `withLangKo` in `src/lib/a11y/lang.ts` previously re-scanned the entire HTML string from index 0 on every Hangul match using a secondary regex loop to calculate `langKoDepth(before)`. For HTML containing multiple tags and Hangul runs (such as all authored lab copy), this resulted in O(N²) regex execution overhead during lab copy sanitization.
**Action:** Use a single-pass tokenizing regex matching tags and Hangul runs in sequence while maintaining a running open-tag depth state, eliminating quadratic string slicing and regex instantiation.
