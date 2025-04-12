import { UserRole } from './tournament-enums';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: "admin" | "user";
  createdAt: string;
  updatedAt?: string;
  isVerified?: boolean;
}

export interface UserCredentials {
  email: string;
  password: string;
}

export interface TournamentUserRole {
  userId: string;
  tournamentId: string;
  role: 'admin' | 'owner' | 'participant';
}

export type RolePermissions = {
  canManageTournaments: boolean;
  canModifyMatches: boolean;
  canAssignCourts: boolean;
  canRegisterTeams: boolean;
  canViewAnalytics: boolean;
  canAccessAdmin: boolean;
  canManageUsers: boolean;
  canRecordScores: boolean;
};

export const RolePermissions: Record<UserRole, RolePermissions> = {
  [UserRole.ADMIN]: {
    canManageTournaments: true,
    canModifyMatches: true,
    canAssignCourts: true,
    canRegisterTeams: true,
    canViewAnalytics: true,
    canAccessAdmin: true,
    canManageUsers: true,
    canRecordScores: true
  },
  [UserRole.TOURNAMENT_DIRECTOR]: {
    canManageTournaments: true,
    canModifyMatches: true,
    canAssignCourts: true,
    canRegisterTeams: true,
    canViewAnalytics: true,
    canAccessAdmin: true,
    canManageUsers: false,
    canRecordScores: true
  },
  [UserRole.ADMIN_STAFF]: {
    canManageTournaments: false,
    canModifyMatches: true,
    canAssignCourts: true,
    canRegisterTeams: true,
    canViewAnalytics: true,
    canAccessAdmin: true,
    canManageUsers: false,
    canRecordScores: true
  },
  [UserRole.FRONT_DESK]: {
    canManageTournaments: false,
    canModifyMatches: false,
    canAssignCourts: true,
    canRegisterTeams: true,
    canViewAnalytics: false,
    canAccessAdmin: false,
    canManageUsers: false,
    canRecordScores: false
  },
  [UserRole.SCOREKEEPER]: {
    canManageTournaments: false,
    canModifyMatches: false,
    canAssignCourts: false,
    canRegisterTeams: false,
    canViewAnalytics: false,
    canAccessAdmin: false,
    canManageUsers: false,
    canRecordScores: true
  },
  [UserRole.PLAYER]: {
    canManageTournaments: false,
    canModifyMatches: false,
    canAssignCourts: false,
    canRegisterTeams: false,
    canViewAnalytics: false,
    canAccessAdmin: false,
    canManageUsers: false,
    canRecordScores: false
  },
  [UserRole.SPECTATOR]: {
    canManageTournaments: false,
    canModifyMatches: false,
    canAssignCourts: false,
    canRegisterTeams: false,
    canViewAnalytics: false,
    canAccessAdmin: false,
    canManageUsers: false,
    canRecordScores: false
  },
  [UserRole.USER]: {
    canManageTournaments: false,
    canModifyMatches: false,
    canAssignCourts: false,
    canRegisterTeams: true,
    canViewAnalytics: false,
    canAccessAdmin: false,
    canManageUsers: false,
    canRecordScores: false
  }
};
