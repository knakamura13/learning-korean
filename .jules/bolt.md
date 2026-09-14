## 2025-05-18 - Single-Pass HTML Scanner for Hangul Wrapping
**Learning:** `withLangKo` in `src/lib/a11y/lang.ts` previously re-scanned the entire HTML string from index 0 on every Hangul match using a secondary regex loop to calculate `langKoDepth(before)`. For HTML containing multiple tags and Hangul runs (such as all authored lab copy), this resulted in O(N²) regex execution overhead during lab copy sanitization.
**Action:** Use a single-pass tokenizing regex matching tags and Hangul runs in sequence while maintaining a running open-tag depth state, eliminating quadratic string slicing and regex instantiation.

## 2025-05-19 - Single-Pass Tier Stats Map and O(1) Phonology Lookups
**Learning:** `tierReviewProgress` in `src/lib/domain/srs.ts` previously filtered the entire deck (~300 cards) for every tier (16 tiers) and performed repeated array `.includes()` scans for unlock state ($O(T \cdot D)$ iterations). Similarly, `baseShapeOf` and `mergedWith` in `src/lib/domain/hangul.ts` dynamically iterated object entries and arrays on every invocation during rendering.
**Action:** Group cards by tier in a single $O(D)$ pass using a `Map` and `Set` for unlock status. Pre-compute constant lookup maps for phonological base shapes and vowel mergers at module initialization.
