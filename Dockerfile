# syntax=docker/dockerfile:1

# ── 1. Dependencies (cached until package.json / package-lock.json change) ──────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ── 2. Build the static bundle ─────────────────────────────────────────────────
FROM deps AS build
COPY . .
# Leave empty to use the built-in same-origin "/api/v1" path (proxied by nginx below).
ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# ── 3. Serve with nginx ────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Where "/api" is forwarded. Override at run time:  docker run -e BACKEND_ORIGIN=...
ENV BACKEND_ORIGIN=https://curaflow-backend-pfrn.onrender.com

# docker/default.conf replaces the stock site config. At container start,
# 15-backend-proxy.sh (run by the image's entrypoint) turns BACKEND_ORIGIN into
# the proxy_pass lines that config includes.
COPY docker/default.conf /etc/nginx/conf.d/default.conf
COPY docker/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY docker/15-backend-proxy.sh /docker-entrypoint.d/15-backend-proxy.sh
RUN chmod +x /docker-entrypoint.d/15-backend-proxy.sh

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1
