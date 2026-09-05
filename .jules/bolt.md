## 2025-05-19 - Bounded Syllable Decomposition & Romanization Cache
**Learning:** `decompose` and `romanizeSyllable` in `src/lib/domain/hangul.ts` were repeatedly called during Sprint trial generation (which scans up to 11,172 syllable blocks in pool loops). Because Hangul Unicode syllables are bounded (11,172 valid syllables from 0xAC00 to 0xD7A3), memoizing decomposition results with `Object.freeze` and caching romanization strings eliminates repeated character arithmetic and object allocations on hot drill paths without risk of cache pollution or object mutation.
**Action:** Restrict cache keys to valid 1-character Hangul syllables and freeze cached decomposition objects to ensure safe O(1) performance in domain phonology loops.

## 2025-05-18 - Single-Pass HTML Scanner for Hangul Wrapping
**Learning:** `withLangKo` in `src/lib/a11y/lang.ts` previously re-scanned the entire HTML string from index 0 on every Hangul match using a secondary regex loop to calculate `langKoDepth(before)`. For HTML containing multiple tags and Hangul runs (such as all authored lab copy), this resulted in O(N²) regex execution overhead during lab copy sanitization.
**Action:** Use a single-pass tokenizing regex matching tags and Hangul runs in sequence while maintaining a running open-tag depth state, eliminating quadratic string slicing and regex instantiation.
