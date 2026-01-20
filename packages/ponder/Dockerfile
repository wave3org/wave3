FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
RUN corepack enable
WORKDIR /app
COPY packages/ponder/package.json ./
RUN yarn install --frozen-lockfile

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY packages/ponder .
COPY packages/nextjs/contracts /nextjs/contracts
COPY packages/nextjs/scaffold.config.ts /nextjs/scaffold.config.ts

RUN echo "DATABASE_URL set: $(echo $DATABASE_URL | sed 's/:[^:]*@/:***@/')" && \
    echo "DATABASE_SCHEMA: $DATABASE_SCHEMA" && \
    echo "PONDER_RPC_URL_11155111: ${PONDER_RPC_URL_11155111}" && \
    env | grep PONDER

EXPOSE 42069
CMD ["yarn", "start"]
