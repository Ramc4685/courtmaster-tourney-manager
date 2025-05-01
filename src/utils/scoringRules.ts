import { MatchScores, ScoreSet, MatchStatus } from '@/types/entities';
import { ScoringRules } from '@/components/admin/tournament/types'; // Assuming ScoringRules type is defined here

/**
 * Checks if a set is complete based on the scoring rules.
 * @param set - The score set to check.
 * @param rules - The scoring rules for the tournament.
 * @returns True if the set is complete, false otherwise.
 */
export function isSetComplete(set: ScoreSet, rules: ScoringRules): boolean {
  const { pointsToWinSet, mustWinByTwo, maxPointsPerSet } = rules;
  const score1 = set.team1;
  const score2 = set.team2;

  // Check if score reached max points
  if (score1 === maxPointsPerSet || score2 === maxPointsPerSet) {
    return true;
  }

  // Check if score reached points to win with the required lead
  const hasReachedWinPoints = score1 >= pointsToWinSet || score2 >= pointsToWinSet;
  if (!hasReachedWinPoints) {
    return false;
  }

  const difference = Math.abs(score1 - score2);

  if (mustWinByTwo) {
    // Must win by 2, unless max points is reached (handled above)
    return difference >= 2;
  } else {
    // If not mustWinByTwo, reaching pointsToWinSet is enough
    return true;
  }
}

/**
 * Calculates the winner of a completed set.
 * @param set - The score set (must be determined complete by isSetComplete first).
 * @param rules - The scoring rules.
 * @returns 1 if team 1 won, 2 if team 2 won, or null if the set is not decisively complete (should not happen if isSetComplete is true).
 */
export function calculateSetWinner(set: ScoreSet, rules: ScoringRules): 1 | 2 | null {
  if (!isSetComplete(set, rules)) {
    return null; // Set is not complete
  }

  const { pointsToWinSet, mustWinByTwo, maxPointsPerSet } = rules;
  const score1 = set.team1;
  const score2 = set.team2;

  // Check max points first
  if (score1 === maxPointsPerSet) return 1;
  if (score2 === maxPointsPerSet) return 2;

  // Check standard win conditions
  if (score1 >= pointsToWinSet) {
    if (!mustWinByTwo || Math.abs(score1 - score2) >= 2) {
      return 1;
    }
  }
  if (score2 >= pointsToWinSet) {
    if (!mustWinByTwo || Math.abs(score1 - score2) >= 2) {
      return 2;
    }
  }

  return null; // Should be unreachable if isSetComplete is correct
}

/**
 * Checks if a match is complete based on the completed sets and scoring rules.
 * @param completedSets - An array of completed score sets.
 * @param rules - The scoring rules for the tournament.
 * @returns True if the match is complete, false otherwise.
 */
export function isMatchComplete(completedSets: ScoreSet[], rules: ScoringRules): boolean {
  const { setsToWinMatch } = rules;
  let team1SetsWon = 0;
  let team2SetsWon = 0;

  for (const set of completedSets) {
    if (set.completed && set.winner === 1) {
      team1SetsWon++;
    } else if (set.completed && set.winner === 2) {
      team2SetsWon++;
    }
  }

  return team1SetsWon >= setsToWinMatch || team2SetsWon >= setsToWinMatch;
}

/**
 * Calculates the winner of a completed match.
 * @param completedSets - An array of completed score sets (match must be determined complete by isMatchComplete first).
 * @param rules - The scoring rules.
 * @returns 1 if team 1 won, 2 if team 2 won, or null if the match is not decisively complete.
 */
export function calculateMatchWinner(completedSets: ScoreSet[], rules: ScoringRules): 1 | 2 | null {
   if (!isMatchComplete(completedSets, rules)) {
    return null; // Match is not complete
  }
  
  const { setsToWinMatch } = rules;
  let team1SetsWon = 0;
  let team2SetsWon = 0;

  for (const set of completedSets) {
    if (set.completed && set.winner === 1) {
      team1SetsWon++;
    } else if (set.completed && set.winner === 2) {
      team2SetsWon++;
    }
  }

  if (team1SetsWon >= setsToWinMatch) {
    return 1;
  }
  if (team2SetsWon >= setsToWinMatch) {
    return 2;
  }

  return null; // Should be unreachable if isMatchComplete is correct
}

