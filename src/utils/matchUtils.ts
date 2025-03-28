
import { Match, Team, Tournament, Division, TournamentStage, MatchStatus } from "@/types/tournament";
import { generateId } from "./tournamentUtils";

// Create a new match
export const createMatch = (
  tournamentId: string, 
  team1: Team, 
  team2: Team, 
  division: Division,
  stage: TournamentStage,
  scheduledTime?: Date,
  courtNumber?: number,
  bracketRound?: number,
  bracketPosition?: number,
  groupName?: string
): Match => {
  return {
    id: generateId(),
    tournamentId,
    team1,
    team2,
    scores: [{ team1Score: 0, team2Score: 0 }],
    division,
    stage,
    courtNumber,
    scheduledTime,
    status: "SCHEDULED" as MatchStatus,
    bracketRound,
    bracketPosition,
    groupName
  };
};

// Determine winner and loser of a match
export const determineMatchWinnerAndLoser = (match: Match): { winner: Team, loser: Team } | null => {
  // Cannot determine winner/loser if not enough scores
  if (!match.scores || match.scores.length === 0) return null;
  
  let team1Sets = 0;
  let team2Sets = 0;
  
  match.scores.forEach(score => {
    if (score.team1Score > score.team2Score) {
      team1Sets++;
    } else if (score.team2Score > score.team1Score) {
      team2Sets++;
    }
  });
  
  if (team1Sets === team2Sets) return null; // Tie
  
  const winner = team1Sets > team2Sets ? match.team1 : match.team2;
  const loser = team1Sets > team2Sets ? match.team2 : match.team1;
  
  return { winner, loser };
};

// Update bracket progression
export const updateBracketProgression = (
  tournament: Tournament, 
  completedMatch: Match, 
  winner: Team
): Tournament => {
  if (!completedMatch.nextMatchId) return tournament;
  
  const updatedMatches = [...tournament.matches];
  const nextMatchIndex = updatedMatches.findIndex(m => m.id === completedMatch.nextMatchId);
  
  if (nextMatchIndex < 0) return tournament;
  
  const nextMatch = updatedMatches[nextMatchIndex];
  const isFirstTeam = completedMatch.bracketPosition && completedMatch.bracketPosition % 2 !== 0;
  
  updatedMatches[nextMatchIndex] = {
    ...nextMatch,
    team1: isFirstTeam ? winner : nextMatch.team1,
    team2: !isFirstTeam ? winner : nextMatch.team2
  };
  
  return {
    ...tournament,
    matches: updatedMatches,
    updatedAt: new Date()
  };
};
