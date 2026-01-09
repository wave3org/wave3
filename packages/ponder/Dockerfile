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
COPY packages/nextjs/contracts /nextjs/contracts
EXPOSE 42069
CMD ["yarn", "start"]
