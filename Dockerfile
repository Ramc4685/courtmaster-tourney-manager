# CourtMaster Tournament Manager - Unified Dockerfile
# Multi-stage build for both development and production

# =============================================================================
# Base Node.js Image
# =============================================================================
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    curl \
    bash \
    git

# Set working directory
WORKDIR /app

# =============================================================================
# Dependencies Stage
# =============================================================================
FROM base AS dependencies

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci --include=dev

# =============================================================================
# Development Stage
# =============================================================================
FROM dependencies AS development

# Copy source code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S courtmaster -u 1001 -G nodejs

# Change ownership of app directory
RUN chown -R courtmaster:nodejs /app

# Switch to non-root user
USER courtmaster

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start development server
CMD ["npm", "run", "dev"]

# =============================================================================
# Build Stage (for production)
# =============================================================================
FROM dependencies AS build

# Set environment to production for build
ENV NODE_ENV=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# =============================================================================
# Production Dependencies Stage
# =============================================================================
FROM base AS production-deps

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production --ignore-scripts

# =============================================================================
# Production Stage
# =============================================================================
FROM base AS production

# Install nginx for serving static files
RUN apk add --no-cache nginx

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S courtmaster -u 1001 -G nodejs

# Copy production dependencies
COPY --from=production-deps --chown=courtmaster:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=build --chown=courtmaster:nodejs /app/dist ./dist
COPY --from=build --chown=courtmaster:nodejs /app/package*.json ./

# Create nginx directories and set permissions
RUN mkdir -p /var/log/nginx /var/lib/nginx/tmp /run/nginx && \
    chown -R nginx:nginx /var/log/nginx /var/lib/nginx /run/nginx && \
    chown -R courtmaster:nodejs /app

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start nginx and serve static files
CMD ["nginx", "-g", "daemon off;"]
