## 2025-05-18 - Single-Pass HTML Scanner for Hangul Wrapping
**Learning:** `withLangKo` in `src/lib/a11y/lang.ts` previously re-scanned the entire HTML string from index 0 on every Hangul match using a secondary regex loop to calculate `langKoDepth(before)`. For HTML containing multiple tags and Hangul runs (such as all authored lab copy), this resulted in O(N²) regex execution overhead during lab copy sanitization.
**Action:** Use a single-pass tokenizing regex matching tags and Hangul runs in sequence while maintaining a running open-tag depth state, eliminating quadratic string slicing and regex instantiation.

## 2025-05-19 - Single-Pass Grouping for SRS Tier Progress and Lazy Map Lookup
**Learning:** `tierReviewProgress` in `srs.ts` previously executed `deck.filter` once per tier ($O(N \times T)$), causing redundant linear array traversals over the full deck on every progress store getter read. Grouping cards by tier into a `Map<string, T[]>` once reduces progress calculations to $O(N + T)$. Additionally, lookup maps created in state mutators (like `setFlagged`) should be built lazily so unflagging and existing-card updates incur zero allocation overhead.
**Action:** Group collections into a `Map` before iterating over categories, and defer lookup table instantiation until cache miss branches are taken.
