# Download FMA dataset (8000 MP3s + metadata CSVs)
download-fma:
	mkdir -p downloads
	@echo "📥 Downloading FMA metadata (342 MB)..."
	wget -nc -P downloads https://os.unil.cloud.switch.ch/fma/fma_metadata.zip
	@echo "📥 Downloading FMA small (7.2 GB — 8000 MP3 clips)..."
	wget -nc -P downloads https://os.unil.cloud.switch.ch/fma/fma_small.zip
	@echo "📦 Extracting..."
	cd downloads && unzip -n fma_metadata.zip && unzip -n fma_small.zip
	@echo "✅ Done! Files in downloads/fma_metadata/ and downloads/fma_small/"

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
	@echo "  Terminal 5: make dev-storage (if not using Docker)"
	@echo "  Terminal 6: make dev-ml (optional)"

# Start Next.js dev server
dev-nextjs:
	yarn start

# Start Ponder dev server
dev-ponder:
	DATABASE_URL=postgres://wave3:wave3@localhost:5432/wave3 DATABASE_SCHEMA=wave3 yarn ponder:dev

# Start ML dev server
dev-ml:
	cd packages/ml && PONDER_URL=http://localhost:42069 STORAGE_URL=http://localhost:3001 uvicorn server:app --reload --host 0.0.0.0 --port 8000

# Start Storage dev server
dev-storage:
	yarn workspace storage dev

# Setup local database indexes (run after Ponder creates tables)
setup-db:
	./packages/ponder/postgres/setup-db.sh

# Setup Supabase database indexes and schema
# Usage: make setup-db-supabase DB_URL="postgresql://user:password@host:5432/postgres"
setup-db-supabase:
	@if [ -z "$(DB_URL)" ]; then \
		echo "❌ Error: DB_URL not set. Usage: make setup-db-supabase DB_URL=\"postgresql://user:password@host:5432/postgres\""; \
		exit 1; \
	fi
	@echo "📋 Setting up Supabase database schema and indexes..."
	DATABASE_URL="$(DB_URL)" DATABASE_SCHEMA=wave3 ./packages/ponder/postgres/setup-db.sh
	@echo "✅ Supabase database setup complete!"

# Reset Supabase database (drops wave3 schema)
# Usage: make reset-db-supabase DB_URL="postgresql://user:password@host:5432/postgres"
reset-db-supabase:
	@if [ -z "$(DB_URL)" ]; then \
		echo "❌ Error: DB_URL not set. Usage: make reset-db-supabase DB_URL=\"postgresql://user:password@host:5432/postgres\""; \
		exit 1; \
	fi
	@echo "🗑️  Dropping wave3 schema from Supabase..."
	psql "$(DB_URL)" -c "DROP SCHEMA IF EXISTS wave3 CASCADE;"
	@echo "✅ Schema dropped successfully!"

# Remove all deployed contract artifacts so you can redeploy from scratch
clean-contracts:
	@echo "🗑️  Removing deployments, artifacts, cache and typechain-types..."
	rm -rf packages/hardhat/deployments/localhost
	rm -rf packages/hardhat/deployments/sepolia
	rm -rf packages/hardhat/artifacts
	rm -rf packages/hardhat/cache
	rm -rf packages/hardhat/typechain-types
	@echo "✅ All contract artifacts removed. Run 'yarn deploy' to redeploy."

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

# Seed the local database with FMA music data
seed:
	python seed/seed_database.py

# Seed on Sepolia testnet
# Usage: make seed-sepolia DEPLOYER_PRIVATE_KEY=0xYourPrivateKey
seed-sepolia:
	@if [ -z "$(DEPLOYER_PRIVATE_KEY)" ]; then \
		echo "Usage: make seed-sepolia DEPLOYER_PRIVATE_KEY=0x..."; \
		exit 1; \
	fi
	NETWORK=sepolia DEPLOYER_PRIVATE_KEY=$(DEPLOYER_PRIVATE_KEY) python seed/seed_database.py

.PHONY: up up-full dev dev-nextjs dev-ponder dev-ml dev-storage codegen deploy-sepolia clean-contracts download-fma build-ponder build-nextjs build-ml build-storage build-all build-ponder-no-cache build-nextjs-no-cache build-ml-no-cache build-storage-no-cache build-all-no-cache up-ponder up-nextjs up-ml up-storage down logs-ponder logs-nextjs logs-ml logs-storage seed