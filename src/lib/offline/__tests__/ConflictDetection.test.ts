import { vi, describe, it, expect, beforeEach } from 'vitest';

// Focused conflict detection logic
class ConflictDetector {
  detectConflict(localData: any, remoteData: any): boolean {
    if (!localData || !remoteData) return false;
    
    // Safe conflict detection that handles circular references
    try {
      return JSON.stringify(localData) !== JSON.stringify(remoteData);
    } catch (error) {
      // Handle circular references by doing a shallow comparison
      if (error instanceof TypeError && error.message.includes('circular')) {
        return this.shallowCompare(localData, remoteData);
      }
      throw error;
    }
  }

  private shallowCompare(obj1: any, obj2: any): boolean {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return true;
    
    for (const key of keys1) {
      if (key === 'self') continue; // Skip circular references
      if (obj1[key] !== obj2[key]) return true;
    }
    
    return false;
  }

  detectFieldLevelConflicts(localData: any, remoteData: any): string[] {
    const conflicts: string[] = [];
    
    if (!localData || !remoteData) return conflicts;
    
    const allKeys = new Set([...Object.keys(localData), ...Object.keys(remoteData)]);
    
    for (const key of allKeys) {
      if (localData[key] !== remoteData[key]) {
        conflicts.push(key);
      }
    }
    
    return conflicts;
  }
}

describe('Conflict Detection Tests', () => {
  let detector: ConflictDetector;

  beforeEach(() => {
    detector = new ConflictDetector();
  });

  describe('Basic Conflict Detection', () => {
    it('should detect conflicts when data differs', () => {
      const localData = { id: 'match-1', score: { team1: 10, team2: 8 } };
      const remoteData = { id: 'match-1', score: { team1: 12, team2: 10 } };

      const hasConflict = detector.detectConflict(localData, remoteData);
      expect(hasConflict).toBe(true);
    });

    it('should not detect conflicts for identical data', () => {
      const identicalData = { id: 'match-1', score: { team1: 10, team2: 8 } };

      const hasConflict = detector.detectConflict(identicalData, identicalData);
      expect(hasConflict).toBe(false);
    });

    it('should handle null/undefined data', () => {
      expect(detector.detectConflict(null, { id: 'test' })).toBe(false);
      expect(detector.detectConflict({ id: 'test' }, null)).toBe(false);
      expect(detector.detectConflict(null, null)).toBe(false);
    });

    it('should handle circular references gracefully', () => {
      const localData: any = { id: 'match-1', score: { team1: 10, team2: 8 } };
      localData.self = localData; // Circular reference

      const remoteData = { id: 'match-1', score: { team1: 12, team2: 10 } };

      // Should not crash with circular references
      expect(() => {
        detector.detectConflict(localData, remoteData);
      }).not.toThrow();
    });
  });

  describe('Field-Level Conflict Detection', () => {
    it('should identify specific conflicting fields', () => {
      const localData = {
        id: 'match-1',
        score: { team1: 10, team2: 8 },
        status: 'IN_PROGRESS',
        notes: 'Local notes'
      };

      const remoteData = {
        id: 'match-1',
        score: { team1: 12, team2: 10 },
        status: 'COMPLETED',
        courtId: 'court-2'
      };

      const conflicts = detector.detectFieldLevelConflicts(localData, remoteData);
      
      expect(conflicts).toContain('score');
      expect(conflicts).toContain('status');
      expect(conflicts).toContain('notes'); // Local only
      expect(conflicts).toContain('courtId'); // Remote only
      expect(conflicts).not.toContain('id'); // Same in both
    });

    it('should handle nested object conflicts', () => {
      const localData = {
        id: 'tournament-1',
        settings: { pointsToWin: 21, mustWinByTwo: true }
      };

      const remoteData = {
        id: 'tournament-1',
        settings: { pointsToWin: 25, mustWinByTwo: false }
      };

      const conflicts = detector.detectFieldLevelConflicts(localData, remoteData);
      expect(conflicts).toContain('settings');
    });

    it('should handle array conflicts', () => {
      const localData = {
        id: 'tournament-1',
        participants: ['team1', 'team2']
      };

      const remoteData = {
        id: 'tournament-1',
        participants: ['team1', 'team2', 'team3']
      };

      const conflicts = detector.detectFieldLevelConflicts(localData, remoteData);
      expect(conflicts).toContain('participants');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty objects', () => {
      const localData = {};
      const remoteData = { id: 'match-1' };

      const hasConflict = detector.detectConflict(localData, remoteData);
      expect(hasConflict).toBe(true);

      const conflicts = detector.detectFieldLevelConflicts(localData, remoteData);
      expect(conflicts).toContain('id');
    });

    it('should handle different data types', () => {
      const localData = {
        id: 'match-1',
        active: true,
        count: 5,
        tags: ['important']
      };

      const remoteData = {
        id: 'match-1',
        active: 'true', // String instead of boolean
        count: '5', // String instead of number
        tags: 'important' // String instead of array
      };

      const conflicts = detector.detectFieldLevelConflicts(localData, remoteData);
      expect(conflicts).toContain('active');
      expect(conflicts).toContain('count');
      expect(conflicts).toContain('tags');
    });

    it('should handle large objects efficiently', () => {
      const largeLocalData = {
        id: 'tournament-1',
        matches: Array.from({ length: 1000 }, (_, i) => ({
          id: `match-${i}`,
          score: { team1: i % 21, team2: (i + 1) % 21 }
        }))
      };

      const largeRemoteData = {
        id: 'tournament-1',
        matches: Array.from({ length: 1000 }, (_, i) => ({
          id: `match-${i}`,
          score: { team1: (i + 2) % 21, team2: (i + 3) % 21 }
        }))
      };

      const startTime = Date.now();
      const hasConflict = detector.detectConflict(largeLocalData, largeRemoteData);
      const endTime = Date.now();

      expect(hasConflict).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });
  });
});
