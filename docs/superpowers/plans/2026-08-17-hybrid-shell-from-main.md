# Hybrid Shell from Main Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the app shell from `origin/main` (Botanical Korea after PR 60) so a first-time public visitor can find Labs, Review, and Reference immediately, while wide-screen lab sittings gain a two-column article/well layout, a narrow italic-serif header, and a vertical 01–06 lab rail with cursor-anchored previews — without Fascicle journal chrome.

**Architecture:** Main-first. Keep routes, `continueAction`, lab cards, SRS gating, ThemeToggle, and Review backup. Add a lab-only spread and `LabIndexRail` as new components. Do not merge `feat/pressed-fascicle-shell`. Cherry-pick only Newsreader font files if they save work. English display type is Newsreader italic; Hangul stays Noto Sans KR; tokens stay Botanical Korea.

**Tech Stack:** Svelte 5 + SvelteKit 2, DesignSystem tokens, Vitest source-contract tests (`polish.test.ts` and new rail/popover tests), self-hosted woff2. `@sveltejs/adapter-static` prerender. No Tailwind.

---

## Public release bar

The app is Kyle’s learning tool today and a **public product tomorrow**. Design the primary success case as a **first-time English-speaking visitor with empty `localStorage` and no Hangul**. A returning daily sitting must still be excellent. Do not optimize for Kyle’s muscle memory.

**What “extremely well thought out” means here**

| Surface | Public bar |
|---|---|
| **IA** | Three named destinations: Labs `/`, Review `/review`, Reference `/reference`. The lab sitting is a child of Labs, not the only article in a journal. |
| **Copy** | Words a stranger can parse: Labs, Review, Reference, Theme, Backup and restore, Open anyway, Need a letter? No Colophon, ToC, folio, plate, fascicle, ¶. |
| **States** | First-visit, mid-lab resume, due-review morning, locked-lab peek, need-a-letter, storage-blocked, 404, loading — each has visible copy, not a blank well. |
| **A11y** | 44px targets; unique `<title>` per route (SvelteKit announces it); `lang="ko"` on Hangul; keyboard and touch get the same lab preview as hover; skip link; contrast contract unchanged. |

**Subtle ≠ invisible.** The header stays ~44px and typographic. Nav is still **readable words** at a size a first glance can parse (not 11px ink-faint small-caps). Theme may stay an icon because sun/moon is a standard pattern; backup may not hide behind ¶.

**Anti-patterns from Fascicle (do not reintroduce)**

- Colophon link, ¶, or a divider that only the author understands
- ToC / flyleaf / “Index of plates” as primary chrome
- Center folio (`• 01 · 05/17`) as the header’s identity
- Sitting-as-only-article (no dashboard of labs)
- Hiding Labs / Review as peer destinations
- Specimen corner ticks on the interactive well (and, in this hybrid, on `.card` globally — unexplained ornament)
- `title=`-only tooltips as the lab preview
- Hover-only previews (phones are the public default)
- Journal naming in the UI: Colophon, ToC, folio, plate, fascicle

Keep scholarly anti-gamification: no XP, hearts, leagues, mascot. Moss = start/go; rose = due/resume; good = completed. Never quiz unmet labs.

---

## Goal and non-goals

**Goals**

- Public-ready Labs / Review / Reference chrome on a narrow Botanical Korea header
- Italic Newsreader wordmark, reused on section titles and lab titles (not on Hangul)
- Wide-screen two-column lab sitting (instruction left, interactive well right)
- Vertical 01–06 lab index on wide screens, with a large preview (hover + focus + press)
- Honest continue banner, chips, and home dashboard from main
- Theme in the header; backup labeled on Review

**Non-goals**

- Do not implement Ideas B–E from `outputs/learning-korean-design-brainstorm.md`
- Do not reskin or merge Fascicle as a whole
- Do not change lab pedagogy, card order, SRS, or “never quiz unmet”
- Do not add accounts, settings pages, search, or a new curriculum
- Do not put serif/display faces on Hangul
- Do not overlay grain on jamo, stage, trays, review glyph, or reference tables
- Do not delete `feat/pressed-fascicle-shell` (abandon ≠ destroy history)
- Do not ship this plan’s UI until the user approves the plan

---

## Baseline (what `origin/main` already has)

Prefer **`origin/main`** over local `main`. Local `main` can lag (at plan time it was two commits behind). Botanical Korea is `6ea2041` / PR 60. Watercolor (`#64`) is an unused sibling system and must not paint the app.

Already shipped and **keep**:

- Sticky header: brand (`한` + “Korean”), nav **Labs / Review / Reference**, `ThemeToggle`, rose Review badge
- Home dashboard: hero, `continueAction` card (`start` / `resume` / `review` / `caught-up`), stats strip, six lab cards with honest chips, Deck bars
- Lab `/lab/[id]`: compact kicker + title + standfirst, horizontal **card** pip rail, one step, teach-after-settle, “Need a letter?” aside → `/reference`, prerequisite gate
- Review: typed SRS, storage warning, **Backup and restore** disclosure, empty/finished states
- Reference: generated encyclopedia, chip jump-nav
- Tokens: moss/rose, Noto Sans KR Hangul, Noto Serif KR English headings, system sans, grain on `body` paper only
- `.card` herbarium L-ticks (PR 60) — **remove in this hybrid** (see Visual)
- Contrast floors in `app/src/lib/polish.test.ts`; 44px peek/backup/pip/theme
- Unique page titles; 404 copy that names labs / review / reference

Fascicle (`feat/pressed-fascicle-shell`) **proposed** a 44px running head, Newsreader italic wordmark, 01–06 plate rail, and a folio two-column spread. Those three spatial ideas are the only keepers, rebuilt on main’s IA. Leave that branch intact; do not check it out to implement.

---

## Hybrid IA

### Header (every page)

Rebuild `app/src/routes/+layout.svelte` from main’s labeled nav, not from `RunningHead.svelte`.

```
[ Korean 한 ]     Labs    Review [n]    Reference          [Theme]
```

- Height **44px** content row (plus `env(safe-area-inset-top)`). Padding-block shrinks vs today’s `var(--s2)` so the bar matches the Fascicle tightness the user liked.
- Left: italic Newsreader **Korean** + moss `한` (`lang="ko"`, Noto Sans KR). Wordmark links to `/`.
- Center/right cluster: **text buttons** Labs, Review, Reference — not a folio. Active = moss + `aria-current="page"`. Review badge stays rose when `queue > 0`.
- Far right: existing `ThemeToggle` (sun/moon/system cycle). Standard pattern; keep 44×44. Do not add ¶.
- Nav type: slightly smaller than body, but **ink-soft on paper, not caption-faint**. Minimum font ~0.84rem as today. `min-height: 44px`.
- On `<30rem`, hide the Latin wordmark if needed (main already does); **never hide the three nav words**. Prefer wrapping/scrolling the nav over icon-only.

**Reference stays.** The screenshot asked for Labs and Review because those replaced the folio. Deleting Reference would strand “Need a letter?” and first-time lookup. Keep the label **Reference** (already plain English, already in titles and 404 copy). Do not rename to ToC, Index, or Letters unless a later pass says so.

### Theme and backup

| Control | Where | Why |
|---|---|---|
| Theme | Header icon | Standard sun/moon; already has `aria-label` + `title` naming current and next |
| Backup and restore | Review `<details>` (main) | Labeled disclosure; open by default when storage is blocked |
| Locked-lab peek | Home card “Open anyway” | Visible words, 44px; rail preview repeats the same CTA |

Do not move backup into the header. Do not invent a settings page.

### Lab index rail (wide screens only)

A **Labs** navigator, not a plate catalog. Show on `/` and `/lab/[id]` when `min-width: 72rem`. Hide on Review and Reference (those pages are not lab sittings). Below 72rem: no rail; home cards and in-lab horizontal **card** pips remain the way to move.

- Six 44×44 targets: `01`…`06`, tabular mono
- Tones from existing `labCardState`: current (moss tick), start/in-progress (moss), resume (rose), done (good), locked (ink-faint, still focusable for preview)
- `aria-label="Labs"` (not “Plate numbers”)
- Current lab: `aria-current="page"`
- Locked: not a naked `<span>` with only `title=` — it is a button that opens the preview (peek / Open anyway)

### Two-column lab sitting

Breakpoint **`≥72rem`** (folio). Below that, stack: instruction then well (today’s LabRunner). Do not two-column Review or Reference.

```
[ 01–06 rail 56px ] [ article ~36rem ] [ well minmax(280px, 1fr) ]
```

Max spread ~90rem. Extra viewport is unused paper.

**Left (keep the in-lab stack the user already liked)**

1. Eyebrow: `LAB 01 · ~9 minutes · completed…`
2. Title (`h1`, Newsreader italic)
3. Card pip circles (existing rail — this is **cards inside a lab**, not the 01–06 course index)
4. Instructional sentence (`.do`) + hint
5. Teach / Next after settle
6. “Need a letter?” aside at the foot of the article column (keep the words)

**Right (interactive well)**

- Paper-sunk field, 1px rule, radius `--r-sm` (6px), **no corner ticks**
- Holds the step widget: mouth SVG, vowel dock, trays, stage, options, read blocks
- Sticky `top: calc(44px + env(safe-area-inset-top) + var(--s3))` so the spatial UI stays in view while the caption scrolls
- Min height 320px; min width 280px. If the well cannot meet that without crushing the article, **do not enter two-column** (same 72rem gate)

**Home** stays a dashboard (hero + continue + stats + six cards + deck). Public visitors must see the course. Do not replace home with a single sitting article.

### Where people go

| Need | Destination |
|---|---|
| Start / resume a lab | Home continue card, home lab cards, or 01–06 rail |
| Due reviews | Header Review (rose badge) or continue `review` |
| Look up a letter | Header Reference, or “Need a letter?” in a lab |
| Theme | Header |
| Backup | Review, labeled |

---

## Visual

### Keep from Fascicle (type only)

- **Newsreader italic** for the wordmark “Korean”
- Broader italic serif: home `h1`, section `h2` (Labs, Deck, Review standfirst), lab `h1`, continue-card title
- Self-host latin-only woff2 + `unicode-range`; `font-display: optional`

### Keep from main (tokens and Hangul)

- Botanical Korea moss / rose / forest dark (`botanicalKorea` remains `activeSystem`)
- `--hangul: Noto Sans KR` on every `lang="ko"` glyph — **never Newsreader, never Noto Serif KR on the object of study**
- Grain on `body` paper only
- Radii 6 / 10 / 16 / pill; space scale; contrast contract
- UI chrome stays `--sans` (system / Inter stack). Do **not** adopt Fascicle’s Source Serif 4 body, IBM Plex as a required face, or Inter-as-only-UI unless a later task proves a gap. Catalog numbers can stay existing `--mono`.

### Corner ticks

PR 60 paints L-ticks on **every** `.card` via `::before` / `::after`. The user called the well ticks pointless. For a public visitor they are unexplained ornament on home cards too.

**Decision: remove `.card` ticks globally.** Grain-on-paper already carries Botanical texture. Do not add a `.well` tick variant. Update `polish.test.ts` `'mounts cards as herbarium specimens without grain on the face'` so it still forbids grain-on-face and **asserts ticks are gone** (`not.toMatch(/\.card::before/)`).

### Motion

Keep `--ease` / `--fast` / `--med` / `--slow`. Preview popover: 130ms opacity. `prefers-reduced-motion: reduce` → 0.01ms, popover jumps to the anchor with no follow lag. Forced-colors: well and rail use `Canvas` / `CanvasText` / `Highlight` / `LinkText` (rose).

---

## Hover popover spec

**Purpose:** On 01–06, instantly show what that lab is, without making numbers a secret code.

**Contents (always the same, all input modes)**

- Eyebrow: `Lab 01`
- Title (lab title)
- Standfirst (one or two lines, wrap, **no ellipsis**)
- Meta: `~N min` · `N cards`
- State chip using existing copy: `start here` / `resume · card X of Y` / `✓ completed` / `Finish Lab NN first`
- Primary action: `Open lab` (unlocked) or `Open anyway` (locked). Locked also shows the prerequisite sentence.

**Pointer (`(hover: hover) and (pointer: fine)`)**

- Open on `pointerenter`; follow `pointermove` so the panel is **anchored to the cursor** (not the number). Offset ~12px toward the article; flip if it would clip the viewport.
- Close on `pointerleave` of the **number + popover** (use a small delay ~100ms so a diagonal move into the panel does not dismiss).
- Click on an unlocked number still navigates (default link). Clicking the popover action is the same href.

**Keyboard**

- Focus (Tab onto a number) opens the **same panel**, anchored to the number’s box (cursor does not exist).
- ArrowUp/ArrowDown move between 01–06.
- Enter/Space: unlocked → navigate; locked → focus `Open anyway` in the panel.
- Escape closes. Moving focus away closes.

**Touch / coarse pointer**

- First tap **opens the preview** (does not navigate). The panel includes `Open lab` / `Open anyway` and `Close`.
- Second tap on the number, or the action button, navigates.
- This is mandatory. Hover-only is a public-release bug.

**A11y**

- Popover: `role="dialog"` when opened by tap/keyboard; `role="tooltip"` is too weak for this much content.
- `aria-expanded` on the number; `aria-controls` pointing at the panel id.
- Do not use native `title=` as the preview.
- Screen reader: the number’s accessible name is `Lab 01, Find the Letters in Your Mouth, completed` (or locked/resume), not just `01`.

**Implementation sketch**

- Pure placement helper `anchorPopover(cursor: {x,y} | DOMRect, panel: {w,h}, viewport)` in `app/src/lib/domain/labPreview.ts` — testable without DOM.
- Component `LabPreview.svelte` + `LabIndexRail.svelte`.
- Cursor follow: `<svelte:window>` pointermove while open, or `{@attach}` on the rail. Do not use `$effect` to write coordinates from a store loop.

---

## First-class states (public copy)

Use this table when touching chrome. Prefer main’s existing sentences; only rewrite if a stranger would not understand.

| State | What they see |
|---|---|
| **First visit** (empty storage, prerender) | Home hero + continue **Start Lab 01**. Labs 02–06 locked with “Finish Lab 01 first” + Open anyway. Stats skeletons until hydrate. Continue exists before hydration (`continueAction` already does this). |
| **Mid-lab resume** | Continue `resume` (rose). Lab card chip `resume · card X of Y`. In-lab kicker `picking up at card X`. Rail number rose. |
| **Due-review morning** | Header Review badge. Continue `review` after resume priority. Review page existing standfirst. |
| **Need a letter** | Aside: “Need a letter?” + link to **reference** (keep). Header still has Reference. |
| **Storage blocked** | Review warning: “Progress will not be saved…” Backup disclosure **open**. Home must not claim a streak. |
| **404** | Existing error page: “This page is not in the course” + Back to labs. |
| **Lab loading** | “Loading the lab…” skeleton (keep). Well empty until ready — no fake Hangul. |
| **Locked peek** | Gate aside on `/lab/[id]`: “Lab NN comes first… You can still look around.” |

Do not add a Fascicle title page that hides the six labs.

---

## Migration

1. **Do not merge** `feat/pressed-fascicle-shell`.
2. **Do not delete** that branch or its remote.
3. Branch from updated main:

```bash
git fetch origin
git checkout main
git merge --ff-only origin/main
git checkout -b feat/hybrid-shell
```

4. Cherry-pick **only if a specific file is cheaper than re-vendoring**. Honest candidates:

| Candidate | Verdict |
|---|---|
| `app/static/fonts/Newsreader-Italic-latin.woff2` (+ roman) | **Yes** — copy files + `LATIN-FONTS.txt` + the Newsreader bits of `vendor-latin-fonts.py` / `botanicalKorea.ts` font list. Prefer `git show feat/pressed-fascicle-shell:path > path` over cherry-picking `745114d` (that commit also vendors Source Serif 4, Inter, IBM Plex). |
| `app/scripts/vendor-latin-fonts.py` | **Partial** — keep if it can emit Newsreader only; do not take the full Fascicle family unless needed. |
| `PlateRail.svelte` | **No merge** — rewrite as `LabIndexRail.svelte` (previews, Labs label, locked buttons). Read for CSS breakpoint only. |
| `FascicleSpread.svelte` | **No** — rewrite `LabSpread.svelte` without Colophon. |
| `RunningHead.svelte`, `TocFlyleaf.svelte`, `Colophon.svelte` | **No** |
| `sitting.ts`, `plateCatalog.ts`, `plateText.ts`, `jamoIndex.ts`, `fascicle.svelte.ts` | **No** — journal IA |
| Shopify lab drag (`app/src/lib/dnd/*`) | **No** — out of scope |

5. After fonts land, `botanicalKorea` `fonts[]` includes Newsreader italic (and roman if headings need it) **plus** existing Noto Sans KR / Noto Serif KR. Hangul faces stay Noto. Noto Serif KR may remain for non-italic English fallback; primary literary voice is Newsreader italic.

---

## File map (expected)

- Create: `app/src/lib/domain/labPreview.ts` — popover placement + preview view-model
- Create: `app/src/lib/domain/labPreview.test.ts`
- Create: `app/src/lib/components/shell/LabIndexRail.svelte`
- Create: `app/src/lib/components/shell/LabPreview.svelte`
- Create: `app/src/lib/components/shell/LabSpread.svelte`
- Create: `app/src/lib/components/shell/labIndexRail.test.ts` (source contracts: labels, 44px, no ToC/Colophon/folio strings)
- Modify: `app/src/routes/+layout.svelte` — 44px bar, italic wordmark, labeled nav
- Modify: `app/src/lib/components/LabRunner.svelte` — spread at 72rem; well class without ticks
- Modify: `app/src/routes/lab/[id]/+page.svelte` — drop `.narrow` at folio; mount rail + spread
- Modify: `app/src/routes/+page.svelte` — mount rail on wide home; italic section titles
- Modify: `app/src/app.css` — remove `.card` ticks; optional `--display` if not in the design system
- Modify: `app/src/lib/theme/systems/botanicalKorea.ts` — Newsreader faces; `--display`
- Modify: `app/src/lib/theme/types.ts` / `css.ts` if the token contract needs `--display`
- Modify: `app/src/lib/polish.test.ts` — header height, no ticks, no Folio/ToC/Colophon, Newsreader, 44px rail
- Modify: `app/src/lib/theme/systems/botanicalKorea.test.ts` — font files
- Copy: Newsreader woff2 (+ vendor script subset) from the fascicle branch as files, not as a merge

Do not create `Colophon.svelte` or `TocFlyleaf.svelte` on this branch.

---

### Task 1: Branch from `origin/main`

**Files:** none yet

- [x] **Step 1: Confirm baseline**

```bash
git fetch origin
git log -1 --oneline origin/main
```

Expected: includes `feat(ui): Botanical Korea visual restyle (#60)` (`6ea2041` or later). Watercolor may be present as an unused system.

- [x] **Step 2: Create the branch**

```bash
git checkout main
git merge --ff-only origin/main
git checkout -b feat/hybrid-shell
```

Expected: clean tree on `feat/hybrid-shell` ahead of `origin/main`. `feat/pressed-fascicle-shell` still exists (`git branch --list 'feat/pressed-fascicle-shell'`).

- [x] **Step 3: Commit is N/A until Task 2.** Do not commit an empty branch. **(No commits this session — user instruction.)**

---

### Task 2: Fail the chrome contracts first

**Files:**

- Modify: `app/src/lib/polish.test.ts`
- Test: `app/src/lib/polish.test.ts`

**Interfaces:**

- Consumes: existing `cssBlock`, raw Svelte reads of layout / LabRunner / home
- Produces: failing assertions that describe the hybrid before CSS exists

- [x] **Step 1: Replace the herbarium-tick assertion and add hybrid chrome tests**

In `polish.test.ts`, keep herbarium ticks on `.card` (**user amendment** — do not drop ticks globally). Add labeled-header, Newsreader, well-without-ticks, and journal-word guards.

In `polish.test.ts`, change `'mounts cards as herbarium specimens without grain on the face'` to keep grain-on-body / no grain overlay, and drop tick requirements:

```ts
	it('keeps paper grain on the body and off card faces, without specimen ticks', () => {
		expect(appCss).toMatch(/body\s*\{[\s\S]*background-image:/);
		expect(appCss).not.toMatch(/body::before[\s\S]{0,200}z-index:\s*1000/);
		expect(appCss).toMatch(/width='400'\s+height='400'/);
		expect(appCss).toMatch(/background-size:\s*400px\s+400px/);
		expect(appCss).not.toMatch(/\.card::before/);
		expect(appCss).not.toMatch(/\.card::after/);
	});

	it('keeps a labeled Labs / Review / Reference header without journal chrome', () => {
		expect(layout).toMatch(/label: 'Labs'/);
		expect(layout).toMatch(/label: 'Review'/);
		expect(layout).toMatch(/label: 'Reference'/);
		expect(layout).not.toMatch(/>ToC</);
		expect(layout).not.toMatch(/>¶</);
		expect(layout).not.toMatch(/Colophon/);
		expect(layout).not.toMatch(/folio/);
		expect(layout).toMatch(/ThemeToggle/);
	});
```

Add Newsreader italic to the existing self-host serif test (or a sibling `it`) so Hangul still asserts Noto Sans KR and English display asserts Newsreader.

- [x] **Step 2: Run**

```bash
cd app && pnpm test src/lib/polish.test.ts
```

Expected: FAIL — `.card::before` still exists; layout still has a taller bar and no Newsreader; ticks test name may 404 if not replaced yet.
**(Done as part of the full suite; left green rather than red-first.)**

- [ ] **Step 3: Commit** (after Task 3 makes these pass, or commit the failing test only if the team wants red-first history). Prefer one commit once layout + ticks + fonts pass together if that is cleaner for review.

---

### Task 3: Newsreader italic + token `--display`

**Files:**

- Create/copy: `app/static/fonts/Newsreader-Italic-latin.woff2`
- Optional copy: `app/static/fonts/Newsreader-latin.woff2`
- Modify: `app/src/lib/theme/systems/botanicalKorea.ts`
- Modify: `app/src/lib/theme/types.ts` (if `display` is not in the font contract)
- Modify: `app/src/lib/theme/css.ts` / `css.test.ts` / `botanicalKorea.test.ts`
- Modify: `app/src/lib/polish.test.ts` (self-host assertion)

@svelte-core-bestpractices — keep font lists in the design system, not ad-hoc `<link>` to Google Fonts.

- [x] **Step 1: Copy font files from the abandoned branch (not a merge)**

```bash
git show feat/pressed-fascicle-shell:app/static/fonts/Newsreader-Italic-latin.woff2 > app/static/fonts/Newsreader-Italic-latin.woff2
git show feat/pressed-fascicle-shell:app/static/fonts/Newsreader-latin.woff2 > app/static/fonts/Newsreader-latin.woff2
```

Do not copy SourceSerif4, Inter-latin, or IBMPlex in this task.

- [x] **Step 2: Register faces on `botanicalKorea`**

Add `--display: 'Newsreader', …serif` next to existing `--serif`. Fonts array entries: family `Newsreader`, files above, `style: 'italic'` on the italic file, `unicode-range` latin as in Fascicle’s `css.ts` if that helper already supports it.

Hangul entries stay Noto Sans KR. Do not point `--hangul` at Newsreader.

- [x] **Step 3: Run**

```bash
cd app && pnpm test src/lib/theme/systems/botanicalKorea.test.ts src/lib/theme/css.test.ts src/lib/polish.test.ts
```

Expected: font tests PASS once registered; polish Newsreader assertion PASS; tick/header tests still FAIL until Tasks 4–5.

- [ ] **Step 4: Commit**

```bash
git add app/static/fonts/Newsreader-*.woff2 app/src/lib/theme app/src/lib/polish.test.ts
git commit -m "$(cat <<'EOF'
feat(theme): self-host Newsreader italic for the hybrid wordmark

EOF
)"
```

---

### Task 4: Remove `.card` specimen ticks

**Files:**

- Modify: `app/src/app.css` (`.card::before` / `::after` block ~lines 186–206 on main)
- Modify: `app/src/lib/polish.test.ts` (Task 2 assertion)

- [x] **Skipped (user amendment):** keep `.card` ticks on home lab cards. Ticks removed only from the lab well (`LabSpread`). Do not delete `.card::before` / `::after`.

- [x] **Step 2: Run** `cd app && pnpm test src/lib/polish.test.ts` — ticks kept on `.card` (amendment); well-without-ticks assertion PASS.

Expected: tick assertion PASS. Do not add well ticks anywhere.

- [ ] **Step 3: Commit**

```bash
git commit -m "$(cat <<'EOF'
fix(ui): drop unexplained specimen ticks from cards

EOF
)"
```

---

### Task 5: Narrow labeled header

**Files:**

- Modify: `app/src/routes/+layout.svelte`
- Modify: `app/src/lib/polish.test.ts`
- Modify: `app/src/lib/components/ThemeToggle.test.ts` (only if header styles move)

- [x] **Step 1: Style the bar to 44px without dropping labels**

Keep the `nav` array exactly Labs / Review / Reference. Wordmark:

```svelte
<a class="brand" href={resolve('/')}>
	<span class="name">Korean</span>
	<span class="mark" lang="ko">한</span>
</a>
```

```css
.bar { /* sticky, paper 88% + blur, 1px rule — keep */ }
.inner {
	height: 44px;
	max-width: var(--shell); /* header can go full-spread later; 62rem is OK for home */
	display: flex;
	align-items: center;
	gap: var(--s4);
	padding-inline: max(var(--s4), env(safe-area-inset-left)) max(var(--s4), env(safe-area-inset-right));
	padding-block: 0;
}
.name {
	font-family: var(--display);
	font-style: italic;
	font-size: 16px;
	font-weight: 400;
}
.mark {
	font-family: var(--hangul);
	color: var(--accent);
}
nav a {
	min-height: 44px;
	font-size: 0.84rem;
	color: var(--ink-soft);
}
```

Do not center a folio. Do not add ToC. ThemeToggle stays last.

- [x] **Step 2: Broader italic serif** — home `h1`, `.sec` headings, lab `h1`, continue title, review standfirst: `font-family: var(--display); font-style: italic`. Hangul in those headings (if any) stays wrapped in `lang="ko"` / `.hg`.

- [x] **Step 3: Run** `cd app && pnpm test src/lib/polish.test.ts src/lib/components/ThemeToggle.test.ts`

Expected: labeled-header test PASS; theme 44px PASS.

- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(shell): tighten the header and set italic Newsreader on titles

EOF
)"
```

---

### Task 6: Lab preview domain (TDD)

**Files:**

- Create: `app/src/lib/domain/labPreview.ts`
- Create: `app/src/lib/domain/labPreview.test.ts`
- Reuse: `labCardState`, `toCourseLab`, `LABS`

- [x] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { anchorPopover, labPreviewModel } from './labPreview';

describe('anchorPopover', () => {
	it('places the panel 12px from the cursor and flips near the right edge', () => {
		const viewport = { w: 1200, h: 800 };
		const panel = { w: 320, h: 220 };
		const open = anchorPopover({ x: 80, y: 120 }, panel, viewport);
		expect(open.left).toBe(92);
		expect(open.top).toBe(132);
		const flipped = anchorPopover({ x: 1100, y: 120 }, panel, viewport);
		expect(flipped.left).toBeLessThan(1100 - 320);
	});

	it('clamps onto the viewport rather than overflowing', () => {
		const placed = anchorPopover({ x: 10, y: 790 }, { w: 320, h: 220 }, { w: 400, h: 800 });
		expect(placed.left).toBeGreaterThanOrEqual(8);
		expect(placed.top + 220).toBeLessThanOrEqual(800);
	});
});

describe('labPreviewModel', () => {
	it('exposes title, standfirst, minutes, and an honest chip — never plate copy', () => {
		const model = labPreviewModel(/* Lab 01 course card + labCardState */);
		expect(model.eyebrow).toMatch(/Lab 01/);
		expect(model.title).toBeTruthy();
		expect(model.standfirst).toBeTruthy();
		expect(model.actionLabel).toMatch(/Open lab|Open anyway/);
		expect(JSON.stringify(model)).not.toMatch(/Colophon|ToC|folio|plate/i);
	});
});
```

- [x] **Step 2: Run** `cd app && pnpm test src/lib/domain/labPreview.test.ts`

Expected: FAIL — module missing.

- [x] **Step 3: Implement `anchorPopover` and `labPreviewModel`** (pure functions, exhaustive chip kinds via `never` default on `labCardState` branches).

- [x] **Step 4: Run tests** — PASS.

- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(lab): add cursor-aware lab preview placement

EOF
)"
```

---

### Task 7: `LabIndexRail` + `LabPreview` (wide screens)

**Files:**

- Create: `app/src/lib/components/shell/LabIndexRail.svelte`
- Create: `app/src/lib/components/shell/LabPreview.svelte`
- Create: `app/src/lib/components/shell/labIndexRail.test.ts`
- Modify: `app/src/routes/+page.svelte` — include rail
- Modify: `app/src/routes/lab/[id]/+page.svelte` — include rail
- Modify: `app/src/lib/polish.test.ts` — 44px rail targets; `aria-label="Labs"`

@svelte-core-bestpractices — pointer handlers on the component, not `$effect` subscriptions. Use `{@attach}` only for measuring.

- [x] **Step 1: Source contract test**

```ts
import src from './LabIndexRail.svelte?raw';

it('names the nav Labs and keeps 44px targets', () => {
	expect(src).toMatch(/aria-label="Labs"/);
	expect(src).toMatch(/min-height:\s*44px/);
	expect(src).not.toMatch(/Plate/);
	expect(src).not.toMatch(/ToC/);
});

it('opens a preview on hover, focus, and click for coarse pointers', () => {
	expect(src).toMatch(/pointerenter|onpointerenter/);
	expect(src).toMatch(/onfocus|focusin/);
	expect(src).toMatch(/Open anyway|Open lab/);
});
```

- [x] **Step 2: Implement rail**

- `nav.lab-index` sticky; `ol` column at `min-width: 72rem`; horizontal snap-row below that **or hide** (plan: hide below 72rem — home cards already list labs).
- Unlocked: `<a href={lab}>`. Locked: `<button type="button">` that only opens preview.
- Bind preview to `labPreviewModel`.
- Input mode: `matchMedia('(hover: hover) and (pointer: fine)')` for cursor-follow; else tap-to-open.
- Escape closes. `aria-expanded`.

- [x] **Step 3: Run** `cd app && pnpm test src/lib/components/shell/labIndexRail.test.ts src/lib/domain/labPreview.test.ts src/lib/polish.test.ts`

- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(lab): add a wide-screen 01–06 rail with previews

EOF
)"
```

---

### Task 8: Two-column lab spread

**Files:**

- Create: `app/src/lib/components/shell/LabSpread.svelte`
- Modify: `app/src/lib/components/LabRunner.svelte`
- Modify: `app/src/routes/lab/[id]/+page.svelte` (remove max-width 44rem at folio)
- Modify: `app/src/lib/polish.test.ts` if finish-screen `<h1>` regex still matches after markup moves

**Feasibility:** Mouth (440×300), vowel dock, and trays must live in the well, not stay trapped in a 44rem single column on wide screens. On viewports `<72rem`, keep today’s stacked LabRunner so hit targets stay 44px. Do not put the well inside `.card` if `.card` ever regains ticks.

- [x] **Step 1: `LabSpread`**

```svelte
<div class="spread">
	<div class="article">{@render article()}</div>
	<div class="well">{@render well()}</div>
</div>
```

```css
.spread {
	display: grid;
	gap: var(--s6);
}
@media (min-width: 72rem) {
	.spread {
		grid-template-columns: minmax(0, 36rem) minmax(280px, 1fr);
		align-items: start;
		max-width: 90rem;
	}
	.well {
		position: sticky;
		top: calc(44px + env(safe-area-inset-top) + var(--s3));
		min-height: 320px;
		background: var(--paper-sunk);
		border: 1px solid var(--rule-strong);
		border-radius: var(--r-sm);
		/* no ::before/::after ticks */
	}
}
```

- [x] **Step 2: Split LabRunner**

Article snippet: existing head + card pips + `.do` + teach + letterAsk.  
Well snippet: `.work` (MouthStep, trays, …). Finish screen can span both or stay in article with a quiet well seal `한글`.

Keep pip **card** rail in the article (user liked those circles). Do not confuse it with 01–06.

- [x] **Step 3: Run** `cd app && pnpm test src/lib/polish.test.ts src/lib/components/steps/vowelStep.test.ts src/lib/components/tray.test.ts`

Expected: PASS. Spatial widget tests still see the same step components.

- [ ] **Step 4: Manual check** (implementer): Lab 01 mouth, Lab 02 dock, Lab 04 assemble — well wide enough, no clipped 44px hits.

- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(lab): sit instruction beside the interactive well on wide screens

EOF
)"
```

---

### Task 9: Public-state copy and polish contracts

**Files:**

- Modify: `app/src/routes/+page.svelte`, `review/+page.svelte`, `+error.svelte`, lab gate aside — only if a stranger cannot parse current copy
- Modify: `app/src/lib/polish.test.ts` — assert backup summary still says Backup; gate still names the prior lab; no Colophon in `app/src`

- [x] **Step 1: Grep guard**

```ts
	it('does not ship fascicle journal words in UI chrome', () => {
		expect(layout + home + labRunner).not.toMatch(/Colophon|ToC|fascicle|folio/i);
	});
```

Exclude this plan file and `outputs/learning-korean-design-brainstorm.md`.

- [x] **Step 2: Confirm Review backup disclosure label remains human** (`Backup and restore` or the current summary text). Storage-blocked warning stays first-class.

- [x] **Step 3: Run full test + check**

```bash
cd app && pnpm test && pnpm check
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
chore(ui): lock public chrome copy away from journal metaphors

EOF
)"
```

---

## Test plan

**Automated**

- `cd app && pnpm test` — polish, theme, courseNav, labPreview, labIndexRail, tray, vowel, existing a11y
- `cd app && pnpm check` — Svelte/TS
- New tests listed in Tasks 2, 6, 7, 9

**Manual (public-visitor hat)**

1. Fresh profile / empty site data, phone width: can you see Labs, Review, Reference in the header without knowing the app?
2. Tap lab `02` on a phone at desktop breakpoint if the rail is visible — preview must open, not navigate.
3. Keyboard: Tab to 01–06, see preview, Escape closes, Enter opens Lab 01.
4. Fine pointer: hover 04, panel follows cursor, contains standfirst + minutes + lock state.
5. Lab 01 / 02 / 04 at ≥72rem: two columns; widgets usable; no L-ticks on the well.
6. Resume a mid-lab, due-review badge, storage-blocked Review backup.
7. 404 copy; Need a letter? → Reference.
8. Theme cycle still 44px and named.
9. Hangul never renders in Newsreader (spot-check wordmark `한`, review glyph, mouth labels).

---

## Risks

| Risk | Mitigation |
|---|---|
| Spatial widgets trapped in a skinny well | 72rem gate + min 280×320 well; stack below |
| Two-column confuses card pips with 01–06 | Different placement and labels: “Lab card navigation” vs “Labs” |
| Subtle nav becomes invisible | Keep word labels at 0.84rem ink-soft; 44px hits; no small-caps folio |
| Hover-only preview on phones | Tap-to-open + explicit Open lab |
| Cursor-follow popover covers the next number | 12px offset, flip, 100ms grace; panel not over the rail if possible |
| Unmet quiz | Do not touch SRS unlocks |
| Tick regression | polish forbids `.card::before` |
| Merging Fascicle by accident | New branch from main; copy two font files only |
| Noto Serif KR + Newsreader both shipping | Accept two Latin serifs short-term; Hangul remains Noto Sans KR. Optional follow-up: stop using Noto Serif KR for English if Newsreader roman covers headings |
| Header 44px vs safe-area | Height is the **row**, not including notch; keep `padding-top: env(safe-area-inset-top)` on `.bar` |
| Prerender lying about progress | Keep `ready` gates and conservative locked labs before hydrate |

---

## Skills

- @superpowers:writing-plans (this document)
- @superpowers:brainstorming (design direction; Fascicle Idea A is reference only)
- @svelte-core-bestpractices during implementation
- @svelte-code-writer + Svelte MCP `svelte-autofixer` on every new `.svelte` file

---

## Execution

Do not start implementation until the user approves this plan.

After approval: branch `feat/hybrid-shell` from `origin/main` and run tasks in order. Two execution options:

1. **Subagent-Driven (this session)** — fresh subagent per task, review between tasks  
2. **Parallel Session (separate)** — new session with superpowers:executing-plans

**Which approach?**
