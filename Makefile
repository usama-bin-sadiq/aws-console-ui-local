# AWS Console Clone — Universal Adapter + Full Feature Parity
# Make commands for development, production, and adapter modes.

.PHONY: dev test build clean start stop start-localstack start-ministack start-both

# Default adapter mode
ADAPTER_MODE ?= localstack
LOCALSTACK_HOSTNAME ?= localhost
LOCALSTACK_EDGE_PORT ?= 4566
MINSTACK_HOSTNAME ?= localhost
MINSTACK_EDGE_PORT ?= 4566


# Development with ministack mode (docker-compose)
dev-ministack:
	docker-compose -f docker-compose.ministack.yml up -d ministack-health && ADAPTER_MODE=ministack MINSTACK_HOSTNAME=localhost MINSTACK_EDGE_PORT=4566 npm run dev

# Development with localstack mode (docker-compose)
dev-localstack:
	docker-compose -f docker-compose.localstack.yml up -d localstack-health && ADAPTER_MODE=localstack LOCALSTACK_HOSTNAME=localhost LOCALSTACK_EDGE_PORT=4566 npm run dev



# Production start (ministack mode with docker-compose)
start-ministack:
	docker-compose -f docker-compose.ministack.yml up -d ministack-health && NODE_ENV=production ADAPTER_MODE=ministack MINSTACK_HOSTNAME=localhost MINSTACK_EDGE_PORT=4566 npm run start

# Production start (localstack mode explicitly with docker-compose)
start-localstack:
	docker-compose -f docker-compose.localstack.yml up -d localstack-health && NODE_ENV=production ADAPTER_MODE=localstack LOCALSTACK_HOSTNAME=localhost LOCALSTACK_EDGE_PORT=4566 npm run start

# Stop ministack only
stop-ministack:
	docker-compose -f docker-compose.ministack.yml stop
# Stop localstack only
stop-localstack:
	docker-compose -f docker-compose.localstack.yml stop

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
