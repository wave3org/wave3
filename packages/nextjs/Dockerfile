FROM node:20-alpine AS builder

WORKDIR /app

COPY .yarnrc.yml ./
COPY .yarn ./.yarn
COPY yarn.lock package.json ./

COPY packages/nextjs/package.json ./packages/nextjs/

RUN yarn install

COPY packages/nextjs ./packages/nextjs

ENV DOCKER_BUILD=true
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_IGNORE_BUILD_ERROR=true

# ⚠️ IMPORTANTE: Las variables NEXT_PUBLIC_* deben definirse ANTES del build
# para que Next.js las incluya en el bundle del cliente
ARG NEXT_PUBLIC_ML_URL
ARG NEXT_PUBLIC_STORAGE_URL
ARG NEXT_PUBLIC_PONDER_URL

ENV NEXT_PUBLIC_ML_URL=${NEXT_PUBLIC_ML_URL}
ENV NEXT_PUBLIC_STORAGE_URL=${NEXT_PUBLIC_STORAGE_URL}
ENV NEXT_PUBLIC_PONDER_URL=${NEXT_PUBLIC_PONDER_URL}

WORKDIR /app/packages/nextjs
RUN echo "DOCKER_BUILD=${DOCKER_BUILD}" && \
    echo "NEXT_PUBLIC_ML_URL=${NEXT_PUBLIC_ML_URL}" && \
    echo "NEXT_PUBLIC_STORAGE_URL=${NEXT_PUBLIC_STORAGE_URL}" && \
    echo "NEXT_PUBLIC_PONDER_URL=${NEXT_PUBLIC_PONDER_URL}"

RUN yarn build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/packages/nextjs/.next/standalone ./
COPY --from=builder /app/packages/nextjs/.next/static ./packages/nextjs/.next/static
COPY --from=builder /app/packages/nextjs/public ./packages/nextjs/public

EXPOSE 3000

CMD ["node", "packages/nextjs/server.js"]