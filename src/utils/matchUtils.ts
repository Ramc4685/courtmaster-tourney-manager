import { Tournament, Match, Team, ScoringSettings, MatchStatus } from "@/types/tournament";
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
  if (!completedMatch || !completedMatch.nextMatchId) {
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

// Default scoring settings for badminton
export const getDefaultScoringSettings = (): ScoringSettings => {
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
