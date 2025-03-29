
import { Tournament, TournamentFormat, TournamentCategory, Match, Team } from "@/types/tournament";
import { createSampleData as generateSampleData, createSampleTeams, createSampleCourts, createSampleTournament } from "./sampleDataGenerator";
import { generateId } from "./tournamentUtils";
import { TournamentFormatService } from "@/services/tournament/formats/TournamentFormatService";

// Create general sample data
export const createSampleData = (): Tournament => {
  return generateSampleData();
};

// Get sample data by format
export const getSampleDataByFormat = (format: TournamentFormat): Tournament => {
  const sampleTournament = createSampleTournament(format);
  const sampleTeams = createSampleTeams(sampleTournament.categories);
  const sampleCourts = createSampleCourts();
  
  // Generate matches based on format
  let sampleMatches: Match[] = [];
  
  // Generate matches for each category using the appropriate format handler
  sampleTournament.categories.forEach(category => {
    // Get teams for this category
    const categoryTeams = sampleTeams.filter(team => 
      team.category && team.category.id === category.id
    );
    
    if (categoryTeams.length >= 2) {
      // Use the category format if available, otherwise use the tournament format
      const formatToUse = category.format || format;
      
      // Generate matches using the format handler
      const formatMatches = TournamentFormatService.generateMatchesForCategory(
        formatToUse,
        categoryTeams,
        category
      );
      
      // Update tournament ID in all matches
      const matchesWithCorrectTournamentId = formatMatches.map(match => ({
        ...match,
        tournamentId: sampleTournament.id
      }));
      
      sampleMatches = [...sampleMatches, ...matchesWithCorrectTournamentId];
    }
  });
  
  return {
    ...sampleTournament,
    teams: sampleTeams,
    courts: sampleCourts,
    matches: sampleMatches
  };
};

// Generate demo data for a specific category and format
export const getCategoryDemoData = (
  format: TournamentFormat,
  category: TournamentCategory
): { teams: Team[], matches: Match[] } => {
  console.log(`Generating demo data for category ${category.name} with format ${format}`);
  
  // Generate category-specific team names based on category type
  const teamNames = generateTeamNamesForCategory(category, 8);
  
  // Create teams
  const teams: Team[] = teamNames.map((name, index) => {
    // Create 1-2 players based on if it's singles or doubles
    const isSingles = 
      category.type === "MENS_SINGLES" || 
      category.type === "WOMENS_SINGLES";
    
    const playerCount = isSingles ? 1 : 2;
    
    const players = Array(playerCount).fill(0).map((_, i) => ({
      id: generateId(),
      name: generatePlayerName(category, index * playerCount + i)
    }));
    
    return {
      id: `team-${category.id}-${index + 1}`,
      name,
      players,
      seed: index + 1,
      category: category
    };
  });
  
  // Generate matches using the format handler
  const matches = TournamentFormatService.generateMatchesForCategory(
    format,
    teams,
    category
  );
  
  return { teams, matches };
};

// Helper function to generate realistic team names based on category
function generateTeamNamesForCategory(category: TournamentCategory, count: number): string[] {
  const names: string[] = [];
  
  // Base names for different category types
  const mensNames = [
    "Thunder Hawks", "Royal Eagles", "Power Smashers", "Ace Masters", 
    "Swift Strikes", "Elite Shuttlers", "Victory Kings", "Rapid Rackets"
  ];
  
  const womensNames = [
    "Fierce Phoenixes", "Star Strikers", "Swift Swans", "Power Queens", 
    "Rapid Ravens", "Elite Angels", "Victory Valkyries", "Ace Amazons"
  ];
  
  const mixedNames = [
    "Dynamic Duo", "Perfect Pair", "Twin Tigers", "Sync Stars", 
    "Match Masters", "Rally Royals", "Double Dynamite", "Unity Force"
  ];
  
  // Select appropriate names based on category type
  let baseNames: string[] = [];
  
  switch (category.type) {
    case "MENS_SINGLES":
    case "MENS_DOUBLES":
      baseNames = mensNames;
      break;
    case "WOMENS_SINGLES":
    case "WOMENS_DOUBLES":
      baseNames = womensNames;
      break;
    case "MIXED_DOUBLES":
      baseNames = mixedNames;
      break;
    case "CUSTOM":
    default:
      // For custom categories, mix all names
      baseNames = [...mensNames, ...womensNames, ...mixedNames];
      break;
  }
  
  // Generate unique names
  for (let i = 0; i < count; i++) {
    const nameIndex = i % baseNames.length;
    names.push(baseNames[nameIndex]);
  }
  
  return names;
}

// Helper function to generate player names based on category
function generatePlayerName(category: TournamentCategory, index: number): string {
  // Men's first names
  const mensFirstNames = [
    "James", "John", "Robert", "Michael", "William", "David", "Richard", "Thomas",
    "Charles", "Daniel", "Matthew", "Anthony", "Mark", "Donald", "Steven", "Andrew"
  ];
  
  // Women's first names
  const womensFirstNames = [
    "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica",
    "Sarah", "Karen", "Nancy", "Lisa", "Margaret", "Betty", "Sandra", "Ashley"
  ];
  
  // Last names
  const lastNames = [
    "Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson",
    "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin"
  ];
  
  // Select first name based on category type
  let firstName = "";
  let lastName = lastNames[index % lastNames.length];
  
  switch (category.type) {
    case "MENS_SINGLES":
    case "MENS_DOUBLES":
      firstName = mensFirstNames[index % mensFirstNames.length];
      break;
    case "WOMENS_SINGLES":
    case "WOMENS_DOUBLES":
      firstName = womensFirstNames[index % womensFirstNames.length];
      break;
    case "MIXED_DOUBLES":
      // For mixed doubles, alternate between men's and women's names
      firstName = index % 2 === 0 
        ? mensFirstNames[Math.floor(index / 2) % mensFirstNames.length]
        : womensFirstNames[Math.floor(index / 2) % womensFirstNames.length];
      break;
    case "CUSTOM":
    default:
      // For custom categories, use a mix
      const allFirstNames = [...mensFirstNames, ...womensFirstNames];
      firstName = allFirstNames[index % allFirstNames.length];
      break;
  }
  
  return `${firstName} ${lastName}`;
}
