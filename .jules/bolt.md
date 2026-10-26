## 2025-05-18 - Single-Pass HTML Scanner for Hangul Wrapping
**Learning:** `withLangKo` in `src/lib/a11y/lang.ts` previously re-scanned the entire HTML string from index 0 on every Hangul match using a secondary regex loop to calculate `langKoDepth(before)`. For HTML containing multiple tags and Hangul runs (such as all authored lab copy), this resulted in O(N²) regex execution overhead during lab copy sanitization.
**Action:** Use a single-pass tokenizing regex matching tags and Hangul runs in sequence while maintaining a running open-tag depth state, eliminating quadratic string slicing and regex instantiation.

## 2025-05-19 - WeakMap Inventory Indexing for Sprint Distractor Generation
**Learning:** `optionsForBlock` in `src/lib/domain/sprint.ts` previously scanned all 11,172 inventory syllable blocks on every single trial option generation to collect same-length distractors, resulting in $O(N)$ full-array iterations per trial ($O(N^2)$ across a round).
**Action:** Pre-group readings by string length once per inventory pool reference using a `WeakMap`, reducing distractor option selection to $O(1)$ lookups and speeding up trial generation by >16x while eliminating main-thread GC pressure during gameplay.
