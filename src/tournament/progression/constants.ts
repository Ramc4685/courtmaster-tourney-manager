import { TournamentStage } from '@/types/tournament-enums';

export const VALID_STAGE_TRANSITIONS: Record<TournamentStage, TournamentStage[]> = {
  [TournamentStage.REGISTRATION]: [TournamentStage.GROUP_STAGE, TournamentStage.INITIAL_ROUND],
  [TournamentStage.INITIAL_ROUND]: [TournamentStage.GROUP_STAGE, TournamentStage.KNOCKOUT_STAGE],
  [TournamentStage.GROUP_STAGE]: [TournamentStage.KNOCKOUT_STAGE, TournamentStage.QUARTERFINALS],
  [TournamentStage.KNOCKOUT_STAGE]: [TournamentStage.QUARTERFINALS, TournamentStage.SEMIFINALS],
  [TournamentStage.QUARTERFINALS]: [TournamentStage.SEMIFINALS],
  [TournamentStage.SEMIFINALS]: [TournamentStage.FINALS],
  [TournamentStage.FINALS]: [TournamentStage.DIVISION_PLACEMENT],
  [TournamentStage.DIVISION_PLACEMENT]: [TournamentStage.PLAYOFF_KNOCKOUT],
  [TournamentStage.PLAYOFF_KNOCKOUT]: []
};

export const STAGE_REQUIREMENTS = {
  [TournamentStage.REGISTRATION]: {
    minTeams: 2,
    maxTeams: undefined,
    requiresSeeding: false,
  },
  [TournamentStage.INITIAL_ROUND]: {
    minTeams: 2,
    maxTeams: undefined,
    requiresSeeding: true,
  },
  [TournamentStage.GROUP_STAGE]: {
    minTeams: 3,
    maxTeams: undefined,
    requiresSeeding: true,
  },
  [TournamentStage.KNOCKOUT_STAGE]: {
    minTeams: 2,
    maxTeams: undefined,
    requiresSeeding: true,
  },
  [TournamentStage.QUARTERFINALS]: {
    minTeams: 4,
    maxTeams: 8,
    requiresSeeding: true,
  },
  [TournamentStage.SEMIFINALS]: {
    minTeams: 2,
    maxTeams: 4,
    requiresSeeding: false,
  },
  [TournamentStage.FINALS]: {
    minTeams: 2,
    maxTeams: 2,
    requiresSeeding: false,
  },
  [TournamentStage.DIVISION_PLACEMENT]: {
    minTeams: 2,
    maxTeams: undefined,
    requiresSeeding: true,
  },
  [TournamentStage.PLAYOFF_KNOCKOUT]: {
    minTeams: 2,
    maxTeams: undefined,
    requiresSeeding: true,
  }
}; 