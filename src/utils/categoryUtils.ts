
import { TournamentCategory, CategoryType, TournamentFormat } from '@/types/tournament';

// Creates default categories with formats for a new tournament
export const createDefaultCategories = (): TournamentCategory[] => {
  return [
    {
      id: crypto.randomUUID(),
      name: "Men's Singles",
      type: "MENS_SINGLES" as CategoryType,
      format: "SINGLE_ELIMINATION" as TournamentFormat,
      addDemoData: false
    },
    {
      id: crypto.randomUUID(),
      name: "Women's Singles",
      type: "WOMENS_SINGLES" as CategoryType,
      format: "SINGLE_ELIMINATION" as TournamentFormat,
      addDemoData: false
    },
    {
      id: crypto.randomUUID(),
      name: "Men's Doubles",
      type: "MENS_DOUBLES" as CategoryType,
      format: "SINGLE_ELIMINATION" as TournamentFormat,
      addDemoData: false
    },
    {
      id: crypto.randomUUID(),
      name: "Women's Doubles",
      type: "WOMENS_DOUBLES" as CategoryType,
      format: "SINGLE_ELIMINATION" as TournamentFormat,
      addDemoData: false
    },
    {
      id: crypto.randomUUID(),
      name: "Mixed Doubles",
      type: "MIXED_DOUBLES" as CategoryType,
      format: "SINGLE_ELIMINATION" as TournamentFormat,
      addDemoData: false
    }
  ];
};

// Get display name for tournament format
export const getFormatDisplayName = (format: string): string => {
  switch (format) {
    case "SINGLE_ELIMINATION":
      return "Single Elimination";
    case "DOUBLE_ELIMINATION":
      return "Double Elimination";
    case "ROUND_ROBIN":
      return "Round Robin";
    case "SWISS":
      return "Swiss System";
    case "GROUP_KNOCKOUT":
      return "Group & Knockout";
    case "MULTI_STAGE":
      return "Multi-Stage";
    default:
      return format.replace("_", " ");
  }
};

// Get description for tournament format
export const getFormatDescription = (format: string): string => {
  switch (format) {
    case "SINGLE_ELIMINATION":
      return "Players compete in a bracket where losers are immediately eliminated.";
    case "DOUBLE_ELIMINATION":
      return "Players must lose twice to be eliminated, with a losers' bracket.";
    case "ROUND_ROBIN":
      return "Every player competes against all other players in the group.";
    case "SWISS":
      return "Players are paired against others with similar records, without elimination.";
    case "GROUP_KNOCKOUT":
      return "Initial group stages followed by elimination rounds.";
    case "MULTI_STAGE":
      return "Multiple stages with initial rounds, division placement, and playoff knockouts.";
    default:
      return "Custom tournament format.";
  }
};

// Generate matches based on tournament format and teams
export const generateMatchesByFormat = (
  format: TournamentFormat, 
  teams: any[], 
  categoryId: string,
  tournamentId: string
): any[] => {
  switch (format) {
    case "SINGLE_ELIMINATION":
      return generateSingleEliminationMatches(teams, categoryId, tournamentId);
    case "DOUBLE_ELIMINATION":
      return generateDoubleEliminationMatches(teams, categoryId, tournamentId);
    case "ROUND_ROBIN":
      return generateRoundRobinMatches(teams, categoryId, tournamentId);
    case "GROUP_KNOCKOUT":
      return generateGroupKnockoutMatches(teams, categoryId, tournamentId);
    case "SWISS":
      return generateSwissMatches(teams, categoryId, tournamentId);
    case "MULTI_STAGE":
      return generateMultiStageMatches(teams, categoryId, tournamentId);
    default:
      return generateSingleEliminationMatches(teams, categoryId, tournamentId);
  }
};

// Helper function to generate single elimination matches
const generateSingleEliminationMatches = (teams: any[], categoryId: string, tournamentId: string) => {
  const matches = [];
  const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
  
  // Generate first round matches
  for (let i = 0; i < shuffledTeams.length; i += 2) {
    if (i + 1 < shuffledTeams.length) {
      matches.push({
        id: crypto.randomUUID(),
        tournamentId,
        team1: shuffledTeams[i],
        team2: shuffledTeams[i + 1],
        scores: [],
        status: "SCHEDULED",
        stage: "INITIAL_ROUND",
        round: 1,
        bracketPosition: i / 2 + 1,
        categoryId
      });
    } else {
      // If there's an odd number of teams, the last team gets a bye
      console.log(`Team ${shuffledTeams[i].name} gets a bye in the first round`);
    }
  }
  
  return matches;
};

// Helper function to generate double elimination matches
const generateDoubleEliminationMatches = (teams: any[], categoryId: string, tournamentId: string) => {
  // Start with single elimination matches for the winners bracket
  const matches = generateSingleEliminationMatches(teams, categoryId, tournamentId);
  
  // Add losers bracket placeholder matches
  // In a real implementation, these would be properly structured
  for (let i = 0; i < Math.floor(teams.length / 2) - 1; i++) {
    matches.push({
      id: crypto.randomUUID(),
      tournamentId,
      team1: null, // To be determined based on who loses in winners bracket
      team2: null, // To be determined based on who loses in winners bracket
      scores: [],
      status: "PENDING",
      stage: "INITIAL_ROUND",
      round: 1,
      bracketPosition: i + 1,
      bracketType: "LOSERS",
      categoryId
    });
  }
  
  return matches;
};

// Helper function to generate round robin matches
const generateRoundRobinMatches = (teams: any[], categoryId: string, tournamentId: string) => {
  const matches = [];
  
  // Each team plays against every other team
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({
        id: crypto.randomUUID(),
        tournamentId,
        team1: teams[i],
        team2: teams[j],
        scores: [],
        status: "SCHEDULED",
        stage: "ROUND_ROBIN",
        categoryId
      });
    }
  }
  
  return matches;
};

// Helper function to generate Swiss system matches
const generateSwissMatches = (teams: any[], categoryId: string, tournamentId: string) => {
  // For Swiss, we start with randomly paired first round
  const matches = [];
  const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
  
  // First round matches
  for (let i = 0; i < shuffledTeams.length; i += 2) {
    if (i + 1 < shuffledTeams.length) {
      matches.push({
        id: crypto.randomUUID(),
        tournamentId,
        team1: shuffledTeams[i],
        team2: shuffledTeams[i + 1],
        scores: [],
        status: "SCHEDULED",
        stage: "SWISS",
        round: 1,
        categoryId
      });
    }
  }
  
  // Future rounds will be generated based on results of previous rounds
  // For now, this is a simple implementation
  
  return matches;
};

// Helper function to generate group & knockout matches
const generateGroupKnockoutMatches = (teams: any[], categoryId: string, tournamentId: string) => {
  const matches = [];
  
  // Determine number of groups (4 teams per group is common)
  const groupSize = 4;
  const numGroups = Math.ceil(teams.length / groupSize);
  
  // Assign teams to groups
  const groups = Array.from({ length: numGroups }, () => []);
  teams.forEach((team, index) => {
    const groupIndex = index % numGroups;
    groups[groupIndex].push(team);
  });
  
  // Generate matches within each group (round robin format)
  groups.forEach((groupTeams, groupIndex) => {
    for (let i = 0; i < groupTeams.length; i++) {
      for (let j = i + 1; j < groupTeams.length; j++) {
        matches.push({
          id: crypto.randomUUID(),
          tournamentId,
          team1: groupTeams[i],
          team2: groupTeams[j],
          scores: [],
          status: "SCHEDULED",
          stage: "GROUP_STAGE",
          groupName: `Group ${String.fromCharCode(65 + groupIndex)}`,
          categoryId
        });
      }
    }
  });
  
  // Add knockout stage placeholder matches
  // In a real implementation, these would be properly structured based on group results
  
  return matches;
};

// Helper function to generate multi-stage matches
const generateMultiStageMatches = (teams: any[], categoryId: string, tournamentId: string) => {
  // For multi-stage, we'll simplify by creating initial qualification matches
  const matches = [];
  const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
  
  // Initial qualification matches
  for (let i = 0; i < shuffledTeams.length; i += 2) {
    if (i + 1 < shuffledTeams.length) {
      matches.push({
        id: crypto.randomUUID(),
        tournamentId,
        team1: shuffledTeams[i],
        team2: shuffledTeams[i + 1],
        scores: [],
        status: "SCHEDULED",
        stage: "INITIAL_ROUND",
        division: "INITIAL",
        categoryId
      });
    }
  }
  
  // Add placeholders for future stages
  // In a real implementation, these would be generated based on initial round results
  
  return matches;
};
