FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
RUN corepack enable
WORKDIR /app

# Copy only ponder package files
COPY packages/ponder/package.json ./
# Install dependencies fresh (standalone)
RUN yarn install --production

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 ponder

# Copy dependencies and source
COPY --from=deps /app/node_modules ./node_modules
COPY packages/ponder .

# Give ponder user ownership of the app directory with write permissions
RUN chown -R ponder:nodejs /app && \
    chmod -R 755 /app

USER ponder

EXPOSE 42069

CMD ["yarn", "start"]
