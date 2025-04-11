import { MatchScore, ScoringSettings } from "@/types/tournament";

/**
 * Default badminton scoring settings
 */
export const BADMINTON_SCORING_SETTINGS: ScoringSettings = {
  pointsToWin: 21,
  mustWinByTwo: true,
  maxPoints: 30,
  maxSets: 3,
  setsToWin: 2,
  requireTwoPointLead: true,
  maxTwoPointLeadScore: 30
};

/**
 * Validates if a badminton score is valid according to the scoring rules
 */
export const validateBadmintonScore = (
  team1Score: number,
  team2Score: number,
  settings: ScoringSettings
): { isValid: boolean; message?: string } => {
  // Check for negative scores
  if (team1Score < 0 || team2Score < 0) {
    return { isValid: false, message: "Scores cannot be negative" };
  }

  const { pointsToWin, mustWinByTwo, maxPoints } = settings;
  
  // If either team has reached the points to win
  if (team1Score >= pointsToWin || team2Score >= pointsToWin) {
    // If we need to win by two points
    if (mustWinByTwo) {
      const scoreDifference = Math.abs(team1Score - team2Score);
      
      // If we have a max points limit and either team has reached it,
      // the set can end with a 1-point difference
      if (maxPoints && (team1Score >= maxPoints || team2Score >= maxPoints)) {
        return { isValid: true };
      }
      
      // Otherwise, we need a 2-point lead
      return { 
        isValid: scoreDifference >= 2, 
        message: scoreDifference < 2 ? "A 2-point lead is required to win" : undefined
      };
    }
  }
  
  return { isValid: true };
};

/**
 * Validates a score object against scoring settings
 */
export const validateScore = (
  score: MatchScore,
  settings: ScoringSettings
): { isValid: boolean; errors: string[]; warnings: string[] } => {
  const result = validateBadmintonScore(score.team1Score, score.team2Score, settings);
  return {
    isValid: result.isValid,
    errors: result.isValid ? [] : [result.message || "Invalid score"],
    warnings: []
  };
};

/**
 * Validates if a set score is valid according to scoring rules
 */
export const validateSetScore = (
  score: MatchScore,
  settings: ScoringSettings
): { isValid: boolean; message?: string } => {
  return validateBadmintonScore(score.team1Score, score.team2Score, settings);
};

/**
 * Checks if a set is complete based on scoring rules
 */
export const isSetComplete = (
  team1Score: number,
  team2Score: number,
  settings: ScoringSettings
): boolean => {
  const { pointsToWin, mustWinByTwo, maxPoints } = settings;
  
  // Check if either team has reached the required points to win
  if (team1Score >= pointsToWin || team2Score >= pointsToWin) {
    // If we must win by two, check the point difference
    if (mustWinByTwo) {
      const scoreDifference = Math.abs(team1Score - team2Score);
      
      // If we have a max points limit and either team has reached it,
      // the set can end with a 1-point difference
      if (maxPoints && (team1Score >= maxPoints || team2Score >= maxPoints)) {
        return true;
      }
      
      // Otherwise, we need a 2-point lead
      return scoreDifference >= 2;
    }
    
    // If we don't need to win by two, then reaching the points to win is enough
    return true;
  }
  
  return false;
};

/**
 * Get the winner of a set
 */
export const getSetWinner = (
  team1Score: number,
  team2Score: number, 
  settings: ScoringSettings
): 'team1' | 'team2' | null => {
  if (!isSetComplete(team1Score, team2Score, settings)) {
    return null;
  }
  
  return team1Score > team2Score ? 'team1' : 'team2';
};

/**
 * Creates an audit log entry for a score change
 */
export const createScoreAuditLog = (
  action: string,
  score: MatchScore,
  scorerId: string,
  previousScore?: string
) => {
  return {
    timestamp: new Date(),
    action: action,
    details: {
      score: `${score.team1Score}-${score.team2Score}`,
      scorer: scorerId,
      setComplete: !!score.isComplete,
      previousScore: previousScore
    },
    user_id: scorerId
  };
};

/**
 * Adds an audit log entry for a score change
 */
export const addScoreAuditLog = (
  match: any,
  team: "team1" | "team2",
  oldScore: number,
  newScore: number,
  setNumber: number,
  scorerName?: string
): any => {
  const now = new Date();
  const userId = "system"; // This should come from auth context in a real app
  
  const auditLog = {
    timestamp: now,
    user_id: userId,
    userName: scorerName || "System",
    action: "SCORE_UPDATE",
    details: {
      team,
      setNumber,
      oldScore,
      newScore,
      timestamp: now.toISOString()
    }
  };
  
  const updatedMatch = {
    ...match,
    auditLogs: [...(match.auditLogs || []), auditLog],
    updatedAt: now
  };
  
  return updatedMatch;
};

/**
 * Get default scoring settings for a sport
 */
export const getDefaultScoringSettings = (sport = "BADMINTON"): ScoringSettings => {
  return {
    pointsToWin: 21,
    mustWinByTwo: true,
    maxPoints: 30,
    setsToWin: 2,
    maxSets: 3,
    requireTwoPointLead: true,
    maxTwoPointLeadScore: 30,
    gamesPerSet: 1,
    pointsPerGame: 21
  };
};
