/**
 * Badminton Rules Implementation for CourtMaster Tournament Management System
 * 
 * Implements the IRacquetSportRules interface with badminton-specific rule set.
 * Based on standard BWF (Badminton World Federation) rules.
 */

import { IRacquetSportRules, MatchScore, SetScore, SportFormat, PointInput, ScoreValidationResult } from './ISportRules';

export class BadmintonRules implements IRacquetSportRules {
  // Sport identification
  readonly sportId: string = 'badminton';
  readonly sportName: string = 'Badminton';
  readonly sportDescription: string = 'A racquet sport played using racquets to hit a shuttlecock across a net.';
  
  // Sport characteristics
  readonly isTeamSport: boolean = false;
  readonly teamSize: number = 1; // 1 for singles, but can be configured for doubles (2)
  readonly hasAlternatingServe: boolean = true;
  readonly hasServerRotation: boolean = false; // Server can score on any rally in modern badminton
  
  // Format definitions
  readonly formats: SportFormat[] = [
    {
      id: 'standard',
      name: 'Standard (Best of 3)',
      description: 'Best of 3 sets, 21 points per set with 2-point lead required',
      setCount: 3,
      pointsToWinSet: 21,
      minimumPointDifferential: 2,
      allowTiebreaker: false,
      servesPerSide: 1,
      includesSetScores: true,
      scoringSystem: 'rally'
    },
    {
      id: 'professional',
      name: 'Professional (Best of 3)',
      description: 'Best of 3 sets, 21 points per set with 2-point lead required, max 30 points',
      setCount: 3,
      pointsToWinSet: 21,
      minimumPointDifferential: 2,
      allowTiebreaker: false,
      servesPerSide: 1,
      includesSetScores: true,
      scoringSystem: 'rally'
    },
    {
      id: 'quick',
      name: 'Quick Match (Best of 1)',
      description: 'Single set match to 21 points',
      setCount: 1,
      pointsToWinSet: 21,
      minimumPointDifferential: 2,
      allowTiebreaker: false,
      servesPerSide: 1,
      includesSetScores: true,
      scoringSystem: 'rally'
    }
  ];
  
  // Default format
  readonly defaultFormatId: string = 'standard';
  
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
    
    // Add points to the active set
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
      
      // Check for realistic scores (no extremely high scores)
      const maxReasonableScore = format.pointsToWinSet * 2;
      if (set.team1Score > maxReasonableScore || set.team2Score > maxReasonableScore) {
        errors.push(`Set ${i+1} has unusually high score: [${set.team1Score}-${set.team2Score}]`);
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
    
    // Check if either player has reached max points (in professional format it's 30)
    const maxPoints = format.id === 'professional' ? 30 : 99;
    if (score1 >= maxPoints || score2 >= maxPoints) {
      return true;
    }
    
    // Check if either player has reached points to win with the required lead
    const hasReachedWinPoints = score1 >= pointsToWinSet || score2 >= pointsToWinSet;
    if (!hasReachedWinPoints) {
      return false;
    }
    
    const difference = Math.abs(score1 - score2);
    return difference >= minimumPointDifferential;
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
    
    return setScores.join(', ');
  }
  
  /**
   * Format a set score for display
   */
  formatSetScoreForDisplay(setScore: SetScore, formatId?: string): string {
    return `${setScore.team1Score}-${setScore.team2Score}`;
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
        id: 'open_singles',
        name: "Open Singles",
        description: "Open category singles matches"
      },
      {
        id: 'open_doubles',
        name: "Open Doubles",
        description: "Open category doubles matches"
      },
      {
        id: 'youth_singles',
        name: "Youth Singles",
        description: "Singles matches for youth players"
      },
      {
        id: 'youth_doubles',
        name: "Youth Doubles",
        description: "Doubles matches for youth players"
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
      // Expected format: "21-19,19-21,21-15" or similar
      const setStrings = scoreStr.split(',');
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
    return {
      mustWinByTwo: true,
      maxTiePoints: formatId === 'professional' ? 30 : 99
    };
  }
  
  /**
   * Calculate the serving side based on the current score
   */
  getServingSide(score: MatchScore, currentSet: number): number {
    if (currentSet >= score.sets.length) {
      return 1; // Default to team 1 for invalid set number
    }
    
    const set = score.sets[currentSet];
    const totalPoints = set.team1Score + set.team2Score;
    
    // For standard badminton rules:
    // - First serve of the match goes to team 1
    // - At start of each subsequent set, server is team that won the previous set
    // - Server changes whenever a point is scored
    
    if (currentSet === 0) {
      // First set
      if (totalPoints === 0) {
        return 1; // Team 1 serves first
      }
    } else {
      // Subsequent sets
      const previousSet = score.sets[currentSet - 1];
      if (totalPoints === 0) {
        // First serve in a new set goes to the winner of the previous set
        return previousSet.winner || 1;
      }
    }
    
    // Even total points means the server is the player who scored last
    // Odd total points means the other player is serving
    const isEven = totalPoints % 2 === 0;
    
    if (isEven) {
      // Determine who scored the last point
      const previousTotal = totalPoints - 1;
      const previousTeam1 = Math.floor(previousTotal / 2);
      
      if (set.team1Score > previousTeam1) {
        return 1; // Team 1 scored last
      } else {
        return 2; // Team 2 scored last
      }
    } else {
      // Odd total points, server changes
      const previousTotal = totalPoints - 1;
      const previousTeam1 = Math.floor(previousTotal / 2);
      
      if (set.team1Score > previousTeam1) {
        return 2; // Team 1 scored last, so Team 2 serves
      } else {
        return 1; // Team 2 scored last, so Team 1 serves
      }
    }
  }
  
  /**
   * Determine if it's a let (replay the point)
   */
  isLet(situation: Record<string, any>): boolean {
    // In a real implementation, this would check various let conditions
    // such as shuttle hitting the net cord and falling over, external interference, etc.
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
    const totalPoints = set.team1Score + set.team2Score;
    
    // In badminton, right court service (even) when server's score is even
    // Left court service (odd) when server's score is odd
    const servingSide = this.getServingSide(score, currentSet);
    const serverScore = servingSide === 1 ? set.team1Score : set.team2Score;
    
    return serverScore % 2 === 0 ? 'right' : 'left';
  }
}

export default new BadmintonRules();
