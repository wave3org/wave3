up:
	docker compose -f compose.yml up -d

build-ponder:
	docker compose -f compose.yml build ponder

build-nextjs:
	docker compose -f compose.yml build nextjs

build-all:
	docker compose -f compose.yml build

up-ponder:
	docker compose -f compose.yml up -d ponder

up-nextjs:
	docker compose -f compose.yml up -d nextjs

down:
	docker compose -f compose.yml down

logs-ponder:
	docker compose -f compose.yml logs -f ponder

logs-nextjs:
	docker compose -f compose.yml logs -f nextjs

.PHONY: up build-ponder build-nextjs build-all up-ponder up-nextjs down logs-ponder logs-nextjs