# Railway looks for a Dockerfile at the repo root. The SvelteKit app is in app/.
FROM node:22-alpine AS build

WORKDIR /app

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@10.33.3 --activate

COPY app/package.json app/pnpm-lock.yaml app/.npmrc ./

RUN pnpm install --frozen-lockfile

COPY app/ ./

# adapter-node (see app/svelte.config.js). Must be set at image build time;
# Railway does not inject RAILWAY_ENVIRONMENT into `docker build`.
ENV ADAPTER=node
RUN pnpm build

FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PROTOCOL_HEADER=x-forwarded-proto
ENV HOST_HEADER=x-forwarded-host

COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./

USER node

EXPOSE 3000

CMD ["node", "build/index.js"]
