
import { Tournament, Team, Match, TournamentFormat, TournamentCategory } from "@/types/tournament";
import { SingleEliminationFormat } from "./SingleEliminationFormat";
import { DoubleEliminationFormat } from "./DoubleEliminationFormat";
import { RoundRobinFormat } from "./RoundRobinFormat";
import { SwissFormat } from "./SwissFormat";
import { GroupKnockoutFormat } from "./GroupKnockoutFormat";
import { MultiStageFormat } from "./MultiStageFormat";

// Base interface that all format implementations must follow
export interface TournamentFormatHandler {
  generateMatches(teams: Team[], category: TournamentCategory): Match[];
  formatName: string;
  description: string;
  faq: string[];
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

  // Generate sample matches for a specific format and category
  static generateMatchesForCategory(
    format: TournamentFormat,
    teams: Team[],
    category: TournamentCategory
  ): Match[] {
    const handler = this.getFormatHandler(format);
    return handler.generateMatches(teams, category);
  }

  // Get documentation for a specific format
  static getFormatDocumentation(format: TournamentFormat): {
    name: string;
    description: string;
    faq: string[];
  } {
    const handler = this.getFormatHandler(format);
    return {
      name: handler.formatName,
      description: handler.description,
      faq: handler.faq
    };
  }

  // Get a list of all available formats with descriptions
  static getAllFormats(): Array<{
    id: TournamentFormat;
    name: string;
    description: string;
  }> {
    return Object.entries(this.formatHandlers).map(([id, handler]) => ({
      id: id as TournamentFormat,
      name: handler.formatName,
      description: handler.description
    }));
  }
}
