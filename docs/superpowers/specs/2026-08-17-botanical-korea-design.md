# Botanical Korea visual system

**Date:** 2026-08-17
**Status:** ready to implement (docs only until this spec is reviewed)
**Sources:** [Pressed Flowers](https://ggprompts.com/styles/pressed-flowers.html) (paper, mounts, specimen chrome) + [Verdant Grove](https://ggprompts.com/styles/verdant-grove.html) (Korea-green). Dark surfaces take night-forest from Verdant, not Oxford Dark Academia.
**Catalog decision:** option A from the 2026-08-17 design-system pass. Origami, Swiss International, Art Brut-as-system, and Light/Dark Academia-as-lead were considered and rejected.

## Why this, why now

The app is a 10-minute Hangul lab, not a tourism brochure. The current sheet is cream paper with 태극 red/blue — close to Civic/Hanok, and it no longer matches the botanical Korea direction that was chosen.

Success: Kyle opens `/`, `/lab/[id]`, `/review`, and `/reference` in light and dark and the product reads as herbarium + forest, while ㄱ/ㅋ/ㄲ stay as easy to tell apart as they are today.

## Constraints (non-negotiable)

- Interaction, labs, SRS, copy, and card order do not change.
- Hangul and jamo stay on self-hosted `Noto Sans KR` (`font-display: optional`). No Dancing Script, Caveat, Patrick Hand, Cormorant, or Gaegu on body or glyphs.
- `--ink-faint` vs `--paper` stays ≥ 7:1 in light and dark (`polish.test.ts`).
- Primary button label vs `--accent` fill stays ≥ 4.5:1.
- Semantic text (`--good`, `--blue`, `--warn`, `--rose`, `--accent` used as text) vs `--paper` stays ≥ 4.5:1.
- Paper grain, if any, is a `body` background only. Never an overlay on the lab stage, trays, slots, review glyph, or reference tables.
- No Verdant canopy orbs, swaying leaf dots, 40px pebble radii, or kraft/wobbly Art Brut chrome.
- Forced-colors and `prefers-reduced-motion` keep working.
- Token-only colors in components: no new hex in `.svelte` files.

## Approaches considered

**A. Token swap only.** Recolor `:root` and leave every `var(--accent)` mapping. Fast. Makes “due” and “primary action” the same moss green, so the review queue looks like success. Rejected as the whole job; the token swap is still the bulk of the work.

**B. Botanical Korea (this spec).** Pressed Flowers paper + Verdant moss as the product accent. Dried mugunghwa rose is a *separate* attention color for due/resume. Specimen corner ticks on `.card`. Noto Serif KR for English headings.

**C. Academia pair.** Light/Dark Academia as the theme toggle. Scholarly, easy dark mode, Western library. Rejected as the lead; too close to today and not the chosen Korea-green.

## Locked palette

Catalog faded petals (`#c9929a`, `#4f8a6e`, `#a48b3d`) fail as text on cream. The locked hexes below are the contrast-safe neighbors of those sources.

### Light (`:root`)

| Token | Hex | Role |
|---|---|---|
| `--ink` | `#3e352c` | Body text (Pressed Flowers ink) |
| `--ink-soft` | `#5c5047` | Secondary text |
| `--ink-faint` | `#5c5047` | Captions; 7.19:1 on paper (must stay ≥ 7) |
| `--paper` | `#faf5ee` | Page sheet |
| `--paper-sunk` | `#f5edd9` | Wells, tracks, inputs |
| `--paper-raised` | `#fffdf8` | Cards, mounts |
| `--rule` | `#e8dcc8` | Hairline |
| `--rule-strong` | `#c4b8a5` | Stronger edge, specimen ticks |
| `--accent` | `#315c45` | Moss: buttons, brand `한`, nav active, start-here, continue CTA |
| `--accent-ink` | `#fffdf8` | Text on moss fill (7.52:1) |
| `--accent-soft` | `#e7f0ea` | Moss wash |
| `--blue` | `#3d5a7a` | Links, “new” tags (6.58:1) |
| `--blue-soft` | `#e7eef4` | Info wash |
| `--good` | `#2f6b45` | Completed / correct (5.85:1); distinct from moss) |
| `--good-soft` | `#e8f1eb` | Success wash |
| `--bad` | `#9c2f28` | Wrong / blocking (keep; already 6.8:1) |
| `--bad-soft` | `#faeae8` | Error wash |
| `--warn` | `#7a5e18` | Locked / slow (5.63:1) |
| `--warn-soft` | `#faf2e0` | Warning wash |
| `--rose` | `#7a3e46` | Due queue, resume, review-nav badge (7.43:1) |
| `--rose-soft` | `#f3e6e8` | Due / resume wash |

`--rose` is new. Everything else keeps its current token *name* so existing `var(--accent)` call sites stay valid except the mappings in “Attention vs action” below.

### Dark (`:root[data-theme='dark']` and the `prefers-color-scheme: dark` clone)

| Token | Hex | Role |
|---|---|---|
| `--ink` | `#f5edd9` | Cream ink |
| `--ink-soft` | `#c5d1c4` | Secondary |
| `--ink-faint` | `#b8c4b0` | Captions; 8.78:1 on night paper |
| `--paper` | `#1a2420` | Moss night |
| `--paper-sunk` | `#141c19` | Wells |
| `--paper-raised` | `#24302b` | Cards |
| `--rule` | `#2f3d37` | Hairline |
| `--rule-strong` | `#3d4f47` | Strong edge |
| `--accent` | `#a6c1ae` | Sage on night (8.25:1) |
| `--accent-ink` | `#1a2420` | Ink on sage fill |
| `--accent-soft` | `#24352d` | Sage wash |
| `--blue` | `#8ab7e0` | Links (keep current dark blue; 7.54:1) |
| `--blue-soft` | `#182531` | Info wash |
| `--good` | `#83c99e` | Correct (keep current dark good) |
| `--good-soft` | `#17251d` | Success wash |
| `--bad` | `#e88b81` | Wrong (keep) |
| `--bad-soft` | `#2a1a18` | Error wash |
| `--warn` | `#d8b055` | Warn (keep; 7.79:1) |
| `--warn-soft` | `#2a2312` | Warning wash |
| `--rose` | `#e8b4ba` | Due / resume (8.86:1) |
| `--rose-soft` | `#3a2428` | Due wash |

`theme.ts` `PAPER_LIGHT` / `PAPER_DARK`, `app.html` theme-color bootstrap, and both web manifests must use `#faf5ee` and `#1a2420`.

### `prefers-contrast: more`

Replace the current 태극-red contrast overrides with moss/rose:

- Light: `--ink-faint: #4a4038`; `--accent: #1e3d2c`; `--accent-soft: #d5e4db`; `--rose: #5c2c33`; `--rose-soft: #f0d6d9`; stronger `--rule` / `--rule-strong` on the parchment scale.
- Dark: `--ink-faint: #c5d1c4`; `--accent: #c5dbc5`; `--rose: #f0c9ce`; matching rule darkening.

## Attention vs action

Today “due”, “resume”, “start here”, “continue”, and the brand mark all use `--accent` (태극 red). After the swap, moss would paint all of them the same as “go.”

| Surface | Token |
|---|---|
| Brand `한`, nav active, `.btn`, continue CTA, start-here chip | `--accent` / `--accent-soft` |
| Home “to review” hot stat, `.lab.resume`, resume chip, review-nav `.badge` | `--rose` / `--rose-soft` |
| Completed lab, correct feedback, deck “mastered” | `--good` |
| Deck “learning” track | `--accent` (in progress, not due) |
| Links, “new” tags | `--blue` |

`chip-status.go` currently covers both “start here” and “resume”. Split: keep `.go` for start-here (moss); add `.chip-status.due` (or `.resume`) for resume (rose).

## Type

- `--hangul`: unchanged `Noto Sans KR` subset at `/fonts/NotoSansKR-subset.woff2`.
- `--serif`: `Noto Serif KR` subset at `/fonts/NotoSerifKR-subset.woff2`, weights 400–600, `font-display: optional`. Used by `h1–h4`, `.continue-title`, LabRunner `.standfirst`.
- `--sans`: system stack, unchanged.
- `--mono`: unchanged.
- Preload the serif file next to the existing sans preload in `+layout.svelte`.
- Subset recipe: OFL Noto Serif KR, same Unicode coverage as the existing sans subset (basic Latin + Hangul the app already ships) plus the Latin needed for English headings. Keep `OFL.txt`. Do not add a Google Fonts stylesheet.

## Shape, motion, texture

- Radii stay `--r-sm: 6px`, `--r-md: 10px`, `--r-lg: 16px`, `--r-pill: 999px`. Do not adopt Verdant’s 18–40px radii.
- Shadows stay the current three elevations; retint to `--ink` at the same opacities (sepia in light, forest-black in dark).
- Motion tokens (`--ease`, `--fast`, `--med`, `--slow`) unchanged.
- Optional paper grain: `body` `background-image` SVG `feTurbulence` at **0.04** opacity, tiled. Cards, `.stage`, trays, slots, and the review glyph sit on opaque `--paper-raised` / `--paper-sunk` so Hangul is not filtered. `prefers-reduced-motion` does not need to disable a static grain.
- `.card` specimen chrome: `position: relative` plus two 12×12px corner ticks (`::before` top-start, `::after` bottom-end), 1px `--rule-strong`, inset `--s2`, `pointer-events: none`. Do not clip them with `overflow: hidden` on `.card` itself.

## Wrong-answer mark

Art Brut is seasoning only. Keep the existing LabRunner `.fb[data-tone='wrong']` side border. Do not add a new font, tape, or wobbly radius.

## Chrome assets

Update so the shell matches the sheet:

- `app/static/favicon.svg` — rect `--accent` `#315c45`, `한` fill `#fffdf8`.
- `icon-192.png`, `apple-touch-icon.png`, `icon-maskable.png` — same mark, moss ground.
- `og.png` — moss/cream, not 태극 red. Keep 1200×630.

## Non-goals

- New illustrations, flower SVGs, or a second webfont beyond the serif subset.
- Redesigning LabRunner, trays, or the vowel dock board.
- Turning `/reference` tables into herbarium plates.
- Changing lesson copy, SRS, or storage.
- Shipping catalog HTML from ggprompts.

## Files (implementation, not this docs PR)

- Modify: `app/src/app.css` — tokens, grain, `.card` ticks, contrast media.
- Modify: `app/src/lib/theme.ts` — `PAPER_*`.
- Modify: `app/src/app.html` — theme-color hex + inline bootstrap.
- Modify: `app/static/manifest.webmanifest`, `manifest-dark.webmanifest`.
- Modify: `app/src/lib/polish.test.ts` — expected hex + contrast.
- Modify: `app/src/routes/+page.svelte` — resume/hot → rose.
- Modify: `app/src/routes/+layout.svelte` — queue badge → rose; serif preload.
- Modify: `app/src/routes/review/+page.svelte` — hot stat → rose if it uses `--accent` for due.
- Modify: `app/static/favicon.svg` and raster icons / `og.png`.
- Create: `app/static/fonts/NotoSerifKR-subset.woff2`.

## Test

- `polish.test.ts` remains the contract: caption 7:1, new paper/theme_color hex, `font-display: optional`.
- Add contrast asserts for `--accent` vs `--accent-ink`, `--rose` vs `--paper`, `--good` vs `--paper`, `--blue` vs `--paper`, `--warn` vs `--paper` (light and dark).
- Existing Vitest + `pnpm check` must stay green. No pedagogy tests change.
- Manual: light/dark/system toggle on home, one lab card, review glyph, reference table; confirm no grain on jamo; confirm due badge is rose and Next is moss.

## Out of scope for the first sitting

PNG/OG regeneration can follow the SVG if raster export is awkward; favicon.svg must ship with the CSS so the tab mark is not still 태극 red.
