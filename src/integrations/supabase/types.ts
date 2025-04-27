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
          court_number: number
          created_at: string | null
          id: string
          name: string
          status: string | null
          tournament_id: string
          updated_at: string | null
        }
        Insert: {
          court_number: number
          created_at?: string | null
          id?: string
          name: string
          status?: string | null
          tournament_id: string
          updated_at?: string | null
        }
        Update: {
          court_number?: number
          created_at?: string | null
          id?: string
          name?: string
          status?: string | null
          tournament_id?: string
          updated_at?: string | null
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
          created_at: string | null
          division_id: string | null
          id: string
          scores: Json | null
          start_time: string | null
          status: Database["public"]["Enums"]["match_status"] | null
          team1_player1: string
          team1_player2: string | null
          team2_player1: string
          team2_player2: string | null
          tournament_id: string
          updated_at: string | null
          verified: boolean | null
          winner_team: number | null
        }
        Insert: {
          court_id?: string | null
          created_at?: string | null
          division_id?: string | null
          id?: string
          scores?: Json | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["match_status"] | null
          team1_player1: string
          team1_player2?: string | null
          team2_player1: string
          team2_player2?: string | null
          tournament_id: string
          updated_at?: string | null
          verified?: boolean | null
          winner_team?: number | null
        }
        Update: {
          court_id?: string | null
          created_at?: string | null
          division_id?: string | null
          id?: string
          scores?: Json | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["match_status"] | null
          team1_player1?: string
          team1_player2?: string | null
          team2_player1?: string
          team2_player2?: string | null
          tournament_id?: string
          updated_at?: string | null
          verified?: boolean | null
          winner_team?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_matches_court_id"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "matches_team1_player1_fkey"
            columns: ["team1_player1"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team1_player2_fkey"
            columns: ["team1_player2"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team2_player1_fkey"
            columns: ["team2_player1"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team2_player2_fkey"
            columns: ["team2_player2"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
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
      player_history: {
        Row: {
          created_at: string | null
          event_data: Json
          event_type: string
          id: string
          player_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data: Json
          event_type: string
          id?: string
          player_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json
          event_type?: string
          id?: string
          player_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_history_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          details: Json | null
          display_name: string | null
          full_name: string | null
          id: string
          phone: string | null
          player_stats: Json | null
          preferences: Json | null
          role: Database["public"]["Enums"]["user_role"] | null
          social_links: Json | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          details?: Json | null
          display_name?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          player_stats?: Json | null
          preferences?: Json | null
          role?: Database["public"]["Enums"]["user_role"] | null
          social_links?: Json | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          details?: Json | null
          display_name?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
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
          captain_id: string
          created_at: string
          id: string
          members: Json | null
          name: string
          tournament_id: string
          updated_at: string
        }
        Insert: {
          captain_id: string
          created_at?: string
          id?: string
          members?: Json | null
          name: string
          tournament_id: string
          updated_at?: string
        }
        Update: {
          captain_id?: string
          created_at?: string
          id?: string
          members?: Json | null
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
      tournament_brackets: {
        Row: {
          bracket_data: Json
          bracket_type: string
          created_at: string | null
          division_id: string | null
          id: string
          settings: Json | null
          tournament_id: string | null
          updated_at: string | null
        }
        Insert: {
          bracket_data?: Json
          bracket_type: string
          created_at?: string | null
          division_id?: string | null
          id?: string
          settings?: Json | null
          tournament_id?: string | null
          updated_at?: string | null
        }
        Update: {
          bracket_data?: Json
          bracket_type?: string
          created_at?: string | null
          division_id?: string | null
          id?: string
          settings?: Json | null
          tournament_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_brackets_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_brackets_tournament_id_fkey"
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
          current_stage: string
          description: string | null
          end_date: string
          id: string
          name: string
          organizer_id: string | null
          registration_config: Json | null
          registration_deadline: string | null
          schedule_config: Json | null
          scoring_config: Json | null
          start_date: string
          statistics: Json | null
          status: Database["public"]["Enums"]["tournament_status"] | null
          updated_at: string | null
          venue: string | null
        }
        Insert: {
          created_at?: string | null
          current_stage?: string
          description?: string | null
          end_date: string
          id?: string
          name: string
          organizer_id?: string | null
          registration_config?: Json | null
          registration_deadline?: string | null
          schedule_config?: Json | null
          scoring_config?: Json | null
          start_date: string
          statistics?: Json | null
          status?: Database["public"]["Enums"]["tournament_status"] | null
          updated_at?: string | null
          venue?: string | null
        }
        Update: {
          created_at?: string | null
          current_stage?: string
          description?: string | null
          end_date?: string
          id?: string
          name?: string
          organizer_id?: string | null
          registration_config?: Json | null
          registration_deadline?: string | null
          schedule_config?: Json | null
          scoring_config?: Json | null
          start_date?: string
          statistics?: Json | null
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
      user_role:
        | "admin"
        | "organizer"
        | "scorekeeper"
        | "player"
        | "spectator"
        | "director"
        | "front_desk"
        | "admin_staff"
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
      user_role: [
        "admin",
        "organizer",
        "scorekeeper",
        "player",
        "spectator",
        "director",
        "front_desk",
        "admin_staff",
      ],
    },
  },
} as const
