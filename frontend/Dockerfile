# syntax=docker/dockerfile:1.6
#
# Frontend - Next.js 16 con output standalone
# Multi-stage:
#   1. deps    -> npm ci con cache
#   2. build   -> next build (NEXT_PUBLIC_* se hornean aqui via ARG)
#   3. runtime -> alpine + server.js minimal + non-root

# ---------- Stage 1: deps ----------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- Stage 2: build ----------
FROM node:20-alpine AS build
WORKDIR /app

# Las variables NEXT_PUBLIC_* se inlinean en el bundle del cliente
# durante `next build`, asi que deben pasarse como ARG aqui.
ARG NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
ENV NEXT_PUBLIC_GRAPHQL_URL=$NEXT_PUBLIC_GRAPHQL_URL

ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- Stage 3: runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Usuario non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# Copia el output standalone (server.js + node_modules minimo) + assets estaticos
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

# Healthcheck via node http (mas confiable que wget --spider con Next 16
# en alpine). Apunta a 127.0.0.1 explicito y considera healthy cualquier
# 2xx/3xx (la home redirige a /login o /dashboard segun sesion).
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:3000/login', (r) => process.exit(r.statusCode >= 200 && r.statusCode < 400 ? 0 : 1)).on('error', () => process.exit(1))" || exit 1

CMD ["node", "server.js"]
