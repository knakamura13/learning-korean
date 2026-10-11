## 2025-05-19 - Single-Pass Map Grouping for SRS Tier Progress & Deck Pool
**Learning:** `tierReviewProgress` and `pool` in `src/lib/domain/srs.ts` previously executed quadratic $O(M \times N)$ array filtering and linear `state.unlocked.includes()` scans for every tier across the review deck. In reactive store getters (`tierProgress`, `vocabProgress`), this created repeated linear scans on every state tick.
**Action:** Pre-group deck cards by tier into a `Map<string, T[]>` in a single $O(N)$ pass and pass `Set<string>` to `isUnlocked`, reducing overall tier progress complexity from $O(M \times N)$ to $O(N + M)$.

## 2025-05-18 - Single-Pass HTML Scanner for Hangul Wrapping
**Learning:** `withLangKo` in `src/lib/a11y/lang.ts` previously re-scanned the entire HTML string from index 0 on every Hangul match using a secondary regex loop to calculate `langKoDepth(before)`. For HTML containing multiple tags and Hangul runs (such as all authored lab copy), this resulted in O(N²) regex execution overhead during lab copy sanitization.
**Action:** Use a single-pass tokenizing regex matching tags and Hangul runs in sequence while maintaining a running open-tag depth state, eliminating quadratic string slicing and regex instantiation.
