
// Create a consistent interface mapping between snake_case backend and camelCase frontend
export interface Court {
  id: string;
  name: string;
  court_number: number;
  number?: number; // Alias for court_number
  tournament_id: string;
  tournamentId?: string; // Alias for tournament_id
  status: string;
  description?: string;
  currentMatch?: any; // Match reference
  created_at: Date;
  createdAt?: Date; // Alias for created_at
  updated_at: Date;
  updatedAt?: Date; // Alias for updated_at
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt?: Date;
  created_at?: Date;
  user_id?: string;
  userId?: string;
}

export { 
  Match, 
  Profile, 
  Division, 
  MatchStatus, 
  CourtStatus 
} from './tournament';

// Add TournamentRegistrationStatus enum
export enum TournamentRegistrationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  WAITLIST = 'WAITLIST',
  CHECKED_IN = 'CHECKED_IN',
  WITHDRAWN = 'WITHDRAWN'
}

// Add RolePermissions interface
export interface RolePermissions {
  canEditTournament: boolean;
  canManagePlayers: boolean;
  canManageMatches: boolean;
  canEnterScores: boolean;
  canViewReports: boolean;
  canManageCourts: boolean;
}
