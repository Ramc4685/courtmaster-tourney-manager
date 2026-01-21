#!/bin/bash

# CourtMaster Development Environment Startup Script
# This script starts all services needed for development

set -e

echo "🚀 Starting CourtMaster in Development Mode..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    lsof -ti tcp:"$1" >/dev/null 2>&1
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1

    echo -e "${YELLOW}Waiting for $service_name to be ready...${NC}"

    while ! curl -f "$url" >/dev/null 2>&1; do
        if [ $attempt -eq $max_attempts ]; then
            echo -e "${RED}❌ $service_name failed to start after $max_attempts attempts${NC}"
            return 1
        fi
        echo -e "${YELLOW}Attempt $attempt/$max_attempts: $service_name not ready yet...${NC}"
        sleep 2
        ((attempt++))
    done

    echo -e "${GREEN}✅ $service_name is ready!${NC}"
}

# Check prerequisites
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

if ! command_exists redis-server; then
    echo -e "${RED}❌ Redis is not installed. Please install Redis first:${NC}"
    echo -e "${YELLOW}brew install redis${NC}"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

# Load development environment
if [ ! -f ".env.development" ]; then
    echo -e "${RED}❌ .env.development file not found${NC}"
    echo -e "${YELLOW}Please copy .env.template to .env.development and configure it${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"

# Start Redis if not running
echo -e "${BLUE}🗄️  Starting Redis...${NC}"
if port_in_use 6379; then
    echo -e "${YELLOW}Redis is already running on port 6379${NC}"
else
    if command_exists brew; then
        brew services start redis
    else
        redis-server &
    fi
    sleep 2
fi

# Check Redis connection
if redis-cli ping >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis is running${NC}"
else
    echo -e "${RED}❌ Could not connect to Redis${NC}"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    npm install
fi

if [ ! -d "worker/node_modules" ]; then
    echo -e "${BLUE}📦 Installing worker dependencies...${NC}"
    cd worker && npm install && cd ..
fi

# Stop any existing processes
echo -e "${BLUE}🛑 Stopping any existing processes...${NC}"
pkill -f "vite" || true
pkill -f "worker/src/index.js" || true

# Start worker service in background
echo -e "${BLUE}⚙️  Starting worker service...${NC}"
cd worker

# Load environment variables from development file
set -a  # automatically export all variables
source ../.env.development
set +a  # stop automatically exporting

# Start worker with environment variables
node src/index.js &
WORKER_PID=$!
cd ..

# Wait for worker to be ready
sleep 3
if ! wait_for_service "http://localhost:3001/health" "Worker Service"; then
    echo -e "${RED}❌ Worker service failed to start${NC}"
    kill $WORKER_PID 2>/dev/null || true
    exit 1
fi

# Start frontend development server
echo -e "${BLUE}🌐 Starting frontend development server...${NC}"

# Load environment variables for frontend
set -a  # automatically export all variables
source .env.development
set +a  # stop automatically exporting

# Start frontend with environment variables
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to be ready
sleep 5
if ! wait_for_service "http://localhost:3000" "Frontend Service"; then
    echo -e "${RED}❌ Frontend service failed to start${NC}"
    kill $WORKER_PID $FRONTEND_PID 2>/dev/null || true
    exit 1
fi

# Save PIDs for cleanup
echo $WORKER_PID > .worker.pid
echo $FRONTEND_PID > .frontend.pid

echo ""
echo -e "${GREEN}🎉 CourtMaster Development Environment is ready!${NC}"
echo ""
echo -e "${BLUE}📋 Service URLs:${NC}"
echo -e "   Frontend:    ${GREEN}http://localhost:3000${NC}"
echo -e "   Worker API:  ${GREEN}http://localhost:3001${NC}"
echo -e "   Health:      ${GREEN}http://localhost:3001/health${NC}"
echo ""
echo -e "${YELLOW}To stop all services, run: npm run stop${NC}"
echo ""

# Keep script running
wait