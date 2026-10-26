## 2025-05-18 - Single-Pass HTML Scanner for Hangul Wrapping
**Learning:** `withLangKo` in `src/lib/a11y/lang.ts` previously re-scanned the entire HTML string from index 0 on every Hangul match using a secondary regex loop to calculate `langKoDepth(before)`. For HTML containing multiple tags and Hangul runs (such as all authored lab copy), this resulted in O(N²) regex execution overhead during lab copy sanitization.
**Action:** Use a single-pass tokenizing regex matching tags and Hangul runs in sequence while maintaining a running open-tag depth state, eliminating quadratic string slicing and regex instantiation.

## 2025-05-19 - Fast Syllable Mapping for Hangul Phonology
**Learning:** Phonology operations like `mapSyllables`, `applyLiaison`, and `romanizeWord` in `src/lib/domain/hangul.ts` frequently allocated intermediate arrays and objects via string spreading (`[...word]`), `.map()`, `.some()`, and duplicate function calls (`applyLiaison(word)` executed twice in `liaisonAction`).
**Action:** Use indexed string iteration (`word[i]`), pre-allocated arrays, and cached call results in phonology routines to eliminate temporary array allocations and double-processing.
