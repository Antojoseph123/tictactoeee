export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      casino_balances: {
        Row: {
          balance: number
          created_at: string
          id: string
          total_wagered: number
          total_won: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          total_wagered?: number
          total_won?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          total_wagered?: number
          total_won?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      game_rooms: {
        Row: {
          created_at: string
          game_id: string | null
          guest_id: string | null
          guest_name: string | null
          host_id: string
          host_name: string
          id: string
          room_code: string
          status: string
        }
        Insert: {
          created_at?: string
          game_id?: string | null
          guest_id?: string | null
          guest_name?: string | null
          host_id: string
          host_name?: string
          id?: string
          room_code: string
          status?: string
        }
        Update: {
          created_at?: string
          game_id?: string | null
          guest_id?: string | null
          guest_name?: string | null
          host_id?: string
          host_name?: string
          id?: string
          room_code?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_rooms_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_scores: {
        Row: {
          created_at: string
          game_id: string
          id: string
          level: number | null
          player_name: string
          score: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          level?: number | null
          player_name?: string
          score?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          level?: number | null
          player_name?: string
          score?: number
          user_id?: string | null
        }
        Relationships: []
      }
      games: {
        Row: {
          ai_difficulty: string | null
          board: string[]
          completed_at: string | null
          created_at: string
          current_player: string
          game_mode: string
          id: string
          moves: Json
          player_o: string
          player_x: string
          room_code: string | null
          user_id: string | null
          winner: string | null
        }
        Insert: {
          ai_difficulty?: string | null
          board?: string[]
          completed_at?: string | null
          created_at?: string
          current_player?: string
          game_mode?: string
          id?: string
          moves?: Json
          player_o?: string
          player_x?: string
          room_code?: string | null
          user_id?: string | null
          winner?: string | null
        }
        Update: {
          ai_difficulty?: string | null
          board?: string[]
          completed_at?: string | null
          created_at?: string
          current_player?: string
          game_mode?: string
          id?: string
          moves?: Json
          player_o?: string
          player_x?: string
          room_code?: string | null
          user_id?: string | null
          winner?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_index: number | null
          avatar_url: string | null
          created_at: string
          draws: number
          games_played: number
          id: string
          is_banned: boolean | null
          losses: number
          updated_at: string
          user_id: string
          username: string
          wins: number
        }
        Insert: {
          avatar_index?: number | null
          avatar_url?: string | null
          created_at?: string
          draws?: number
          games_played?: number
          id?: string
          is_banned?: boolean | null
          losses?: number
          updated_at?: string
          user_id: string
          username: string
          wins?: number
        }
        Update: {
          avatar_index?: number | null
          avatar_url?: string | null
          created_at?: string
          draws?: number
          games_played?: number
          id?: string
          is_banned?: boolean | null
          losses?: number
          updated_at?: string
          user_id?: string
          username?: string
          wins?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_profile_stats:
        | { Args: { p_result: string }; Returns: undefined }
        | { Args: { p_result: string; p_user_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
