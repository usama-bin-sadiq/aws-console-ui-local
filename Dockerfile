# Multi-stage production image for AWS Console
# Production stage uses next start; adapter connects to user endpoint.

FROM node:20.11-alpine AS builder
WORKDIR /app
# Pin pnpm so corepack provisions a known version instead of resolving one at
# build time (an unpinned corepack fails with "Cannot find module .../pnpm.cjs").
ARG PNPM_VERSION=9.15.4
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate && pnpm install --frozen-lockfile
COPY . .
# Next's production build needs more heap than Node's ~2GB default; without
# this the Turbopack build dies with "Ineffective mark-compacts near heap limit".
ENV NODE_OPTIONS="--max-old-space-size=4096"
# drizzle/libsql opens data/console.db during prerender collection; the .dockerignore
# excludes host emulator state, so create an empty dir for the build-time schema.
RUN mkdir -p /app/data
RUN pnpm build

FROM node:20.11-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ARG PNPM_VERSION=9.15.4
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
# Defaults match docker-compose.localemu.yml; the compose file overrides these.
ENV ADAPTER_MODE=localstack
ENV LOCALSTACK_HOSTNAME=localstack
ENV LOCALSTACK_EDGE_PORT=4566
# node_modules already come from the builder (including the @aws-sdk/* packages
# listed in serverExternalPackages). Re-running pnpm install here would need the
# manifests copied first AND would re-download the whole tree, so skip it and
# only bring over the manifest for the runtime's benefit.
# output: "standalone" emits a self-contained server plus a minimal
# node_modules. `next start` is incompatible with that mode, so run the
# emitted server directly. Next's own static assets live in .next/static and
# are NOT copied into .next/standalone, so they must be layered back in.
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Mount point for the sqlite file the app opens at runtime.
RUN mkdir -p /app/data
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000
HEALTHCHECK CMD node -e "fetch('http://localhost:3000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "server.js"]
