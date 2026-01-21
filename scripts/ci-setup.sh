#!/bin/bash

# CourtMaster CI Environment Setup Script
# This script prepares the CI environment for GitHub Actions workflows

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CI_ENV_FILE=".env.ci"
NODE_VERSION="20"
CHROME_VERSION="stable"

# Logging functions
log_info() {
    echo -e "${BLUE}[CI-INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[CI-SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[CI-WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[CI-ERROR]${NC} $1"
}

# Check if running in CI environment
check_ci_environment() {
    if [ "$CI" != "true" ]; then
        log_warning "Not running in CI environment. Some steps may not work as expected."
    else
        log_info "Running in CI environment: $GITHUB_ACTIONS"
    fi
}

# Setup Node.js environment
setup_nodejs() {
    log_info "Setting up Node.js environment..."
    
    # Node.js should already be installed by GitHub Actions
    NODE_ACTUAL_VERSION=$(node --version)
    log_success "Node.js $NODE_ACTUAL_VERSION is available"
    
    # Check npm
    NPM_VERSION=$(npm --version)
    log_success "npm $NPM_VERSION is available"
    
    # Set npm configuration for CI
    npm config set audit-level moderate
    npm config set fund false
    npm config set update-notifier false
    
    log_success "Node.js environment configured"
}

# Install system dependencies
install_system_dependencies() {
    log_info "Installing system dependencies..."
    
    # Update package lists
    if command -v apt-get >/dev/null 2>&1; then
        sudo apt-get update -qq
        
        # Install required packages
        sudo apt-get install -y \
            curl \
            wget \
            git \
            build-essential \
            python3 \
            python3-pip \
            libnss3-dev \
            libgconf-2-4 \
            libxss1 \
            libappindicator1 \
            fonts-liberation \
            libappindicator3-1 \
            libasound2-dev \
            libatk-bridge2.0-0 \
            libdrm2 \
            libgtk-3-0 \
            libnspr4 \
            libnss3 \
            libx11-xcb1 \
            libxcomposite1 \
            libxcursor1 \
            libxdamage1 \
            libxi6 \
            libxtst6 \
            ca-certificates
            
        log_success "System dependencies installed"
    else
        log_warning "apt-get not available, skipping system dependencies"
    fi
}

# Install browser dependencies for testing
install_browser_dependencies() {
    log_info "Installing browser dependencies..."
    
    # Install Chrome for testing
    if command -v apt-get >/dev/null 2>&1; then
        # Add Google Chrome repository
        wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
        echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
        
        sudo apt-get update -qq
        sudo apt-get install -y google-chrome-stable
        
        # Verify Chrome installation
        CHROME_VERSION=$(google-chrome --version)
        log_success "Chrome installed: $CHROME_VERSION"
    else
        log_warning "Cannot install Chrome, skipping browser dependencies"
    fi
    
    # Install Playwright browsers (if used)
    if grep -q "@playwright" package.json 2>/dev/null; then
        log_info "Installing Playwright browsers..."
        npx playwright install --with-deps
        log_success "Playwright browsers installed"
    fi
}

# Setup test databases and services
setup_test_services() {
    log_info "Setting up test services..."
    
    # Start Docker if available
    if command -v docker >/dev/null 2>&1; then
        log_info "Docker is available, setting up test containers..."
        
        # Create test docker-compose file
        cat > docker-compose.test.yml << 'EOF'
version: '3.8'
services:
  test-redis:
    image: redis:7.2-alpine
    ports:
      - "6380:6379"
    command: redis-server --requirepass "test_password"
    
  test-db:
    image: mariadb:10.11
    ports:
      - "3307:3306"
    environment:
      - MYSQL_ROOT_PASSWORD=test_root_pass
      - MYSQL_DATABASE=courtmaster_test
      - MYSQL_USER=test_user
      - MYSQL_PASSWORD=test_pass
    command: --innodb-buffer-pool-size=128M --max-connections=50
EOF
        
        # Start test services
        docker-compose -f docker-compose.test.yml up -d
        
        # Wait for services to be ready
        log_info "Waiting for test services to start..."
        sleep 15
        
        log_success "Test services started"
    else
        log_warning "Docker not available, using in-memory alternatives"
    fi
}

# Setup environment variables for CI
setup_ci_environment() {
    log_info "Setting up CI environment variables..."
    
    cat > "$CI_ENV_FILE" << EOF
# CourtMaster CI Environment Configuration
NODE_ENV=test
CI=true

# Test Database Configuration
TEST_DB_HOST=localhost
TEST_DB_PORT=3307
TEST_DB_NAME=courtmaster_test
TEST_DB_USER=test_user
TEST_DB_PASS=test_pass

# Test Redis Configuration
TEST_REDIS_HOST=localhost
TEST_REDIS_PORT=6380
TEST_REDIS_PASS=test_password

# Mock Appwrite Configuration
VITE_APPWRITE_ENDPOINT=http://localhost:8080/v1
VITE_APPWRITE_PROJECT_ID=test-project
APPWRITE_API_KEY=test-api-key

# Test Application Configuration
VITE_OFFLINE_MODE=false
VITE_SYNC_INTERVAL=1000
VITE_WORKER_URL=http://localhost:3001

# Performance Testing
LIGHTHOUSE_CI_TOKEN=${LIGHTHOUSE_CI_TOKEN:-}
CODECOV_TOKEN=${CODECOV_TOKEN:-}

# Browser Testing
HEADLESS=true
BROWSER_TIMEOUT=30000

# Logging
LOG_LEVEL=error
SUPPRESS_NO_CONFIG_WARNING=true
EOF
    
    log_success "CI environment variables configured"
}

# Install and verify dependencies
install_dependencies() {
    log_info "Installing project dependencies..."
    
    # Clear npm cache
    npm cache clean --force
    
    # Install dependencies with exact versions for reproducibility
    npm ci --legacy-peer-deps --prefer-offline --no-audit
    
    # Install global tools needed for CI
    npm install -g \
        @lhci/cli@0.12.x \
        audit-ci@^6.6.1 \
        npm-check-updates@^16.14.0
    
    # Install worker dependencies if present
    if [ -d "worker" ]; then
        log_info "Installing worker dependencies..."
        cd worker
        npm ci --prefer-offline --no-audit
        cd ..
    fi
    
    log_success "Dependencies installed"
}

# Setup test data and fixtures
setup_test_data() {
    log_info "Setting up test data and fixtures..."
    
    # Create test data directory
    mkdir -p test/fixtures
    mkdir -p test/mocks
    mkdir -p coverage
    
    # Create mock data files
    cat > test/fixtures/tournament-data.json << 'EOF'
{
  "tournaments": [
    {
      "id": "test-tournament-1",
      "name": "Test Tournament",
      "sport": "tennis",
      "format": "single-elimination",
      "participants": 16,
      "status": "upcoming"
    }
  ],
  "players": [
    {
      "id": "player-1",
      "name": "Test Player 1",
      "email": "player1@test.com"
    },
    {
      "id": "player-2", 
      "name": "Test Player 2",
      "email": "player2@test.com"
    }
  ]
}
EOF
    
    # Create environment-specific test config
    cat > test/setup-ci.js << 'EOF'
// CI-specific test setup
import { beforeAll, afterAll } from 'vitest';

beforeAll(async () => {
  // Setup CI-specific test environment
  process.env.NODE_ENV = 'test';
  process.env.CI = 'true';
  
  // Mock external services
  global.fetch = vi.fn();
  
  // Setup test database connections
  console.log('Setting up CI test environment...');
});

afterAll(async () => {
  // Cleanup after tests
  console.log('Cleaning up CI test environment...');
});
EOF
    
    log_success "Test data and fixtures created"
}

# Configure performance monitoring
setup_performance_monitoring() {
    log_info "Setting up performance monitoring..."
    
    # Create Lighthouse CI configuration
    cat > .lighthouserc.js << 'EOF'
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000'],
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local:',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        'categories:pwa': ['warn', { minScore: 0.8 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
EOF
    
    # Create audit-ci configuration
    cat > .audit-ci.json << 'EOF'
{
  "moderate": true,
  "allowlist": [],
  "report-type": "summary",
  "output-format": "text"
}
EOF
    
    log_success "Performance monitoring configured"
}

# Verify CI setup
verify_setup() {
    log_info "Verifying CI setup..."
    
    # Check Node.js and npm
    node --version
    npm --version
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        log_error "node_modules directory not found"
        exit 1
    fi
    
    # Check if test environment file exists
    if [ ! -f "$CI_ENV_FILE" ]; then
        log_error "CI environment file not found"
        exit 1
    fi
    
    # Test basic commands
    npm run lint --if-present
    
    # Check if Docker services are running (if Docker is available)
    if command -v docker >/dev/null 2>&1; then
        docker ps --format "table {{.Names}}\t{{.Status}}"
    fi
    
    log_success "CI setup verification completed"
}

# Cleanup function
cleanup_on_exit() {
    log_info "Cleaning up CI setup..."
    
    # Stop test services if they were started
    if [ -f "docker-compose.test.yml" ]; then
        docker-compose -f docker-compose.test.yml down -v 2>/dev/null || true
        rm -f docker-compose.test.yml
    fi
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                 CourtMaster CI Setup                         ║"
    echo "║              Continuous Integration Environment              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Set trap for cleanup
    trap cleanup_on_exit EXIT
    
    # Run setup steps
    check_ci_environment
    setup_nodejs
    install_system_dependencies
    install_browser_dependencies
    setup_test_services
    setup_ci_environment
    install_dependencies
    setup_test_data
    setup_performance_monitoring
    verify_setup
    
    log_success "🎉 CI environment setup completed successfully!"
    
    echo
    echo -e "${GREEN}CI Environment Ready:${NC}"
    echo -e "  📊 Test databases: ${BLUE}localhost:3307${NC}"
    echo -e "  🔧 Redis cache: ${BLUE}localhost:6380${NC}"
    echo -e "  🌐 Environment: ${YELLOW}$CI_ENV_FILE${NC}"
    echo
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "CourtMaster CI Setup Script"
        echo
        echo "Usage: $0 [options]"
        echo
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --verify       Only verify the setup"
        echo "  --clean        Clean up CI environment"
        echo
        exit 0
        ;;
    --verify)
        verify_setup
        exit 0
        ;;
    --clean)
        cleanup_on_exit
        rm -f "$CI_ENV_FILE"
        log_success "CI environment cleaned up"
        exit 0
        ;;
    "")
        main
        ;;
    *)
        log_error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac
