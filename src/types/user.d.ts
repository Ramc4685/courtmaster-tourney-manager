
import { UserRole } from './tournament-enums';

export interface Profile {
  id: string;
  email: string;
  full_name?: string; 
  display_name?: string;
  avatar_url?: string;
  phone?: string;
  role: UserRole;
  player_details?: {
    skill_level?: string;
    age?: number;
    gender?: string;
    handed?: 'left' | 'right';
    rating?: number;
    tournaments_played?: number;
    tournaments_won?: number;
    matches_played?: number;
    matches_won?: number;
  };
  created_at: string;
  updated_at: string;
}

export interface RolePermissions {
  can_manage_tournaments: boolean;
  can_manage_users: boolean;
  can_manage_registrations: boolean;
  can_score_matches: boolean;
  can_view_reports: boolean;
}

export type UserPermissions = RolePermissions;

export interface AuthContextType {
  user: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, data: any) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<Profile>) => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  demoMode: boolean;
}
