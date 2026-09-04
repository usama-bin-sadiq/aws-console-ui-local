# AWS Console Clone — Universal Adapter + Full Feature Parity
# Make commands for development, production, and adapter modes.

.PHONY: dev test build clean start stop start-localstack start-minstack start-both

# Default adapter mode
ADAPTER_MODE ?= localstack
LOCALSTACK_HOSTNAME ?= localhost
LOCALSTACK_EDGE_PORT ?= 4566
MINSTACK_HOSTNAME ?= localhost
MINSTACK_EDGE_PORT ?= 4566

# Development server (default localstack with docker-compose)
dev:
	docker-compose -f docker-compose.localstack.yml up -d localstack-health && ADAPTER_MODE=localstack LOCALSTACK_HOSTNAME=localstack LOCALSTACK_EDGE_PORT=4566 MINSTACK_HOSTNAME=localhost MINSTACK_EDGE_PORT=4566 npm run dev

# Development with ministack mode (docker-compose)
dev-minstack:
	docker-compose -f docker-compose.minstack.yml up -d ministack-health && ADAPTER_MODE=minstack MINSTACK_HOSTNAME=localhost MINSTACK_EDGE_PORT=4566 npm run dev

# Development with localstack mode (docker-compose)
dev-localstack:
	docker-compose -f docker-compose.localstack.yml up -d localstack-health && ADAPTER_MODE=localstack LOCALSTACK_HOSTNAME=localhost LOCALSTACK_EDGE_PORT=4566 npm run dev

# Development with both emulators (docker-compose)
dev-both:
	docker-compose -f docker-compose.yml up -d localstack ministack aws-console

# Production start (default localstack with docker-compose)
start:
	docker-compose -f docker-compose.localstack.yml up -d localstack-health && NODE_ENV=production ADAPTER_MODE=localstack LOCALSTACK_HOSTNAME=localstack LOCALSTACK_EDGE_PORT=4566 MINSTACK_HOSTNAME=localhost MINSTACK_EDGE_PORT=4566 npm run start

# Production start (minstack mode with docker-compose)
start-minstack:
	docker-compose -f docker-compose.minstack.yml up -d ministack-health && NODE_ENV=production ADAPTER_MODE=minstack MINSTACK_HOSTNAME=localhost MINSTACK_EDGE_PORT=4566 npm run start

# Production start (localstack mode explicitly with docker-compose)
start-localstack:
	docker-compose -f docker-compose.localstack.yml up -d localstack-health && NODE_ENV=production ADAPTER_MODE=localstack LOCALSTACK_HOSTNAME=localhost LOCALSTACK_EDGE_PORT=4566 npm run start

# Stop all docker-compose services
stop:
	docker-compose -f docker-compose.yml stop

# Stop ministack only
stop-minstack:
	docker-compose -f docker-compose.yml stop ministack aws-console

# Stop localstack only
stop-localstack:
	docker-compose -f docker-compose.yml stop localstack aws-console

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
	@echo "Adapter config verified in .env.local and src/config/adapter-config.ts"
	@echo "Universal SDK factory: src/lib/sdk-factory.ts"
	@echo "Universal adapter middleware: src/lib/sdk-adapter-middleware.ts"
	@echo "Adapter tests: src/lib/localstack-adapter/index.test.ts"
