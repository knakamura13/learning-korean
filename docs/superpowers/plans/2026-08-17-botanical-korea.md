# Botanical Korea Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the Hangul lab app to Botanical Korea (Pressed Flowers paper + Verdant moss, mugunghwa rose for due/resume) without changing labs, SRS, or interaction.

**Architecture:** Keep the existing token names in `app.css`. Swap locked hexes, add `--rose` / `--rose-soft`, retarget a few “attention” surfaces that must not share moss with primary actions. Chrome hex in `theme.ts`, `app.html`, and manifests stays in lockstep with `--paper`.

**Tech Stack:** SvelteKit, `app.css` design tokens, Vitest (`polish.test.ts` is the contrast contract), self-hosted OFL woff2.

## Global Constraints

- Do not change lesson copy, deck, SRS, or LabRunner behavior.
- Hangul stays `Noto Sans KR` with `font-display: optional`.
- `--ink-faint` vs `--paper` ≥ 7:1 light and dark.
- `--accent` vs `--accent-ink`, `--rose` vs `--paper`, `--good` vs `--paper`, `--blue` vs `--paper`, `--warn` vs `--paper` ≥ 4.5:1 light and dark.
- No hex in new `.svelte` rules; tokens only.
- No catalog HTML, no Google Fonts stylesheet, no Art Brut fonts or tape. Leave LabRunner `.fb` borders as they are.
- No grain overlay on jamo; grain is `body` background only.
- Follow TDD: failing `polish.test.ts` (and mapping tests) before CSS/HTML edits.

## File map

- Modify: `app/src/lib/polish.test.ts` — hex + contrast contract
- Modify: `app/src/app.css` — tokens, grain, `.card` ticks, contrast media, shadows
- Modify: `app/src/lib/theme.ts` — `PAPER_LIGHT` / `PAPER_DARK`
- Modify: `app/src/app.html` — theme-color + bootstrap script
- Modify: `app/static/manifest.webmanifest`, `app/static/manifest-dark.webmanifest`
- Modify: `app/src/routes/+page.svelte` — resume/hot → rose; split `.chip-status.due`
- Modify: `app/src/routes/+layout.svelte` — queue badge rose; serif preload
- Modify: `app/src/routes/review/+page.svelte` — hot stat → rose
- Modify: `app/src/app.css` `@font-face` for serif
- Create: `app/static/fonts/NotoSerifKR-subset.woff2`
- Modify: `app/static/favicon.svg`
- Modify (if regenerating): `app/static/icon-192.png`, `apple-touch-icon.png`, `icon-maskable.png`, `og.png`

---

### Task 1: Contrast contract for the new sheet

**Files:**
- Modify: `app/src/lib/polish.test.ts`
- Test: `app/src/lib/polish.test.ts`

**Interfaces:**
- Consumes: existing `cssBlock`, `token`, `contrastRatio`
- Produces: tests that fail on current 태극 cream/red until Task 2 lands

- [ ] **Step 1: Extend `polish.test.ts`.** Keep `keeps caption-size ink-faint at least 7:1 against paper`. Change the OG/manifest test hexes to `#faf5ee` / `#1a2420`. Add:

```ts
	it('locks Botanical Korea paper, moss, and rose with WCAG floors', () => {
		const light = cssBlock(appCss, ':root {');
		const dark = cssBlock(appCss, ":root[data-theme='dark']");
		expect(token(light, '--paper')).toBe('#faf5ee');
		expect(token(light, '--accent')).toBe('#315c45');
		expect(token(light, '--accent-ink')).toBe('#fffdf8');
		expect(token(light, '--rose')).toBe('#7a3e46');
		expect(token(light, '--good')).toBe('#2f6b45');
		expect(token(light, '--blue')).toBe('#3d5a7a');
		expect(token(light, '--warn')).toBe('#7a5e18');
		expect(token(dark, '--paper')).toBe('#1a2420');
		expect(token(dark, '--accent')).toBe('#a6c1ae');
		expect(token(dark, '--rose')).toBe('#e8b4ba');
		expect(contrastRatio(token(light, '--ink-faint'), token(light, '--paper'))).toBeGreaterThanOrEqual(7);
		expect(contrastRatio(token(dark, '--ink-faint'), token(dark, '--paper'))).toBeGreaterThanOrEqual(7);
		expect(contrastRatio(token(light, '--accent'), token(light, '--accent-ink'))).toBeGreaterThanOrEqual(4.5);
		expect(contrastRatio(token(dark, '--accent'), token(dark, '--accent-ink'))).toBeGreaterThanOrEqual(4.5);
		for (const name of ['--rose', '--good', '--blue', '--warn'] as const) {
			expect(contrastRatio(token(light, name), token(light, '--paper'))).toBeGreaterThanOrEqual(4.5);
			expect(contrastRatio(token(dark, name), token(dark, '--paper'))).toBeGreaterThanOrEqual(4.5);
		}
	});
```

In `emits absolute Open Graph images only...` replace `#fffef9` with `#faf5ee` and `#131316` with `#1a2420`.

- [ ] **Step 2: Run** `cd app && pnpm test src/lib/polish.test.ts`

Expected: FAIL — `--paper` is still `#fffef9`, `--rose` missing, manifest still old hex.

- [ ] **Step 3: Do not edit CSS yet.** This task is the red contract only.

- [ ] **Step 4: Confirm the failure names the old hex or missing `--rose`.**

- [ ] **Step 5: Commit** `test(ui): lock Botanical Korea contrast contract`

---

### Task 2: Light and dark tokens in `app.css`

**Files:**
- Modify: `app/src/app.css` (`:root`, `:root[data-theme='dark']`, and the `prefers-color-scheme: dark` clone that duplicates dark tokens)
- Test: `app/src/lib/polish.test.ts`

**Interfaces:**
- Consumes: locked table in `docs/superpowers/specs/2026-08-17-botanical-korea-design.md`
- Produces: the hexes Task 1 asserts

- [ ] **Step 1: Re-run** `cd app && pnpm test src/lib/polish.test.ts` — still FAIL (tokens not updated).

- [ ] **Step 2: Replace the light `:root` color + shadow block** (ink through shadows; leave type, space, radius, motion, `--measure`, `--shell`) with:

```css
	--ink: #3e352c;
	--ink-soft: #5c5047;
	--ink-faint: #5c5047;
	--paper: #faf5ee;
	--paper-sunk: #f5edd9;
	--paper-raised: #fffdf8;
	--rule: #e8dcc8;
	--rule-strong: #c4b8a5;

	--accent: #315c45;
	--accent-ink: #fffdf8;
	--accent-soft: #e7f0ea;
	--blue: #3d5a7a;
	--blue-soft: #e7eef4;

	--good: #2f6b45;
	--good-soft: #e8f1eb;
	--bad: #9c2f28;
	--bad-soft: #faeae8;
	--warn: #7a5e18;
	--warn-soft: #faf2e0;

	--rose: #7a3e46;
	--rose-soft: #f3e6e8;

	--shadow-1: 0 1px 2px rgba(62, 53, 44, 0.05), 0 1px 3px rgba(62, 53, 44, 0.04);
	--shadow-2: 0 2px 6px rgba(62, 53, 44, 0.07), 0 8px 20px rgba(62, 53, 44, 0.05);
	--shadow-3: 0 8px 24px rgba(62, 53, 44, 0.1), 0 20px 48px rgba(62, 53, 44, 0.07);
```

Replace **both** dark copies (`:root[data-theme='dark']` and `@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) }`) with:

```css
	--ink: #f5edd9;
	--ink-soft: #c5d1c4;
	--ink-faint: #b8c4b0;
	--paper: #1a2420;
	--paper-sunk: #141c19;
	--paper-raised: #24302b;
	--rule: #2f3d37;
	--rule-strong: #3d4f47;

	--accent: #a6c1ae;
	--accent-ink: #1a2420;
	--accent-soft: #24352d;
	--blue: #8ab7e0;
	--blue-soft: #182531;

	--good: #83c99e;
	--good-soft: #17251d;
	--bad: #e88b81;
	--bad-soft: #2a1a18;
	--warn: #d8b055;
	--warn-soft: #2a2312;

	--rose: #e8b4ba;
	--rose-soft: #3a2428;

	--shadow-1: 0 1px 2px rgba(0, 0, 0, 0.4);
	--shadow-2: 0 2px 8px rgba(0, 0, 0, 0.45), 0 10px 24px rgba(0, 0, 0, 0.3);
	--shadow-3: 0 10px 30px rgba(0, 0, 0, 0.5), 0 24px 60px rgba(0, 0, 0, 0.35);
```

- [ ] **Step 3: Run** `cd app && pnpm test src/lib/polish.test.ts`

Expected: the new Botanical Korea test PASSES. The manifest/theme-color test still FAILS (`#fffef9` / `#131316`). That is Task 3.

- [ ] **Step 4: Commit** `feat(ui): swap app tokens to Botanical Korea`

---

### Task 3: Theme-color chrome (HTML, JS, manifests)

**Files:**
- Modify: `app/src/lib/theme.ts`
- Modify: `app/src/app.html`
- Modify: `app/static/manifest.webmanifest`
- Modify: `app/static/manifest-dark.webmanifest`
- Test: `app/src/lib/polish.test.ts`

**Interfaces:**
- Consumes: `PAPER_LIGHT` / `PAPER_DARK` used by `applyTheme`
- Produces: `#faf5ee` light, `#1a2420` dark everywhere Task 1’s manifest assertions look

- [ ] **Step 1: Confirm polish still fails** on `"theme_color": "#fffef9"`.

- [ ] **Step 2: Set** `export const PAPER_LIGHT = '#faf5ee';` and `export const PAPER_DARK = '#1a2420';` in `theme.ts`.

In `app.html` replace every `#fffef9` with `#faf5ee` and every `#131316` with `#1a2420` (three `theme-color` metas plus the bootstrap `dark ? ... : ...`).

In `manifest.webmanifest`: `"background_color"` and `"theme_color"` → `#faf5ee`.

In `manifest-dark.webmanifest`: both → `#1a2420`.

- [ ] **Step 3: Run** `cd app && pnpm test src/lib/polish.test.ts`

Expected: PASS.

- [ ] **Step 4: Run** `cd app && pnpm test src/lib/theme.test.ts`

Expected: PASS (behavior unchanged).

- [ ] **Step 5: Commit** `feat(ui): align theme-color chrome with Botanical paper`

---

### Task 4: High-contrast overrides

**Files:**
- Modify: `app/src/app.css` (`@media (prefers-contrast: more)` and the dark+contrast clone)
- Test: `app/src/lib/polish.test.ts` (no new file)

**Interfaces:**
- Consumes: light/dark token names from Task 2
- Produces: moss/rose contrast overrides instead of 태극 red

- [ ] **Step 1: Add a polish assertion** that the contrast media block is not still 태극:

```ts
	it('uses moss and rose under prefers-contrast, not 태극 red', () => {
		expect(appCss).not.toMatch(/prefers-contrast:\s*more\)[\s\S]{0,400}--accent:\s*#8a2a22/);
		expect(appCss).toMatch(/prefers-contrast:\s*more\)[\s\S]{0,400}--accent:\s*#1e3d2c/);
		expect(appCss).toMatch(/--rose:\s*#5c2c33/);
	});
```

Run `cd app && pnpm test src/lib/polish.test.ts` — expect FAIL.

- [ ] **Step 2: Replace the light `prefers-contrast: more` `:root` overrides with:**

```css
	--ink-faint: #4a4038;
	--rule: #b8a990;
	--rule-strong: #8a7a64;
	--accent: #1e3d2c;
	--accent-soft: #d5e4db;
	--rose: #5c2c33;
	--rose-soft: #f0d6d9;
```

Replace both dark contrast blocks with:

```css
	--ink-faint: #c5d1c4;
	--rule: #4a5c54;
	--rule-strong: #6a8076;
	--accent: #c5dbc5;
	--accent-soft: #24352d;
	--rose: #f0c9ce;
	--rose-soft: #3a2428;
```

- [ ] **Step 3: Run** `cd app && pnpm test src/lib/polish.test.ts` — expect PASS.

- [ ] **Step 4: Commit** `fix(ui): moss contrast overrides for Botanical Korea`

---

### Task 5: Specimen cards and paper grain

**Files:**
- Modify: `app/src/app.css` (`body`, `.card`)
- Test: `app/src/lib/polish.test.ts`

**Interfaces:**
- Consumes: `--paper-raised`, `--rule-strong`, `--s2`
- Produces: `.card` corner ticks; `body` grain background (not a stacking overlay)

- [ ] **Step 1: Write failing polish checks:**

```ts
	it('mounts cards as herbarium specimens without grain on the face', () => {
		const card = cssBlock(appCss, '.card {');
		expect(card).toMatch(/position:\s*relative/);
		expect(appCss).toMatch(/\.card::before/);
		expect(appCss).toMatch(/\.card::after/);
		expect(appCss).toMatch(/body\s*\{[\s\S]*background-image:/);
		expect(appCss).not.toMatch(/body::before[\s\S]{0,200}z-index:\s*1000/);
	});
```

Run `cd app && pnpm test src/lib/polish.test.ts` — expect FAIL.

- [ ] **Step 2: Update `.card`:**

```css
.card {
	position: relative;
	background: var(--paper-raised);
	border: 1px solid var(--rule);
	border-radius: var(--r-lg);
	box-shadow: var(--shadow-1);
}
.card::before,
.card::after {
	content: '';
	position: absolute;
	width: 12px;
	height: 12px;
	pointer-events: none;
	border-color: var(--rule-strong);
	border-style: solid;
	border-width: 0;
}
.card::before {
	inset-block-start: var(--s2);
	inset-inline-start: var(--s2);
	border-block-start-width: 1px;
	border-inline-start-width: 1px;
}
.card::after {
	inset-block-end: var(--s2);
	inset-inline-end: var(--s2);
	border-block-end-width: 1px;
	border-inline-end-width: 1px;
}
```

On `body`, keep `background: var(--paper)` and add a second layer (do **not** use a `position: fixed` `::before` overlay):

```css
	background-color: var(--paper);
	background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)' opacity='0.04'/%3E%3C/svg%3E");
```

If any `.card` site uses `overflow: hidden` in a way that clips ticks, do not add overflow on `.card` itself. Lab stage / trays / `.glyph` stay opaque `--paper-raised` or `--paper-sunk` (already true).

- [ ] **Step 3: Run** `cd app && pnpm test src/lib/polish.test.ts` — expect PASS.

- [ ] **Step 4: Commit** `feat(ui): specimen card ticks and hanji grain`

---

### Task 6: Due/resume use rose; actions stay moss

**Files:**
- Modify: `app/src/routes/+page.svelte`
- Modify: `app/src/routes/+layout.svelte`
- Modify: `app/src/routes/review/+page.svelte`
- Test: `app/src/lib/polish.test.ts` (raw source asserts)

**Interfaces:**
- Consumes: `--rose`, `--rose-soft`, `--accent`
- Produces: queue/resume/hot on rose; brand, nav active, `.btn`, continue, start-here on moss

- [ ] **Step 1: Add failing polish checks** (imports already include `home`, `layout`, `review`):

```ts
	it('paints due and resume rose, and keeps primary actions moss', () => {
		const homeCss = styleBlock(home);
		const layoutCss = styleBlock(layout);
		const reviewCss = styleBlock(review);
		expect(home).toMatch(/chip-status due/);
		expect(homeCss).toMatch(/\.chip-status\.due\s*\{[^}]*var\(--rose\)/s);
		expect(homeCss).toMatch(/a\.stat\.hot:not\(\.quiet\)[^}]*var\(--rose\)/s);
		expect(homeCss).toMatch(/\.lab\.resume\s*\{[^}]*var\(--rose\)/s);
		expect(homeCss).toMatch(/\.chip-status\.go\s*\{[^}]*var\(--accent\)/s);
		expect(homeCss).toMatch(/\.continue\s*\{[^}]*var\(--accent\)/s);
		expect(layoutCss).toMatch(/\.badge\s*\{[^}]*var\(--rose\)/s);
		expect(layoutCss).toMatch(/nav a\.active\s*\{[^}]*var\(--accent\)/s);
		expect(reviewCss).toMatch(/\.stat\.hot\s*\{[^}]*var\(--rose\)/s);
	});
```

Run `cd app && pnpm test src/lib/polish.test.ts` — expect FAIL.

- [ ] **Step 2: Home** — change the resume chip from `chip-status go` to `chip-status due`. Keep start-here on `go`. In `<style>`:

```css
	a.stat.hot:not(.quiet) { border-color: var(--rose); background: var(--rose-soft); }
	a.stat.hot:not(.quiet) b { color: var(--rose); }
	.lab.resume { border-color: var(--rose); }
	.lab.resume .num { color: var(--rose); }
	.chip-status.due {
		color: var(--rose);
		background: var(--rose-soft);
		border-color: color-mix(in srgb, var(--rose) 30%, transparent);
	}
```

Leave `.continue` and `.chip-status.go` on `--accent`.

**Layout** `.badge`:

```css
	.badge {
		font-family: var(--mono);
		font-size: 0.62rem;
		background: var(--rose);
		color: var(--accent-ink);
		border-radius: var(--r-pill);
		padding: 0.05rem 0.36rem;
		font-variant-numeric: tabular-nums;
	}
```

Leave `.mark` and `nav a.active` on `--accent`. In `forced-colors`, keep `.badge` on `Highlight` as today.

**Review** `.stat.hot` only (leave `.bar i` and `.tag` on `--accent`):

```css
	.stat.hot { border-color: var(--rose); background: var(--rose-soft); }
	.stat.hot b { color: var(--rose); }
```

- [ ] **Step 3: Run** `cd app && pnpm test src/lib/polish.test.ts` — expect PASS.

- [ ] **Step 4: Commit** `feat(ui): use rose for due and resume`

---

### Task 7: Noto Serif KR subset

**Files:**
- Create: `app/static/fonts/NotoSerifKR-subset.woff2`
- Modify: `app/src/app.css` (`@font-face` + `--serif`)
- Modify: `app/src/routes/+layout.svelte` (preload)
- Test: `app/src/lib/polish.test.ts`

**Interfaces:**
- Consumes: existing sans subset coverage + English heading Latin
- Produces: `--serif: 'Noto Serif KR', ...` with `font-display: optional`

- [ ] **Step 1: Failing checks:**

```ts
	it('self-hosts Noto Serif KR for headings with optional display', () => {
		expect(appCss).toMatch(/font-family:\s*'Noto Serif KR'/);
		expect(appCss).toMatch(/NotoSerifKR-subset\.woff2/);
		expect(existsSync(new URL('../../static/fonts/NotoSerifKR-subset.woff2', import.meta.url))).toBe(true);
		expect(layout).toMatch(/NotoSerifKR-subset\.woff2/);
	});
```

Also keep `font-display: optional` (already asserted). Run tests — expect FAIL.

- [ ] **Step 2: Build the subset.** Download OFL [Noto Serif KR](https://fonts.google.com/specimen/Noto+Serif+KR) (static Regular, or the notofonts/korean release). Do not commit the full source. Put the TTF at `/tmp/NotoSerifKR.ttf`. From `app/`:

```bash
python3 - <<'PY'
from fontTools.ttLib import TTFont
sans = TTFont('static/fonts/NotoSansKR-subset.woff2')
cmap = sans.getBestCmap()
unicodes = sorted(cmap.keys())
open('/tmp/serif-unicodes.txt','w').write('\n'.join(f'U+{u:04X}' for u in unicodes))
print(len(unicodes), 'codepoints')
PY
pyftsubset /tmp/NotoSerifKR.ttf \
  --unicodes-file=/tmp/serif-unicodes.txt \
  --layout-features='*' \
  --flavor=woff2 \
  --output-file=static/fonts/NotoSerifKR-subset.woff2
```

If the file exceeds ~80KB, drop unused Latin extras; headings need ASCII plus punctuation used in lab titles. Keep `static/fonts/OFL.txt`.

- [ ] **Step 3: In `app.css`, add a second `@font-face` next to the sans one:**

```css
@font-face {
	font-family: 'Noto Serif KR';
	font-style: normal;
	font-weight: 400 600;
	font-display: optional;
	src: url('/fonts/NotoSerifKR-subset.woff2') format('woff2');
}
```

Set `--serif: 'Noto Serif KR', 'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif;`

In `+layout.svelte` duplicate the existing sans `<link rel="preload" ... NotoSansKR-subset.woff2 />` for `NotoSerifKR-subset.woff2`.

- [ ] **Step 4: Run** `cd app && pnpm test src/lib/polish.test.ts` — expect PASS.

- [ ] **Step 5: Commit** `feat(ui): self-host Noto Serif KR for headings`

---

### Task 8: Favicon mark

**Files:**
- Modify: `app/static/favicon.svg`
- Optional same sitting: `icon-192.png`, `apple-touch-icon.png`, `icon-maskable.png`, `og.png`
- Test: `app/src/lib/polish.test.ts`

**Interfaces:**
- Consumes: moss `#315c45`, cream `#fffdf8`
- Produces: tab icon that matches the brand `한`

- [ ] **Step 1: Failing check:**

```ts
	it('paints the favicon 한 on moss, not 태극 red', () => {
		const svg = readFileSync(new URL('../../static/favicon.svg', import.meta.url), 'utf8');
		expect(svg).toMatch(/fill="#315c45"/);
		expect(svg).not.toMatch(/#a4342b/);
	});
```

Run tests — expect FAIL.

- [ ] **Step 2: Set** `favicon.svg` rect fill `#315c45` and text fill `#fffdf8`. If PNG/OG export is available in the sitting, regenerate those four rasters from the same mark (1200×630 for `og.png`). If not, leave rasters and note them in the PR; SVG must ship.

- [ ] **Step 3: Run** `cd app && pnpm test src/lib/polish.test.ts && pnpm test && pnpm check`

Expected: all PASS.

- [ ] **Step 4: Manual** — `pnpm dev`, toggle theme on `/`, open a lab, `/review`, `/reference`. Confirm: moss Next button, rose review badge, no grain on the review glyph, specimen ticks on lab cards.

- [ ] **Step 5: Commit** `feat(ui): moss favicon for Botanical Korea`
