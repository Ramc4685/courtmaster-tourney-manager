import {
  TournamentFormat,
  TournamentStatus,
  TournamentStage,
  MatchStatus,
  CourtStatus,
  Division,
  CategoryType,
  ScorerType
} from './tournament-enums';

// Core entity interfaces
export interface Player {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  teamId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  name: string;
  seed?: number;
  division?: Division;
  players?: Player[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TournamentCategory {
  id: string;
  name: string;
  type: CategoryType;
  division: Division;
  isCustom?: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Court {
  id: string;
  number: number;
  status: CourtStatus;
  matchId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  timestamp: Date;
  action: string;
  details: Record<string, any>;
}

export interface MatchScore {
  setNumber: number;
  team1Score: number;
  team2Score: number;
  scorerName?: string;
  timestamp: Date;
}

export interface Match {
  id: string;
  tournamentId: string;
  team1Id: string;
  team2Id: string;
  team1?: Team;
  team2?: Team;
  winnerId?: string;
  loserId?: string;
  status: MatchStatus;
  division: Division;
  stage: TournamentStage;
  round: number;
  courtId?: string;
  court?: Court;
  scores: {
    team1: number[];
    team2: number[];
  };
  auditLogs: {
    timestamp: Date;
    action: string;
    details: string;
  }[];
  // Bracket progression properties
  nextMatchId?: string;
  nextMatchPosition?: 'team1' | 'team2';
  bracketRound?: number;
  bracketPosition?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tournament {
  id: string;
  name: string;
  format: TournamentFormat;
  status: TournamentStatus;
  currentStage: TournamentStage;
  startDate: Date;
  endDate: Date;
  registrationDeadline: Date;
  location: string;
  description?: string;
  divisions: Division[];
  category: CategoryType;
  scoringSettings: ScoringSettings;
  teams: Team[];
  matches: Match[];
  courts: Court[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ScoringSettings {
  setsToWin: number;
  gamesPerSet: number;
  pointsPerGame: number;
  tiebreakAt: number;
  tiebreakPoints: number;
  allowWalkover: boolean;
  defaultScorerType: ScorerType;
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
