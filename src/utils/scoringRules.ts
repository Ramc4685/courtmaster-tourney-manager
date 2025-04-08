import { ScoringRule, ScoringSettings, ScoreValidationResult, MatchScore } from '@/types/scoring';

// Default scoring rules for different sports
export const defaultScoringRules: Record<string, ScoringRule> = {
  badminton: {
    id: 'badminton',
    name: 'Badminton',
    sport: 'badminton',
    maxPoints: 21,
    requireTwoPointLead: true,
    maxTwoPointLeadScore: 30,
    maxSets: 3,
    setsToWin: 2,
    tiebreakRules: {
      pointsToWin: 11,
      requireTwoPointLead: true,
      maxPoints: 15
    }
  },
  tennis: {
    id: 'tennis',
    name: 'Tennis',
    sport: 'tennis',
    maxPoints: 6,
    requireTwoPointLead: true,
    maxTwoPointLeadScore: 7,
    maxSets: 5,
    setsToWin: 3,
    tiebreakRules: {
      pointsToWin: 7,
      requireTwoPointLead: true,
      maxPoints: 10
    }
  },
  volleyball: {
    id: 'volleyball',
    name: 'Volleyball',
    sport: 'volleyball',
    maxPoints: 25,
    requireTwoPointLead: true,
    maxTwoPointLeadScore: 27,
    maxSets: 5,
    setsToWin: 3,
    tiebreakRules: {
      pointsToWin: 15,
      requireTwoPointLead: true,
      maxPoints: 17
    }
  }
};

// Validate a score based on the scoring rules
export const validateScore = (
  score: MatchScore,
  settings: ScoringSettings
): ScoreValidationResult => {
  const result: ScoreValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Check if scores are within valid range
  if (score.team1Score < 0 || score.team2Score < 0) {
    result.isValid = false;
    result.errors.push('Scores cannot be negative');
  }

  // Check if either score exceeds maximum points
  if (score.team1Score > settings.maxTwoPointLeadScore || 
      score.team2Score > settings.maxTwoPointLeadScore) {
    result.isValid = false;
    result.errors.push(`Score cannot exceed ${settings.maxTwoPointLeadScore} points`);
  }

  // Check if a two-point lead is required and if it's satisfied
  if (settings.requireTwoPointLead) {
    const scoreDiff = Math.abs(score.team1Score - score.team2Score);
    const maxScore = Math.max(score.team1Score, score.team2Score);
    
    if (maxScore >= settings.maxPoints && scoreDiff < 2) {
      result.warnings.push('Two-point lead required to win');
    }
  }

  return result;
};

// Determine if a set is complete based on the scoring rules
export const isSetComplete = (
  team1Score: number,
  team2Score: number,
  settings: ScoringSettings
): boolean => {
  const maxScore = Math.max(team1Score, team2Score);
  const scoreDiff = Math.abs(team1Score - team2Score);

  // Check if either player has reached the maximum points
  if (maxScore >= settings.maxPoints) {
    // If two-point lead is required
    if (settings.requireTwoPointLead) {
      // Set is complete if there's a two-point lead
      if (scoreDiff >= 2) {
        return true;
      }
      // Set is complete if max score is reached
      if (maxScore >= settings.maxTwoPointLeadScore) {
        return true;
      }
      return false;
    }
    // If no two-point lead required, set is complete
    return true;
  }

  return false;
};

// Determine the winner of a set
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

// Create an audit log entry for a score change
export const createScoreAuditLog = (
  action: string,
  score: MatchScore,
  scorer: string,
  previousScore?: string,
  reason?: string
): ScoreAuditLog => {
  return {
    timestamp: new Date(),
    action,
    details: {
      score: `${score.team1Score}-${score.team2Score}`,
      scorer,
      setComplete: score.isComplete,
      previousScore,
      reason
    },
    user_id: 'system' // This should be replaced with actual user ID
  };
};

// Get default scoring settings for a sport
export const getDefaultScoringSettings = (sport: string): ScoringSettings => {
  const rule = defaultScoringRules[sport.toLowerCase()];
  if (!rule) {
    throw new Error(`No default scoring rules found for sport: ${sport}`);
  }

  return {
    maxPoints: rule.maxPoints,
    requireTwoPointLead: rule.requireTwoPointLead,
    maxTwoPointLeadScore: rule.maxTwoPointLeadScore,
    maxSets: rule.maxSets,
    setsToWin: rule.setsToWin,
    tiebreakRules: rule.tiebreakRules
  };
}; 