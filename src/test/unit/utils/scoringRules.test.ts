import { describe, it, expect, beforeEach } from 'vitest';
import {
  isSetComplete,
  calculateSetWinner,
  isMatchComplete,
  calculateMatchWinner
} from '../../../utils/scoringRules';
import { ScoringRules } from '@/components/admin/tournament/types';
import { ScoreSet } from '@/types/entities';

describe('scoringRules', () => {
  const badmintonRules: ScoringRules = {
    pointsToWinSet: 21,
    setsToWinMatch: 2,
    maxSets: 3,
    mustWinByTwo: true,
    maxPointsPerSet: 30
  };

  const tennisRules: ScoringRules = {
    pointsToWinSet: 6,
    setsToWinMatch: 2,
    maxSets: 3,
    mustWinByTwo: true,
    maxPointsPerSet: 7,
    tiebreakerFormat: 'standard_tiebreak_7'
  };

  const volleyballRules: ScoringRules = {
    pointsToWinSet: 25,
    setsToWinMatch: 3,
    maxSets: 5,
    mustWinByTwo: true,
    maxPointsPerSet: 30
  };

  describe('isSetComplete', () => {
    describe('Badminton scoring', () => {
      it('should return true for standard wins (21-15, 21-19)', () => {
        expect(isSetComplete({ team1: 21, team2: 15, completed: true, winner: 1 }, badmintonRules)).toBe(true);
        expect(isSetComplete({ team1: 21, team2: 19, completed: true, winner: 1 }, badmintonRules)).toBe(true);
        expect(isSetComplete({ team1: 15, team2: 21, completed: true, winner: 2 }, badmintonRules)).toBe(true);
        expect(isSetComplete({ team1: 19, team2: 21, completed: true, winner: 2 }, badmintonRules)).toBe(true);
      });

      it('should return false for deuce scenarios (20-20, 21-21)', () => {
        expect(isSetComplete({ team1: 20, team2: 20, completed: false }, badmintonRules)).toBe(false);
        expect(isSetComplete({ team1: 21, team2: 21, completed: false }, badmintonRules)).toBe(false);
        expect(isSetComplete({ team1: 22, team2: 21, completed: false }, badmintonRules)).toBe(false);
        expect(isSetComplete({ team1: 21, team2: 22, completed: false }, badmintonRules)).toBe(false);
      });

      it('should return true when must win by two is satisfied', () => {
        expect(isSetComplete({ team1: 22, team2: 20, completed: true, winner: 1 }, badmintonRules)).toBe(true);
        expect(isSetComplete({ team1: 23, team2: 21, completed: true, winner: 1 }, badmintonRules)).toBe(true);
        expect(isSetComplete({ team1: 20, team2: 22, completed: true, winner: 2 }, badmintonRules)).toBe(true);
        expect(isSetComplete({ team1: 21, team2: 23, completed: true, winner: 2 }, badmintonRules)).toBe(true);
      });

      it('should return true when maximum points reached (30-29, 30-28)', () => {
        expect(isSetComplete({ team1: 30, team2: 29, completed: true, winner: 1 }, badmintonRules)).toBe(true);
        expect(isSetComplete({ team1: 30, team2: 28, completed: true, winner: 1 }, badmintonRules)).toBe(true);
        expect(isSetComplete({ team1: 29, team2: 30, completed: true, winner: 2 }, badmintonRules)).toBe(true);
        expect(isSetComplete({ team1: 28, team2: 30, completed: true, winner: 2 }, badmintonRules)).toBe(true);
      });

      it('should return false for incomplete sets', () => {
        expect(isSetComplete({ team1: 20, team2: 15, completed: false }, badmintonRules)).toBe(false);
        expect(isSetComplete({ team1: 15, team2: 20, completed: false }, badmintonRules)).toBe(false);
        expect(isSetComplete({ team1: 10, team2: 10, completed: false }, badmintonRules)).toBe(false);
        expect(isSetComplete({ team1: 0, team2: 0, completed: false }, badmintonRules)).toBe(false);
      });
    });

    describe('Tennis scoring', () => {
      it('should return true for standard wins (6-4, 6-3)', () => {
        expect(isSetComplete({ team1: 6, team2: 4, completed: true, winner: 1 }, tennisRules)).toBe(true);
        expect(isSetComplete({ team1: 6, team2: 3, completed: true, winner: 1 }, tennisRules)).toBe(true);
        expect(isSetComplete({ team1: 4, team2: 6, completed: true, winner: 2 }, tennisRules)).toBe(true);
        expect(isSetComplete({ team1: 3, team2: 6, completed: true, winner: 2 }, tennisRules)).toBe(true);
      });

      it('should return false for deuce scenarios (6-6)', () => {
        expect(isSetComplete({ team1: 6, team2: 6, completed: false }, tennisRules)).toBe(false);
        expect(isSetComplete({ team1: 5, team2: 5, completed: false }, tennisRules)).toBe(false);
      });

      it('should return true for tiebreak wins (7-6)', () => {
        expect(isSetComplete({ team1: 7, team2: 6, completed: true, winner: 1 }, tennisRules)).toBe(true);
        expect(isSetComplete({ team1: 6, team2: 7, completed: true, winner: 2 }, tennisRules)).toBe(true);
      });

      it('should return true when must win by two is satisfied', () => {
        expect(isSetComplete({ team1: 7, team2: 5, completed: true, winner: 1 }, tennisRules)).toBe(true);
        expect(isSetComplete({ team1: 5, team2: 7, completed: true, winner: 2 }, tennisRules)).toBe(true);
      });
    });

    describe('Volleyball scoring', () => {
      it('should return true for standard wins (25-20, 25-15)', () => {
        expect(isSetComplete({ team1: 25, team2: 20, completed: true, winner: 1 }, volleyballRules)).toBe(true);
        expect(isSetComplete({ team1: 25, team2: 15, completed: true, winner: 1 }, volleyballRules)).toBe(true);
        expect(isSetComplete({ team1: 20, team2: 25, completed: true, winner: 2 }, volleyballRules)).toBe(true);
        expect(isSetComplete({ team1: 15, team2: 25, completed: true, winner: 2 }, volleyballRules)).toBe(true);
      });

      it('should return false for deuce scenarios (24-24, 25-25)', () => {
        expect(isSetComplete({ team1: 24, team2: 24, completed: false }, volleyballRules)).toBe(false);
        expect(isSetComplete({ team1: 25, team2: 25, completed: false }, volleyballRules)).toBe(false);
        expect(isSetComplete({ team1: 26, team2: 25, completed: false }, volleyballRules)).toBe(false);
        expect(isSetComplete({ team1: 25, team2: 26, completed: false }, volleyballRules)).toBe(false);
      });

      it('should return true when must win by two is satisfied', () => {
        expect(isSetComplete({ team1: 26, team2: 24, completed: true, winner: 1 }, volleyballRules)).toBe(true);
        expect(isSetComplete({ team1: 27, team2: 25, completed: true, winner: 1 }, volleyballRules)).toBe(true);
        expect(isSetComplete({ team1: 24, team2: 26, completed: true, winner: 2 }, volleyballRules)).toBe(true);
        expect(isSetComplete({ team1: 25, team2: 27, completed: true, winner: 2 }, volleyballRules)).toBe(true);
      });

      it('should return true when maximum points reached', () => {
        expect(isSetComplete({ team1: 30, team2: 29, completed: true, winner: 1 }, volleyballRules)).toBe(true);
        expect(isSetComplete({ team1: 29, team2: 30, completed: true, winner: 2 }, volleyballRules)).toBe(true);
      });
    });

    describe('Edge cases', () => {
      it('should handle invalid scores gracefully', () => {
        expect(isSetComplete({ team1: -1, team2: 21, completed: false }, badmintonRules)).toBe(false);
        expect(isSetComplete({ team1: 21, team2: -1, completed: false }, badmintonRules)).toBe(false);
        expect(isSetComplete({ team1: NaN, team2: 21, completed: false }, badmintonRules)).toBe(false);
        expect(isSetComplete({ team1: 21, team2: NaN, completed: false }, badmintonRules)).toBe(false);
      });

      it('should handle rules without mustWinByTwo', () => {
        const simpleRules: ScoringRules = {
          pointsToWinSet: 21,
          setsToWinMatch: 2,
          maxSets: 3,
          mustWinByTwo: false,
          maxPointsPerSet: 30
        };

        expect(isSetComplete({ team1: 21, team2: 20, completed: true, winner: 1 }, simpleRules)).toBe(true);
        expect(isSetComplete({ team1: 21, team2: 21, completed: false }, simpleRules)).toBe(false);
      });
    });
  });

  describe('calculateSetWinner', () => {
    it('should return correct winner for completed sets', () => {
      expect(calculateSetWinner({ team1: 21, team2: 15, completed: true, winner: 1 }, badmintonRules)).toBe(1);
      expect(calculateSetWinner({ team1: 15, team2: 21, completed: true, winner: 2 }, badmintonRules)).toBe(2);
      expect(calculateSetWinner({ team1: 22, team2: 20, completed: true, winner: 1 }, badmintonRules)).toBe(1);
      expect(calculateSetWinner({ team1: 20, team2: 22, completed: true, winner: 2 }, badmintonRules)).toBe(2);
    });

    it('should return null for incomplete sets', () => {
      expect(calculateSetWinner({ team1: 20, team2: 20, completed: false }, badmintonRules)).toBeNull();
      expect(calculateSetWinner({ team1: 21, team2: 21, completed: false }, badmintonRules)).toBeNull();
      expect(calculateSetWinner({ team1: 15, team2: 10, completed: false }, badmintonRules)).toBeNull();
    });

    it('should handle maximum points scenarios', () => {
      expect(calculateSetWinner({ team1: 30, team2: 29, completed: true, winner: 1 }, badmintonRules)).toBe(1);
      expect(calculateSetWinner({ team1: 29, team2: 30, completed: true, winner: 2 }, badmintonRules)).toBe(2);
      expect(calculateSetWinner({ team1: 30, team2: 28, completed: true, winner: 1 }, badmintonRules)).toBe(1);
    });

    it('should work with different sports', () => {
      expect(calculateSetWinner({ team1: 6, team2: 4, completed: true, winner: 1 }, tennisRules)).toBe(1);
      expect(calculateSetWinner({ team1: 7, team2: 6, completed: true, winner: 1 }, tennisRules)).toBe(1);
      expect(calculateSetWinner({ team1: 25, team2: 20, completed: true, winner: 1 }, volleyballRules)).toBe(1);
      expect(calculateSetWinner({ team1: 26, team2: 24, completed: true, winner: 1 }, volleyballRules)).toBe(1);
    });
  });

  describe('isMatchComplete', () => {
    it('should return true when team1 wins required sets (best-of-3)', () => {
      const sets: ScoreSet[] = [
        { team1: 21, team2: 15, completed: true, winner: 1 },
        { team1: 21, team2: 18, completed: true, winner: 1 }
      ];

      expect(isMatchComplete(sets, badmintonRules)).toBe(true);
    });

    it('should return true when team2 wins required sets (best-of-3)', () => {
      const sets: ScoreSet[] = [
        { team1: 15, team2: 21, completed: true, winner: 2 },
        { team1: 18, team2: 21, completed: true, winner: 2 }
      ];

      expect(isMatchComplete(sets, badmintonRules)).toBe(true);
    });

    it('should return false when match is still in progress', () => {
      const sets: ScoreSet[] = [
        { team1: 21, team2: 15, completed: true, winner: 1 },
        { team1: 15, team2: 21, completed: true, winner: 2 }
      ];

      expect(isMatchComplete(sets, badmintonRules)).toBe(false);
    });

    it('should return false for incomplete current set', () => {
      const sets: ScoreSet[] = [
        { team1: 21, team2: 15, completed: true, winner: 1 },
        { team1: 15, team2: 21, completed: true, winner: 2 },
        { team1: 10, team2: 8, completed: false }
      ];

      expect(isMatchComplete(sets, badmintonRules)).toBe(false);
    });

    it('should work with best-of-5 matches', () => {
      const bestOf5Rules: ScoringRules = {
        ...badmintonRules,
        setsToWinMatch: 3
      };

      const sets: ScoreSet[] = [
        { team1: 21, team2: 15, completed: true, winner: 1 },
        { team1: 21, team2: 18, completed: true, winner: 1 },
        { team1: 21, team2: 19, completed: true, winner: 1 }
      ];

      expect(isMatchComplete(sets, bestOf5Rules)).toBe(true);
    });

    it('should handle empty sets array', () => {
      expect(isMatchComplete([], badmintonRules)).toBe(false);
    });
  });

  describe('calculateMatchWinner', () => {
    it('should return correct winner for completed matches', () => {
      const sets: ScoreSet[] = [
        { team1: 21, team2: 15, completed: true, winner: 1 },
        { team1: 21, team2: 18, completed: true, winner: 1 }
      ];

      expect(calculateMatchWinner(sets, badmintonRules)).toBe(1);
    });

    it('should return team2 as winner', () => {
      const sets: ScoreSet[] = [
        { team1: 15, team2: 21, completed: true, winner: 2 },
        { team1: 18, team2: 21, completed: true, winner: 2 }
      ];

      expect(calculateMatchWinner(sets, badmintonRules)).toBe(2);
    });

    it('should return null for incomplete matches', () => {
      const sets: ScoreSet[] = [
        { team1: 21, team2: 15, completed: true, winner: 1 },
        { team1: 15, team2: 21, completed: true, winner: 2 }
      ];

      expect(calculateMatchWinner(sets, badmintonRules)).toBeNull();
    });

    it('should handle best-of-5 matches correctly', () => {
      const bestOf5Rules: ScoringRules = {
        ...badmintonRules,
        setsToWinMatch: 3
      };

      const sets: ScoreSet[] = [
        { team1: 21, team2: 15, completed: true, winner: 1 },
        { team1: 15, team2: 21, completed: true, winner: 2 },
        { team1: 21, team2: 18, completed: true, winner: 1 },
        { team1: 15, team2: 21, completed: true, winner: 2 },
        { team1: 21, team2: 19, completed: true, winner: 1 }
      ];

      expect(calculateMatchWinner(sets, bestOf5Rules)).toBe(1);
    });

    it('should count sets won correctly', () => {
      const sets: ScoreSet[] = [
        { team1: 21, team2: 15, completed: true, winner: 1 }, // team1 wins
        { team1: 15, team2: 21, completed: true, winner: 2 }, // team2 wins
        { team1: 21, team2: 18, completed: true, winner: 1 }  // team1 wins (2-1, team1 wins match)
      ];

      expect(calculateMatchWinner(sets, badmintonRules)).toBe(1);
    });

    it('should handle edge case with incomplete final set', () => {
      const sets: ScoreSet[] = [
        { team1: 21, team2: 15, completed: true, winner: 1 },
        { team1: 15, team2: 21, completed: true, winner: 2 },
        { team1: 10, team2: 8, completed: false } // Incomplete set
      ];

      expect(calculateMatchWinner(sets, badmintonRules)).toBeNull();
    });

    it('should work with different sports scoring', () => {
      const tennisSets: ScoreSet[] = [
        { team1: 6, team2: 4, completed: true, winner: 1 },
        { team1: 6, team2: 3, completed: true, winner: 1 }
      ];

      expect(calculateMatchWinner(tennisSets, tennisRules)).toBe(1);

      const volleyballSets: ScoreSet[] = [
        { team1: 25, team2: 20, completed: true, winner: 1 },
        { team1: 25, team2: 22, completed: true, winner: 1 },
        { team1: 25, team2: 18, completed: true, winner: 1 }
      ];

      expect(calculateMatchWinner(volleyballSets, volleyballRules)).toBe(1);
    });

    it('should handle empty sets array', () => {
      expect(calculateMatchWinner([], badmintonRules)).toBeNull();
    });
  });
});