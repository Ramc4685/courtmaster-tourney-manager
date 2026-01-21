# Repository Maintenance Guide

## Overview

This guide provides comprehensive instructions for maintaining the CourtMaster repository, keeping it clean, organized, and efficient. Regular maintenance ensures optimal development experience and prevents accumulation of unnecessary artifacts.

## Cleanup Procedures

### Automated Cleanup Script

The repository includes an automated cleanup script that can be run periodically:

```bash
npm run cleanup:repo
```

This script performs the following operations:

- **Removes backup files**: Cleans up `*.backup` and `*.backup.*` files
- **Cleans build artifacts**: Removes `dist/`, `dev-dist/`, `coverage/`, `.cache/`, `.next/`, `.nyc_output/`
- **Cleans logs**: Removes `*.log`, `*.tmp`, `*.temp`, npm/yarn debug logs
- **Cleans node modules cache**: Removes `node_modules/.cache` and `node_modules/.vite`
- **Cleans Docker artifacts**: Prunes unused Docker images, containers, and volumes
- **Git cleanup**: Runs `git gc --aggressive --prune=now` to optimize repository
- **Verification**: Ensures essential files are still present

### Manual Cleanup

For more targeted cleanup, you can manually remove specific types of files:

```bash
# Remove backup files
find . -name "*.backup*" -type f -delete

# Clean build artifacts
rm -rf dist dev-dist coverage .cache .next .nyc_output

# Clean logs
find . -name "*.log*" -type f -delete

# Clean temporary files
find . -name "*.tmp" -name "*.temp" -type f -delete
```

## File Organization Standards

### Project Structure

```
courtmaster-tourney-manager/
├── src/                    # Application source code
├── worker/                 # Background worker service (ESSENTIAL)
├── scripts/               # Operational and build scripts
├── docs/                  # Project documentation
├── appwrite-migration/    # Database migration scripts
├── docker/               # Docker configuration files
├── e2e/                  # End-to-end tests
└── public/               # Static assets
```

### Scripts Directory Guidelines

The `scripts/` directory should contain:

- **Operational scripts**: Scripts for deployment, database migration, monitoring
- **Build scripts**: Scripts for building, testing, and analysis
- **Utility scripts**: Development tools and maintenance scripts

**Do NOT place in scripts/**:
- Documentation files (`.md`)
- Product requirement documents (`.txt`)
- Development artifacts (`.json` reports)
- Temporary files or backups

### Documentation Organization

- **Core docs**: Place in `docs/` root for main documentation
- **Specialized docs**: Use subdirectories like `docs/deployment/`, `docs/maintenance/`
- **User guides**: Place in `docs/user-guides/`
- **Development guides**: Place in `docs/dev-guides/`

## Environment File Management

### Active Environment Files

The following environment files are actively used:

- `.env` - Main environment variables (gitignored)
- `.env.local` - Local development overrides (gitignored)
- `.env.ci` - CI/CD environment variables
- `.env.pilot` - Pilot deployment configuration
- `.env.pilot-cloud` - Cloud pilot deployment

### Unused Environment Files

The following files have been identified as unused and should be removed:

- `.env.zustand` - Legacy state management config
- `.env.mvp` - Old MVP configuration
- `.env.monitoring` - Replaced by deployment scripts

## Development Artifact Prevention

### IDE and Tool Artifacts

The `.gitignore` file is configured to prevent tracking of:

- `.bmad-core/` - BMAD development framework files
- `.windsurf/` - Windsurf IDE workspace files
- `.windsurfrules` - Windsurf IDE configuration
- `.vscode/`, `.idea/` - Common IDE files
- `.DS_Store`, `Thumbs.db` - OS-specific files

### Backup File Policies

**Automatic backups:**
- Temporary backup files (`*.backup`, `*.backup.*`) should be cleaned up regularly
- Use the cleanup script to remove old backups automatically

**Manual backups:**
- Create backups outside the repository when needed
- Use descriptive names with timestamps for manual backups
- Document backup locations in team documentation

## Worker Service Documentation

### Critical Importance

The `worker/` directory is **ESSENTIAL** for the application and must NEVER be deleted. It provides:

- **Background sync functionality**: Handles data synchronization between clients
- **Real-time notifications**: Processes and delivers notifications
- **Docker Compose integration**: Referenced in pilot deployment configurations
- **Queue processing**: Manages background job processing

### Worker Service Files

All files in the `worker/` directory serve important functions:

- `package.json` - Worker dependencies and scripts
- `src/` - Worker source code
- `Dockerfile` - Worker containerization
- Configuration files - Worker-specific settings

### Deployment Integration

The worker is integrated into Docker Compose configurations:

- `docker-compose.pilot.yml` - References worker service
- `docker-compose.pilot-cloud.yml` - Cloud deployment configuration
- Deployment scripts depend on worker availability

## Regular Maintenance Tasks

### Weekly Tasks

1. **Run cleanup script**: `npm run cleanup:repo`
2. **Update dependencies**: Check for dependency updates
3. **Review git status**: Ensure no unwanted files are tracked
4. **Check disk usage**: Monitor repository size

### Monthly Tasks

1. **Dependency audit**: `npm audit` and update security vulnerabilities
2. **Docker cleanup**: Clean unused Docker images and containers
3. **Git optimization**: Run git garbage collection
4. **Documentation review**: Update documentation as needed

### Quarterly Tasks

1. **Full dependency update**: Update all dependencies to latest versions
2. **Architecture review**: Review and update architecture documentation
3. **Performance audit**: Run performance tests and optimizations
4. **Security review**: Comprehensive security audit

## Monitoring and Alerts

### Repository Health Checks

Monitor these metrics regularly:

- **Repository size**: Should remain under reasonable limits
- **Build times**: Watch for increases that indicate bloat
- **Test coverage**: Maintain test coverage levels
- **Dependency count**: Monitor for unnecessary dependencies

### Automated Monitoring

Set up automated checks for:

- **Large file commits**: Alert on files over specified size
- **Backup file commits**: Prevent backup files from being committed
- **Build artifact commits**: Prevent build outputs from being committed
- **Security vulnerabilities**: Regular dependency scanning

## Troubleshooting

### Common Issues

**Repository size growing rapidly:**
- Run cleanup script
- Check for large files or build artifacts
- Review git history for large commits

**Build failures after cleanup:**
- Verify essential files are present
- Reinstall dependencies: `npm install`
- Check Docker containers are running

**Worker service issues:**
- Verify worker directory is intact
- Check Docker Compose configuration
- Review worker logs: `npm run logs:worker`

### Recovery Procedures

**If essential files are accidentally deleted:**
1. Check git history: `git log --oneline`
2. Restore from previous commit: `git checkout HEAD~1 -- <file>`
3. Verify application functionality
4. Run tests to ensure stability

**If worker service is damaged:**
1. **DO NOT** attempt to recreate from scratch
2. Restore from git: `git checkout HEAD -- worker/`
3. Rebuild worker: `npm run build:worker`
4. Test worker functionality: `npm run test:worker`

## Best Practices

### Development Workflow

1. **Before starting work**: Run cleanup script
2. **During development**: Avoid creating temporary files in repository
3. **Before committing**: Review staged changes for unwanted files
4. **After major changes**: Run full test suite

### Team Guidelines

1. **File naming**: Use descriptive names, avoid temporary naming
2. **Documentation**: Update documentation when adding new scripts or tools
3. **Cleanup responsibility**: Each developer should clean up their artifacts
4. **Review process**: Include maintenance checks in code reviews

### Emergency Procedures

**Critical system failure:**
1. **Stop all services**: `docker-compose down`
2. **Backup current state**: Create full repository backup
3. **Identify issue**: Check logs and recent changes
4. **Restore if needed**: Use git to restore to known good state
5. **Gradual restart**: Restart services one by one

**Data corruption:**
1. **Isolate issue**: Stop affected services
2. **Backup current state**: Even if corrupted, for analysis
3. **Restore from backup**: Use latest known good backup
4. **Verify integrity**: Run full test suite
5. **Document incident**: Record cause and resolution

---

## Quick Reference

### Essential Commands

```bash
# Repository cleanup
npm run cleanup:repo

# Full application build
npm run build

# Worker service commands
npm run dev:worker
npm run build:worker
npm run test:worker

# Docker operations
npm run docker:up:pilot
npm run docker:down:pilot
npm run docker:logs:pilot

# Testing
npm run test
npm run test:e2e
npm run test:performance

# Maintenance
npm run lint
npm run type-check
npm run audit:perf
```

### File Location Quick Reference

- **Scripts**: `scripts/`
- **Documentation**: `docs/`
- **Worker**: `worker/` (ESSENTIAL)
- **Migrations**: `appwrite-migration/`
- **Docker configs**: `docker/`
- **Tests**: `e2e/`, `src/**/*.test.*`

Remember: The `worker/` directory is critical infrastructure and must be preserved at all costs!