# learning-korean

Interactive labs and a spaced-repetition deck for reading Korean.

SvelteKit + TypeScript, built to a **static folder** — no server, no runtime
data fetching, works offline.

## Run it

```bash
pnpm install
pnpm dev          # http://localhost:5199
```

```bash
pnpm build        # -> build/
pnpm preview      # serve the built output
```

The default build output is plain files. Anything can serve it:

```bash
cd build && python3 -m http.server 8777
```

Railway uses `@sveltejs/adapter-node` instead (`ADAPTER=node`). After that build, `pnpm start` runs `node build/index.js`.

## Checks

```bash
pnpm test         # vitest, domain + content
pnpm check        # svelte-check / tsc
```

## Layout

```
src/lib/domain/     pure logic, no framework, no I/O
  hangul.ts           the phonology and orthography of Korean
  srs.ts              SM-2 scheduler — pure, clock injected
  deck.ts             the 72 review cards
  storage.ts          persistence as a port
src/lib/content/    lessons as typed data
  types.ts            the step union every lab is built from
  lab01..lab06.ts     the course
src/lib/theme/      swappable design systems (the look)
  active.ts           default / build-time look (Botanical Korea) for manifests, font preloads, and no-JS `:root`
  systems/botanicalKorea.ts  pressed-flowers look (default)
  systems/taegeuk.ts         ink-and-paper palette
  systems/watercolor.ts      pigment-wash option
  systems/academia.ts        Light/Dark Academia option
  css.ts              emits custom properties + @font-face only
  manifest.ts         PWA theme/background colours from the system
src/lib/components/ the runner and one component per step type
src/routes/         dashboard, /lab/[id], /review, /reference, /settings
```

The look is a `DesignSystem` object: palettes, type stacks, shape, webfonts,
and contrast-more overrides. Components only use semantic CSS variables
(`--ink`, `--paper`, `--accent`, `--serif`, …). Space, motion, and shell width
stay in `app.css`. Runtime look is `html[data-look]` chosen in Settings; `active.ts`
only supplies the build-time default for manifests, font preloads, and the no-JS
`:root` fallback.

## Two rules worth keeping

**Lessons never hard-code an answer they could derive.** A cluster card asks
`hangul.ts` which letter survives; a batchim deck card asks for its own
romanization. A lesson therefore cannot drift out of agreement with the deck
that tests it, and `content.test.ts` asserts the whole course against the
domain on every run — including that each authored pronunciation actually ends
in the letter the rules predict.

**Answer options within a card must be the same length.** Unequal options leak
the answer through shape alone. This is enforced by a test, not by discipline;
it has already caught one real slip.

## Persistence

State lives in `localStorage` under `korean-srs-v1`, `korean-lab-session-v1`,
`korean-look`, and `korean-theme`.
`storage.ts` probes on startup and reports `durable: false` when the browser
refuses writes — Settings Backup and Review warnings then say so loudly rather than
losing history in silence.

`reviveState` also accepts the pre-rewrite payload shape (`v` instead of
`version`), so serving this build from the old app's origin adopts existing
progress rather than discarding it.
