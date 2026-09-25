FROM node:24-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps ./apps
COPY packages ./packages

RUN npm ci
RUN npm run build

FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/store.db

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/server/package.json ./apps/server/package.json
COPY apps/client/package.json ./apps/client/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN npm ci --omit=dev

COPY --from=build /app/apps/server/dist ./apps/server/dist
COPY --from=build /app/apps/client/dist ./apps/client/dist
COPY --from=build /app/packages/shared/dist ./packages/shared/dist

RUN mkdir /app/data && chown -R node:node /app
USER node

EXPOSE 3000

CMD ["node", "apps/server/dist/index.js"]
