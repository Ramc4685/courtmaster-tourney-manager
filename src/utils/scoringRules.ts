import { ScoringSettings, ScoreValidationResult, MatchScore, ScoreAuditLog } from '@/types/tournament';
import { Match } from "@/types/tournament";

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

import { Match, ScoringSettings, MatchScore } from "@/types/tournament";

export const BADMINTON_SCORING_SETTINGS: ScoringSettings = {
  maxPoints: 21,
  maxSets: 3,
  requireTwoPointLead: true,
  maxTwoPointLeadScore: 30,
  pointsToWin: 21,
  minPointDifference: 2
};

export function validateBadmintonScore(scores: MatchScore[], settings: ScoringSettings = BADMINTON_SCORING_SETTINGS): boolean {
  if (!scores.length) return false;

  const setsWonByTeam1 = scores.filter(s => s.team1Score > s.team2Score).length;
  const setsWonByTeam2 = scores.filter(s => s.team2Score > s.team1Score).length;

  // Check if either team has won enough sets
  if (setsWonByTeam1 > settings.maxSets / 2 || setsWonByTeam2 > settings.maxSets / 2) {
    return true;
  }

  // Validate individual set scores
  return scores.every(score => {
    const { team1Score, team2Score } = score;
    const maxScore = Math.max(team1Score, team2Score);
    const minScore = Math.min(team1Score, team2Score);

    // Basic point validation
    if (maxScore < settings.pointsToWin) return true;

    // Two-point lead validation
    if (settings.requireTwoPointLead) {
      const pointDiff = Math.abs(team1Score - team2Score);
      if (pointDiff < settings.minPointDifference) return false;

      // Check maximum score cap
      if (settings.maxTwoPointLeadScore && maxScore > settings.maxTwoPointLeadScore) {
        return false;
      }
    }

    return maxScore >= settings.pointsToWin;
  });
}

export function determineMatchWinner(match: Match, settings: ScoringSettings = BADMINTON_SCORING_SETTINGS): "team1" | "team2" | null {
  const { scores } = match;
  if (!validateBadmintonScore(scores, settings)) return null;

  const setsWonByTeam1 = scores.filter(s => s.team1Score > s.team2Score).length;
  const setsWonByTeam2 = scores.filter(s => s.team2Score > s.team1Score).length;

  if (setsWonByTeam1 > settings.maxSets / 2) return "team1";
  if (setsWonByTeam2 > settings.maxSets / 2) return "team2";

  return null;
}