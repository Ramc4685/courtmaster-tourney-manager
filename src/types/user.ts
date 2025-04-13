
import { UserRole } from './tournament-enums';

export interface Profile {
  id: string;
  name: string;
  full_name: string;
  display_name: string;
  email: string;
  phone?: string;
  avatar_url?: string | null;
  role: UserRole;
  player_details: {
    birthdate?: string;
    gender?: string;
    skill_level?: string;
    achievements?: string[];
    [key: string]: any;
  };
  player_stats: {
    tournaments_played: number;
    tournaments_won: number;
    matches_played: number;
    matches_won: number;
    rating: number;
    ranking?: number;
  };
  preferences: {
    notifications: {
      email: boolean;
      push: boolean;
      tournament_updates: boolean;
      match_reminders: boolean;
      [key: string]: boolean;
    };
    privacy: {
      show_profile: boolean;
      show_stats: boolean;
      show_history: boolean;
      [key: string]: boolean;
    };
    [key: string]: any;
  };
  social_links: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    website?: string;
    [key: string]: string | undefined;
  };
}

export interface AuthContextType {
  user: Profile | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateUserProfile: (data: Partial<Profile>) => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;  // Alias for updateUserProfile
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isDemo: boolean;
  enableDemoMode: (enable: boolean) => void;
  login: (email: string, password: string) => Promise<boolean>;  // Alias for signIn
  logout: () => Promise<void>;  // Alias for signOut
  register: (email: string, password: string, userData: any) => Promise<void>;  // Alias for signUp
  demoMode: boolean;  // Alias for isDemo
}
