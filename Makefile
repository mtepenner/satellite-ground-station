.PHONY: up down build-go build-python build-react test-go test-python test-react test logs clean

## ── Local development ─────────────────────────────────────────────────────────

# Spin up the entire stack with Docker Compose
up:
	docker-compose up --build -d

# Tear down all containers and volumes
down:
	docker compose down -v

# Show live logs for all services
logs:
	docker-compose logs -f

# Remove build artefacts and stopped containers
clean:
	docker-compose down --rmi local -v --remove-orphans
	rm -rf frontend/dist frontend/node_modules
	rm -rf backend/__pycache__ backend/.pytest_cache

## ── Individual service builds ─────────────────────────────────────────────────

build-go:
	docker build -t satellite-ingestion:dev ./ingestion

build-python:
	docker build -t satellite-backend:dev ./backend

build-react:
	docker build -t satellite-frontend:dev ./frontend

## ── Tests ─────────────────────────────────────────────────────────────────────

test-go:
	docker run --rm \
		-v "$(CURDIR)/ingestion:/src" \
		-w /src \
		golang:1.21-alpine \
		go test ./... -v

test-python:
	docker run --rm \
		-v "$(CURDIR)/backend:/app" \
		-w /app \
		python:3.11-slim \
		sh -c "pip install -q -r requirements.txt pytest pytest-asyncio && python -m pytest tests/ -v"

test-react:
	docker run --rm \
		-v "$(CURDIR)/frontend:/app" \
		-w /app \
		node:20-alpine \
		sh -c "npm install --legacy-peer-deps --silent && npx vitest run"

# Run all test suites
test: test-go test-python test-react

## ── Kubernetes ────────────────────────────────────────────────────────────────

k8s-apply:
	kubectl apply -f k8s/

k8s-delete:
	kubectl delete -f k8s/
