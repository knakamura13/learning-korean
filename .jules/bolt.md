## 2025-05-18 - Single-Pass HTML Scanner for Hangul Wrapping
**Learning:** `withLangKo` in `src/lib/a11y/lang.ts` previously re-scanned the entire HTML string from index 0 on every Hangul match using a secondary regex loop to calculate `langKoDepth(before)`. For HTML containing multiple tags and Hangul runs (such as all authored lab copy), this resulted in O(N²) regex execution overhead during lab copy sanitization.
**Action:** Use a single-pass tokenizing regex matching tags and Hangul runs in sequence while maintaining a running open-tag depth state, eliminating quadratic string slicing and regex instantiation.

## 2025-05-19 - Map Lookup Overhead vs Direct O(1) CharCode Math
**Learning:** Caching direct `charCodeAt` arithmetic (e.g. `decompose`) using an unbounded `Map<string, T>` creates memory leak risk and adds string key hashing overhead that can be slower in V8 than direct O(1) integer math. Instead, focus on algorithmic improvements like single-pass array indexing ($O(N)$ vs $O(M \times N)$).
**Action:** Avoid string-keyed Map caches for low-complexity math functions; optimize nested array scans by pre-indexing with Maps instead.
