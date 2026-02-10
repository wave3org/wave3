# Helper services only (postgres, ipfs, storage)
up:
	docker compose up -d

# Full stack (all services including client, ponder, ml)
up-full:
	docker compose --profile full up -d

# Development workflow - start helpers and then local dev services
dev:
	@echo "🚀 Starting helper services (postgres, ipfs, storage)..."
	docker compose up -d
	@echo "⏳ Waiting for services to be ready..."
	sleep 3
	@echo "📦 Installing dependencies..."
	yarn install
	@echo ""
	@echo "✅ Helper services are running!"
	@echo "   - Postgres: localhost:5432"
	@echo "   - IPFS: localhost:5001"
	@echo "   - Storage API: localhost:3001"
	@echo ""
	@echo "⚠️  Remember to start your local blockchain: yarn chain"
	@echo "⚠️  Then deploy contracts: yarn deploy"
	@echo ""
	@echo "Now run these commands in separate terminals:"
	@echo "  Terminal 1: yarn chain"
	@echo "  Terminal 2: yarn deploy (after chain is running)"
	@echo "  Terminal 3: make dev-nextjs"
	@echo "  Terminal 4: make dev-ponder"
	@echo "  Terminal 5: make dev-ml (optional)"

# Start Next.js dev server
dev-nextjs:
	yarn start

# Start Ponder dev server
dev-ponder:
	yarn ponder:dev

# Start ML dev server
dev-ml:
	cd packages/ml && PONDER_URL=http://localhost:42069 STORAGE_URL=http://localhost:3001 python ml.py

# Deploy contracts to Sepolia testnet
deploy-sepolia:
	cd packages/hardhat && yarn deploy --network sepolia

# Build individual services with cache (faster, for development)
build-ponder:
	docker build -f packages/ponder/Dockerfile .

build-nextjs:
	docker build -f packages/nextjs/Dockerfile .

build-ml:
	docker build -f packages/ml/Dockerfile .

build-storage:
	docker build -f packages/storage/Dockerfile .

# Build all services with cache (parallel)
build-all:
	@echo "🔨 Building all services with cache..."
	@docker build -f packages/nextjs/Dockerfile . & \
	docker build -f packages/ponder/Dockerfile . & \
	docker build -f packages/ml/Dockerfile . & \
	docker build -f packages/storage/Dockerfile . & \
	wait
	@echo "✅ All services built successfully!"

# Build individual services without cache (slower, for CI/CD verification)
build-ponder-no-cache:
	docker build --no-cache -f packages/ponder/Dockerfile .

build-nextjs-no-cache:
	docker build --no-cache -f packages/nextjs/Dockerfile .

build-ml-no-cache:
	docker build --no-cache -f packages/ml/Dockerfile .

build-storage-no-cache:
	docker build --no-cache -f packages/storage/Dockerfile .

# Build all services without cache (parallel)
build-all-no-cache:
	@echo "🔨 Building all services without cache..."
	@docker build --no-cache -f packages/nextjs/Dockerfile . & \
	docker build --no-cache -f packages/ponder/Dockerfile . & \
	docker build --no-cache -f packages/ml/Dockerfile . & \
	docker build --no-cache -f packages/storage/Dockerfile . & \
	wait
	@echo "✅ All services built successfully!"

up-ponder:
	docker compose --profile full up -d ponder

up-nextjs:
	docker compose --profile full up -d client

up-ml:
	docker compose --profile full up -d ml

up-storage:
	docker compose up -d storage

down:
	docker compose down

logs-ponder:
	docker compose logs -f ponder

logs-nextjs:
	docker compose logs -f client

logs-ml:
	docker compose logs -f ml

logs-storage:
	docker compose logs -f storage

.PHONY: up up-full dev dev-nextjs dev-ponder dev-ml deploy-sepolia build-ponder build-nextjs build-ml build-storage build-all build-ponder-no-cache build-nextjs-no-cache build-ml-no-cache build-storage-no-cache build-all-no-cache up-ponder up-nextjs up-ml up-storage down logs-ponder logs-nextjs logs-ml logs-storage