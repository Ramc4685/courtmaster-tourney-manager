// src/types/tournament.d.ts

export type TournamentStatus = 'DRAFT' | 'PUBLISHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type MatchStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type CourtStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
export type TournamentFormat = 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION' | 'ROUND_ROBIN' | 'SWISS' | 'MULTI_STAGE';
export type TournamentStage = 'INITIAL_ROUND' | 'DIVISION_PLACEMENT' | 'PLAYOFF_KNOCKOUT' | 'FINAL';
export type Division = 'INITIAL' | 'DIVISION_1' | 'DIVISION_2' | 'DIVISION_3';
export type CategoryType = 'MENS_SINGLES' | 'WOMENS_SINGLES' | 'MENS_DOUBLES' | 'WOMENS_DOUBLES' | 'MIXED_DOUBLES';

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  location?: string;
  startDate?: Date;
  endDate?: Date;
  status: TournamentStatus;
  format: TournamentFormat;
  currentStage?: TournamentStage;
  teams: Team[];
  matches: Match[];
  courts: Court[];
  categories?: Category[];
  scoringSettings?: ScoringSettings;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  seed?: number;
  division?: Division;
  category?: Category;
  tournamentId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Player {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  teamId?: string;
}

export interface Match {
  id: string;
  matchNumber?: string;
  team1: Team;
  team2: Team;
  scores: MatchScore[];
  courtNumber?: number;
  courtName?: string;
  scheduledTime?: Date;
  endTime?: Date;
  winner?: Team;
  status: MatchStatus;
  division?: string;
  tournamentId?: string;
  round?: string;
  category?: Category;
  groupId?: string;
  groupName?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  scorerName?: string;
  auditLogs?: AuditLog[];
}

// StandaloneMatch extends Match and can have additional properties specific to standalone matches
export interface StandaloneMatch extends Match {
  // We can add standalone-specific properties here if needed
  // For now it's identical to Match
}

export interface MatchScore {
  team1Score: number;
  team2Score: number;
  scoredBy?: string;
  timestamp?: string;
}

export interface Court {
  id: string;
  name: string;
  number: number;
  status: CourtStatus;
  currentMatch?: Match;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  description?: string;
  minPlayers?: number;
  maxPlayers?: number;
}

export interface ScoringSettings {
  maxSets: number;
  pointsToWin: number;
  maxPoints: number;
  winByTwo: boolean;
  setsToWin: number;
}

export interface AuditLog {
  timestamp: Date;
  userId?: string;
  userName?: string;
  action: string;
  details?: string;
}

export interface ScheduleSettings {
  startTime: Date;
  endTime: Date;
  matchDuration: number; // in minutes
  breakBetweenMatches: number; // in minutes
  courtsToUse: string[]; // court IDs
}

export interface TournamentStats {
  totalTeams: number;
  totalMatches: number;
  completedMatches: number;
  inProgressMatches: number;
  scheduledMatches: number;
  totalCourts: number;
  availableCourts: number;
}
