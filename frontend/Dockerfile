# ── Build Stage ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate

WORKDIR /app

# Copy workspace config (required for pnpm workspaces)
COPY pnpm-workspace.yaml ./

# Copy package files from both packages (workspace resolution)
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy frontend source
COPY frontend/tsconfig.json frontend/vite.config.ts frontend/index.html ./frontend/
COPY frontend/src ./frontend/src
COPY frontend/public ./frontend/public

# Build frontend
RUN cd frontend && pnpm build

# ── Run Stage ──────────────────────────────────────────────────────────────────
FROM nginx:alpine AS runner

# Copy nginx config
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built frontend assets
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
