
import { UserRole } from '@/types/tournament-enums';

export interface Profile {
  id: string;
  name: string; // Added this for compatibility
  full_name: string;
  display_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  player_details?: PlayerDetails;
  preferences?: UserPreferences;
  social_links?: SocialLinks;
  created_at?: string;
  updated_at?: string;
}

export interface PlayerDetails {
  skill_level?: string;
  preferred_partner?: string;
  availability?: string[];
  playing_history?: string;
  ranking?: number;
}

export interface UserPreferences {
  notification_emails?: boolean;
  notification_sms?: boolean;
  dark_mode?: boolean;
  language?: string;
}

export interface SocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
}

export interface RolePermissions {
  can_manage_tournaments: boolean;
  can_manage_users: boolean;
  can_manage_registrations: boolean;
  can_score_matches: boolean;
  can_view_reports: boolean;
}
