
import { 
  UserRole, 
  TournamentFormat, 
  Division, 
  PlayType, 
  TournamentStatus, 
  MatchStatus, 
  CourtStatus,
  RegistrationStatus,
  TournamentStageEnum,
  AuditLogType
} from './tournament-enums';

// Export all enums directly from tournament-enums for easier access
export { 
  UserRole, 
  TournamentFormat, 
  Division, 
  PlayType, 
  TournamentStatus, 
  MatchStatus, 
  CourtStatus,
  RegistrationStatus,
  TournamentStageEnum,
  AuditLogType
};

// Create a consistent interface mapping between snake_case backend and camelCase frontend
export interface Court {
  id: string;
  name: string;
  courtNumber: number;
  court_number: number; // Backend field
  tournament_id: string;
  tournamentId: string;
  status: CourtStatus;
  description?: string;
  currentMatch?: Match; // Match reference
  created_at: Date;
  createdAt: Date;
  updated_at: Date;
  updatedAt: Date;
}

export interface Match {
  id: string;
  tournamentId: string;
  tournament_id?: string;
  divisionId?: string;
  division_id?: string;
  team1Id?: string;
  team2Id?: string;
  team1_player1?: string;
  team2_player1?: string;
  team1_player2?: string;
  team2_player2?: string;
  status: MatchStatus;
  scheduledTime?: Date | string;
  scheduled_time?: Date | string;
  startTime?: Date | string;
  start_time?: Date | string;
  endTime?: Date | string;
  end_time?: Date | string;
  courtId?: string;
  court_id?: string;
  courtNumber?: number;
  court?: { id: string; name: string; number: number; };
  bracketRound: number;
  bracketPosition: number;
  matchNumber: string;
  progression: string | { winnerGoesTo?: string; loserGoesTo?: string; };
  scores?: Array<{ team1Score: number, team2Score: number }>;
  winner?: string | number;
  loser?: string | number;
  winner_team?: number;
  scorerName?: string;
  verified?: boolean;
  groupName?: string;
  createdAt?: Date;
  updatedAt?: Date;
  created_at?: Date;
  updated_at?: Date;
  division?: string | Division;
}

export interface RolePermissions {
  canEditTournament: boolean;
  canManagePlayers: boolean;
  canManageMatches: boolean;
  canEnterScores: boolean;
  canViewReports: boolean;
  canManageCourts: boolean;
  viewTournament: boolean;
  createTournament: boolean;
  deleteTournament: boolean;
  manageRegistrations: boolean;
  approveRegistrations: boolean;
  rejectRegistrations: boolean;
  scheduleMatches: boolean;
  scoreMatches: boolean;
  manageCourts: boolean;
  manageUsers: boolean;
  manageSystem: boolean;
  viewReports: boolean;
  exportData: boolean;
  rolePermissions?: Record<string, boolean>;
  can_manage_tournaments: boolean;
  can_manage_users: boolean;
  can_manage_registrations: boolean;
  can_score_matches: boolean;
  can_view_reports: boolean;
}

export interface Notification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt?: Date;
}

export interface Profile {
  id: string;
  full_name: string;
  display_name: string;
  avatar_url: string;
  phone: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
  
  // Added to handle common camelCase access patterns
  fullName?: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Add email field which is commonly used
  email?: string;
  preferences?: {
    notifications?: {
      match_reminders?: boolean;
      email?: boolean;
    }
  }
}

export interface RegistrationMetadata {
  waitlistPosition?: number;
  checkInTime?: string;
  notes?: string;
  verificationCode?: string;
  priority?: number;
  comments?: Array<{
    id: string;
    text: string;
    createdAt: string;
    createdBy: string;
  }>;
  playerName?: string;
  contactEmail?: string;
  teamSize?: number;
  waitlistHistory?: Array<{
    date: string;
    fromPosition: number;
    toPosition: number;
    reason?: string;
  }>;
}

export interface AuditLog {
  id: string;
  type: AuditLogType;
  userId: string;
  matchId: string;
  tournamentId: string;
  details: Record<string, any>;
  createdAt: Date;
}

export interface StandaloneMatch extends Omit<Match, 'tournamentId' | 'division'> {
  tournamentId: string; 
  tournamentName?: string;
  division: string | Division;
  courtName?: string;
  categoryName?: string;
  category?: {
    id: string;
    name: string;
    type: string;
  };
}
