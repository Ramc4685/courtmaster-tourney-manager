/**
 * Tennis Rules Implementation for CourtMaster Tournament Management System
 * 
 * Implements the IRacquetSportRules interface with tennis-specific rule set.
 * Based on standard ITF (International Tennis Federation) rules.
 */

import { IRacquetSportRules, MatchScore, SetScore, SportFormat, PointInput, ScoreValidationResult } from './ISportRules';

// Tennis-specific point scoring representation
export enum TennisPoint {
  ZERO = 0,
  FIFTEEN = 15,
  THIRTY = 30,
  FORTY = 40,
  ADVANTAGE = 45,
}

export class TennisRules implements IRacquetSportRules {
  // Sport identification
  readonly sportId: string = 'tennis';
  readonly sportName: string = 'Tennis';
  readonly sportDescription: string = 'A racquet sport played with racquets and a felt-covered ball on a rectangular court.';
  
  // Sport characteristics
  readonly isTeamSport: boolean = false;
  readonly teamSize: number = 1; // 1 for singles, 2 for doubles
  readonly hasAlternatingServe: boolean = true;
  readonly hasServerRotation: boolean = true;
  readonly pointsPerServe: number = 2; // 2 serves per point in tennis
  
  // Format definitions
  readonly formats: SportFormat[] = [
    {
      id: 'best_of_3',
      name: 'Best of 3 Sets',
      description: 'Match played to best of 3 sets, with standard scoring and tiebreakers',
      setCount: 3,
      pointsToWinSet: 6,
      minimumPointDifferential: 2,
      allowTiebreaker: true,
      tiebreakerPoints: 7,
      tiebreakerPointDifferential: 2,
      includesSetScores: true,
      scoringSystem: 'traditional'
    },
    {
      id: 'best_of_5',
      name: 'Best of 5 Sets',
      description: 'Professional format with best of 5 sets, with standard scoring and tiebreakers',
      setCount: 5,
      pointsToWinSet: 6,
      minimumPointDifferential: 2,
      allowTiebreaker: true,
      tiebreakerPoints: 7,
      tiebreakerPointDifferential: 2,
      includesSetScores: true,
      scoringSystem: 'traditional'
    },
    {
      id: 'fast_4',
      name: 'Fast4 Format',
      description: 'Shorter format with first to 4 games, tiebreak at 3-3, no-ad scoring',
      setCount: 3,
      pointsToWinSet: 4,
      minimumPointDifferential: 2,
      allowTiebreaker: true,
      tiebreakerPoints: 5,
      tiebreakerPointDifferential: 2,
      includesSetScores: true,
      scoringSystem: 'traditional',
      custom: {
        noAd: true,
        tiebreakAt: 3
      }
    }
  ];
  
  // Default format
  readonly defaultFormatId: string = 'best_of_3';
  
  /**
   * Get a specific format by ID
   */
  getFormat(formatId: string): SportFormat | null {
    return this.formats.find(format => format.id === formatId) || null;
  }
  
  /**
   * Initialize a new empty score for a match
   */
  createEmptyScore(formatId?: string): MatchScore {
    const format = this.getFormat(formatId || this.defaultFormatId) || this.getFormat(this.defaultFormatId)!;
    
    const sets: SetScore[] = [];
    for (let i = 0; i < format.setCount; i++) {
      sets.push({
        team1Score: 0,
        team2Score: 0,
        isComplete: false
      });
    }
    
    return {
      sets,
      isComplete: false
    };
  }
  
  /**
   * Add points to the current score
   */
  addPoints(currentScore: MatchScore, input: PointInput, formatId?: string): MatchScore {
    const format = this.getFormat(formatId || this.defaultFormatId) || this.getFormat(this.defaultFormatId)!;
    const result = JSON.parse(JSON.stringify(currentScore)) as MatchScore; // Deep clone
    
    // Find the current active set
    const activeSetIndex = result.sets.findIndex(set => !set.isComplete);
    
    // If match is already complete or no active set, return the current score
    if (result.isComplete || activeSetIndex === -1) {
      return result;
    }
    
    const activeSet = result.sets[activeSetIndex];
    
    // Add points to the active set (in tennis, we add a full game)
    if (input.team === 1) {
      activeSet.team1Score += input.points;
    } else {
      activeSet.team2Score += input.points;
    }
    
    // Check if the set is now complete
    if (this.isSetComplete(activeSet, formatId)) {
      activeSet.isComplete = true;
      activeSet.winner = activeSet.team1Score > activeSet.team2Score ? 1 : 2;
      
      // Check if the match is now complete
      const isMatchComplete = this.isMatchComplete(result, formatId);
      if (isMatchComplete) {
        result.isComplete = true;
        result.winner = this.getMatchWinner(result, formatId);
      }
    }
    
    return result;
  }
  
  /**
   * Remove the last point from the current score
   */
  removePoint(currentScore: MatchScore, formatId?: string): MatchScore {
    const result = JSON.parse(JSON.stringify(currentScore)) as MatchScore; // Deep clone
    
    // If the match is complete, reopen it
    if (result.isComplete) {
      result.isComplete = false;
      result.winner = undefined;
    }
    
    // Find the last non-empty set
    let activeSetIndex = result.sets.findIndex(set => !set.isComplete);
    
    // If all sets are complete, reopen the last set
    if (activeSetIndex === -1 && result.sets.length > 0) {
      activeSetIndex = result.sets.length - 1;
      const lastSet = result.sets[activeSetIndex];
      lastSet.isComplete = false;
      lastSet.winner = undefined;
    }
    
    // If we have a valid set, decrement the score
    if (activeSetIndex !== -1) {
      const activeSet = result.sets[activeSetIndex];
      
      // If both scores are 0, there's nothing to remove
      if (activeSet.team1Score === 0 && activeSet.team2Score === 0) {
        return result;
      }
      
      // Otherwise, decrement the higher score or team2 if equal
      if (activeSet.team1Score > activeSet.team2Score) {
        activeSet.team1Score--;
      } else {
        activeSet.team2Score--;
      }
    }
    
    return result;
  }
  
  /**
   * Validate a score according to the rules
   */
  validateScore(score: MatchScore, formatId?: string): ScoreValidationResult {
    const format = this.getFormat(formatId || this.defaultFormatId) || this.getFormat(this.defaultFormatId)!;
    const errors: string[] = [];
    
    // Check if number of sets is correct
    if (score.sets.length !== format.setCount) {
      errors.push(`Invalid number of sets: expected ${format.setCount}, got ${score.sets.length}`);
    }
    
    // Check each set for validity
    for (let i = 0; i < score.sets.length; i++) {
      const set = score.sets[i];
      
      // Check if scores are non-negative
      if (set.team1Score < 0 || set.team2Score < 0) {
        errors.push(`Set ${i+1} has negative score: [${set.team1Score}-${set.team2Score}]`);
      }
      
      // In tennis, set scores are typically 6-4, 7-5, 7-6, etc.
      const maxExpectedScore = format.id === 'fast_4' ? 7 : 14; // Allow for long tiebreakers
      if (set.team1Score > maxExpectedScore || set.team2Score > maxExpectedScore) {
        errors.push(`Set ${i+1} has unusually high score: [${set.team1Score}-${set.team2Score}]`);
      }
      
      // If the set is marked complete, check if it meets completion criteria
      if (set.isComplete) {
        const shouldBeComplete = this.isSetComplete(set, formatId);
        if (!shouldBeComplete) {
          errors.push(`Set ${i+1} is marked complete but does not meet completion criteria: [${set.team1Score}-${set.team2Score}]`);
        }
        
        // Check if winner is correctly assigned
        const calculatedWinner = set.team1Score > set.team2Score ? 1 : 2;
        if (set.winner !== calculatedWinner) {
          errors.push(`Set ${i+1} has incorrect winner: expected ${calculatedWinner}, got ${set.winner}`);
        }
      }
      
      // Check if sets are in sequential order of completion
      if (i > 0 && !score.sets[i-1].isComplete && set.isComplete) {
        errors.push(`Set ${i+1} is complete while previous set is not`);
      }
    }
    
    // Check match completion status
    const shouldBeComplete = this.isMatchComplete(score, formatId);
    if (score.isComplete !== shouldBeComplete) {
      errors.push(`Match completion status is incorrect: expected ${shouldBeComplete}, got ${score.isComplete}`);
    }
    
    // Check match winner
    if (score.isComplete) {
      const calculatedWinner = this.getMatchWinner(score, formatId);
      if (score.winner !== calculatedWinner) {
        errors.push(`Match has incorrect winner: expected ${calculatedWinner}, got ${score.winner}`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Check if a set is complete based on the score
   */
  isSetComplete(setScore: SetScore, formatId?: string): boolean {
    const format = this.getFormat(formatId || this.defaultFormatId) || this.getFormat(this.defaultFormatId)!;
    const { pointsToWinSet, minimumPointDifferential } = format;
    
    const score1 = setScore.team1Score;
    const score2 = setScore.team2Score;
    
    // For Fast4 format
    if (format.id === 'fast_4') {
      const tiebreakAt = format.custom?.tiebreakAt || 3;
      
      // Check if it's a tiebreak situation
      if (score1 === tiebreakAt && score2 === tiebreakAt) {
        // In this case, the set is not complete, will proceed to tiebreaker
        // In the real implementation this would be more complex
        return false;
      }
      
      // Otherwise check normal winning conditions
      if (score1 >= pointsToWinSet && score1 - score2 >= minimumPointDifferential) {
        return true;
      }
      
      if (score2 >= pointsToWinSet && score2 - score1 >= minimumPointDifferential) {
        return true;
      }
      
      return false;
    }
    
    // Regular tennis sets
    
    // Check tiebreak scenarios
    const isTiebreakNeeded = score1 === 6 && score2 === 6;
    
    if (isTiebreakNeeded && !format.allowTiebreaker) {
      // If tiebreakers are not allowed, the set continues until someone leads by 2 games
      return false;
    }
    
    if (isTiebreakNeeded && format.allowTiebreaker) {
      // In real implementation, we would need to track tiebreaker points separately
      // For simplicity, we'll assume the tiebreaker is handled as part of the set score
      return false;
    }
    
    // Normal set completion
    if (score1 >= pointsToWinSet && score1 - score2 >= minimumPointDifferential) {
      return true;
    }
    
    if (score2 >= pointsToWinSet && score2 - score1 >= minimumPointDifferential) {
      return true;
    }
    
    // For 7-5 scenarios
    if ((score1 === 7 && score2 === 5) || (score1 === 5 && score2 === 7)) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if a match is complete based on the score
   */
  isMatchComplete(score: MatchScore, formatId?: string): boolean {
    const format = this.getFormat(formatId || this.defaultFormatId) || this.getFormat(this.defaultFormatId)!;
    const setsToWinMatch = Math.ceil(format.setCount / 2); // In best-of-N format, need to win (N+1)/2 sets
    
    let team1SetsWon = 0;
    let team2SetsWon = 0;
    
    // Count completed sets won by each team
    for (const set of score.sets) {
      if (set.isComplete) {
        if (set.winner === 1) {
          team1SetsWon++;
        } else if (set.winner === 2) {
          team2SetsWon++;
        }
      }
    }
    
    return team1SetsWon >= setsToWinMatch || team2SetsWon >= setsToWinMatch;
  }
  
  /**
   * Determine the winner of a match based on the score
   */
  getMatchWinner(score: MatchScore, formatId?: string): number | undefined {
    if (!this.isMatchComplete(score, formatId)) {
      return undefined;
    }
    
    const format = this.getFormat(formatId || this.defaultFormatId) || this.getFormat(this.defaultFormatId)!;
    const setsToWinMatch = Math.ceil(format.setCount / 2);
    
    let team1SetsWon = 0;
    let team2SetsWon = 0;
    
    for (const set of score.sets) {
      if (set.isComplete) {
        if (set.winner === 1) {
          team1SetsWon++;
        } else if (set.winner === 2) {
          team2SetsWon++;
        }
      }
    }
    
    if (team1SetsWon >= setsToWinMatch) {
      return 1;
    }
    
    if (team2SetsWon >= setsToWinMatch) {
      return 2;
    }
    
    return undefined;
  }
  
  /**
   * Format a score for display
   */
  formatScoreForDisplay(score: MatchScore, formatId?: string): string {
    const setScores = score.sets
      .filter(set => set.team1Score > 0 || set.team2Score > 0)
      .map(set => this.formatSetScoreForDisplay(set, formatId));
    
    if (setScores.length === 0) {
      return '0-0';
    }
    
    return setScores.join(' ');
  }
  
  /**
   * Format a set score for display
   */
  formatSetScoreForDisplay(setScore: SetScore, formatId?: string): string {
    return `${setScore.team1Score}-${setScore.team2Score}`;
  }
  
  /**
   * Format a single game score according to tennis scoring convention (0, 15, 30, 40, Ad)
   */
  formatGameScoreForDisplay(pointsTeam1: number, pointsTeam2: number): string {
    const pointToString = (point: TennisPoint): string => {
      switch (point) {
        case TennisPoint.ZERO: return '0';
        case TennisPoint.FIFTEEN: return '15';
        case TennisPoint.THIRTY: return '30';
        case TennisPoint.FORTY: return '40';
        case TennisPoint.ADVANTAGE: return 'Ad';
        default: return point.toString();
      }
    };

    // Deuce
    if (pointsTeam1 === TennisPoint.FORTY && pointsTeam2 === TennisPoint.FORTY) {
      return 'Deuce';
    }

    // Advantage
    if (pointsTeam1 === TennisPoint.ADVANTAGE) {
      return 'Ad-40';
    }
    if (pointsTeam2 === TennisPoint.ADVANTAGE) {
      return '40-Ad';
    }

    // Regular score
    return `${pointToString(pointsTeam1)}-${pointToString(pointsTeam2)}`;
  }
  
  /**
   * Get common division types for this sport
   */
  getCommonDivisionTypes(): { id: string; name: string; description: string }[] {
    return [
      {
        id: 'mens_singles',
        name: "Men's Singles",
        description: "Men's singles matches"
      },
      {
        id: 'womens_singles',
        name: "Women's Singles",
        description: "Women's singles matches"
      },
      {
        id: 'mens_doubles',
        name: "Men's Doubles",
        description: "Men's doubles matches"
      },
      {
        id: 'womens_doubles',
        name: "Women's Doubles",
        description: "Women's doubles matches"
      },
      {
        id: 'mixed_doubles',
        name: "Mixed Doubles",
        description: "Mixed gender doubles matches"
      },
      {
        id: 'junior_singles',
        name: "Junior Singles",
        description: "Singles matches for junior players"
      },
      {
        id: 'junior_doubles',
        name: "Junior Doubles",
        description: "Doubles matches for junior players"
      },
      {
        id: 'senior_singles',
        name: "Senior Singles",
        description: "Singles matches for senior players"
      },
      {
        id: 'senior_doubles',
        name: "Senior Doubles",
        description: "Doubles matches for senior players"
      }
    ];
  }
  
  /**
   * Parse a score from a string representation
   */
  parseScoreFromString(scoreStr: string, formatId?: string): MatchScore | null {
    const format = this.getFormat(formatId || this.defaultFormatId) || this.getFormat(this.defaultFormatId)!;
    
    try {
      // Expected format: "6-4 7-5" or similar
      const setStrings = scoreStr.trim().split(/\s+/);
      const sets: SetScore[] = [];
      
      for (let i = 0; i < setStrings.length; i++) {
        const [team1ScoreStr, team2ScoreStr] = setStrings[i].split('-');
        
        if (!team1ScoreStr || !team2ScoreStr) {
          throw new Error(`Invalid set score format: ${setStrings[i]}`);
        }
        
        const team1Score = parseInt(team1ScoreStr.trim(), 10);
        const team2Score = parseInt(team2ScoreStr.trim(), 10);
        
        if (isNaN(team1Score) || isNaN(team2Score)) {
          throw new Error(`Invalid set score numbers: ${setStrings[i]}`);
        }
        
        const set: SetScore = {
          team1Score,
          team2Score,
          isComplete: this.isSetComplete({ team1Score, team2Score, isComplete: false }, formatId),
          winner: team1Score > team2Score ? 1 : 2
        };
        
        sets.push(set);
      }
      
      // Add empty sets if needed to reach the required set count
      while (sets.length < format.setCount) {
        sets.push({
          team1Score: 0,
          team2Score: 0,
          isComplete: false
        });
      }
      
      const matchScore: MatchScore = {
        sets,
        isComplete: this.isMatchComplete({ sets, isComplete: false }, formatId),
      };
      
      if (matchScore.isComplete) {
        matchScore.winner = this.getMatchWinner(matchScore, formatId);
      }
      
      return matchScore;
    } catch (error) {
      console.error('Error parsing score string:', error);
      return null;
    }
  }
  
  /**
   * Get tiebreaker rules for this sport and format
   */
  getTiebreakerRules(formatId?: string): Record<string, any> {
    const format = this.getFormat(formatId || this.defaultFormatId) || this.getFormat(this.defaultFormatId)!;
    
    return {
      enabled: format.allowTiebreaker,
      pointsToWin: format.tiebreakerPoints || 7,
      pointDifferential: format.tiebreakerPointDifferential || 2,
      atScore: format.id === 'fast_4' ? 3 : 6
    };
  }
  
  /**
   * Calculate the serving side based on the current score
   */
  getServingSide(score: MatchScore, currentSet: number): number {
    if (currentSet >= score.sets.length) {
      return 1; // Default to team 1 for invalid set number
    }
    
    // In tennis, the service alternates every game
    const set = score.sets[currentSet];
    const totalGames = set.team1Score + set.team2Score;
    
    // Initial server for the set
    let initialServer = 1;
    
    if (currentSet > 0) {
      // In subsequent sets, the server alternates from previous set
      initialServer = currentSet % 2 === 1 ? 2 : 1;
    }
    
    // Even total games means the initial server is serving
    // Odd total games means the other player is serving
    return totalGames % 2 === 0 ? initialServer : 3 - initialServer;
  }
  
  /**
   * Determine if it's a let (replay the point)
   */
  isLet(situation: Record<string, any>): boolean {
    // In a real implementation, this would check various let conditions
    // such as serve touching the net and landing in the correct service box
    return false;
  }
  
  /**
   * Get serving position for doubles (left or right court)
   */
  getServingPosition(score: MatchScore, currentSet: number): 'left' | 'right' {
    if (currentSet >= score.sets.length) {
      return 'right'; // Default position
    }
    
    const set = score.sets[currentSet];
    
    // In tennis, the server alternates between deuce (right) and ad (left) court
    // For the first point of a game, the server serves from the right (deuce) court
    
    // Determine current game score (in points)
    // Note: In a real implementation, we would need to track the current game separately
    const gamePointTotal = 0; // Placeholder
    
    // Even points are served from the right court, odd from the left
    return gamePointTotal % 2 === 0 ? 'right' : 'left';
  }
}

export default new TennisRules();
