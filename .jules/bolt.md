## 2025-05-18 - Single-Pass HTML Scanner for Hangul Wrapping
**Learning:** `withLangKo` in `src/lib/a11y/lang.ts` previously re-scanned the entire HTML string from index 0 on every Hangul match using a secondary regex loop to calculate `langKoDepth(before)`. For HTML containing multiple tags and Hangul runs (such as all authored lab copy), this resulted in O(N²) regex execution overhead during lab copy sanitization.
**Action:** Use a single-pass tokenizing regex matching tags and Hangul runs in sequence while maintaining a running open-tag depth state, eliminating quadratic string slicing and regex instantiation.

## 2025-05-19 - Pre-Indexed Domain Lookups and Shape Memoization
**Learning:** Domain query helpers (`cardsOfTier` in `deck.ts` and `wordsOfPack` in `words.ts`) ran full array `.filter()` scans over static `DECK` and `WORDS` datasets on every invocation. For frequent progress store calculations and UI renders, this caused unnecessary linear searches and array allocations. Additionally, `baseShapeOf` in `hangul.ts` performed recursive traversals over `DERIVE` object entries on every call.
**Action:** Pre-build index maps (`CARDS_BY_TIER` and `WORDS_BY_PACK`) at module initialization for $O(1)$ lookups and memoize `baseShapeOf` results in a Map.
