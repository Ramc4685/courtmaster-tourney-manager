import { TournamentStatus, MatchStatus, CourtStatus, DivisionType, StageType, ScorerType, TournamentFormat, CategoryType, TournamentStage } from './tournament-enums';

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
    division: DivisionType;
    format?: TournamentFormat;
    description?: string;
    isCustom?: boolean;
}

export interface Tournament {
    id: string;
    name: string;
    description?: string;
    format: TournamentFormat;
    status: TournamentStatus;
    currentStage: TournamentStage;
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
    pointsToWin: number;
    mustWinByTwo: boolean;
    maxPoints: number;
    maxSets: number;
    requireTwoPointLead: boolean;
    maxTwoPointLeadScore: number;
    setsToWin?: number;
}

export type { TournamentStatus, MatchStatus, CourtStatus, DivisionType, StageType, ScorerType, TournamentFormat, CategoryType, TournamentStage };
