
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

// Function to create division placement matches
export const createDivisionPlacementMatches = (tournament: Tournament): Match[] => {
  // Get all teams that should participate in division placement
  const teamsForPlacement = [...tournament.teams];
  const newMatches: Match[] = [];
  
  // Sort teams by their performance in initial rounds if applicable
  // For simplicity, we'll use their seed or just do a basic pairing
  
  // Group teams by category
  const teamsByCategory: Record<string, Team[]> = {};
  
  for (const team of teamsForPlacement) {
    const categoryId = team.category?.id || 'uncategorized';
    if (!teamsByCategory[categoryId]) {
      teamsByCategory[categoryId] = [];
    }
    teamsByCategory[categoryId].push(team);
  }
  
  // Create matches for each category
  Object.entries(teamsByCategory).forEach(([categoryId, teams]) => {
    // Find the corresponding category object
    const category = tournament.categories.find(c => c.id === categoryId) || tournament.categories[0];
    
    // Create matches by pairing teams
    for (let i = 0; i < teams.length; i += 2) {
      const team1 = teams[i];
      const team2 = teams[i + 1];
      
      // If we have an odd number of teams, the last team might not have an opponent
      if (team1 && team2) {
        const divisionMatch: Match = {
          id: generateId(),
          tournamentId: tournament.id,
          team1: team1,
          team2: team2,
          scores: [],
          division: "INITIAL" as Division,
          stage: "DIVISION_PLACEMENT" as TournamentStage,
          status: "SCHEDULED" as MatchStatus,
          courtNumber: undefined,
          category: category,
          updatedAt: new Date()
        };
        
        newMatches.push(divisionMatch);
      }
    }
  });
  
  return newMatches;
};

// Function to create playoff knockout matches
export const createPlayoffKnockoutMatches = (tournament: Tournament): Match[] => {
  // Get teams for each division based on their performance in division placement
  // This is a simplified approach; in reality, you would determine division placement
  // based on match results
  
  const division1Teams: Team[] = [];
  const division2Teams: Team[] = [];
  const division3Teams: Team[] = [];
  
  // In a real implementation, you would sort teams by their performance
  // For simplicity, we'll just use the first 1/3 for division 1, etc.
  const sortedTeams = [...tournament.teams].sort((a, b) => (a.seed || 999) - (b.seed || 999));
  
  const teamsPerDivision = Math.ceil(sortedTeams.length / 3);
  
  // Group teams by category first
  const teamsByCategory: Record<string, Team[]> = {};
  
  for (const team of sortedTeams) {
    const categoryId = team.category?.id || 'uncategorized';
    if (!teamsByCategory[categoryId]) {
      teamsByCategory[categoryId] = [];
    }
    teamsByCategory[categoryId].push(team);
  }
  
  const newMatches: Match[] = [];
  
  // Create playoff matches for each category
  Object.entries(teamsByCategory).forEach(([categoryId, categoryTeams]) => {
    // Find the corresponding category object
    const category = tournament.categories.find(c => c.id === categoryId) || tournament.categories[0];
    
    // Divide teams into divisions for this category
    const teamsCount = categoryTeams.length;
    const teamsPerDiv = Math.ceil(teamsCount / 3);
    
    const div1Teams = categoryTeams.slice(0, teamsPerDiv);
    const div2Teams = categoryTeams.slice(teamsPerDiv, teamsPerDiv * 2);
    const div3Teams = categoryTeams.slice(teamsPerDiv * 2);
    
    // Create knockout matches for Division 1
    for (let i = 0; i < div1Teams.length; i += 2) {
      const team1 = div1Teams[i];
      const team2 = div1Teams[i + 1];
      
      if (team1 && team2) {
        const knockoutMatch: Match = {
          id: generateId(),
          tournamentId: tournament.id,
          team1: team1,
          team2: team2,
          scores: [],
          division: "DIVISION_1" as Division,
          stage: "PLAYOFF_KNOCKOUT" as TournamentStage,
          status: "SCHEDULED" as MatchStatus,
          courtNumber: undefined,
          category: category,
          updatedAt: new Date()
        };
        
        newMatches.push(knockoutMatch);
      }
    }
    
    // Create knockout matches for Division 2
    for (let i = 0; i < div2Teams.length; i += 2) {
      const team1 = div2Teams[i];
      const team2 = div2Teams[i + 1];
      
      if (team1 && team2) {
        const knockoutMatch: Match = {
          id: generateId(),
          tournamentId: tournament.id,
          team1: team1,
          team2: team2,
          scores: [],
          division: "DIVISION_2" as Division,
          stage: "PLAYOFF_KNOCKOUT" as TournamentStage,
          status: "SCHEDULED" as MatchStatus,
          courtNumber: undefined,
          category: category,
          updatedAt: new Date()
        };
        
        newMatches.push(knockoutMatch);
      }
    }
    
    // Create knockout matches for Division 3
    for (let i = 0; i < div3Teams.length; i += 2) {
      const team1 = div3Teams[i];
      const team2 = div3Teams[i + 1];
      
      if (team1 && team2) {
        const knockoutMatch: Match = {
          id: generateId(),
          tournamentId: tournament.id,
          team1: team1,
          team2: team2,
          scores: [],
          division: "DIVISION_3" as Division,
          stage: "PLAYOFF_KNOCKOUT" as TournamentStage,
          status: "SCHEDULED" as MatchStatus,
          courtNumber: undefined,
          category: category,
          updatedAt: new Date()
        };
        
        newMatches.push(knockoutMatch);
      }
    }
  });
  
  return newMatches;
};
