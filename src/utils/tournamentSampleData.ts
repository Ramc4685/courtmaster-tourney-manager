import { Tournament, TournamentFormat } from "@/types/tournament";
import { generateId } from "./tournamentUtils";
import { createDefaultCategories, generateCategoryTeams } from "./categoryUtils";

// Create a sample tournament with 38 teams
export const createSampleData = (): Tournament => {
  const categories = createDefaultCategories();
  
  // Create teams for each category
  const teamsMS = generateCategoryTeams(categories.find(c => c.type === "MENS_SINGLES")!, 8);
  const teamsWS = generateCategoryTeams(categories.find(c => c.type === "WOMENS_SINGLES")!, 8);
  const teamsMD = generateCategoryTeams(categories.find(c => c.type === "MENS_DOUBLES")!, 4);
  const teamsWD = generateCategoryTeams(categories.find(c => c.type === "WOMENS_DOUBLES")!, 4);
  const teamsMX = generateCategoryTeams(categories.find(c => c.type === "MIXED_DOUBLES")!, 8);
  
  // Combine all teams
  const teams = [...teamsMS, ...teamsWS, ...teamsMD, ...teamsWD, ...teamsMX];
  
  // Create tournament
  return {
    id: generateId(),
    name: "Sample Badminton Tournament",
    description: "This is a sample tournament with multiple categories",
    format: "MULTI_STAGE",
    status: "DRAFT",
    currentStage: "INITIAL_ROUND",
    teams,
    matches: [],
    courts: Array.from({ length: 4 }, (_, i) => ({
      id: `court-${i + 1}`,
      name: `Court ${i + 1}`,
      number: i + 1,
      status: "AVAILABLE",
    })),
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    createdAt: new Date(),
    updatedAt: new Date(),
    divisionProgression: true,
    autoAssignCourts: true,
    categories,
    scoringSettings: {
      maxPoints: 21,
      maxSets: 3,
      requireTwoPointLead: true,
      maxTwoPointLeadScore: 30,
    },
  };
};

// Get sample data for a specific tournament format
export const getSampleDataByFormat = (format: TournamentFormat): Tournament => {
  const categories = createDefaultCategories();
  
  // Create teams for different categories based on format
  let categoryTeams = [];
  
  switch (format) {
    case "SINGLE_ELIMINATION":
    case "DOUBLE_ELIMINATION":
      // For elimination formats, create 8 teams per category
      categoryTeams = categories.map(category => 
        generateCategoryTeams(category, 8)
      ).flat();
      break;
      
    case "ROUND_ROBIN":
      // For round robin, fewer teams per category (4-6)
      categoryTeams = categories.map(category => 
        generateCategoryTeams(category, 4)
      ).flat();
      break;
      
    case "SWISS":
      // For Swiss, more teams
      categoryTeams = categories.map(category => 
        generateCategoryTeams(category, 8)
      ).flat();
      break;
      
    case "GROUP_KNOCKOUT":
      // For group stage, 12 teams (4 per group, 3 groups)
      categoryTeams = categories.map(category => 
        generateCategoryTeams(category, 12)
      ).flat();
      break;
      
    case "MULTI_STAGE":
    default:
      // Keep a subset of categories for the multi-stage 38-team format
      const multiStageCategories = categories.filter(c => 
        c.type === "MENS_SINGLES" || c.type === "WOMENS_SINGLES"
      );
      
      // Create 19 teams for each selected category
      categoryTeams = multiStageCategories.map(category => 
        generateCategoryTeams(category, 19)
      ).flat();
      break;
  }
  
  // Create tournament with appropriate teams, categories, and format
  return {
    id: generateId(),
    name: `Sample ${format.replace(/_/g, " ")} Tournament`,
    description: `This is a sample tournament using the ${format.replace(/_/g, " ")} format with multiple categories`,
    format,
    status: "DRAFT",
    currentStage: "INITIAL_ROUND",
    teams: categoryTeams,
    matches: [],
    courts: Array.from({ length: 4 }, (_, i) => ({
      id: `court-${i + 1}`,
      name: `Court ${i + 1}`,
      number: i + 1,
      status: "AVAILABLE",
    })),
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    createdAt: new Date(),
    updatedAt: new Date(),
    divisionProgression: format === "MULTI_STAGE",
    autoAssignCourts: true,
    categories,
    scoringSettings: {
      maxPoints: 21,
      maxSets: 3,
      requireTwoPointLead: true,
      maxTwoPointLeadScore: 30,
    },
    formatConfig: getFormatConfig(format),
  };
};

// Helper function to get format-specific configuration
function getFormatConfig(format: TournamentFormat) {
  switch (format) {
    case "GROUP_KNOCKOUT":
      return {
        groupCount: 3,
        teamsPerGroup: 4,
        advancingTeamsPerGroup: 2,
      };
    case "SWISS":
      return {
        swissRounds: 4,
      };
    case "SINGLE_ELIMINATION":
      return {
        consolationRounds: true,
      };
    default:
      return {};
  }
}

// Create a sample tournament with 38 teams for the multi-stage format
export const createSample38TeamTournament = (): Tournament => {
  const sampleTournament = createSampleData();
  
  // Generate 38 teams with names and players
  const teams = Array.from({ length: 38 }, (_, i) => {
    const teamNumber = i + 1;
    return {
      id: `team-${teamNumber}`,
      name: `Team ${teamNumber}`,
      players: [
        {
          id: `player-${teamNumber}-1`,
          name: `Player ${teamNumber}-1`,
        },
        {
          id: `player-${teamNumber}-2`,
          name: `Player ${teamNumber}-2`,
        },
      ],
      initialRanking: teamNumber, // Set initial ranking based on team number
    };
  });
  
  return {
    ...sampleTournament,
    teams,
  };
};

// Create a sample tournament with 16 teams for single elimination
export const createSample16TeamTournament = (): Tournament => {
  const sampleTournament = createSampleData();
  
  // Generate 16 teams with names and players
  const teams = Array.from({ length: 16 }, (_, i) => {
    const teamNumber = i + 1;
    return {
      id: `team-${teamNumber}`,
      name: `Team ${teamNumber}`,
      players: [
        {
          id: `player-${teamNumber}-1`,
          name: `Player ${teamNumber}-1`,
        },
        {
          id: `player-${teamNumber}-2`,
          name: `Player ${teamNumber}-2`,
        },
      ],
      seed: teamNumber, // Set seed based on team number
    };
  });
  
  return {
    ...sampleTournament,
    teams,
    format: "SINGLE_ELIMINATION",
  };
};

// Create a sample tournament with 8 teams for round robin
export const createSample8TeamTournament = (): Tournament => {
  const sampleTournament = createSampleData();
  
  // Generate 8 teams with names and players
  const teams = Array.from({ length: 8 }, (_, i) => {
    const teamNumber = i + 1;
    return {
      id: `team-${teamNumber}`,
      name: `Team ${teamNumber}`,
      players: [
        {
          id: `player-${teamNumber}-1`,
          name: `Player ${teamNumber}-1`,
        },
        {
          id: `player-${teamNumber}-2`,
          name: `Player ${teamNumber}-2`,
        },
      ],
    };
  });
  
  return {
    ...sampleTournament,
    teams,
    format: "ROUND_ROBIN",
  };
};
