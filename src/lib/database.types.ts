export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          display_name: string | null
          avatar_url: string | null
          phone: string | null
          role: 'admin' | 'organizer' | 'player' | 'scorekeeper'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          display_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: 'admin' | 'organizer' | 'player' | 'scorekeeper'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          display_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: 'admin' | 'organizer' | 'player' | 'scorekeeper'
          created_at?: string
          updated_at?: string
        }
      }
      tournaments: {
        Row: {
          id: string
          name: string
          description: string | null
          start_date: string
          end_date: string
          registration_deadline: string | null
          venue: string | null
          status: 'draft' | 'registration' | 'in_progress' | 'completed' | 'cancelled'
          organizer_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          start_date: string
          end_date: string
          registration_deadline?: string | null
          venue?: string | null
          status?: 'draft' | 'registration' | 'in_progress' | 'completed' | 'cancelled'
          organizer_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          start_date?: string
          end_date?: string
          registration_deadline?: string | null
          venue?: string | null
          status?: 'draft' | 'registration' | 'in_progress' | 'completed' | 'cancelled'
          organizer_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      divisions: {
        Row: {
          id: string
          tournament_id: string
          name: string
          type: 'skill' | 'age' | 'gender'
          min_age: number | null
          max_age: number | null
          skill_level: string | null
          gender: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tournament_id: string
          name: string
          type: 'skill' | 'age' | 'gender'
          min_age?: number | null
          max_age?: number | null
          skill_level?: string | null
          gender?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tournament_id?: string
          name?: string
          type?: 'skill' | 'age' | 'gender'
          min_age?: number | null
          max_age?: number | null
          skill_level?: string | null
          gender?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      courts: {
        Row: {
          id: string
          tournament_id: string
          name: string
          court_number: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tournament_id: string
          name: string
          court_number: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tournament_id?: string
          name?: string
          court_number?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      registrations: {
        Row: {
          id: string
          tournament_id: string
          division_id: string
          player_id: string
          partner_id: string | null
          status: string
          metadata: Json
          notes: string | null
          priority: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tournament_id: string
          division_id: string
          player_id: string
          partner_id?: string | null
          status?: string
          metadata?: Json
          notes?: string | null
          priority?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tournament_id?: string
          division_id?: string
          player_id?: string
          partner_id?: string | null
          status?: string
          metadata?: Json
          notes?: string | null
          priority?: number
          created_at?: string
          updated_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          tournament_id: string
          division_id: string
          court_id: string | null
          team1_player1: string
          team1_player2: string | null
          team2_player1: string
          team2_player2: string | null
          start_time: string | null
          status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          winner_team: number | null
          scores: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tournament_id: string
          division_id: string
          court_id?: string | null
          team1_player1: string
          team1_player2?: string | null
          team2_player1: string
          team2_player2?: string | null
          start_time?: string | null
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          winner_team?: number | null
          scores?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tournament_id?: string
          division_id?: string
          court_id?: string | null
          team1_player1?: string
          team1_player2?: string | null
          team2_player1?: string
          team2_player2?: string | null
          start_time?: string | null
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          winner_team?: number | null
          scores?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          read?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'organizer' | 'player' | 'scorekeeper'
      tournament_status: 'draft' | 'registration' | 'in_progress' | 'completed' | 'cancelled'
      match_status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
      division_type: 'skill' | 'age' | 'gender'
    }
  }
} 