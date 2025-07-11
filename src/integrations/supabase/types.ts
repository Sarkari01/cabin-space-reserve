export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      banners: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          image_url: string
          priority: number
          start_date: string
          status: Database["public"]["Enums"]["banner_status"]
          target_audience: Database["public"]["Enums"]["banner_target_audience"]
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          image_url: string
          priority?: number
          start_date?: string
          status?: Database["public"]["Enums"]["banner_status"]
          target_audience?: Database["public"]["Enums"]["banner_target_audience"]
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string
          priority?: number
          start_date?: string
          status?: Database["public"]["Enums"]["banner_status"]
          target_audience?: Database["public"]["Enums"]["banner_target_audience"]
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_period: Database["public"]["Enums"]["booking_period"]
          created_at: string
          end_date: string
          id: string
          seat_id: string
          start_date: string
          status: string
          study_hall_id: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_period: Database["public"]["Enums"]["booking_period"]
          created_at?: string
          end_date: string
          id?: string
          seat_id: string
          start_date: string
          status?: string
          study_hall_id: string
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_period?: Database["public"]["Enums"]["booking_period"]
          created_at?: string
          end_date?: string
          id?: string
          seat_id?: string
          start_date?: string
          status?: string
          study_hall_id?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_seat_id_fkey"
            columns: ["seat_id"]
            isOneToOne: false
            referencedRelation: "seats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_study_hall_id_fkey"
            columns: ["study_hall_id"]
            isOneToOne: false
            referencedRelation: "study_halls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_settings: {
        Row: {
          created_at: string
          ekqr_enabled: boolean
          ekqr_merchant_code: string | null
          id: string
          offline_enabled: boolean
          razorpay_enabled: boolean
          razorpay_key_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          ekqr_enabled?: boolean
          ekqr_merchant_code?: string | null
          id?: string
          offline_enabled?: boolean
          razorpay_enabled?: boolean
          razorpay_key_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          ekqr_enabled?: boolean
          ekqr_merchant_code?: string | null
          id?: string
          offline_enabled?: boolean
          razorpay_enabled?: boolean
          razorpay_key_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          participant_1: string
          participant_2: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_1: string
          participant_2: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_1?: string
          participant_2?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_participant_1_fkey"
            columns: ["participant_1"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_participant_2_fkey"
            columns: ["participant_2"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          conversation_id: string
          created_at: string
          emoji: string | null
          id: string
          media_url: string | null
          message: string
          seen: boolean
          sender_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          emoji?: string | null
          id?: string
          media_url?: string | null
          message: string
          seen?: boolean
          sender_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          emoji?: string | null
          id?: string
          media_url?: string | null
          message?: string
          seen?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          media_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          media_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          media_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      news_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          status: string
          title: string
          updated_at: string
          video_url: string | null
          visible_to: Database["public"]["Enums"]["news_visibility"]
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          status?: string
          title: string
          updated_at?: string
          video_url?: string | null
          visible_to?: Database["public"]["Enums"]["news_visibility"]
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          status?: string
          title?: string
          updated_at?: string
          video_url?: string | null
          visible_to?: Database["public"]["Enums"]["news_visibility"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      seats: {
        Row: {
          created_at: string
          id: string
          is_available: boolean
          row_name: string
          seat_id: string
          seat_number: number
          study_hall_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_available?: boolean
          row_name: string
          seat_id: string
          seat_number: number
          study_hall_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_available?: boolean
          row_name?: string
          seat_id?: string
          seat_number?: number
          study_hall_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seats_study_hall_id_fkey"
            columns: ["study_hall_id"]
            isOneToOne: false
            referencedRelation: "study_halls"
            referencedColumns: ["id"]
          },
        ]
      }
      study_halls: {
        Row: {
          created_at: string
          custom_row_names: string[]
          daily_price: number
          description: string | null
          id: string
          image_url: string | null
          location: string
          merchant_id: string
          monthly_price: number
          name: string
          rows: number
          seats_per_row: number
          status: string
          total_seats: number
          updated_at: string
          weekly_price: number
        }
        Insert: {
          created_at?: string
          custom_row_names?: string[]
          daily_price?: number
          description?: string | null
          id?: string
          image_url?: string | null
          location: string
          merchant_id: string
          monthly_price?: number
          name: string
          rows: number
          seats_per_row: number
          status?: string
          total_seats: number
          updated_at?: string
          weekly_price?: number
        }
        Update: {
          created_at?: string
          custom_row_names?: string[]
          daily_price?: number
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string
          merchant_id?: string
          monthly_price?: number
          name?: string
          rows?: number
          seats_per_row?: number
          status?: string
          total_seats?: number
          updated_at?: string
          weekly_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "study_halls_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          id: string
          payment_data: Json | null
          payment_id: string | null
          payment_method: string
          qr_id: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          id?: string
          payment_data?: Json | null
          payment_id?: string | null
          payment_method: string
          qr_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          id?: string
          payment_data?: Json | null
          payment_id?: string | null
          payment_method?: string
          qr_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
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
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      banner_status: "active" | "inactive"
      banner_target_audience: "user" | "merchant" | "both"
      booking_period: "daily" | "weekly" | "monthly"
      news_visibility: "user" | "merchant" | "both"
      user_role: "admin" | "merchant" | "student"
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
      banner_status: ["active", "inactive"],
      banner_target_audience: ["user", "merchant", "both"],
      booking_period: ["daily", "weekly", "monthly"],
      news_visibility: ["user", "merchant", "both"],
      user_role: ["admin", "merchant", "student"],
    },
  },
} as const
