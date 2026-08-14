# AGENTS.md

## Cursor Cloud specific instructions

This repo is a single frontend-only SvelteKit + TypeScript app that lives in `app/`. It prerenders to a static folder via `@sveltejs/adapter-static` — there is no backend, database, or runtime data fetching. State persists in the browser's `localStorage`.

- All commands must be run from `app/` (not the repo root). The package manager is `pnpm` (see `app/pnpm-lock.yaml`); `.npmrc` sets `engine-strict=true`.
- Standard scripts are defined in `app/package.json` and documented in `README.md` / `app/README.md`. In short: `pnpm dev` (dev server, fixed to `http://localhost:5199` via `--strictPort`), `pnpm build` (static output to `app/build/`), `pnpm preview`, `pnpm check` (svelte-check / tsc — this is the lint/type gate; there is no separate ESLint), `pnpm test` (vitest).
- The dev server binds to a fixed port `5199` with `--strictPort`, so it fails fast if the port is taken rather than picking another. Kill the stale process (by PID) before restarting.
- `pnpm test` runs vitest in Node; it asserts the authored lessons against the pure domain logic, so content edits in `src/lib/content` can fail domain tests in `src/lib/domain` even when types pass. Run `pnpm test` after touching lessons or domain rules.
- Optional env: `PUBLIC_SITE_URL` (see `app/.env.example`) only affects absolute Open Graph / canonical URLs for a deployed build; leave unset for local dev.
