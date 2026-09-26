## 2025-05-18 - Single-Pass HTML Scanner for Hangul Wrapping
**Learning:** `withLangKo` in `src/lib/a11y/lang.ts` previously re-scanned the entire HTML string from index 0 on every Hangul match using a secondary regex loop to calculate `langKoDepth(before)`. For HTML containing multiple tags and Hangul runs (such as all authored lab copy), this resulted in O(N²) regex execution overhead during lab copy sanitization.
**Action:** Use a single-pass tokenizing regex matching tags and Hangul runs in sequence while maintaining a running open-tag depth state, eliminating quadratic string slicing and regex instantiation.

## 2025-05-18 - O(1) Deck Indexing, Set Unlocked Checks, and Pre-calculated Base Shapes
**Learning:** `cardsOfTier` filtered the entire review deck (300+ cards) linearly on every call, `tierReviewProgress` re-filtered the entire deck for every tier ($M \times N$ array scans), and `pool()` scanned `state.unlocked` arrays per card. Furthermore, answer normalization instantiated regex objects on every answer check.
**Action:** Precompute a `CARDS_BY_TIER` index on deck initialization for O(1) tier lookups, index cards by tier in a single $O(N)$ pass in `tierReviewProgress`, use $O(1)$ Set lookups for `state.unlocked`, and hoist normalization regular expressions to module constants.
