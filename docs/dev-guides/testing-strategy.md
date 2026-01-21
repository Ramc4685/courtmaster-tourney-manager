# Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for the CourtMaster tournament management system, focusing on achieving 80% test coverage while ensuring robust, reliable functionality across all features.

## Testing Pyramid

Our testing approach follows the standard testing pyramid with specific allocations:

```
    /\
   /  \    E2E Tests (5%)
  /____\   - Critical user journeys
 /      \  - Cross-browser compatibility
/__________\ Integration Tests (20%)
            - Service interactions
            - Workflow testing
            - API integration
____________________________________________
Unit Tests (75%)
- Business logic
- Utility functions  
- Component behavior
- Service methods
```

## Test Categories

### Unit Tests (75%)

**Purpose**: Test individual functions, classes, and components in isolation.

**Location**: `src/test/unit/`

**Coverage Target**: 85%+

**Key Areas**:
- **Sport Rules** (`src/test/unit/rules/`)
  - Rule validation logic
  - Scoring calculations
  - Sport-specific configurations
  
- **Utility Functions** (`src/test/unit/utils/`)
  - Tournament utilities
  - Scoring rules validation
  - Data transformation helpers
  
- **Tournament Formats** (`src/test/unit/formats/`)
  - Bracket generation
  - Match progression
  - Standings calculation
  
- **Services** (`src/test/unit/services/`)
  - Business logic
  - Data persistence
  - Error handling
  
- **Components** (`src/test/unit/components/`)
  - UI behavior
  - User interactions
  - State management

**Best Practices**:
```typescript
// Example unit test structure
describe('SportRulesFactory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAvailableSports', () => {
    it('should return correct metadata for all registered sports', () => {
      const sports = SportRulesFactory.getAvailableSports();
      expect(sports).toHaveLength(3);
      expect(sports[0]).toEqual({
        id: 'badminton',
        name: 'Badminton',
        type: SportType.RACQUET
      });
    });
  });
});
```

### Integration Tests (20%)

**Purpose**: Test component interactions and complete workflows.

**Location**: `src/test/integration/`

**Coverage Target**: 70%+

**Key Scenarios**:
- **Tournament Workflow**
  - Tournament creation → team registration → bracket generation → scoring → completion
  - Multi-sport tournament management
  - Real-time synchronization
  
- **Scoring Workflows**
  - Match assignment → court allocation → live scoring → result recording
  - Sport-specific scoring rules
  - Offline/online synchronization

**Example Structure**:
```typescript
describe('Tournament Scoring Workflow', () => {
  it('should complete full badminton tournament', async () => {
    // 1. Create tournament
    // 2. Add teams and generate bracket  
    // 3. Score matches with sport-specific rules
    // 4. Verify bracket progression
    // 5. Complete tournament and verify results
  });
});
```

### Component Tests (5%)

**Purpose**: Test UI components with user interactions.

**Location**: `src/test/unit/components/`

**Coverage Target**: 75%+

**Focus Areas**:
- User interaction flows
- Form validation
- Responsive behavior
- Accessibility compliance
- Error state handling

## Sport-Specific Testing Patterns

### Badminton Testing
```typescript
const badmintonRules: ScoringRules = {
  pointsToWin: 21,
  mustWinByTwo: true,
  maxPoints: 30,
  setsToWin: 2
};

it('should validate badminton deuce scenarios', () => {
  expect(isSetComplete(20, 20, badmintonRules)).toBe(false);
  expect(isSetComplete(22, 20, badmintonRules)).toBe(true);
  expect(isSetComplete(30, 29, badmintonRules)).toBe(true);
});
```

### Tennis Testing
```typescript
const tennisRules: ScoringRules = {
  pointsToWin: 6,
  mustWinByTwo: true,
  maxPoints: 7,
  setsToWin: 2,
  tiebreakAt: 6
};

it('should handle tennis tiebreak scenarios', () => {
  expect(isSetComplete(6, 6, tennisRules)).toBe(false);
  expect(isSetComplete(7, 6, tennisRules)).toBe(true);
});
```

### Volleyball Testing
```typescript
const volleyballRules: ScoringRules = {
  pointsToWin: 25,
  mustWinByTwo: true,
  maxPoints: 30,
  setsToWin: 3,
  finalSetPoints: 15
};

it('should handle volleyball rally point system', () => {
  expect(isSetComplete(25, 20, volleyballRules)).toBe(true);
  expect(isSetComplete(24, 24, volleyballRules)).toBe(false);
});
```

## Component Testing Guidelines

### React Testing Library Best Practices

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('ScoreEntry Component', () => {
  it('should update scores via button clicks', async () => {
    const onScoreChange = vi.fn();
    render(<ScoreEntry onScoreChange={onScoreChange} />);
    
    const incrementButton = screen.getAllByText('+')[0];
    await userEvent.click(incrementButton);
    
    expect(onScoreChange).toHaveBeenCalledWith(1, 0);
  });

  it('should validate score input', async () => {
    render(<ScoreEntry scoringRules={badmintonRules} />);
    
    const input = screen.getByDisplayValue('0');
    await userEvent.type(input, '35'); // Invalid score
    
    expect(screen.getByText(/exceeds maximum/i)).toBeInTheDocument();
  });
});
```

### Accessibility Testing
```typescript
it('should have proper ARIA labels', () => {
  render(<ScoreEntry team1Name="Team A" team2Name="Team B" />);
  
  expect(screen.getByLabelText(/Team A score/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Team B score/i)).toBeInTheDocument();
});

it('should announce score changes', async () => {
  render(<ScoreEntry />);
  
  const incrementButton = screen.getAllByText('+')[0];
  await userEvent.click(incrementButton);
  
  expect(screen.getByRole('status')).toHaveTextContent(/Team A scores/i);
});
```

## Service Layer Testing

### Mocking Strategies

```typescript
// Mock Appwrite
vi.mock('../../../lib/appwrite', () => ({
  databases: {
    createDocument: vi.fn(),
    updateDocument: vi.fn(),
    getDocument: vi.fn()
  }
}));

// Test service methods
describe('TournamentService', () => {
  it('should create tournament with valid data', async () => {
    const mockTournament = createMockTournament();
    mockAppwrite.databases.createDocument.mockResolvedValue(mockTournament);
    
    const result = await tournamentService.createTournament(tournamentData);
    
    expect(result).toEqual(mockTournament);
    expect(mockAppwrite.databases.createDocument).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String), 
      expect.any(String),
      expect.objectContaining({
        name: 'Test Tournament',
        status: TournamentStatus.DRAFT
      })
    );
  });
});
```

### Error Handling Tests
```typescript
it('should handle network failures gracefully', async () => {
  mockAppwrite.databases.createDocument.mockRejectedValue(new Error('Network error'));
  
  await expect(
    tournamentService.createTournament(tournamentData)
  ).rejects.toThrow('Network error');
});

it('should retry failed operations', async () => {
  mockAppwrite.databases.updateDocument
    .mockRejectedValueOnce(new Error('Temporary error'))
    .mockResolvedValueOnce(mockTournament);
  
  const result = await tournamentService.updateTournament('id', updates);
  
  expect(mockAppwrite.databases.updateDocument).toHaveBeenCalledTimes(2);
  expect(result).toEqual(mockTournament);
});
```

## Integration Testing Workflows

### Tournament Creation Flow
```typescript
describe('Tournament Creation Workflow', () => {
  it('should complete end-to-end tournament setup', async () => {
    // 1. Create tournament
    const tournament = await createTournament(tournamentData);
    expect(tournament.status).toBe(TournamentStatus.DRAFT);
    
    // 2. Add teams
    await addTeam(tournament.id, team1);
    await addTeam(tournament.id, team2);
    
    // 3. Generate bracket
    const updatedTournament = await generateBracket(tournament.id);
    expect(updatedTournament.matches.length).toBeGreaterThan(0);
    
    // 4. Start tournament
    const activeTournament = await startTournament(tournament.id);
    expect(activeTournament.status).toBe(TournamentStatus.ACTIVE);
  });
});
```

### Multi-Sport Scenarios
```typescript
describe('Multi-Sport Tournament', () => {
  it('should handle concurrent scoring across sports', async () => {
    const tournament = createMultiSportTournament();
    
    // Score badminton match
    await scoreMatch('badminton-match-1', { team1Score: 21, team2Score: 15 });
    
    // Score tennis match concurrently
    await scoreMatch('tennis-match-1', { team1Score: 6, team2Score: 4 });
    
    // Verify both matches updated correctly
    const badmintonMatch = await getMatch('badminton-match-1');
    const tennisMatch = await getMatch('tennis-match-1');
    
    expect(badmintonMatch.sets[0]).toEqual({ team1Score: 21, team2Score: 15 });
    expect(tennisMatch.sets[0]).toEqual({ team1Score: 6, team2Score: 4 });
  });
});
```

## Performance Testing

### Benchmark Tests
```typescript
// src/test/performance/scoring.bench.ts
import { bench, describe } from 'vitest';

describe('Scoring Performance', () => {
  bench('calculate match winner', () => {
    const sets = [
      { team1Score: 21, team2Score: 15 },
      { team1Score: 21, team2Score: 18 }
    ];
    calculateMatchWinner(sets, badmintonRules);
  });

  bench('generate tournament bracket', () => {
    const teams = Array.from({ length: 16 }, (_, i) => createMockTeam());
    generateBracket(teams);
  });
});
```

### Load Testing
```typescript
it('should handle concurrent score updates', async () => {
  const promises = Array.from({ length: 100 }, (_, i) => 
    updateScore(matchId, { team1Score: i, team2Score: i - 1 })
  );
  
  const results = await Promise.allSettled(promises);
  const successful = results.filter(r => r.status === 'fulfilled');
  
  expect(successful.length).toBeGreaterThan(95); // 95% success rate
});
```

## Coverage Requirements

### Global Thresholds
- **Lines**: 80%
- **Branches**: 80%  
- **Functions**: 80%
- **Statements**: 80%

### Per-File Thresholds
- **Critical Business Logic**: 90%+
  - `src/services/rules/`
  - `src/utils/scoringRules.ts`
  
- **Service Layer**: 85%+
  - `src/services/tournament/`
  - `src/services/match/`
  
- **Components**: 75%+
  - `src/components/scoring/`
  - `src/components/tournament/`

## CI/CD Integration

### GitHub Actions Configuration
```yaml
name: Test Coverage
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests with coverage
        run: npm run test:coverage
        
      - name: Check coverage thresholds
        run: |
          if [ $(jq '.total.lines.pct' coverage/coverage-summary.json | cut -d. -f1) -lt 80 ]; then
            echo "Coverage below 80% threshold"
            exit 1
          fi
          
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
```

### Quality Gates
- ✅ All tests must pass
- ✅ Coverage must meet 80% threshold
- ✅ No critical security vulnerabilities
- ✅ Performance benchmarks within limits
- ✅ Accessibility tests passing

## Commands Reference

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run MVP-specific tests
npm run test -- --config vitest.mvp.config.ts

# Run specific test files
npm run test -- src/test/unit/rules
npm run test -- src/test/integration
npm run test -- src/test/unit/components

# Watch mode
npm run test:watch

# Performance benchmarks
npm run test:bench

# Generate coverage baseline
./scripts/coverage-baseline.sh

# Coverage with specific reporter
npm run test:coverage -- --reporter=html
npm run test:coverage -- --reporter=json
```

## Troubleshooting

### Common Issues

1. **Low Coverage on New Files**
   - Add unit tests for all new functions
   - Include edge cases and error scenarios
   - Test both success and failure paths

2. **Flaky Integration Tests**
   - Use proper async/await patterns
   - Mock external dependencies
   - Add appropriate timeouts

3. **Component Test Failures**
   - Ensure proper cleanup after each test
   - Mock all external dependencies
   - Use React Testing Library best practices

### Debugging Tips

```typescript
// Debug test output
it.only('debug specific test', () => {
  const { debug } = render(<Component />);
  debug(); // Prints DOM structure
});

// Check what's in the document
screen.debug();

// Find elements
screen.logTestingPlaygroundURL(); // Interactive element finder
```

---

*Last updated: 2025-09-17*
