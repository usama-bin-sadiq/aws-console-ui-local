.PHONY: dev start stop restart logs clean seed health status

dev:
	docker compose up -d ministack
	@echo "Waiting for Ministack to be ready..."
	@sleep 5
	npm run dev

start:
	docker compose up -d ministack
	@echo "Ministack started on http://localhost:4566"

start-localstack:
	docker compose --profile localstack up -d localstack
	@echo "LocalStack started on http://localhost:4566"

stop:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f ministack

clean:
	docker compose down -v
	rm -rf data/

health:
	@curl -s http://localhost:4566/_ministack/health || curl -s http://localhost:4566/_localstack/health || echo "No provider running"

status:
	@echo "=== Docker Containers ==="
	@docker compose ps
	@echo ""
	@echo "=== Health Check ==="
	@make health

build:
	npm run build

seed:
	npx tsx scripts/seed.ts
