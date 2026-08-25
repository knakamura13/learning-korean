# Brand Hangul mark: Noto `한` as three nodding jamo

**Date:** 2026-08-25
**Status:** approved; implement
**Problem:** The header mark is `한` in accent next to italic “Korean”. Hover should make the three jamo nod independently while the rest state still reads as the same Noto `한`. Clipping three copies of the full glyph with rectangles produced torn edges and a stray loop that looked like a period. Amplitude tweaks cannot fix that.

## Constraints

- Independent jamo, still `한` at rest. Outlined Noto paths, not clip windows onto a full letter.
- Source glyph is Noto Sans KR weight 500, character `한` (U+D55C), from the same family as `--hangul`.
- One SVG, three `<g>`s (`jamo-h`, `jamo-a`, `jamo-n`). Every closed contour of the glyph is assigned to exactly one group. A contour that is a hole inside another contour stays with its parent so ㅎ’s loop cannot be drawn twice.
- Paths are committed in `BrandMark`. Runtime does not read the webfont for the mark.
- Hover / `:focus-visible` on `a.brand` plays a **one-shot** nod: ~5–6°, ~1px, 450ms, ease-out, back to rest. ㅎ first, ㅏ 100ms later, ㄴ 200ms later. Not infinite.
- `prefers-reduced-motion: reduce`: no transform animation; mark color shifts toward `--ink`.
- Forced colors: `LinkText`.
- SVG `aria-hidden="true"`. Visually hidden `한` with `lang="ko"`. No `aria-label="Korean 한"`.
- Brand link stays a 44px hit target. English `Korean` stays visible on phones.
- Drop `brandHot` / pointerenter polyfill. CSS `:hover` and `:focus-visible` only.
- No change to the “Korean” word’s styling in this slice.

## Approaches considered

1. **Rectangular clips of three full `한` copies.** Shipped in earlier revisions. Rejected: seams, extra loop, does not look like Hangul once anything moves.
2. **Hand-drawn geometric ㅎ ㅏ ㄴ.** Controllable, but a different drawing than lab Hangul. Rejected for the header.
3. **Split Noto `한` contours (locked).** Rest state matches the product’s Hangul. Motion can be a small nod around each group’s own centroid.

## Architecture

- Extract outlines from Noto Sans KR (variable instance or static Medium, wght 500). Flip font Y to SVG Y. ViewBox is the glyph bounds plus a little padding so a 1px nod does not clip.
- Classify contours by bounding-box center after pairing holes with outer paths: top-left → ㅎ, right → ㅏ, bottom → ㄴ.
- `BrandMark.svelte` renders one `svg` with three groups, `fill="currentColor"`, `color: var(--accent)`, size ~1.15rem (1rem at `max-width: 30rem`).
- Each group: `transform-box: fill-box; transform-origin: center`. Keyframes `han-nod-h|a|n`, `animation-iteration-count: 1`.
- Layout: `<a class="brand">` + `<span class="name">Korean</span>` + `<BrandMark />`. Animation selectors are `.brand:hover .jamo-*` and `.brand:focus-visible .jamo-*` (scoped via `:global` from `BrandMark` as needed).

## Tests

- Three `<g class="jamo-…">` (or equivalent) and `<path` data; **no** `clip-path`.
- One `<svg>`, `aria-hidden`, `.vh` / visually hidden `한`, `lang="ko"` on the mark.
- Nod: 450ms, not `infinite`; reduced-motion `animation: none` and `--ink` fallback.
- Layout: `class="brand"` (plain class, no `wiggling` / `brandHot`); English name not `display: none` on phones.

## Out of scope

- Hover effect on the word “Korean”.
- Animating other Hangul in the app.
- Changing the webfont subset.
