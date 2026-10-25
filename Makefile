# AWS Console Clone — Universal Adapter + Full Feature Parity
# Make commands for development, production, and adapter modes.

.PHONY: dev test build clean start stop start-localstack start-ministack start-both dev-localemu dev-localstack dev-ministack

# Default adapter mode
ADAPTER_MODE ?= localemu
LOCALSTACK_HOSTNAME ?= localhost
LOCALSTACK_EDGE_PORT ?= 4566
MINSTACK_HOSTNAME ?= localhost
MINSTACK_EDGE_PORT ?= 4566
LOCALEMU_HOSTNAME ?= localhost
LOCALEMU_EDGE_PORT ?= 4566

# Setup: copy env example
setup:
	@if [ ! -f .env.local ]; then cp .env.example .env.local; fi
	@echo "Environment configured in .env.local — edit it before starting."

# Development with LocalEmu mode (default — no Docker required)
dev-localemu: setup
	ADAPTER_MODE=localemu LOCALEMU_HOSTNAME=$(LOCALEMU_HOSTNAME) LOCALEMU_EDGE_PORT=$(LOCALEMU_EDGE_PORT) LOCALEMU_ENDPOINT=http://$(LOCALEMU_HOSTNAME):$(LOCALEMU_EDGE_PORT) npm run dev

# Development with ministack mode
dev-ministack: setup
	docker compose -f docker-compose.ministack.yml up -d ministack-health && ADAPTER_MODE=ministack MINSTACK_HOSTNAME=$(MINSTACK_HOSTNAME) MINSTACK_EDGE_PORT=$(MINSTACK_EDGE_PORT) MINSTACK_ENDPOINT=http://$(MINSTACK_HOSTNAME):$(MINSTACK_EDGE_PORT) npm run dev

# Development with localstack mode
dev-localstack: setup
	docker compose -f docker-compose.localstack.yml up -d localstack-health && ADAPTER_MODE=localstack LOCALSTACK_HOSTNAME=$(LOCALSTACK_HOSTNAME) LOCALSTACK_EDGE_PORT=$(LOCALSTACK_EDGE_PORT) LOCALSTACK_ENDPOINT=http://$(LOCALSTACK_HOSTNAME):$(LOCALSTACK_EDGE_PORT) npm run dev

# Production start (ministack mode)
start-ministack: setup
	docker compose -f docker-compose.ministack.yml up -d ministack-health && NODE_ENV=production ADAPTER_MODE=ministack MINSTACK_HOSTNAME=$(MINSTACK_HOSTNAME) MINSTACK_EDGE_PORT=$(MINSTACK_EDGE_PORT) npm run start

# Production start (localstack mode explicitly)
start-localstack: setup
	docker compose -f docker-compose.localstack.yml up -d localstack-health && NODE_ENV=production ADAPTER_MODE=localstack LOCALSTACK_HOSTNAME=$(LOCALSTACK_HOSTNAME) LOCALSTACK_EDGE_PORT=$(LOCALSTACK_EDGE_PORT) npm run start

# Stop ministack only
stop-ministack:
	docker compose -f docker-compose.ministack.yml stop

# Stop localstack only
stop-localstack:
	docker compose -f docker-compose.localstack.yml stop

# Build production image
build:
	docker build . -t aws-console-clone:latest

# Run tests (adapter + component + service + E2E critical paths)
test:
	npm run test

# Clean build artifacts and .DS_Store
clean:
	rm -rf .next out build node_modules/.cache
	find . -name ".DS_Store" -delete || true

# Initialize adapter configuration
init:
	@echo "Adapter config verified in .env.local"
	@echo "Universal SDK factory: src/lib/sdk-factory.ts"
	@echo "Universal adapter middleware: src/lib/sdk-adapter-middleware.ts"
	@echo "Adapter tests: src/lib/localstack-adapter/index.test.ts"
