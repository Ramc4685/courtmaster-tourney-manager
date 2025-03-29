import { Tournament, Team, Match, TournamentStage, MatchStatus, Division } from "@/types/tournament";
import { generateId } from "./tournamentUtils";

// Create initial round matches for tournament
export const createInitialRoundMatches = (tournament: Tournament): Match[] => {
  const teams = [...tournament.teams];
  const matches: Match[] = [];
  
  // Default to using the first category if no categories are assigned to teams
  const defaultCategory = tournament.categories[0];
  
  // Create matches for each consecutive pair of teams
  for (let i = 0; i < teams.length; i += 2) {
    if (i + 1 < teams.length) {
      const team1 = teams[i];
      const team2 = teams[i + 1];
      
      // Use team categories or default to tournament's first category
      const matchCategory = team1.category || team2.category || defaultCategory;
      
      // Schedule initial round match
      const match: Match = {
        id: generateId(),
        tournamentId: tournament.id,
        team1: team1,
        team2: team2,
        scores: [],
        division: "INITIAL" as Division,
        stage: "INITIAL_ROUND" as TournamentStage,
        scheduledTime: new Date(),
        status: "SCHEDULED" as MatchStatus,
        courtNumber: undefined,
        updatedAt: new Date(),
        category: matchCategory
      };
      
      matches.push(match);
    }
  }
  
  return matches;
};

// Assign seeding to teams based on rankings
export const assignPlayerSeeding = (teams: Team[]): Team[] => {
  return teams.map((team, index) => {
    return {
      ...team,
      seed: index + 1
    };
  });
};

// Create division placement matches
export const createDivisionPlacementMatches = (tournament: Tournament): Match[] => {
  const matches: Match[] = [];
  const completedMatches = tournament.matches.filter(
    match => match.stage === "INITIAL_ROUND" && match.status === "COMPLETED"
  );
  
  // Group winners and losers
  const winners: Team[] = [];
  const losers: Team[] = [];
  
  // Default to using the first category if no categories are assigned to teams
  const defaultCategory = tournament.categories[0];
  
  completedMatches.forEach(match => {
    if (match.winner) winners.push(match.winner);
    if (match.loser) losers.push(match.loser);
  });
  
  // Create Division 1 qualifier matches
  for (let i = 0; i < winners.length; i += 2) {
    if (i + 1 < winners.length) {
      const team1 = winners[i];
      const team2 = winners[i + 1];
      
      // Use team categories or default
      const matchCategory = team1.category || team2.category || defaultCategory;
      
      const match: Match = {
        id: generateId(),
        tournamentId: tournament.id,
        team1: team1,
        team2: team2,
        scores: [],
        division: "QUALIFIER_DIV1" as Division,
        stage: "DIVISION_PLACEMENT" as TournamentStage,
        status: "SCHEDULED" as MatchStatus,
        courtNumber: undefined,
        updatedAt: new Date(),
        category: matchCategory
      };
      
      matches.push(match);
    }
  }
  
  // Create Division 2 qualifier matches
  for (let i = 0; i < losers.length; i += 2) {
    if (i + 1 < losers.length) {
      const team1 = losers[i];
      const team2 = losers[i + 1];
      
      // Use team categories or default
      const matchCategory = team1.category || team2.category || defaultCategory;
      
      const match: Match = {
        id: generateId(),
        tournamentId: tournament.id,
        team1: team1,
        team2: team2,
        scores: [],
        division: "QUALIFIER_DIV2" as Division,
        stage: "DIVISION_PLACEMENT" as TournamentStage,
        status: "SCHEDULED" as MatchStatus,
        courtNumber: undefined,
        updatedAt: new Date(),
        category: matchCategory
      };
      
      matches.push(match);
    }
  }
  
  return matches;
};

// Create playoff knockout matches
export const createPlayoffKnockoutMatches = (tournament: Tournament): Match[] => {
  const matches: Match[] = [];
  const completedMatches = tournament.matches.filter(
    match => match.stage === "DIVISION_PLACEMENT" && match.status === "COMPLETED"
  );
  
  // Group division 1 qualifiers and division 2 qualifiers
  const div1Teams: Team[] = [];
  const div2Teams: Team[] = [];
  const div3Teams: Team[] = [];
  
  // Default to using the first category if no categories are assigned to teams
  const defaultCategory = tournament.categories[0];
  
  completedMatches.forEach(match => {
    if (match.division === "QUALIFIER_DIV1") {
      if (match.winner) div1Teams.push(match.winner);
      if (match.loser) div2Teams.push(match.loser);
    } else if (match.division === "QUALIFIER_DIV2") {
      if (match.winner) div2Teams.push(match.winner);
      if (match.loser) div3Teams.push(match.loser);
    }
  });
  
  // Create Division 1 playoff matches
  for (let i = 0; i < div1Teams.length; i += 2) {
    if (i + 1 < div1Teams.length) {
      const team1 = div1Teams[i];
      const team2 = div1Teams[i + 1];
      
      // Use team categories or default
      const matchCategory = team1.category || team2.category || defaultCategory;
      
      const match: Match = {
        id: generateId(),
        tournamentId: tournament.id,
        team1: team1,
        team2: team2,
        scores: [],
        division: "DIVISION_1" as Division,
        stage: "PLAYOFF_KNOCKOUT" as TournamentStage,
        status: "SCHEDULED" as MatchStatus,
        courtNumber: undefined,
        updatedAt: new Date(),
        category: matchCategory
      };
      
      matches.push(match);
    }
  }
  
  // Similar process for Division 2 & 3
  // ... add division 2 & 3 match creation logic
  
  return matches;
};

// Create a bracket for single elimination format
export const createSingleEliminationBracket = (tournament: Tournament): Match[] => {
  const teams = [...tournament.teams];
  const matches: Match[] = [];
  
  // Randomize or seed teams
  // teams.sort(() => Math.random() - 0.5);
  
  // Default to using the first category if no categories are assigned to teams
  const defaultCategory = tournament.categories[0];
  
  // Create first round matches
  for (let i = 0; i < teams.length; i += 2) {
    if (i + 1 < teams.length) {
      const team1 = teams[i];
      const team2 = teams[i + 1];
      
      // Use team categories or default to tournament's first category
      const matchCategory = team1.category || team2.category || defaultCategory;
      
      const match: Match = {
        id: generateId(),
        tournamentId: tournament.id,
        team1: team1,
        team2: team2,
        scores: [],
        division: "INITIAL" as Division,
        stage: "INITIAL_ROUND" as TournamentStage,
        scheduledTime: new Date(),
        status: "SCHEDULED" as MatchStatus,
        courtNumber: undefined,
        updatedAt: new Date(),
        category: matchCategory
      };
      
      matches.push(match);
    }
  }
  
  // Set up the bracket structure (future rounds)
  // ...
  
  return matches;
};
