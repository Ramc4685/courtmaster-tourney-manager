# CourtMaster Sport Integration Guide

This guide provides detailed instructions for adding support for new sports to the CourtMaster Tournament Management System. The system is designed with a flexible architecture that allows for the addition of new sports without modifying the core codebase.

## Table of Contents

1. [Sport Rules Framework Overview](#sport-rules-framework-overview)
2. [Prerequisites](#prerequisites)
3. [Implementation Steps](#implementation-steps)
4. [Testing and Validation](#testing-and-validation)
5. [Registration and Integration](#registration-and-integration)
6. [Advanced Topics](#advanced-topics)
7. [Examples](#examples)
8. [Troubleshooting](#troubleshooting)

## Sport Rules Framework Overview

The CourtMaster system uses a flexible sport rules framework based on TypeScript interfaces that define the common operations and data structures for all sports. The framework consists of:

- **Base Interface**: `ISportRules` - Defines common operations for all sports
- **Sport-Specific Interfaces**: `IRacquetSportRules`, `ITeamSportRules`, `IIndividualSportRules` - Extend the base interface with sport-specific operations
- **Implementation Classes**: Concrete implementations of these interfaces for each supported sport
- **Factory**: `SportRulesFactory` - Creates and manages sport rule instances

This architecture allows the system to handle different sports with their unique scoring rules, match formats, and gameplay mechanics while maintaining a consistent API for the rest of the application.

## Prerequisites

Before implementing a new sport, ensure you have:

1. **Understanding of the Sport**: Clear knowledge of the sport's rules, scoring system, match format, and any special considerations
2. **TypeScript Knowledge**: Familiarity with TypeScript interfaces, classes, and object-oriented programming
3. **CourtMaster Codebase**: Access to the CourtMaster codebase and development environment
4. **Existing Examples**: Review the implementations of similar sports (e.g., badminton for racquet sports)

## Implementation Steps

### Step 1: Determine the Sport Type

First, identify which sport type interface your sport should implement:

- **IRacquetSportRules**: For sports like tennis, badminton, table tennis, or pickleball
- **ITeamSportRules**: For sports like volleyball, basketball, or soccer
- **IIndividualSportRules**: For sports like swimming, track and field, or gymnastics

### Step 2: Create the Sport Rules Class

Create a new TypeScript file in `src/domain/rules/` named after your sport (e.g., `TableTennisRules.ts`).

```typescript
/**
 * [Sport Name] Rules Implementation for CourtMaster Tournament Management System
 */

import { ISportRules, IRacquetSportRules /* or appropriate interface */ } from './ISportRules';

export class [SportName]Rules implements [AppropriateSportInterface] {
  // Implementation details go here
}

// Export a singleton instance
export default new [SportName]Rules();
```

### Step 3: Implement Required Properties

Each sport rules class must implement certain required properties:

```typescript
// Sport identification
readonly sportId: string = 'your-sport-id'; // Lowercase, no spaces
readonly sportName: string = 'Your Sport Name';
readonly sportDescription: string = 'Brief description of the sport';

// Sport characteristics
readonly isTeamSport: boolean = false; // true for team sports
readonly teamSize: number = 1; // Number of players per team
// Other sport-specific properties
```

### Step 4: Define Sport Formats

Define the supported formats for your sport:

```typescript
// Format definitions
readonly formats: SportFormat[] = [
  {
    id: 'standard',
    name: 'Standard Format',
    description: 'Description of standard format',
    setCount: 3, // Number of sets/periods
    pointsToWinSet: 21, // Points needed to win a set
    minimumPointDifferential: 2, // Point difference required to win
    // Other format-specific properties
  },
  // Add more formats as needed
];

// Default format
readonly defaultFormatId: string = 'standard';
```

### Step 5: Implement Core Scoring Logic

Implement the required scoring methods:

```typescript
/**
 * Initialize a new empty score for a match
 */
createEmptyScore(formatId?: string): MatchScore {
  // Implementation details
}

/**
 * Add points to the current score
 */
addPoints(currentScore: MatchScore, input: PointInput, formatId?: string): MatchScore {
  // Implementation details
}

/**
 * Remove the last point from the current score
 */
removePoint(currentScore: MatchScore, formatId?: string): MatchScore {
  // Implementation details
}

/**
 * Validate a score according to the rules
 */
validateScore(score: MatchScore, formatId?: string): ScoreValidationResult {
  // Implementation details
}
```

### Step 6: Implement Format and Display Methods

Implement methods for score formatting and display:

```typescript
/**
 * Format a score for display
 */
formatScoreForDisplay(score: MatchScore, formatId?: string): string {
  // Implementation details
}

/**
 * Format a set score for display
 */
formatSetScoreForDisplay(setScore: SetScore, formatId?: string): string {
  // Implementation details
}

/**
 * Parse a score from a string representation
 */
parseScoreFromString(scoreStr: string, formatId?: string): MatchScore | null {
  // Implementation details
}
```

### Step 7: Implement Sport-Specific Logic

Depending on which interface you're implementing, you'll need to add sport-specific methods. For example, for racquet sports:

```typescript
/**
 * Calculate the serving side based on the current score
 */
getServingSide(score: MatchScore, currentSet: number): number {
  // Implementation details
}

/**
 * Get serving position (for doubles)
 */
getServingPosition(score: MatchScore, currentSet: number): 'left' | 'right' {
  // Implementation details
}
```

Or for team sports:

```typescript
/**
 * Track a substitution in the match
 */
trackSubstitution(matchData: Record<string, any>, playerIn: string, playerOut: string): Record<string, any> {
  // Implementation details
}

/**
 * Initialize player positions for the start of a set/period
 */
initializePositions(players: string[]): Record<string, any> {
  // Implementation details
}
```

### Step 8: Implement Division Types

Define common division types for your sport:

```typescript
/**
 * Get common division types for this sport
 */
getCommonDivisionTypes(): { id: string; name: string; description: string }[] {
  return [
    {
      id: 'division_id',
      name: "Division Name",
      description: "Division description"
    },
    // Additional divisions
  ];
}
```

## Testing and Validation

After implementing your sport rules, you should thoroughly test them:

1. **Unit Tests**: Create unit tests that verify the scoring logic, validation rules, and other functionality
2. **Integration Tests**: Test the sport rules with the `useScoringLogic` hook
3. **Manual Testing**: Create test tournaments with your sport and verify the scoring works correctly

Example unit test structure:

```typescript
describe('[SportName]Rules', () => {
  const rules = new [SportName]Rules();

  describe('scoring logic', () => {
    test('should initialize an empty score correctly', () => {
      const score = rules.createEmptyScore();
      expect(score.sets.length).toBe(3); // Or whatever is appropriate
      expect(score.isComplete).toBe(false);
    });

    test('should add points correctly', () => {
      let score = rules.createEmptyScore();
      score = rules.addPoints(score, { team: 1, points: 1 });
      expect(score.sets[0].team1Score).toBe(1);
      expect(score.sets[0].team2Score).toBe(0);
    });

    // Additional tests for scoring rules
  });

  // Additional test groups for other functionality
});
```

## Registration and Integration

### Step 1: Register with SportRulesFactory

Once your sport rules class is implemented and tested, register it with the `SportRulesFactory`:

1. Open `src/services/rules/SportRulesFactory.ts`
2. Import your sport rules class:

```typescript
import YourSportRules from '../../domain/rules/YourSportRules';
```

3. Register it in the constructor:

```typescript
constructor() {
  // Register existing sport implementations
  this.registerSport(BadmintonRules);
  this.registerSport(TennisRules);
  this.registerSport(VolleyballRules);
  // Register your new sport
  this.registerSport(YourSportRules);
}
```

### Step 2: Update UI Components (if needed)

If your sport requires special UI components for scoring or match management:

1. Create sport-specific components in an appropriate directory
2. Extend existing components to handle your sport's special cases
3. Modify any UI selectors to include your sport as an option

### Step 3: Update Templates (if needed)

If your sport should have default templates:

1. Create default templates for your sport
2. Add them to the template service initialization (if applicable)

## Advanced Topics

### Sport-Specific Data

If your sport requires additional data beyond the standard match data:

1. Define interfaces for your sport-specific data in an appropriate location
2. Use the `sport_specific_data` field in the `Match` object to store this data
3. Cast the data to your interface when using it in your sport rules

### Custom Scoring Components

If your sport requires a custom scoring UI:

1. Create a component in `src/components/scoring/` named after your sport
2. Implement the custom UI and logic
3. Update the scoring component factory to use your component for your sport

### Tournament Formats

If your sport requires special tournament formats beyond the standard ones:

1. Define the format in your sport rules class
2. Implement any special logic required for the format
3. Update the tournament service to handle the special format (if needed)

## Examples

### Example 1: Tennis Rules (Racquet Sport)

```typescript
// See src/domain/rules/TennisRules.ts for a complete example
```

### Example 2: Volleyball Rules (Team Sport)

```typescript
// See src/domain/rules/VolleyballRules.ts for a complete example
```

## Troubleshooting

### Common Issues and Solutions

1. **Score not updating correctly**
   - Check your `addPoints` and `removePoint` implementations
   - Verify you're properly handling set completion

2. **Set completion logic not working**
   - Review your `isSetComplete` method for edge cases
   - Ensure you're handling minimum point differentials correctly

3. **Match completion not detected**
   - Check your `isMatchComplete` method
   - Verify you're counting completed sets correctly

4. **Format-specific issues**
   - Ensure you're using the provided `formatId` parameter in your methods
   - Verify your formats are defined correctly

### Getting Help

If you encounter issues implementing your sport rules:

1. Review the existing implementations for similar sports
2. Check the CourtMaster documentation
3. Contact the CourtMaster development team for assistance

## Conclusion

By following this guide, you should be able to successfully implement support for a new sport in the CourtMaster system. The modular architecture allows for easy addition of new sports while maintaining consistency across the application.

Remember to thoroughly test your implementation before deploying it to production, and consider creating documentation for tournament organizers on how to use your sport's specific features.

Happy coding!
