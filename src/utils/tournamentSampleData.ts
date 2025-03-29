
import { Tournament, Team, Court, CourtStatus, TournamentFormat, TournamentStatus, TournamentStage, ScoringSettings, Match } from "@/types/tournament";
import { getDefaultScoringSettings } from "./matchUtils";
import { generateId } from "./tournamentUtils";

// Sample data generation helper for original multi-stage format
export const createSampleData = (): Tournament => {
  // Sample teams - 38 teams for the specific tournament format
  const teams: Team[] = Array.from({ length: 38 }, (_, i) => ({
    id: `team${i + 1}`,
    name: `Team ${i + 1}`,
    players: [
      { id: `p${i}a`, name: `Player ${i + 1}A` },
      { id: `p${i}b`, name: `Player ${i + 1}B` }
    ],
    initialRanking: i + 1
  }));

  // Sample courts - 5 courts as specified
  const courts: Court[] = Array.from({ length: 5 }, (_, i) => ({
    id: `court${i + 1}`,
    name: `Court ${i + 1}`,
    number: i + 1,
    status: "AVAILABLE" as CourtStatus
  }));

  // Create sample tournament with badminton scoring settings
  return {
    id: "sampleTournament",
    name: "38-Team Multi-Stage Tournament",
    description: "Multi-stage tournament with 38 teams progressing through divisions",
    format: "MULTI_STAGE" as TournamentFormat,
    status: "PUBLISHED" as TournamentStatus,
    currentStage: "INITIAL_ROUND" as TournamentStage,
    teams,
    matches: [],
    courts,
    startDate: new Date(),
    endDate: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    createdAt: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    updatedAt: new Date(),
    divisionProgression: true,
    autoAssignCourts: true,
    scoringSettings: getDefaultScoringSettings() // Add default badminton scoring settings
  };
};

// Create sample single elimination tournament
export const createSingleEliminationSample = (): Tournament => {
  // For single elimination, 16 teams is a good number (makes a clean bracket)
  const teams: Team[] = Array.from({ length: 16 }, (_, i) => ({
    id: `team${i + 1}`,
    name: `Team ${i + 1}`,
    players: [
      { id: `p${i}a`, name: `Player ${i + 1}A` },
      { id: `p${i}b`, name: `Player ${i + 1}B` }
    ],
    seed: i + 1, // Set seed based on position
    initialRanking: i + 1
  }));

  const courts: Court[] = Array.from({ length: 4 }, (_, i) => ({
    id: `court${i + 1}`,
    name: `Court ${i + 1}`,
    number: i + 1,
    status: "AVAILABLE" as CourtStatus
  }));

  // Create matches for the first round (8 matches)
  const matches: Match[] = [];
  
  // First round - 8 matches
  for (let i = 0; i < 8; i++) {
    // Pair teams according to standard seeding (1 vs 16, 2 vs 15, etc.)
    const seedPairs = [
      [0, 15], [7, 8], [3, 12], [4, 11], [5, 10], [6, 9], [2, 13], [1, 14]
    ];
    
    matches.push({
      id: `match-r1-${i+1}`,
      tournamentId: "singleElimination",
      team1: teams[seedPairs[i][0]],
      team2: teams[seedPairs[i][1]],
      scores: [],
      division: "INITIAL",
      stage: "ELIMINATION_ROUND",
      status: "SCHEDULED",
      bracketRound: 1,
      bracketPosition: i + 1,
      updatedAt: new Date()
    });
  }

  return {
    id: "singleElimination",
    name: "16-Team Single Elimination Tournament",
    description: "Single elimination tournament with 16 teams",
    format: "SINGLE_ELIMINATION",
    status: "PUBLISHED" as TournamentStatus,
    currentStage: "ELIMINATION_ROUND" as TournamentStage,
    teams,
    matches,
    courts,
    startDate: new Date(),
    endDate: new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
    autoAssignCourts: true,
    formatConfig: {
      consolationRounds: true
    },
    scoringSettings: getDefaultScoringSettings()
  };
};

// Create sample double elimination tournament
export const createDoubleEliminationSample = (): Tournament => {
  // For double elimination, 8 teams makes a manageable bracket
  const teams: Team[] = Array.from({ length: 8 }, (_, i) => ({
    id: `team${i + 1}`,
    name: `Team ${i + 1}`,
    players: [
      { id: `p${i}a`, name: `Player ${i + 1}A` },
      { id: `p${i}b`, name: `Player ${i + 1}B` }
    ],
    seed: i + 1,
    initialRanking: i + 1
  }));

  const courts: Court[] = Array.from({ length: 3 }, (_, i) => ({
    id: `court${i + 1}`,
    name: `Court ${i + 1}`,
    number: i + 1,
    status: "AVAILABLE" as CourtStatus
  }));

  // Create matches for the first round (4 matches)
  const matches: Match[] = [];
  
  // First round in winners bracket - 4 matches
  for (let i = 0; i < 4; i++) {
    // Pair teams according to standard seeding (1 vs 8, 4 vs 5, etc.)
    const seedPairs = [
      [0, 7], [3, 4], [2, 5], [1, 6]
    ];
    
    matches.push({
      id: `match-w-r1-${i+1}`,
      tournamentId: "doubleElimination",
      team1: teams[seedPairs[i][0]],
      team2: teams[seedPairs[i][1]],
      scores: [],
      division: "INITIAL",
      stage: "ELIMINATION_ROUND",
      status: "SCHEDULED",
      bracketRound: 1,
      bracketPosition: i + 1,
      groupName: "Winners Bracket",
      updatedAt: new Date()
    });
  }

  return {
    id: "doubleElimination",
    name: "8-Team Double Elimination Tournament",
    description: "Double elimination tournament with 8 teams",
    format: "DOUBLE_ELIMINATION",
    status: "PUBLISHED" as TournamentStatus,
    currentStage: "ELIMINATION_ROUND" as TournamentStage,
    teams,
    matches,
    courts,
    startDate: new Date(),
    endDate: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
    autoAssignCourts: true,
    scoringSettings: getDefaultScoringSettings()
  };
};

// Create sample round robin tournament
export const createRoundRobinSample = (): Tournament => {
  // 6 teams for round robin makes 15 total matches (each team plays 5 matches)
  const teams: Team[] = Array.from({ length: 6 }, (_, i) => ({
    id: `team${i + 1}`,
    name: `Team ${i + 1}`,
    players: [
      { id: `p${i}a`, name: `Player ${i + 1}A` },
      { id: `p${i}b`, name: `Player ${i + 1}B` }
    ],
    initialRanking: i + 1
  }));

  const courts: Court[] = Array.from({ length: 3 }, (_, i) => ({
    id: `court${i + 1}`,
    name: `Court ${i + 1}`,
    number: i + 1,
    status: "AVAILABLE" as CourtStatus
  }));

  // Generate all possible pair combinations for round robin
  const matches: Match[] = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({
        id: `match-${i+1}-vs-${j+1}`,
        tournamentId: "roundRobin",
        team1: teams[i],
        team2: teams[j],
        scores: [],
        division: "INITIAL",
        stage: "INITIAL_ROUND",
        status: "SCHEDULED",
        updatedAt: new Date()
      });
    }
  }

  return {
    id: "roundRobin",
    name: "6-Team Round Robin Tournament",
    description: "Round robin tournament where each team plays against all others",
    format: "ROUND_ROBIN",
    status: "PUBLISHED" as TournamentStatus,
    currentStage: "INITIAL_ROUND" as TournamentStage,
    teams,
    matches,
    courts,
    startDate: new Date(),
    endDate: new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
    autoAssignCourts: true,
    scoringSettings: getDefaultScoringSettings()
  };
};

// Create sample Swiss format tournament
export const createSwissSample = (): Tournament => {
  // 8 teams for Swiss system, will play 3 rounds
  const teams: Team[] = Array.from({ length: 8 }, (_, i) => ({
    id: `team${i + 1}`,
    name: `Team ${i + 1}`,
    players: [
      { id: `p${i}a`, name: `Player ${i + 1}A` },
      { id: `p${i}b`, name: `Player ${i + 1}B` }
    ],
    initialRanking: i + 1
  }));

  const courts: Court[] = Array.from({ length: 2 }, (_, i) => ({
    id: `court${i + 1}`,
    name: `Court ${i + 1}`,
    number: i + 1,
    status: "AVAILABLE" as CourtStatus
  }));

  // Create first round matches only (subsequent rounds depend on results)
  const matches: Match[] = [];
  
  // First round - random pairings
  for (let i = 0; i < 4; i++) {
    matches.push({
      id: `match-r1-${i+1}`,
      tournamentId: "swiss",
      team1: teams[i * 2],
      team2: teams[i * 2 + 1],
      scores: [],
      division: "INITIAL",
      stage: "INITIAL_ROUND",
      status: "SCHEDULED",
      bracketRound: 1,
      bracketPosition: i + 1,
      updatedAt: new Date()
    });
  }

  return {
    id: "swiss",
    name: "8-Team Swiss Tournament",
    description: "Swiss format tournament with 8 teams playing 3 rounds",
    format: "SWISS",
    status: "PUBLISHED" as TournamentStatus,
    currentStage: "INITIAL_ROUND" as TournamentStage,
    teams,
    matches,
    courts,
    startDate: new Date(),
    endDate: new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
    autoAssignCourts: true,
    formatConfig: {
      swissRounds: 3
    },
    scoringSettings: getDefaultScoringSettings()
  };
};

// Create sample Group Stage + Knockout tournament
export const createGroupKnockoutSample = (): Tournament => {
  // 12 teams divided into 3 groups of 4, top 2 from each group advance to knockout
  const teams: Team[] = Array.from({ length: 12 }, (_, i) => ({
    id: `team${i + 1}`,
    name: `Team ${i + 1}`,
    players: [
      { id: `p${i}a`, name: `Player ${i + 1}A` },
      { id: `p${i}b`, name: `Player ${i + 1}B` }
    ],
    seed: i + 1,
    initialRanking: i + 1
  }));

  const courts: Court[] = Array.from({ length: 3 }, (_, i) => ({
    id: `court${i + 1}`,
    name: `Court ${i + 1}`,
    number: i + 1,
    status: "AVAILABLE" as CourtStatus
  }));

  // Create group stage matches
  const matches: Match[] = [];
  
  // Group A matches (teams 0-3)
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      matches.push({
        id: `match-groupA-${i+1}-vs-${j+1}`,
        tournamentId: "groupKnockout",
        team1: teams[i],
        team2: teams[j],
        scores: [],
        division: "INITIAL",
        stage: "GROUP_STAGE",
        status: "SCHEDULED",
        groupName: "Group A",
        updatedAt: new Date()
      });
    }
  }
  
  // Group B matches (teams 4-7)
  for (let i = 4; i < 8; i++) {
    for (let j = i + 1; j < 8; j++) {
      matches.push({
        id: `match-groupB-${i+1}-vs-${j+1}`,
        tournamentId: "groupKnockout",
        team1: teams[i],
        team2: teams[j],
        scores: [],
        division: "INITIAL",
        stage: "GROUP_STAGE",
        status: "SCHEDULED",
        groupName: "Group B",
        updatedAt: new Date()
      });
    }
  }
  
  // Group C matches (teams 8-11)
  for (let i = 8; i < 12; i++) {
    for (let j = i + 1; j < 12; j++) {
      matches.push({
        id: `match-groupC-${i+1}-vs-${j+1}`,
        tournamentId: "groupKnockout",
        team1: teams[i],
        team2: teams[j],
        scores: [],
        division: "INITIAL",
        stage: "GROUP_STAGE",
        status: "SCHEDULED",
        groupName: "Group C",
        updatedAt: new Date()
      });
    }
  }

  return {
    id: "groupKnockout",
    name: "12-Team Group + Knockout Tournament",
    description: "Group stage followed by knockout rounds",
    format: "GROUP_KNOCKOUT",
    status: "PUBLISHED" as TournamentStatus,
    currentStage: "GROUP_STAGE" as TournamentStage,
    teams,
    matches,
    courts,
    startDate: new Date(),
    endDate: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
    autoAssignCourts: true,
    formatConfig: {
      groupCount: 3,
      teamsPerGroup: 4,
      advancingTeamsPerGroup: 2
    },
    scoringSettings: getDefaultScoringSettings()
  };
};

// Export a function to get sample data based on format
export const getSampleDataByFormat = (format: TournamentFormat): Tournament => {
  switch (format) {
    case "SINGLE_ELIMINATION":
      return createSingleEliminationSample();
    case "DOUBLE_ELIMINATION":
      return createDoubleEliminationSample();
    case "ROUND_ROBIN":
      return createRoundRobinSample();
    case "SWISS":
      return createSwissSample();
    case "GROUP_KNOCKOUT":
      return createGroupKnockoutSample();
    case "MULTI_STAGE":
    default:
      return createSampleData();
  }
};
