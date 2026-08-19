# Settings Appearance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let learners pick among four looks and Light/Dark/System on a Settings page, entered from a quiet person mark, with backup moved off the footer.

**Architecture:** Generate one stylesheet for all four `DesignSystem`s. Botanical Korea remains `:root` (no-JS / unknown). Runtime look is `html[data-look]`. Light/dark stays `data-theme`. An inline boot script (generated, not imported) stamps both attributes before first paint. Appearance keys stay in `localStorage` and out of the progress backup envelope.

**Tech Stack:** SvelteKit 2, Svelte 5, TypeScript, Vitest + jsdom, existing `app/src/lib/theme/*` token pipeline.

## Global Constraints

- Switch looks and light/dark together. All four looks ship: Botanical Korea (`botanicalKorea`), Taegeuk (`taegeuk`), Watercolor (`watercolor`), Academia (`academia`).
- Apply immediately, no reload, no Apply button.
- Entry is a person mark in the current ThemeToggle 44px slot. Accessible name Settings. Not a fourth labeled nav tab. Not footer-only.
- Header sun/moon goes away.
- Settings this slice: Appearance, then Backup. No Study block. No Account block. No fake Sign-in.
- Backup file does not include appearance. Look + light/dark stay device-local (`localStorage` only). Restore must not change look or color.
- Token source of truth stays `app/src/lib/theme/css.ts`. Components keep speaking `var(--ink)` / `var(--paper)` / ….
- Hangul stays on self-hosted Noto Sans KR. Extra Latin faces for Watercolor / Academia load when that look is selected (`font-display: swap` unless a face already specifies otherwise).
- Forced-colors and `prefers-reduced-motion` keep working.
- PWA manifest `theme_color` / icons stay the build-time default look (Botanical Korea). That lag is accepted, not a bug.
- Live `meta[name="theme-color"][data-resolved]` follows the current look’s paper for the resolved light/dark.
- Keys: `korean-theme` (`light` | `dark` | `system`, system = key absent), `korean-look` (the four ids). Default look: `botanicalKorea`. Default color: system.
- Persist and paint are separate. Callers paint first, then persist. Persist returns `boolean`.
- On Settings, if `writeLookId` or `writeThemePref` returns `false` this visit, append this exact sentence to the Backup note: `This browser did not save your look or color.` Do not flip `progress.durable` / `labSession.durable`.
- Locked look summaries (verbatim): Botanical Korea `Pressed-flowers paper and moss green.` / Taegeuk `Ink on paper, 태극 red and blue.` / Watercolor `Pigment washes on paper.` / Academia `Library lamp, scholarly serif.`
- Nav stays Labs / Review / Reference only.
- Work in `/workspace` on branch `cursor/settings-appearance-spec-376b`. Do not create another branch. Follow TDD. Run `cd /workspace/app && pnpm test <file>`. Before each commit run `cd /workspace/app && pnpm test`.
- The boot IIFE cannot `import`. `themeBootScript` may serialize the same branches as `resolveAppearanceBoot`. Drift is a test failure (jsdom boot vs `resolveAppearanceBoot`), not a reason to import in `app.html`.
- Svelte files: Svelte 5 runes. After writing a `.svelte` file, run Svelte MCP `svelte-autofixer` (or `npx @sveltejs/mcp svelte-autofixer <path>`) and fix issues before commit. No new hex in `.svelte` CSS rules (chip swatches may set `background` from palette fields).

## File map

- Create: `app/src/lib/theme/catalog.ts` — `LOOKS`, `LOOK_IDS`, `DEFAULT_LOOK_ID`, `isLookId`, `LookId`
- Create: `app/src/lib/theme/catalog.test.ts`
- Create: `app/src/lib/theme/look.ts` — `LOOK_KEY`, `readLookId`, `writeLookId`, `paperFor`
- Create: `app/src/lib/theme/look.test.ts`
- Create: `app/src/lib/theme/boot.ts` — `resolveAppearanceBoot`, `applyAppearanceDom`, `themeBootScript`
- Create: `app/src/lib/theme/boot.test.ts`
- Create: `app/src/lib/components/LookPicker.svelte`
- Create: `app/src/lib/components/LookPicker.test.ts`
- Create: `app/src/lib/components/SettingsLink.svelte`
- Create: `app/src/lib/components/SettingsLink.test.ts`
- Create: `app/src/routes/settings/+page.svelte`
- Create: `app/src/routes/settings/settings-page.test.ts`
- Modify: `app/src/lib/theme/types.ts` — required `summary: string`
- Modify: `app/src/lib/theme/systems/{botanicalKorea,taegeuk,watercolor,academia}.ts` — `summary`
- Modify: `app/src/lib/theme/css.ts` — `allDesignSystemsCss` + scoped selectors
- Modify: `app/src/lib/theme/css.test.ts`
- Modify: `app/src/lib/theme/placeholders.ts` — stamp all looks + `%%THEME_BOOT%%`
- Modify: `app/src/lib/theme/index.ts` — `writeThemePref` boolean; `applyTheme(pref, lookId)`; `applyLook`
- Modify: `app/src/lib/theme/index.test.ts`, `applyTheme.test.ts`
- Modify: `app/src/app.html` — `%%THEME_BOOT%%`
- Modify: `app/src/hooks.server.ts`
- Modify: `app/src/lib/domain/backup.test.ts`
- Modify: `app/src/routes/+layout.svelte` — SettingsLink; drop ThemeToggle and SiteFooter
- Modify: `app/src/routes/review/+page.svelte` — `/settings#backup`
- Modify: `app/src/lib/polish.test.ts`, `app/src/lib/shellLayout.test.ts`
- Delete: `app/src/lib/components/ThemeToggle.svelte`, `ThemeToggle.test.ts`, `SiteFooter.svelte`, `SiteFooter.test.ts`
- Do not modify PWA manifest generators except tests that must still assert Botanical Korea.

---

### Task 1: Catalog and locked summaries

**Files:**
- Modify: `app/src/lib/theme/types.ts`
- Modify: `app/src/lib/theme/systems/botanicalKorea.ts`, `taegeuk.ts`, `watercolor.ts`, `academia.ts`
- Modify: `app/src/lib/theme/css.test.ts` (fixture `summary`)
- Create: `app/src/lib/theme/catalog.ts`
- Test: `app/src/lib/theme/catalog.test.ts`

**Interfaces:**
- Consumes: existing `DesignSystem` objects
- Produces:
  - `DesignSystem.summary: string` (required)
  - `export const LOOK_IDS = ['botanicalKorea', 'taegeuk', 'watercolor', 'academia'] as const`
  - `export type LookId = (typeof LOOK_IDS)[number]`
  - `export const DEFAULT_LOOK_ID: LookId = 'botanicalKorea'`
  - `export const LOOKS: DesignSystem[]` in that order
  - `export function isLookId(value: string | null): value is LookId`

- [ ] **Step 1: Write the failing test** `app/src/lib/theme/catalog.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { DEFAULT_LOOK_ID, isLookId, LOOK_IDS, LOOKS } from './catalog';
import { botanicalKorea } from './systems/botanicalKorea';
import { taegeuk } from './systems/taegeuk';
import { watercolor } from './systems/watercolor';
import { academia } from './systems/academia';

describe('LOOKS catalog', () => {
	it('lists the four looks in picker order with locked summaries', () => {
		expect(LOOK_IDS).toEqual(['botanicalKorea', 'taegeuk', 'watercolor', 'academia']);
		expect(LOOKS.map((s) => s.id)).toEqual([...LOOK_IDS]);
		expect(DEFAULT_LOOK_ID).toBe('botanicalKorea');
		expect(LOOKS[0]).toBe(botanicalKorea);
		expect(LOOKS[1]).toBe(taegeuk);
		expect(LOOKS[2]).toBe(watercolor);
		expect(LOOKS[3]).toBe(academia);
		expect(botanicalKorea.summary).toBe('Pressed-flowers paper and moss green.');
		expect(taegeuk.summary).toBe('Ink on paper, 태극 red and blue.');
		expect(watercolor.summary).toBe('Pigment washes on paper.');
		expect(academia.summary).toBe('Library lamp, scholarly serif.');
	});

	it('accepts only the four ids', () => {
		expect(isLookId('botanicalKorea')).toBe(true);
		expect(isLookId('taegeuk')).toBe(true);
		expect(isLookId('watercolor')).toBe(true);
		expect(isLookId('academia')).toBe(true);
		expect(isLookId('system')).toBe(false);
		expect(isLookId('')).toBe(false);
		expect(isLookId(null)).toBe(false);
	});
});
```

- [ ] **Step 2: Run** `cd /workspace/app && pnpm test src/lib/theme/catalog.test.ts`

Expected: FAIL — `catalog.ts` not found (or `summary` missing on systems).

- [ ] **Step 3: Implement**

`types.ts` — add `summary: string` after `name: string` on `DesignSystem`.

Each system object, immediately after `name:`:

- botanicalKorea: `summary: 'Pressed-flowers paper and moss green.',`
- taegeuk: `summary: 'Ink on paper, 태극 red and blue.',`
- watercolor: `summary: 'Pigment washes on paper.',`
- academia: `summary: 'Library lamp, scholarly serif.',`

`catalog.ts`:

```ts
import { academia } from './systems/academia';
import { botanicalKorea } from './systems/botanicalKorea';
import { taegeuk } from './systems/taegeuk';
import { watercolor } from './systems/watercolor';
import type { DesignSystem } from './types';

export const LOOK_IDS = ['botanicalKorea', 'taegeuk', 'watercolor', 'academia'] as const;
export type LookId = (typeof LOOK_IDS)[number];
export const DEFAULT_LOOK_ID: LookId = 'botanicalKorea';
export const LOOKS: DesignSystem[] = [botanicalKorea, taegeuk, watercolor, academia];

export function isLookId(value: string | null): value is LookId {
	return value === 'botanicalKorea' || value === 'taegeuk' || value === 'watercolor' || value === 'academia';
}
```

Add `summary: 'Fixture look.'` to the `fixture` in `css.test.ts` (and any `DesignSystem` object that spreads without summary).

- [ ] **Step 4: Run** `cd /workspace/app && pnpm test src/lib/theme/catalog.test.ts src/lib/theme/css.test.ts src/lib/theme/systems`

Expected: PASS

- [ ] **Step 5: Commit** `feat(theme): add look catalog and locked summaries`

---

### Task 2: Look persistence and boolean theme writes

**Files:**
- Create: `app/src/lib/theme/look.ts`
- Test: `app/src/lib/theme/look.test.ts`
- Modify: `app/src/lib/theme/index.ts` (`writeThemePref` → `boolean`)
- Test: extend `app/src/lib/theme/index.test.ts` for write success/failure

**Interfaces:**
- Consumes: `LookId`, `DEFAULT_LOOK_ID`, `isLookId`, `LOOKS` from catalog
- Produces:
  - `export const LOOK_KEY = 'korean-look'`
  - `export function readLookId(): LookId` — missing/garbage/unknown/`localStorage` throw → `DEFAULT_LOOK_ID`. **Must not** `setItem`/`removeItem` on read.
  - `export function writeLookId(id: LookId): boolean` — persist only; `true` on success, `false` on throw; does not touch the DOM
  - `export function paperFor(id: LookId, resolved: 'light' | 'dark'): string` — that system’s `light.paper` / `dark.paper`
  - `writeThemePref(pref: ThemePref): boolean` — same remove-key-on-system behavior as today; return `false` on throw; does not touch the DOM

- [ ] **Step 1: Write failing tests** in `look.test.ts` (`// @vitest-environment jsdom`) covering: round-trip `taegeuk`; `readLookId` with missing, `''`, `'nope'` returns `botanicalKorea` and does not rewrite storage (spy `setItem`); `localStorage.getItem` throw returns default; `writeLookId` when `setItem` throws returns `false` and does not change `data-look`; `paperFor('academia', 'dark')` equals `academia.dark.paper`.

In `index.test.ts` add jsdom tests: `writeThemePref('dark')` sets `korean-theme`; `writeThemePref('system')` removes the key; when `setItem` throws, returns `false`.

- [ ] **Step 2: Run** `cd /workspace/app && pnpm test src/lib/theme/look.test.ts src/lib/theme/index.test.ts`

Expected: FAIL — `look.ts` missing; `writeThemePref` still `void`.

- [ ] **Step 3: Implement** `look.ts` and change `writeThemePref` to:

```ts
export function writeThemePref(pref: ThemePref): boolean {
	try {
		if (pref === 'system') localStorage.removeItem(THEME_KEY);
		else localStorage.setItem(THEME_KEY, pref);
		return true;
	} catch {
		return false;
	}
}
```

ThemeToggle may ignore the boolean until Task 8. Re-export `LOOK_KEY`, `readLookId`, `writeLookId`, `paperFor`, `isLookId`, `LOOKS`, `DEFAULT_LOOK_ID` from `index.ts` if that matches existing export style; otherwise import from `look.ts`/`catalog.ts` directly in later tasks.

- [ ] **Step 4: Run** `cd /workspace/app && pnpm test`

Expected: PASS (ThemeToggle still compiles).

- [ ] **Step 5: Commit** `feat(theme): persist korean-look and report theme write success`

---

### Task 3: Appearance boot resolver and generated IIFE

**Files:**
- Create: `app/src/lib/theme/boot.ts`
- Test: `app/src/lib/theme/boot.test.ts` (`// @vitest-environment jsdom`)

**Interfaces:**
- Consumes: `LOOK_IDS` / `DEFAULT_LOOK_ID` conceptually (pass `knownLookIds` as an argument; do not hardcode a fifth id)
- Produces:

```ts
export interface AppearanceBootInput {
	look: string | null;
	theme: string | null;
	prefersDark: boolean;
	knownLookIds: readonly string[];
}

export interface AppearanceBoot {
	look: string;
	themeAttr: 'light' | 'dark' | null;
	dark: boolean;
}

export function resolveAppearanceBoot(input: AppearanceBootInput): AppearanceBoot

export function applyAppearanceDom(
	root: HTMLElement,
	boot: AppearanceBoot,
	papers: Record<string, { light: string; dark: string }>,
	themeColor: HTMLMetaElement | null,
	colorScheme: HTMLMetaElement | null
): void

export function themeBootScript(lookPapers: Record<string, { light: string; dark: string }>): string
```

Rules for `resolveAppearanceBoot` (match today’s theme boot + spec):
- `look` is `input.look` if `knownLookIds` includes it, else `'botanicalKorea'`
- `themeAttr` is `'light'` | `'dark'` only when `input.theme` is exactly that; otherwise `null` (system)
- `dark` is `true` when `themeAttr === 'dark'` OR (`themeAttr !== 'light'` AND `prefersDark`) — same as `app.html` today: `t === 'dark' || (t !== 'light' && prefersDark)`
- Does not write `localStorage`

`applyAppearanceDom`:
- always `root.setAttribute('data-look', boot.look)`
- if `themeAttr`: set `data-theme`, `root.style.colorScheme = themeAttr`, color-scheme meta to `themeAttr`
- if `themeAttr` is null: do not set `data-theme` (leave as-is or remove — boot script on first paint: only set when light/dark, matching current `app.html` which does not remove a prerendered attribute; prerendered HTML has no `data-theme`. Generated IIFE must match current `app.html`: only set `data-theme` for explicit light/dark)
- theme-color content = `papers[boot.look][boot.dark ? 'dark' : 'light']` when present

`themeBootScript`:
- returns an IIFE string wrapped in `try/catch` so it never throws
- reads `localStorage.getItem('korean-look')` and `getItem('korean-theme')` inside an inner try (blocked storage → nulls)
- uses `matchMedia('(prefers-color-scheme: dark)')`
- embeds `lookPapers` as JSON
- known ids = `Object.keys(lookPapers)`
- applies the same look/themeAttr/dark rules as `resolveAppearanceBoot`
- does not `setItem`/`removeItem`

- [ ] **Step 1: Write failing tests** for the matrix: missing look+theme+prefersDark true → look `botanicalKorea`, themeAttr null, dark true; look `taegeuk` + theme `light` + prefersDark true → look taegeuk, themeAttr light, dark false; unknown look `'nope'` → botanicalKorea without implying a write; theme `'auto'` → system. jsdom: `themeBootScript` eval with stubbed localStorage sets `data-look`/`data-theme`/`theme-color` to match `resolveAppearanceBoot` + `applyAppearanceDom` for the same inputs. Blocked `getItem` (throw) still paints defaults and does not throw. Unknown look in storage is not rewritten (spy setItem, call count 0).

- [ ] **Step 2: Run** `cd /workspace/app && pnpm test src/lib/theme/boot.test.ts`

Expected: FAIL — module missing.

- [ ] **Step 3: Implement `boot.ts`.** Keep `resolveAppearanceBoot` as the source of the branches; the IIFE may duplicate those branches. Tests prove they agree.

- [ ] **Step 4: Run** `cd /workspace/app && pnpm test src/lib/theme/boot.test.ts`

Expected: PASS

- [ ] **Step 5: Commit** `feat(theme): generate appearance boot script from a tested resolver`

---

### Task 4: All-look CSS

**Files:**
- Modify: `app/src/lib/theme/css.ts`
- Test: `app/src/lib/theme/css.test.ts`

**Interfaces:**
- Consumes: `DesignSystem`, existing `designSystemCss(system)` (keep `:root` behavior for single-system tests)
- Produces: `export function allDesignSystemsCss(systems: readonly DesignSystem[], fallbackId: string): string`

Emission rules:
- Unique `@font-face` for the union of `systems.fonts` (dedupe on `family` + `file` + `style` + `weight` + `unicodeRange`). Keep each face’s existing `font-display`.
- Fallback system (`id === fallbackId`, else `systems[0]`) still emits today’s `:root`, `:root[data-theme='dark']`, `@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) }`, and `:root` contrast-more blocks (so no-JS stays Botanical Korea).
- Every system, including the fallback, also emits:
  - `html[data-look='<id>'] { … light tokens, type, shape, html-size, leading }`
  - `html[data-look='<id>'][data-theme='dark'] { … dark palette }`
  - `@media (prefers-color-scheme: dark) { html[data-look='<id>']:not([data-theme='light']) { … dark palette } }`
  - `prefers-contrast: more` overrides using those look selectors, **not** only `:root`. A Taegeuk attributed block must not be required to match Botanical Korea contrast hexes.
- Do not emit `html {` or `body {` type-only rules (attribute selectors on `html` are required).

Refactor `designSystemCss` to share `tokenBlocks(system, rootSelector)` rather than copy-paste four times.

- [ ] **Step 1: Write failing tests** using two tiny fixtures (`alpha` paper `#aaaaaa` with contrastMoreLight accent `#111111`, `beta` paper `#bbbbbb` with contrastMoreLight accent `#222222`). `allDesignSystemsCss([alpha, beta], 'alpha')` contains `:root` `--paper: #aaaaaa`, `html[data-look='beta']` `--paper: #bbbbbb`, `html[data-look='beta'][data-theme='dark']`, and contrast-more `--accent: #222222` next to `html[data-look='beta']`. Slice the contrast-more section: `html[data-look='beta']` block must not contain alpha’s `#111111` accent. Also assert `html[data-look='alpha']` exists. Existing `designSystemCss(fixture)` tests must still pass (still `:root`, still `not.toMatch(/html\s*\{/)`).

- [ ] **Step 2: Run** `cd /workspace/app && pnpm test src/lib/theme/css.test.ts`

Expected: FAIL — `allDesignSystemsCss` missing.

- [ ] **Step 3: Implement.** Add `summary` to any new fixtures.

- [ ] **Step 4: Run** `cd /workspace/app && pnpm test src/lib/theme/css.test.ts src/lib/theme/systems src/lib/polish.test.ts`

Expected: PASS (`polish.test.ts` still uses `designSystemCss(activeSystem)` for Noto / `:root` BK).

- [ ] **Step 5: Commit** `feat(theme): emit scoped CSS for every look`

---

### Task 5: Stamp all looks, applyLook, current-look theme-color

**Files:**
- Modify: `app/src/lib/theme/placeholders.ts`
- Modify: `app/src/app.html`
- Modify: `app/src/hooks.server.ts`
- Modify: `app/src/lib/theme/index.ts` — `applyTheme(pref, lookId?)`, `applyLook(id)`
- Modify: `app/src/lib/theme/applyTheme.test.ts`
- Modify: `app/src/lib/theme/css.test.ts` (`applyDesignSystem` signature)
- Modify: `app/src/lib/polish.test.ts` (the `applyDesignSystem(appHtml, activeSystem)` call)

**Interfaces:**
- Consumes: `allDesignSystemsCss`, `themeBootScript`, `LOOKS`, `paperFor`, `readLookId`, `resolvedTheme`
- Produces:
  - `export const BOOT_PLACEHOLDER = '%%THEME_BOOT%%'`
  - `export function applyDesignSystem(html: string, systems: readonly DesignSystem[], fallback: DesignSystem): string` replaces `%%DESIGN_SYSTEM_CSS%%` with `allDesignSystemsCss(systems, fallback.id)`, paper placeholders with **fallback** papers, `%%THEME_BOOT%%` with `themeBootScript({ [id]: { light, dark } })` for every system in `systems`
  - `applyTheme(pref: ThemePref, lookId: LookId = readLookId()): void` — existing data-theme / color-scheme behavior; `theme-color` meta uses `paperFor(lookId, resolvedTheme(pref))` not `PAPER_LIGHT`/`PAPER_DARK` when a non-default look is selected. Keep exporting `PAPER_LIGHT`/`PAPER_DARK` as Botanical Korea for manifests/tests.
  - `applyLook(id: LookId, pref: ThemePref = readThemePref()): void` — `document.documentElement.setAttribute('data-look', id)` then `applyTheme(pref, id)`. DOM only.

`app.html`: replace the current inline boot function body with `%%THEME_BOOT%%` (keep the `<script>` tag). Keep `%%DESIGN_PAPER_LIGHT%%` / `%%DESIGN_PAPER_DARK%%` on the meta tag as Botanical Korea no-JS defaults.

`hooks.server.ts`: `applyDesignSystem(html, LOOKS, activeSystem)`.

- [ ] **Step 1: Write failing tests**
  - `applyDesignSystem` with two fixtures + `%%THEME_BOOT%%` + CSS placeholder: stamped HTML contains both look selectors and does not contain `%%THEME_BOOT%%`.
  - `applyTheme('dark', 'academia')` writes academia dark paper onto `theme-color` (not `PAPER_DARK` if they differ).
  - `applyLook('taegeuk')` sets `data-look='taegeuk'`.
  - `polish.test.ts` / `css.test.ts` call sites updated in the same change set so they compile.

- [ ] **Step 2: Run focused tests** — expect FAIL on old `applyDesignSystem(html, fixture)` arity and missing boot placeholder.

- [ ] **Step 3: Implement.** Update every `applyDesignSystem(` call site in the repo.

- [ ] **Step 4: Run** `cd /workspace/app && pnpm test`

Expected: PASS. Manifest tests still Botanical Korea.

- [ ] **Step 5: Commit** `feat(theme): stamp all looks and paint theme-color from the current look`

---

### Task 6: Settings Appearance (look cards + Color radios)

**Files:**
- Create: `app/src/lib/components/LookPicker.svelte`
- Create: `app/src/routes/settings/+page.svelte` (Appearance only is OK if Backup heading is a stub; prefer both headings with Backup empty until Task 7 — **do not** leave a stub Backup. If Backup is not ready, omit the Backup section until Task 7 and do not put `id="backup"` on a fake block.)
- Test: `app/src/lib/components/LookPicker.test.ts` and `app/src/routes/settings/settings-page.test.ts` (`// @vitest-environment jsdom`, `mount` like `ProgressBackup.test.ts`)

**Interfaces:**
- Consumes: `LOOKS`, `readLookId`, `writeLookId`, `applyLook`, `readThemePref`, `writeThemePref`, `applyTheme`, `isLookId`, `themePrefLabel` if useful
- Produces: Settings route with `h1` Settings, document title `Settings`, shell `max-width: var(--shell)`, `h2` Appearance, fieldset legend `Look` (four radio cards), fieldset legend `Color` (Light, Dark, System).

Look card (each `LOOKS` entry): radio `name="look"` `value={system.id}`; visible **name**; **summary**; four decorative chips (`aria-hidden="true"`) for `paper`, `ink`, `accent`, `rose` using that system’s palette for the **currently resolved** color (`resolvedTheme(pref, prefersDark)`). Selecting a card: `applyLook(id)` then `writeLookId(id)`. If write is `false`, set a bindable/callback `onPersistFail` that the page stores as `appearanceSaved = false` (page-level state for Task 7).

Color radios: `name="color"` values `light` | `dark` | `system`. On change: `applyTheme(pref)` then `writeThemePref(pref)` (paint first). Same persist-fail callback.

No Apply button. No navigation on select. Use `resolve` only if linking.

Run Svelte autofixer on new `.svelte` files.

- [ ] **Step 1: Write failing tests**
  - Page source/mount: `<title>Settings</title>`, `h1` Settings, `h2` Appearance, four radios with locked names+summaries, Color radios Light/Dark/System.
  - Click Taegeuk card → `document.documentElement.dataset.look === 'taegeuk'` (or `getAttribute('data-look')`).
  - Click Dark → `data-theme === 'dark'`.
  - Click System → `data-theme` absent.
  - `max-width: var(--shell)` in page CSS. Not `.shell.narrow`.

- [ ] **Step 2: Run tests** — FAIL (route missing).

- [ ] **Step 3: Implement LookPicker + settings page.** Tokens only in CSS. 44px radio hit targets. `prefers-reduced-motion` / `forced-colors` on cards as for other chrome.

- [ ] **Step 4: Run** `cd /workspace/app && pnpm test src/lib/components/LookPicker.test.ts src/routes/settings/settings-page.test.ts` then full `pnpm test`. Autofixer clean.

- [ ] **Step 5: Commit** `feat(settings): add appearance look picker and color radios`

---

### Task 7: Backup on Settings, delete footer, review deep link

**Files:**
- Modify: `app/src/routes/settings/+page.svelte` — Backup section
- Modify: `app/src/routes/+layout.svelte` — remove `SiteFooter` import and `{#if !labRoute}<SiteFooter />{/if}`
- Modify: `app/src/routes/review/+page.svelte` — both warning links
- Modify: `app/src/lib/domain/backup.test.ts`
- Modify: `app/src/lib/shellLayout.test.ts`
- Modify: `app/src/lib/polish.test.ts` (every `siteFooter` usage)
- Delete: `app/src/lib/components/SiteFooter.svelte`, `SiteFooter.test.ts`
- Test: extend `settings-page.test.ts`

**Interfaces:**
- Consumes: `wrapExport`, `unwrapImport`, `storageNeedsBackup` copy from today’s `SiteFooter.svelte` (`exportJson`/`importJson` identical wiring). `ProgressBackup`.
- Produces: section `id="backup"` containing `h2` Backup, the footer’s backup **note copy** (corrupt vs durable vs precaution), `ProgressBackup`. Not a `<details>` fold. `#backup { scroll-margin-top: calc(44px + env(safe-area-inset-top) + 0.75rem); }` (sticky `.bar` is 44px + safe area).
- If `appearanceSaved === false`, append a sentence to that note: `This browser did not save your look or color.`
- Review links: `href="{resolve('/settings')}#backup"` instead of `href="#progress-backup"`.
- `wrapExport` JSON keys are only `kind`, `version`, `srs`, `sessions`. `unwrapImport` of a v2 file that also has `look`/`theme` still returns srs+sessions. Do not extract a new `backupActions` module. Test extra fields on `unwrapImport`, and assert settings page source does not call `writeLookId` / `writeThemePref` / `applyLook` inside `importJson`.

Polish / shellLayout: stop importing SiteFooter. Backup copy assertion moves to settings page raw import. Drop `.backup-fold` hover/active/44px assertions (those belonged to the disclosure). Keep “backup off Review sitting” (`review` has no `ProgressBackup`). Logical-properties list: replace `siteFooter` with settings page. Chrome fascicle string: replace `siteFooter` with settings page; expect Backup `h2` / note, not the old summary.

- [ ] **Step 1: Write failing tests** (backup keys, extra look field ignored, settings `#backup`, review href, layout has no SiteFooter). Run — FAIL.

- [ ] **Step 2: Implement.** Delete SiteFooter files. Update polish/shellLayout in this task so `pnpm test` is green.

- [ ] **Step 3: Persist-fail sentence test:** mount settings, stub `writeLookId` to return false (or stub `localStorage.setItem` to throw on `korean-look`), select a look, expect the Backup note to include `This browser did not save your look or color.`

- [ ] **Step 4: Run** `cd /workspace/app && pnpm test`

Expected: PASS

- [ ] **Step 5: Commit** `feat(settings): move progress backup onto Settings`

---

### Task 8: Person-mark Settings entry; delete ThemeToggle

**Files:**
- Create: `app/src/lib/components/SettingsLink.svelte`
- Test: `app/src/lib/components/SettingsLink.test.ts`
- Modify: `app/src/routes/+layout.svelte` — replace `<ThemeToggle />` with `<SettingsLink />` **outside** `nav aria-label="Main navigation"`
- Modify: `app/src/lib/theme/index.ts` — delete `nextThemePref`, `themeToggleGlyph`, `themeToggleLabel` if unused
- Modify: `app/src/lib/theme/index.test.ts` — drop toggle-helper tests
- Modify: `app/src/lib/polish.test.ts` — ThemeToggle → SettingsLink
- Delete: `app/src/lib/components/ThemeToggle.svelte`, `ThemeToggle.test.ts`

**Interfaces:**
- Produces: `<a href={resolve('/settings')} class="settings" aria-label="Settings" title="Settings" aria-current={onSettings ? 'page' : undefined}>` with person-silhouette SVG (`aria-hidden="true"`, viewBox `0 0 24 24`, stroke `currentColor` width 2, ~1.05rem icon). Bust + shoulders, not a gear. Copy ThemeToggle’s 44px chrome (`.theme` rules → `.settings`), including `::before` border, hover, `:active`, `:focus-visible`, `prefers-reduced-motion`, `forced-colors`. `onSettings` when `page.url.pathname === '/settings' || page.url.pathname === '/settings/'`.

Polish replacements:
- `expect(layout).toMatch(/ThemeToggle/)` → SettingsLink, and `not.toMatch(/ThemeToggle/)`
- `themeToggle` `.theme:active` → SettingsLink `:active`
- `styleBlock(themeToggle)` 44px → SettingsLink
- nav still Labs / Review / Reference only; layout must not add a fourth labeled tab
- drop `import themeToggle from '...ThemeToggle...'`

- [ ] **Step 1: Write failing SettingsLink source tests** (44px, aria-label Settings, person path/circle, `aria-current`, no gear). Layout test: no ThemeToggle, has SettingsLink. Run — FAIL.

- [ ] **Step 2: Implement.** Autofixer on SettingsLink. Delete ThemeToggle. Grep the repo for `ThemeToggle`, `nextThemePref`, `themeToggleGlyph`, `themeToggleLabel`, `SiteFooter` — zero production references.

- [ ] **Step 3: Run** `cd /workspace/app && pnpm test` and `cd /workspace/app && pnpm check`

Expected: PASS, svelte-check clean.

- [ ] **Step 4: Commit** `feat(settings): replace theme toggle with a Settings person mark`

---

## Spec coverage

| Spec item | Task |
|---|---|
| `summary` + catalog order | 1 |
| `korean-look` read/write, no clobber on bad read | 2 |
| `writeThemePref` boolean | 2 |
| Boot resolver + generated IIFE + jsdom | 3 |
| `allDesignSystemsCss` + per-look contrast | 4 |
| Stamp CSS/boot, `applyLook`, live theme-color from look | 5 |
| Look cards + Color radios, immediate apply | 6 |
| Backup section, delete footer, `#backup`, persist-fail sentence, envelope | 7 |
| Person mark, delete sun/moon, polish/nav | 8 |
| Manifests stay BK | 5 (no manifest rewrite) |
| Font preload stays `activeSystem.fonts` | unchanged in layout (verify Task 8 does not switch preloads to all looks) |
