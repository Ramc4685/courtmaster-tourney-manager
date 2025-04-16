import { Tournament, Match, Team } from '@/types/tournament';
import { TournamentStage, TournamentFormat } from '@/types/tournament-enums';

export interface StageTransition {
  from: TournamentStage;
  to: TournamentStage;
  requirements: TransitionRequirement[];
}

export interface TransitionRequirement {
  type: 'MATCHES_COMPLETE' | 'MINIMUM_TEAMS' | 'VALID_BRACKETS';
  validator: (tournament: Tournament) => boolean;
}

export interface ProgressionMetadata {
  currentRound: number;
  nextMatchId?: string;
  bracketPosition: string;
  path: 'WINNERS' | 'LOSERS' | 'CONSOLATION';
}

export interface MatchProgression {
  nextMatchId?: string;
  nextMatchPosition?: 'team1' | 'team2';
  loserMatchId?: string;
  loserMatchPosition?: 'team1' | 'team2';
  roundNumber: number;
  bracketPosition: number;
}

export interface FormatConfig {
  seedingEnabled: boolean;
  consolationBracket: boolean;
  thirdPlaceMatch: boolean;
  scoringSettings: any; // Will be replaced with proper type
}

export interface TournamentFormatHandler {
  formatName: string;
  description: string;
  generateMatches(teams: Team[], config?: FormatConfig): Match[];
  validateFormat(tournament: Tournament): { isValid: boolean; errors: string[] };
  generateBracket(teams: Team[], config?: FormatConfig): Match[];
  getNextRoundMatches(matches: Match[], currentRound: number): Match[];
  updateMatchProgression(tournament: Tournament, completedMatch: Match): Tournament;
} 