
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
      tournaments: {
        Row: {
          id: string
          data: Json
          created_at: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          data: Json
          created_at?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          data?: Json
          created_at?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_tournaments: {
        Row: {
          user_id: string
          tournament_id: string
          role: string
          created_at: string
        }
        Insert: {
          user_id: string
          tournament_id: string
          role: string
          created_at?: string
        }
        Update: {
          user_id?: string
          tournament_id?: string
          role?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tournaments_tournament_id_fkey"
            columns: ["tournament_id"]
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tournaments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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
      [_ in never]: never
    }
  }
}
