#!/bin/bash

# CourtMaster Data Backup Script
# Creates backups of application data including database, uploads, and configuration

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="courtmaster-backup-${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory
create_backup_dir() {
    log_info "Creating backup directory: $BACKUP_PATH"
    mkdir -p "$BACKUP_PATH"
}

# Backup Docker volumes
backup_docker_volumes() {
    log_info "Backing up Docker volumes..."
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        log_warning "Docker is not running. Skipping Docker volume backup."
        return 0
    fi
    
    # List of volumes to backup
    local volumes=(
        "appwrite-mariadb-pilot"
        "appwrite-redis-pilot"
        "appwrite-uploads-pilot"
        "courtmaster-pilot-data"
        "courtmaster-worker-logs"
    )
    
    for volume in "${volumes[@]}"; do
        if docker volume inspect "$volume" >/dev/null 2>&1; then
            log_info "Backing up volume: $volume"
            docker run --rm -v "$volume":/data -v "$(pwd)/$BACKUP_PATH":/backup alpine tar czf "/backup/${volume}.tar.gz" -C /data .
            log_success "Volume $volume backed up"
        else
            log_warning "Volume $volume not found, skipping"
        fi
    done
}

# Backup application data directory
backup_app_data() {
    log_info "Backing up application data..."
    
    if [ -d "data" ]; then
        tar czf "$BACKUP_PATH/app-data.tar.gz" data/
        log_success "Application data backed up"
    else
        log_warning "No application data directory found"
    fi
}

# Backup configuration files
backup_config() {
    log_info "Backing up configuration files..."
    
    local config_files=(
        ".env.pilot"
        ".env.pilot-cloud"
        ".env.mvp"
        "docker-compose*.yml"
        "nginx.conf"
    )
    
    mkdir -p "$BACKUP_PATH/config"
    
    for pattern in "${config_files[@]}"; do
        for file in $pattern; do
            if [ -f "$file" ]; then
                cp "$file" "$BACKUP_PATH/config/"
                log_info "Backed up: $file"
            fi
        done
    done
    
    log_success "Configuration files backed up"
}

# Create backup manifest
create_manifest() {
    log_info "Creating backup manifest..."
    
    cat > "$BACKUP_PATH/manifest.json" << EOF
{
  "backup_name": "$BACKUP_NAME",
  "timestamp": "$TIMESTAMP",
  "date": "$(date -Iseconds)",
  "version": "1.0.0",
  "contents": {
    "docker_volumes": true,
    "app_data": $([ -d "data" ] && echo "true" || echo "false"),
    "config_files": true
  },
  "environment": {
    "hostname": "$(hostname)",
    "user": "$(whoami)",
    "pwd": "$(pwd)"
  }
}
EOF
    
    log_success "Backup manifest created"
}

# Compress final backup
compress_backup() {
    log_info "Compressing backup..."
    
    cd "$BACKUP_DIR"
    tar czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
    rm -rf "$BACKUP_NAME"
    
    log_success "Backup compressed: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
}

# Display backup summary
show_summary() {
    local backup_file="${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
    local size=$(du -h "$backup_file" | cut -f1)
    
    echo
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    Backup Complete                          ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
    echo -e "${BLUE}Backup File:${NC} $backup_file"
    echo -e "${BLUE}Size:${NC} $size"
    echo -e "${BLUE}Timestamp:${NC} $TIMESTAMP"
    echo
    echo -e "${YELLOW}To restore this backup, run:${NC}"
    echo -e "${YELLOW}  bash scripts/restore-data.sh $backup_file${NC}"
    echo
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                CourtMaster Data Backup                      ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    create_backup_dir
    backup_docker_volumes
    backup_app_data
    backup_config
    create_manifest
    compress_backup
    show_summary
    
    log_success "🎯 Backup completed successfully!"
}

# Execute main function
main "$@"
