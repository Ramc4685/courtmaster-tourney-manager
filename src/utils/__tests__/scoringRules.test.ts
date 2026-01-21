
import { describe, it, expect } from 'vitest';
import { MatchScore } from '@/types/tournament.d';
import { 
  isSetComplete, 
  getSetWinner, 
  isMatchComplete,
  countSetsWon
} from '@/utils/matchUtils';

describe('Match Utils Tests', () => {
  it('should correctly determine if a set is complete based on scoring rules', () => {
    // Test case for regular badminton scoring (21 points, must win by 2, max 30)
    
    // Not enough points to win
    expect(isSetComplete(19, 15, 21, true, 30)).toBe(false);
    
    // Exact points to win with sufficient lead
    expect(isSetComplete(21, 19, 21, true, 30)).toBe(true);
    
    // Not enough lead
    expect(isSetComplete(21, 20, 21, true, 30)).toBe(false);
    
    // Extended play with sufficient lead
    expect(isSetComplete(25, 23, 21, true, 30)).toBe(true);
    
    // Maximum points reached
    expect(isSetComplete(30, 28, 21, true, 30)).toBe(true);
    expect(isSetComplete(30, 29, 21, true, 30)).toBe(true); // At max points, we don't need 2 point lead
  });

  it('should determine the correct winner of a set', () => {
    const team1 = 'team1';
    const team2 = 'team2';
    
    // Team 1 wins
    const set1: MatchScore = { team1Score: 21, team2Score: 19 };
    expect(getSetWinner(set1, team1, team2)).toBe('team1');
    
    const set2: MatchScore = { team1Score: 25, team2Score: 23 };
    expect(getSetWinner(set2, team1, team2)).toBe('team1');
    
    // Team 2 wins
    const set3: MatchScore = { team1Score: 19, team2Score: 21 };
    expect(getSetWinner(set3, team1, team2)).toBe('team2');
    
    // Tie (no winner)
    const set4: MatchScore = { team1Score: 20, team2Score: 20 };
    expect(getSetWinner(set4, team1, team2)).toBe(null);
  });

  it('should determine if a match is complete', () => {
    // No sets played
    const emptyScores: MatchScore[] = [];
    expect(isMatchComplete(emptyScores, 2)).toBe(false);
    
    // One set complete, team1 winning
    const oneSetScores: MatchScore[] = [{ team1Score: 21, team2Score: 15 }];
    expect(isMatchComplete(oneSetScores, 2)).toBe(false);
    
    // Two sets complete, team1 won both (best of 3, need 2 to win)
    const twoSetsTeam1WinScores: MatchScore[] = [
      { team1Score: 21, team2Score: 15 },
      { team1Score: 21, team2Score: 18 }
    ];
    expect(isMatchComplete(twoSetsTeam1WinScores, 2)).toBe(true);
    
    // Three sets played, team2 won 2-1 (best of 3)
    const threeSetsTeam2WinScores: MatchScore[] = [
      { team1Score: 21, team2Score: 15 },
      { team1Score: 18, team2Score: 21 },
      { team1Score: 19, team2Score: 21 }
    ];
    expect(isMatchComplete(threeSetsTeam2WinScores, 2)).toBe(true);
  });

  it('should count sets won correctly', () => {
    const scores: MatchScore[] = [
      { team1Score: 21, team2Score: 15 }, // team1 wins
      { team1Score: 18, team2Score: 21 }, // team2 wins
      { team1Score: 21, team2Score: 19 }  // team1 wins
    ];
    
    const result = countSetsWon(scores);
    expect(result.team1Sets).toBe(2);
    expect(result.team2Sets).toBe(1);
  });
});
