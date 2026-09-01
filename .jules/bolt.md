## 2025-05-18 - Single-Pass HTML Scanner for Hangul Wrapping
**Learning:** `withLangKo` in `src/lib/a11y/lang.ts` previously re-scanned the entire HTML string from index 0 on every Hangul match using a secondary regex loop to calculate `langKoDepth(before)`. For HTML containing multiple tags and Hangul runs (such as all authored lab copy), this resulted in O(N²) regex execution overhead during lab copy sanitization.
**Action:** Use a single-pass tokenizing regex matching tags and Hangul runs in sequence while maintaining a running open-tag depth state, eliminating quadratic string slicing and regex instantiation.

## 2025-05-18 - Pre-Indexed Deck & Single-Pass Tier Review Progress
**Learning:** `tierReviewProgress` recalculated per-tier mastery metrics by calling `deck.filter` once per tier (O(T * N)), and `cardsOfTier` / `conceptsForStep` performed full-deck array scans (`DECK.filter`) on every invocation or step render.
**Action:** Pre-index `DECK` into O(1) hash maps (`CARDS_BY_TIER`, `CARDS_BY_FRONT`) during static module loading, and refactor `tierReviewProgress` into an O(T + N) single-pass aggregation map with Set-based state checking.
