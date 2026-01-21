#!/bin/bash

# CourtMaster Production Environment Startup Script
# This script starts all services needed for production using Docker

set -e

echo "🚀 Starting CourtMaster in Production Mode..."

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

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=60
    local attempt=1

    echo -e "${YELLOW}Waiting for $service_name to be ready...${NC}"

    while ! curl -f "$url" >/dev/null 2>&1; do
        if [ $attempt -eq $max_attempts ]; then
            echo -e "${RED}❌ $service_name failed to start after $max_attempts attempts${NC}"
            return 1
        fi
        echo -e "${YELLOW}Attempt $attempt/$max_attempts: $service_name not ready yet...${NC}"
        sleep 5
        ((attempt++))
    done

    echo -e "${GREEN}✅ $service_name is ready!${NC}"
}

# Check prerequisites
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

if ! command_exists docker; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command_exists docker-compose; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check for production environment file
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ .env.production file not found${NC}"
    echo -e "${YELLOW}Please copy .env.production.template to .env.production and configure it${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"

# Build production images
echo -e "${BLUE}🏗️  Building production images...${NC}"
docker-compose -f docker-compose.yml -f docker-compose.production.yml build

# Stop any existing services
echo -e "${BLUE}🛑 Stopping any existing services...${NC}"
docker-compose -f docker-compose.yml -f docker-compose.production.yml down

# Start production services
echo -e "${BLUE}🚀 Starting production services...${NC}"
ENV=production docker-compose -f docker-compose.yml -f docker-compose.production.yml up -d

# Wait for services to be ready
echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"

# Check Redis
if ! wait_for_service "http://localhost:6379" "Redis"; then
    echo -e "${YELLOW}Warning: Redis health check failed, but continuing...${NC}"
fi

# Check Worker
if ! wait_for_service "http://localhost:3001/health" "Worker Service"; then
    echo -e "${RED}❌ Worker service failed to start${NC}"
    echo -e "${YELLOW}Checking logs...${NC}"
    docker-compose -f docker-compose.yml -f docker-compose.production.yml logs worker
    exit 1
fi

# Check Frontend
if ! wait_for_service "http://localhost:3000" "Frontend Service"; then
    echo -e "${RED}❌ Frontend service failed to start${NC}"
    echo -e "${YELLOW}Checking logs...${NC}"
    docker-compose -f docker-compose.yml -f docker-compose.production.yml logs web
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 CourtMaster Production Environment is ready!${NC}"
echo ""
echo -e "${BLUE}📋 Service URLs:${NC}"
echo -e "   Frontend:    ${GREEN}http://localhost:3000${NC}"
echo -e "   Worker API:  ${GREEN}http://localhost:3001${NC}"
echo -e "   Health:      ${GREEN}http://localhost:3001/health${NC}"
echo ""
echo -e "${BLUE}📊 Useful Commands:${NC}"
echo -e "   Logs:        ${YELLOW}docker-compose logs -f${NC}"
echo -e "   Status:      ${YELLOW}docker-compose ps${NC}"
echo -e "   Stop:        ${YELLOW}npm run stop${NC}"
echo ""