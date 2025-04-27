
import { UserRole, TournamentFormat, TournamentStageEnum as TournamentStage, TournamentStatus, CourtStatus, MatchStatus, AuditLogType } from './tournament-enums';

// Export tournament types
export interface Tournament {
  id: string;
  name: string;
  description?: string;
  location: string;
  startDate: Date;
  endDate: Date;
  registrationDeadline?: Date;
  registrationEnabled: boolean;
  requirePlayerProfile: boolean;
  maxTeams: number;
  format: TournamentFormat;
  status: TournamentStatus;
  categories: TournamentCategory[];
  teams: Team[];
  matches: Match[];
  courts: Court[];
  scoringSettings: ScoringSettings;
  createdAt: Date;
  updatedAt: Date;
  organizer_id?: string;
}

export interface TournamentCategory {
  id: string;
  name: string;
  type: string;
  division: Division;
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
  stage: TournamentStage;
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

export interface ScoringSettings {
  pointsToWin: number;
  mustWinByTwo: boolean;
  maxPoints: number;
  matchFormat: string;
}

// Export Division interface with required properties
export interface Division {
  id: string;
  name: string;
  type: string;
  capacity?: number;
  categories?: any[];
  min_age?: number;
  max_age?: number;
  gender?: string;
  skill_level?: string;
}

// Export enum types
export { MatchStatus, CourtStatus, TournamentFormat, TournamentStatus, TournamentStage };
export type CategoryType = string;
export type ScorerType = "TOURNAMENT" | "STANDALONE";
