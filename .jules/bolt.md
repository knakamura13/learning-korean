## 2025-05-18 - Single-Pass HTML Scanner for Hangul Wrapping
**Learning:** `withLangKo` in `src/lib/a11y/lang.ts` previously re-scanned the entire HTML string from index 0 on every Hangul match using a secondary regex loop to calculate `langKoDepth(before)`. For HTML containing multiple tags and Hangul runs (such as all authored lab copy), this resulted in O(N²) regex execution overhead during lab copy sanitization.
**Action:** Use a single-pass tokenizing regex matching tags and Hangul runs in sequence while maintaining a running open-tag depth state, eliminating quadratic string slicing and regex instantiation.

## 2025-05-18 - Single-Pass Map Grouping for SRS Tier Progress & Deck Lookups
**Learning:** `tierReviewProgress` in `srs.ts` and `cardsOfTier` in `deck.ts` were previously performing full-deck linear `filter()` operations on every tier lookup (O(Tiers × Deck)). With 30+ tiers and 400+ cards, repeated UI renders and scheduler checks executed over 12,000 array evaluations per progress computation.
**Action:** Pre-group cards into `CARDS_BY_TIER` maps at module import time and perform a single-pass `Map` grouping inside `tierReviewProgress`, converting linear deck scans into O(1) hash map lookups.
