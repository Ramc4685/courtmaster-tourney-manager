import { Tournament, Team, Match, Division, TournamentStage, MatchStatus } from "@/types/tournament";
import { generateId } from "./tournamentUtils";
import { createMatch } from "./matchUtils";

// Function to create initial round matches for a 38-team tournament
export const createInitialRoundMatches = (tournament: Tournament): Match[] => {
  // Ensure the tournament has exactly 38 teams
  if (tournament.teams.length !== 38) {
    console.warn("This tournament format requires exactly 38 teams");
    return [];
  }

  // Get the default category (first category if exists)
  const defaultCategory = tournament.categories[0];
  if (!defaultCategory) {
    console.error("Tournament must have at least one category");
    return [];
  }

  // Helper function to create a match
  const createMatchPair = (team1: Team, team2: Team, scheduledTime?: Date): Match => {
    // Use team category if available, otherwise use default
    const category = team1.category || team2.category || defaultCategory;
    
    return {
      id: generateId(),
      tournamentId: tournament.id,
      team1: team1,
      team2: team2,
      scores: [],
      division: "INITIAL",
      stage: "INITIAL_ROUND",
      scheduledTime: scheduledTime,
      status: "SCHEDULED" as MatchStatus,
      courtNumber: undefined,
      updatedAt: new Date(),
      category: category // Add the required category field
    };
  };

  // Array to hold the generated matches
  const matches: Match[] = [];

  // Initial round matches (6 teams get a bye)
  matches.push(createMatchPair(tournament.teams[6], tournament.teams[31]));
  matches.push(createMatchPair(tournament.teams[7], tournament.teams[30]));
  matches.push(createMatchPair(tournament.teams[8], tournament.teams[33]));
  matches.push(createMatchPair(tournament.teams[9], tournament.teams[32]));
  matches.push(createMatchPair(tournament.teams[10], tournament.teams[35]));
  matches.push(createMatchPair(tournament.teams[11], tournament.teams[34]));

  // Remaining teams in the initial round
  matches.push(createMatchPair(tournament.teams[12], tournament.teams[27]));
  matches.push(createMatchPair(tournament.teams[13], tournament.teams[26]));
  matches.push(createMatchPair(tournament.teams[14], tournament.teams[29]));
  matches.push(createMatchPair(tournament.teams[15], tournament.teams[28]));
  matches.push(createMatchPair(tournament.teams[16], tournament.teams[25]));
  matches.push(createMatchPair(tournament.teams[17], tournament.teams[24]));
  matches.push(createMatchPair(tournament.teams[18], tournament.teams[21]));
  matches.push(createMatchPair(tournament.teams[19], tournament.teams[20]));
  matches.push(createMatchPair(tournament.teams[22], tournament.teams[23]));

  return matches;
};

// Function to advance to division placement stage
export const advanceToDivisionPlacement = (tournament: Tournament): Tournament => {
  // Ensure all matches in the initial round are completed
  const initialRoundCompleted = tournament.matches.every(match => match.stage === "INITIAL_ROUND" && match.status === "COMPLETED");
  if (!initialRoundCompleted) {
    console.warn("Cannot advance: Not all matches in the initial round are completed.");
    return tournament;
  }

  // Define the divisions
  const division1Teams = tournament.teams.slice(0, 10);
  const division2Teams = tournament.teams.slice(10, 20);
  const division3Teams = tournament.teams.slice(20);

  // Create matches for division placement
  const division1Matches = createDivisionMatches(tournament, division1Teams, "DIVISION_1");
  const division2Matches = createDivisionMatches(tournament, division2Teams, "DIVISION_2");
  const division3Matches = createDivisionMatches(tournament, division3Teams, "DIVISION_3");

  // Combine all matches
  const allMatches = [...tournament.matches, ...division1Matches, ...division2Matches, ...division3Matches];

  return {
    ...tournament,
    matches: allMatches,
    currentStage: "DIVISION_PLACEMENT",
    updatedAt: new Date()
  };
};

// Function to create matches for a division
const createDivisionMatches = (tournament: Tournament, teams: Team[], division: Division): Match[] => {
  const matches: Match[] = [];
  
  // Get the default category (first category if exists)
  const defaultCategory = tournament.categories[0];
  if (!defaultCategory) {
    console.error("Tournament must have at least one category");
    return [];
  }
  
  for (let i = 0; i < teams.length; i += 2) {
    if (i + 1 < teams.length) {
      // Use team category if available, otherwise use default
      const category = teams[i].category || teams[i + 1].category || defaultCategory;
      
      matches.push({
        id: generateId(),
        tournamentId: tournament.id,
        team1: teams[i],
        team2: teams[i + 1],
        scores: [],
        division: division,
        stage: "DIVISION_PLACEMENT",
        status: "SCHEDULED" as MatchStatus,
        courtNumber: undefined,
        updatedAt: new Date(),
        category: category // Add the required category field
      });
    }
  }
  return matches;
};

// Function to advance to playoff knockout stage
export const advanceToPlayoffKnockout = (tournament: Tournament): Tournament => {
  // Ensure all matches in the division placement are completed
  const divisionPlacementCompleted = tournament.matches.every(match => match.stage === "DIVISION_PLACEMENT" && match.status === "COMPLETED");
  if (!divisionPlacementCompleted) {
    console.warn("Cannot advance: Not all matches in the division placement are completed.");
    return tournament;
  }

  // Placeholder logic to determine which teams advance to the playoff knockout stage
  const playoffTeams = tournament.teams.slice(0, 8); // Top 8 teams advance

  // Create matches for the playoff knockout stage
  const playoffMatches = createPlayoffMatches(tournament, playoffTeams);

  return {
    ...tournament,
    matches: [...tournament.matches, ...playoffMatches],
    currentStage: "PLAYOFF_KNOCKOUT",
    updatedAt: new Date()
  };
};

// Function to create matches for the playoff knockout stage
const createPlayoffMatches = (tournament: Tournament, teams: Team[]): Match[] => {
  const matches: Match[] = [];
  
  // Get the default category (first category if exists)
  const defaultCategory = tournament.categories[0];
  if (!defaultCategory) {
    console.error("Tournament must have at least one category");
    return [];
  }
  
  for (let i = 0; i < teams.length; i += 2) {
    if (i + 1 < teams.length) {
      // Use team category if available, otherwise use default
      const category = teams[i].category || teams[i + 1].category || defaultCategory;
      
      matches.push({
        id: generateId(),
        tournamentId: tournament.id,
        team1: teams[i],
        team2: teams[i + 1],
        scores: [],
        division: "DIVISION_1", // Assuming playoffs are only for division 1
        stage: "PLAYOFF_KNOCKOUT",
        status: "SCHEDULED" as MatchStatus,
        courtNumber: undefined,
        updatedAt: new Date(),
        category: category // Add the required category field
      });
    }
  }
  return matches;
};

// Add this function to allow properly seeding players from 1-38
export const assignPlayerSeeding = (tournament: Tournament): Tournament => {
  // Sort teams by their initial ranking (1-38)
  const sortedTeams = [...tournament.teams].sort((a, b) => 
    (a.initialRanking || 999) - (b.initialRanking || 999)
  );
  
  // Assign sequential seed numbers (1-38) based on their sorted position
  const seededTeams = sortedTeams.map((team, index) => ({
    ...team,
    seed: index + 1 // Assign seed 1-38 based on position
  }));
  
  // Create a map for quick lookups
  const teamMap = new Map(seededTeams.map(team => [team.id, team]));
  
  // Replace the teams in the tournament with the seeded ones
  const updatedTeams = tournament.teams.map(team => 
    teamMap.get(team.id) || team
  );
  
  console.log(`[DEBUG] Assigned seeding to ${seededTeams.length} teams based on initial ranking`);
  
  return {
    ...tournament,
    teams: updatedTeams,
    updatedAt: new Date()
  };
};

// Update the createInitialRoundMatches function to use the seeding
export const createInitialRoundMatches2 = (tournament: Tournament): Match[] => {
  // First, make sure all teams are properly seeded
  const seededTournament = assignPlayerSeeding(tournament);
  const teams = seededTournament.teams;
  
  // Ensure the tournament has exactly 38 teams
  if (teams.length !== 38) {
    console.warn("This tournament format requires exactly 38 teams");
    return [];
  }

  // Get the default category (first category if exists)
  const defaultCategory = tournament.categories[0];
  if (!defaultCategory) {
    console.error("Tournament must have at least one category");
    return [];
  }

  // Helper function to create a match
  const createMatchPair = (team1: Team, team2: Team, scheduledTime?: Date): Match => {
    // Use team category if available, otherwise use default
    const category = team1.category || team2.category || defaultCategory;
    
    return {
      id: generateId(),
      tournamentId: tournament.id,
      team1: team1,
      team2: team2,
      scores: [],
      division: "INITIAL",
      stage: "INITIAL_ROUND",
      scheduledTime: scheduledTime,
      status: "SCHEDULED" as MatchStatus,
      courtNumber: undefined,
      updatedAt: new Date(),
      category: category // Add the required category field
    };
  };

  // Array to hold the generated matches
  const matches: Match[] = [];

  // Initial round matches (6 teams get a bye)
  matches.push(createMatchPair(teams[6], teams[31]));
  matches.push(createMatchPair(teams[7], teams[30]));
  matches.push(createMatchPair(teams[8], teams[33]));
  matches.push(createMatchPair(teams[9], teams[32]));
  matches.push(createMatchPair(teams[10], teams[35]));
  matches.push(createMatchPair(teams[11], teams[34]));

  // Remaining teams in the initial round
  matches.push(createMatchPair(teams[12], teams[27]));
  matches.push(createMatchPair(teams[13], teams[26]));
  matches.push(createMatchPair(teams[14], teams[29]));
  matches.push(createMatchPair(teams[15], teams[28]));
  matches.push(createMatchPair(teams[16], teams[25]));
  matches.push(createMatchPair(teams[17], teams[24]));
  matches.push(createMatchPair(teams[18], teams[21]));
  matches.push(createMatchPair(teams[19], teams[20]));
  matches.push(createMatchPair(teams[22], teams[23]));

  // Return the matches created based on seeding
  console.log(`[DEBUG] Created initial round matches based on seeding 1-38`);
  return matches;
};

// Export these functions to match the imports in stageProgression.ts
export const createDivisionPlacementMatches = (tournament: Tournament): Match[] => {
  // Define the divisions
  const division1Teams = tournament.teams.slice(0, 10);
  const division2Teams = tournament.teams.slice(10, 20);
  const division3Teams = tournament.teams.slice(20);

  // Create matches for division placement
  const division1Matches = createDivisionMatches(tournament, division1Teams, "DIVISION_1");
  const division2Matches = createDivisionMatches(tournament, division2Teams, "DIVISION_2");
  const division3Matches = createDivisionMatches(tournament, division3Teams, "DIVISION_3");
  
  return [...division1Matches, ...division2Matches, ...division3Matches];
};

export const createPlayoffKnockoutMatches = (tournament: Tournament): Match[] => {
  // Get top teams for playoff
  const playoffTeams = tournament.teams.slice(0, 8); // Top 8 teams advance
  
  // Create matches for the playoff knockout stage
  return createPlayoffMatches(tournament, playoffTeams);
};
