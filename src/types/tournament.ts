
// Define types for tournament-related entities
export type TournamentStatus = "DRAFT" | "PUBLISHED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type MatchStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "DEFERRED";
export type CourtStatus = "AVAILABLE" | "IN_USE" | "MAINTENANCE";
export type DivisionType = "MENS" | "WOMENS" | "MIXED";
export type StageType = "GROUP" | "KNOCKOUT" | "FINAL";
export type ScorerType = "MANUAL" | "AUTOMATIC" | "TOURNAMENT" | "STANDALONE";
export type TournamentFormat = "SINGLE_ELIMINATION" | "DOUBLE_ELIMINATION" | "ROUND_ROBIN" | "GROUP_KNOCKOUT" | "SWISS" | "MULTI_STAGE";
export type CategoryType = "MENS_SINGLES" | "WOMENS_SINGLES" | "MENS_DOUBLES" | "WOMENS_DOUBLES" | "MIXED_DOUBLES";

// Define interfaces for data structures
export interface AuditLog {
    id: string;
    action: string;
    timestamp: Date;
    userId: string;
    details: Record<string, any>;
    user_id?: string;
    userName?: string;
}

export interface StandaloneAuditLog {
  timestamp: Date;
  action: string;
  details: string | Record<string, any>;
  user_id?: string;
  userName?: string;
}

export interface Player {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    division?: DivisionType;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Team {
    id: string;
    name: string;
    players: Player[];
    members?: { name: string }[]; // Added members field for backward compatibility
    division?: DivisionType;
    category?: string;
    seed?: number; // For tournament seeding
    initialRanking?: number; // Initial ranking (#1-#38)
    createdAt?: Date;
    updatedAt?: Date;
    created_by?: string; // User ID
    updated_by?: string; // User ID
    status?: string; // e.g., "Active", "Inactive"
}

export interface MatchScore {
    team1Score: number;
    team2Score: number;
    scoredBy?: string;
    timestamp?: string;
}

export interface Match {
    id: string;
    tournamentId: string;
    stage?: StageType;
    round?: number;
    team1Id?: string;
    team2Id?: string;
    team1?: Team;
    team2?: Team;
    courtId?: string;
    courtNumber?: number;
    status: MatchStatus;
    scores?: MatchScore[];
    score?: {
        team1: number;
        team2: number;
    };
    winner?: Team;
    loser?: Team;
    winnerId?: string;
    matchNumber?: string;
    scheduledTime?: Date;
    completedTime?: Date;
    endTime?: Date;
    division?: DivisionType;
    category?: TournamentCategory;
    categoryName?: string;
    createdAt?: Date;
    updatedAt?: Date;
    auditLogs?: StandaloneAuditLog[];
    scorerName?: string;
}

export interface Court {
    id: string;
    name: string;
    number?: number;
    status: CourtStatus;
    currentMatchId?: string;
    currentMatch?: Match;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface TournamentCategory {
    id: string;
    name: string;
    type: CategoryType;
    division?: string;
    format?: TournamentFormat;
}

export interface ScoringSettings {
    matchFormat: 'TIMED' | 'STANDARD';
    pointsPerMatch: number;
    maxPoints: number;
    maxSets: number;
    allowNegativeScores: boolean;
}

export interface Division {
    id: string;
    name: string;
    type: DivisionType;
    teams?: Team[];
}

export interface TournamentStage {
    id: string;
    name: string;
    type: StageType;
    order: number;
    matches?: Match[];
}

export interface StandaloneMatch {
    id: string;
    matchNumber?: string;
    team1: Team;
    team2: Team;
    scheduledTime?: Date;
    completedTime?: Date;
    courtNumber?: number;
    courtName?: string;
    status: MatchStatus;
    scores: MatchScore[];
    winner?: Team;
    loser?: Team;
    categoryName?: string;
    tournamentName?: string;
    category?: TournamentCategory;
    auditLogs?: StandaloneAuditLog[];
    createdAt?: Date;
    updatedAt?: Date;
    created_by?: string;
    updated_by?: string;
    isPublic?: boolean;
    shareCode?: string;
    scorerName?: string;
    endTime?: Date;
}

export interface Tournament {
    id: string;
    name: string;
    description?: string;
    format: TournamentFormat;
    status: TournamentStatus;
    startDate: Date;
    endDate: Date;
    location?: string;
    scoringSettings?: ScoringSettings;
    scoringRules?: string | ScoringSettings;
    registrationEnabled?: boolean;
    registrationDeadline?: Date;
    maxTeams?: number;
    categories: TournamentCategory[];
    teams: Team[];
    matches: Match[];
    courts: Court[];
    divisions?: Division[];
    stages?: TournamentStage[];
    currentStage?: string;
    createdAt?: Date;
    updatedAt?: Date;
    created_by?: string;
    updated_by?: string;
}

// Additional type fixes for specific components
export interface SchedulingOptions {
  startTime: Date;
  courtIds: string[];
  matchDuration: number;
  breakDuration: number;
}

export interface SchedulingResult {
  scheduledMatches: Match[];
  unscheduledMatches: Match[];
}

// Fix Category/TournamentCategory confusion
export type Category = TournamentCategory;
