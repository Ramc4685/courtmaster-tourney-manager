import { Database as GeneratedDatabase } from '@/types/supabase';
import { RegistrationPersistenceDTO } from '@/infrastructure/persistence/registration.persistence';

export interface Database extends GeneratedDatabase {
  public: {
    Tables: {
      registrations: {
        Row: RegistrationPersistenceDTO;
        Insert: Omit<RegistrationPersistenceDTO, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<RegistrationPersistenceDTO>;
        Relationships: [
          {
            foreignKeyName: 'registrations_tournament_id_fkey';
            columns: ['tournament_id'];
            referencedRelation: 'tournaments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'registrations_player_id_fkey';
            columns: ['player_id'];
            referencedRelation: 'players';
            referencedColumns: ['id'];
          }
        ];
      };
    };
  };
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      courts: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          status: string
          tournament_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string
          tournament_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courts_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      divisions: {
        Row: {
          created_at: string | null
          gender: string | null
          id: string
          max_age: number | null
          min_age: number | null
          name: string
          skill_level: string | null
          tournament_id: string | null
          type: Database["public"]["Enums"]["division_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          gender?: string | null
          id?: string
          max_age?: number | null
          min_age?: number | null
          name: string
          skill_level?: string | null
          tournament_id?: string | null
          type: Database["public"]["Enums"]["division_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          gender?: string | null
          id?: string
          max_age?: number | null
          min_age?: number | null
          name?: string
          skill_level?: string | null
          tournament_id?: string | null
          type?: Database["public"]["Enums"]["division_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "divisions_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          court_id: string | null
          created_at: string
          division_id: string | null
          end_time: string | null
          id: string
          match_number: number
          notes: string | null
          player1_id: string | null
          player2_id: string | null
          round_number: number
          scheduled_time: string | null
          scores: Json | null
          start_time: string | null
          status: string
          team1_id: string | null
          team2_id: string | null
          tournament_id: string
          updated_at: string
          verified: boolean | null
          winner_id: string | null
          winner_team_id: string | null
        }
        Insert: {
          court_id?: string | null
          created_at?: string
          division_id?: string | null
          end_time?: string | null
          id?: string
          match_number: number
          notes?: string | null
          player1_id?: string | null
          player2_id?: string | null
          round_number: number
          scheduled_time?: string | null
          scores?: Json | null
          start_time?: string | null
          status?: string
          team1_id?: string | null
          team2_id?: string | null
          tournament_id: string
          updated_at?: string
          verified?: boolean | null
          winner_id?: string | null
          winner_team_id?: string | null
        }
        Update: {
          court_id?: string | null
          created_at?: string
          division_id?: string | null
          end_time?: string | null
          id?: string
          match_number?: number
          notes?: string | null
          player1_id?: string | null
          player2_id?: string | null
          round_number?: number
          scheduled_time?: string | null
          scores?: Json | null
          start_time?: string | null
          status?: string
          team1_id?: string | null
          team2_id?: string | null
          tournament_id?: string
          updated_at?: string
          verified?: boolean | null
          winner_id?: string | null
          winner_team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_player1_id_fkey"
            columns: ["player1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_player2_id_fkey"
            columns: ["player2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team1_id_fkey"
            columns: ["team1_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team2_id_fkey"
            columns: ["team2_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          payment_method: string | null
          payment_method_details: Json | null
          status: string
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          payment_method?: string | null
          payment_method_details?: Json | null
          status: string
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          payment_method?: string | null
          payment_method_details?: Json | null
          status?: string
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      player_history: {
        Row: {
          created_at: string | null
          division_id: string | null
          id: string
          matches_played: number | null
          matches_won: number | null
          partner_id: string | null
          placement: number | null
          player_id: string | null
          points_earned: number | null
          tournament_id: string | null
        }
        Insert: {
          created_at?: string | null
          division_id?: string | null
          id?: string
          matches_played?: number | null
          matches_won?: number | null
          partner_id?: string | null
          placement?: number | null
          player_id?: string | null
          points_earned?: number | null
          tournament_id?: string | null
        }
        Update: {
          created_at?: string | null
          division_id?: string | null
          id?: string
          matches_played?: number | null
          matches_won?: number | null
          partner_id?: string | null
          placement?: number | null
          player_id?: string | null
          points_earned?: number | null
          tournament_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_history_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_history_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_history_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_history_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          country_code: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          user_id: string | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          user_id?: string | null
        }
        Update: {
          country_code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          full_name: string | null
          id: string
          phone: string | null
          player_details: Json | null
          player_stats: Json | null
          preferences: Json | null
          role: Database["public"]["Enums"]["user_role"] | null
          social_links: Json | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          player_details?: Json | null
          player_stats?: Json | null
          preferences?: Json | null
          role?: Database["public"]["Enums"]["user_role"] | null
          social_links?: Json | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          player_details?: Json | null
          player_stats?: Json | null
          preferences?: Json | null
          role?: Database["public"]["Enums"]["user_role"] | null
          social_links?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      registrations: {
        Row: {
          created_at: string
          division_id: string
          id: string
          metadata: Json | null
          notes: string | null
          partner_id: string | null
          player_id: string
          priority: number | null
          status: string
          team_id: string | null
          tournament_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          division_id: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          partner_id?: string | null
          player_id: string
          priority?: number | null
          status?: string
          team_id?: string | null
          tournament_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          division_id?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          partner_id?: string | null
          player_id?: string
          priority?: number | null
          status?: string
          team_id?: string | null
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          advanced_analytics: boolean | null
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          custom_branding: boolean | null
          data_retention_days: number
          id: string
          max_players_per_tournament: number | null
          max_tournaments: number | null
          plan: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          advanced_analytics?: boolean | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          custom_branding?: boolean | null
          data_retention_days?: number
          id?: string
          max_players_per_tournament?: number | null
          max_tournaments?: number | null
          plan: string
          started_at?: string
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          advanced_analytics?: boolean | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          custom_branding?: boolean | null
          data_retention_days?: number
          id?: string
          max_players_per_tournament?: number | null
          max_tournaments?: number | null
          plan?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          captain_id: string | null
          created_at: string
          id: string
          name: string
          tournament_id: string
          updated_at: string
        }
        Insert: {
          captain_id?: string | null
          created_at?: string
          id?: string
          name: string
          tournament_id: string
          updated_at?: string
        }
        Update: {
          captain_id?: string | null
          created_at?: string
          id?: string
          name?: string
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_captain_id_fkey"
            columns: ["captain_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          sender_id: string
          tournament_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sender_id: string
          tournament_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_messages_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          name: string
          organizer_id: string | null
          registration_deadline: string | null
          start_date: string
          status: Database["public"]["Enums"]["tournament_status"] | null
          updated_at: string | null
          venue: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          name: string
          organizer_id?: string | null
          registration_deadline?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["tournament_status"] | null
          updated_at?: string | null
          venue?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          name?: string
          organizer_id?: string | null
          registration_deadline?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["tournament_status"] | null
          updated_at?: string | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tournaments: {
        Row: {
          created_at: string
          role: string
          tournament_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role: string
          tournament_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          tournament_id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      division_type: "skill" | "age" | "gender"
      match_status: "scheduled" | "in_progress" | "completed" | "cancelled"
      tournament_status:
        | "draft"
        | "registration"
        | "in_progress"
        | "completed"
        | "cancelled"
      user_role: "admin" | "organizer" | "player" | "scorekeeper"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      division_type: ["skill", "age", "gender"],
      match_status: ["scheduled", "in_progress", "completed", "cancelled"],
      tournament_status: [
        "draft",
        "registration",
        "in_progress",
        "completed",
        "cancelled",
      ],
      user_role: ["admin", "organizer", "player", "scorekeeper"],
    },
  },
} as const
