import { Match, Team } from '@/types';

export interface StageGenerator {
  /**
   * Validates that the provided teams meet the requirements for this stage generator
   * @throws {ValidationError} if requirements are not met
   */
  validateRequirements(teams: Team[]): void;

  /**
   * Generates matches for the stage based on the provided teams
   * @returns Array of generated matches
   */
  generateMatches(teams: Team[]): Match[];

  /**
   * Handles progression of a completed match, updating the next match in the bracket
   * @param completedMatch The match that was just completed
   * @param allMatches All matches in the tournament for reference
   */
  handleProgression(completedMatch: Match, allMatches: Match[]): void;
} 