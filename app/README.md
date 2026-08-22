# learning-korean

Interactive labs and a spaced-repetition deck for reading Korean.

SvelteKit + TypeScript, prerendered pages built to a **static folder**. Signed
out, the app needs no server and does no runtime data fetching (there is no
service worker, so "offline" only means already-open pages keep working). The
optional account/sync API is the one dynamic surface — absent from a static
build, and the app detects that and runs as the guest app.

## Run it

Install, `pnpm dev`, `pnpm build`, preview, checks, Railway, and `ADAPTER=node`
are documented in the repository README at the repo root. This file is the app
layout and the two content rules.

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
  deck.ts             the review deck: 299 cards across 10 lab tiers and 4 vocab
                      packs (72 letter/construction, 55 generated blocks,
                      72 pronunciation, 100 meanings)
  blockDeck.ts        deterministic syllable-block card generation
  merge.ts            deterministic sync reconciliation (never asks the learner)
  storage.ts          persistence as a port
src/lib/content/    lessons as typed data
  types.ts            the step union every lab is built from
  lab01..lab10.ts     the course
src/lib/server/     the optional account API: Postgres access, Google OAuth,
                    sessions, CAS state store (absent from static builds)
src/lib/sync/       client sync engine + typed API wrapper (guest mode is a value)
src/lib/theme/      swappable design systems (the look)
  active.ts           default / build-time look (Botanical Korea) for manifests, font preloads, and no-JS `:root`
  systems/botanicalKorea.ts  pressed-flowers look (default)
  systems/taegeuk.ts         ink-and-paper palette
  systems/watercolor.ts      pigment-wash option
  systems/academia.ts        Light/Dark Academia option
  css.ts              emits custom properties + @font-face only
  manifest.ts         PWA theme/background colours from the system
src/lib/components/ the runner and one component per step type
src/routes/         dashboard, /lab/[id], /review, /drill, /reference,
                    /settings, /healthz, /api/* (accounts & sync)
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

With accounts enabled (see the repository README), a signed-in browser also
syncs the same document to the server: localStorage stays the source of truth,
pushes are debounced and revision-checked, and conflicts resolve through the
pure merge in `domain/merge.ts` — per-card latest-review-wins, whole-sitting
wins per lab, and the learner is never asked to pick a save point. Study pacing
(`newPerDay`, `reviewsPerSitting`) becomes an account preference; guests keep
the compiled defaults. Appearance keys stay device-local on purpose.
