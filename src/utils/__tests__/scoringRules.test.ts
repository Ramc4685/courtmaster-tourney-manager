
import { describe, it, expect } from 'vitest';
import { ScoringSettings } from '@/types/tournament';
import { 
  isSetComplete, 
  getSetWinner, 
  isMatchComplete 
} from '@/utils/matchUtils';

describe('Scoring Rules Tests', () => {
  it('should correctly determine if a set is complete based on scoring rules', () => {
    // Test case for regular badminton scoring
    const badmintonRules: ScoringSettings = {
      pointsToWin: 21,
      mustWinByTwo: true,
      maxPoints: 30,
      requireTwoPointLead: true,
      maxTwoPointLeadScore: 30,
      maxSets: 3,
      setsToWin: 2
    };

    // Not enough points to win
    expect(isSetComplete(19, 15, badmintonRules)).toBe(false);
    
    // Exact points to win with sufficient lead
    expect(isSetComplete(21, 19, badmintonRules)).toBe(true);
    
    // Not enough lead
    expect(isSetComplete(21, 20, badmintonRules)).toBe(false);
    
    // Extended play with sufficient lead
    expect(isSetComplete(25, 23, badmintonRules)).toBe(true);
    
    // Maximum points reached
    expect(isSetComplete(30, 28, badmintonRules)).toBe(true);
    expect(isSetComplete(30, 29, badmintonRules)).toBe(true); // At max points, we don't need 2 point lead
  });

  it('should determine the correct winner of a set', () => {
    const badmintonRules: ScoringSettings = {
      pointsToWin: 21,
      mustWinByTwo: true,
      maxPoints: 30,
      requireTwoPointLead: true,
      maxTwoPointLeadScore: 30,
      maxSets: 3,
      setsToWin: 2
    };
    
    // Set not complete, no winner
    expect(getSetWinner(19, 15, badmintonRules)).toBe(null);
    
    // Team 1 wins
    expect(getSetWinner(21, 19, badmintonRules)).toBe('team1');
    expect(getSetWinner(25, 23, badmintonRules)).toBe('team1');
    expect(getSetWinner(30, 28, badmintonRules)).toBe('team1');
    
    // Team 2 wins
    expect(getSetWinner(19, 21, badmintonRules)).toBe('team2');
    expect(getSetWinner(23, 25, badmintonRules)).toBe('team2');
    expect(getSetWinner(28, 30, badmintonRules)).toBe('team2');
  });

  it('should determine if a match is complete', () => {
    const badmintonRules: ScoringSettings = {
      pointsToWin: 21,
      mustWinByTwo: true,
      maxPoints: 30,
      requireTwoPointLead: true,
      maxTwoPointLeadScore: 30,
      maxSets: 3,
      setsToWin: 2
    };
    
    // No sets played
    const emptyMatch = { 
      id: '1', 
      tournamentId: '1', 
      status: 'IN_PROGRESS', 
      scores: [] 
    };
    expect(isMatchComplete(emptyMatch, badmintonRules)).toBe(false);
    
    // One set complete, team1 winning
    const oneSetMatch = { 
      id: '1', 
      tournamentId: '1', 
      status: 'IN_PROGRESS', 
      scores: [{ team1Score: 21, team2Score: 15 }] 
    };
    expect(isMatchComplete(oneSetMatch, badmintonRules)).toBe(false);
    
    // Two sets complete, team1 won both (best of 3)
    const twoSetsTeam1WinMatch = { 
      id: '1', 
      tournamentId: '1', 
      status: 'IN_PROGRESS', 
      scores: [
        { team1Score: 21, team2Score: 15 },
        { team1Score: 21, team2Score: 18 }
      ] 
    };
    expect(isMatchComplete(twoSetsTeam1WinMatch, badmintonRules)).toBe(true);
    
    // Three sets played, team2 won 2-1 (best of 3)
    const threeSetsTeam2WinMatch = { 
      id: '1', 
      tournamentId: '1', 
      status: 'IN_PROGRESS', 
      scores: [
        { team1Score: 21, team2Score: 15 },
        { team1Score: 18, team2Score: 21 },
        { team1Score: 19, team2Score: 21 }
      ] 
    };
    expect(isMatchComplete(threeSetsTeam2WinMatch, badmintonRules)).toBe(true);
  });
});
