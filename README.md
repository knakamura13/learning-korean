# learning-korean

Interactive Hangul labs and a spaced-repetition review deck for reading Korean.

SvelteKit + TypeScript, prerendered with `@sveltejs/adapter-static`. No server and no runtime data fetching — `pnpm build` writes a folder you can serve with anything.

The app lives in `app/`.

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

When publishing to a stable origin, set `PUBLIC_SITE_URL` (see `app/.env.example`) so Open Graph / canonical tags can be absolute. There is no verified public host today — do not invent one.
