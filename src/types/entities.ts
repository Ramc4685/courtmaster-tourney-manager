import { User as SupabaseUser } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'organizer' | 'player' | 'guest';
export type TournamentStatus = 'draft' | 'registration' | 'in_progress' | 'completed' | 'cancelled';
export type MatchStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type DivisionType = 'skill' | 'age' | 'gender';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
  player_stats: PlayerStats;
  preferences: UserPreferences;
  player_details: PlayerDetails;
  social_links: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    website?: string;
  };
}

export interface PlayerStats {
  matches_played: number;
  matches_won: number;
  tournaments_played: number;
  tournaments_won: number;
  rating: number;
  ranking: number | null;
}

export interface UserPreferences {
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
  display: {
    theme: 'light' | 'dark';
    language: string;
  };
}

export interface PlayerDetails {
  birthdate: string | null;
  gender: string | null;
  skill_level: string | null;
  dominant_hand: 'left' | 'right' | 'ambidextrous' | null;
  location: {
    city: string | null;
    state: string | null;
    country: string | null;
  };
  bio: string | null;
}

export type NewProfile = Omit<Profile, 'id'> & {
  id: string;
};

export type ProfileUpdate = Partial<Profile> & {
  updated_at: string;
};

export interface Tournament {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  registration_deadline: string | null;
  venue: string | null;
  status: TournamentStatus;
  organizer_id: string;
  divisions: Division[];
  created_at: string;
  updated_at: string;
}

export interface Division {
  id: string;
  tournament_id: string;
  name: string;
  type: DivisionType;
  min_age: number | null;
  max_age: number | null;
  skill_level: string | null;
  gender: string | null;
  capacity: number | null;
  created_at: string;
  updated_at: string;
}

export interface Court {
  id: string;
  tournament_id: string;
  name: string;
  court_number: number;
  status: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Registration {
  id: string;
  tournament_id: string;
  division_id: string;
  player_id: string;
  partner_id: string | null;
  status: string;
  metadata: Record<string, any>;
  notes: string | null;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface ScoreSet {
  set: number;
  team1: number;
  team2: number;
  completed: boolean;
  // Add game scores if needed: games?: { team1: number, team2: number }[];
}

export interface MatchScores {
  currentSet: number;
  sets: ScoreSet[];
  server?: string | null; // Player or Team ID
  currentEndTime?: 'team1_end' | 'team2_end' | null;
  // history?: any[]; // Optional: For undo/redo stored in JSON
}

export interface Match {
  id: string;
  tournament_id: string;
  division_id: string;
  round_number: number;
  match_number: number;
  player1_id: string | null;
  player2_id: string | null;
  team1_id: string | null;
  team2_id: string | null;
  court_id: string | null;
  status: MatchStatus;
  scheduled_time: string | null;
  start_time: string | null;
  end_time: string | null;
  scores: MatchScores | null;
  winner_id: string | null;
  winner_team_id: string | null;
  notes: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
} 