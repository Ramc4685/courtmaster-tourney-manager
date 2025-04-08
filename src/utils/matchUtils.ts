import { Match, MatchScore } from '@/types/tournament';
import { ScoringSettings } from '@/types/scoring';

/**
 * Validates if a set is complete based on the scoring settings.
 * @param team1Score Score of team 1.
 * @param team2Score Score of team 2.
 * @param scoringSettings Scoring settings for the match.
 * @returns True if the set is complete, false otherwise.
 */
export const isSetComplete = (team1Score: number, team2Score: number, scoringSettings: ScoringSettings): boolean => {
  const { pointsToWin, mustWinByTwo, maxPoints, requireTwoPointLead, maxTwoPointLeadScore } = scoringSettings;

  if (team1Score >= maxTwoPointLeadScore || team2Score >= maxTwoPointLeadScore) {
    if (requireTwoPointLead) {
      return Math.abs(team1Score - team2Score) >= 2;
    }
  }

  if (team1Score >= pointsToWin || team2Score >= pointsToWin) {
    if (mustWinByTwo) {
      return Math.abs(team1Score - team2Score) >= 2;
    }
    return true;
  }

  return false;
};

/**
 * Determines the winner of a set based on the scores and scoring settings.
 * @param team1Score Score of team 1.
 * @param team2Score Score of team 2.
 * @param scoringSettings Scoring settings for the match.
 * @returns "team1" if team 1 won, "team2" if team 2 won, null if no winner.
 */
export const getSetWinner = (team1Score: number, team2Score: number, scoringSettings: ScoringSettings): "team1" | "team2" | null => {
  if (!isSetComplete(team1Score, team2Score, scoringSettings)) {
    return null;
  }

  return team1Score > team2Score ? "team1" : "team2";
};

/**
 * Validates if a match is complete based on the scoring settings and match scores.
 * @param match Match object with scores.
 * @param scoringSettings Scoring settings for the match.
 * @returns True if the match is complete, false otherwise.
 */
export const isMatchComplete = (match: Match, scoringSettings: ScoringSettings): boolean => {
  if (!match.scores || match.scores.length === 0) {
    return false;
  }

  const { maxSets } = scoringSettings;
  let team1Wins = 0;
  let team2Wins = 0;

  for (let i = 0; i < match.scores.length; i++) {
    if (i >= maxSets) break; // Only consider up to maxSets

    const score = match.scores[i];
    if (!score) continue;

    const winner = getSetWinner(score.team1Score, score.team2Score, scoringSettings);
    if (winner === "team1") {
      team1Wins++;
    } else if (winner === "team2") {
      team2Wins++;
    }
  }

  // Determine sets needed to win
  const setsToWin = scoringSettings.setsToWin || Math.ceil(maxSets / 2);

  return team1Wins >= setsToWin || team2Wins >= setsToWin;
};

/**
 * Determines the winner and loser of a match based on the scores and scoring settings.
 * @param match Match object with scores.
 * @param scoringSettings Scoring settings for the match.
 * @returns An object with winner and loser, or null if the match is not complete.
 */
export const determineMatchWinnerAndLoser = (match: Match, scoringSettings: ScoringSettings): { winner: "team1" | "team2"; loser: "team1" | "team2" } | null => {
  if (!isMatchComplete(match, scoringSettings)) {
    return null;
  }

  let team1Wins = 0;
  let team2Wins = 0;

  for (const score of match.scores || []) {
    if (score.team1Score > score.team2Score) {
      team1Wins++;
    } else {
      team2Wins++;
    }
  }

  return team1Wins > team2Wins ? { winner: "team1", loser: "team2" } : { winner: "team2", loser: "team1" };
};

/**
 * Generates a default scoring settings object.
 * @param sport Sport for which to generate default settings.
 * @returns Default scoring settings.
 */
export const getDefaultScoringSettings = (sport: string = "volleyball"): ScoringSettings => {
  return {
    pointsToWin: 25,
    mustWinByTwo: true,
    maxPoints: 30,
    maxSets: 5,
    requireTwoPointLead: true,
    maxTwoPointLeadScore: 30,
    setsToWin: 3,
  };
};

/**
 * Counts the number of sets won by a specific team
 * @param scores Array of match scores
 * @param team Which team to count sets for ("team1" or "team2")
 * @returns Number of sets won
 */
export const countSetsWon = (scores: MatchScore[], team: "team1" | "team2"): number => {
  if (!scores || scores.length === 0) return 0;
  
  const scoringSettings = getDefaultScoringSettings();
  
  return scores.filter(score => {
    if (!score) return false;
    
    const team1Score = score.team1Score || 0;
    const team2Score = score.team2Score || 0;
    
    // Check if the set is complete
    if (!isSetComplete(team1Score, team2Score, scoringSettings)) {
      return false;
    }
    
    // Return true if the requested team won this set
    if (team === "team1") {
      return team1Score > team2Score;
    } else {
      return team2Score > team1Score;
    }
  }).length;
};
