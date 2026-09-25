# syntax=docker/dockerfile:1

# trixie (glibc 2.41): sqlite3's arm64 prebuild requires GLIBC_2.38, bookworm only has 2.36.
FROM node:24-trixie-slim AS base

WORKDIR /app

ENV NPM_CONFIG_UPDATE_NOTIFIER=false

FROM base AS manifests

COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/client/package.json apps/client/package.json
COPY packages/shared/package.json packages/shared/package.json
# Drops the root "prepare" script so husky is never invoked inside the image.
RUN npm pkg delete scripts.prepare

FROM manifests AS deps

RUN --mount=type=cache,target=/root/.npm \
    npm ci

FROM manifests AS prod-deps

# Install scripts stay enabled: sqlite3 needs them to fetch its native binding.
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runtime

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/store.db

COPY --from=manifests /app/package.json ./package.json
COPY --from=manifests /app/apps/server/package.json ./apps/server/package.json
COPY --from=manifests /app/apps/client/package.json ./apps/client/package.json
COPY --from=manifests /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/client/dist ./apps/client/dist

RUN mkdir -p /app/data && chown -R node:node /app/data
USER node

EXPOSE 3000

CMD ["node", "apps/server/dist/index.js"]
