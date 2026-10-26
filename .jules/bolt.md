## 2025-05-19 - Memoize `baseShapeOf` Consonant Derivation Lookups
**Learning:** `baseShapeOf` in `src/lib/domain/hangul.ts` recursively searched through `DERIVE` dictionary entries using `Object.entries` and `Object.values` on every execution, causing unnecessary object/array allocations and O(N) traversal overhead during reference page rendering and phonology calculations.
**Action:** Use a module-scoped `Map` cache for computed consonant base shapes, enabling O(1) lookups after initial evaluation.

## 2025-05-18 - Single-Pass HTML Scanner for Hangul Wrapping
**Learning:** `withLangKo` in `src/lib/a11y/lang.ts` previously re-scanned the entire HTML string from index 0 on every Hangul match using a secondary regex loop to calculate `langKoDepth(before)`. For HTML containing multiple tags and Hangul runs (such as all authored lab copy), this resulted in O(N²) regex execution overhead during lab copy sanitization.
**Action:** Use a single-pass tokenizing regex matching tags and Hangul runs in sequence while maintaining a running open-tag depth state, eliminating quadratic string slicing and regex instantiation.
