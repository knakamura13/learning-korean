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
4. Runtime variables for the Node server: `ORIGIN` (same URL as `PUBLIC_SITE_URL`; required once accounts are enabled so the API's origin check sees the right host), `PORT` (Railway sets this), `PROTOCOL_HEADER`, and `HOST_HEADER`. The Dockerfile already sets the two proxy headers. `ADAPTER=node` is set at image build time in the Dockerfile — do not rely on `RAILWAY_ENVIRONMENT` for adapter selection.

## Accounts & cross-device sync (optional)

Signed-out, the app is fully functional with browser-local storage — the variables below only enable Google sign-in and account sync. Without them every `/api/*` route answers "unavailable" and the client stays in guest mode, which is also how a plain static build behaves.

1. Add a **Postgres** service to the Railway project. On the app service set `DATABASE_URL` to the reference `${{Postgres.DATABASE_URL}}` — Railway resolves it to the **private** hostname (`postgres.railway.internal`), keeping app↔DB traffic on the internal network with no egress fees. Never point the app at the public TCP proxy. The schema bootstraps itself (idempotent `CREATE IF NOT EXISTS`) on first use.
2. Create a Google OAuth client (Google Cloud console → APIs & Services → Credentials → OAuth client ID, type "Web application"). Register the redirect URIs `https://<your-domain>/api/auth/google/callback` and, for local dev, `http://localhost:5199/api/auth/google/callback`. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` on the app service.
3. All three are **runtime** variables — none are baked into the Docker image.

Local dev with accounts: run `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=dev postgres:16`, put `DATABASE_URL=postgres://postgres:dev@localhost:5432/postgres` plus the Google pair in `app/.env`, and `pnpm dev`. Without a database, dev is unchanged (guest mode). The Postgres integration tests run when `TEST_DATABASE_URL` is set; CI provides a service container.

To run the same Node server locally (after `ADAPTER=node pnpm build`):

```bash
cd app
ADAPTER=node pnpm build
pnpm start        # http://localhost:3000 — needs the Node adapter output
```

`pnpm start` is only valid after an `ADAPTER=node` build. A default `pnpm build` still writes a static folder, not `build/index.js`.
