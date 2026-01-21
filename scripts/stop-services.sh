#!/bin/bash

# CourtMaster Service Shutdown Script
# This script stops all running CourtMaster services

set -e

echo "🛑 Stopping CourtMaster services..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Stop Docker services if running
echo -e "${BLUE}🐳 Stopping Docker services...${NC}"
if docker-compose ps -q >/dev/null 2>&1; then
    docker-compose down
fi

# Stop development processes
echo -e "${BLUE}💻 Stopping development processes...${NC}"

# Kill processes by PID files
if [ -f ".worker.pid" ]; then
    WORKER_PID=$(cat .worker.pid)
    if kill -0 $WORKER_PID 2>/dev/null; then
        echo -e "${YELLOW}Stopping worker process (PID: $WORKER_PID)...${NC}"
        kill $WORKER_PID
    fi
    rm -f .worker.pid
fi

if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${YELLOW}Stopping frontend process (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID
    fi
    rm -f .frontend.pid
fi

# Kill any remaining processes
echo -e "${BLUE}🔍 Cleaning up any remaining processes...${NC}"
pkill -f "vite" || true
pkill -f "worker/src/index.js" || true
pkill -f "node.*src/index.js" || true

# Stop Redis if it was started by the development script
echo -e "${BLUE}🗄️  Stopping Redis (if started by development script)...${NC}"
if command -v brew >/dev/null 2>&1; then
    # Only stop if it's managed by brew
    if brew services list | grep redis | grep started >/dev/null; then
        echo -e "${YELLOW}Redis is managed by brew, leaving it running...${NC}"
        echo -e "${YELLOW}To stop Redis manually: brew services stop redis${NC}"
    fi
else
    # Kill redis-server processes that might have been started by the script
    pkill -f redis-server || true
fi

# Clean up any temporary files
echo -e "${BLUE}🧹 Cleaning up temporary files...${NC}"
rm -f .worker.pid .frontend.pid

echo ""
echo -e "${GREEN}✅ All CourtMaster services have been stopped${NC}"
echo ""