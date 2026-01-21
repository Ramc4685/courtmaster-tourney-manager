/**
 * Sport Rules Interface for CourtMaster Tournament Management System
 * 
 * Defines a sport-agnostic interface for scoring rules and game mechanics.
 * This enables the system to support multiple indoor sports with their unique rule sets.
 */

export interface MatchScore {
  sets: SetScore[];
  winner?: number; // 1 for team/player 1, 2 for team/player 2, null if not complete
  isComplete: boolean;
}

export interface SetScore {
  team1Score: number;
  team2Score: number;
  isComplete: boolean;
  winner?: number; // 1 for team/player 1, 2 for team/player 2, null if not complete
}

export interface PointInput {
  team: 1 | 2; // 1 for team/player 1, 2 for team/player 2
  points: number; // Number of points to add (usually 1)
}

export interface SportFormat {
  id: string;
  name: string;
  description: string;
  setCount: number; // Number of sets in a match
  pointsToWinSet: number;
  minimumPointDifferential: number;
  allowTiebreaker: boolean;
  tiebreakerPoints?: number; // Points needed to win a tiebreaker set
  tiebreakerPointDifferential?: number;
  servesPerSide?: number; // Number of serves before switching
  includesSetScores: boolean;
  scoringSystem: 'rally' | 'traditional' | 'custom';
  custom?: Record<string, any>;
}

export interface ScoreValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Interface for sport-specific scoring rules
 * All sports must implement this interface to be supported in the system
 */
export interface ISportRules {
  /**
   * Unique identifier for the sport
   */
  readonly sportId: string;
  
  /**
   * Display name for the sport
   */
  readonly sportName: string;
  
  /**
   * Description of the sport
   */
  readonly sportDescription: string;
  
  /**
   * Whether the sport is typically played as teams or individuals
   */
  readonly isTeamSport: boolean;
  
  /**
   * Typical team size (1 for singles, 2 for doubles, etc.)
   * For team sports with variable sizes, this is the minimum size
   */
  readonly teamSize: number;
  
  /**
   * Maximum team size for team sports with variable sizes
   */
  readonly maxTeamSize?: number;
  
  /**
   * Available match formats for this sport
   */
  readonly formats: SportFormat[];
  
  /**
   * Default match format ID to use if none specified
   */
  readonly defaultFormatId: string;
  
  /**
   * Get a specific format by ID
   */
  getFormat(formatId: string): SportFormat | null;
  
  /**
   * Initialize a new empty score for a match
   */
  createEmptyScore(formatId?: string): MatchScore;
  
  /**
   * Add points to the current score
   * Returns the updated score
   */
  addPoints(currentScore: MatchScore, input: PointInput, formatId?: string): MatchScore;
  
  /**
   * Remove the last point from the current score
   * Returns the updated score
   */
  removePoint(currentScore: MatchScore, formatId?: string): MatchScore;
  
  /**
   * Validate a score according to the rules
   * Returns validation result with any errors
   */
  validateScore(score: MatchScore, formatId?: string): ScoreValidationResult;
  
  /**
   * Check if a set is complete based on the score
   */
  isSetComplete(setScore: SetScore, formatId?: string): boolean;
  
  /**
   * Check if a match is complete based on the score
   */
  isMatchComplete(score: MatchScore, formatId?: string): boolean;
  
  /**
   * Determine the winner of a match based on the score
   * Returns 1 for team/player 1, 2 for team/player 2, or undefined if not complete
   */
  getMatchWinner(score: MatchScore, formatId?: string): number | undefined;
  
  /**
   * Format a score for display
   * Returns a string representation of the score
   */
  formatScoreForDisplay(score: MatchScore, formatId?: string): string;
  
  /**
   * Format a set score for display
   * Returns a string representation of the set score
   */
  formatSetScoreForDisplay(setScore: SetScore, formatId?: string): string;
  
  /**
   * Get common division types for this sport
   * Returns an array of typical division formats
   */
  getCommonDivisionTypes(): { id: string; name: string; description: string }[];
  
  /**
   * Parse a score from a string representation
   * Useful for importing scores
   */
  parseScoreFromString(scoreStr: string, formatId?: string): MatchScore | null;
  
  /**
   * Get tiebreaker rules for this sport and format
   */
  getTiebreakerRules(formatId?: string): Record<string, any>;
}

/**
 * Interface for racquet sports like Badminton, Tennis, Table Tennis, etc.
 * Extends the base sport rules with racquet-specific concepts
 */
export interface IRacquetSportRules extends ISportRules {
  /**
   * Determines whether serving side changes after each point
   */
  readonly hasAlternatingServe: boolean;
  
  /**
   * Determines whether the server changes after a set number of points
   */
  readonly hasServerRotation: boolean;
  
  /**
   * Number of points before server rotates (if applicable)
   */
  readonly pointsPerServe?: number;
  
  /**
   * Calculate the serving side based on the current score
   * Returns 1 for team/player 1, 2 for team/player 2
   */
  getServingSide(score: MatchScore, currentSet: number): number;
  
  /**
   * Determine if it's a let (replay the point)
   */
  isLet(situation: Record<string, any>): boolean;
  
  /**
   * Get serving position for doubles (left or right court)
   * Returns 'left' or 'right'
   */
  getServingPosition(score: MatchScore, currentSet: number): 'left' | 'right';
}

/**
 * Interface for team sports like Volleyball, Basketball, etc.
 * Extends the base sport rules with team-specific concepts
 */
export interface ITeamSportRules extends ISportRules {
  /**
   * Minimum number of players required to start a match
   */
  readonly minimumPlayers: number;
  
  /**
   * Whether the sport allows substitutions
   */
  readonly allowsSubstitutions: boolean;
  
  /**
   * Maximum number of substitutions allowed per set/game/match
   */
  readonly maxSubstitutions?: number;
  
  /**
   * Whether the sport has timed periods (like quarters, halves)
   */
  readonly hasTimedPeriods: boolean;
  
  /**
   * Duration of each period in minutes (if applicable)
   */
  readonly periodDurationMinutes?: number;
  
  /**
   * Number of periods in a standard match (if applicable)
   */
  readonly periodsPerMatch?: number;
  
  /**
   * Track a substitution in the match
   */
  trackSubstitution(matchData: Record<string, any>, playerIn: string, playerOut: string): Record<string, any>;
  
  /**
   * Check if a player is eligible for substitution
   */
  canSubstitute(matchData: Record<string, any>, playerId: string): boolean;
  
  /**
   * Initialize player positions for the start of a set/period
   */
  initializePositions(players: string[]): Record<string, any>;
  
  /**
   * Validate team rotation after point/rally
   */
  validateRotation(currentPositions: Record<string, any>): boolean;
}

/**
 * Interface for individual sports like Combat Sports, Track & Field, etc.
 * Extends the base sport rules with individual-specific concepts
 */
export interface IIndividualSportRules extends ISportRules {
  /**
   * Whether the sport has weight classes or divisions
   */
  readonly hasWeightClasses: boolean;
  
  /**
   * Whether the sport is scored by judges
   */
  readonly hasScoredJudging: boolean;
  
  /**
   * Number of judges in a standard match (if applicable)
   */
  readonly judgeCount?: number;
  
  /**
   * Whether the sport has rounds/periods
   */
  readonly hasRounds: boolean;
  
  /**
   * Duration of each round in minutes (if applicable)
   */
  readonly roundDurationMinutes?: number;
  
  /**
   * Number of rounds in a standard match (if applicable)
   */
  readonly roundsPerMatch?: number;
  
  /**
   * Submit a judge's score for a round
   */
  submitJudgeScore(matchData: Record<string, any>, judgeId: string, roundNumber: number, score: Record<string, any>): Record<string, any>;
  
  /**
   * Calculate the final score based on judges' scores
   */
  calculateFinalScore(matchData: Record<string, any>): Record<string, any>;
  
  /**
   * Check if a match can end via technical decision (e.g., TKO, submission)
   */
  canEndByTechnicalDecision(): boolean;
  
  /**
   * End a match by technical decision
   */
  endByTechnicalDecision(matchData: Record<string, any>, winnerId: string, reason: string): Record<string, any>;
}
