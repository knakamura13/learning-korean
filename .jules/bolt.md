## 2025-05-18 - Single-Pass HTML Scanner for Hangul Wrapping
**Learning:** `withLangKo` in `src/lib/a11y/lang.ts` previously re-scanned the entire HTML string from index 0 on every Hangul match using a secondary regex loop to calculate `langKoDepth(before)`. For HTML containing multiple tags and Hangul runs (such as all authored lab copy), this resulted in O(N²) regex execution overhead during lab copy sanitization.
**Action:** Use a single-pass tokenizing regex matching tags and Hangul runs in sequence while maintaining a running open-tag depth state, eliminating quadratic string slicing and regex instantiation.

## 2025-05-19 - Syllable Decompose and Romanization Memoization
**Learning:** `decompose` and `romanizeSyllable` in `src/lib/domain/hangul.ts` were called repeatedly during block sprint option generation, deck construction, and drill option synthesis. Because Hangul syllable blocks (0xAC00–0xD7A3) are static and finite (11,172 maximum possibilities), re-calculating Unicode index math, array lookups, and allocating `Decomposed` objects and template strings on every lookup added significant CPU overhead in hot practice loops.
**Action:** Use module-level `Map` caches (`DECOMPOSE_CACHE` and `ROMANIZE_CACHE`) to memoize pure syllable decomposition and Romanization lookups, turning O(1) math & string allocation into nanosecond Map lookups.
