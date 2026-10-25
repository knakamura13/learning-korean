## 2025-05-18 - Single-Pass HTML Scanner for Hangul Wrapping
**Learning:** `withLangKo` in `src/lib/a11y/lang.ts` previously re-scanned the entire HTML string from index 0 on every Hangul match using a secondary regex loop to calculate `langKoDepth(before)`. For HTML containing multiple tags and Hangul runs (such as all authored lab copy), this resulted in O(N²) regex execution overhead during lab copy sanitization.
**Action:** Use a single-pass tokenizing regex matching tags and Hangul runs in sequence while maintaining a running open-tag depth state, eliminating quadratic string slicing and regex instantiation.

## 2025-05-19 - Pre-computed Base Shape Mapping for Consonant Derivation
**Learning:** `baseShapeOf` in `src/lib/domain/hangul.ts` previously performed recursive runtime `Object.entries()` and `Object.values()` array allocations and searches across derivation rules on every consonant lookup.
**Action:** Pre-compute `BASE_SHAPE_MAP` at module load time for all lead consonants, reducing `baseShapeOf` lookups to O(1) dictionary access without runtime allocation or recursion.
