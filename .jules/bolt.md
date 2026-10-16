## 2025-05-18 - Single-Pass HTML Scanner for Hangul Wrapping
**Learning:** `withLangKo` in `src/lib/a11y/lang.ts` previously re-scanned the entire HTML string from index 0 on every Hangul match using a secondary regex loop to calculate `langKoDepth(before)`. For HTML containing multiple tags and Hangul runs (such as all authored lab copy), this resulted in O(N²) regex execution overhead during lab copy sanitization.
**Action:** Use a single-pass tokenizing regex matching tags and Hangul runs in sequence while maintaining a running open-tag depth state, eliminating quadratic string slicing and regex instantiation.

## 2025-05-19 - Pre-grouped Deck Tiers & Hash-based Scheduling Queries
**Learning:** Calling `cardsOfTier(tier)` and `tierReviewProgress()` repeatedly scanned the full review deck array ($O(N)$ filter per call). Additionally, `pool()` checked `state.unlocked` with `Array.prototype.includes()` per card ($O(N \cdot U)$). For 1,000+ cards and frequent reactive re-computations in Svelte stores, this generated unnecessary array iteration overhead.
**Action:** Pre-group cards by tier at module init (`CARDS_BY_TIER`) for $O(1)$ lookup in `cardsOfTier()`, group deck cards in a single $O(N)$ pass in `tierReviewProgress()`, and use a `Set` for $O(1)$ tier checks in `pool()`.
