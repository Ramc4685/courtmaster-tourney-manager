import { ScoringSettings, ScoreValidationResult, MatchScore, ScoreAuditLog } from '@/types/tournament';
import { Match } from "@/types/tournament";
import { Match, Score, ScoringSystem } from '@/types/tournament';

/**
 * Validates a set score according to scoring rules
 * @param team1Score Score for team 1
 * @param team2Score Score for team 2
 * @param settings Scoring settings to apply
 * @returns Validation result with errors and warnings
 */
export const validateSetScore = (
  team1Score: number,
  team2Score: number,
  settings: ScoringSettings
): ScoreValidationResult => {
  const result: ScoreValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Check for negative scores
  if (team1Score < 0 || team2Score < 0) {
    result.isValid = false;
    result.errors.push('Scores cannot be negative');
  }

  // Check if scores are too high
  if (team1Score > settings.maxPoints || team2Score > settings.maxPoints) {
    result.isValid = false;
    result.errors.push(`Scores cannot exceed the maximum of ${settings.maxPoints}`);
  }

  // Check for win conditions
  const winningScore = Math.max(team1Score, team2Score);
  const losingScore = Math.min(team1Score, team2Score);
  const scoreDifference = winningScore - losingScore;

  // If a team has reached winning score
  if (winningScore >= settings.pointsToWin) {
    // Check for required lead
    if (settings.mustWinByTwo && scoreDifference < 2 && winningScore < settings.maxTwoPointLeadScore) {
      result.isValid = false;
      result.errors.push(`A two-point lead is required to win below ${settings.maxTwoPointLeadScore} points`);
    }
  } else {
    // Winning score not reached
    if (Math.max(team1Score, team2Score) === settings.pointsToWin - 1) {
      result.warnings.push(`One more point needed to reach the winning score of ${settings.pointsToWin}`);
    }
  }

  return result;
};

/**
 * Creates a standardized audit log entry for score changes
 * @param setIndex The set being modified
 * @param previousScore Previous score
 * @param newScore New score
 * @param userId User making the change
 * @param reason Optional reason for the change
 * @returns Audit log entry
 */
export const createScoreAuditLog = (
  setIndex: number,
  previousScore: MatchScore,
  newScore: MatchScore,
  userId: string,
  reason?: string
): ScoreAuditLog => {
  return {
    timestamp: new Date(),
    action: 'SCORE_UPDATE',
    user_id: userId,
    details: {
      score: `Set ${setIndex + 1}: ${newScore.team1Score}-${newScore.team2Score}`,
      scorer: userId,
      setComplete: newScore.isComplete || false,
      previousScore: `${previousScore.team1Score}-${previousScore.team2Score}`,
      reason
    }
  };
};

/**
 * Returns default scoring settings for badminton
 * @returns Default scoring settings
 */
export const getDefaultBadmintonScoringSettings = (): ScoringSettings => {
  return {
    pointsToWin: 21,
    mustWinByTwo: true,
    maxPoints: 30,
    maxSets: 3,
    requireTwoPointLead: true,
    maxTwoPointLeadScore: 30,
    setsToWin: 2,
    tiebreakRules: {
      pointsToWin: 11,
      requireTwoPointLead: true,
      maxPoints: 15
    }
  };
};

/**
 * Returns default scoring settings for volleyball
 * @returns Default volleyball scoring settings
 */
export const getDefaultVolleyballScoringSettings = (): ScoringSettings => {
  return {
    pointsToWin: 25,
    mustWinByTwo: true,
    maxPoints: 30,
    maxSets: 5,
    requireTwoPointLead: true,
    maxTwoPointLeadScore: 30,
    setsToWin: 3
  };
};

export const BADMINTON_SCORING_SETTINGS: ScoringSettings = {
  maxPoints: 21,
  maxSets: 3,
  requireTwoPointLead: true,
  maxTwoPointLeadScore: 30,
  pointsToWin: 21,
  minPointDifference: 2
};


export const BadmintonScoringRules = {
  validateScore: (scores: MatchScore[]): boolean => {
    if (!scores.length) return true;

    const lastSet = scores[scores.length - 1];
    const { team1Score, team2Score } = lastSet;

    // Standard game to 21 points
    if (Math.max(team1Score, team2Score) >= 21) {
      // Winner must have 2 point lead or reach 30
      if (Math.max(team1Score, team2Score) === 30) return true;
      return Math.abs(team1Score - team2Score) >= 2;
    }

    return true;
  },

  isMatchComplete: (scores: MatchScore[]): boolean => {
    if (scores.length < 2) return false;

    let team1Sets = 0;
    let team2Sets = 0;

    scores.forEach(score => {
      if (score.team1Score > score.team2Score) team1Sets++;
      if (score.team2Score > score.team1Score) team2Sets++;
    });

    return team1Sets === 2 || team2Sets === 2;
  },

  getWinner: (match: Match): string | null => {
    if (!match.scores.length) return null;

    let team1Sets = 0;
    let team2Sets = 0;

    match.scores.forEach(score => {
      if (score.team1Score > score.team2Score) team1Sets++;
      if (score.team2Score > score.team1Score) team2Sets++;
    });

    if (team1Sets === 2) return match.team1Id;
    if (team2Sets === 2) return match.team2Id;

    return null;
  }
};