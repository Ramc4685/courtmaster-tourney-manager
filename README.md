# CourtMaster Tournament Manager

A modern tournament management system for sports venues, built with React and following 12-factor app principles.

[![Test Coverage](https://img.shields.io/badge/coverage-80%25-brightgreen)](./coverage/index.html)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](./CHANGELOG.md)
[![12-Factor](https://img.shields.io/badge/12--factor-compliant-green)](https://12factor.net/)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Redis (for local development)

### Development Setup

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd courtmaster-tourney-manager
   npm install
   ```

2. **Configure environment**
   ```bash
   # Copy the environment template
   cp .env.template .env.development

   # Edit .env.development with your Appwrite credentials
   # (See Environment Configuration section below)
   ```

3. **Start development environment**
   ```bash
   npm run start:dev
   ```

That's it! CourtMaster will be running at:
- **Frontend**: http://localhost:3000
- **Worker API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 🏗️ Architecture

CourtMaster uses a clean, scalable architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Worker        │    │   Appwrite      │
│   (React PWA)   │◄──►│   (Background)  │◄──►│   (Cloud BaaS)  │
│   Port 3000     │    │   Port 3001     │    │   Cloud         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┼─────────────────────────────────┐
                                 │                                 │
                    ┌─────────────────┐                          │
                    │     Redis       │                          │
                    │   (Caching)     │                          │
                    │   Port 6379     │                          │
                    └─────────────────┘                          │
                                                                 │
              All services connect to cloud Appwrite ──────────┘
```

### Components

- **Frontend**: React PWA with offline support and real-time updates
- **Worker**: Background service for sync, notifications, and data processing
- **Redis**: Local caching and job queues
- **Appwrite**: Cloud backend-as-a-service (database, auth, storage)

## 🔧 Environment Configuration

### Required Environment Variables

All configurations are managed through environment files:

- `.env.template` - Master template with all variables documented
- `.env.development` - Development environment (not committed)
- `.env.production.template` - Production template (copy to `.env.production`)

### Appwrite Setup

1. **Create Appwrite Project** at https://cloud.appwrite.io
2. **Get your credentials** from the Appwrite console
3. **Configure `.env.development`**:

```bash
# Appwrite Cloud Configuration
VITE_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your-project-id
VITE_APPWRITE_DATABASE_ID=your-database-id
APPWRITE_API_KEY=your-api-key

# Worker Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password
```

## 📦 Available Commands

### Environment Commands
```bash
npm run start:dev      # Start development environment (all services)
npm run start:prod     # Start production environment (Docker)
npm run stop           # Stop all services
```

### Development Commands
```bash
npm run dev            # Frontend only (Vite dev server)
npm run build          # Build for production
npm run test           # Run tests
npm run lint           # Lint code
npm run type-check     # TypeScript type checking
```

### Docker Commands
```bash
npm run docker:build       # Build development image
npm run docker:build:prod  # Build production image
npm run docker:up          # Start all services with Docker
npm run docker:down        # Stop Docker services
npm run docker:logs        # View Docker logs
```

## 🏭 Production Deployment

### Option 1: Docker (Recommended)

1. **Prepare production environment**
   ```bash
   # Copy and configure production environment
   cp .env.production.template .env.production
   # Edit .env.production with your production values
   ```

2. **Deploy with Docker**
   ```bash
   # For production with Docker secrets
   echo "your-api-key" | docker secret create appwrite_api_key -
   echo "your-redis-password" | docker secret create redis_password -

   # Start production services
   npm run start:prod
   ```

### Option 2: Cloud Platforms

#### Vercel (Frontend Only)
```bash
# Deploy frontend to Vercel
npm run build
# Configure environment variables in Vercel dashboard
```

#### Railway/Render (Full Stack)
- Use the included Docker configuration
- Set environment variables in platform UI
- Configure Redis add-on

## 🔍 Health Monitoring

### Health Checks
```bash
# Check all services
curl http://localhost:3000/health    # Frontend
curl http://localhost:3001/health    # Worker

# Detailed worker status
curl http://localhost:3001/sync/status
```

### Logs
```bash
# Development logs (console output)
npm run start:dev

# Docker logs
npm run docker:logs

# Individual service logs
docker-compose logs -f worker
docker-compose logs -f web
```

## 🛠️ Development Workflow

### Adding Features
1. Start development environment: `npm run start:dev`
2. Make changes to source code
3. Test in browser at http://localhost:3000
4. Run tests: `npm run test`
5. Check types: `npm run type-check`
6. Lint code: `npm run lint`

### Environment Switching
No code changes needed! Just use different environment files:

```bash
# Development
npm run start:dev      # Uses .env.development

# Production
npm run start:prod     # Uses .env.production
```

## 📁 Project Structure

```
courtmaster-tourney-manager/
├── 📄 .env.template                    # Environment template
├── 📄 .env.production.template         # Production template
├── 🐳 Dockerfile                       # Multi-stage Docker build
├── 🐳 docker-compose.yml              # Development services
├── 🐳 docker-compose.production.yml   # Production overrides
├── 🌐 nginx.conf                       # Nginx configuration
├── 📦 package.json                     # Dependencies and scripts
├── 📁 scripts/                         # Deployment scripts
│   ├── 🚀 start-development.sh         # Development startup
│   ├── 🚀 start-production.sh          # Production startup
│   └── 🛑 stop-services.sh             # Service shutdown
├── 📁 src/                             # Application source code
├── 📁 worker/                          # Background worker service
└── 📚 docs/                            # Documentation
```

## 🔐 Security

### Development
- Auth bypass available for testing (`VITE_BYPASS_AUTH=true`)
- Local environment variables in `.env.development`
- Non-production API keys

### Production
- Auth bypass disabled
- Docker secrets for sensitive values
- Environment-specific configurations
- Nginx reverse proxy with SSL/TLS support

## 🧪 Testing

### Unit Tests
```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

### E2E Tests
```bash
npm run test:e2e          # Headless e2e tests
npm run test:e2e:headed   # Headed e2e tests
```

### Load Testing
```bash
cd scripts/load-testing
npm run load:test
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** following our coding standards
4. **Run tests**: `npm run test && npm run lint`
5. **Commit changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Code Standards
- Follow TypeScript best practices
- Use provided ESLint configuration
- Write tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the [docs/](docs/) directory
- **Issues**: Create an issue on GitHub
- **Health Checks**: Use the built-in health endpoints

## 🔄 Migration from Legacy Setup

If you're migrating from the old setup:

1. **Remove old environment files** (done automatically)
2. **Update your workflow** to use `npm run start:dev`
3. **Reconfigure CI/CD** to use the new Docker setup
4. **Update documentation** to reference new commands

The new setup is fully backward compatible - your application code doesn't need changes, only the deployment layer has been improved.

---

Built with ❤️ for tournament organizers worldwide.

## 🏆 Simple Tournament Management for Local Testing

CourtMaster MVP is a streamlined tournament management system focused on local development and testing. Perfect for getting started with tournament management without complex deployments.

## Table of Contents

1. [Quick Start Guide](#1-quick-start-guide)
2. [Demo Credentials](#2-demo-credentials)
3. [MVP Features](#3-mvp-features)
4. [Development](#4-development)
5. [Testing](#5-testing)
6. [Troubleshooting](#6-troubleshooting)

## 1. Quick Start Guide

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Local Environment**
   ```bash
   npm run setup:mvp
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Access the Application**
   - Open `http://localhost:3000` in your browser
   - Use the demo credentials below to log in

### Creating Your First Tournament

1. Log in with demo credentials
2. Navigate to the Tournaments page
3. Click "Create New Tournament"
4. Fill in basic details (name, sport, format, dates)
5. Add courts and configure categories
6. Add teams and begin tournament operations

## 2. Demo Credentials

The application includes built-in demo accounts for testing:

### Admin Account
- **Email**: `demoadmin@example.com`
- **Password**: `demopassword`
- **Access**: Full admin privileges

### Player Account
- **Email**: `demo@example.com`
- **Password**: `password`
- **Access**: Standard player privileges

*These credentials work with the MockAuthService that automatically activates when no external authentication is configured.*

## 3. MVP Features

### 🏅 Multi-Sport Support
- **Badminton**: 21-point games, deuce rules, best-of-3 sets
- **Tennis**: Set-based scoring, tiebreakers, advantage rules  
- **Volleyball**: Rally point system, rotation tracking, best-of-5 sets

### 🏆 Tournament Management
- **Multiple Formats**: Single/Double Elimination, Round Robin
- **Real-time Brackets**: Live bracket updates and progression
- **Basic Scheduling**: Manual match assignment to courts

### 🎯 Scoring System
- **Sport-Specific Rules**: Automated rule enforcement
- **Touch-Optimized**: Mobile-friendly scoring interface
- **Real-time Updates**: Live score updates

### 👥 User Management
- **Role-Based Access**: Admin and Player roles
- **Demo Authentication**: Built-in mock authentication for testing
- **Profile Management**: Basic user profile handling

## 4. Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run preview         # Preview production build

# Testing
npm test                # Run unit tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage
npm run test:e2e        # Run end-to-end tests

# Code Quality
npm run lint            # Check code style
npm run lint:fix        # Fix code style issues
npm run format          # Format code with Prettier
npm run type-check      # Check TypeScript types

# Utilities
npm run clean           # Clean build artifacts
npm run reinstall       # Clean install dependencies
npm run health:check    # Check application health
```

### Project Structure

```
src/
├── components/         # Reusable UI components
├── pages/             # Page components
├── services/          # Business logic and API calls
├── contexts/          # React contexts for state management
├── hooks/             # Custom React hooks
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
└── test/              # Test utilities and setup
```

## 5. Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- src/components/Tournament.test.tsx

# Run tests in watch mode
npm run test:watch
```

### Test Coverage

The system maintains good test coverage across critical components:
- **Sport Rules**: Comprehensive scoring logic tests
- **Tournament Logic**: Format and bracket management
- **UI Components**: User interaction testing
- **Service Layer**: API and business logic testing

## 6. Troubleshooting

### Common Issues

**Application won't start:**
```bash
# Clean install dependencies
npm run reinstall

# Check if port 3000 is available
lsof -ti:3000
```

**Login not working:**
- Make sure you're using the correct demo credentials
- The app uses MockAuthService automatically for local development
- No external authentication setup is required

**Tests failing:**
```bash
# Update dependencies and run tests
npm run reinstall
npm run test:coverage
```

**Build issues:**
```bash
# Clean build cache and rebuild
npm run clean
npm run build
```

### Getting Help

- Check the console for error messages
- Verify all dependencies are installed correctly
- Ensure you're using Node.js v18 or higher

---

**CourtMaster MVP** - Simple tournament management for local testing and development.
