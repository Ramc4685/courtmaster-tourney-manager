# Scheduling System Developer Guide

## Overview

This guide covers the tournament scheduling system, including auto-scheduling algorithms, performance optimizations, and implementation patterns for efficient court and match management.

## Architecture

### Scheduling Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Schedule        │    │ Algorithm       │    │ Constraint      │
│ Manager         │────│ Engine          │────│ Solver          │
│                 │    │                 │    │                 │
│ - Coordination  │    │ - Optimization  │    │ - Validation    │
│ - Validation    │    │ - Algorithms    │    │ - Conflict      │
│ - Persistence   │    │ - Performance   │    │ - Resolution    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Core Scheduling Interfaces

### Schedule Data Structures

```ts
interface ScheduleRequest {
  tournamentId: string;
  preferences: SchedulingPreferences;
  constraints: SchedulingConstraints;
  timeWindow: TimeWindow;
}

interface SchedulingPreferences {
  algorithm: 'greedy' | 'interval_tree' | 'genetic' | 'constraint_satisfaction';
  optimizeFor: 'time' | 'court_utilization' | 'player_rest' | 'balanced';
  allowOverlap: boolean;
  minimumBreakTime: number; // minutes
  preferredStartTime?: string;
  preferredEndTime?: string;
}

interface SchedulingConstraints {
  courtAvailability: CourtTimeSlot[];
  matchDurations: Map<string, number>; // category -> duration in minutes
  teamConstraints: TeamConstraint[];
  courtConstraints: CourtConstraint[];
  globalConstraints: GlobalConstraint[];
}

interface ScheduleResult {
  success: boolean;
  scheduledMatches: ScheduledMatch[];
  unscheduledMatches: UnscheduledMatch[];
  statistics: SchedulingStatistics;
  warnings: SchedulingWarning[];
  conflicts: SchedulingConflict[];
}
```

## Performance-Optimized Data Structures

### Interval Tree for Efficient Time Slot Queries

```ts
class TimeSlotIntervalTree {
  private root: IntervalNode | null = null;

  // O(log n) insertion
  insert(slot: TimeSlot): void {
    this.root = this.insertNode(this.root, slot);
  }

  // O(log n + k) where k is number of overlapping intervals
  findOverlapping(query: TimeSlot): TimeSlot[] {
    const result: TimeSlot[] = [];
    this.searchOverlapping(this.root, query, result);
    return result;
  }

  // O(log n) search for available slots
  findAvailableSlot(duration: number, after: Date): TimeSlot | null {
    return this.searchAvailable(this.root, duration, after);
  }

  private insertNode(node: IntervalNode | null, slot: TimeSlot): IntervalNode {
    if (!node) {
      return new IntervalNode(slot);
    }

    if (slot.startTime < node.slot.startTime) {
      node.left = this.insertNode(node.left, slot);
    } else {
      node.right = this.insertNode(node.right, slot);
    }

    // Update max endpoint for subtree
    node.maxEnd = Math.max(node.maxEnd, slot.endTime);
    return node;
  }
}
```

### Sorted Timeline for Court Availability

```ts
class CourtAvailabilityTimeline {
  private events: TimelineEvent[] = [];

  constructor(courts: Court[], timeWindow: TimeWindow) {
    this.initializeTimeline(courts, timeWindow);
  }

  // O(log n) to find next available slot
  findNextAvailableSlot(
    startTime: Date,
    duration: number,
    courtRequirements?: CourtRequirement[]
  ): AvailableSlot | null {
    let currentTime = startTime;
    let availableCourts = this.getAvailableCourts(currentTime, courtRequirements);

    while (availableCourts.length > 0 && currentTime < this.timeWindow.endTime) {
      const slot = this.checkSlotAvailability(currentTime, duration, availableCourts);
      if (slot) return slot;

      currentTime = this.getNextEventTime(currentTime);
      availableCourts = this.getAvailableCourts(currentTime, courtRequirements);
    }

    return null;
  }

  // O(log n) to reserve a time slot
  reserveSlot(courtId: string, slot: TimeSlot, matchId: string): void {
    const startEvent: TimelineEvent = {
      time: slot.startTime,
      type: 'court_busy',
      courtId,
      matchId
    };

    const endEvent: TimelineEvent = {
      time: slot.endTime,
      type: 'court_free',
      courtId,
      matchId
    };

    this.insertEvent(startEvent);
    this.insertEvent(endEvent);
  }

  private insertEvent(event: TimelineEvent): void {
    // Binary search insertion to maintain sorted order
    const index = this.binarySearchInsertionPoint(event.time);
    this.events.splice(index, 0, event);
  }
}
```

## Scheduling Algorithms

### Greedy Algorithm (Simple, Fast)

```ts
class GreedySchedulingAlgorithm implements SchedulingAlgorithm {
  // Time Complexity: O(n log n) where n is number of matches
  async schedule(request: ScheduleRequest): Promise<ScheduleResult> {
    const { matches, constraints, preferences } = request;
    const timeline = new CourtAvailabilityTimeline(
      constraints.courtAvailability,
      request.timeWindow
    );

    // Sort matches by priority/preference
    const sortedMatches = this.sortMatchesByPriority(matches, preferences);
    const scheduledMatches: ScheduledMatch[] = [];
    const unscheduledMatches: UnscheduledMatch[] = [];

    for (const match of sortedMatches) {
      const duration = this.getMatchDuration(match, constraints);
      const courtReqs = this.getCourtRequirements(match);

      const availableSlot = timeline.findNextAvailableSlot(
        new Date(request.timeWindow.startTime),
        duration,
        courtReqs
      );

      if (availableSlot) {
        const scheduledMatch: ScheduledMatch = {
          ...match,
          courtId: availableSlot.courtId,
          scheduledTime: availableSlot.startTime,
          estimatedEndTime: availableSlot.endTime
        };

        timeline.reserveSlot(
          availableSlot.courtId,
          availableSlot,
          match.id
        );

        scheduledMatches.push(scheduledMatch);
      } else {
        unscheduledMatches.push({
          match,
          reason: 'no_available_slot',
          suggestions: this.generateSuggestions(match, timeline)
        });
      }
    }

    return {
      success: unscheduledMatches.length === 0,
      scheduledMatches,
      unscheduledMatches,
      statistics: this.calculateStatistics(scheduledMatches),
      warnings: [],
      conflicts: []
    };
  }

  private sortMatchesByPriority(
    matches: Match[],
    preferences: SchedulingPreferences
  ): Match[] {
    return matches.sort((a, b) => {
      // Priority factors: round, category importance, player preferences
      const roundWeight = a.round - b.round; // Earlier rounds first
      const categoryWeight = this.getCategoryPriority(a.categoryId) -
                           this.getCategoryPriority(b.categoryId);

      return roundWeight * 10 + categoryWeight;
    });
  }
}
```

### Interval Tree Algorithm (Optimized for Large Tournaments)

```ts
class IntervalTreeSchedulingAlgorithm implements SchedulingAlgorithm {
  private intervalTree: TimeSlotIntervalTree;
  private courtTrees: Map<string, TimeSlotIntervalTree>;

  // Time Complexity: O(n log n + k log n) where k is number of scheduling attempts
  async schedule(request: ScheduleRequest): Promise<ScheduleResult> {
    this.initializeTrees(request.constraints.courtAvailability);

    const matches = this.sortAndGroupMatches(request.matches);
    const scheduledMatches: ScheduledMatch[] = [];

    // Process matches in parallel where possible
    for (const matchGroup of matches) {
      const groupResults = await this.scheduleMatchGroup(
        matchGroup,
        request.constraints,
        request.preferences
      );

      scheduledMatches.push(...groupResults);
    }

    return this.buildResult(scheduledMatches, request.matches);
  }

  private findOptimalSlot(
    match: Match,
    constraints: SchedulingConstraints,
    preferences: SchedulingPreferences
  ): OptimalSlot | null {
    const duration = this.getMatchDuration(match, constraints);
    const courtRequirements = this.getCourtRequirements(match);

    // Use interval tree for efficient slot finding
    for (const courtId of this.getEligibleCourts(courtRequirements)) {
      const courtTree = this.courtTrees.get(courtId);
      if (!courtTree) continue;

      const availableSlots = courtTree.findAvailableSlots(
        duration,
        preferences.preferredStartTime,
        preferences.preferredEndTime
      );

      if (availableSlots.length > 0) {
        return this.selectBestSlot(availableSlots, preferences);
      }
    }

    return null;
  }
}
```

## Testing Scheduling Logic

### Unit Tests for Algorithms

```ts
describe('GreedySchedulingAlgorithm', () => {
  let algorithm: GreedySchedulingAlgorithm;
  let mockConstraints: SchedulingConstraints;

  beforeEach(() => {
    algorithm = new GreedySchedulingAlgorithm();
    mockConstraints = createMockConstraints();
  });

  test('should schedule all matches when resources are sufficient', async () => {
    const matches = createTestMatches(10);
    const request: ScheduleRequest = {
      tournamentId: 'test-tournament',
      matches,
      constraints: mockConstraints,
      preferences: { algorithm: 'greedy', optimizeFor: 'time' },
      timeWindow: createTimeWindow('09:00', '18:00')
    };

    const result = await algorithm.schedule(request);

    expect(result.success).toBe(true);
    expect(result.scheduledMatches).toHaveLength(10);
    expect(result.unscheduledMatches).toHaveLength(0);
  });

  test('should detect and report conflicts', async () => {
    const matches = createConflictingMatches();
    const limitedConstraints = createLimitedConstraints();

    const request: ScheduleRequest = {
      tournamentId: 'test-tournament',
      matches,
      constraints: limitedConstraints,
      preferences: { algorithm: 'greedy', optimizeFor: 'time' },
      timeWindow: createTimeWindow('09:00', '10:00') // Very limited time
    };

    const result = await algorithm.schedule(request);

    expect(result.success).toBe(false);
    expect(result.unscheduledMatches.length).toBeGreaterThan(0);
    expect(result.conflicts.length).toBeGreaterThan(0);
  });
});
```

### Performance Benchmarks

```ts
describe('Scheduling Performance', () => {
  const testSizes = [10, 50, 100, 500, 1000];

  testSizes.forEach(size => {
    test(`should schedule ${size} matches within performance limits`, async () => {
      const matches = createTestMatches(size);
      const constraints = createScalableConstraints(size);
      const algorithm = new IntervalTreeSchedulingAlgorithm();

      const startTime = performance.now();

      const result = await algorithm.schedule({
        tournamentId: `perf-test-${size}`,
        matches,
        constraints,
        preferences: { algorithm: 'interval_tree', optimizeFor: 'time' },
        timeWindow: createTimeWindow('08:00', '20:00')
      });

      const duration = performance.now() - startTime;

      // Performance expectations (adjust based on requirements)
      const expectedMaxDuration = size < 100 ? 100 : size * 2; // ms
      expect(duration).toBeLessThan(expectedMaxDuration);

      // Verify solution quality
      expect(result.scheduledMatches.length / matches.length).toBeGreaterThan(0.9);
    });
  });
});
```

This scheduling developer guide provides comprehensive information for implementing and optimizing tournament scheduling algorithms in the CourtMaster system.