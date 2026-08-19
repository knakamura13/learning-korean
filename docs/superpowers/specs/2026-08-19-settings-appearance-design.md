# Settings appearance (looks + light/dark)

**Date:** 2026-08-19
**Status:** ready to implement (written spec pending review)
**Problem:** Learners cannot switch among the four existing design systems. Light/dark lives in a header sun/moon that will not scale once account/sign-on and study prefs arrive. Looks are compile-time (`activeSystem`); unused systems sit on disk.

This spec is the appearance + Settings shell only. Accounts, backend, sync, and daily-new-card UI are later work on the same page, not this slice.

## Constraints (non-negotiable)

- Switch **looks and light/dark together**. All four looks ship: Botanical Korea, Taegeuk, Watercolor, Academia.
- Apply **immediately**, no reload, no Apply button.
- Entry is a **person mark** in the current `ThemeToggle` 44px slot. Accessible name **Settings**. Not a fourth labeled nav tab. Not footer-only.
- Header sun/moon **goes away**.
- Settings this slice: **Appearance**, then **Backup**. No Study block. No Account block. No fake Sign-in.
- Backup file **does not include appearance**. Look + light/dark stay device-local (`localStorage` only). Restore must not change look or color.
- Token source of truth stays `app/src/lib/theme/css.ts` (generated from `DesignSystem` objects). Components keep speaking `var(--ink)` / `var(--paper)` / … .
- Hangul stays on self-hosted Noto Sans KR. Extra Latin faces for Watercolor / Academia load when that look is selected (`font-display: swap`).
- Forced-colors and `prefers-reduced-motion` keep working.
- PWA **manifest** `theme_color` / icons stay the **build-time default look** (Botanical Korea). That lag is accepted, not a bug.

A prior hybrid-shell plan forbade a Settings page. This spec supersedes that for Settings entry and appearance.

## Approaches considered

**1. `data-look` on `<html>` (locked).** Generate CSS for all four looks, scoped as `html[data-look='…']` beside existing `data-theme`. Boot script stamps both attributes before first paint. One stylesheet. Chosen: matches today’s FOUC strategy, keeps tokens as the source of truth, no extra network hop.

**2. JS-written CSS variables.** On look change, set each `--ink` / `--paper` from the system object. Smaller CSS; first paint still needs an inline map or a flash; contrast-more and type/shape tokens must be copied by hand; easy to drift from `css.ts`. Rejected.

**3. Swap a whole stylesheet.** Four CSS URLs, or one URL per look. Clean isolation; costs a fetch and a possible flash; PWA/offline must precache all four. Rejected for this app’s local-first first paint.

## Architecture

### Surfaces

- **Header:** drop `ThemeToggle`. In that same slot, a person-silhouette control linking to `/settings`. Visually unlabeled. Accessible name **Settings**. `aria-current="page"` when the path is `/settings`. Stays in the header on lab routes (the sun/moon already did). Lives **outside** `nav aria-label="Main navigation"` — not a fourth tab.
- **`/settings`:** a real route in the same chrome as Labs / Review / Reference (not a lab sitting). Page title **Settings**. Two stacked sections, in order: **Appearance**, then **Backup**. Do not draw empty Study or Account placeholders.
- **Footer:** today’s `SiteFooter` is only the backup fold. Once Backup moves to Settings, **stop rendering it and delete `SiteFooter.svelte`** (and its tests). Do not invent branding or links to fill the hole. Lab routes already omit the footer.

### Appearance

- Four named look cards, then a **Color** radio group: Light, Dark, System.
- Choosing a look writes `korean-look` and sets `document.documentElement.dataset.look` immediately.
- Choosing Color writes `korean-theme` (same key and `'light' | 'dark' | 'system'` values as today) and runs the existing `applyTheme` path immediately.
- Default look if `localStorage` is missing or the id is unknown: **Botanical Korea** (`botanicalKorea`).
- Default color if missing/invalid: **System**, as today.

### CSS

- Keep `designSystemCss(system)` for a single system (tests, fixtures). Add `allDesignSystemsCss(systems)` that emits **all four** in catalog order, stamped into `app.html` as `%%DESIGN_SYSTEM_CSS%%`.
- Botanical Korea remains the **unattributed fallback**: `:root` (and today’s dark / `prefers-color-scheme` / `prefers-contrast: more` clones) still paint Botanical Korea when `data-look` is absent (no JS).
- Each look, including Botanical Korea, also has an attributed block: `html[data-look='botanicalKorea']`, `html[data-look='taegeuk']`, `html[data-look='watercolor']`, `html[data-look='academia']`.
- Dark per look: `html[data-look='…'][data-theme='dark']`, plus `prefers-color-scheme: dark` clones keyed the same way as today (`:not([data-theme='light'])`) **per look**, not only on `:root`.
- `prefers-contrast: more` overrides are **per look**, not only `:root`. A Taegeuk user in contrast-more must not receive Botanical Korea contrast overrides.
- `@font-face` for every look lives in that one stylesheet. Duplicate family/file pairs may be deduped. `font-display: swap` unless a face already specifies otherwise (Hangul Noto may stay `optional` as today).

### Build-time default vs runtime look

- Keep `activeSystem` as the **default / build-time** system: Botanical Korea. It feeds PWA manifests, font **preloads** in `+layout.svelte`, and no-JS `:root` tokens.
- Runtime look is `html[data-look]`, not a reassignment of `activeSystem`. Learners no longer prototype a look by editing `active.ts`.
- Export a catalog used by CSS generation and the picker, in this order:

  | `id` | `name` |
  |---|---|
  | `botanicalKorea` | Botanical Korea |
  | `taegeuk` | Taegeuk |
  | `watercolor` | Watercolor |
  | `academia` | Academia |

### PWA / `theme-color`

- **Manifest files** (`manifest.webmanifest`, `manifest-dark.webmanifest`) stay Botanical Korea paper at build time. Switching look does not rewrite them.
- The **live** `meta[name="theme-color"][data-resolved]` tag **does** follow the current look’s paper for the resolved light/dark (today `applyTheme` already updates this tag for color; it must read paper from the **selected look**, not only `activeSystem`). Browser chrome may still show Botanical Korea when the OS reads the manifest instead of the meta tag. Accepted.

## Components

### Header — `SettingsLink`

New control in `+layout.svelte` replacing `ThemeToggle`.

- `<a href={resolve('/settings')}>` with the same 44px hit target and chrome treatment as today’s `.theme` button (bordered 44px slot, accent ink, hover raise).
- Person-silhouette SVG: 24×24 viewBox, stroke `currentColor` width 2, `aria-hidden="true"`, icon about `1.05rem` (match the sun/moon). Bust and shoulders, not a gear.
- Visually no text. `aria-label="Settings"` (and `title="Settings"`).
- `aria-current="page"` when `page.url.pathname` is `/settings` (with or without a trailing slash). Not current on other routes.
- Delete `ThemeToggle.svelte` and its glyph/cycle helpers (`nextThemePref`, `themeToggleGlyph`, `themeToggleLabel`) once Settings Color radios exist.

### Settings page — `app/src/routes/settings/+page.svelte`

- Document title: `Settings` (same short pattern as Review’s `Daily review`).
- Visible `h1`: Settings.
- Shell: `max-width: var(--shell)` (home/reference width), **not** Review’s `.shell.narrow`. Look cards need the room.
- `h2` **Appearance**, then a Backup **section** (`id="backup"`) containing `h2` **Backup**, so `/settings#backup` works without JS. Give `#backup` `scroll-margin-top` matching the sticky header so the heading is not hidden under `.bar`.

### Look picker

- A `fieldset` (legend **Look**) of four **radio cards**, not a dropdown, not swatches-only.
- Card content, in order: **name**, one-line summary, row of four token chips (**paper**, **ink**, **accent**, **rose**).
- Locked summaries (do not invent marketing copy at implementation time):

  | Look | Summary |
  |---|---|
  | Botanical Korea | Pressed-flowers paper and moss green. |
  | Taegeuk | Ink on paper, 태극 red and blue. |
  | Watercolor | Pigment washes on paper. |
  | Academia | Library lamp, scholarly serif. |

  Add required `summary: string` on `DesignSystem`. Picker reads `name` + `summary` from the catalog. Do not keep a second copy of these lines in the Svelte file.
- Chips use that look’s palette for the **currently resolved** color (light vs dark), so a dark Color choice shows dark papers on the cards. Chips are decorative (`aria-hidden`); the radio label is the name.
- Selected card is the current valid `korean-look`, or Botanical Korea if unset/unknown.
- Keyboard: native radio group (arrow keys). Click/select applies immediately.

### Color radios

- A second `fieldset` (legend **Color**) under the looks: Light, Dark, System.
- Same `korean-theme` values as today (`light` / `dark` / `system`). System still means “no `data-theme` attribute; follow `prefers-color-scheme`.”
- `writeThemePref('system')` still **removes** the key (today’s behavior).

### Backup on Settings

- Move the footer’s backup **note copy** and `ProgressBackup` here. Keep `ProgressBackup` as the control; change only its host.
- Do not wrap Backup in a collapsed `<details>` fold. It is a first-class section. The footer auto-open-when-not-durable behavior is unnecessary on this page.
- `exportJson` / `importJson` stay the current `wrapExport` / `unwrapImport` + `progress` / `labSession` wiring (today in `SiteFooter`).
- Storage-quota / corrupt warnings on Review (and anywhere else) change from `href="#progress-backup"` to `href="{resolve('/settings')}#backup"`.

### Non-UI modules

- Look helper next to theme helpers: `LOOK_KEY = 'korean-look'`, `isLookId`, `readLookId`, `writeLookId`, `applyLook`. Persist and paint are separate:
  - `readLookId`: missing, garbage, or unknown → `'botanicalKorea'`. Do **not** rewrite `localStorage` on load when the stored value is bad.
  - `writeLookId` / `writeThemePref`: persist only; return `boolean` (success). They do not touch the DOM.
  - `applyLook` / `applyTheme`: DOM + `theme-color` meta only. Callers **paint first, then persist**. If persist returns `false`, this visit still shows the new look/color.
- CSS generator + `applyDesignSystem`: stamp all-look CSS. Default `%%DESIGN_PAPER_LIGHT%%` / `%%DESIGN_PAPER_DARK%%` stay Botanical Korea for the no-JS meta tag. Per-look papers are embedded inside `themeBootScript` (not a second placeholder).
- Boot: `app/src/lib/theme/boot.ts` exports `resolveAppearanceBoot({ look, theme, prefersDark, knownLookIds })` (unit-tested) and `themeBootScript(lookPapers)` which **returns** the `app.html` IIFE as a string (the inline script cannot `import`). `applyDesignSystem` stamps that string over `%%THEME_BOOT%%`. Tests jsdom-run the generated script so it cannot drift from `resolveAppearanceBoot`.
- `+layout.svelte` font preloads: **only** `activeSystem.fonts` (Botanical Korea). Other looks rely on `@font-face`.

## Data flow

### Keys (device-local only)

| Key | Values | In backup envelope? |
|---|---|---|
| `korean-theme` | `'light' \| 'dark' \| 'system'` (system = key absent) | No |
| `korean-look` | `'botanicalKorea' \| 'taegeuk' \| 'watercolor' \| 'academia'` | No |

Study prefs and account later get their own keys. They do not ride on `korean-look`.

### First paint

1. Server/prerender stamps the all-look stylesheet and default (Botanical Korea) paper placeholders on the meta tag.
2. Inline boot script reads both keys. Unknown/missing look → `botanicalKorea`. Invalid theme → behave as system (no `data-theme`).
3. Script sets `data-look` always; sets `data-theme` only for explicit light/dark (same as today). Updates `theme-color` from the selected look’s paper and resolved dark/light.
4. Svelte hydrates. Settings radios/cards read the same helpers so UI matches the attributes.
5. A bad look key is **not** overwritten on load.

### Choosing a look

1. User selects a card → `applyLook` sets `html[data-look]` immediately → `writeLookId` persists.
2. CSS for that look is already in the page; no fetch, no reload.
3. Extra `@font-face` files for Watercolor / Academia download if needed (`font-display: swap`).
4. `theme-color` meta updates to that look’s paper for the current resolved color. Manifests unchanged.

### Choosing Color

1. `applyTheme` as today (paper for `theme-color` from the **current look**), then `writeThemePref`.
2. Dark token blocks are per-look as in Architecture.

### Backup / restore

- `wrapExport` still emits `{ kind, version, srs, sessions }` only. No `look`, no `theme`.
- `unwrapImport` ignores unknown fields. If a hand-edited file contains `look` / `theme`, they are not applied and the appearance keys are not written.
- After a successful restore, `data-look` and `data-theme` stay whatever they were on this device.

### Other tabs

- Cross-tab look sync is **not** required. A `storage` listener is extra, not a must.

## Error handling

### Boot / read

- `localStorage` throw (blocked, private mode, `SecurityError`): treat as no saved prefs. Botanical Korea + System. Boot script must not throw out of its `try`. Settings still renders.
- Unknown or empty `korean-look`: use `botanicalKorea` in memory/attributes. Do not clobber the stored string until the user next picks a look.
- Invalid `korean-theme`: System, as today.

### Write

- Look or color `setItem` fails: keep the in-session `data-*` (and `theme-color`) change so this visit still looks right; persist helper returns `false`.
- Do **not** set `progress.durable` / `labSession.durable` to false because an appearance write failed. That flag means study data is at risk.
- Do **not** add a look-specific toast. On Settings, if `writeLookId` or `writeThemePref` returns `false` this visit, append one sentence to the **existing Backup note** (same section, same voice): “This browser did not save your look or color.” Review-page warnings stay SRS/lab/corrupt only; they already link to `/settings#backup` when study storage is not durable.
- Partial success (one key writes, the other does not): UI matches what applied this session; next visit uses whichever keys survived.

### Backup / restore

- Appearance is not in the file. Extra fields never change `data-look` / `data-theme`.
- Existing backup parse / quarantine / durable behavior is unchanged. Failures stay in the Backup section, not Appearance.

### Fonts / CSS

- Extra Latin faces fail to load: swap to fallbacks; Hangul still paints. No error UI.
- A look id with no CSS block (bug): unmatched `data-look` falls through to `:root` Botanical Korea. Picker still shows four cards; selecting a look that has a block recovers.

### Navigation

- `/settings#backup` lands on the Backup section (`id="backup"`). Missing hash shows the top of Settings.
- Person mark on Settings: `aria-current` only; no error state.

## Testing

### Unit / module

- CSS generator: all four looks emit; each has light tokens and dark tokens keyed by `html[data-look='…']` (and dark/system/`prefers-contrast` variants). Botanical Korea remains the unmatched `:root` fallback.
- Contrast-more rules for look B must not apply while `data-look` is look A.
- Look helper: missing, garbage, unknown ids → `botanicalKorea`; valid ids round-trip; `localStorage` throw on read → default; throw on write → `false` and no key change; `applyLook` still sets `data-look` when the caller paints first; bad stored id is not rewritten on read.
- Boot: `resolveAppearanceBoot` matrix as above; generated `themeBootScript` run in jsdom sets both attributes from keys, unknown look → `botanicalKorea` without writing the key, `localStorage` throw → defaults, no throw.
- `applyTheme` / `applyLook`: `theme-color` meta uses the **current look’s** paper, not a hardcoded Botanical Korea constant, when a non-default look is selected.
- Backup: `wrapExport` JSON has no look/theme fields; import of a payload that includes them leaves `korean-look` / `korean-theme` unchanged.
- Settings Backup note includes “This browser did not save your look or color.” only after a failed appearance write this visit.

### Component / route

- Settings: four look cards with locked names + summaries, Color radios Light/Dark/System, Backup section `id="backup"` containing `ProgressBackup`.
- Selecting a look updates `document.documentElement.dataset.look` without navigation.
- Selecting Color updates `data-theme` the same way today’s toggle did (including System removing the attribute).
- Header: no `ThemeToggle`; person control accessible name Settings; `aria-current="page"` on `/settings` only.
- Layout/footer: no `ProgressBackup`, no `#progress-backup`.
- Review (and any other) storage warning links target `/settings#backup` (via `resolve`).
- Polish tests that currently require `ThemeToggle` in the header and backup copy in `SiteFooter` are updated to the person mark + Settings Backup. Labs / Review / Reference stay the only labeled nav items.

### Manual / visual (implementation, not a spec gate)

- Switch all four looks in light and dark; Hangul + Latin readable, including Watercolor/Academia font swap.
- Reload: look and color survive; unknown key in DevTools falls back without a flash of the wrong look (boot script).
- Restore a backup: progress changes, appearance does not.
- Installed PWA: manifest theme-color / icons may stay Botanical Korea — pass.

### Out of test scope this slice

- Accounts, sync, new-cards-per-day, rewriting manifests at runtime, cross-tab look sync.

## Out of scope

- Auth, backend, DB sync, fake Sign-in placeholder.
- Daily-new-card (and other study) controls — future Settings section.
- Per-look PWA icons or runtime manifest rewrite.
- A “System look” or fifth look.
- Preview pane / screenshot of the whole app inside a card.

## Success

Kyle opens Settings from the person mark, picks Taegeuk (or Watercolor, or Academia) and Dark, the chrome and labs repaint without a reload, a refresh keeps that pair, a progress restore does not undo it, and the header still has only three labeled destinations: Labs, Review, Reference.
