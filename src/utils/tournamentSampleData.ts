
import { Tournament, Team, Match, TournamentFormat, TournamentCategory } from "@/types/tournament";
import { generateId } from "./tournamentUtils";
import { generateTeamName } from "./teamNameUtils";
import { TournamentFormatService } from "@/services/tournament/formats/TournamentFormatService";

// Function to create sample teams
export const createSampleTeams = (count: number = 8): Team[] => {
  // Real player names for sample data
  const playerPairs = [
    ["Viktor Axelsen", "Anders Antonsen"],
    ["Tai Tzu-ying", "Chen Yufei"],
    ["Jonatan Christie", "Anthony Ginting"],
    ["Akane Yamaguchi", "Nozomi Okuhara"],
    ["Lee Zii Jia", "Loh Kean Yew"],
    ["Carolina Marin", "P.V. Sindhu"],
    ["Kento Momota", "Chou Tien-chen"],
    ["Ratchanok Intanon", "He Bingjiao"]
  ];
  
  const teams: Team[] = [];
  for (let i = 0; i < Math.min(count, playerPairs.length); i++) {
    const players = playerPairs[i].map((name, playerIndex) => ({
      id: generateId(),
      name
    }));
    
    const teamName = generateTeamName(players.map(p => p.name));
    
    teams.push({
      id: generateId(),
      name: teamName,
      players: players
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
  
  // Real players for demo data based on category type
  let playerPool: Array<string | string[]> = [];
  
  if (category.type === "MENS_SINGLES" || category.type === "MENS_DOUBLES") {
    playerPool = [
      "Viktor Axelsen", "Anders Antonsen", "Jonatan Christie", "Anthony Ginting",
      "Lee Zii Jia", "Loh Kean Yew", "Kento Momota", "Chou Tien-chen",
      "Lakshya Sen", "Kidambi Srikanth", "Lee Cheuk Yiu", "Kunlavut Vitidsarn",
      "Shi Yu Qi", "Prannoy H. S.", "Rasmus Gemke", "Wang Tzu-wei"
    ];
  } else if (category.type === "WOMENS_SINGLES" || category.type === "WOMENS_DOUBLES") {
    playerPool = [
      "Tai Tzu-ying", "Chen Yufei", "Akane Yamaguchi", "Nozomi Okuhara",
      "Carolina Marin", "P.V. Sindhu", "Ratchanok Intanon", "He Bingjiao",
      "An Se-young", "Pornpawee Chochuwong", "Michelle Li", "Gregoria Tunjung",
      "Saina Nehwal", "Pusarla Venkata Sindhu", "Beiwen Zhang", "Mia Blichfeldt"
    ];
  } else if (category.type === "MIXED_DOUBLES") {
    // Pairs for mixed doubles
    playerPool = [
      ["Zheng Siwei", "Huang Yaqiong"],
      ["Wang Yilyu", "Huang Dongping"],
      ["Dechapol Puavaranukroh", "Sapsiree Taerattanachai"],
      ["Praveen Jordan", "Melati Daeva Oktavianti"],
      ["Yuta Watanabe", "Arisa Higashino"],
      ["Tang Chun Man", "Tse Ying Suet"],
      ["Marcus Ellis", "Lauren Smith"],
      ["Goh Soon Huat", "Lai Shevon Jemie"]
    ];
  } else {
    // Default player pool for other categories
    playerPool = [
      "Player A", "Player B", "Player C", "Player D",
      "Player E", "Player F", "Player G", "Player H"
    ];
  }
  
  // Generate unique team names for this category
  const teams: TeamType[] = [];
  for (let i = 0; i < teamCount; i++) {
    // Get player(s) for this team
    const isDoubles = category.type.includes("DOUBLES");
    const playerIndex = i % playerPool.length;
    
    let players;
    let playerNames;
    
    if (isDoubles) {
      if (category.type === "MIXED_DOUBLES" && Array.isArray(playerPool[playerIndex])) {
        // For mixed doubles, use the predefined pairs
        playerNames = playerPool[playerIndex] as string[];
        players = playerNames.map(name => ({
          id: generateId(),
          name
        }));
      } else {
        // For other doubles, create pairs from the pool
        const player1Index = i % playerPool.length;
        const player2Index = (i + 1) % playerPool.length;
        playerNames = [playerPool[player1Index], playerPool[player2Index]] as string[];
        players = playerNames.map(name => ({
          id: generateId(),
          name: name as string
        }));
      }
    } else {
      // For singles
      playerNames = [playerPool[playerIndex]] as string[];
      players = [{
        id: generateId(),
        name: playerNames[0] as string
      }];
    }
    
    // Generate team name based on player names
    const teamName = generateTeamName(playerNames.map(name => name as string));
    
    teams.push({
      id: generateId(),
      name: teamName,
      players: players,
      category: category
    });
  }
  
  // Get the format handler and generate matches
  const formatHandler = TournamentFormatService.getFormatHandler(format);
  const matches = formatHandler.generateMatches(teams, category);
  
  return { teams, matches };
};
