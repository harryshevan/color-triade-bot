.PHONY: help build up down restart logs shell clean dev test

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

setup: ## Setup environment (copy .env.example to .env)
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✓ Created .env file. Please edit it with your values."; \
	else \
		echo "✓ .env file already exists"; \
	fi

build: ## Build the Docker image
	docker compose build

up: ## Start the bot in detached mode
	docker compose up -d

down: ## Stop and remove containers
	docker compose down

restart: ## Restart the bot
	docker compose restart

logs: ## View bot logs (follow mode)
	docker compose logs -f colorbot

logs-dev: ## View dev logs (follow mode)
	docker compose logs -f colorbot-dev

ps: ## Show running containers
	docker compose ps

shell: ## Open a shell in the running container
	docker compose exec colorbot sh

shell-dev: ## Open a shell in the dev container
	docker compose exec colorbot-dev sh

clean: ## Stop containers and remove volumes
	docker compose down -v

clean-all: ## Remove everything (containers, volumes, images)
	docker compose down -v --rmi all

rebuild: down build up ## Rebuild and restart the bot

dev: ## Start in development mode with hot reload
	docker compose --profile dev up colorbot-dev

dev-build: ## Build and start in development mode
	docker compose --profile dev up --build colorbot-dev

dev-down: ## Stop development container
	docker compose --profile dev down

health: ## Check container health
	@docker inspect colorbot --format='{{.State.Health.Status}}' 2>/dev/null || echo "Container not running"

status: ## Show detailed status
	@echo "=== Container Status ==="
	@docker compose ps
	@echo ""
	@echo "=== Health Status ==="
	@make health
	@echo ""
	@echo "=== Recent Logs (last 20 lines) ==="
	@docker compose logs --tail=20 colorbot

inspect: ## Inspect the running container
	docker inspect colorbot

stats: ## Show container resource usage
	docker stats colorbot --no-stream

prune: ## Clean up unused Docker resources
	docker system prune -f

prune-all: ## Clean up all unused Docker resources (including volumes)
	docker system prune -af --volumes

# Production deployment targets
deploy: setup build up ## Full deployment (setup + build + start)
	@echo "✓ Deployment complete!"
	@echo "Run 'make logs' to view logs"

# Quick actions
quick-restart: ## Quick restart without rebuilding
	docker compose restart colorbot

quick-logs: ## Show last 50 log lines
	docker compose logs --tail=50 colorbot

