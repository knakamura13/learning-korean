## 2025-05-18 - Single-Pass HTML Scanner for Hangul Wrapping
**Learning:** `withLangKo` in `src/lib/a11y/lang.ts` previously re-scanned the entire HTML string from index 0 on every Hangul match using a secondary regex loop to calculate `langKoDepth(before)`. For HTML containing multiple tags and Hangul runs (such as all authored lab copy), this resulted in O(N²) regex execution overhead during lab copy sanitization.
**Action:** Use a single-pass tokenizing regex matching tags and Hangul runs in sequence while maintaining a running open-tag depth state, eliminating quadratic string slicing and regex instantiation.

## 2025-05-20 - WeakMap Pool Cache for Sprint Trial Generation
**Learning:** `optionsForBlock` in `src/lib/domain/sprint.ts` was re-scanning and re-romanizing the entire 11,172-item syllable block inventory up to 40 times per trial attempt. Using a `WeakMap` cached map of unique distractors grouped by reading length per `pool` array reference reduces trial generation from ~20ms to <0.001ms while preserving exact RNG determinism.
**Action:** Group and cache array element properties by array reference with `WeakMap` when trial/option generation functions run repeatedly against large static domain pools.
