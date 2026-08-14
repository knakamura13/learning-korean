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

## Deploy on Railway

Connect this GitHub repo as a new Railway service. The root `Dockerfile` and `railway.toml` already point at `app/`, so leave **Root Directory** as the repository root.

1. New project → Deploy from GitHub → `learning-korean`
2. Settings → Networking → Generate Domain
3. Optional: set `ORIGIN` to that public URL (only needed if you add server form actions later)

To run the same Node server locally:

```bash
cd app
ADAPTER=node pnpm build
pnpm start        # http://localhost:3000
```
