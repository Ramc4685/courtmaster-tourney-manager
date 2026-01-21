# CourtMaster Tournament Manager - Deployment Guide

This guide explains how to run CourtMaster in different environments following 12-factor app principles.

## 🚀 Quick Start

### Development Environment
```bash
# 1. Copy environment template
cp .env.template .env.development

# 2. Configure your Appwrite credentials in .env.development

# 3. Start development environment
npm run start:dev
```

### Production Environment
```bash
# 1. Copy production template
cp .env.production.template .env.production

# 2. Configure production credentials in .env.production

# 3. Start production environment
npm run start:prod
```

## 🏗️ Architecture

CourtMaster uses a 3-service architecture:

1. **Frontend (Port 3000)** - React PWA with Vite
2. **Worker (Port 3001)** - Background sync and notifications
3. **Appwrite (Cloud)** - Backend-as-a-Service (`https://nyc.cloud.appwrite.io/v1`)
4. **Redis (Port 6379)** - Caching and worker queues

## 🔧 Environment Configuration

### Required Environment Variables

All environments require these variables in their respective `.env` files:

```bash
# Appwrite Configuration (Cloud-only)
VITE_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your-project-id
VITE_APPWRITE_DATABASE_ID=your-database-id
APPWRITE_API_KEY=your-api-key

# Worker Configuration
VITE_WORKER_URL=http://localhost:3001
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password
```

### Environment-Specific Settings

#### Development (`.env.development`)
- Auth bypass enabled (`VITE_BYPASS_AUTH=true`)
- Debug logging (`LOG_LEVEL=debug`)
- Fast sync interval (`SYNC_INTERVAL=30000`)

#### Production (`.env.production`)
- Auth bypass disabled (`VITE_BYPASS_AUTH=false`)
- Info logging (`LOG_LEVEL=info`)
- Conservative sync interval (`SYNC_INTERVAL=60000`)
- Docker secrets support

## 📦 Deployment Methods

### Method 1: Local Development (Recommended for Development)

```bash
# Prerequisites
brew install redis node npm

# Start services
npm run start:dev

# Stop services
npm run stop
```

**What it does:**
- Starts Redis locally
- Starts worker service in background
- Starts Vite dev server with hot reload
- Connects to cloud Appwrite

### Method 2: Docker Development

```bash
# Start with Docker
npm run docker:up:dev

# Stop
npm run docker:down
```

### Method 3: Docker Production

```bash
# Setup Docker secrets (production only)
echo "your-api-key" | docker secret create appwrite_api_key -
echo "your-redis-password" | docker secret create redis_password -

# Start production
npm run docker:up:prod

# Stop
npm run docker:down
```

## 🔒 Security & Secrets Management

### Development
- Environment variables in `.env.development`
- File not committed to version control

### Production
- Docker secrets for sensitive values
- Environment variables for non-sensitive config
- Secrets mounted at `/run/secrets/`

```bash
# Create Docker secrets
docker secret create appwrite_api_key /path/to/api-key-file
docker secret create redis_password /path/to/redis-password-file
```

## 🏥 Health Checks

All services include health checks:

```bash
# Frontend
curl http://localhost:3000/health

# Worker
curl http://localhost:3001/health

# Redis (via worker)
curl http://localhost:3001/sync/status
```

## 🔍 Monitoring & Logs

### Development Logs
```bash
# View all logs
npm run docker:logs

# Worker logs only
docker-compose logs -f worker
```

### Production Logs
- JSON structured logging
- Log rotation (10MB max, 3 files)
- Centralized via Docker logging drivers

## 🚀 Production Deployment Options

### Option 1: Docker Swarm
```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml -c docker-compose.production.yml courtmaster
```

### Option 2: Kubernetes
```bash
# Convert compose to k8s (using kompose)
kompose convert -f docker-compose.yml

# Apply to cluster
kubectl apply -f .
```

### Option 3: Cloud Platforms

#### Vercel (Frontend Only)
```bash
# Build command
npm run build

# Environment variables
VITE_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your-project-id
# ... other variables
```

#### Railway/Render (Full Stack)
- Use `docker-compose.production.yml`
- Set environment variables in platform UI
- Configure secrets management

## 📋 Available Commands

### NPM Scripts
```bash
# Environment commands
npm run start:dev        # Start development environment
npm run start:prod       # Start production environment
npm run stop            # Stop all services

# Docker commands
npm run docker:build    # Build development image
npm run docker:build:prod # Build production image
npm run docker:up       # Start with Docker (development)
npm run docker:up:dev   # Start development with Docker
npm run docker:up:prod  # Start production with Docker
npm run docker:down     # Stop Docker services
npm run docker:logs     # View Docker logs

# Development commands
npm run dev             # Vite dev server only
npm run build           # Build for production
npm run test            # Run tests
npm run lint            # Lint code
```

### Direct Commands
```bash
# Start individual services (development)
redis-server                          # Start Redis
cd worker && npm start               # Start worker
npm run dev                          # Start frontend
```

## 🔧 Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   ```bash
   # Install Redis
   brew install redis

   # Start Redis
   brew services start redis
   ```

2. **Worker Health Check Failed**
   ```bash
   # Check worker logs
   docker-compose logs worker

   # Verify Appwrite connection
   curl -X GET "https://nyc.cloud.appwrite.io/v1/health"
   ```

3. **Frontend Won't Load**
   ```bash
   # Check if all services are running
   curl http://localhost:3000/health
   curl http://localhost:3001/health

   # Restart services
   npm run stop && npm run start:dev
   ```

4. **Docker Build Fails**
   ```bash
   # Clean Docker cache
   docker system prune -a

   # Rebuild from scratch
   docker-compose build --no-cache
   ```

### Performance Tuning

#### Development
- Use local Redis for faster iteration
- Enable auth bypass for testing
- Increase sync intervals for less noise

#### Production
- Use Redis clustering for scale
- Configure proper resource limits
- Enable all security features
- Use CDN for static assets

## 📚 Additional Resources

- [12-Factor App Methodology](https://12factor.net/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Appwrite Documentation](https://appwrite.io/docs)
- [Redis Configuration](https://redis.io/topics/config)