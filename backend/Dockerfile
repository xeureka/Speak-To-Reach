# ── Build Stage ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate

WORKDIR /app

# 1. Copy root workspace configs + backend package.json for optimal caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/

# Install dependencies across the workspace
RUN pnpm install --frozen-lockfile

# 2. Copy backend source files using the correct root-relative paths
COPY backend/tsconfig.json ./backend/
COPY backend/src ./backend/src

# Build the backend workspace specifically
RUN pnpm --filter backend build

# Prune dev dependencies
RUN pnpm prune --prod

# ── Run Stage ──────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 hono

# 3. Copy built files and production dependencies using the workspace layout
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/package.json ./backend/

USER hono
EXPOSE 3000
ENV PORT=3000

# Run the compiled server entry point
CMD ["node", "backend/dist/server.js"]
