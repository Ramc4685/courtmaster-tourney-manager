
import { Profile } from '@/types/entities';
import { UserRole } from '@/types/tournament-enums';

export interface UserCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthContextType {
  user: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  demoMode: boolean;
  
  // Auth methods
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, data: { full_name: string, display_name: string, role: string }) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  
  // Compatibility methods (for existing components)
  login: (credentials: UserCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  enableDemoMode: (enabled: boolean) => void;
}
