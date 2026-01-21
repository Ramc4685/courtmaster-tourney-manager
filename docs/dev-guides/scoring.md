# Scoring System Developer Guide

## Overview

This guide provides detailed information for developers working with the CourtMaster scoring system, including sport-specific rules, the `useScoringLogic` hook, and implementation patterns.

## Architecture

### Scoring Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Scoring         │    │ Sport Rules     │    │ Score           │
│ Interface       │────│ Engine          │────│ Repository      │
│                 │    │                 │    │                 │
│ - UI Components │    │ - Rule Logic    │    │ - Data Access   │
│ - User Events   │    │ - Validation    │    │ - Persistence   │
│ - Real-time     │    │ - Calculations  │    │ - Sync          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## useScoringLogic Hook

### Hook Signature

```ts
interface UseScoringLogicReturn {
  // Core scoring operations
  updateScore: (team: TeamSelector, points: number) => Promise<ScoreUpdateResult>;
  validateScore: (score: MatchScore) => ValidationResult;
  resetMatch: () => Promise<void>;

  // State queries
  getCurrentSet: () => number;
  getCurrentScore: () => MatchScore;
  isMatchComplete: () => boolean;
  getWinner: () => string | null;
  getMatchDuration: () => number; // in minutes

  // Advanced operations
  undoLastUpdate: () => Promise<UndoResult>;
  getScoreHistory: () => ScoringEvent[];
  getSetHistory: () => SetScore[];

  // Metadata and reconciliation
  getScoreMetadata: () => ScoreMetadata;
  resolveConflict: (remoteScore: MatchScore, strategy: ConflictStrategy) => Promise<MatchScore>;

  // Event handlers
  onScoreUpdate: (callback: ScoreUpdateCallback) => UnsubscribeFunction;
  onMatchComplete: (callback: MatchCompleteCallback) => UnsubscribeFunction;
  onValidationError: (callback: ValidationErrorCallback) => UnsubscribeFunction;
}

type TeamSelector = 'team1' | 'team2' | number; // Index-based selection
type ConflictStrategy = 'local_wins' | 'remote_wins' | 'latest_timestamp' | 'manual';

interface ScoreUpdateResult {
  success: boolean;
  newScore: MatchScore;
  events: ScoringEvent[];
  warnings?: string[];
  errors?: string[];
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ScoreMetadata {
  version: number;
  timestamp: string; // ISO 8601 UTC
  updateId: string;
  lastUpdatedBy: string;
  checksum: string; // For integrity verification
}
```

**Parameters:**
- `sportType`: The sport being played (affects scoring rules)
- `matchId`: Unique identifier for the match

**Return Values:**
- Object containing scoring operations and state queries
- All score updates include timestamps and version numbers for conflict resolution

**Side Effects:**
- Updates match state in real-time
- Triggers bracket progression when match completes
- Emits events through the event bus system

## Sport-Specific Rules Implementation

### Rule Engine Architecture

```ts
interface SportRulesEngine {
  validateScoreUpdate(currentScore: MatchScore, update: ScoreUpdate): ValidationResult;
  calculateNewScore(currentScore: MatchScore, update: ScoreUpdate): MatchScore;
  isSetComplete(setScore: SetScore, settings: ScoringSettings): boolean;
  isMatchComplete(matchScore: MatchScore, settings: ScoringSettings): boolean;
  determineWinner(matchScore: MatchScore): string | null;
  getDisplayScore(matchScore: MatchScore): string;
  getAdvancedStats?(matchScore: MatchScore): AdvancedStats;
}

abstract class BaseSportRules implements SportRulesEngine {
  constructor(protected settings: ScoringSettings) {}

  abstract validateScoreUpdate(currentScore: MatchScore, update: ScoreUpdate): ValidationResult;
  abstract calculateNewScore(currentScore: MatchScore, update: ScoreUpdate): MatchScore;

  // Common implementations
  isSetComplete(setScore: SetScore, settings: ScoringSettings): boolean {
    const { pointsPerSet, minimumLeadToWin } = settings;
    const diff = Math.abs(setScore.team1Points - setScore.team2Points);
    const maxPoints = Math.max(setScore.team1Points, setScore.team2Points);

    return maxPoints >= pointsPerSet && diff >= minimumLeadToWin;
  }

  determineWinner(matchScore: MatchScore): string | null {
    if (!matchScore.isComplete) return null;

    const team1Sets = matchScore.sets.filter(set => set.winnerId === 'team1').length;
    const team2Sets = matchScore.sets.filter(set => set.winnerId === 'team2').length;

    return team1Sets > team2Sets ? 'team1' : 'team2';
  }
}
```

### Badminton Rules Implementation

```ts
class BadmintonRules extends BaseSportRules {
  validateScoreUpdate(currentScore: MatchScore, update: ScoreUpdate): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate point increment
    if (update.pointsDelta !== 1 && update.pointsDelta !== -1) {
      errors.push({
        code: 'INVALID_POINT_INCREMENT',
        message: 'Badminton scoring only allows +1 or -1 point changes'
      });
    }

    // Check for negative scores
    const currentSet = currentScore.sets[currentScore.currentSet];
    const newPoints = currentSet[`team${update.teamIndex + 1}Points`] + update.pointsDelta;

    if (newPoints < 0) {
      errors.push({
        code: 'NEGATIVE_SCORE',
        message: 'Score cannot be negative'
      });
    }

    // Warn about unusual score patterns
    if (newPoints > 30) {
      warnings.push({
        code: 'HIGH_SCORE',
        message: 'Unusually high score detected - please verify'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  calculateNewScore(currentScore: MatchScore, update: ScoreUpdate): MatchScore {
    const newScore = { ...currentScore };
    const currentSet = { ...newScore.sets[newScore.currentSet] };

    // Update points
    if (update.teamIndex === 0) {
      currentSet.team1Points += update.pointsDelta;
    } else {
      currentSet.team2Points += update.pointsDelta;
    }

    // Check if set is complete
    if (this.isSetComplete(currentSet, this.settings)) {
      currentSet.isComplete = true;
      currentSet.winnerId = currentSet.team1Points > currentSet.team2Points ? 'team1' : 'team2';

      // Start new set if match isn't complete
      if (!this.isMatchComplete(newScore, this.settings)) {
        newScore.currentSet++;
        newScore.sets.push({
          setNumber: newScore.currentSet + 1,
          team1Points: 0,
          team2Points: 0,
          isComplete: false
        });
      } else {
        newScore.isComplete = true;
        newScore.winnerId = this.determineWinner(newScore);
      }
    }

    newScore.sets[newScore.currentSet] = currentSet;
    return newScore;
  }

  getDisplayScore(matchScore: MatchScore): string {
    const currentSet = matchScore.sets[matchScore.currentSet];
    if (!currentSet) return '0-0';

    const setsInfo = matchScore.sets
      .filter(set => set.isComplete)
      .map(set => `${set.team1Points}-${set.team2Points}`)
      .join(', ');

    const currentInfo = `${currentSet.team1Points}-${currentSet.team2Points}`;

    return setsInfo ? `${setsInfo} | ${currentInfo}` : currentInfo;
  }
}
```

## Testing Scoring Logic

### Unit Testing Sport Rules

```ts
describe('BadmintonRules', () => {
  let rules: BadmintonRules;
  let settings: ScoringSettings;

  beforeEach(() => {
    settings = {
      pointsPerSet: 21,
      setsToWin: 2,
      minimumLeadToWin: 2,
      deuceBehavior: 'two_point_lead'
    };
    rules = new BadmintonRules(settings);
  });

  describe('standard scoring', () => {
    test('should handle normal point progression', () => {
      const initialScore = createEmptyScore();
      const update: ScoreUpdate = {
        teamIndex: 0,
        pointsDelta: 1,
        updateId: 'test-1',
        expectedVersion: 1
      };

      const result = rules.calculateNewScore(initialScore, update);

      expect(result.sets[0].team1Points).toBe(1);
      expect(result.sets[0].team2Points).toBe(0);
      expect(result.sets[0].isComplete).toBe(false);
    });

    test('should complete set at 21 points with 2-point lead', () => {
      const score = createScoreAt(21, 19);
      const update: ScoreUpdate = {
        teamIndex: 0,
        pointsDelta: 1,
        updateId: 'test-2',
        expectedVersion: 2
      };

      const result = rules.calculateNewScore(score, update);

      expect(result.sets[0].isComplete).toBe(true);
      expect(result.sets[0].winnerId).toBe('team1');
      expect(result.currentSet).toBe(1); // New set started
    });
  });

  describe('validation', () => {
    test('should reject negative scores', () => {
      const score = createScoreAt(0, 5);
      const update: ScoreUpdate = {
        teamIndex: 0,
        pointsDelta: -1,
        updateId: 'test-4',
        expectedVersion: 4
      };

      const validation = rules.validateScoreUpdate(score, update);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toHaveLength(1);
      expect(validation.errors[0].code).toBe('NEGATIVE_SCORE');
    });
  });
});
```

This developer guide provides comprehensive information for implementing and extending the scoring system in CourtMaster Tournament Management System.