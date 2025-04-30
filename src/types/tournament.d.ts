import { 
  UserRole, 
  TournamentFormat, 
  TournamentStageEnum, 
  TournamentStatus, 
  CourtStatus, 
  MatchStatus, 
  AuditLogType,
  Division,
  CategoryType,
  TournamentFormatConfig
} from './tournament-enums';
import { ScoringSettings } from './scoring';

// Export tournament types
export interface Tournament {
  id: string;
  name: string;
  description?: string;
  location: string;
  startDate: string;
  endDate: string;
  registrationDeadline?: Date;
  registrationEnabled: boolean;
  requirePlayerProfile: boolean;
  maxTeams: number;
  format: TournamentFormat;
  formatConfig: TournamentFormatConfig;
  scoring: ScoringSettings;
  status: TournamentStatus;
  categories: TournamentCategory[];
  teams: Team[];
  matches: Match[];
  courts: Court[];
  createdAt: string;
  updatedAt: string;
  organizer_id?: string;
  currentStage?: TournamentStageEnum;
  divisions: Division[];
  stages: TournamentStage[];
  metadata?: Record<string, any>;
}

export interface TournamentCategory {
  id: string;
  name: string;
  type: CategoryType;
  division: Division;
  format?: TournamentFormatConfig;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  createdAt: Date;
  updatedAt: Date;
  division: Division;
}

export interface Player {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  profileId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Court {
  id: string;
  name: string;
  number: number;
  status: CourtStatus;
  tournament_id?: string;
  description?: string;
  currentMatch?: Match;
  createdAt: Date;
  updatedAt: Date;
}

export interface Match {
  id: string;
  tournamentId: string;
  division: Division;
  stage: TournamentStageEnum;
  bracketRound: number;
  bracketPosition: number;
  progression: {
    winnerGoesTo?: string;
    loserGoesTo?: string;
  };
  category: TournamentCategory;
  team1: Team;
  team2: Team;
  team1Id?: string;
  team2Id?: string;
  scores: MatchScore[];
  status: MatchStatus;
  scheduledTime: Date;
  startTime?: Date;
  endTime?: Date;
  courtId?: string;
  courtNumber?: number;
  winner?: number;
  groupName?: string;
  matchNumber?: string;
  scorerName?: string;
}

export interface MatchScore {
  team1Score: number;
  team2Score: number;
}

export interface AuditLog {
  id: string;
  type: AuditLogType;
  userId: string;
  matchId: string;
  tournamentId: string;
  details: Record<string, any>;
  createdAt: Date;
}

export interface StandaloneMatch {
  id: string;
  team1: Team;
  team2: Team;
  team1Id?: string;
  team2Id?: string;
  scores: MatchScore[];
  status: MatchStatus;
  courtName?: string;
  tournamentName?: string;
  categoryName?: string;
  category?: {
    id: string;
    name: string;
    type: string;
  };
  startTime?: Date;
  endTime?: Date;
  winner?: number;
}

// Export enum types
export { 
  MatchStatus, 
  CourtStatus, 
  TournamentFormat, 
  TournamentStatus, 
  TournamentStageEnum as TournamentStage
};

export type ScorerType = "TOURNAMENT" | "STANDALONE";
