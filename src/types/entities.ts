
import { TournamentFormat, Division, PlayType, CourtStatus, UserRole, TournamentStatus, MatchStatus } from './tournament-enums';

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
  currentMatch?: any; // Match reference
  created_at: Date;
  createdAt: Date;
  updated_at: Date;
  updatedAt: Date;
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
  email?: string;
  preferences?: {
    notifications?: {
      match_reminders?: boolean;
      email?: boolean;
    }
  }
}

export interface Match {
  id: string;
  tournamentId: string;
  divisionId?: string;
  team1Id?: string;
  team2Id?: string;
  status: MatchStatus;
  scheduledTime?: Date | string;
  startTime?: Date | string;
  endTime?: Date | string;
  courtId?: string;
  courtNumber?: number;
  bracketRound: number;
  bracketPosition: number;
  matchNumber: string;
  progression: string;
  scores?: Array<{ team1Score: number, team2Score: number }>;
  winner?: string;
  loser?: string;
  scorerName?: string;
}

// Standardize registration status
export enum RegistrationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  WAITLIST = 'WAITLIST',
  CHECKED_IN = 'CHECKED_IN',
  WITHDRAWN = 'WITHDRAWN'
}

// Remove TournamentRegistrationStatus and use RegistrationStatus instead
export { RegistrationStatus as TournamentRegistrationStatus };
