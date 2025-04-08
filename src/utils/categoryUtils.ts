
import { CategoryType, TournamentFormat } from '@/types/tournament-enums';
import { TournamentCategory } from '@/types/tournament';

// Function to get the display name for a tournament format
export const getFormatDisplayName = (format: TournamentFormat): string => {
  switch (format) {
    case TournamentFormat.SINGLE_ELIMINATION:
      return "Single Elimination";
    case TournamentFormat.DOUBLE_ELIMINATION:
      return "Double Elimination";
    case TournamentFormat.ROUND_ROBIN:
      return "Round Robin";
    case TournamentFormat.GROUP_KNOCKOUT:
      return "Group + Knockout";
    case TournamentFormat.SWISS:
      return "Swiss System";
    case TournamentFormat.MULTI_STAGE:
      return "Multi-Stage Tournament";
    default:
      return format;
  }
};

// Function to get the description for a tournament format
export const getFormatDescription = (format: TournamentFormat): string => {
  switch (format) {
    case TournamentFormat.SINGLE_ELIMINATION:
      return "Single elimination tournaments feature direct knockout matches. Losers are eliminated, and winners advance to the next round until a champion is determined.";
    case TournamentFormat.DOUBLE_ELIMINATION:
      return "Double elimination gives players a second chance by moving them to a losers' bracket after their first loss. Players are eliminated after two losses.";
    case TournamentFormat.ROUND_ROBIN:
      return "Round robin tournaments have each participant play against every other participant. The winner is determined by the best overall record.";
    case TournamentFormat.GROUP_KNOCKOUT:
      return "Group stage followed by knockout rounds. Players are divided into groups for round robin play, then top finishers advance to knockout rounds.";
    case TournamentFormat.SWISS:
      return "Swiss tournaments pair players with similar records in each round. No eliminations until final rounds, ensuring all players get to play all rounds.";
    case TournamentFormat.MULTI_STAGE:
      return "Multi-stage tournaments combine different formats across stages, allowing for flexible progression and division-based competition.";
    default:
      return "Custom tournament format with specialized rules and structure.";
  }
};

// Default tournament categories with demo data flag
export const getDefaultCategories = (): TournamentCategory[] => {
  return [
    {
      id: "mens-singles",
      name: "Men's Singles",
      type: CategoryType.MENS_SINGLES,
      division: "MENS",
      addDemoData: true
    },
    {
      id: "womens-singles",
      name: "Women's Singles",
      type: CategoryType.WOMENS_SINGLES,
      division: "WOMENS",
      addDemoData: true
    },
    {
      id: "mixed-doubles",
      name: "Mixed Doubles",
      type: CategoryType.MIXED_DOUBLES,
      division: "MIXED",
      addDemoData: true
    },
    {
      id: "mens-doubles",
      name: "Men's Doubles",
      type: CategoryType.MENS_DOUBLES,
      division: "MENS",
      addDemoData: true
    },
    {
      id: "womens-doubles",
      name: "Women's Doubles",
      type: CategoryType.WOMENS_DOUBLES,
      division: "WOMENS",
      addDemoData: true
    }
  ];
};

// Get a deep copy of a category
export const cloneCategory = (category: TournamentCategory): TournamentCategory => {
  return JSON.parse(JSON.stringify(category));
};

// Helper function to determine if a format is suitable for singles play
export const isSinglesFormat = (format: TournamentFormat): boolean => {
  return [
    TournamentFormat.SINGLE_ELIMINATION,
    TournamentFormat.DOUBLE_ELIMINATION,
    TournamentFormat.ROUND_ROBIN,
    TournamentFormat.SWISS
  ].includes(format);
};

// Helper function to determine if a format is suitable for team play
export const isTeamFormat = (format: TournamentFormat): boolean => {
  return [
    TournamentFormat.GROUP_KNOCKOUT,
    TournamentFormat.MULTI_STAGE
  ].includes(format);
};
