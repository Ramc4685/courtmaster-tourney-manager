
import { UserRole } from './tournament-enums';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  profileId?: string;
  isVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
  display?: {
    compactView?: boolean;
    showCompletedMatches?: boolean;
    refreshInterval?: number;
  };
}

export interface UserCredentials {
  email: string;
  password: string;
}

export enum TournamentUserRole {
  DIRECTOR = 'director',
  ADMIN = 'admin',
  SCOREKEEPER = 'scorekeeper',
  VOLUNTEER = 'volunteer',
  PLAYER = 'player',
  SPECTATOR = 'spectator'
}

export interface RolePermission {
  read: string[];
  write: string[];
  manage: string[];
}

export const RolePermissions: Record<string, RolePermission> = {
  tournament_director: {
    read: ['*'],
    write: ['*'],
    manage: ['*']
  },
  admin_staff: {
    read: ['*'],
    write: ['tournaments', 'matches', 'teams', 'courts', 'categories'],
    manage: ['tournaments', 'matches', 'teams', 'courts']
  },
  front_desk: {
    read: ['*'],
    write: ['teams', 'players', 'checkins'],
    manage: ['checkins']
  },
  scorekeeper: {
    read: ['tournaments', 'matches', 'courts'],
    write: ['matches.scores'],
    manage: []
  },
  player: {
    read: ['tournaments', 'matches', 'public'],
    write: [],
    manage: []
  },
  spectator: {
    read: ['public'],
    write: [],
    manage: []
  }
};
