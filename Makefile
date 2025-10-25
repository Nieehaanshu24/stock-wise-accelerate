# Root Makefile for Dynamic Stock Analyzer
# Builds all components: C modules, native addon, backend, frontend

.PHONY: all clean build-c build-native build-backend build-frontend \
        docker-build docker-up docker-down test verify help

# Default target
all: build-all

# Build all components
build-all: build-c build-native build-backend build-frontend
	@echo "✓ All components built successfully"

# Build C shared library
build-c:
	@echo "Building C modules..."
	cd c_modules && $(MAKE) clean && $(MAKE)
	@echo "✓ C modules built"

# Build Node.js native addon
build-native: build-c
	@echo "Building native addon..."
	cd backend/native && npm install && npm run build
	@echo "✓ Native addon built"

# Build backend
build-backend: build-native
	@echo "Building backend..."
	cd backend && npm install && npm run build
	@echo "✓ Backend built"

# Build frontend
build-frontend:
	@echo "Building frontend..."
	npm install && npm run build
	@echo "✓ Frontend built"

# Run tests
test: test-c test-backend test-frontend
	@echo "✓ All tests passed"

test-c:
	@echo "Testing C modules..."
	cd c_modules && $(MAKE) test
	@echo "✓ C module tests passed"

test-backend:
	@echo "Testing backend..."
	cd backend && npm test
	@echo "✓ Backend tests passed"

test-frontend:
	@echo "Testing frontend..."
	npm test
	@echo "✓ Frontend tests passed"

# Docker operations
docker-build:
	@echo "Building Docker images..."
	docker-compose build
	@echo "✓ Docker images built"

docker-up:
	@echo "Starting services..."
	docker-compose up -d
	@echo "✓ Services started"
	@echo "Frontend: http://localhost:8080"
	@echo "Backend:  http://localhost:3001"

docker-down:
	@echo "Stopping services..."
	docker-compose down
	@echo "✓ Services stopped"

docker-logs:
	docker-compose logs -f

# Development setup
dev-setup: build-all
	@echo "Setting up development environment..."
	@test -f .env || cp .env.example .env
	@test -f backend/.env || cp backend/.env.example backend/.env
	@mkdir -p backend/cache backend/logs backend/data/portfolios
	@echo "✓ Development environment ready"
	@echo ""
	@echo "Next steps:"
	@echo "1. Edit .env and backend/.env with your configuration"
	@echo "2. Run 'make dev' to start development servers"

dev:
	@echo "Starting development servers..."
	@echo "Backend will run on port 3001"
	@echo "Frontend will run on port 5173"
	@cd backend && npm run dev & cd .. && npm run dev

# Verification
verify:
	@echo "Running verification checks..."
	@chmod +x tools/verify_no_sample_data.sh
	@./tools/verify_no_sample_data.sh
	@echo "✓ Verification complete"

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	cd c_modules && $(MAKE) clean
	rm -rf backend/native/build backend/native/dist backend/native/node_modules
	rm -rf backend/dist backend/node_modules backend/cache backend/logs
	rm -rf node_modules dist
	@echo "✓ Clean complete"

# Deep clean including data
clean-all: clean
	@echo "Performing deep clean..."
	rm -rf backend/data
	@echo "✓ Deep clean complete"

# Install dependencies only
install:
	@echo "Installing dependencies..."
	npm install
	cd backend && npm install
	cd backend/native && npm install
	@echo "✓ Dependencies installed"

# Production build
production: clean build-all
	@echo "Building for production..."
	@echo "✓ Production build complete"
	@echo ""
	@echo "Deploy with: docker-compose up -d"

# Help
help:
	@echo "Dynamic Stock Analyzer - Build System"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  all            - Build all components (default)"
	@echo "  build-all      - Build C modules, native addon, backend, frontend"
	@echo "  build-c        - Build C shared library"
	@echo "  build-native   - Build Node.js native addon"
	@echo "  build-backend  - Build backend TypeScript"
	@echo "  build-frontend - Build frontend React app"
	@echo ""
	@echo "Testing:"
	@echo "  test           - Run all tests"
	@echo "  test-c         - Run C module tests"
	@echo "  test-backend   - Run backend tests"
	@echo "  test-frontend  - Run frontend tests"
	@echo ""
	@echo "Docker:"
	@echo "  docker-build   - Build Docker images"
	@echo "  docker-up      - Start services in containers"
	@echo "  docker-down    - Stop containers"
	@echo "  docker-logs    - View container logs"
	@echo ""
	@echo "Development:"
	@echo "  dev-setup      - Initial development setup"
	@echo "  dev            - Start development servers"
	@echo "  install        - Install all dependencies"
	@echo ""
	@echo "Maintenance:"
	@echo "  clean          - Remove build artifacts"
	@echo "  clean-all      - Deep clean including data"
	@echo "  verify         - Verify no sample data in repo"
	@echo "  production     - Build for production deployment"
	@echo ""
	@echo "For more information, see README.md"
