FROM node:22-bookworm-slim AS build
# Toolchain for better-sqlite3 in case no prebuilt binary matches.
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    PORT=5116 \
    STOCKPILE_DB_PATH=/app/data/stockpile.sqlite \
    STOCKPILE_RESEED=1
COPY package.json package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY server ./server
EXPOSE 5116
CMD ["npm", "start"]
