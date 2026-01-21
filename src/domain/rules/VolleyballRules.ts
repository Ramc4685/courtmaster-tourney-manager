/**
 * Volleyball Rules Implementation for CourtMaster Tournament Management System
 * 
 * Implements the ITeamSportRules interface with volleyball-specific rule set.
 * Based on standard FIVB (International Volleyball Federation) rules.
 */

import { ITeamSportRules, MatchScore, SetScore, SportFormat, PointInput, ScoreValidationResult } from './ISportRules';

export class VolleyballRules implements ITeamSportRules {
  // Sport identification
  readonly sportId: string = 'volleyball';
  readonly sportName: string = 'Volleyball';
  readonly sportDescription: string = 'A team sport in which two teams of six players are separated by a net and score points by grounding a ball on the other team\'s court.';
  
  // Sport characteristics
  readonly isTeamSport: boolean = true;
  readonly teamSize: number = 6; // Standard volleyball team size
  readonly minimumPlayers: number = 4; // Minimum to avoid forfeit
  readonly maxTeamSize: number = 12; // Including substitutes
  
  // Team sport specific
  readonly allowsSubstitutions: boolean = true;
  readonly maxSubstitutions: number = 6; // Per set, per team
  readonly hasTimedPeriods: boolean = false; // Volleyball is played to point totals, not time
  
  // Format definitions
  readonly formats: SportFormat[] = [
    {
      id: 'standard',
      name: 'Standard Best of 5',
      description: 'Best of 5 sets, first 4 sets to 25 points, deciding set to 15 points',
      setCount: 5,
      pointsToWinSet: 25,
      minimumPointDifferential: 2,
      allowTiebreaker: true,
      tiebreakerPoints: 15,
      includesSetScores: true,
      scoringSystem: 'rally'
    },
    {
      id: 'best_of_3',
      name: 'Best of 3 Sets',
      description: 'Best of 3 sets, first 2 sets to 25 points, deciding set to 15 points',
      setCount: 3,
      pointsToWinSet: 25,
      minimumPointDifferential: 2,
      allowTiebreaker: true,
      tiebreakerPoints: 15,
      includesSetScores: true,
      scoringSystem: 'rally'
    },
    {
      id: 'recreational',
      name: 'Recreational',
      description: 'Best of 3 sets, all sets to 21 points',
      setCount: 3,
      pointsToWinSet: 21,
      minimumPointDifferential: 2,
      allowTiebreaker: false,
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
      const isFinalSet = i === score.sets.length - 1;
      
      // Check if scores are non-negative
      if (set.team1Score < 0 || set.team2Score < 0) {
        errors.push(`Set ${i+1} has negative score: [${set.team1Score}-${set.team2Score}]`);
      }
      
      // If the set is marked complete, check if it meets completion criteria
      if (set.isComplete) {
        // Special check for final set in standard format
        const pointsNeeded = this.getPointsNeededForSet(format, isFinalSet);
        const minDiff = format.minimumPointDifferential;
        
        // Verify the winning score meets minimum requirements
        const winningScore = Math.max(set.team1Score, set.team2Score);
        const losingScore = Math.min(set.team1Score, set.team2Score);
        const scoreDiff = winningScore - losingScore;
        
        if (winningScore < pointsNeeded) {
          errors.push(`Set ${i+1} winning score (${winningScore}) is less than required (${pointsNeeded})`);
        } else if (scoreDiff < minDiff) {
          errors.push(`Set ${i+1} score differential (${scoreDiff}) is less than required (${minDiff})`);
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
    
    // Determine if this is a final set based on previous completed sets
    const isFinalSet = false; // For simplicity; a full implementation would check previous sets
    
    const pointsNeeded = this.getPointsNeededForSet(format, isFinalSet);
    const minDiff = format.minimumPointDifferential;
    
    const score1 = setScore.team1Score;
    const score2 = setScore.team2Score;
    
    // Check if either team has reached required points with minimum difference
    if (score1 >= pointsNeeded && score1 - score2 >= minDiff) {
      return true;
    }
    
    if (score2 >= pointsNeeded && score2 - score1 >= minDiff) {
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
        id: 'mens',
        name: "Men's Volleyball",
        description: "Men's volleyball teams"
      },
      {
        id: 'womens',
        name: "Women's Volleyball",
        description: "Women's volleyball teams"
      },
      {
        id: 'mixed',
        name: "Mixed Volleyball",
        description: "Mixed gender volleyball teams"
      },
      {
        id: 'u18_boys',
        name: "U18 Boys",
        description: "Under 18 boys volleyball"
      },
      {
        id: 'u18_girls',
        name: "U18 Girls",
        description: "Under 18 girls volleyball"
      },
      {
        id: 'u16_boys',
        name: "U16 Boys",
        description: "Under 16 boys volleyball"
      },
      {
        id: 'u16_girls',
        name: "U16 Girls",
        description: "Under 16 girls volleyball"
      },
      {
        id: 'recreational',
        name: "Recreational",
        description: "Recreational level volleyball"
      },
      {
        id: 'competitive',
        name: "Competitive",
        description: "Competitive level volleyball"
      }
    ];
  }
  
  /**
   * Parse a score from a string representation
   */
  parseScoreFromString(scoreStr: string, formatId?: string): MatchScore | null {
    const format = this.getFormat(formatId || this.defaultFormatId) || this.getFormat(this.defaultFormatId)!;
    
    try {
      // Expected format: "25-20,25-18,15-25,25-22" or similar
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
    const format = this.getFormat(formatId || this.defaultFormatId) || this.getFormat(this.defaultFormatId)!;
    
    return {
      isFinalSetDifferent: true,
      regularSetPoints: format.pointsToWinSet,
      finalSetPoints: format.tiebreakerPoints || 15,
      pointDifferential: format.minimumPointDifferential
    };
  }
  
  /**
   * Track a substitution in the match
   */
  trackSubstitution(matchData: Record<string, any>, playerIn: string, playerOut: string): Record<string, any> {
    // Create a deep clone of match data to avoid mutations
    const result = JSON.parse(JSON.stringify(matchData));
    
    if (!result.substitutions) {
      result.substitutions = {
        team1: [],
        team2: []
      };
    }
    
    // Determine which team the players belong to
    const team = this.getPlayerTeam(matchData, playerOut);
    
    if (!team) {
      console.error('Player not found on either team');
      return result;
    }
    
    // Record the substitution
    result.substitutions[team].push({
      timeStamp: new Date().toISOString(),
      playerIn,
      playerOut,
      setNumber: result.currentSet || 1,
      score: {
        team1: result.sets?.[result.currentSet - 1]?.team1Score || 0,
        team2: result.sets?.[result.currentSet - 1]?.team2Score || 0
      }
    });
    
    // Update the active players
    if (!result.activePlayers) {
      result.activePlayers = { team1: [], team2: [] };
    }
    
    const teamActivePlayers = result.activePlayers[team];
    const playerOutIndex = teamActivePlayers.indexOf(playerOut);
    
    if (playerOutIndex !== -1) {
      teamActivePlayers[playerOutIndex] = playerIn;
    } else {
      console.error(`Player ${playerOut} not found in active players`);
    }
    
    return result;
  }
  
  /**
   * Check if a player is eligible for substitution
   */
  canSubstitute(matchData: Record<string, any>, playerId: string): boolean {
    // Check if max substitutions has been reached
    const team = this.getPlayerTeam(matchData, playerId);
    if (!team) {
      return false;
    }
    
    const currentSet = matchData.currentSet || 1;
    
    // Count substitutions for this player in this set
    const substitutions = matchData.substitutions?.[team] || [];
    const setSubstitutions = substitutions.filter(
      (sub: any) => sub.setNumber === currentSet
    );
    
    if (setSubstitutions.length >= this.maxSubstitutions) {
      return false;
    }
    
    // Check if player has already been substituted out and back in
    // A player can only return to the game once per set
    const playerSubs = setSubstitutions.filter(
      (sub: any) => sub.playerOut === playerId || sub.playerIn === playerId
    );
    
    // If player has been both out and back in, they cannot be substituted again
    const wasOut = playerSubs.some((sub: any) => sub.playerOut === playerId);
    const wasIn = playerSubs.some((sub: any) => sub.playerIn === playerId);
    
    if (wasOut && wasIn) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Initialize player positions for the start of a set/period
   */
  initializePositions(players: string[]): Record<string, any> {
    if (players.length < this.teamSize) {
      throw new Error(`Not enough players: got ${players.length}, need ${this.teamSize}`);
    }
    
    // In volleyball, players are in positions 1-6, rotating clockwise
    // Position 1: back-right (server)
    // Position 2: front-right
    // Position 3: front-center
    // Position 4: front-left
    // Position 5: back-left
    // Position 6: back-center
    
    const positions: Record<number, string> = {};
    
    for (let i = 0; i < this.teamSize; i++) {
      positions[i + 1] = players[i];
    }
    
    return {
      positions,
      rotationCount: 0,
      server: 1 // Position 1 serves first
    };
  }
  
  /**
   * Validate team rotation after point/rally
   */
  validateRotation(currentPositions: Record<string, any>): boolean {
    // In a real implementation, this would check if positions are valid
    // For simplicity, we'll assume positions are valid if all 6 spots are filled
    const positions = currentPositions.positions || {};
    const positionNumbers = Object.keys(positions).map(Number);
    
    // Check if all 6 positions are filled
    if (positionNumbers.length !== 6) {
      return false;
    }
    
    // Check if positions are valid (1-6)
    for (const pos of positionNumbers) {
      if (pos < 1 || pos > 6) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Helper method to determine which team a player belongs to
   */
  private getPlayerTeam(matchData: Record<string, any>, playerId: string): 'team1' | 'team2' | null {
    const team1Players = [...(matchData.team1Players || []), ...(matchData.team1Substitutes || [])];
    const team2Players = [...(matchData.team2Players || []), ...(matchData.team2Substitutes || [])];
    
    if (team1Players.includes(playerId)) {
      return 'team1';
    }
    
    if (team2Players.includes(playerId)) {
      return 'team2';
    }
    
    return null;
  }
  
  /**
   * Helper method to get the points needed for a set
   */
  private getPointsNeededForSet(format: SportFormat, isFinalSet: boolean): number {
    if (isFinalSet && format.allowTiebreaker && format.tiebreakerPoints) {
      return format.tiebreakerPoints;
    }
    
    return format.pointsToWinSet;
  }
}

export default new VolleyballRules();
