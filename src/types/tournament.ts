
import {
  TournamentFormat,
  TournamentStatus,
  MatchStatus,
  CourtStatus,
  DivisionType,
  StageType,
  ScorerType,
  CategoryType,
  TournamentStage,
  Division
} from './tournament-enums';

// Core entity interfaces
export interface Player {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  country_code?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  division?: DivisionType;
  category?: string;
  initialRanking?: number;
  createdAt?: Date;
  updatedAt?: Date;
  created_by?: string;
  updated_by?: string;
}

export interface TournamentCategory {
  id: string;
  name: string;
  type: CategoryType;
  division: string;
  format?: TournamentFormat;
  scoringSettings?: ScoringSettings;
}

export interface Court {
  id: string;
  name: string;
  number?: number;
  status: CourtStatus;
  currentMatchId?: string;
  currentMatch?: Match;
  location?: string;
  createdAt?: Date;
  updatedAt?: Date;
  created_by?: string;
  updated_by?: string;
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  action: string;
  userId: string;
  userName?: string;
  details: Record<string, any>;
  type?: string;
  metadata?: Record<string, any>;
  user_id?: string;
}

export interface StandaloneAuditLog {
  timestamp: Date;
  action: string;
  details: string | Record<string, any>;
  user_id?: string;
  userName?: string;
}

export interface ScoreAuditLog {
  timestamp: Date;
  action: string;
  details: {
    score: string;
    scorer: string;
    setComplete: boolean;
    previousScore?: string;
    reason?: string;
  };
  user_id: string;
}

export interface MatchScore {
  team1Score: number;
  team2Score: number;
  isComplete?: boolean;
  winner?: 'team1' | 'team2' | null;
  duration?: number;
  auditLogs?: ScoreAuditLog[];
}

export interface Match {
  id: string;
  tournamentId: string;
  matchNumber?: string;
  team1?: Team;
  team2?: Team;
  team1Id?: string;
  team2Id?: string;
  winner?: Team | "team1" | "team2";
  loser?: Team | "team1" | "team2";
  scores: MatchScore[];
  status: MatchStatus;
  courtNumber?: number;
  scheduledTime?: Date;
  startTime?: Date;
  endTime?: Date;
  division?: Division;
  stage?: TournamentStage | StageType;
  round?: number;
  bracketRound?: number;
  bracketPosition?: number;
  nextMatchId?: string;
  nextMatchPosition?: "team1" | "team2";
  previousMatchIds?: string[];
  updatedAt?: Date;
  createdAt?: Date;
  updated_by?: string;
  created_by?: string;
  category?: TournamentCategory;
  scorerName?: string;
  auditLogs?: AuditLog[];
  groupName?: string;
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
  registrationEnabled: boolean;
  registrationDeadline?: Date;
  maxTeams?: number;
  scoringRules?: string;
  scoringSettings?: ScoringSettings;
  categories: TournamentCategory[];
  teams: Team[];
  matches: Match[];
  courts: Court[];
  createdAt: Date;
  updatedAt: Date;
  currentStage?: TournamentStage;
  updated_by?: string;
  created_by?: string;
}

export interface ScoringRule {
  id: string;
  name: string;
  sport: string;
  maxPoints: number;
  requireTwoPointLead: boolean;
  maxTwoPointLeadScore: number;
  maxSets: number;
  setsToWin: number;
  tiebreakRules?: {
    pointsToWin: number;
    requireTwoPointLead: boolean;
    maxPoints: number;
  };
  customRules?: Record<string, any>;
}

export interface ScoringSettings {
  pointsToWin: number;
  mustWinByTwo: boolean;
  maxPoints: number;
  maxSets: number;
  requireTwoPointLead: boolean;
  maxTwoPointLeadScore: number;
  setsToWin?: number;
  tiebreakRules?: {
    pointsToWin: number;
    requireTwoPointLead: boolean;
    maxPoints: number;
  };
}

export interface ScoreValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Type to define category registration rules
export interface CategoryRegistrationRule {
  categoryId: string;
  maxTeams: number;
  requirePlayerProfile: boolean;
  allowExternalPlayers: boolean;
  requireApproval: boolean;
}

// Type to define seeding rules
export interface SeedingRule {
  method: 'manual' | 'ranking' | 'random';
  respectGroups: boolean;
  protectTopSeeds: boolean;
}

// Bracket progression type
export interface BracketProgression {
  sourceMatchId: string;
  targetMatchId: string;
  position: 'team1' | 'team2';
  condition: 'winner' | 'loser';
}
