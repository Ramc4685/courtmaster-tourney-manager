import { 
  TournamentFormat, 
  TournamentStatus, 
  Division, 
  MatchStatus, 
  CourtStatus, 
  CategoryType,
  TournamentStage,
  ScorerType,
  PlayType,
  GameType
} from './tournament-enums';

export { Division, MatchStatus } from './tournament-enums';

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

export interface MatchProgression {
  roundNumber: number;
  bracketPosition: number;
  nextMatchId?: string;
  nextMatchPosition?: 'team1' | 'team2';
  loserMatchId?: string;
  loserMatchPosition?: 'team1' | 'team2';
}

export interface Match {
  id: string;
  tournamentId: string;
  team1: Team;
  team2: Team;
  winner?: Team;
  scores: number[][];
  division: Division;
  stage: TournamentStage;
  bracketRound: number;
  bracketPosition: number;
  status: MatchStatus;
  category?: TournamentCategory;
  progression: MatchProgression;
  scheduledTime?: Date;
  completedTime?: Date;
  courtId?: string;
  notes?: string;
  matchNumber?: string;
  team1Id?: string;
  team2Id?: string;
  loser?: Team;
  courtNumber?: number;
  startTime?: Date;
  endTime?: Date;
  groupName?: string;
  createdAt?: Date;
  updatedAt?: Date;
  scorerName?: string;
  auditLogs?: AuditLog[];
  team1Score?: number;
  team2Score?: number;
  team1Name?: string;
  team2Name?: string;
  currentMatch?: Match;
  nextMatchId?: string; // Added for tournament progression
}

export interface Court {
  id: string;
  name: string;
  number: number;
  status: CourtStatus;
  location?: string;
  tournamentId?: string;
  currentMatch?: Match;
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
}
