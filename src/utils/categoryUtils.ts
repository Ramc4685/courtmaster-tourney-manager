
import { CategoryType, TournamentCategory } from "@/types/tournament";

// Default badminton categories
export const DEFAULT_CATEGORIES: Array<{id: CategoryType, name: string}> = [
  { id: "MENS_SINGLES", name: "Men's Singles" },
  { id: "WOMENS_SINGLES", name: "Women's Singles" },
  { id: "MENS_DOUBLES", name: "Men's Doubles" },
  { id: "WOMENS_DOUBLES", name: "Women's Doubles" },
  { id: "MIXED_DOUBLES", name: "Mixed Doubles" },
];

// Create a default set of tournament categories
export const createDefaultCategories = (): TournamentCategory[] => {
  return DEFAULT_CATEGORIES.map(cat => ({
    id: crypto.randomUUID(),
    name: cat.name,
    type: cat.id,
    isCustom: false
  }));
};

// Get a category's name from its type
export const getCategoryName = (type: CategoryType): string => {
  const category = DEFAULT_CATEGORIES.find(cat => cat.id === type);
  return category ? category.name : "Custom Category";
};

// Generate test players based on category (for sample data)
export const generateCategoryPlayers = (category: TournamentCategory, count: number = 8) => {
  const players = [];
  
  // Generate appropriate player names based on category type
  switch(category.type) {
    case "MENS_SINGLES":
    case "MENS_DOUBLES":
      for (let i = 1; i <= count; i++) {
        players.push({
          id: `player-ms-${i}`,
          name: `Player M${i}`,
        });
      }
      break;
    case "WOMENS_SINGLES":
    case "WOMENS_DOUBLES":
      for (let i = 1; i <= count; i++) {
        players.push({
          id: `player-ws-${i}`,
          name: `Player W${i}`,
        });
      }
      break;
    case "MIXED_DOUBLES":
      for (let i = 1; i <= count/2; i++) {
        players.push({
          id: `player-mxm-${i}`,
          name: `Player MX-M${i}`,
        });
        players.push({
          id: `player-mxw-${i}`,
          name: `Player MX-W${i}`,
        });
      }
      break;
    case "CUSTOM":
      for (let i = 1; i <= count; i++) {
        players.push({
          id: `player-custom-${i}`,
          name: `Player C${i}`,
        });
      }
      break;
  }
  
  return players;
};

// Generate test teams based on category
export const generateCategoryTeams = (category: TournamentCategory, count: number = 8) => {
  const teams = [];
  const players = generateCategoryPlayers(category, count * 2); // Double count for doubles categories
  
  switch(category.type) {
    case "MENS_SINGLES":
    case "WOMENS_SINGLES":
      // For singles, each player is their own team
      for (let i = 0; i < count; i++) {
        teams.push({
          id: `team-${category.type.toLowerCase()}-${i+1}`,
          name: players[i].name,
          players: [players[i]],
          category: category
        });
      }
      break;
    case "MENS_DOUBLES":
    case "WOMENS_DOUBLES":
    case "MIXED_DOUBLES":
      // For doubles, pair players
      for (let i = 0; i < count; i++) {
        const player1 = players[i*2];
        const player2 = players[i*2+1];
        teams.push({
          id: `team-${category.type.toLowerCase()}-${i+1}`,
          name: `${player1.name} / ${player2.name}`,
          players: [player1, player2],
          category: category
        });
      }
      break;
    case "CUSTOM":
      // For custom categories, create appropriately named teams
      for (let i = 0; i < count; i++) {
        teams.push({
          id: `team-custom-${i+1}`,
          name: `${category.name} Team ${i+1}`,
          players: [players[i]],
          category: category
        });
      }
      break;
  }
  
  return teams;
};
