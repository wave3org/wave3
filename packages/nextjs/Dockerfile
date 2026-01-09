FROM node:20-alpine AS builder

WORKDIR /app

# Copiar yarn config desde raíz
COPY .yarnrc.yml ./
COPY .yarn ./.yarn
COPY yarn.lock package.json ./

# Copiar workspace nextjs
COPY packages/nextjs/package.json ./packages/nextjs/

# Instalar dependencias del monorepo
RUN yarn install

# Copiar código de nextjs
COPY packages/nextjs ./packages/nextjs

# Variables de entorno

ENV DOCKER_BUILD=true
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_IGNORE_BUILD_ERROR=true

# Build
WORKDIR /app/packages/nextjs
RUN yarn build

# Runner - imagen final pequeña
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

# Copiar toda la estructura standalone del monorepo
COPY --from=builder /app/packages/nextjs/.next/standalone ./
COPY --from=builder /app/packages/nextjs/.next/static ./packages/nextjs/.next/static
COPY --from=builder /app/packages/nextjs/public ./packages/nextjs/public

EXPOSE 3000

# El server.js está en packages/nextjs/ dentro del standalone
CMD ["node", "packages/nextjs/server.js"]