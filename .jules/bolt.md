## 2025-05-18 - Single-Pass HTML Scanner for Hangul Wrapping
**Learning:** `withLangKo` in `src/lib/a11y/lang.ts` previously re-scanned the entire HTML string from index 0 on every Hangul match using a secondary regex loop to calculate `langKoDepth(before)`. For HTML containing multiple tags and Hangul runs (such as all authored lab copy), this resulted in O(N²) regex execution overhead during lab copy sanitization.
**Action:** Use a single-pass tokenizing regex matching tags and Hangul runs in sequence while maintaining a running open-tag depth state, eliminating quadratic string slicing and regex instantiation.

## 2025-05-19 - Single-Pass Tier Map and Set Lookups for SRS Deck Iteration
**Learning:** `tierReviewProgress` in `srs.ts` previously executed `deck.filter(c => c.tier === tier.id)` inside a loop over all tiers, leading to O(T × D) array iterations on every reactivity update in the UI. Additionally, `stats` and `setFlagged` performed linear array `includes` and `find` searches over deck cards and unlocked tiers.
**Action:** Group deck cards by tier using a single-pass `Map<string, T[]>` lookup ($O(D)$) and convert `unlocked` tier lists to `Set` for $O(1)$ lookup, avoiding intermediate array allocations and reducing tier progress complexity from $O(T \times D)$ to $O(T + D)$.
