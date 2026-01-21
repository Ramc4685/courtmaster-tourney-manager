#!/bin/bash

# Repository Cleanup Script
# Cleans up backup files, build artifacts, logs, and other temporary files
# while preserving essential project files

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
files_removed=0
dirs_removed=0
disk_space_freed=0

echo -e "${BLUE}🧹 Starting Repository Cleanup...${NC}"
echo "----------------------------------------"

# Function to calculate size before removal
calculate_size() {
    if [ -e "$1" ]; then
        if [ -d "$1" ]; then
            du -sb "$1" 2>/dev/null | cut -f1 || echo "0"
        else
            stat -f%z "$1" 2>/dev/null || stat -c%s "$1" 2>/dev/null || echo "0"
        fi
    else
        echo "0"
    fi
}

# Function to safely remove files/directories
safe_remove() {
    local target="$1"
    local description="$2"

    if [ -e "$target" ]; then
        local size=$(calculate_size "$target")

        if [ -d "$target" ]; then
            rm -rf "$target"
            dirs_removed=$((dirs_removed + 1))
            echo -e "${GREEN}✓${NC} Removed directory: $description"
        else
            rm -f "$target"
            files_removed=$((files_removed + 1))
            echo -e "${GREEN}✓${NC} Removed file: $description"
        fi

        disk_space_freed=$((disk_space_freed + size))
    fi
}

# Function to remove files matching a pattern
remove_pattern() {
    local pattern="$1"
    local description="$2"

    # Use find to safely handle patterns
    find . -name "$pattern" -type f 2>/dev/null | while read -r file; do
        if [ -f "$file" ]; then
            local size=$(calculate_size "$file")
            rm -f "$file"
            files_removed=$((files_removed + 1))
            disk_space_freed=$((disk_space_freed + size))
            echo -e "${GREEN}✓${NC} Removed: $file ($description)"
        fi
    done
}

echo -e "${YELLOW}📁 Cleaning backup files...${NC}"
# Remove backup files
remove_pattern "*.backup" "backup files"
remove_pattern "*.backup.*" "backup files with extensions"

echo -e "${YELLOW}🔧 Cleaning build artifacts...${NC}"
# Remove build artifacts
safe_remove "dist" "distribution directory"
safe_remove "dev-dist" "development distribution directory"
safe_remove "coverage" "test coverage directory"
safe_remove ".cache" "cache directory"
safe_remove ".next" "Next.js cache directory"
safe_remove ".nyc_output" "NYC output directory"

echo -e "${YELLOW}📝 Cleaning logs and temporary files...${NC}"
# Remove log files
remove_pattern "*.log" "log files"
remove_pattern "*.log.*" "rotated log files"
remove_pattern "*.tmp" "temporary files"
remove_pattern "*.temp" "temporary files"
remove_pattern "npm-debug.log*" "npm debug logs"
remove_pattern "yarn-debug.log*" "yarn debug logs"
remove_pattern "yarn-error.log*" "yarn error logs"

echo -e "${YELLOW}📦 Cleaning node modules cache...${NC}"
# Clean npm cache (but keep node_modules)
if [ -d "node_modules/.cache" ]; then
    safe_remove "node_modules/.cache" "node modules cache"
fi

# Clean Vite cache
safe_remove "node_modules/.vite" "Vite cache"

echo -e "${YELLOW}🐳 Cleaning Docker artifacts...${NC}"
# Clean Docker artifacts (only unused ones)
if command -v docker >/dev/null 2>&1; then
    echo "Cleaning unused Docker images..."
    docker image prune -f >/dev/null 2>&1 || echo "No Docker images to clean"

    echo "Cleaning unused Docker containers..."
    docker container prune -f >/dev/null 2>&1 || echo "No Docker containers to clean"

    echo "Cleaning unused Docker volumes..."
    docker volume prune -f >/dev/null 2>&1 || echo "No Docker volumes to clean"
else
    echo "Docker not available, skipping Docker cleanup"
fi

echo -e "${YELLOW}🗄️ Git cleanup...${NC}"
# Git garbage collection
if [ -d ".git" ]; then
    echo "Running git garbage collection..."
    git gc --aggressive --prune=now >/dev/null 2>&1 || echo "Git cleanup failed"
    echo -e "${GREEN}✓${NC} Git repository optimized"
else
    echo "Not a git repository, skipping git cleanup"
fi

echo -e "${YELLOW}🔍 Verification...${NC}"
# Verify essential files are still present
essential_files=(
    "package.json"
    "src/App.tsx"
    "src/main.tsx"
    "worker/package.json"
    "appwrite-migration/setup_collections.js"
)

all_essential_present=true
for file in "${essential_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}⚠️  Warning: Essential file missing: $file${NC}"
        all_essential_present=false
    fi
done

if [ "$all_essential_present" = true ]; then
    echo -e "${GREEN}✓${NC} All essential files verified present"
fi

# Convert bytes to human readable
format_size() {
    local size=$1
    if [ $size -gt 1073741824 ]; then
        echo "$(( size / 1073741824 )) GB"
    elif [ $size -gt 1048576 ]; then
        echo "$(( size / 1048576 )) MB"
    elif [ $size -gt 1024 ]; then
        echo "$(( size / 1024 )) KB"
    else
        echo "$size bytes"
    fi
}

echo ""
echo "----------------------------------------"
echo -e "${BLUE}📊 Cleanup Summary${NC}"
echo "----------------------------------------"
echo -e "Files removed: ${GREEN}$files_removed${NC}"
echo -e "Directories removed: ${GREEN}$dirs_removed${NC}"
echo -e "Disk space freed: ${GREEN}$(format_size $disk_space_freed)${NC}"
echo ""

if [ "$all_essential_present" = true ]; then
    echo -e "${GREEN}🎉 Repository cleanup completed successfully!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Cleanup completed with warnings. Please check missing files.${NC}"
    exit 1
fi