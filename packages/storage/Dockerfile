# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY packages/storage/package.json packages/storage/yarn.lock* ./

# Install all dependencies (including dev)
RUN yarn install --frozen-lockfile

# Copy source code
COPY packages/storage/src ./src
COPY packages/storage/tsconfig.json ./

# Build TypeScript
RUN yarn build

# Production stage
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY packages/storage/package.json packages/storage/yarn.lock* ./

# Install only production dependencies
RUN yarn install --production --frozen-lockfile && yarn cache clean

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3001

# Run the application
CMD ["node", "dist/index.js"]
