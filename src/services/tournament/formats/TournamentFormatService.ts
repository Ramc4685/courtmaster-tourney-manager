import { Tournament, Team, Match, TournamentFormat, TournamentCategory, ScoringSettings } from "@/types/tournament";
import { SingleEliminationFormat } from "./SingleEliminationFormat";
import { DoubleEliminationFormat } from "./DoubleEliminationFormat";
import { RoundRobinFormat } from "./RoundRobinFormat";
import { SwissFormat } from "./SwissFormat";
import { GroupKnockoutFormat } from "./GroupKnockoutFormat";
import { MultiStageFormat } from "./MultiStageFormat";

// Configuration interfaces for different formats
export interface FormatConfig {
  seedingEnabled: boolean;
  consolationBracket: boolean;
  thirdPlaceMatch: boolean;
  scoringSettings: ScoringSettings;
}

export interface MatchProgression {
  nextMatchId?: string;
  nextMatchPosition?: 'team1' | 'team2';
  loserMatchId?: string;
  loserMatchPosition?: 'team1' | 'team2';
  roundNumber: number;
  bracketPosition: number;
}

// Base interface that all format implementations must follow
export interface TournamentFormatHandler {
  // Core methods
  generateMatches(teams: Team[], category: TournamentCategory, config?: FormatConfig): Match[];
  validateFormat(tournament: Tournament): { isValid: boolean; errors: string[] };
  
  // Bracket generation and progression
  generateBracket(teams: Team[], config?: FormatConfig): Match[];
  getNextRoundMatches(matches: Match[], currentRound: number): Match[];
  updateMatchProgression(tournament: Tournament, completedMatch: Match): Tournament;
  
  // Seeding and team management
  generateSeeds(teams: Team[]): Team[];
  handleByes(teams: Team[]): { matches: Match[]; byes: Team[] };
  
  // Format-specific scoring
  validateScore(match: Match, score: number[]): boolean;
  calculateStandings(tournament: Tournament): Team[];
  
  // Format metadata
  formatName: string;
  description: string;
  faq: string[];
  defaultConfig: FormatConfig;
  
  // Optional methods with default implementations
  canAddTeams?: (tournament: Tournament) => boolean;
  canRemoveTeams?: (tournament: Tournament) => boolean;
  getRequiredTeamCount?: () => { min: number; max?: number };
}

// Factory class to get the appropriate format handler
export class TournamentFormatService {
  private static formatHandlers: Record<TournamentFormat, TournamentFormatHandler> = {
    "SINGLE_ELIMINATION": new SingleEliminationFormat(),
    "DOUBLE_ELIMINATION": new DoubleEliminationFormat(),
    "ROUND_ROBIN": new RoundRobinFormat(),
    "SWISS": new SwissFormat(),
    "GROUP_KNOCKOUT": new GroupKnockoutFormat(),
    "MULTI_STAGE": new MultiStageFormat()
  };

  // Get the appropriate format handler
  static getFormatHandler(format: TournamentFormat): TournamentFormatHandler {
    const handler = this.formatHandlers[format];
    if (!handler) {
      console.error(`No handler found for format: ${format}`);
      // Default to single elimination if no handler found
      return this.formatHandlers["SINGLE_ELIMINATION"];
    }
    return handler;
  }

  // Generate matches for a specific format and category
  static generateMatchesForCategory(
    format: TournamentFormat,
    teams: Team[],
    category: TournamentCategory,
    config?: FormatConfig
  ): Match[] {
    const handler = this.getFormatHandler(format);
    return handler.generateMatches(teams, category, config);
  }

  // Validate tournament format
  static validateTournament(tournament: Tournament): { isValid: boolean; errors: string[] } {
    const handler = this.getFormatHandler(tournament.format);
    return handler.validateFormat(tournament);
  }

  // Update match progression
  static updateProgression(tournament: Tournament, completedMatch: Match): Tournament {
    const handler = this.getFormatHandler(tournament.format);
    return handler.updateMatchProgression(tournament, completedMatch);
  }

  // Get standings for a tournament
  static getStandings(tournament: Tournament): Team[] {
    const handler = this.getFormatHandler(tournament.format);
    return handler.calculateStandings(tournament);
  }

  // Get documentation for a specific format
  static getFormatDocumentation(format: TournamentFormat): {
    name: string;
    description: string;
    faq: string[];
    defaultConfig: FormatConfig;
  } {
    const handler = this.getFormatHandler(format);
    return {
      name: handler.formatName,
      description: handler.description,
      faq: handler.faq,
      defaultConfig: handler.defaultConfig
    };
  }

  // Get a list of all available formats with descriptions
  static getAllFormats(): Array<{
    id: TournamentFormat;
    name: string;
    description: string;
    defaultConfig: FormatConfig;
  }> {
    return Object.entries(this.formatHandlers).map(([id, handler]) => ({
      id: id as TournamentFormat,
      name: handler.formatName,
      description: handler.description,
      defaultConfig: handler.defaultConfig
    }));
  }
}
