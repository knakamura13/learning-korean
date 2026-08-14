# Railway looks for a Dockerfile at the repo root. The SvelteKit app is in app/.
FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY app/package.json app/pnpm-lock.yaml app/.npmrc ./

RUN pnpm install --frozen-lockfile

COPY app/ ./

# adapter-node (see app/svelte.config.js). Railway also sets RAILWAY_ENVIRONMENT.
ENV ADAPTER=node
RUN pnpm build

ENV NODE_ENV=production
ENV PROTOCOL_HEADER=x-forwarded-proto
ENV HOST_HEADER=x-forwarded-host

EXPOSE 3000

CMD ["node", "build/index.js"]
