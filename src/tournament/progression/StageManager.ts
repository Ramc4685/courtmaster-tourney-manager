import { Tournament, Match, TournamentStage, TournamentFormat } from '@/types/tournament';
import { GroupStageGenerator } from './generators/group-stage';
import { EliminationStageGenerator } from './generators/elimination';
import { FinalsGenerator } from './generators/finals';
import { ValidationError } from '@/utils/errors';
import { STAGE_REQUIREMENTS } from './constants';

export class StageManager {
  private groupStageGenerator: GroupStageGenerator;
  private eliminationGenerator: EliminationStageGenerator;
  private finalsGenerator: FinalsGenerator;

  constructor() {
    this.groupStageGenerator = new GroupStageGenerator();
    this.eliminationGenerator = new EliminationStageGenerator();
    this.finalsGenerator = new FinalsGenerator();
  }

  /**
   * Validates if a stage transition is allowed
   */
  validateStageTransition(tournament: Tournament, nextStage: TournamentStage): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const requirements = STAGE_REQUIREMENTS[nextStage];

    if (!requirements) {
      errors.push(`Invalid stage: ${nextStage}`);
      return { isValid: false, errors };
    }

    // Check minimum team requirement
    if (requirements.minTeams && tournament.teams.length < requirements.minTeams) {
      errors.push(`Minimum ${requirements.minTeams} teams required for ${nextStage}`);
    }

    // Check maximum team requirement
    if (requirements.maxTeams && tournament.teams.length > requirements.maxTeams) {
      errors.push(`Maximum ${requirements.maxTeams} teams allowed for ${nextStage}`);
    }

    // Check seeding requirement
    if (requirements.requiresSeeding && tournament.seedingEnabled) {
      const unseededTeams = tournament.teams.filter(team => !team.seed);
      if (unseededTeams.length > 0) {
        errors.push(`All teams must be seeded for ${nextStage}`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Generates matches for the next stage based on current stage results
   */
  generateNextStageMatches(tournament: Tournament): Match[] {
    const validation = this.validateStageTransition(tournament, tournament.currentStage);
    if (!validation.isValid) {
      throw new ValidationError(`Cannot generate matches: ${validation.errors.join(', ')}`);
    }

    try {
      switch (tournament.currentStage) {
        case TournamentStage.GROUP_STAGE:
          return this.groupStageGenerator.generateMatches(tournament);

        case TournamentStage.ELIMINATION_ROUND:
          return this.eliminationGenerator.generateMatches(tournament);

        case TournamentStage.FINALS:
          return this.finalsGenerator.generateMatches(tournament);

        case TournamentStage.REGISTRATION:
        case TournamentStage.SEEDING:
          // These stages don't generate matches
          return [];

        default:
          throw new Error(`Unsupported stage: ${tournament.currentStage}`);
      }
    } catch (error) {
      throw new Error(`Failed to generate matches: ${error.message}`);
    }
  }

  /**
   * Checks if the current stage is complete
   */
  isStageComplete(tournament: Tournament, stage: TournamentStage): boolean {
    const stageMatches = tournament.matches.filter(match => match.stage === stage);
    
    if (stageMatches.length === 0) {
      // If there are no matches for this stage, it's considered complete
      return true;
    }

    // Check if all matches in the stage are completed
    return stageMatches.every(match => match.status === 'COMPLETED');
  }

  /**
   * Advances tournament to the next stage if possible
   */
  advanceStage(tournament: Tournament): Tournament {
    // Get the next stage based on the tournament format and current stage
    const nextStage = this.determineNextStage(tournament);
    
    // Validate the transition
    const validation = this.validateStageTransition(tournament, nextStage);
    if (!validation.isValid) {
      throw new ValidationError(`Cannot advance stage: ${validation.errors.join(', ')}`);
    }

    // Check if current stage is complete
    if (!this.isStageComplete(tournament, tournament.currentStage)) {
      throw new ValidationError('Cannot advance stage: current stage matches are not complete');
    }

    // Generate matches for the next stage
    const nextStageMatches = this.generateNextStageMatches({
      ...tournament,
      currentStage: nextStage
    });

    // Return updated tournament
    return {
      ...tournament,
      currentStage: nextStage,
      matches: [...tournament.matches, ...nextStageMatches],
      updatedAt: new Date()
    };
  }

  /**
   * Determines the next stage based on tournament format and current stage
   */
  private determineNextStage(tournament: Tournament): TournamentStage {
    const format = tournament.format;
    
    switch (tournament.currentStage) {
      case TournamentStage.REGISTRATION:
        return TournamentStage.SEEDING;
        
      case TournamentStage.SEEDING:
        return format.type === TournamentFormat.ROUND_ROBIN 
          ? TournamentStage.GROUP_STAGE 
          : TournamentStage.ELIMINATION_ROUND;
        
      case TournamentStage.GROUP_STAGE:
        return format.type === TournamentFormat.ROUND_ROBIN 
          ? TournamentStage.FINALS 
          : TournamentStage.ELIMINATION_ROUND;
        
      case TournamentStage.ELIMINATION_ROUND:
        return TournamentStage.FINALS;
        
      case TournamentStage.FINALS:
        return TournamentStage.COMPLETED;
        
      default:
        throw new Error(`Invalid current stage: ${tournament.currentStage}`);
    }
  }
} 