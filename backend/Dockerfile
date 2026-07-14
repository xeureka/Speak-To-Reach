# ── Build Stage ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
RUN pnpm build

# Prune dev dependencies
RUN pnpm prune --prod

# ── Run Stage ──────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 hono

# Copy built files and production deps
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

USER hono
EXPOSE 3000
ENV PORT=3000

CMD ["node", "dist/server.js"]
