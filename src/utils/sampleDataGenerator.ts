
import { 
  Court, 
  Division, 
  Match, 
  Player, 
  ScoringSettings, 
  Team, 
  Tournament, 
  TournamentFormat, 
  TournamentStage 
} from "@/types/tournament";

// Generate a sample tournament with appropriate data
export const generateSampleTournament = (format: TournamentFormat = "MULTI_STAGE"): Tournament => {
  // Generate teams
  const teams = generateTeams(16);
  
  // Generate courts
  const courts = generateCourts(4);
  
  // Generate matches based on format
  const matches = generateMatchesForFormat(teams, format);
  
  // Default scoring settings
  const scoringSettings: ScoringSettings = {
    maxPoints: 21,
    maxSets: 3,
    requireTwoPointLead: true,
    maxTwoPointLeadScore: 30
  };
  
  return {
    id: "sampleTournament",
    name: `Sample ${format.replace("_", " ")} Tournament`,
    description: `This is a sample ${format.toLowerCase().replace("_", " ")} tournament with 16 teams.`,
    format: format,
    status: "IN_PROGRESS",
    currentStage: "INITIAL_ROUND",
    teams,
    courts,
    matches,
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    createdAt: new Date(),
    updatedAt: new Date(),
    divisionProgression: true,
    autoAssignCourts: true,
    scoringSettings,
    formatConfig: getFormatConfig(format)
  };
};

// Generate a specified number of teams with players
const generateTeams = (numTeams: number): Team[] => {
  const teams: Team[] = [];
  
  const teamNames = [
    "Eagles", "Hawks", "Falcons", "Owls", "Ravens", "Phoenixes",
    "Dragons", "Lions", "Tigers", "Panthers", "Bears", "Wolves",
    "Vipers", "Cobras", "Scorpions", "Jaguars", "Cheetahs", "Leopards",
    "Sharks", "Dolphins", "Whales", "Barracudas", "Piranhas", "Stingrays",
    "Wasps", "Hornets", "Bees", "Ants", "Spiders", "Beetles",
    "Stars", "Comets", "Meteors", "Planets", "Galaxies", "Nebulas"
  ];
  
  // Generate 1-2 players per team
  for (let i = 0; i < numTeams; i++) {
    const playerCount = Math.random() > 0.5 ? 2 : 1;
    const players: Player[] = [];
    
    for (let p = 0; p < playerCount; p++) {
      players.push({
        id: `player-${i}-${p}`,
        name: generateRandomName(),
        email: `player${i}${p}@example.com`
      });
    }
    
    teams.push({
      id: `team-${i}`,
      name: `${teamNames[i % teamNames.length]} ${i + 1}`,
      players,
      initialRanking: i + 1 // Add this for seeding
    });
  }
  
  return teams;
};

// Generate random courts
const generateCourts = (numCourts: number): Court[] => {
  return Array.from({ length: numCourts }, (_, i) => ({
    id: `court-${i + 1}`,
    name: `Court ${i + 1}`,
    number: i + 1,
    status: "AVAILABLE"
  }));
};

// Generate matches based on tournament format
const generateMatchesForFormat = (teams: Team[], format: TournamentFormat): Match[] => {
  const matches: Match[] = [];
  
  // Calculate total matches based on format and team count
  let totalMatches = 0;
  switch (format) {
    case "SINGLE_ELIMINATION":
      totalMatches = teams.length - 1;
      break;
    case "DOUBLE_ELIMINATION":
      totalMatches = 2 * teams.length - 2;
      break;
    case "ROUND_ROBIN":
      totalMatches = (teams.length * (teams.length - 1)) / 2;
      break;
    case "SWISS":
      totalMatches = teams.length * 3 / 2; // Assuming ~3 rounds
      break;
    case "GROUP_KNOCKOUT":
      totalMatches = teams.length - 1 + (teams.length / 4) * 3; // Group games + knockout
      break;
    case "MULTI_STAGE":
    default:
      totalMatches = teams.length + 4; // Initial matches + some progression
      break;
  }
  
  // For safety, cap the number of matches to a reasonable amount
  totalMatches = Math.min(totalMatches, 30);
  
  // Generate matches with different statuses
  for (let i = 0; i < totalMatches; i++) {
    const team1Index = i % teams.length;
    const team2Index = (i + 1 + Math.floor(i / teams.length)) % teams.length;
    
    // Skip if same team would play against itself
    if (team1Index === team2Index) continue;
    
    // Determine status - make 25% completed, 25% in progress, 50% scheduled
    let status: "COMPLETED" | "IN_PROGRESS" | "SCHEDULED";
    if (i < totalMatches * 0.25) {
      status = "COMPLETED";
    } else if (i < totalMatches * 0.5) {
      status = "IN_PROGRESS";
    } else {
      status = "SCHEDULED";
    }
    
    // For scheduled matches, assign courts to some of them
    const courtNumber = 
      status === "IN_PROGRESS" ? 
        (i % 4) + 1 : 
        status === "SCHEDULED" && i % 3 === 0 ? 
          (i % 4) + 1 : 
          undefined;
    
    // Generate different division assignments based on format
    let division: Division = "INITIAL";
    let bracketRound: number | undefined;
    
    if (format === "MULTI_STAGE") {
      if (i < totalMatches * 0.3) {
        division = "INITIAL";
      } else if (i < totalMatches * 0.6) {
        division = "DIVISION_1";
      } else if (i < totalMatches * 0.8) {
        division = "DIVISION_2";
      } else {
        division = "DIVISION_3";
      }
    } else if (format === "SINGLE_ELIMINATION" || format === "DOUBLE_ELIMINATION") {
      bracketRound = Math.floor(Math.log2(teams.length)) - Math.floor(i / (teams.length / 2));
      bracketRound = Math.max(1, bracketRound);
    } else if (format === "GROUP_KNOCKOUT") {
      if (i < totalMatches * 0.7) {
        division = "QUALIFIER_DIV1";
      } else {
        division = "DIVISION_1";
      }
    }
    
    // Generate scores for completed and in-progress matches
    const scores = [];
    if (status === "COMPLETED") {
      // For completed matches, create 2-3 sets with a clear winner
      const numSets = Math.random() > 0.7 ? 3 : 2;
      let team1Wins = 0;
      let team2Wins = 0;
      
      for (let s = 0; s < numSets; s++) {
        let team1Score, team2Score;
        
        if (team1Wins >= numSets / 2 || team2Wins >= numSets / 2) {
          // One team already won majority of sets, make this set look incomplete
          team1Score = Math.floor(Math.random() * 15);
          team2Score = Math.floor(Math.random() * 15);
        } else {
          // Competitive set with a winner
          if (s === numSets - 1 || (team1Wins === 0 && team2Wins === 0)) {
            if (Math.random() > 0.5) {
              team1Score = 21;
              team2Score = Math.floor(Math.random() * 19);
              team1Wins++;
            } else {
              team2Score = 21;
              team1Score = Math.floor(Math.random() * 19);
              team2Wins++;
            }
          } else {
            if (team1Wins > team2Wins) {
              team2Score = 21;
              team1Score = Math.floor(Math.random() * 19);
              team2Wins++;
            } else {
              team1Score = 21;
              team2Score = Math.floor(Math.random() * 19);
              team1Wins++;
            }
          }
        }
        
        scores.push({ team1Score, team2Score });
      }
    } else if (status === "IN_PROGRESS") {
      // For in-progress matches, create 1-2 sets with the current set in progress
      const numSets = Math.random() > 0.7 ? 2 : 1;
      
      for (let s = 0; s < numSets; s++) {
        const team1Score = Math.floor(Math.random() * 21);
        const team2Score = Math.floor(Math.random() * 21);
        scores.push({ team1Score, team2Score });
      }
    }
    
    // For completed matches, determine a winner
    let winner, loser;
    if (status === "COMPLETED") {
      let team1Sets = 0;
      let team2Sets = 0;
      
      scores.forEach(score => {
        if (score.team1Score > score.team2Score) team1Sets++;
        if (score.team2Score > score.team1Score) team2Sets++;
      });
      
      if (team1Sets > team2Sets) {
        winner = teams[team1Index];
        loser = teams[team2Index];
      } else {
        winner = teams[team2Index];
        loser = teams[team1Index];
      }
    }
    
    // Create scheduled times spread over today and tomorrow
    const scheduledTime = new Date();
    scheduledTime.setHours(9 + Math.floor(i / 2) % 8);
    scheduledTime.setMinutes((i % 2) * 30);
    if (i > totalMatches / 2) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const match: Match = {
      id: `match-${i}`,
      tournamentId: "sampleTournament",
      team1: teams[team1Index],
      team2: teams[team2Index],
      scores: scores,
      division: division,
      stage: "INITIAL_ROUND",
      courtNumber,
      scheduledTime,
      status,
      winner,
      loser,
      bracketRound,
      bracketPosition: bracketRound ? i % Math.pow(2, bracketRound - 1) + 1 : undefined,
      updatedAt: new Date(Date.now() - Math.random() * 86400000) // Random time in the last 24 hours
    };
    
    matches.push(match);
  }
  
  return matches;
};

// Generate format-specific configuration
const getFormatConfig = (format: TournamentFormat) => {
  switch (format) {
    case "GROUP_KNOCKOUT":
      return {
        groupCount: 4,
        teamsPerGroup: 4,
        advancingTeamsPerGroup: 2
      };
    case "SWISS":
      return {
        swissRounds: 4
      };
    case "SINGLE_ELIMINATION":
      return {
        consolationRounds: true
      };
    case "MULTI_STAGE":
    default:
      return {};
  }
};

// Helper function to generate random names
const generateRandomName = (): string => {
  const firstNames = ["John", "Jane", "Michael", "Sarah", "David", "Emma", "Richard", "Lisa", "Thomas", "Emily", "James", "Olivia", "Robert", "Sophia", "William", "Ava", "Joseph", "Mia", "Daniel", "Isabella"];
  const lastNames = ["Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson", "Garcia", "Martinez", "Robinson"];
  
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
};
