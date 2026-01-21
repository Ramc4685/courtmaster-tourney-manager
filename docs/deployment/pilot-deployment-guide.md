# CourtMaster Pilot Deployment Guide

This comprehensive guide covers the enhanced pilot deployment process for the CourtMaster Tournament Manager, building upon the existing PILOT_README.md with production-grade deployment practices.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Enhanced Deployment Process](#enhanced-deployment-process)
4. [Security Configuration](#security-configuration)
5. [Performance Optimization](#performance-optimization)
6. [Monitoring and Alerting](#monitoring-and-alerting)
7. [Backup and Recovery](#backup-and-recovery)
8. [Scaling Guidelines](#scaling-guidelines)
9. [Troubleshooting](#troubleshooting)
10. [Maintenance Procedures](#maintenance-procedures)

## Prerequisites

### System Requirements

- **Server**: Ubuntu 20.04+ or CentOS 8+ with minimum 4GB RAM, 2 CPU cores, 20GB storage
- **Docker**: Version 20.10+ with Docker Compose v2.0+
- **Node.js**: Version 18+ for build processes
- **SSL Certificate**: Valid SSL certificate for HTTPS
- **Domain**: Configured domain with DNS pointing to server

### Required Services

- **Appwrite Cloud**: Active Appwrite Cloud project with API keys
- **Email Service**: SMTP configuration for notifications
- **Monitoring**: Optional Sentry/monitoring service integration

## Environment Setup

### 1. Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git unzip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Environment Configuration

Create environment-specific configuration files:

```bash
# Copy environment template
cp .env.pilot.example .env.pilot

# Edit configuration
nano .env.pilot
```

#### Required Environment Variables

```bash
# Application Configuration
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=pilot
VITE_APP_URL=https://pilot.courtmaster.app

# Appwrite Configuration
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-api-key

# Security Configuration
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key

# Monitoring Configuration
SENTRY_DSN=your-sentry-dsn
PERFORMANCE_MONITORING=true

# Notification Configuration
NOTIFICATION_WEBHOOK=your-slack-webhook
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
```

### 3. SSL Certificate Setup

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Generate SSL certificate
sudo certbot certonly --standalone -d pilot.courtmaster.app

# Verify certificate
sudo certbot certificates
```

## Enhanced Deployment Process

### 1. Using the Enhanced Deployment Script

The enhanced deployment script provides comprehensive automation:

```bash
# Make script executable
chmod +x scripts/pilot-deploy-enhanced.sh

# Deploy to pilot environment
DEPLOY_ENV=pilot ./scripts/pilot-deploy-enhanced.sh deploy

# Check deployment health
./scripts/pilot-deploy-enhanced.sh health-check

# Rollback if needed
./scripts/pilot-deploy-enhanced.sh rollback
```

### 2. Manual Deployment Steps

If you prefer manual deployment:

```bash
# 1. Clone repository
git clone https://github.com/your-org/courtmaster-tourney-manager.git
cd courtmaster-tourney-manager

# 2. Checkout specific version
git checkout v1.0.0

# 3. Build application
npm ci
npm run build

# 4. Build Docker images
docker-compose -f docker-compose.pilot.yml build

# 5. Start services
docker-compose -f docker-compose.pilot.yml up -d

# 6. Run health checks
bash scripts/deployment/health-monitor.sh
```

### 3. CI/CD Deployment

For automated deployments using GitHub Actions:

```bash
# Trigger deployment via GitHub Actions
gh workflow run "Enhanced Pilot Deployment" \
  --ref main \
  -f environment=pilot \
  -f force_deploy=false
```

## Security Configuration

### 1. Firewall Setup

```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Docker Security

```bash
# Create non-root user for Docker
sudo groupadd docker
sudo usermod -aG docker courtmaster
sudo systemctl restart docker

# Set up Docker daemon security
sudo nano /etc/docker/daemon.json
```

```json
{
  "userns-remap": "default",
  "no-new-privileges": true,
  "seccomp-profile": "/etc/docker/seccomp.json"
}
```

### 3. Application Security

- **API Keys**: Store in environment variables, never in code
- **HTTPS**: Enforce HTTPS with HSTS headers
- **CORS**: Configure proper CORS policies
- **Rate Limiting**: Implement API rate limiting
- **Input Validation**: Validate all user inputs
- **SQL Injection**: Use parameterized queries

## Performance Optimization

### 1. Server Optimization

```bash
# Optimize system limits
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# Configure swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### 2. Docker Optimization

```yaml
# docker-compose.pilot.yml optimizations
version: '3.8'
services:
  web:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 3. Application Performance

- **Caching**: Implement Redis caching for frequently accessed data
- **CDN**: Use CDN for static assets
- **Compression**: Enable gzip compression
- **Bundle Optimization**: Minimize JavaScript bundles
- **Database Indexing**: Optimize database queries with proper indexing

## Monitoring and Alerting

### 1. Health Monitoring Setup

```bash
# Set up automated health checks
crontab -e

# Add health check every 5 minutes
*/5 * * * * /opt/courtmaster/scripts/deployment/health-monitor.sh >> /var/log/courtmaster-health.log 2>&1
```

### 2. Log Management

```bash
# Configure log rotation
sudo nano /etc/logrotate.d/courtmaster
```

```
/var/log/courtmaster/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
}
```

### 3. Performance Monitoring

- **Metrics Collection**: CPU, memory, disk usage, network I/O
- **Application Metrics**: Response times, error rates, user activity
- **Database Monitoring**: Query performance, connection pool status
- **Real-time Alerts**: Set up alerts for critical thresholds

### 4. Alerting Configuration

```bash
# Example Slack notification
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"CourtMaster Pilot: High CPU usage detected"}' \
  $SLACK_WEBHOOK_URL
```

## Backup and Recovery

### 1. Automated Backup Setup

```bash
# Create backup script
nano /opt/courtmaster/scripts/backup-pilot.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/courtmaster"
DATE=$(date +%Y%m%d-%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application data
docker run --rm -v pilot_appwrite_data:/data -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/appwrite-data-$DATE.tar.gz -C /data .

# Backup configuration
cp -r /opt/courtmaster/.env.* $BACKUP_DIR/config-$DATE/

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

### 2. Recovery Procedures

```bash
# Stop services
docker-compose -f docker-compose.pilot.yml down

# Restore data
docker run --rm -v pilot_appwrite_data:/data -v $BACKUP_DIR:/backup \
  alpine tar xzf /backup/appwrite-data-YYYYMMDD-HHMMSS.tar.gz -C /data

# Restore configuration
cp $BACKUP_DIR/config-YYYYMMDD-HHMMSS/.env.* /opt/courtmaster/

# Start services
docker-compose -f docker-compose.pilot.yml up -d
```

### 3. Disaster Recovery Plan

1. **Data Loss**: Restore from latest backup
2. **Server Failure**: Deploy to new server using backup
3. **Application Corruption**: Rollback to previous version
4. **Database Issues**: Restore database from backup
5. **Network Issues**: Implement failover procedures

## Scaling Guidelines

### 1. Horizontal Scaling

```yaml
# docker-compose.pilot-scaled.yml
version: '3.8'
services:
  web:
    deploy:
      replicas: 3
    ports:
      - "3000-3002:3000"
  
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
```

### 2. Load Balancing

```nginx
# nginx.conf
upstream courtmaster {
    server web:3000;
    server web:3001;
    server web:3002;
}

server {
    listen 80;
    server_name pilot.courtmaster.app;
    
    location / {
        proxy_pass http://courtmaster;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. Database Scaling

- **Read Replicas**: Set up read replicas for heavy read workloads
- **Connection Pooling**: Implement connection pooling
- **Query Optimization**: Optimize slow queries
- **Caching Layer**: Add Redis for caching

## Troubleshooting

### Common Issues and Solutions

#### 1. Container Won't Start

```bash
# Check container logs
docker logs courtmaster-web-1

# Check resource usage
docker stats

# Restart container
docker-compose -f docker-compose.pilot.yml restart web
```

#### 2. Database Connection Issues

```bash
# Check Appwrite status
curl -f https://cloud.appwrite.io/v1/health

# Verify environment variables
docker exec courtmaster-web-1 env | grep APPWRITE

# Test database connection
docker exec courtmaster-web-1 curl -f http://localhost:3000/api/health
```

#### 3. SSL Certificate Issues

```bash
# Check certificate expiry
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test SSL configuration
openssl s_client -connect pilot.courtmaster.app:443
```

#### 4. Performance Issues

```bash
# Check system resources
htop
df -h
free -m

# Analyze application performance
docker exec courtmaster-web-1 npm run analyze:bundle

# Check network connectivity
ping pilot.courtmaster.app
traceroute pilot.courtmaster.app
```

### Diagnostic Commands

```bash
# System health check
./scripts/deployment/health-monitor.sh

# Application logs
docker logs courtmaster-web-1 --tail 100 -f

# Database status
docker exec courtmaster-appwrite-1 appwrite health

# Network connectivity
curl -I https://pilot.courtmaster.app

# Resource usage
docker system df
docker system prune -f
```

## Maintenance Procedures

### 1. Regular Maintenance Tasks

#### Daily
- Monitor system health and performance
- Check application logs for errors
- Verify backup completion
- Review security alerts

#### Weekly
- Update system packages
- Rotate log files
- Review performance metrics
- Test backup restoration

#### Monthly
- Update SSL certificates
- Review and update dependencies
- Perform security audit
- Optimize database performance

### 2. Update Procedures

```bash
# Update application
git pull origin main
npm run build
docker-compose -f docker-compose.pilot.yml build
docker-compose -f docker-compose.pilot.yml up -d

# Update system packages
sudo apt update && sudo apt upgrade -y
sudo reboot
```

### 3. Security Updates

```bash
# Update Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Update SSL certificates
sudo certbot renew

# Scan for vulnerabilities
npm audit
docker scan courtmaster:latest
```

## Integration with External Systems

### 1. Third-party Services

- **Payment Processing**: Stripe/PayPal integration
- **Email Services**: SendGrid/Mailgun setup
- **SMS Notifications**: Twilio integration
- **Analytics**: Google Analytics/Mixpanel

### 2. API Integrations

- **Tournament Platforms**: Challonge, Smash.gg APIs
- **Social Media**: Twitter, Discord webhooks
- **Calendar Systems**: Google Calendar, Outlook
- **Streaming Platforms**: Twitch, YouTube APIs

### 3. Webhook Configuration

```bash
# Set up webhooks for external notifications
curl -X POST https://api.external-service.com/webhooks \
  -H "Authorization: Bearer $API_TOKEN" \
  -d '{"url": "https://pilot.courtmaster.app/webhooks/external"}'
```

## Conclusion

This enhanced pilot deployment guide provides comprehensive coverage of production-grade deployment practices for the CourtMaster Tournament Manager. Follow these procedures to ensure a robust, secure, and scalable deployment.

For additional support:
- Check the troubleshooting section
- Review application logs
- Contact the development team
- Refer to the main documentation

Remember to always test changes in a staging environment before applying to production.
