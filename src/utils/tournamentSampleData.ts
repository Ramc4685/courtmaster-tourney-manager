
// Improved sample data generator with better category support

import { Tournament, Team, Match, Division, TournamentStage, MatchStatus, TournamentFormat, TournamentCategory, CategoryType, CourtStatus } from "@/types/tournament";
import { generateId } from "./tournamentUtils";

export const createSampleData = (): Tournament => {
  const id = generateId();
  const categories = [
    { id: generateId(), name: "Men's Singles", type: "MENS_SINGLES" as CategoryType },
    { id: generateId(), name: "Women's Singles", type: "WOMENS_SINGLES" as CategoryType },
    { id: generateId(), name: "Mixed Doubles", type: "MIXED_DOUBLES" as CategoryType }
  ];
  
  // Start with empty teams and matches - they'll be populated by category
  const teams: Team[] = [];
  const matches: Match[] = [];

  const courts = [
    { id: "court-1", name: "Court 1", number: 1, status: "AVAILABLE" as CourtStatus },
    { id: "court-2", name: "Court 2", number: 2, status: "AVAILABLE" as CourtStatus },
    { id: "court-3", name: "Court 3", number: 3, status: "AVAILABLE" as CourtStatus },
    { id: "court-4", name: "Court 4", number: 4, status: "AVAILABLE" as CourtStatus }
  ];

  return {
    id,
    name: "Sample Tournament",
    format: "MULTI_STAGE",
    status: "DRAFT",
    currentStage: "INITIAL_ROUND",
    teams,
    matches,
    courts,
    startDate: new Date(),
    endDate: new Date(Date.now() + 86400000), // 1 day later
    createdAt: new Date(),
    updatedAt: new Date(),
    categories
  };
};

export const getSampleDataByFormat = (format: TournamentFormat): Tournament => {
  const tournament = createSampleData();
  tournament.format = format;
  tournament.name = `Sample ${format.replace("_", " ")} Tournament`;
  return tournament;
};

// Create sample data for a specific category - improved with better logging and team generation
export const getCategoryDemoData = (format: TournamentFormat, category: TournamentCategory) => {
  try {
    console.log(`Generating demo data for category ${category.name} with format ${format}`);
    
    const teams: Team[] = [];
    const matches: Match[] = [];
    
    // Generate sample team names based on category type
    const teamNamePrefix = getTeamNamePrefixByCategory(category);
    
    // Create 8 teams for this category with realistic names
    for (let i = 1; i <= 8; i++) {
      const teamId = `team-${category.id.substring(0, 4)}-${i}`;
      let players;
      
      // Set up players based on category type
      if (category.type === "MENS_SINGLES" || category.type === "WOMENS_SINGLES") {
        // Singles categories have one player
        const firstName = category.type === "MENS_SINGLES" 
          ? getRandomMaleName() 
          : getRandomFemaleName();
        players = [
          { id: `player-${teamId}-1`, name: `${firstName} ${getRandomLastName()}` }
        ];
      } else {
        // Doubles categories have two players
        const firstName1 = category.type === "WOMENS_DOUBLES" 
          ? getRandomFemaleName() 
          : (category.type === "MENS_DOUBLES" ? getRandomMaleName() : getRandomMaleName());
        
        const firstName2 = category.type === "WOMENS_DOUBLES" 
          ? getRandomFemaleName() 
          : (category.type === "MENS_DOUBLES" ? getRandomMaleName() : getRandomFemaleName());
        
        players = [
          { id: `player-${teamId}-1`, name: `${firstName1} ${getRandomLastName()}` },
          { id: `player-${teamId}-2`, name: `${firstName2} ${getRandomLastName()}` }
        ];
      }
      
      teams.push({
        id: teamId,
        name: `${teamNamePrefix}-${i}`,
        players,
        category: category,
        seed: i
      });
    }
    
    // Create sample matches based on format
    if (format === "ROUND_ROBIN") {
      // Round robin - everyone plays against everyone
      let matchCount = 0;
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          matchCount++;
          matches.push({
            id: `match-${category.id.substring(0, 4)}-${i}-${j}`,
            tournamentId: "sample",
            team1: teams[i],
            team2: teams[j],
            scores: [],
            division: "INITIAL" as Division,
            stage: "INITIAL_ROUND" as TournamentStage,
            status: "SCHEDULED" as MatchStatus,
            scheduledTime: new Date(Date.now() + (matchCount * 3600000)), // Each match 1 hour apart
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
    } else if (format === "DOUBLE_ELIMINATION") {
      // Create basic double elimination matches
      for (let i = 0; i < 4; i++) {
        matches.push({
          id: `match-${category.id.substring(0, 4)}-winners-r1-${i}`,
          tournamentId: "sample",
          team1: teams[i * 2],
          team2: teams[i * 2 + 1],
          scores: [],
          division: "INITIAL" as Division,
          stage: "INITIAL_ROUND" as TournamentStage,
          status: "SCHEDULED" as MatchStatus,
          bracketRound: 1,
          bracketPosition: i,
          scheduledTime: new Date(Date.now() + (i * 3600000)),
          category: category
        });
      }
    } else {
      // MULTI_STAGE or other formats - create some basic matches
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

// Random name generators for more realistic data
function getRandomMaleName(): string {
  const names = ["John", "James", "Robert", "Michael", "William", "David", "Richard", "Thomas", "Charles", "Daniel", "Matthew", "Anthony", "Mark", "Donald", "Steven", "Paul", "Andrew", "Joshua", "Kenneth", "Kevin", "Brian", "George", "Edward", "Ronald", "Timothy", "Jason", "Jeffrey", "Ryan", "Jacob", "Gary", "Nicholas", "Eric", "Jonathan", "Stephen", "Larry", "Justin", "Scott", "Brandon", "Benjamin", "Samuel", "Gregory", "Alexander", "Frank", "Patrick", "Raymond", "Jack", "Dennis", "Jerry", "Tyler", "Aaron", "Jose", "Adam", "Nathan", "Henry", "Douglas", "Zachary", "Peter", "Kyle", "Walter", "Ethan", "Jeremy", "Harold", "Keith", "Christian", "Roger", "Noah", "Gerald", "Carl", "Terry", "Sean", "Austin", "Arthur", "Lawrence", "Jesse", "Dylan", "Bryan", "Joe", "Jordan", "Billy", "Bruce", "Albert", "Willie", "Gabriel", "Logan", "Alan", "Juan", "Wayne", "Roy", "Ralph", "Randy", "Eugene", "Vincent", "Russell", "Elijah", "Louis", "Bobby", "Philip", "Johnny"];
  return names[Math.floor(Math.random() * names.length)];
}

function getRandomFemaleName(): string {
  const names = ["Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen", "Lisa", "Nancy", "Betty", "Margaret", "Sandra", "Ashley", "Kimberly", "Emily", "Donna", "Michelle", "Carol", "Amanda", "Dorothy", "Melissa", "Deborah", "Stephanie", "Rebecca", "Sharon", "Laura", "Cynthia", "Kathleen", "Amy", "Shirley", "Angela", "Helen", "Anna", "Brenda", "Pamela", "Nicole", "Emma", "Samantha", "Katherine", "Christine", "Debra", "Rachel", "Catherine", "Carolyn", "Janet", "Ruth", "Maria", "Heather", "Diane", "Virginia", "Julie", "Joyce", "Victoria", "Olivia", "Kelly", "Christina", "Lauren", "Joan", "Evelyn", "Judith", "Megan", "Cheryl", "Andrea", "Hannah", "Martha", "Jacqueline", "Frances", "Gloria", "Ann", "Teresa", "Kathryn", "Sara", "Janice", "Jean", "Alice", "Madison", "Doris", "Abigail", "Julia", "Judy", "Grace", "Denise", "Amber", "Marilyn", "Beverly", "Danielle", "Theresa", "Sophia", "Marie", "Diana", "Brittany", "Natalie", "Isabella", "Charlotte", "Rose", "Alexis"];
  return names[Math.floor(Math.random() * names.length)];
}

function getRandomLastName(): string {
  const names = ["Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson", "Garcia", "Martinez", "Robinson", "Clark", "Rodriguez", "Lewis", "Lee", "Walker", "Hall", "Allen", "Young", "Hernandez", "King", "Wright", "Lopez", "Hill", "Scott", "Green", "Adams", "Baker", "Gonzalez", "Nelson", "Carter", "Mitchell", "Perez", "Roberts", "Turner", "Phillips", "Campbell", "Parker", "Evans", "Edwards", "Collins", "Stewart", "Sanchez", "Morris", "Rogers", "Reed", "Cook", "Morgan", "Bell", "Murphy", "Bailey", "Rivera", "Cooper", "Richardson", "Cox", "Howard", "Ward", "Torres", "Peterson", "Gray", "Ramirez", "James", "Watson", "Brooks", "Kelly", "Sanders", "Price", "Bennett", "Wood", "Barnes", "Ross", "Henderson", "Coleman", "Jenkins", "Perry", "Powell", "Long", "Patterson", "Hughes", "Flores", "Washington",
  "Butler", "Simmons", "Foster", "Gonzales", "Bryant", "Alexander", "Russell", "Griffin", "Diaz", "Hayes"];
  return names[Math.floor(Math.random() * names.length)];
}
