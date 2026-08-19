# learning-korean

Interactive Hangul labs and a spaced-repetition review deck for reading Korean.

SvelteKit + TypeScript, prerendered with `@sveltejs/adapter-static`. No server and no runtime data fetching — `pnpm build` writes a folder you can serve with anything.

The app lives in `app/`. Railway builds that tree with `@sveltejs/adapter-node` so the static site can listen on `PORT`.

## Run locally

```bash
cd app
pnpm install
pnpm dev          # http://localhost:5199
```

```bash
pnpm build        # → app/build/
pnpm preview
pnpm study        # build + preview on :8777
```

```bash
pnpm test
pnpm check
```

When publishing to a stable origin, set `PUBLIC_SITE_URL` (see `app/.env.example`) so Open Graph / canonical tags can be absolute. Pages are prerendered, so the value must be available at **build** time, not only at runtime.

## Deploy on Railway

Connect this GitHub repo as a new Railway service. The root `Dockerfile` and `railway.toml` already point at `app/`, so leave **Root Directory** as the repository root.

1. New project → Deploy from GitHub → `learning-korean`
2. Settings → Networking → Generate Domain
3. Variables: set `PUBLIC_SITE_URL` to that public origin **including `https://`**, with **no trailing slash** (today: `https://learning-korean-production.up.railway.app`). A host without a scheme is treated as https, but crawlers need an absolute URL, so prefer the full origin. The Dockerfile declares `ARG PUBLIC_SITE_URL` so Railway can pass it into `docker build` and prerender absolute OG tags. Rebuild after changing it.
4. Optional: set `ORIGIN` to the same URL (only needed if you add server form actions later)

To run the same Node server locally (after `ADAPTER=node pnpm build`):

```bash
cd app
ADAPTER=node pnpm build
pnpm start        # http://localhost:3000 — needs the Node adapter output
```

`pnpm start` is only valid after an `ADAPTER=node` build. A default `pnpm build` still writes a static folder, not `build/index.js`.
