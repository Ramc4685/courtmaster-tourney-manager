
import { MatchScore, ScoringSettings } from "@/types/tournament";

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
      
      // Check if we have a 2-point lead
      if (scoreDifference < 2) {
        // If we have a max points limit and either team has reached it,
        // the set can end with a 1-point difference
        if (maxPoints && (team1Score >= maxPoints || team2Score >= maxPoints)) {
          return { isValid: true };
        }
        
        return { 
          isValid: false, 
          message: "A 2-point lead is required to win" 
        };
      }
    }
  }
  
  return { isValid: true };
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
