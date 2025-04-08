import { TournamentFormat, CategoryType } from '@/types/tournament-enums';
import { TournamentCategory } from '@/types/tournament';

// Get display name for tournament formats
export const getFormatDisplayName = (format: TournamentFormat): string => {
  switch (format) {
    case TournamentFormat.SINGLE_ELIMINATION:
      return "Single Elimination";
    case TournamentFormat.DOUBLE_ELIMINATION:
      return "Double Elimination";
    case TournamentFormat.ROUND_ROBIN:
      return "Round Robin";
    case TournamentFormat.SWISS:
      return "Swiss System";
    case TournamentFormat.GROUP_KNOCKOUT:
      return "Group + Knockout";
    case TournamentFormat.MULTI_STAGE:
      return "Multi-Stage";
    default:
      return format.replace(/_/g, ' ');
  }
};

// Get description for tournament formats
export const getFormatDescription = (format: TournamentFormat): string => {
  switch (format) {
    case TournamentFormat.SINGLE_ELIMINATION:
      return "Lose once and you're out. Simple bracket format.";
    case TournamentFormat.DOUBLE_ELIMINATION:
      return "Players must lose twice to be eliminated. More games, more chances.";
    case TournamentFormat.ROUND_ROBIN:
      return "Everyone plays against everyone. Most wins determines the champion.";
    case TournamentFormat.SWISS:
      return "Fixed number of rounds with opponents of similar records paired.";
    case TournamentFormat.GROUP_KNOCKOUT:
      return "Round-robin groups followed by single elimination playoffs.";
    case TournamentFormat.MULTI_STAGE:
      return "Multiple stages with different formats (groups, playoffs, etc).";
    default:
      return "Custom tournament format.";
  }
};

// Other category utility functions would go here
