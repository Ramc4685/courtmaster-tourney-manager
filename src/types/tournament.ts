import { 
  TournamentStatus, 
  Division, 
  MatchStatus, 
  CourtStatus, 
  CategoryType,
  TournamentStage,
  ScorerType,
  PlayType,
  GameType,
  TournamentFormat as TournamentFormatEnum
} from './tournament-enums';

export {
  TournamentStatus,
  Division,
  MatchStatus,
  CourtStatus,
  CategoryType,
  TournamentStage,
  ScorerType,
  PlayType,
  GameType,
  TournamentFormatEnum
};

// Keep the existing code for Player interface
export interface Player {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  profileId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  name: string;
  division: Division;
  seed?: number;
  players: Player[];
  category?: TournamentCategory;
  categories?: string[];  // Array of category IDs
  initialRanking?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MatchScore {
  team1Score: number;
  team2Score: number;
  setNumber?: number; // Make setNumber optional to fix the errors
  isComplete?: boolean;
  winner?: 'team1' | 'team2' | null;
  scoredBy?: string;
  timestamp?: string;
}

export interface FormatConfig {
  rounds?: number;
  thirdPlaceMatch?: boolean;
  seedingEnabled?: boolean;
  customRules?: Record<string, any>;
}

export interface MatchProgression {
  roundNumber: number;
  bracketPosition: number;
  bracketRound: number;
  path?: 'WINNERS' | 'LOSERS' | 'CONSOLATION';
  nextMatchId?: string;
  nextMatchPosition?: 'team1' | 'team2';
}

export interface Match {
  id: string;
  tournamentId: string;
  team1: Team;
  team2: Team;
  scores: MatchScore[];
  division: Division;
  stage: TournamentStage;
  status: MatchStatus;
  category: TournamentCategory;
  progression: MatchProgression;
  winner?: Team;
  loser?: Team;
  bracketRound: number;
  bracketPosition: number;
  scheduledTime?: Date;
  completedTime?: Date;
  courtId?: string;
  notes?: string;
  matchNumber: string;
  team1Id?: string;
  team2Id?: string;
  courtNumber?: number;
  startTime?: Date;
  endTime?: Date;
  groupName?: string;
  createdAt: Date;
  updatedAt: Date;
  scorerName?: string;
  auditLogs?: AuditLog[];
  team1Score?: number;
  team2Score?: number;
  team1Name?: string;
  team2Name?: string;
}

export interface Court {
  id: string;
  name: string;
  number: number;
  status: CourtStatus;
  location?: string;
  tournamentId?: string;
  tournament_id?: string; // For compatibility
  currentMatch?: Match;
  createdAt: Date;
  updatedAt: Date;
  court_number?: number; // For CourtConfiguration
  description?: string;
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
  // Add missing fields
  gamesPerSet?: number;
  pointsPerGame?: number;
}

export interface TournamentCategory {
  id: string;
  name: string;
  type: CategoryType;
  division: Division;
  isCustom?: boolean;
  description?: string;
  format?: TournamentFormat;
  scoringSettings?: ScoringSettings;
}

export interface CategoryRegistrationRule {
  categoryId: string;
  maxTeams?: number;
  requirePartner?: boolean;
  minAge?: number;
  maxAge?: number;
  gender?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  timestamp: Date;
  action: string;
  type: string;
  details?: any;
  metadata?: any;
  name?: string;
  userName?: string;
}

export interface StandaloneAuditLog {
  timestamp: Date;
  user_id: string;
  action: string;
  type: string;
  metadata?: any;
  userName?: string;
}

export interface StandaloneMatch {
  id: string;
  team1?: Team;
  team2?: Team;
  team1Id?: string;
  team2Id?: string;
  scores: MatchScore[];
  status: MatchStatus;
  scheduledTime?: Date;
  startTime?: Date;
  endTime?: Date;
  winner?: Team;
  loser?: Team;
  scorerName?: string;
  createdAt?: Date;
  updatedAt?: Date;
  auditLogs?: StandaloneAuditLog[];
  courtName?: string;
  courtNumber?: number;
  tournamentName?: string;
  categoryName?: string;
  category?: TournamentCategory;
  isPublic?: boolean;
  shareCode?: string;
  matchNumber?: string;
}

export interface Tournament {
  id: string;
  name: string;
  location: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  registrationDeadline?: Date;
  format: TournamentFormat;
  status: TournamentStatus;
  currentStage: TournamentStage;
  registrationEnabled: boolean;
  requirePlayerProfile: boolean;
  maxTeams?: number;
  teams: Team[];
  matches: Match[];
  courts: Court[];
  categories: TournamentCategory[];
  scoringSettings: ScoringSettings;
  scoringRules?: string;
  categoryRegistrationRules?: CategoryRegistrationRule[];
  createdAt: Date;
  updatedAt: Date;
  formatConfig?: any;
  divisionProgression?: any;
  metadata?: any;
  autoAssignCourts?: boolean;
  created_by?: string;
  updated_by?: string;
  organizer_id?: string;
  divisions?: Division[]; // Added for RegistrationManagement
  participants?: { length: number }; // Added for TournamentDetail
}

// For contexts/tournament/types.ts
export interface Category extends TournamentCategory {}

// Define TournamentMatch alias for backward compatibility
export type TournamentMatch = Match;

export interface TournamentFormat {
  type: TournamentFormatEnum;
  stages: TournamentStage[];
  scoring: {
    matchFormat: string;
    setsToWin: number;
    pointsToWinSet: number;
    tiebreakPoints: number;
    finalSetTiebreak: boolean;
    pointsToWin: number;
    mustWinByTwo: boolean;
    maxPoints: number;
    maxSets: number;
    requireTwoPointLead: boolean;
    maxTwoPointLeadScore: number;
    gamesPerSet?: number;
    pointsPerGame?: number;
  };
  divisions: Division[];
  thirdPlaceMatch?: boolean;
  groupSize?: number;
  advancingTeams?: number;
  seedingEnabled?: boolean;
  consolationRounds?: boolean;
  metadata?: Record<string, any>;
}
