import { Tournament, Match, Team, ScoringSettings } from "@/types/tournament";
import { ScorerType } from "@/types/tournament-enums";
import { generateId } from "./tournamentUtils";

/**
 * Updates bracket progression data between matches
 * @param tournament The tournament containing matches
 * @param completedMatchId The match that was just completed
 * @param winnerId ID of the winning team or "team1"/"team2"
 * @returns Tournament with updated bracket progression
 */
export const updateBracketProgression = (
  tournament: Tournament,
  completedMatchId: string,
  winnerId: string
): Tournament => {
  const completedMatch = tournament.matches.find(m => m.id === completedMatchId);
  if (!completedMatch) {
    return tournament;
  }

  // Find the next match
  const nextMatch = tournament.matches.find(m => m.id === completedMatch.nextMatchId);
  if (!nextMatch) {
    return tournament;
  }

  // Determine which team won (actual Team object or "team1"/"team2")
  const winningTeam = typeof winnerId === 'string' && (winnerId === 'team1' || winnerId === 'team2')
    ? completedMatch[winnerId]
    : tournament.teams.find(t => t.id === winnerId);

  if (!winningTeam) {
    console.error("Winner team not found");
    return tournament;
  }

  // Update the next match with the winning team
  const position = completedMatch.nextMatchPosition || 'team1';
  const updatedNextMatch = {
    ...nextMatch,
    [position]: winningTeam,
    updatedAt: new Date()
  };

  // Update the tournament with the modified matches
  const updatedMatches = tournament.matches.map(m => 
    m.id === updatedNextMatch.id ? updatedNextMatch : m
  );

  return {
    ...tournament,
    matches: updatedMatches,
    updatedAt: new Date()
  };
};

/**
 * Determines the winner and loser of a match based on scores and scoring settings
 * @param match The match to analyze
 * @param settings Scoring settings to apply
 * @returns Object containing winner and loser teams, or null if match is not complete
 */
export const determineMatchWinnerAndLoser = (
  match: Match,
  settings: ScoringSettings
): { winner: Team; loser: Team } | null => {
  if (!match.scores || !match.team1 || !match.team2) {
    return null;
  }

  // Count sets won by each team
  let team1SetsWon = 0;
  let team2SetsWon = 0;

  // Iterate through scores array
  for (let i = 0; i < match.scores.team1.length; i++) {
    const team1Score = match.scores.team1[i];
    const team2Score = match.scores.team2[i];
    
    if (team1Score > team2Score) {
      team1SetsWon++;
    } else if (team2Score > team1Score) {
      team2SetsWon++;
    }
  }

  // Determine winner based on sets won
  if (team1SetsWon > team2SetsWon) {
    return {
      winner: match.team1,
      loser: match.team2
    };
  } else if (team2SetsWon > team1SetsWon) {
    return {
      winner: match.team2,
      loser: match.team1
    };
  }

  return null;
};

// Default scoring settings for badminton
export const getDefaultScoringSettings = (): ScoringSettings => {
  return {
    setsToWin: 2,
    gamesPerSet: 21,
    pointsPerGame: 21,
    tiebreakAt: 20,
    tiebreakPoints: 11,
    allowWalkover: true,
    defaultScorerType: ScorerType.REFEREE
  };
};
