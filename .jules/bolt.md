## 2025-05-19 - Bounded Map Cache for Template labHtml Sanitization
**Learning:** Svelte template expressions like `{@html labHtml(step.do)}` re-evaluate on every component reactive cycle or animation tick. Re-running `DOMPurify.sanitize()` and Hangul text wrapping on identical static copy strings blocks the main thread with redundant DOM tree parsing and serialization.
**Action:** Wrap DOMPurify and text wrapping transformations in a bounded FIFO `Map` cache (max 500 entries) so repeated template calls for identical strings resolve in sub-millisecond O(1) time.

## 2025-05-18 - Single-Pass HTML Scanner for Hangul Wrapping
**Learning:** `withLangKo` in `src/lib/a11y/lang.ts` previously re-scanned the entire HTML string from index 0 on every Hangul match using a secondary regex loop to calculate `langKoDepth(before)`. For HTML containing multiple tags and Hangul runs (such as all authored lab copy), this resulted in O(N²) regex execution overhead during lab copy sanitization.
**Action:** Use a single-pass tokenizing regex matching tags and Hangul runs in sequence while maintaining a running open-tag depth state, eliminating quadratic string slicing and regex instantiation.
