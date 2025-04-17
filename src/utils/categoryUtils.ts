
import { TournamentFormat, Division, PlayType } from '@/types/tournament-enums';

export const getFormatDisplayName = (format: TournamentFormat): string => {
  switch (format) {
    case TournamentFormat.SINGLE_ELIMINATION:
      return 'Single Elimination';
    case TournamentFormat.DOUBLE_ELIMINATION:
      return 'Double Elimination';
    case TournamentFormat.ROUND_ROBIN:
      return 'Round Robin';
    case TournamentFormat.GROUP_KNOCKOUT:
      return 'Group + Knockout';
    case TournamentFormat.SWISS:
      return 'Swiss System';
    case TournamentFormat.MULTI_STAGE:
      return 'Multi-Stage';
    default:
      return 'Custom Format';
  }
};

export const getFormatDescription = (format: TournamentFormat): string => {
  switch (format) {
    case TournamentFormat.SINGLE_ELIMINATION:
      return 'Players are eliminated after one loss. The last player standing wins.';
    case TournamentFormat.DOUBLE_ELIMINATION:
      return 'Players must lose twice to be eliminated. Provides a second chance.';
    case TournamentFormat.ROUND_ROBIN:
      return 'Each player plays against every other player. Most wins determines the champion.';
    case TournamentFormat.GROUP_KNOCKOUT:
      return 'Initial group stage followed by elimination rounds with top performers.';
    case TournamentFormat.SWISS:
      return 'Players meet opponents with similar records without elimination.';
    case TournamentFormat.MULTI_STAGE:
      return 'Complex tournament with multiple consecutive stages.';
    default:
      return 'Customized tournament format.';
  }
};

export const getDivisionDisplayName = (division: Division): string => {
  switch (division) {
    case Division.OPEN:
      return 'Open';
    case Division.MENS:
      return 'Men\'s';
    case Division.WOMENS:
      return 'Women\'s';
    case Division.MIXED:
      return 'Mixed';
    case Division.JUNIORS:
    case Division.JUNIOR:
      return 'Juniors';
    case Division.SENIORS:
      return 'Seniors';
    case Division.BEGINNER:
      return 'Beginner';
    case Division.INTERMEDIATE:
      return 'Intermediate';
    case Division.ADVANCED:
      return 'Advanced';
    case Division.PRO:
      return 'Professional';
    default:
      return 'Custom Division';
  }
};

export const getPlayTypeDisplayName = (playType: PlayType): string => {
  switch (playType) {
    case PlayType.SINGLES:
      return 'Singles';
    case PlayType.DOUBLES:
      return 'Doubles';
    case PlayType.MIXED:
      return 'Mixed Doubles';
    default:
      return 'Unknown';
  }
};
