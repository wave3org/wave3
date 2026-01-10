# Helper services only (postgres, ipfs, storage)
up:
	docker compose up -d

# Full stack (all services including client, ponder, ml)
up-full:
	docker compose --profile full up -d

# Development workflow - start helpers and then local dev services
dev:
	@echo "🚀 Starting helper services (postgres, ipfs)..."
	docker compose up -d
	@echo "⏳ Waiting for services to be ready..."
	sleep 3
	@echo "📦 Installing dependencies..."
	yarn install
	@echo ""
	@echo "✅ Helper services are running!"
	@echo "⚠️  Remember to start your local blockchain: yarn chain"
	@echo "⚠️  Then deploy contracts: yarn deploy"
	@echo ""
	@echo "Now run these commands in separate terminals:"
	@echo "  Terminal 1: yarn chain"
	@echo "  Terminal 2: yarn deploy (after chain is running)"
	@echo "  Terminal 3: make dev-nextjs"
	@echo "  Terminal 4: make dev-ponder"
	@echo "  Terminal 5: make dev-storage"
	@echo "  Terminal 6: make dev-ml"

# Start Next.js dev server
dev-nextjs:
	yarn start

# Start Ponder dev server
dev-ponder:
	yarn ponder:dev

# Start Storage dev server
dev-storage:
	cd packages/storage && IPFS_API_URL=http://localhost:5001 yarn dev

# Start ML dev server
dev-ml:
	cd packages/ml && PONDER_URL=http://localhost:42069 STORAGE_URL=http://localhost:3001 python ml.py

build-ponder:
	docker compose build ponder

build-nextjs:
	docker compose build client

build-ml:
	docker compose build ml

build-storage:
	docker compose build storage

build-all:
	docker compose --profile full build

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

.PHONY: up up-full dev dev-nextjs dev-ponder dev-storage dev-ml build-ponder build-nextjs build-ml build-storage build-all up-ponder up-nextjs up-ml up-storage down logs-ponder logs-nextjs logs-ml logs-storage