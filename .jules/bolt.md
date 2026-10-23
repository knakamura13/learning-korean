## 2025-05-20 - WeakMap Pool Indexing & Syllable Romanization Caching for Sprint
**Learning:** Sprint trial option generation (`optionsForBlock`) previously scanned the entire 11,000+ block inventory on every trial attempt (up to 40 attempts per trial) to find equal-length distractor readings, repeatedly decomposing syllables. Caching single-character syllable RR in `hangul.ts` and indexing pool readings by length via a `WeakMap<pool, Map<len, string[]>>` in `sprint.ts` cut trial generation time from ~131ms to ~8.8ms for 50 trials (~15x speedup).
**Action:** When picking random distractors from large static inventories, group pool items by key properties (e.g., string length) in a WeakMap keyed by pool reference rather than repeatedly filtering the raw array.

## 2025-05-18 - Single-Pass HTML Scanner for Hangul Wrapping
**Learning:** `withLangKo` in `src/lib/a11y/lang.ts` previously re-scanned the entire HTML string from index 0 on every Hangul match using a secondary regex loop to calculate `langKoDepth(before)`. For HTML containing multiple tags and Hangul runs (such as all authored lab copy), this resulted in O(N²) regex execution overhead during lab copy sanitization.
**Action:** Use a single-pass tokenizing regex matching tags and Hangul runs in sequence while maintaining a running open-tag depth state, eliminating quadratic string slicing and regex instantiation.
