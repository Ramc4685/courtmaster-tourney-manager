import { vi, describe, it, expect, beforeEach } from 'vitest';

// Focused conflict resolution strategies
class ConflictResolver {
  resolveConflict(localData: any, remoteData: any, strategy: string) {
    switch (strategy) {
      case 'last_write_wins':
        return localData.lastModified > remoteData.lastModified ? localData : remoteData;
      
      case 'merge':
        return { ...remoteData, ...localData };
      
      case 'client_wins':
        return localData;
      
      case 'server_wins':
        return remoteData;
      
      case 'deep_merge':
        return this.deepMerge(remoteData, localData);
      
      default:
        throw new Error(`Unknown strategy: ${strategy}`);
    }
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  mergeArrays(localArray: any[], remoteArray: any[]): any[] {
    const merged = [...remoteArray];
    localArray.forEach(item => {
      if (!merged.find(m => m.id === item.id)) {
        merged.push(item);
      }
    });
    return merged;
  }
}

describe('Conflict Resolution Strategies Tests', () => {
  let resolver: ConflictResolver;

  beforeEach(() => {
    resolver = new ConflictResolver();
  });

  describe('Last Write Wins Strategy', () => {
    it('should resolve using last_write_wins strategy', () => {
      const localData = {
        id: 'match-1',
        score: { team1: 10, team2: 8 },
        lastModified: new Date('2024-01-01T10:00:00Z').getTime()
      };

      const remoteData = {
        id: 'match-1',
        score: { team1: 12, team2: 10 },
        lastModified: new Date('2024-01-01T10:05:00Z').getTime() // Later
      };

      const resolved = resolver.resolveConflict(localData, remoteData, 'last_write_wins');
      expect(resolved).toEqual(remoteData); // Remote wins (later timestamp)
    });

    it('should handle equal timestamps', () => {
      const timestamp = new Date('2024-01-01T10:00:00Z').getTime();
      
      const localData = {
        id: 'match-1',
        score: { team1: 10, team2: 8 },
        lastModified: timestamp
      };

      const remoteData = {
        id: 'match-1',
        score: { team1: 12, team2: 10 },
        lastModified: timestamp
      };

      const resolved = resolver.resolveConflict(localData, remoteData, 'last_write_wins');
      expect(resolved).toEqual(remoteData); // Remote wins on tie
    });
  });

  describe('Merge Strategy', () => {
    it('should resolve using merge strategy', () => {
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

      const resolved = resolver.resolveConflict(localData, remoteData, 'merge');
      
      // Local overwrites remote for same keys
      expect(resolved).toEqual({
        id: 'match-1',
        score: { team1: 10, team2: 8 }, // Local wins
        status: 'IN_PROGRESS', // Local wins
        courtId: 'court-2', // Remote only
        notes: 'Local notes' // Local only
      });
    });

    it('should handle deep merge strategy', () => {
      const localData = {
        id: 'tournament-1',
        settings: {
          scoring: { pointsToWin: 21, mustWinByTwo: true },
          timing: { matchDuration: 30 }
        },
        participants: ['team1', 'team2']
      };

      const remoteData = {
        id: 'tournament-1',
        settings: {
          scoring: { pointsToWin: 25, mustWinByTwo: false },
          format: 'SINGLE_ELIMINATION'
        },
        participants: ['team1', 'team2', 'team3']
      };

      const resolved = resolver.resolveConflict(localData, remoteData, 'deep_merge');

      // Should perform deep merge of nested objects
      expect(resolved.settings.scoring).toEqual({ pointsToWin: 21, mustWinByTwo: true }); // Local wins
      expect(resolved.settings.timing).toEqual({ matchDuration: 30 }); // Local only
      expect(resolved.settings.format).toBe('SINGLE_ELIMINATION'); // Remote only
      expect(resolved.participants).toEqual(['team1', 'team2']); // Local wins
    });
  });

  describe('Client/Server Wins Strategies', () => {
    it('should resolve using client_wins strategy', () => {
      const localData = { id: 'match-1', score: { team1: 10, team2: 8 } };
      const remoteData = { id: 'match-1', score: { team1: 12, team2: 10 } };

      const resolved = resolver.resolveConflict(localData, remoteData, 'client_wins');
      expect(resolved).toEqual(localData);
    });

    it('should resolve using server_wins strategy', () => {
      const localData = { id: 'match-1', score: { team1: 10, team2: 8 } };
      const remoteData = { id: 'match-1', score: { team1: 12, team2: 10 } };

      const resolved = resolver.resolveConflict(localData, remoteData, 'server_wins');
      expect(resolved).toEqual(remoteData);
    });
  });

  describe('Array Merging', () => {
    it('should handle array merging', () => {
      const localArray = [
        { id: 'team1', name: 'Team One' },
        { id: 'team2', name: 'Team Two' }
      ];

      const remoteArray = [
        { id: 'team1', name: 'Team One Updated' },
        { id: 'team3', name: 'Team Three' }
      ];

      const merged = resolver.mergeArrays(localArray, remoteArray);

      expect(merged).toHaveLength(3);
      expect(merged.find(t => t.id === 'team1')?.name).toBe('Team One Updated'); // Remote wins
      expect(merged.find(t => t.id === 'team2')?.name).toBe('Team Two'); // Local added
      expect(merged.find(t => t.id === 'team3')?.name).toBe('Team Three'); // Remote only
    });

    it('should handle empty arrays', () => {
      const localArray: any[] = [];
      const remoteArray = [{ id: 'team1', name: 'Team One' }];

      const merged = resolver.mergeArrays(localArray, remoteArray);
      expect(merged).toEqual(remoteArray);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unknown strategy', () => {
      const localData = { id: 'match-1' };
      const remoteData = { id: 'match-1' };

      expect(() => {
        resolver.resolveConflict(localData, remoteData, 'unknown_strategy');
      }).toThrow('Unknown strategy: unknown_strategy');
    });

    it('should handle null data gracefully', () => {
      const localData = { id: 'match-1', score: { team1: 10, team2: 8 } };
      const remoteData = null;

      const resolved = resolver.resolveConflict(localData, remoteData, 'server_wins');
      expect(resolved).toBeNull();
    });
  });
});
