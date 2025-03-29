
import { TournamentFormat, Match, TournamentCategory, Tournament, Team } from "@/types/tournament";

// Helper function to filter matches by category
export const getMatchesByCategory = (matches: Match[], categoryId: string): Match[] => {
  return matches.filter(match => match.category?.id === categoryId);
};

// Helper function to filter teams by category
export const getTeamsByCategory = (teams: Team[], categoryId: string): Team[] => {
  return teams.filter(team => team.category?.id === categoryId);
};

// Get a filtered tournament with only the matches and teams for a specific category
export const getFilteredTournamentByCategory = (
  tournament: Tournament,
  categoryId: string
): Tournament => {
  return {
    ...tournament,
    matches: getMatchesByCategory(tournament.matches, categoryId),
    teams: getTeamsByCategory(tournament.teams, categoryId)
  };
};

// Get format configuration details based on the format type
export const getFormatDetails = (format: TournamentFormat): string => {
  switch (format) {
    case "SINGLE_ELIMINATION":
      return "Teams play in direct elimination matches. Losers are eliminated, winners advance to the next round until a champion is determined.";
    
    case "DOUBLE_ELIMINATION":
      return "Teams must lose twice to be eliminated. After one loss, teams move to a losers bracket for a second chance.";
    
    case "ROUND_ROBIN":
      return "Each team plays against every other team once. The winner is determined based on the number of wins or total points.";
    
    case "SWISS":
      return "Teams are paired with others having similar records in each round, with no rematches. Final standings are based on total wins.";
    
    case "GROUP_KNOCKOUT":
      return "Teams compete in round-robin groups, with top finishers advancing to a knockout stage.";
    
    case "MULTI_STAGE":
      return "A tournament with multiple progressive stages, including group play, division placement, and final playoffs.";
    
    default:
      return "Custom tournament format.";
  }
};

// Check if a tournament has multiple active categories
export const hasMultipleCategories = (tournament: Tournament): boolean => {
  return tournament.categories.length > 1;
};

// Get the category name for a match
export const getCategoryNameForMatch = (match: Match, tournament: Tournament): string => {
  if (match.category?.id) {
    const category = tournament.categories.find(c => c.id === match.category.id);
    return category ? category.name : "Unknown Category";
  }
  return "General";
};
