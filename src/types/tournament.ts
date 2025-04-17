
import { UserRole, TournamentFormat, TournamentStage, TournamentStatus, CourtStatus, MatchStatus } from './tournament-enums';

// Base interface for Court
export interface Court {
  id: string;
  number: number;
  name: string;
  status: CourtStatus;
  description?: string;
  tournamentId: string;
  currentMatch?: Match;
  createdAt: Date;
  updatedAt: Date;
}

// Base interface for Match
export interface Match {
  id: string;
  tournamentId: string;
  division: string;
  stage: string;
  category: TournamentCategory;
  scores: MatchScore[];
  status: MatchStatus;
  courtId?: string;
  courtNumber?: number;
  team1?: Team;
  team2?: Team;
  team1Id?: string;
  team2Id?: string;
  winner?: string;
  loser?: string;
  scheduledTime?: Date;
  startTime?: Date;
  endTime?: Date;
  notes?: string;
  groupName?: string;
  bracketRound: number;
  bracketPosition: number;
  progression: string;
  matchNumber?: string;
  updatedAt: Date;
  createdAt: Date;
}

// Match Score interface
export interface MatchScore {
  team1Score: number;
  team2Score: number;
}

// Team interface
export interface Team {
  id: string;
  name: string;
  players: Player[];
  division: string;
  createdAt: Date;
  updatedAt: Date;
}

// Player interface
export interface Player {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  profileId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tournament Category interface
export interface TournamentCategory {
  id: string;
  name: string;
  division: string;
  type: string;
  format: TournamentFormat;
  seeded?: boolean;
  teams?: Team[];
}

// Scoring Settings interface
export interface ScoringSettings {
  matchFormat: string;
  pointsToWin: number;
  maxSets: number;
  mustWinByTwo: boolean;
  maxPoints: number;
  requireTwoPointLead: boolean;
  maxTwoPointLeadScore: number;
  setsToWin: number;
}

// Tournament interface
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
  createdAt: Date;
  updatedAt: Date;
}

// Standalone Match (for scoring outside of tournaments)
export interface StandaloneMatch extends Omit<Match, 'tournamentId' | 'division' | 'bracketRound' | 'bracketPosition' | 'progression'> {
  tournamentId: string; // Using a special "standalone" ID
  division: any; // Can be anything for standalone
  bracketRound: number; 
  bracketPosition: number;
  progression: string;
}
