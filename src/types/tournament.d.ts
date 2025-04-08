export type TournamentStatus = "DRAFT" | "PUBLISHED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type MatchStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "DEFERRED";
export type CourtStatus = "AVAILABLE" | "IN_USE" | "MAINTENANCE";
export type DivisionType = "MENS" | "WOMENS" | "MIXED";
export type StageType = "GROUP" | "KNOCKOUT" | "FINAL";
export type ScorerType = "MANUAL" | "AUTOMATIC";
export type TournamentFormat = "SINGLE_ELIMINATION" | "DOUBLE_ELIMINATION" | "ROUND_ROBIN";
export type CategoryType = "MENS_SINGLES" | "WOMENS_SINGLES" | "MENS_DOUBLES" | "WOMENS_DOUBLES" | "MIXED_DOUBLES";

export interface AuditLog {
    id: string;
    action: string;
    timestamp: Date;
    userId: string;
    details: Record<string, any>;
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
    email: string;
    phone?: string;
    division: DivisionType;
    createdAt: Date;
    updatedAt: Date;
}

export interface Team {
    id: string;
    name: string;
    players: Player[];
    division: DivisionType;
    category: string;
    createdAt: Date;
    updatedAt: Date;
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
    stage: StageType;
    round: number;
    team1Id: string;
    team2Id: string;
    courtId?: string;
    status: MatchStatus;
    score?: {
        team1: number;
        team2: number;
    };
    winnerId?: string;
    createdAt: Date;
    updatedAt: Date;
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

export interface Court {
    id: string;
    name: string;
    status: CourtStatus;
    currentMatchId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface TournamentCategory {
    id: string;
    name: string;
    type: CategoryType;
    division: string;
}

export interface Tournament {
    id: string;
    name: string;
    description?: string;
    format: TournamentFormat;
    status: TournamentStatus;
    startDate: Date;
    endDate: Date;
    location: string;
    registrationEnabled: boolean;
    registrationDeadline?: Date;
    maxTeams?: number;
    scoringRules?: string;
    categories: TournamentCategory[];
    teams: Team[];
    matches: Match[];
    courts: Court[];
    createdAt: Date;
    updatedAt: Date;
}

export interface ScoringSettings {
    matchFormat: 'TIMED' | 'STANDARD';
    pointsPerMatch: number;
    maxPoints: number;
    maxSets: number;
    allowNegativeScores: boolean;
}
