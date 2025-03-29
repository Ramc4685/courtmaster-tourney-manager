
import { TournamentCategory, CategoryType } from '@/types/tournament';

// Creates default categories with formats for a new tournament
export const createDefaultCategories = (): TournamentCategory[] => {
  return [
    {
      id: crypto.randomUUID(),
      name: "Men's Singles",
      type: "MENS_SINGLES" as CategoryType,
      format: "SINGLE_ELIMINATION",
      addDemoData: false
    },
    {
      id: crypto.randomUUID(),
      name: "Women's Singles",
      type: "WOMENS_SINGLES" as CategoryType,
      format: "SINGLE_ELIMINATION",
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
