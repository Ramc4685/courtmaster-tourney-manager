export type TournamentStatus = "DRAFT" | "PUBLISHED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type MatchStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "DEFERRED";
export type CourtStatus = "AVAILABLE" | "IN_USE" | "MAINTENANCE";
export type DivisionType = "MENS_SINGLES" | "WOMENS_SINGLES" | "MENS_DOUBLES" | "WOMENS_DOUBLES" | "MIXED_DOUBLES";
export type StageType = "INITIAL_ROUND" | "QUARTER_FINALS" | "SEMI_FINALS" | "FINALS";
export type ScorerType = "TOURNAMENT" | "STANDALONE";

export interface AuditLog {
    timestamp: Date;
    action: string;
    details: Record<string, any>;
    user_id: string;
    userName: string;
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
}

export interface Team {
    id: string;
    name: string;
    players: Player[];
    seed?: number;
    wins?: number;
    losses?: number;
    initialRanking?: number;
    rankingPoints?: number;
    status?: 'ACTIVE' | 'INACTIVE';
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
    matchNumber?: string;
    team1: Team;
    team2: Team;
    division: DivisionType;
    stage: StageType;
    scheduledTime?: Date;
    completedTime?: Date;
    courtNumber?: number;
    status: MatchStatus;
    scores: MatchScore[];
    winner?: Team;
    loser?: Team;
    category?: TournamentCategory;
    auditLogs?: AuditLog[];
    createdAt?: Date;
    updatedAt?: Date;
    courtName?: string;
    scorerName?: string;
    endTime?: Date;
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
    number: number;
    status: CourtStatus;
    currentMatch?: Match;
}

export interface TournamentCategory {
    id: string;
    name: string;
    type: DivisionType;
}

export interface Tournament {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    location?: string;
    description?: string;
    status: TournamentStatus;
    matches: Match[];
    teams: Team[];
    courts: Court[];
    categories: TournamentCategory[];
    createdBy?: string;
    updatedBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
    contactEmail?: string;
    contactPhone?: string;
    isPublic?: boolean;
    logoUrl?: string;
}

export interface ScoringSettings {
    matchFormat: 'TIMED' | 'STANDARD';
    pointsPerMatch: number;
    maxPoints: number;
    maxSets: number;
    allowNegativeScores: boolean;
}
