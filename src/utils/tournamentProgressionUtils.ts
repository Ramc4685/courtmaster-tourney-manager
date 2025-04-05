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

// Export the function to create division placement matches
export const createDivisionPlacementMatches = (tournament: Tournament): Match[] => {
  // Get all teams that should participate in division placement
  const teamsForPlacement = [...tournament.teams];
  const newMatches: Match[] = [];
  
  // Get existing matches to avoid duplicating matches with the same teams
  const existingMatches = tournament.matches.filter(match => 
    match.status === "SCHEDULED" || match.status === "IN_PROGRESS"
  );
  
  // Create a set of team pairs that already have scheduled matches
  const existingPairs = new Set<string>();
  existingMatches.forEach(match => {
    if (match.team1 && match.team2) {
      // Store both directions to catch any ordering
      existingPairs.add(`${match.team1.id}-${match.team2.id}`);
      existingPairs.add(`${match.team2.id}-${match.team1.id}`);
    }
  });
  
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
    
    // Sort teams by seed if available
    const sortedTeams = [...teams].sort((a, b) => (a.seed || 999) - (b.seed || 999));
    
    // Create matches by pairing teams
    for (let i = 0; i < sortedTeams.length; i += 2) {
      const team1 = sortedTeams[i];
      const team2 = sortedTeams[i + 1];
      
      // If we have an odd number of teams, the last team might not have an opponent
      if (team1 && team2) {
        // Check if this pair already has a scheduled match
        if (existingPairs.has(`${team1.id}-${team2.id}`) || existingPairs.has(`${team2.id}-${team1.id}`)) {
          console.log(`Skipping match creation for ${team1.name} vs ${team2.name} as they already have a match`);
          continue;
        }
        
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

// Also update the function to create playoff knockout matches
export const createPlayoffKnockoutMatches = (tournament: Tournament): Match[] => {
  // Get existing matches to avoid duplicating matches with the same teams
  const existingMatches = tournament.matches.filter(match => 
    match.stage === "PLAYOFF_KNOCKOUT" && 
    (match.status === "SCHEDULED" || match.status === "IN_PROGRESS")
  );
  
  // Create a set of team pairs that already have scheduled matches
  const existingPairs = new Set<string>();
  existingMatches.forEach(match => {
    if (match.team1 && match.team2) {
      // Store both directions to catch any ordering
      existingPairs.add(`${match.team1.id}-${match.team2.id}`);
      existingPairs.add(`${match.team2.id}-${match.team1.id}`);
    }
  });
  
  // Group teams by category first
  const teamsByCategory: Record<string, Team[]> = {};
  
  for (const team of tournament.teams) {
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
    
    // Sort teams by seed or ranking
    const sortedTeams = [...categoryTeams].sort((a, b) => (a.seed || 999) - (b.seed || 999));
    
    // Divide teams into divisions for this category
    const teamsCount = sortedTeams.length;
    const teamsPerDiv = Math.ceil(teamsCount / 3);
    
    const div1Teams = sortedTeams.slice(0, teamsPerDiv);
    const div2Teams = sortedTeams.slice(teamsPerDiv, teamsPerDiv * 2);
    const div3Teams = sortedTeams.slice(teamsPerDiv * 2);
    
    // Helper function to create matches for a division
    const createDivisionMatches = (teams: Team[], division: Division) => {
      // For knockout formats, we should seed teams in a way that highest plays lowest
      const seedMatchups = [...teams];
      const matchups: [Team, Team][] = [];
      
      // Use proper tournament seeding (1 vs 16, 2 vs 15, etc.)
      const halfLength = Math.floor(seedMatchups.length / 2);
      for (let i = 0; i < halfLength; i++) {
        matchups.push([seedMatchups[i], seedMatchups[seedMatchups.length - 1 - i]]);
      }
      
      // Create matches for each matchup
      matchups.forEach(([team1, team2], index) => {
        // Skip if a match already exists
        if (existingPairs.has(`${team1.id}-${team2.id}`) || existingPairs.has(`${team2.id}-${team1.id}`)) {
          console.log(`Skipping match creation for ${team1.name} vs ${team2.name} as they already have a match`);
          return;
        }
        
        const knockoutMatch: Match = {
          id: generateId(),
          tournamentId: tournament.id,
          team1: team1,
          team2: team2,
          scores: [],
          division: division,
          stage: "PLAYOFF_KNOCKOUT" as TournamentStage,
          status: "SCHEDULED" as MatchStatus,
          courtNumber: undefined,
          category: category,
          bracketRound: 1, // First round in bracket
          bracketPosition: index + 1, // Position in bracket
          updatedAt: new Date()
        };
        
        newMatches.push(knockoutMatch);
      });
    };
    
    // Create matches for each division
    if (div1Teams.length >= 2) {
      createDivisionMatches(div1Teams, "DIVISION_1" as Division);
    }
    
    if (div2Teams.length >= 2) {
      createDivisionMatches(div2Teams, "DIVISION_2" as Division);
    }
    
    if (div3Teams.length >= 2) {
      createDivisionMatches(div3Teams, "DIVISION_3" as Division);
    }
  });
  
  return newMatches;
};
