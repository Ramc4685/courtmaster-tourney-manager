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
  AuditLogType,
  NotificationType // Add NotificationType here
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
  AuditLogType,
  NotificationType // Export NotificationType
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
  scores?: MatchScores; // Use MatchScores type
  winner?: string | number;
  loser?: string | number;
  winner_id?: string | null; // Added for consistency
  loser_id?: string | null; // Added for consistency
  winner_team?: number;
  scorerName?: string;
  verified?: boolean;
  groupName?: string;
  createdAt?: Date;
  updatedAt?: Date;
  created_at?: Date;
  updated_at?: Date;
  division?: string | Division;
  // Add fields for participants if needed directly on match
  team1_name?: string;
  team2_name?: string;
}

// Define ScoreSet and MatchScores types
export interface ScoreSet {
  team1: number;
  team2: number;
  completed?: boolean; // Optional: Mark if the set itself is complete
  winner?: 1 | 2 | null; // Optional: Winner of the set
}

export interface MatchScores {
  sets: ScoreSet[];
  current_set: number; // Index of the current set being played (0-based)
  serving?: 1 | 2 | null; // Which team is serving
  // Add other score-related metadata if needed
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
  id: string; // Changed to non-optional as DB generates it
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  created_at: string; // Use string for ISO date format
  updated_at?: string | null; // Use string for ISO date format
  related_entity_id?: string | null; // Optional: ID of related entity (tournament, match)
  related_entity_type?: string | null; // Optional: Type of related entity ('tournament', 'match')
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

// RegistrationMetadata moved to registration.ts

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

