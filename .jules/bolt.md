## 2025-05-18 - Single-Pass HTML Scanner for Hangul Wrapping
**Learning:** `withLangKo` in `src/lib/a11y/lang.ts` previously re-scanned the entire HTML string from index 0 on every Hangul match using a secondary regex loop to calculate `langKoDepth(before)`. For HTML containing multiple tags and Hangul runs (such as all authored lab copy), this resulted in O(N²) regex execution overhead during lab copy sanitization.
**Action:** Use a single-pass tokenizing regex matching tags and Hangul runs in sequence while maintaining a running open-tag depth state, eliminating quadratic string slicing and regex instantiation.

## 2026-09-30 - Memoized Grouped Block Readings in Sprint Trial Generation
**Learning:** `optionsForBlock` in `src/lib/domain/sprint.ts` previously performed an un-memoized linear scan across all blocks in the inventory pool (up to 11,172 blocks with all labs unlocked) on every distractor selection attempt, executing `romanizeSyllable` millions of times in a typical Sprint session.
**Action:** Cache unique block readings grouped by length in a `WeakMap` keyed on the pool array reference (`readonly string[]`), reducing trial option generation from O(N) to O(1) for subsequent picks.
