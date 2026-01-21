# CourtMaster Worker Container
# Background processing for offline sync, notifications, and data processing

FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies for better performance
RUN apk update && apk add --no-cache \
    tini \
    curl \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S worker -u 1001

# Copy package files
COPY package*.json ./

# Install dependencies with production optimizations
RUN npm install --only=production --silent && \
    npm cache clean --force

# Copy source code
COPY src/ ./src/

# Create directories for logs and data
RUN mkdir -p /app/logs /app/data && \
    chown -R worker:nodejs /app

# Switch to non-root user
USER worker

# Expose health check port
EXPOSE 3001

# Use tini as init system for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Start the worker service
CMD ["node", "src/index.js"]