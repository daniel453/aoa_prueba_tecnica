# syntax=docker/dockerfile:1.6
#
# Backend - GraphQL API (Node.js + TypeScript)
# Multi-stage build:
#   1. deps    -> instala todas las dependencias (incluye dev) para compilar
#   2. build   -> tsc -> dist/
#   3. runtime -> node:alpine + solo prod deps + non-root user

# ---------- Stage 1: deps ----------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- Stage 2: build ----------
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY tsconfig.json ./
COPY src ./src
COPY package.json package-lock.json ./
RUN npm run build

# ---------- Stage 3: runtime ----------
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Instala solo las prod deps en una capa aparte (cacheable)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copia el codigo compilado
COPY --from=build /app/dist ./dist

# Usuario no-root (mejor practica de seguridad)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs && \
    chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 4000

# Healthcheck contra /health (wget viene en alpine)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["node", "dist/index.js"]
