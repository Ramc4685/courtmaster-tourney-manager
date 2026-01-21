# CourtMaster Tournament Management E2E Tests

This directory contains comprehensive end-to-end tests covering the complete tournament lifecycle from creation to completion.

## 🏆 Test Structure

### Test Modules

1. **00-complete-workflow.spec.ts** - Complete tournament lifecycle test
2. **01-tournament-creation.spec.ts** - Tournament creation wizard tests
3. **02-player-management.spec.ts** - Player/team registration tests
4. **03-court-assignment.spec.ts** - Court management and assignment tests
5. **04-scheduling.spec.ts** - Match scheduling and bracket generation tests
6. **05-scoring.spec.ts** - Score entry and match completion tests
7. **06-tournament-completion.spec.ts** - Tournament finalization tests

### Helper Classes

- **AuthHelper** - Authentication and user management
- **NavigationHelper** - Page navigation and UI interaction
- **TournamentHelper** - Tournament creation and management
- **PlayerHelper** - Player/team registration and management
- **CourtHelper** - Court setup and assignment
- **SchedulingHelper** - Match scheduling and bracket management
- **ScoringHelper** - Score entry and match completion

## 🚀 Running Tests

### Prerequisites

1. **Application Running**: Ensure the application is running on `http://localhost:3000`
2. **Demo Credentials**: The tests use demo credentials:
   - Admin: `demoadmin@example.com` / `demopassword`
   - Player: `demoplayer@example.com` / `demopassword`

### Quick Start

```bash
# Run all tests
./e2e/run-tournament-tests.sh

# Run only complete workflow test
./e2e/run-tournament-tests.sh --workflow-only

# Run only individual module tests
./e2e/run-tournament-tests.sh --individual-only

# Make script executable if needed
chmod +x e2e/run-tournament-tests.sh
```

### Manual Test Execution

```bash
# Run specific test file
npx playwright test e2e/tests/01-tournament-creation.spec.ts

# Run with UI mode for debugging
npx playwright test e2e/tests/01-tournament-creation.spec.ts --ui

# Run in headed mode to see browser
npx playwright test e2e/tests/01-tournament-creation.spec.ts --headed
```

## 📋 Test Coverage

### Complete Tournament Workflow

The **00-complete-workflow.spec.ts** test executes the entire tournament lifecycle:

1. **Tournament Creation** - Create tournament using wizard
2. **Team Registration** - Add multiple teams with players
3. **Court Setup** - Configure tournament courts
4. **Schedule Generation** - Auto-generate match schedule
5. **Match Execution** - Play all matches with score entry
6. **Tournament Completion** - Verify final results and standings

### Individual Module Tests

Each module test focuses on specific functionality:

#### Tournament Creation (01)
- Create tournaments with different sports
- Validate required fields
- Test wizard navigation
- Handle different tournament formats

#### Player Management (02)
- Add individual players
- Create teams
- Handle player registration flow
- Bulk import functionality
- Player search and filtering

#### Court Assignment (03)
- Add courts to tournament
- Assign matches to courts
- Manage court status
- Handle scheduling conflicts
- Court utilization tracking

#### Scheduling (04)
- Generate automatic schedules
- Create manual matches
- Handle match rescheduling
- Conflict detection
- Multiple view modes

#### Scoring (05)
- Enter basic match scores
- Live scoring updates
- Score validation rules
- Different scoring formats
- Score corrections

#### Tournament Completion (06)
- Tournament status progression
- Generate reports and statistics
- Winner announcements
- Tournament archival
- Post-tournament feedback

## 🛠️ Configuration

### Environment Setup

Tests use the `.env.test` file which configures:
- Mock authentication services
- Test database settings
- Disabled external services

### Browser Support

Tests run on:
- **Desktop**: Chromium, Firefox, WebKit
- **Mobile**: Chrome Mobile, Safari Mobile

### Test Timeouts

- **Test Timeout**: 300 seconds (5 minutes)
- **Expect Timeout**: 5 seconds
- **Navigation Timeout**: 30 seconds

## 🔧 Troubleshooting

### Common Issues

1. **Application Not Running**
   ```bash
   npm run dev
   ```

2. **Authentication Failures**
   - Verify demo credentials are configured
   - Check mock auth service is enabled

3. **Timeout Errors**
   - Increase timeout in playwright.config.ts
   - Check for slow network conditions

4. **Element Not Found**
   - Verify UI selectors match current implementation
   - Check for dynamic content loading

### Debug Mode

```bash
# Run with debug mode
npx playwright test --debug

# Generate test report
npx playwright show-report
```

### Screenshots and Videos

Failed tests automatically capture:
- Screenshots on failure
- Video recordings
- Error context

Find outputs in `test-results/` directory.

## 📊 Expected Results

### Success Metrics

- **Complete Workflow**: Full tournament from creation to completion
- **Tournament Creation**: Successfully create tournaments for all sports
- **Player Management**: Register teams and handle approvals
- **Court Assignment**: Manage courts and assignments
- **Scheduling**: Generate and manage match schedules
- **Scoring**: Enter scores and progress tournaments
- **Completion**: Finalize tournaments with proper results

### Performance Targets

- **Tournament Creation**: < 30 seconds
- **Schedule Generation**: < 10 seconds
- **Score Entry**: < 5 seconds per match
- **Page Navigation**: < 3 seconds

## 🚀 Continuous Integration

### GitHub Actions

```yaml
- name: Run E2E Tests
  run: |
    npm run dev &
    sleep 10
    ./e2e/run-tournament-tests.sh
```

### Docker Integration

```bash
# Run tests in Docker
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## 📈 Reporting

### Test Reports

Generated reports include:
- HTML report with screenshots
- JSON results for CI integration
- JUnit XML for test tracking

### Metrics Tracked

- Test execution time
- Success/failure rates
- Browser compatibility
- Performance benchmarks

## 🔄 Maintenance

### Updating Tests

1. **UI Changes**: Update selectors in helper classes
2. **New Features**: Add test cases to appropriate modules
3. **Bug Fixes**: Add regression tests

### Best Practices

- Use data attributes for stable selectors
- Keep tests independent and isolated
- Clean up test data after execution
- Use meaningful test descriptions
- Document complex test scenarios

## 🆘 Support

For issues with the test suite:

1. Check application logs
2. Review test output and screenshots
3. Verify environment configuration
4. Run tests individually to isolate issues
5. Check for recent application changes affecting UI

---

*This test suite ensures the CourtMaster Tournament Management System works correctly across all major browsers and provides confidence in the complete tournament management workflow.*