import { Match, MatchScore, ScoringSettings } from "@/types/tournament";

// Validate set score based on scoring rules
export const validateSetScore = (
  team1Score: number,
  team2Score: number,
  settings: ScoringSettings
): { valid: boolean; message?: string } => {
  const { pointsToWin, mustWinByTwo, maxPoints } = settings;

  // Check for negative scores
  if (team1Score < 0 || team2Score < 0) {
    return { valid: false, message: "Scores cannot be negative" };
  }

  // If either team has reached the points to win
  if (team1Score >= pointsToWin || team2Score >= pointsToWin) {
    // Check if we need to win by 2
    if (mustWinByTwo) {
      const difference = Math.abs(team1Score - team2Score);
      
      // If we have a max points and we've reached it
      if (maxPoints && (team1Score >= maxPoints || team2Score >= maxPoints)) {
        const leader = team1Score > team2Score ? team1Score : team2Score;
        const trailer = team1Score > team2Score ? team2Score : team1Score;
        
        // At max points, leader only needs to be ahead by 1
        if (leader === maxPoints && leader > trailer) {
          return { valid: true };
        }
      }
      
      // Otherwise check for 2 point lead
      if (difference < 2) {
        return { 
          valid: false, 
          message: "When a team reaches the points to win, they must be ahead by 2 points" 
        };
      }
    }
  } else {
    // If neither team has reached the points to win, the set is not complete
    return { valid: true };
  }

  return { valid: true };
};

// Determine if a set is complete
export const isSetComplete = (
  team1Score: number,
  team2Score: number,
  settings: ScoringSettings
): boolean => {
  const { pointsToWin, mustWinByTwo, maxPoints } = settings;

  // Check if either team has reached the points to win
  if (team1Score >= pointsToWin || team2Score >= pointsToWin) {
    // If we must win by two
    if (mustWinByTwo) {
      const difference = Math.abs(team1Score - team2Score);
      
      // If we've hit max points
      if (maxPoints && (team1Score >= maxPoints || team2Score >= maxPoints)) {
        const leader = team1Score > team2Score ? team1Score : team2Score;
        const trailer = team1Score > team2Score ? team2Score : team1Score;
        
        // At max points, leader only needs to be ahead by 1
        return leader === maxPoints && leader > trailer;
      }
      
      // Otherwise need 2 point lead
      return difference >= 2;
    }
    
    // If we don't need to win by 2, just reaching points to win is enough
    return true;
  }
  
  return false;
};

// Get the winner of a set (1 for team1, 2 for team2)
export const getSetWinner = (score: MatchScore): "team1" | "team2" | null => {
  if (score.team1Score > score.team2Score) {
    return "team1";
  } else if (score.team2Score > score.team1Score) {
    return "team2";
  }
  return null;
};

// Determine if a match is complete
export const isMatchComplete = (
  scores: MatchScore[],
  settings: ScoringSettings
): boolean => {
  const setsToWin = settings.setsToWin || 2;
  let team1Sets = 0;
  let team2Sets = 0;
  
  scores.forEach(score => {
    if (score.team1Score > score.team2Score) {
      team1Sets++;
    } else if (score.team2Score > score.team1Score) {
      team2Sets++;
    }
  });
  
  return team1Sets >= setsToWin || team2Sets >= setsToWin;
};

// Get default scoring settings for badminton
export const getDefaultScoringSettings = (): ScoringSettings => {
  return {
    pointsToWin: 21,
    mustWinByTwo: true,
    maxPoints: 30,
    setsToWin: 2,
    maxSets: 3
  };
};

// Add audit log for score change
export const addScoreAuditLog = (
  match: Match,
  userId: string,
  scoreData: { scores: MatchScore[]; scorerName?: string }
): Match => {
  const updatedMatch = { ...match };
  
  const auditLog = {
    id: `audit-${Date.now()}`,
    userId,
    timestamp: new Date(),
    action: "SCORE_UPDATED",
    type: "MATCH",
    details: {
      scores: scoreData.scores,
      previousScores: match.scores
    }
  };
  
  updatedMatch.scores = scoreData.scores;
  if (scoreData.scorerName) {
    updatedMatch.scorerName = scoreData.scorerName;
  }
  
  if (!updatedMatch.auditLogs) {
    updatedMatch.auditLogs = [];
  }
  
  updatedMatch.auditLogs.push(auditLog);
  
  return updatedMatch;
};

// Standard badminton scoring settings
export const BADMINTON_SCORING_SETTINGS: ScoringSettings = {
  pointsToWin: 21,
  mustWinByTwo: true,
  maxPoints: 30,
  setsToWin: 2,
  maxSets: 3,
  tiebreakRules: {
    pointsToWin: 21,
    requireTwoPointLead: true,
    maxPoints: 30
  }
};
