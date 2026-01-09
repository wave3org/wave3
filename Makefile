up:
	docker compose -f compose.yml up -d

build-ponder:
	docker compose -f compose.yml build ponder

build-nextjs:
	docker compose -f compose.yml build nextjs

build-ml:
	docker compose -f compose.yml build ml

build-storage:
	docker compose -f compose.yml build storage

build-all:
	docker compose -f compose.yml build

up-ponder:
	docker compose -f compose.yml up -d ponder

up-nextjs:
	docker compose -f compose.yml up -d nextjs

up-ml:
	docker compose -f compose.yml up -d ml

up-storage:
	docker compose -f compose.yml up -d storage

down:
	docker compose -f compose.yml down

logs-ponder:
	docker compose -f compose.yml logs -f ponder

logs-nextjs:
	docker compose -f compose.yml logs -f nextjs

logs-storage:
	docker compose -f compose.yml logs -f storage

.PHONY: up build-ponder build-nextjs build-ml build-storage build-all up-ponder up-nextjs up-ml up-storage down logs-ponder logs-nextjs logs-ml logs-storage
	docker compose -f compose.yml logs -f ml

.PHONY: up build-ponder build-nextjs build-ml build-all up-ponder up-nextjs up-ml down logs-ponder logs-nextjs logs-ml