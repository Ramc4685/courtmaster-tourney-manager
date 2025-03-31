
import { Tournament, Team, Player, Match, Court, TournamentFormat, TournamentStatus, TournamentStage, Division, MatchStatus, CourtStatus, TournamentCategory } from "@/types/tournament";
import { generateId } from "./tournamentUtils";
import { generateTeamName } from "./teamNameUtils";

// Create sample data for testing
export const createSampleData = (): Tournament => {
  const sampleTournament = createSampleTournament();
  const sampleTeams = createSampleTeams(sampleTournament.categories);
  const sampleCourts = createSampleCourts();
  const sampleMatches = createSampleMatches(sampleTeams, sampleTournament);
  
  return {
    ...sampleTournament,
    teams: sampleTeams,
    courts: sampleCourts,
    matches: sampleMatches
  };
};

// Create sample tournament by format
export const getSampleDataByFormat = (format: TournamentFormat): Tournament => {
  const sampleTournament = createSampleTournament(format);
  const sampleTeams = createSampleTeams(sampleTournament.categories);
  const sampleCourts = createSampleCourts();
  const sampleMatches = createSampleMatches(sampleTeams, sampleTournament);
  
  return {
    ...sampleTournament,
    teams: sampleTeams,
    courts: sampleCourts,
    matches: sampleMatches
  };
};

// Create a sample tournament
export const createSampleTournament = (format: TournamentFormat = "MULTI_STAGE"): Tournament => {
  return {
    id: generateId(),
    name: `Sample ${format.replace("_", " ")} Tournament`,
    description: "This is a sample tournament for testing purposes",
    format: format,
    status: "IN_PROGRESS",
    currentStage: "INITIAL_ROUND",
    teams: [],
    matches: [],
    courts: [],
    startDate: new Date(),
    endDate: new Date(Date.now() + 86400000), // 1 day later
    createdAt: new Date(),
    updatedAt: new Date(),
    divisionProgression: true,
    autoAssignCourts: true,
    categories: [
      {
        id: "cat-1",
        name: "Men's Singles",
        type: "MENS_SINGLES"
      },
      {
        id: "cat-2",
        name: "Women's Singles",
        type: "WOMENS_SINGLES"
      },
      {
        id: "cat-3", 
        name: "Mixed Doubles",
        type: "MIXED_DOUBLES"
      }
    ]
  };
};

// Create sample teams with realistic player names
export const createSampleTeams = (categories: TournamentCategory[]): Team[] => {
  const mensSinglesCategory = categories.find(c => c.type === "MENS_SINGLES") || categories[0];
  const womensSinglesCategory = categories.find(c => c.type === "WOMENS_SINGLES") || categories[0];
  const mixedDoublesCategory = categories.find(c => c.type === "MIXED_DOUBLES") || categories[0];
  
  // Men's Singles Players
  const mensSingles = [
    { id: "player-1", name: "Jonatan Christie" },
    { id: "player-2", name: "Viktor Axelsen" },
    { id: "player-3", name: "Kento Momota" },
    { id: "player-4", name: "Lee Zii Jia" }
  ];
  
  // Women's Singles Players
  const womensSingles = [
    { id: "player-5", name: "Tai Tzu-ying" },
    { id: "player-6", name: "Chen Yufei" },
    { id: "player-7", name: "Akane Yamaguchi" },
    { id: "player-8", name: "Carolina Marin" }
  ];
  
  // Mixed Doubles Pairs
  const mixedDoublesPairs = [
    [
      { id: "player-9", name: "Zheng Siwei" },
      { id: "player-10", name: "Huang Yaqiong" }
    ],
    [
      { id: "player-11", name: "Wang Yilyu" },
      { id: "player-12", name: "Huang Dongping" }
    ]
  ];
  
  const teams: Team[] = [];
  
  // Create Men's Singles Teams
  mensSingles.forEach((player, index) => {
    teams.push({
      id: `team-ms-${index + 1}`,
      name: player.name,
      players: [player],
      seed: index + 1,
      category: mensSinglesCategory
    });
  });
  
  // Create Women's Singles Teams
  womensSingles.forEach((player, index) => {
    teams.push({
      id: `team-ws-${index + 1}`,
      name: player.name,
      players: [player],
      seed: index + 1,
      category: womensSinglesCategory
    });
  });
  
  // Create Mixed Doubles Teams
  mixedDoublesPairs.forEach((pair, index) => {
    const playerNames = pair.map(p => p.name);
    const teamName = generateTeamName(playerNames);
    
    teams.push({
      id: `team-md-${index + 1}`,
      name: teamName,
      players: pair,
      seed: index + 1,
      category: mixedDoublesCategory
    });
  });
  
  return teams;
};

// Create a sample player
export const createSamplePlayer = (firstName: string, lastName: string): Player => {
  return {
    id: generateId(),
    name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
    phone: "123-456-7890"
  };
};

// Create sample courts
export const createSampleCourts = (): Court[] => {
  return [
    {
      id: "court-1",
      name: "Court 1",
      number: 1,
      status: "AVAILABLE"
    },
    {
      id: "court-2",
      name: "Court 2",
      number: 2,
      status: "AVAILABLE"
    },
    {
      id: "court-3",
      name: "Court 3",
      number: 3,
      status: "AVAILABLE"
    },
    {
      id: "court-4",
      name: "Court 4",
      number: 4,
      status: "AVAILABLE"
    }
  ];
};

// Create sample matches
export const createSampleMatches = (teams: Team[], tournament: Tournament): Match[] => {
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  
  // Group teams by category
  const teamsByCategory: Record<string, Team[]> = {};
  teams.forEach(team => {
    const categoryId = team.category?.id || 'uncategorized';
    if (!teamsByCategory[categoryId]) {
      teamsByCategory[categoryId] = [];
    }
    teamsByCategory[categoryId].push(team);
  });
  
  const matches: Match[] = [];
  
  // Create matches for each category
  Object.entries(teamsByCategory).forEach(([categoryId, categoryTeams]) => {
    const category = tournament.categories.find(c => c.id === categoryId) || tournament.categories[0];
    
    // Create matches only if we have at least 2 teams in this category
    if (categoryTeams.length >= 2) {
      // Create a completed match
      matches.push({
        id: generateId(),
        tournamentId: tournament.id,
        team1: categoryTeams[0],
        team2: categoryTeams[1],
        scores: [
          { team1Score: 21, team2Score: 19 },
          { team1Score: 19, team2Score: 21 },
          { team1Score: 21, team2Score: 15 }
        ],
        division: "INITIAL",
        stage: "INITIAL_ROUND",
        courtNumber: 1,
        scheduledTime: now,
        status: "COMPLETED",
        winner: categoryTeams[0],
        loser: categoryTeams[1],
        updatedAt: now,
        category: category
      });
      
      // If we have more teams, create an in-progress match
      if (categoryTeams.length >= 4) {
        matches.push({
          id: generateId(),
          tournamentId: tournament.id,
          team1: categoryTeams[2],
          team2: categoryTeams[3],
          scores: [
            { team1Score: 15, team2Score: 12 }
          ],
          division: "INITIAL",
          stage: "INITIAL_ROUND",
          courtNumber: 2,
          scheduledTime: oneHourLater,
          status: "IN_PROGRESS",
          updatedAt: oneHourLater,
          category: category
        });
      }
      
      // If we have even more teams, create scheduled matches
      if (categoryTeams.length >= 6) {
        matches.push({
          id: generateId(),
          tournamentId: tournament.id,
          team1: categoryTeams[4],
          team2: categoryTeams[5],
          scores: [],
          division: "INITIAL",
          stage: "INITIAL_ROUND",
          courtNumber: 3,
          scheduledTime: twoHoursLater,
          status: "SCHEDULED",
          updatedAt: twoHoursLater,
          category: category
        });
      }
      
      // And one more scheduled match without a court
      if (categoryTeams.length >= 8) {
        matches.push({
          id: generateId(),
          tournamentId: tournament.id,
          team1: categoryTeams[6],
          team2: categoryTeams[7],
          scores: [],
          division: "INITIAL",
          stage: "INITIAL_ROUND",
          scheduledTime: threeHoursLater,
          status: "SCHEDULED",
          updatedAt: threeHoursLater,
          category: category
        });
      }
    }
  });
  
  return matches;
};

// Create a sample match
export const createSampleMatch = (team1: Team, team2: Team, tournament: Tournament): Match => {
  // Use team1's category, or team2's if team1 doesn't have one, or default to first tournament category
  const category = team1.category || team2.category || tournament.categories[0];
  
  return {
    id: generateId(),
    tournamentId: tournament.id,
    team1: team1,
    team2: team2,
    scores: [],
    division: "INITIAL",
    stage: "INITIAL_ROUND",
    scheduledTime: new Date(),
    status: "SCHEDULED",
    updatedAt: new Date(),
    category: category
  };
};
