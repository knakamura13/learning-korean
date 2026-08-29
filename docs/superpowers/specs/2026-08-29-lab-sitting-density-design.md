# Lab sitting density (portrait phones)

**Date:** 2026-08-29
**Status:** ready to implement (written spec pending review)
**Amends:** [2026-08-24-lab-phases-design.md](2026-08-24-lab-phases-design.md) (visible lab `h1` on compact sitting)
**Related:** [2026-08-18-solo-sitting-layout-design.md](2026-08-18-solo-sitting-layout-design.md) (wide unpaired finish; unchanged)

## Context

This is a Hangul-first trainer. The audience is Kyle and a small circle. Sittings are ~10 minutes, interactive labs, explanation only after an action. Tone is editorial (academia, botanical, taegeuk, watercolor looks). Not Duolingo, not XP, not tutorial articles.

The stack is Svelte 5 + SvelteKit. Looks already own color and type. This spec does not add families or palettes. Chrome uses existing tokens: `--display`, `--sans`, `--hangul`, `--paper`, `--paper-sunk`, `--ink`, `--accent`, `--rule`, `--chrome`. Example mapping on academia dark: paper `#2a1a0a`, sunk `#1f1208`, ink `#f4f1e8`, accent `#e8aaa4`. Other looks keep their own hex.

**Surfaces in scope:** lab routes at `max-width: 40rem`. The sitting bar applies to in-progress, finish, and the prerequisite gate. Well fill (A+D) applies to in-progress cards that have a well.

**Anti-goals:** gamified HUD, shrinking tap targets below 44px, phone-only capability, hiding the question by default, landscape no-scroll, Review/Drill density, finish-screen redesign, rewriting `.do` copy.

## Problem

On a phone, the card you tap is not on screen when the card loads. Liaison Hangul clips at the bottom of the viewport. A 2×2 choice grid sits under a ~900px stack. That is not “the type is a bit large.” The page is a vertical list of chrome, then the task.

Current stack, in order:

1. Safari chrome
2. Sticky `.bar` row 1: brand + settings ([`+layout.svelte`](../../../app/src/routes/+layout.svelte))
3. Sticky `.bar` row 2: Labs / Review / Drill / Reference (`@media (max-width: 40rem)` wraps `.inner`; `nav` is `flex: 1 0 100%`)
4. [`LabSwitcher`](../../../app/src/lib/components/shell/LabSwitcher.svelte): `06 The Letter That Jumps`
5. `.eyebrow`: `Lab 06 · ~10 minutes`
6. `h1`: the same title again
7. `.standfirst` on card 1
8. [`LabPipRail`](../../../app/src/lib/components/LabPipRail.svelte) + `Card N of M`
9. `.phase-title`
10. `h2.do`
11. [`LabSpread`](../../../app/src/lib/components/shell/LabSpread.svelte) `.well`: `min-height: 16rem`, `padding: var(--s5)`, article-to-well `gap: var(--s6)`

[`LabRunner`](../../../app/src/lib/components/LabRunner.svelte) `compactHead` already drops the standfirst after card 1 and shrinks `h1` to `1.15rem`. Mid-lab cards still overflow. Shrinking the title is not the fix.

`.shell` still adds `padding-top: var(--s5)` (1.5rem) on `max-width: 40rem`.

## Grill (locked)

**G1. Do not design to 400–500px.** That number is landscape / short-window height. iPhone SE is 375×667 CSS px. Safari still eats ~50–140. Locked contract: **portrait phones first**. Landscape may page-scroll. Floor is iPhone SE portrait after one sitting bar. Use `svh` / `dvh`, not a guessed 500.

**G2. “No page-scroll” means prompt + answers on load.** It does not mean teach copy, Next, or every widget. Feedback after settle is supposed to appear after the action ([`0002-lessons-must-be-interactive.md`](../../../learning-records/0002-lessons-must-be-interactive.md)). That block may sit below the fold and scroll into view. Mouth (viewBox 440×300) and the vowel dock (`aspect-ratio: 1`) may scroll **inside** the well. The page must not start scrolled past the prompt.

**G3. Duplicate chrome is the leak.** Switcher title and `h1` say the same thing. Eyebrow repeats the lab number. `Card N of M` repeats the pips. Phase title and `.do` are the first lines that belong to the card.

**G4. `.well { min-height: 16rem }` forces ~256px even for a 2×2 choice.** That floor is for empty/loading wells, not for density. Choice and liaison cards do not need it.

**G5. 44px targets stay.** Pips, options, switcher, settings, sitting-nav trigger, dialog rows. Density comes from removing rows, not from 32px taps.

**G6. Reopen one lab-phases lock on compact sitting only.** Lab-phases says the lab `h1` stays on every card. On compact sitting, the visible title is the switcher in the sitting bar. The document `h1` stays in the tree as `.vh`. Wide layout (`min-width: 72rem`) and mid (`40rem` exclusive through `72rem`) keep today’s visible head.

**G7. This is a sitting layout, not a new look.** No new type families. No gamified HUD.

**G8. Phone and desktop stay equal in capability.** Jumpable pips, 44px targets, forced-colors, `prefers-reduced-motion`. Desktop two-column spread at `72rem` stays. Compact sitting is for **narrow lab routes**, not a phone-only product.

## Locked product choices

- **Viewport:** Portrait phones (SE and up). Prompt + interactive controls visible without page-scroll after the sitting bar.
- **Breakpoint:** compact sitting = lab route (`pathname` starts with `/lab/`) **and** `max-width: 40rem`. Do **not** key compact sitting on `max-height`. Landscape iPhone SE is 667×375: width is above `40rem`, so today’s one-row tab bar stays and page-scroll is allowed.
- **Site chrome:** collapse to **one** 48px sitting bar. The four destinations move into that bar’s menu. Home, Review, Drill, Reference, Settings keep today’s two-row wrap at `40rem`.
- **Out of this pass:** landscape no-scroll, Review/Drill density, finish-screen redesign, `.do` copy rewrites, collapsing pips into a sheet (direction B) unless a measured SE screenshot still clips a choice or liaison card after A+D.

## Approaches considered

All five assume the one-row sitting bar. They differ below it.

### A. Sitting HUD (editorial)

One 48px bar: brand (`Korean` + mark), lab switcher (number + truncated title), a 44px overflow that lists Labs / Review / Drill / Reference, settings. Below it: today’s numbered pip rail (phase dimming stays). Then phase + `.do`. Then the well with `min-height: 0` and smaller padding. `LabSpread` gap `--s6` → `--s3`. Visible `h1`, eyebrow, standfirst hidden.

Type stays `--display` / `--sans` / `--hangul`. Spacing: bar 48px, pips 44px, prompt ~4.5–6rem, remainder to the well.

**Wins:** smallest behavior change, glanceable pips, brand. **Risk:** a long `.do` plus Stage padding at `--s5`/`--s6` can still clip on SE.

### B. Pips in a sheet

Same sitting bar. Replace the pip row with `11 / 14` plus prev/next. Full jump rail opens in a sheet (same `attachModalDialog` model as the lab switcher).

**Wins:** ~44px back. **Loses:** glanceable phase map the phases spec just added. Worse for a 16-card lab.

### C. Work-first

Sitting bar, then the well, then the prompt as a caption on or under the well.

**Wins:** Hangul and options are first. **Loses:** teaching order (read the ask, then act). Long `.do` is easy to skip. Wrong for this product.

### D. Viewport-fill well

Sitting bar + pips + prompt are a short header. The well fills leftover `svh`. Oversized widgets scroll inside the well. Choice options stay in the unclipped well. After settle, feedback + Next append below; the page may scroll.

**Wins:** this is the layout mechanic that enforces the goal. Pairs with A. **Need:** `min-height: 0` on the flex/grid child or the well will not shrink. Do not put `.after` in the same fixed-height flex as the well.

### E. Collapsed prompt

Phase title always visible. `.do` is one line with an expand control if it overflows two lines.

**Wins:** Lab 05’s long paragraph stops stealing the fold. **Risk:** hiding the question. Discovery-first labs need the ask visible. Last resort only.

## Evaluation

Weights: audience 0.30, brand 0.25, differentiation 0.20, feasibility 0.15, completeness 0.10. Raw scores are 0–1. Probability is that weighted score normalized across the five so they sum to 1.0.

| Direction | Audience | Brand | Diff | Feas. | Complete | Weighted | P |
|---|---|---|---|---|---|---|---|
| A Sitting HUD | 0.85 | 0.90 | 0.40 | 0.90 | 0.70 | 0.765 | 0.23 |
| B Pips in a sheet | 0.55 | 0.60 | 0.55 | 0.85 | 0.75 | 0.628 | 0.19 |
| C Work-first | 0.35 | 0.45 | 0.80 | 0.70 | 0.60 | 0.543 | 0.16 |
| D Viewport-fill well | 0.90 | 0.70 | 0.70 | 0.75 | 0.80 | 0.778 | 0.24 |
| E Collapsed prompt | 0.50 | 0.65 | 0.45 | 0.80 | 0.55 | 0.578 | 0.18 |

**Locked: A + D.** One sitting bar, keep the pip rail, hide duplicate titles, fill leftover viewport with the well, internal scroll only for widgets that cannot shrink (mouth, vowel). **B** only if a measured SE screenshot still clips a choice or liaison card after A+D ships. **C** out. **E** only for a pathological `.do` that still overflows after A+D; not the default.

## Compact sitting spec (A + D)

### When it applies

`.bar.lab-route` at `max-width: 40rem`. `labRoute` is already `page.url.pathname.startsWith('/lab/')` in [`+layout.svelte`](../../../app/src/routes/+layout.svelte). Finish and the prerequisite gate are lab routes, so they get the sitting bar. Finish layout (solo `LabSpread`, ceremony card) is otherwise unchanged.

Does **not** apply: `/`, `/review`, `/drill`, `/reference`, `/settings`. Those keep today’s two-row wrap.

### Sitting bar

One row. `min-height: 48px`. Sticky as `.bar` is today (`top: 0`, `z-index: 5`, `padding-top: env(safe-area-inset-top)`). `.inner` does **not** wrap. `nav` is **not** `flex: 1 0 100%`.

Contents, inline start to end:

1. **Brand** — existing `a.brand`: italic `Korean` + `BrandMark`. English `Korean` stays visible ([brand hangul-nod](2026-08-25-brand-hangul-nod-design.md)). `min-width` / `min-height` 44px.
2. **Lab switcher** — the [`LabSwitcher`](../../../app/src/lib/components/shell/LabSwitcher.svelte) trigger, now the visible lab title. Number + truncated title + chevron. Truncate with ellipsis; do not wrap onto a second bar row.
3. **Sitting nav** — 44×44 control. Accessible name: `Main navigation`. Visible label: current section word (`Labs` on a lab route) plus chevron. Not a hamburger. If Review sitting count `> 0`, keep the 8px presence pip on this trigger (same paint as today’s phone Review tab). Opens a `<dialog>` via `attachModalDialog` (same helper as the lab switcher). The dialog lists Labs, Review, Drill, Reference — the same four `href`s as today’s `nav`. Review’s accessible name stays `load.navAria` when sitting `> 0`. Inside the dialog, Review may show the numeric sitting count (the 8px-only pip is a space constraint on the tab strip, not on a sheet). Folder-tab `::before` / `::after` geometry is for the inline tab strip only; the sheet is a list, like the lab switcher.
4. **Settings** — existing `SettingsLink`, 44×44 person mark.

Do not put all four tabs in the 375px bar as 44px targets next to brand + switcher + settings. They will not fit.

### LabSwitcher mounts

Two mounts, one visible. Hidden mount is `display: none` (out of the a11y tree).

| Band | Layout switcher | Page switcher ([`lab/[id]/+page.svelte`](../../../app/src/routes/lab/[id]/+page.svelte)) |
|---|---|---|
| Compact sitting (`lab` + `max-width: 40rem`) | In the sitting bar | Hidden |
| Mid (wider than `40rem`, narrower than `72rem`) | Hidden | In-page, as today |
| Wide (`min-width: 72rem`) | Hidden | Hidden (index rail) |

Layout reads the current lab id from the child route (`page.params.id` or the `/lab/` path). Sheet contents, models, and 44px rows stay as today.

On compact sitting the in-page switcher has `margin-block-end: 0` because it is not painted.

### Lab article chrome

On compact sitting only:

- `.head .eyebrow` and `.standfirst`: not painted (`display: none`). Card 1 loses the standfirst. That is required; card 1 is the worst case today.
- `.head h1`: stays in the document, class `.vh`. One `h1` per in-progress page. Visible title is the switcher. `.vh` is `position: absolute`, so the heading takes no flow. `.head` itself must not keep `margin-bottom: var(--s5)` / `var(--s3)` on compact sitting: `margin: 0`.
- Finish card keeps its own visible `h1` (`lab.finish.title`). It is not `.head`.
- [`LabPipRail`](../../../app/src/lib/components/LabPipRail.svelte): unchanged behavior (numbered 1..N, `Card {n} of {total}`, phase `data-phase`, jump rules, 44px pips, forced-colors `GrayText` for other-phase, no extra motion). Compact sitting only: `.rail-wrap { margin-bottom: var(--s2) }` instead of `--s4`.
- `.phase-title` and `h2.do` stay visible. `.do` on compact sitting: `font-size: 1.1rem; line-height: 1.34` (drop the `clamp` that tops out at `1.45rem`). `.hint` stays if authored.
- `compactHead` stays for mid and wide. Compact sitting does not depend on `index > 0`.

### Well and spread

On compact sitting, [`LabSpread`](../../../app/src/lib/components/shell/LabSpread.svelte) is a column that fills leftover small viewport, and `.after` is **not** a flex sibling that steals well height.

Structure contract:

- `.spread` `min-height: calc(100svh - var(--sitting-bar-block) - var(--shell-pad-top) - var(--shell-pad-bottom))`. It may grow taller than that. Do not set a fixed `height` that traps `.after`.
- `--sitting-bar-block: calc(48px + env(safe-area-inset-top))`.
- `--shell-pad-top` on compact lab sitting: `var(--s3)` (0.75rem). Today’s `.shell` at `40rem` uses `--s5`. Cut it.
- `--shell-pad-bottom` on compact lab sitting: `max(var(--s3), env(safe-area-inset-bottom))`. Today’s `--s7` / `--s8` would make the first paint taller than one `svh` even when the well fits.
- `.article`: content height (pips + prompt). `flex: 0 0 auto`.
- Fill slot (the `.well` only): `flex: 1 1 auto; min-height: 0; overflow-y: auto`. This is where mouth and vowel dock scroll if they cannot shrink.
- `.after`: sibling **below** the fill slot, `flex: 0 0 auto`. When feedback + Next appear, the document grows and the page may scroll. Do not shrink the well under the options to make room for teach copy.

`.well` on compact sitting:

- Drop `min-height: 16rem` for a real widget. Loading skeleton may keep a short placeholder (not 16rem, not `aspect-ratio: 1`).
- `padding: var(--s3)` instead of `--s5`.
- `overflow-y: auto; overscroll-behavior: contain` when content exceeds the fill slot.

Wide (`min-width: 72rem`) is unchanged: `'article spread-col'`, sticky `.spread-col`, `.well { flex-shrink: 0 }`, `.after { flex-shrink: 0 }`. Those polish / labIndexRail contracts stay. Compact sitting must not rewrite them globally.

`.spread` gap on compact sitting: `var(--s3)` instead of `--s6`.

### Step widgets (compact sitting only)

Not a rewrite of the eleven step types. Tightening that steals fold:

- [`Stage.svelte`](../../../app/src/lib/components/Stage.svelte): at `max-width: 34rem` glyphs are already `3.2rem` / `2.3rem`. On compact sitting, padding `var(--s5) 0 var(--s6)` becomes `var(--s3) 0 var(--s4)`.
- [`VowelStep.svelte`](../../../app/src/lib/components/steps/VowelStep.svelte): retune `width: min(100%, max(16rem, calc(100dvh - 14rem)))` to `calc(100svh - var(--sitting-chrome))` where `--sitting-chrome` is bar + pips + prompt, about `9rem`, not `14rem`.
- Mouth SVG scales with the well. Do not keep a 16rem square skeleton on the sitting path ([`LabRunner` `.mouth-ph`](../../../app/src/lib/components/LabRunner.svelte)).
- Options stay `min-height: 44px`. Hangul options stay `min-height: 4rem`. 2×2 grid stays.

### After settle

`.advance` (verdict + teach HTML + Next) is not in the first paint. After settle, it appends below the well. Existing `revealAdvance` may scroll the verdict into view. Do not pin Next over the well.

### Motion and forced colors

- `prefers-reduced-motion: reduce`: no new animation on the sitting bar. Dialog close still uses `attachModalDialog` (instant when reduced).
- Forced colors: sitting bar `Canvas` / `CanvasText` / `ButtonBorder` like `.bar` today. Sitting-nav trigger and switcher trigger: `ButtonBorder`. Dialog: same as the lab switcher sheet (`Canvas`, `Highlight` for current). Pips unchanged.

### Focus and scroll

- Skip link still `#main`.
- Card change: keep today’s LabRunner effect (park the prompt under the sticky bar, focus `firstWellControl`). The sticky chrome is one row, so the offset shrinks. Use the sitting bar’s bottom, not a hardcoded two-row height.
- Opening sitting nav or the lab sheet: focus trap via `attachModalDialog`. Restore focus to the opener on close.

## What this amends

Lab-phases **Header (unchanged)** said: compact head still drops the standfirst after card 1; lab `h1` stays the lab title on every card.

**Amendment:** on compact sitting, the visible title is the sitting-bar switcher. The in-progress `h1` is `.vh`. Standfirst is hidden even on card 1. Mid and wide sittings keep the old header rule. `Card N of M` and the numbered rail stay.

Brand hangul-nod **English `Korean` stays visible on phones** stays. Compact sitting does not hide `.name`.

## Tests (when implementing)

Source contracts, not visual snapshots:

- [`polish.test.ts`](../../../app/src/lib/polish.test.ts): the `max-width: 40rem` wrap (`flex-wrap: wrap`, `nav { flex: 1 0 100% }`) applies to `.bar:not(.lab-route)` (or equivalent). `.bar.lab-route` at `40rem` is nowrap, one row, `nav` not `flex-basis: 100%`.
- Layout mounts a lab switcher and a sitting-nav dialog on lab routes. Page still mounts `LabSwitcher`. CSS hides all but one at each band.
- Sitting-nav trigger `min-width` / `min-height` 44px; dialog links 44px; `attachModalDialog`.
- `LabRunner` compact sitting: `.head h1` has `.vh`; eyebrow/standfirst not displayed; `.head { margin: 0 }`; `.do` `1.1rem`.
- Compact lab `.shell`: `padding-top: var(--s3)`; `padding-bottom` is `max(var(--s3), env(safe-area-inset-bottom))`, not `--s7`.
- `LabSpread` compact: well `min-height` is not `16rem`; `min-height: 0` on the fill slot; `.after` not inside that overflow box. Wide `flex-shrink: 0` on `.well` and `.after` unchanged.
- `LabPipRail` `margin-bottom` `--s2` only inside the compact query; jump / phase / 44px tests unchanged.
- Brand: `.name` not `display: none` on lab-route phones.

Manual (implementation pass, iPhone SE 375×667 or equivalent):

1. Lab 05 choice with a 2×2 grid: phase + `.do` + all four options on screen at load. No page-scroll to tap.
2. Lab 06 liaison card 1: prompt + Hangul + Stay/jamo picks on screen at load (standfirst gone).
3. Lab 01 mouth: diagram may scroll inside the well; prompt stays above.
4. After a correct pick, teach + Next may sit below the fold.
5. Home still wraps tabs to a second row at `40rem`.
6. Desktop `72rem` two-column spread unchanged.

## Implementation touch list (not this PR)

This document is the spec. Do not implement until this spec is approved.

- [`app/src/routes/+layout.svelte`](../../../app/src/routes/+layout.svelte) — sitting bar, sitting nav, layout `LabSwitcher`
- [`app/src/routes/lab/[id]/+page.svelte`](../../../app/src/routes/lab/[id]/+page.svelte) — hide page switcher on compact sitting
- [`app/src/lib/components/shell/LabSwitcher.svelte`](../../../app/src/lib/components/shell/LabSwitcher.svelte) — bar trigger density; keep 44px
- [`app/src/lib/components/LabRunner.svelte`](../../../app/src/lib/components/LabRunner.svelte) — `.head` / `.do` / skeleton
- [`app/src/lib/components/shell/LabSpread.svelte`](../../../app/src/lib/components/shell/LabSpread.svelte) — fill contract
- [`app/src/lib/components/LabPipRail.svelte`](../../../app/src/lib/components/LabPipRail.svelte) — margin
- [`app/src/lib/components/Stage.svelte`](../../../app/src/lib/components/Stage.svelte), [`VowelStep.svelte`](../../../app/src/lib/components/steps/VowelStep.svelte) — padding / `svh` offset
- [`app/src/app.css`](../../../app/src/app.css) — lab-route compact `.shell` padding
- [`app/src/lib/polish.test.ts`](../../../app/src/lib/polish.test.ts), [`app/src/lib/shellLayout.test.ts`](../../../app/src/lib/shellLayout.test.ts), [`app/src/lib/components/shell/labIndexRail.test.ts`](../../../app/src/lib/components/shell/labIndexRail.test.ts)

## Out of scope

- Landscape / short-desktop no-scroll (`max-height` compact sitting)
- Direction B (pips in a sheet) as the first implementation
- Direction C (well above the prompt)
- Default collapsed `.do` (direction E)
- Finish-screen geometry (solo sitting spec still owns that)
- Changing card order, widgets, unlocks, or phase titles
- Review, Drill, Reference, home chrome
