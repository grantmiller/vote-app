# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app

# Install production deps separately for smaller image
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm i --production --no-audit --no-fund

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs package.json ./
COPY --chown=nodejs:nodejs src ./src
USER nodejs
EXPOSE 3000
CMD ["node", "src/server.js"]


