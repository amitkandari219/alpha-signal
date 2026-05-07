# Alpha Signal - Makefile for common tasks

.PHONY: help install build dev clean docker-up docker-down docker-build logs test lint format

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)Alpha Signal - Available Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

install: ## Install all dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	npm install
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

build: ## Build all packages
	@echo "$(BLUE)Building packages...$(NC)"
	npm run build
	@echo "$(GREEN)✓ Build complete$(NC)"

dev: ## Start development servers
	@echo "$(BLUE)Starting development servers...$(NC)"
	npm run dev

clean: ## Clean all build artifacts and dependencies
	@echo "$(YELLOW)Cleaning build artifacts...$(NC)"
	npm run clean
	@echo "$(GREEN)✓ Clean complete$(NC)"

docker-up: ## Start all Docker services
	@echo "$(BLUE)Starting Docker services...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✓ Services started$(NC)"
	@echo "Web:     http://localhost:3000"
	@echo "API:     http://localhost:4000"
	@echo "GraphQL: http://localhost:4000/graphql"

docker-down: ## Stop all Docker services
	@echo "$(YELLOW)Stopping Docker services...$(NC)"
	docker-compose down
	@echo "$(GREEN)✓ Services stopped$(NC)"

docker-build: ## Build Docker images
	@echo "$(BLUE)Building Docker images...$(NC)"
	docker-compose build
	@echo "$(GREEN)✓ Images built$(NC)"

docker-rebuild: ## Rebuild and restart Docker services
	@echo "$(BLUE)Rebuilding services...$(NC)"
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d
	@echo "$(GREEN)✓ Services rebuilt and started$(NC)"

logs: ## View Docker logs
	docker-compose logs -f

logs-api: ## View API logs
	docker-compose logs -f api

logs-web: ## View web logs
	docker-compose logs -f web

logs-worker: ## View analytics worker logs
	docker-compose logs -f analytics-worker

test: ## Run tests
	@echo "$(BLUE)Running tests...$(NC)"
	npm run test --if-present
	@echo "$(GREEN)✓ Tests complete$(NC)"

lint: ## Lint code
	@echo "$(BLUE)Linting code...$(NC)"
	cd apps/web && npm run lint
	cd apps/api && npm run lint --if-present
	@echo "$(GREEN)✓ Linting complete$(NC)"

format: ## Format code with Prettier
	@echo "$(BLUE)Formatting code...$(NC)"
	npx prettier --write "**/*.{ts,tsx,js,jsx,json,md}"
	cd apps/analytics && black src/
	@echo "$(GREEN)✓ Formatting complete$(NC)"

prisma-generate: ## Generate Prisma client
	@echo "$(BLUE)Generating Prisma client...$(NC)"
	cd apps/api && npx prisma generate
	@echo "$(GREEN)✓ Prisma client generated$(NC)"

prisma-migrate: ## Run Prisma migrations
	@echo "$(BLUE)Running migrations...$(NC)"
	cd apps/api && npx prisma migrate dev
	@echo "$(GREEN)✓ Migrations complete$(NC)"

prisma-studio: ## Open Prisma Studio
	@echo "$(BLUE)Opening Prisma Studio...$(NC)"
	cd apps/api && npx prisma studio

db-reset: ## Reset database (⚠️  deletes all data)
	@echo "$(YELLOW)⚠️  WARNING: This will delete all data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		cd apps/api && npx prisma migrate reset --force; \
		echo "$(GREEN)✓ Database reset$(NC)"; \
	else \
		echo "Cancelled"; \
	fi

setup: ## Initial setup (install + build + setup env)
	@echo "$(BLUE)Running initial setup...$(NC)"
	./setup.sh
	@echo "$(GREEN)✓ Setup complete$(NC)"

status: ## Check services status
	@echo "$(BLUE)Services Status:$(NC)"
	@docker-compose ps

shell-api: ## Open shell in API container
	docker-compose exec api sh

shell-worker: ## Open shell in analytics worker container
	docker-compose exec analytics-worker bash

redis-cli: ## Open Redis CLI
	docker-compose exec redis redis-cli -a alphasignal_redis_dev

psql: ## Open PostgreSQL CLI
	docker-compose exec postgres psql -U alphasignal -d alphasignal

backup-db: ## Backup database
	@echo "$(BLUE)Backing up database...$(NC)"
	docker-compose exec -T postgres pg_dump -U alphasignal alphasignal > backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✓ Database backed up$(NC)"

restore-db: ## Restore database from backup (Usage: make restore-db FILE=backup.sql)
	@if [ -z "$(FILE)" ]; then \
		echo "$(YELLOW)Usage: make restore-db FILE=backup.sql$(NC)"; \
		exit 1; \
	fi
	@echo "$(BLUE)Restoring database from $(FILE)...$(NC)"
	docker-compose exec -T postgres psql -U alphasignal alphasignal < $(FILE)
	@echo "$(GREEN)✓ Database restored$(NC)"

# ============================================
# PRODUCTION COMMANDS
# ============================================

prod-build: ## Build production Docker images
	@echo "$(BLUE)Building production Docker images...$(NC)"
	docker-compose -f docker-compose.prod.yml build --no-cache
	@echo "$(GREEN)✓ Production images built$(NC)"

prod-up: ## Start production services
	@echo "$(BLUE)Starting production services...$(NC)"
	docker-compose -f docker-compose.prod.yml up -d
	@echo "$(GREEN)✓ Production services started$(NC)"
	@make prod-status

prod-down: ## Stop production services
	@echo "$(YELLOW)Stopping production services...$(NC)"
	docker-compose -f docker-compose.prod.yml down
	@echo "$(GREEN)✓ Production services stopped$(NC)"

prod-restart: ## Restart production services
	@echo "$(BLUE)Restarting production services...$(NC)"
	docker-compose -f docker-compose.prod.yml restart
	@echo "$(GREEN)✓ Production services restarted$(NC)"

prod-logs: ## View production logs from all services
	docker-compose -f docker-compose.prod.yml logs -f

prod-logs-api: ## View production API logs
	docker-compose -f docker-compose.prod.yml logs -f api

prod-logs-worker: ## View production worker logs
	docker-compose -f docker-compose.prod.yml logs -f analytics-worker

prod-logs-beat: ## View production beat scheduler logs
	docker-compose -f docker-compose.prod.yml logs -f analytics-beat

prod-logs-web: ## View production web (nginx) logs
	docker-compose -f docker-compose.prod.yml logs -f web

prod-status: ## Show production container status
	@echo "$(BLUE)Production Services Status:$(NC)"
	@docker-compose -f docker-compose.prod.yml ps

prod-init-db: ## Initialize production database
	@echo "$(BLUE)Initializing production database...$(NC)"
	docker-compose -f docker-compose.prod.yml exec api sh /app/scripts/init-production.sh
	@echo "$(GREEN)✓ Database initialized$(NC)"

prod-backup: ## Create production database backup
	@echo "$(BLUE)Creating production database backup...$(NC)"
	docker-compose -f docker-compose.prod.yml exec postgres sh /scripts/backup-db.sh

prod-shell-db: ## Open production PostgreSQL shell
	docker-compose -f docker-compose.prod.yml exec postgres psql -U alphasignal -d alphasignal

prod-shell-api: ## Open production API container shell
	docker-compose -f docker-compose.prod.yml exec api sh

prod-shell-redis: ## Open production Redis CLI
	docker-compose -f docker-compose.prod.yml exec redis redis-cli

prod-update: ## Deploy latest code (git pull + rebuild + restart)
	@echo "$(BLUE)Deploying latest code...$(NC)"
	@echo "$(YELLOW)⚠️  This will restart all services$(NC)"
	@read -p "Continue? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		git pull origin main && \
		docker-compose -f docker-compose.prod.yml build && \
		docker-compose -f docker-compose.prod.yml up -d && \
		echo "$(GREEN)✓ Deployment complete$(NC)" && \
		make prod-health; \
	else \
		echo "Cancelled"; \
	fi

prod-health: ## Check production system health
	@echo "$(BLUE)Checking system health...$(NC)"
	@curl -s http://localhost/health/full 2>/dev/null | python3 -m json.tool || echo "$(YELLOW)⚠️  Health check endpoint not responding$(NC)"

prod-clean: ## Remove all production containers and volumes
	@echo "$(YELLOW)⚠️  WARNING: This will remove all containers, volumes, and images!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose -f docker-compose.prod.yml down -v --rmi all && \
		echo "$(GREEN)✓ Cleanup complete$(NC)"; \
	else \
		echo "Cancelled"; \
	fi

generate-secrets: ## Generate secrets for production
	@echo "$(BLUE)Generating secrets...$(NC)"
	@sh scripts/generate-secrets.sh

docker-stats: ## Show Docker resource usage statistics
	@echo "$(BLUE)Docker Statistics:$(NC)"
	@docker stats --no-stream

docker-prune: ## Prune unused Docker resources
	@echo "$(BLUE)Pruning unused Docker resources...$(NC)"
	docker system prune -f
	@echo "$(GREEN)✓ Cleanup complete$(NC)"
