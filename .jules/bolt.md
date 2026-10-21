## 2025-05-18 - Single-Pass HTML Scanner for Hangul Wrapping
**Learning:** `withLangKo` in `src/lib/a11y/lang.ts` previously re-scanned the entire HTML string from index 0 on every Hangul match using a secondary regex loop to calculate `langKoDepth(before)`. For HTML containing multiple tags and Hangul runs (such as all authored lab copy), this resulted in O(N²) regex execution overhead during lab copy sanitization.
**Action:** Use a single-pass tokenizing regex matching tags and Hangul runs in sequence while maintaining a running open-tag depth state, eliminating quadratic string slicing and regex instantiation.

## 2025-05-19 - Bounded Direct-Array Cache for Hangul Syllable Phonology
**Learning:** The Unicode Hangul Syllable range (0xAC00 to 0xD7A3) is strictly bounded to 11,172 entries. In high-frequency phonology operations such as Sprint trial generation and review deck romanization, repeated `decompose()` object creation and string formatting accumulate significant GC and math overhead.
**Action:** Use a flat 11,172-element array indexed by `ch.charCodeAt(0) - 0xAC00` for O(1) zero-allocation memoization of syllable decomposition and romanization.
