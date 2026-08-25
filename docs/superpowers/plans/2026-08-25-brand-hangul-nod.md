# Brand Hangul Nod Implementation Plan

> **For agentic workers:** Implement in this session. The spec is `docs/superpowers/specs/2026-08-25-brand-hangul-nod-design.md`.

**Goal:** Replace clipped copies of `한` with Noto outline groups that nod once on brand hover.

**Architecture:** Extract `한` from Noto Sans KR wght 500, assign contours to ㅎ/ㅏ/ㄴ, commit paths in `BrandMark.svelte`. CSS one-shot nod on `a.brand:hover` / `:focus-visible`.

**Tech Stack:** Svelte 5, SVG paths, fontTools for a one-off extract (paths committed; script not required at runtime).

## Global Constraints

- No `clip-path` on the mark.
- Every glyph contour used exactly once.
- One-shot 450ms nod, ~5–6° / ~1px, stagger 0 / 100 / 200ms.
- No `brandHot`. No mixed `aria-label="Korean 한"`.
- Reduced motion: no nod; color `--ink`.

---

## Files

- `app/src/lib/components/BrandMark.svelte` — mark + nod CSS
- `app/src/lib/components/BrandMark.test.ts` — source contracts
- `app/src/routes/+layout.svelte` — drop `brandHot` and layout keyframe hooks
- `app/src/lib/polish.test.ts` — brand class / BrandMark pins

## Task 1: Tests for the spec

- [ ] Update `BrandMark.test.ts` to fail on clip-path, three SVGs, infinite 720ms wiggle, `brandHot`.
- [ ] Expect one svg, three `jamo-h|a|n` groups, paths, `han-nod`, `450ms`, not `infinite`.
- [ ] Layout: `class="brand"` without wiggling class; still mounts BrandMark.

## Task 2: Extract and split `한`

- [ ] Load Noto Sans KR at wght 500. Draw U+D55C. Pair holes with outers. Assign groups by bbox center.
- [ ] Normalize to a tight SVG viewBox. Verify three non-empty path sets.

## Task 3: Implement BrandMark + layout

- [ ] One SVG, three groups, committed `d` attributes, currentColor, nod keyframes.
- [ ] Remove `brandHot` and layout `han-wiggle-*` rules.
- [ ] Run BrandMark + polish tests and `pnpm check`.
