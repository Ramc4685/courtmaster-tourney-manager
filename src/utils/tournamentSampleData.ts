// Making minor adjustments to ensure type safety and proper functioning

import { Tournament, Team, Match, Division, TournamentStage, MatchStatus, TournamentFormat, TournamentCategory, CategoryType, CourtStatus } from "@/types/tournament";
import { generateId } from "./tournamentUtils";

export const createSampleData = (): Tournament => {
  const id = generateId();
  const defaultCategory = { 
    id: generateId(), 
    name: "Men's Singles", 
    type: "MENS_SINGLES" as CategoryType 
  };
  
  const teams: Team[] = [
    { id: "team-1", name: "Cloud9", players: [{ id: "player-1", name: "Player A" }, { id: "player-2", name: "Player B" }] },
    { id: "team-2", name: "TSM", players: [{ id: "player-3", name: "Player C" }, { id: "player-4", name: "Player D" }] },
    { id: "team-3", name: "Liquid", players: [{ id: "player-5", name: "Player E" }, { id: "player-6", name: "Player F" }] },
    { id: "team-4", name: "Fnatic", players: [{ id: "player-7", name: "Player G" }, { id: "player-8", name: "Player H" }] }
  ];

  const matches: Match[] = [
    {
      id: generateId(),
      tournamentId: id,
      team1: teams[0],
      team2: teams[1],
      scores: [],
      division: "DIVISION_1",
      stage: "INITIAL_ROUND",
      status: "SCHEDULED",
      scheduledTime: new Date(),
      category: defaultCategory
    },
    {
      id: generateId(),
      tournamentId: id,
      team1: teams[2],
      team2: teams[3],
      scores: [],
      division: "DIVISION_2",
      stage: "INITIAL_ROUND",
      status: "SCHEDULED",
      scheduledTime: new Date(),
      category: defaultCategory
    }
  ];

  const courts = [
    { id: "court-1", name: "Court 1", number: 1, status: "AVAILABLE" as CourtStatus },
    { id: "court-2", name: "Court 2", number: 2, status: "AVAILABLE" as CourtStatus }
  ];

  return {
    id,
    name: "Sample Tournament",
    format: "SINGLE_ELIMINATION",
    status: "DRAFT",
    currentStage: "INITIAL_ROUND",
    teams,
    matches,
    courts,
    startDate: new Date(),
    endDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    categories: [
      { id: generateId(), name: "Men's Singles", type: "MENS_SINGLES" as CategoryType },
      { id: generateId(), name: "Women's Singles", type: "WOMENS_SINGLES" as CategoryType }
    ]
  };
};

export const getSampleDataByFormat = (format: TournamentFormat): Tournament => {
  const id = generateId();
  const defaultCategory = { 
    id: generateId(), 
    name: "Men's Singles", 
    type: "MENS_SINGLES" as CategoryType 
  };
  
  const teams: Team[] = [
    { id: "team-1", name: "Cloud9", players: [{ id: "player-1", name: "Player A" }, { id: "player-2", name: "Player B" }] },
    { id: "team-2", name: "TSM", players: [{ id: "player-3", name: "Player C" }, { id: "player-4", name: "Player D" }] },
    { id: "team-3", name: "Liquid", players: [{ id: "player-5", name: "Player E" }, { id: "player-6", name: "Player F" }] },
    { id: "team-4", name: "Fnatic", players: [{ id: "player-7", name: "Player G" }, { id: "player-8", name: "Player H" }] }
  ];

  const matches: Match[] = [
    {
      id: generateId(),
      tournamentId: id,
      team1: teams[0],
      team2: teams[1],
      scores: [],
      division: "DIVISION_1",
      stage: "INITIAL_ROUND",
      status: "SCHEDULED",
      scheduledTime: new Date(),
      category: defaultCategory
    },
    {
      id: generateId(),
      tournamentId: id,
      team1: teams[2],
      team2: teams[3],
      scores: [],
      division: "DIVISION_2",
      stage: "INITIAL_ROUND",
      status: "SCHEDULED",
      scheduledTime: new Date(),
      category: defaultCategory
    }
  ];

  const courts = [
    { id: "court-1", name: "Court 1", number: 1, status: "AVAILABLE" as CourtStatus },
    { id: "court-2", name: "Court 2", number: 2, status: "AVAILABLE" as CourtStatus }
  ];

  return {
    id,
    name: `Sample ${format} Tournament`,
    format: format,
    status: "DRAFT",
    currentStage: "INITIAL_ROUND",
    teams,
    matches,
    courts,
    startDate: new Date(),
    endDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    categories: [
      { id: generateId(), name: "Men's Singles", type: "MENS_SINGLES" as CategoryType },
      { id: generateId(), name: "Women's Singles", type: "WOMENS_SINGLES" as CategoryType }
    ]
  };
};

// Create sample data for a specific category - improved error handling and logging
export const getCategoryDemoData = (format: TournamentFormat, category: TournamentCategory) => {
  try {
    console.log(`Generating demo data for category ${category.name} with format ${format}`);
    
    const teams: Team[] = [];
    const matches: Match[] = [];
    
    // Generate sample team names based on category type
    const teamNamePrefix = getTeamNamePrefixByCategory(category);
    
    // Create 8 teams for this category
    for (let i = 1; i <= 8; i++) {
      const teamId = `team-${category.id.substring(0, 4)}-${i}`;
      teams.push({
        id: teamId,
        name: `${teamNamePrefix} Team ${i}`,
        players: [
          { id: `player-${teamId}-1`, name: `Player ${i}A` },
          { id: `player-${teamId}-2`, name: `Player ${i}B` }
        ],
        category: category
      });
    }
    
    // Create sample matches based on format
    if (format === "ROUND_ROBIN") {
      // Round robin - everyone plays against everyone
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          matches.push({
            id: `match-${category.id.substring(0, 4)}-${i}-${j}`,
            tournamentId: "sample",
            team1: teams[i],
            team2: teams[j],
            scores: [],
            division: "INITIAL" as Division,
            stage: "INITIAL_ROUND" as TournamentStage,
            status: "SCHEDULED" as MatchStatus,
            scheduledTime: new Date(Date.now() + (matches.length * 3600000)), // Each match 1 hour apart
            category: category
          });
        }
      }
    } else if (format === "SINGLE_ELIMINATION") {
      // Create a simple bracket
      // First round (4 matches)
      for (let i = 0; i < 4; i++) {
        matches.push({
          id: `match-${category.id.substring(0, 4)}-r1-${i}`,
          tournamentId: "sample",
          team1: teams[i * 2],
          team2: teams[i * 2 + 1],
          scores: [],
          division: "INITIAL" as Division,
          stage: "INITIAL_ROUND" as TournamentStage,
          status: "SCHEDULED" as MatchStatus,
          bracketRound: 1,
          bracketPosition: i,
          nextMatchId: `match-${category.id.substring(0, 4)}-r2-${Math.floor(i/2)}`,
          scheduledTime: new Date(Date.now() + (i * 3600000)),
          category: category
        });
      }
      
      // Second round (2 matches)
      for (let i = 0; i < 2; i++) {
        matches.push({
          id: `match-${category.id.substring(0, 4)}-r2-${i}`,
          tournamentId: "sample",
          team1: { id: "TBD", name: "TBD", players: [] },
          team2: { id: "TBD", name: "TBD", players: [] },
          scores: [],
          division: "INITIAL" as Division,
          stage: "INITIAL_ROUND" as TournamentStage,
          status: "SCHEDULED" as MatchStatus,
          bracketRound: 2,
          bracketPosition: i,
          nextMatchId: `match-${category.id.substring(0, 4)}-r3-0`,
          scheduledTime: new Date(Date.now() + (4 * 3600000) + (i * 3600000)),
          category: category
        });
      }
      
      // Final match
      matches.push({
        id: `match-${category.id.substring(0, 4)}-r3-0`,
        tournamentId: "sample",
        team1: { id: "TBD", name: "TBD", players: [] },
        team2: { id: "TBD", name: "TBD", players: [] },
        scores: [],
        division: "INITIAL" as Division,
        stage: "INITIAL_ROUND" as TournamentStage,
        status: "SCHEDULED" as MatchStatus,
        bracketRound: 3,
        bracketPosition: 0,
        scheduledTime: new Date(Date.now() + (6 * 3600000)),
        category: category
      });
    } else {
      // For other formats, create some basic matches
      for (let i = 0; i < 4; i++) {
        matches.push({
          id: `match-${category.id.substring(0, 4)}-${i}`,
          tournamentId: "sample",
          team1: teams[i * 2],
          team2: teams[i * 2 + 1],
          scores: [],
          division: "INITIAL" as Division,
          stage: "INITIAL_ROUND" as TournamentStage,
          status: "SCHEDULED" as MatchStatus,
          scheduledTime: new Date(Date.now() + (i * 3600000)),
          category: category
        });
      }
    }
    
    console.log(`Generated ${teams.length} teams and ${matches.length} matches for ${category.name}`);
    return { teams, matches };
  } catch (error) {
    console.error(`Error generating demo data for category ${category.name}:`, error);
    // Return empty arrays if there's an error
    return { teams: [], matches: [] };
  }
};

// Helper to get team name prefix based on category
function getTeamNamePrefixByCategory(category: TournamentCategory): string {
  switch (category.type) {
    case "MENS_SINGLES":
      return "MS";
    case "WOMENS_SINGLES":
      return "WS";
    case "MENS_DOUBLES":
      return "MD";
    case "WOMENS_DOUBLES":
      return "WD";
    case "MIXED_DOUBLES":
      return "XD";
    case "CUSTOM":
      return category.customName?.substring(0, 2) || "CU";
    default:
      return "T";
  }
}
