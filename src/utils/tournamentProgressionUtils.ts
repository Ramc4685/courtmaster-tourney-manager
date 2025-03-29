import { Tournament, Team, Division, TournamentStage, MatchStatus, Match, TournamentCategory } from "@/types/tournament";
import { generateId } from "./tournamentUtils";

// Function to determine the next round matches in a single elimination tournament
export const getNextRoundMatches = (matches: Match[], currentRound: number): Match[] => {
  // Filter matches for the next round
  return matches.filter(match => match.bracketRound === currentRound + 1);
};

// Function to generate matches for the next round in a single elimination tournament
export const generateNextRoundMatches = (tournament: Tournament, currentRoundMatches: Match[]): Match[] => {
  const nextRound = currentRoundMatches[0]?.bracketRound ? currentRoundMatches[0].bracketRound + 1 : 1;
  const nextRoundMatches: Match[] = [];

  for (let i = 0; i < currentRoundMatches.length; i += 2) {
    const match1 = currentRoundMatches[i];
    const match2 = currentRoundMatches[i + 1];

    if (match1 && match2) {
      // Create a new match for the next round
      const nextMatch: Match = {
        id: generateId(),
        tournamentId: tournament.id,
        team1: { id: 'TBD', name: 'TBD', players: [] }, // Placeholder, winner of match1
        team2: { id: 'TBD', name: 'TBD', players: [] }, // Placeholder, winner of match2
        scores: [],
        division: "INITIAL",
        stage: "INITIAL_ROUND",
        status: "SCHEDULED" as MatchStatus,
        bracketRound: nextRound,
        bracketPosition: i / 2 + 1,
        category: match1.category, // Inherit category from previous match
        updatedAt: new Date()
      };

      nextRoundMatches.push(nextMatch);
    }
  }

  return nextRoundMatches;
};

// Function to update bracket progression
export const updateBracketProgression = (
  tournament: Tournament,
  match: Match,
  winner: Team
): Tournament => {
  // If the match has a next match defined, update that match
  if (match.nextMatchId) {
    const nextMatch = tournament.matches.find(m => m.id === match.nextMatchId);
  
    if (nextMatch) {
      // Determine if this match feeds into team1 or team2 of the next match
      // This logic would depend on your tournament bracket structure
      // For simplicity, we'll assume there's a pattern to determine this
  
      // For example, if match positions are structured in a way that
      // odd-numbered positions feed into team1 and even into team2:
      const updatedNextMatch = { ...nextMatch };
  
      if (match.bracketPosition && match.bracketPosition % 2 === 1) {
        updatedNextMatch.team1 = winner;
      } else {
        updatedNextMatch.team2 = winner;
      }
  
      const updatedMatches = tournament.matches.map(m => 
        m.id === nextMatch.id ? updatedNextMatch : m
      );
  
      return {
        ...tournament,
        matches: updatedMatches
      };
    }
  }
  
  return tournament;
};

// Update the assignPlayerSeeding function to correctly update and return the tournament
export const assignPlayerSeeding = (tournament: Tournament): Tournament => {
  const teamsCopy = [...tournament.teams];
  
  // Group teams by category
  const teamsByCategory: Record<string, Team[]> = {};
  
  for (const team of teamsCopy) {
    const categoryId = team.category?.id || 'uncategorized';
    if (!teamsByCategory[categoryId]) {
      teamsByCategory[categoryId] = [];
    }
    teamsByCategory[categoryId].push(team);
  }
  
  // Assign seeding within each category
  let updatedTeams: Team[] = [];
  
  for (const categoryId in teamsByCategory) {
    const teams = teamsByCategory[categoryId];
    
    teams.forEach((team, index) => {
      team.seed = index + 1;
    });
    
    updatedTeams = [...updatedTeams, ...teams];
  }
  
  // Return the updated tournament
  return {
    ...tournament,
    teams: updatedTeams,
    updatedAt: new Date()
  };
};
