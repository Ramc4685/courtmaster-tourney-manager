
import { UserRole } from './tournament-enums';
import { 
  Tournament, 
  Match, 
  Court, 
  TournamentCategory, 
  Player, 
  Team,
  MatchScore,
  ScoringSettings,
  CourtStatus,
  MatchStatus,
  TournamentStage
} from './tournament';
import { 
  RegistrationStatus, 
  TournamentRegistration 
} from './registration';

// Player Details
export interface PlayerDetails {
  skill_level?: string;
  preferred_partner?: string;
  availability?: string[];
  playing_history?: string;
  ranking?: number;
  player_stats?: {
    total_matches: number;
    wins: number;
    losses: number;
    tournaments_played: number;
    tournaments_won: number;
    average_points_per_set: number;
    win_percentage: number;
    matches_won?: number;
    matches_played?: number;
    rating?: number;
  };
}

// User Preferences
export interface UserPreferences {
  notification_emails?: boolean;
  notification_sms?: boolean;
  dark_mode?: boolean;
  language?: string;
  notifications?: {
    match_reminders: boolean;
    tournament_updates: boolean;
    registration_notifications: boolean;
    email?: boolean;
  };
}

// Social Links
export interface SocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
}

// Profile
export interface Profile {
  id: string;
  name: string; // Added for backward compatibility
  full_name: string;
  display_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  player_details?: PlayerDetails;
  player_stats?: {
    total_matches: number;
    wins: number;
    losses: number;
    tournaments_played: number;
    tournaments_won: number;
    average_points_per_set: number;
    win_percentage: number;
    matches_won?: number;
    matches_played?: number;
    rating?: number;
  };
  preferences?: UserPreferences;
  social_links?: SocialLinks;
  created_at?: string;
  updated_at?: string;
}

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

// Score Set for scoring interface
export interface ScoreSet {
  set: number;
  team1: number;
  team2: number;
  completed: boolean;
}

// Match Scores type for scoring interface
export interface MatchScores {
  currentSet: number;
  sets: ScoreSet[];
}

// Notification interface
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

// Division interface
export interface Division {
  id: string;
  tournament_id: string;
  name: string;
  type: string;
  min_age?: number;
  max_age?: number;
  gender?: string;
  skill_level?: string;
  created_at: Date;
  updated_at: Date;
  capacity?: number; // Add for RegistrationAnalytics
}

// Registration interface
export interface Registration extends TournamentRegistration {
  // Additional fields specific to the entity model
}

// Re-export all types from tournament and registration
export {
  Tournament,
  Match,
  Court,
  TournamentCategory,
  Player,
  Team,
  MatchScore,
  ScoringSettings,
  RegistrationStatus,
  TournamentRegistration,
  UserRole,
  // Enums from tournament-enums.ts are imported via tournament.ts
  MatchStatus,
  CourtStatus,
  TournamentStage
};
