import { Tournament, Match } from '@/types/tournament';
import { TournamentStage } from '@/types/tournament-enums';
import { STAGE_REQUIREMENTS, VALID_STAGE_TRANSITIONS } from './constants';

export function validateStageTransition(from: TournamentStage, to: TournamentStage): boolean {
  const validTransitions = VALID_STAGE_TRANSITIONS[from];
  return validTransitions.includes(to);
}

export function validateStageRequirements(tournament: Tournament, stage: TournamentStage): { 
  isValid: boolean; 
  errors: string[] 
} {
  const requirements = STAGE_REQUIREMENTS[stage];
  const errors: string[] = [];

  // Check minimum teams
  if (tournament.teams.length < requirements.minTeams) {
    errors.push(`Minimum of ${requirements.minTeams} teams required for ${stage}`);
  }

  // Check maximum teams if defined
  if (requirements.maxTeams && tournament.teams.length > requirements.maxTeams) {
    errors.push(`Maximum of ${requirements.maxTeams} teams allowed for ${stage}`);
  }

  // Check seeding requirement
  if (requirements.requiresSeeding) {
    const unseededTeams = tournament.teams.filter(team => !team.seed);
    if (unseededTeams.length > 0) {
      errors.push(`All teams must be seeded for ${stage}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateMatchProgression(match: Match): { 
  isValid: boolean; 
  errors: string[] 
} {
  const errors: string[] = [];

  // Validate progression metadata
  if (match.progression) {
    if (match.progression.nextMatchId) {
      if (!match.progression.nextMatchPosition) {
        errors.push('Next match position must be specified when next match ID is present');
      }
    }

    if (match.progression.loserMatchId) {
      if (!match.progression.loserMatchPosition) {
        errors.push('Loser match position must be specified when loser match ID is present');
      }
    }

    if (match.progression.bracketPosition <= 0) {
      errors.push('Bracket position must be a positive number');
    }

    if (match.progression.roundNumber <= 0) {
      errors.push('Round number must be a positive number');
    }
  } else {
    errors.push('Match progression metadata is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
} 