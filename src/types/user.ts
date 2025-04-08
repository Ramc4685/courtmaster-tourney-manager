
export type UserRole = 'tournament_director' | 'front_desk' | 'admin_staff' | 'scorekeeper' | 'player' | 'spectator';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  isVerified: boolean;
  role: UserRole;
  devicePreference?: 'mobile' | 'desktop' | 'tablet' | 'all';
}

export interface UserPermissions {
  canManageTournaments: boolean;
  canCheckInPlayers: boolean;
  canModifySchedule: boolean;
  canEnterScores: boolean;
  canViewResults: boolean;
  canRegister: boolean;
}

export const RolePermissions: Record<UserRole, UserPermissions> = {
  tournament_director: {
    canManageTournaments: true,
    canCheckInPlayers: true,
    canModifySchedule: true,
    canEnterScores: true,
    canViewResults: true,
    canRegister: true
  },
  front_desk: {
    canManageTournaments: false,
    canCheckInPlayers: true,
    canModifySchedule: false,
    canEnterScores: false,
    canViewResults: true,
    canRegister: true
  },
  admin_staff: {
    canManageTournaments: false,
    canCheckInPlayers: true,
    canModifySchedule: true,
    canEnterScores: true,
    canViewResults: true,
    canRegister: true
  },
  scorekeeper: {
    canManageTournaments: false,
    canCheckInPlayers: false,
    canModifySchedule: false,
    canEnterScores: true,
    canViewResults: true,
    canRegister: false
  },
  player: {
    canManageTournaments: false,
    canCheckInPlayers: false,
    canModifySchedule: false,
    canEnterScores: false,
    canViewResults: true,
    canRegister: true
  },
  spectator: {
    canManageTournaments: false,
    canCheckInPlayers: false,
    canModifySchedule: false,
    canEnterScores: false,
    canViewResults: true,
    canRegister: false
  }
};
