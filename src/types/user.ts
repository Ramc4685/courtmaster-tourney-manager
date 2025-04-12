
import { UserRole } from './tournament-enums';

// Role Permissions
export interface RolePermissions {
  can_manage_tournaments: boolean;
  can_manage_users: boolean;
  can_manage_registrations: boolean;
  can_score_matches: boolean;
  can_view_reports: boolean;
}

// User Permissions (alias for backward compatibility)
export type UserPermissions = RolePermissions;

// Profile type definition to match the one from entities.ts
export interface Profile {
  id: string;
  name?: string;
  full_name: string;
  display_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  // Add other fields as needed for compatibility
}

// Define auth context type
export interface AuthContextType {
  user: Profile | null;
  signIn: (email?: string, password?: string) => Promise<void>;
  signUp: (email: string, password: string, data: any) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  isDemo: boolean;
  updateUserProfile: (data: Partial<Profile>) => Promise<void>;
  isAuthenticated: boolean; // Add for App.tsx
  login: (email: string, password: string) => Promise<void>; // Add for compatibility
  enableDemoMode: (enable: boolean) => void; // Add for compatibility
  register: (email: string, password: string, data: any) => Promise<void>; // Add for RegisterForm
  logout: () => Promise<void>; // Add for UserMenu
  demoMode: boolean; // Add for UserMenu
}
