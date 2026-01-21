# CourtMaster Testing Strategy

## 🏗️ Full-Stack Architecture Testing

Your application has a 3-tier architecture that requires comprehensive testing:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Frontend     │    │     Backend     │    │    Appwrite     │
│  (React/Vite)   │────│   (Services)    │────│  (Auth + DB)    │
│                 │    │                 │    │                 │
│ • Components    │    │ • API Services  │    │ • Authentication│
│ • Hooks         │    │ • Business Logic│    │ • Database      │
│ • UI Logic      │    │ • Repositories  │    │ • Storage       │
│ • State Mgmt    │    │ • Utilities     │    │ • Real-time     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🧪 Testing Pyramid Strategy

### 1. Unit Tests (70% of tests)
**Target: Business logic, utilities, and isolated components**

```bash
# Run unit tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

**Coverage Areas:**
- Service layer business logic
- Utility functions (scoring rules, date handling, etc.)
- Custom hooks
- Component behavior (isolated)
- State management

**Files to prioritize:**
- `src/services/**/*.ts` - Tournament management logic
- `src/utils/**/*.ts` - Scoring rules, validation
- `src/hooks/**/*.ts` - Custom React hooks
- `src/stores/**/*.ts` - State management

### 2. Integration Tests (20% of tests)
**Target: Component integration and service interactions**

```bash
# Run integration tests
npm run test:integration
```

**Coverage Areas:**
- Service + Repository integration
- Component + Hook integration
- Cross-service workflows
- Mock Appwrite interactions

### 3. E2E Tests (10% of tests)
**Target: Complete user workflows**

```bash
# Run complete E2E suite
npm run test:e2e:tournament

# Run specific workflows
npm run test:e2e:workflow
```

**Coverage Areas:**
- Complete tournament lifecycle
- User authentication flows
- Cross-browser compatibility
- Mobile responsiveness

## 🎯 Testing Environments

### 1. Local Development
```bash
# Frontend only (with mocked backend)
VITE_USE_MOCK_AUTH=true
VITE_USE_MOCK_DATA=true
npm run dev
```

### 2. Integration Testing
```bash
# Frontend + Appwrite (real backend)
VITE_APPWRITE_ENDPOINT=your-appwrite-endpoint
VITE_APPWRITE_PROJECT_ID=your-project-id
npm run dev
```

### 3. Full E2E Testing
```bash
# Complete system with test data
npm run test:e2e:tournament
```

## 🔧 Appwrite Testing Setup

### Mock Appwrite Service

Create mock implementations for testing:

```typescript
// src/services/auth/MockAuthService.ts
export class MockAuthService implements IAuthService {
  async login(email: string, password: string) {
    // Mock implementation for testing
    if (email === 'demoadmin@example.com' && password === 'demopassword') {
      return { id: 'mock-admin', email, role: 'admin' };
    }
    throw new Error('Invalid credentials');
  }
}
```

### Test Database Setup

```typescript
// src/test/appwrite-test-setup.ts
export async function setupTestDatabase() {
  // Create test collections
  // Seed test data
  // Return cleanup function
}
```

### Environment Configuration

```bash
# .env.test
VITE_APPWRITE_ENDPOINT=http://localhost:8080/v1
VITE_APPWRITE_PROJECT_ID=test-project
VITE_APPWRITE_DATABASE_ID=test-database
VITE_USE_MOCK_AUTH=true
VITE_USE_MOCK_DATA=true
```

## 📊 Code Coverage & Orphan Detection

### Running Coverage Analysis

```bash
# Complete coverage analysis
./scripts/test-coverage.sh

# Individual components
./scripts/test-coverage.sh --skip-e2e    # Unit tests only
./scripts/test-coverage.sh --skip-unit   # E2E tests only
./scripts/test-coverage.sh --skip-orphan # Skip orphan detection
```

### Coverage Targets

| Component | Target Coverage | Priority |
|-----------|----------------|----------|
| Services (Business Logic) | 90%+ | Critical |
| Utilities (Scoring Rules) | 85%+ | Critical |
| Hooks | 80%+ | High |
| Components | 75%+ | Medium |
| Types/Interfaces | N/A | Low |

### Orphan Code Detection

The coverage script automatically detects:
- ✅ Unused source files
- ✅ Unused dependencies
- ✅ Dead code branches
- ✅ Unreferenced exports

## 🚀 CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Test Coverage
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:coverage

      - name: Run E2E tests
        run: |
          npm run dev &
          sleep 10
          npm run test:e2e:tournament

      - name: Generate coverage report
        run: ./scripts/test-coverage.sh

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          directory: ./coverage
```

## 🛠️ Backend Testing Strategy

### Service Layer Testing

```typescript
// src/services/__tests__/TournamentService.test.ts
describe('TournamentService', () => {
  it('should create tournament with valid data', async () => {
    const mockRepo = createMockRepository();
    const service = new TournamentService(mockRepo);

    const result = await service.createTournament(validTournamentData);

    expect(result.id).toBeDefined();
    expect(result.name).toBe(validTournamentData.name);
  });
});
```

### Repository Layer Testing

```typescript
// src/repositories/__tests__/TournamentRepository.test.ts
describe('TournamentRepository', () => {
  beforeEach(() => {
    setupTestDatabase();
  });

  it('should persist tournament data correctly', async () => {
    const repo = new TournamentRepository(mockAppwrite);
    const tournament = await repo.create(testTournament);

    expect(tournament.id).toBeDefined();
  });
});
```

## 📱 Mobile & PWA Testing

### Mobile-Specific Tests

```typescript
// e2e/mobile/mobile-workflow.spec.ts
test.describe('Mobile Tournament Management', () => {
  test.use({ ...devices['iPhone 12'] });

  test('should handle touch interactions', async ({ page }) => {
    // Test mobile-specific functionality
  });
});
```

### PWA Testing

```bash
# Test PWA functionality
npm run test:pwa

# Test offline capabilities
npm run test:e2e:offline
```

## 🔍 Performance Testing

### Load Testing

```bash
# Tournament load testing
npm run test:load

# Stress testing
npm run test:load:stress
```

### Performance Monitoring

```typescript
// src/test/performance/tournament-performance.test.ts
test('tournament creation should complete within 2 seconds', async () => {
  const startTime = Date.now();
  await createTournament(testData);
  const endTime = Date.now();

  expect(endTime - startTime).toBeLessThan(2000);
});
```

## 🗂️ Test Data Management

### Test Data Generation

```typescript
// src/test/fixtures/tournament-fixtures.ts
export const createTestTournament = (overrides = {}) => ({
  name: 'Test Tournament',
  sport: 'badminton',
  startDate: '2025-01-01',
  endDate: '2025-01-03',
  ...overrides
});
```

### Database Seeding

```typescript
// src/test/seed/tournament-seed.ts
export async function seedTournamentData() {
  // Create test tournaments
  // Add test teams
  // Generate test matches
}
```

## 📈 Continuous Improvement

### Metrics to Track

1. **Code Coverage**: Target 80%+ overall
2. **Test Performance**: Tests should run in < 5 minutes
3. **Flaky Test Rate**: < 1% failure rate
4. **Orphan Code**: < 5% unused code

### Regular Maintenance

- **Weekly**: Review coverage reports
- **Monthly**: Update test data and scenarios
- **Quarterly**: Evaluate testing strategy effectiveness

## 🚨 Test Alerts & Monitoring

### Coverage Alerts

```bash
# Set up coverage thresholds
# Alert when coverage drops below 80%
# Block deployments on test failures
```

### Performance Alerts

```bash
# Monitor test execution time
# Alert on slow tests (> 30s)
# Track E2E test stability
```

## 🎓 Best Practices

### Writing Effective Tests

1. **AAA Pattern**: Arrange, Act, Assert
2. **Descriptive Names**: Test behavior, not implementation
3. **Independent Tests**: No test dependencies
4. **Fast Execution**: Unit tests < 100ms
5. **Reliable**: No flaky tests

### Test Organization

```
src/
├── services/
│   ├── TournamentService.ts
│   └── __tests__/
│       └── TournamentService.test.ts
├── test/
│   ├── fixtures/
│   ├── mocks/
│   └── utils/
└── e2e/
    ├── tests/
    ├── helpers/
    └── fixtures/
```

## 🔧 Debugging Tests

### Debug Unit Tests

```bash
# Run specific test
npm test -- --grep "TournamentService"

# Debug mode
npm test -- --inspect-brk
```

### Debug E2E Tests

```bash
# Run with browser visible
npx playwright test --headed

# Debug mode
npx playwright test --debug

# Slow motion
npx playwright test --slow-mo=1000
```

---

This comprehensive testing strategy ensures your CourtMaster application maintains high quality across all layers while efficiently detecting and removing orphaned code.