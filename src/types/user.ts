export enum UserRole {
  ADMIN = "admin",
  ORGANIZER = "organizer",
  SCOREKEEPER = "scorekeeper",
  PLAYER = "player",
  FRONT_DESK = "front_desk",
  ADMIN_STAFF = "admin_staff",
  DIRECTOR = "director",
  SPECTATOR = "spectator"
}

export interface RolePermissions {
  [key: string]: boolean;
  viewTournament: boolean;
  editTournament: boolean;
  createTournament: boolean;
  deleteTournament: boolean;
  viewMatch: boolean;
  editMatch: boolean;
  createMatch: boolean;
  deleteMatch: boolean;
  viewRegistration: boolean;
  editRegistration: boolean;
  createRegistration: boolean;
  deleteRegistration: boolean;
  viewCourt: boolean;
  editCourt: boolean;
  createCourt: boolean;
  deleteCourt: boolean;
  viewTeam: boolean;
  editTeam: boolean;
  createTeam: boolean;
  deleteTeam: boolean;
  viewPlayer: boolean;
  editPlayer: boolean;
  createPlayer: boolean;
  deletePlayer: boolean;
  viewScoring: boolean;
  editScoring: boolean;
  manageCheckIn: boolean;
  manageSchedule: boolean;
  viewDashboard: boolean;
}

export interface UserPermissions extends RolePermissions {
  // Additional user-specific permissions
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  full_name?: string;
  display_name?: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  country_code?: string;
  created_at?: string;
  updated_at?: string;
  player_details?: {
    skillLevel?: string;
    preferredEvents?: string[];
    playingSince?: string;
    equipment?: {
      racket?: string;
      shoes?: string;
    };
  };
  player_stats?: {
    matchesPlayed: number;
    matchesWon: number;
    matchesLost: number;
    winRate: number;
    pointsScored: number;
    pointsConceded: number;
  };
  preferences?: {
    notifications: {
      email: boolean;
      push: boolean;
      tournament_updates: boolean;
      match_reminders: boolean;
    };
    privacy: {
      show_profile: boolean;
      show_stats: boolean;
      show_history: boolean;
    };
  };
  social_links?: Record<string, string>;
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
  refreshSession: () => Promise<void>;  // Added for session refresh support
}
