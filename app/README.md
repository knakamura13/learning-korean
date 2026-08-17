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

Railway uses `@sveltejs/adapter-node` instead (`ADAPTER=node` or `RAILWAY_ENVIRONMENT`). After that build, `pnpm start` runs `node build/index.js`.

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
  lab01..lab05.ts     the course
src/lib/theme/      swappable design systems (tokens + CSS)
  active.ts           one-line switch for the current look
  systems/academia.ts Light Academia / Dark Academia palettes
src/lib/components/ the runner and one component per step type
src/routes/         dashboard, /lab/[id], /review, /reference
```

Visual tokens are a `DesignSystem` object. Components only use semantic CSS
variables (`--ink`, `--paper`, `--accent`, `--serif`, …). To prototype a new
look, add `src/lib/theme/systems/<name>.ts` and point `activeSystem` at it.
The previous Taegeuk palette is still in `systems/taegeuk.ts` as a one-line
switch-back.

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

State lives in `localStorage` under `korean-srs-v1`. `storage.ts` probes on
startup and reports `durable: false` when the browser refuses writes — the
review page then says so loudly rather than losing history in silence.

`reviveState` also accepts the pre-rewrite payload shape (`v` instead of
`version`), so serving this build from the old app's origin adopts existing
progress rather than discarding it.
