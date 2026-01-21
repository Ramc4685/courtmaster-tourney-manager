#!/bin/bash

# CourtMaster Data Restore Script
# Restores application data from backup files

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_FILE="$1"
RESTORE_DIR="restore_temp"

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

# Show usage
show_usage() {
    echo "CourtMaster Data Restore Script"
    echo
    echo "Usage: $0 <backup-file>"
    echo
    echo "Examples:"
    echo "  $0 backups/courtmaster-backup-20241217_105040.tar.gz"
    echo "  $0 /path/to/backup.tar.gz"
    echo
}

# Validate backup file
validate_backup() {
    if [ -z "$BACKUP_FILE" ]; then
        log_error "No backup file specified"
        show_usage
        exit 1
    fi
    
    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    
    log_success "Backup file found: $BACKUP_FILE"
}

# Extract backup
extract_backup() {
    log_info "Extracting backup file..."
    
    # Clean up any existing restore directory
    rm -rf "$RESTORE_DIR"
    mkdir -p "$RESTORE_DIR"
    
    # Extract the backup
    tar xzf "$BACKUP_FILE" -C "$RESTORE_DIR" --strip-components=1
    
    log_success "Backup extracted to $RESTORE_DIR"
}

# Read backup manifest
read_manifest() {
    local manifest_file="$RESTORE_DIR/manifest.json"
    
    if [ -f "$manifest_file" ]; then
        log_info "Reading backup manifest..."
        
        # Extract key information (basic parsing without jq dependency)
        local backup_name=$(grep '"backup_name"' "$manifest_file" | cut -d'"' -f4)
        local timestamp=$(grep '"timestamp"' "$manifest_file" | cut -d'"' -f4)
        local date=$(grep '"date"' "$manifest_file" | cut -d'"' -f4)
        
        echo -e "${BLUE}Backup Name:${NC} $backup_name"
        echo -e "${BLUE}Timestamp:${NC} $timestamp"
        echo -e "${BLUE}Date:${NC} $date"
        echo
        
        log_success "Manifest read successfully"
    else
        log_warning "No manifest file found in backup"
    fi
}

# Restore Docker volumes
restore_docker_volumes() {
    log_info "Restoring Docker volumes..."
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        log_warning "Docker is not running. Skipping Docker volume restore."
        return 0
    fi
    
    # Find volume backup files
    for volume_backup in "$RESTORE_DIR"/*.tar.gz; do
        if [ -f "$volume_backup" ]; then
            local volume_name=$(basename "$volume_backup" .tar.gz)
            
            log_info "Restoring volume: $volume_name"
            
            # Create volume if it doesn't exist
            docker volume create "$volume_name" >/dev/null 2>&1 || true
            
            # Restore volume data
            docker run --rm -v "$volume_name":/data -v "$(pwd)/$volume_backup":/backup.tar.gz alpine sh -c "cd /data && tar xzf /backup.tar.gz"
            
            log_success "Volume $volume_name restored"
        fi
    done
}

# Restore application data
restore_app_data() {
    local app_data_backup="$RESTORE_DIR/app-data.tar.gz"
    
    if [ -f "$app_data_backup" ]; then
        log_info "Restoring application data..."
        
        # Backup existing data if it exists
        if [ -d "data" ]; then
            log_warning "Existing data directory found, creating backup..."
            mv data "data.backup.$(date +%Y%m%d_%H%M%S)"
        fi
        
        # Extract application data
        tar xzf "$app_data_backup"
        
        log_success "Application data restored"
    else
        log_info "No application data backup found"
    fi
}

# Restore configuration files
restore_config() {
    local config_dir="$RESTORE_DIR/config"
    
    if [ -d "$config_dir" ]; then
        log_info "Restoring configuration files..."
        
        # List of config files to restore
        for config_file in "$config_dir"/*; do
            if [ -f "$config_file" ]; then
                local filename=$(basename "$config_file")
                
                # Backup existing config if it exists
                if [ -f "$filename" ]; then
                    log_info "Backing up existing $filename"
                    cp "$filename" "${filename}.backup.$(date +%Y%m%d_%H%M%S)"
                fi
                
                # Restore config file
                cp "$config_file" "$filename"
                log_info "Restored: $filename"
            fi
        done
        
        log_success "Configuration files restored"
    else
        log_info "No configuration backup found"
    fi
}

# Cleanup restore directory
cleanup() {
    log_info "Cleaning up temporary files..."
    rm -rf "$RESTORE_DIR"
    log_success "Cleanup completed"
}

# Confirm restore operation
confirm_restore() {
    echo -e "${YELLOW}⚠️  WARNING: This will restore data from backup and may overwrite existing data.${NC}"
    echo -e "${YELLOW}   Existing data will be backed up before restoration.${NC}"
    echo
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Restore operation cancelled"
        exit 0
    fi
}

# Display restore summary
show_summary() {
    echo
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                   Restore Complete                          ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
    echo -e "${BLUE}Backup File:${NC} $BACKUP_FILE"
    echo -e "${BLUE}Restored:${NC} $(date)"
    echo
    echo -e "${YELLOW}Next steps:${NC}"
    echo -e "${YELLOW}  1. Restart Docker services: npm run docker:up:pilot${NC}"
    echo -e "${YELLOW}  2. Verify application functionality${NC}"
    echo -e "${YELLOW}  3. Check logs for any issues${NC}"
    echo
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║               CourtMaster Data Restore                      ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    validate_backup
    confirm_restore
    extract_backup
    read_manifest
    restore_docker_volumes
    restore_app_data
    restore_config
    cleanup
    show_summary
    
    log_success "🎯 Restore completed successfully!"
}

# Execute main function
main "$@"
