# Railway looks for a Dockerfile at the repo root. The SvelteKit app is in app/.
FROM node:22-alpine AS build

WORKDIR /app

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@10.33.3 --activate

COPY app/package.json app/pnpm-lock.yaml app/.npmrc ./

RUN pnpm install --frozen-lockfile

COPY app/ ./

# adapter-node (see app/svelte.config.js). Must be set at image build time.
ENV ADAPTER=node

# Prerendered OG/canonical tags read PUBLIC_SITE_URL at `pnpm build`.
# Railway forwards matching service variables as Docker build-args when ARG is declared.
ARG PUBLIC_SITE_URL
ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL

RUN pnpm build

FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PROTOCOL_HEADER=x-forwarded-proto
ENV HOST_HEADER=x-forwarded-host
# ORIGIN and PORT are runtime service variables — do not bake ORIGIN into the image.

COPY --from=build /app/build ./build
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/.npmrc ./
COPY --from=build /app/scripts ./scripts

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@10.33.3 --activate \
	&& pnpm install --prod --frozen-lockfile

USER node

EXPOSE 3000

CMD ["node", "scripts/start.mjs"]
