import { Tournament, Team, Match, TournamentFormat, TournamentCategory } from "@/types/tournament";
import { generateId } from "./tournamentUtils";
import { TournamentFormatService } from "@/services/tournament/formats/TournamentFormatService";

// Function to create sample teams
export const createSampleTeams = (count: number = 8): Team[] => {
  const teams: Team[] = [];
  for (let i = 1; i <= count; i++) {
    teams.push({
      id: generateId(),
      name: `Team ${i}`,
      players: [
        { id: generateId(), name: `Player ${i}A` },
        { id: generateId(), name: `Player ${i}B` },
      ],
    });
  }
  return teams;
};

// Function to create sample matches
export const createSampleMatches = (teams: Team[], tournamentId: string): Match[] => {
  const matches: Match[] = [];
  for (let i = 0; i < teams.length; i += 2) {
    if (teams[i + 1]) {
      matches.push({
        id: generateId(),
        tournamentId: tournamentId,
        team1: teams[i],
        team2: teams[i + 1],
        scores: [],
        division: "INITIAL",
        stage: "INITIAL_ROUND",
        status: "SCHEDULED",
        category: {
          id: "default",
          name: "Default",
          type: "CUSTOM"
        }
      });
    }
  }
  return matches;
};

// Function to create sample data
export const createSampleData = (): Tournament => {
  const teams = createSampleTeams();
  const tournamentId = generateId();
  const matches = createSampleMatches(teams, tournamentId);

  return {
    id: tournamentId,
    name: "Sample Tournament",
    format: "SINGLE_ELIMINATION",
    status: "DRAFT",
    currentStage: "INITIAL_ROUND",
    teams: teams,
    matches: matches,
    courts: [],
    startDate: new Date(),
    endDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    categories: [{
      id: "default",
      name: "Default",
      type: "CUSTOM"
    }]
  };
};

// Function to get sample data by format
export const getSampleDataByFormat = (format: TournamentFormat): Tournament => {
  const teams = createSampleTeams();
  const tournamentId = generateId();
  const matches = TournamentFormatService.generateMatchesForCategory(format, teams, {
    id: "default",
    name: "Default",
    type: "CUSTOM"
  });

  return {
    id: tournamentId,
    name: `Sample ${format.replace(/_/g, ' ')} Tournament`,
    format: format,
    status: "DRAFT",
    currentStage: "INITIAL_ROUND",
    teams: teams,
    matches: matches,
    courts: [],
    startDate: new Date(),
    endDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    categories: [{
      id: "default",
      name: "Default",
      type: "CUSTOM"
    }]
  };
};

// Add to the existing imports and code
// This function needs to be exported if it isn't already
import { Team as TeamType, Match as MatchType, TournamentCategory as TournamentCategoryType } from "@/types/tournament";

export const getCategoryDemoData = (format: TournamentFormat, category: TournamentCategoryType) => {
  console.log(`Generating demo data for ${category.name} with format ${format}`);
  
  // Generate 8-16 teams for the category depending on format
  const teamCount = format === "ROUND_ROBIN" ? 8 : format === "SWISS" ? 12 : 16;
  
  // Generate unique team names for this category
  const teams: TeamType[] = [];
  for (let i = 0; i < teamCount; i++) {
    const teamName = `${category.name} Team ${i + 1}`;
    teams.push({
      id: generateId(),
      name: teamName,
      players: [{
        id: generateId(),
        name: `Player ${i * 2 + 1}`,
      }, {
        id: generateId(),
        name: `Player ${i * 2 + 2}`,
      }],
      category: category
    });
  }
  
  // Get the format handler and generate matches
  const formatHandler = TournamentFormatService.getFormatHandler(format);
  const matches = formatHandler.generateMatches(teams, category);
  
  return { teams, matches };
};
