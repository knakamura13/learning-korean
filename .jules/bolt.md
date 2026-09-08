## 2025-05-20 - Single-Pass Map Aggregation for Tier Progress
**Learning:** `tierReviewProgress` in `app/src/lib/domain/srs.ts` previously filtered the full deck (`deck.filter(...)`) for every tier in `tiers`. With 35 tiers and 400+ cards, accessing progress properties triggered over 14,000 element comparisons and unnecessary array allocations per evaluation.
**Action:** Use a single-pass `Map` aggregation to pre-group card counts by tier in $O(T + D)$ time, eliminating quadratic iterations and temporary array creation.

## 2025-05-18 - Single-Pass HTML Scanner for Hangul Wrapping
**Learning:** `withLangKo` in `src/lib/a11y/lang.ts` previously re-scanned the entire HTML string from index 0 on every Hangul match using a secondary regex loop to calculate `langKoDepth(before)`. For HTML containing multiple tags and Hangul runs (such as all authored lab copy), this resulted in O(N²) regex execution overhead during lab copy sanitization.
**Action:** Use a single-pass tokenizing regex matching tags and Hangul runs in sequence while maintaining a running open-tag depth state, eliminating quadratic string slicing and regex instantiation.
