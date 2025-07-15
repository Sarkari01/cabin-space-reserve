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
          booking_number: number | null
          booking_period: Database["public"]["Enums"]["booking_period"]
          created_at: string
          end_date: string
          id: string
          payment_status: string | null
          seat_id: string
          start_date: string
          status: string
          study_hall_id: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_number?: number | null
          booking_period: Database["public"]["Enums"]["booking_period"]
          created_at?: string
          end_date: string
          id?: string
          payment_status?: string | null
          seat_id: string
          start_date: string
          status?: string
          study_hall_id: string
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_number?: number | null
          booking_period?: Database["public"]["Enums"]["booking_period"]
          created_at?: string
          end_date?: string
          id?: string
          payment_status?: string | null
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
          id: string
          offline_enabled: boolean
          razorpay_enabled: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          ekqr_enabled?: boolean
          id?: string
          offline_enabled?: boolean
          razorpay_enabled?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          ekqr_enabled?: boolean
          id?: string
          offline_enabled?: boolean
          razorpay_enabled?: boolean
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
      favorites: {
        Row: {
          created_at: string
          id: string
          study_hall_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          study_hall_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          study_hall_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_study_hall_id_fkey"
            columns: ["study_hall_id"]
            isOneToOne: false
            referencedRelation: "study_halls"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_subscriptions: {
        Row: {
          auto_renew: boolean | null
          created_at: string
          end_date: string | null
          id: string
          last_payment_date: string | null
          merchant_id: string
          next_payment_date: string | null
          payment_method: string | null
          plan_id: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean | null
          created_at?: string
          end_date?: string | null
          id?: string
          last_payment_date?: string | null
          merchant_id: string
          next_payment_date?: string | null
          payment_method?: string | null
          plan_id: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean | null
          created_at?: string
          end_date?: string | null
          id?: string
          last_payment_date?: string | null
          merchant_id?: string
          next_payment_date?: string | null
          payment_method?: string | null
          plan_id?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_subscriptions_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
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
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          merchant_number: number | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          merchant_number?: number | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          merchant_number?: number | null
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
          amenities: Json | null
          created_at: string
          custom_row_names: string[]
          daily_price: number
          description: string | null
          hall_number: number | null
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
          amenities?: Json | null
          created_at?: string
          custom_row_names?: string[]
          daily_price?: number
          description?: string | null
          hall_number?: number | null
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
          amenities?: Json | null
          created_at?: string
          custom_row_names?: string[]
          daily_price?: number
          description?: string | null
          hall_number?: number | null
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
      subscription_plans: {
        Row: {
          analytics_access: boolean | null
          created_at: string
          duration: string
          features: Json
          id: string
          max_bookings_per_month: number | null
          max_study_halls: number | null
          name: string
          price: number
          priority_support: boolean | null
          status: string
          updated_at: string
        }
        Insert: {
          analytics_access?: boolean | null
          created_at?: string
          duration: string
          features?: Json
          id?: string
          max_bookings_per_month?: number | null
          max_study_halls?: number | null
          name: string
          price: number
          priority_support?: boolean | null
          status?: string
          updated_at?: string
        }
        Update: {
          analytics_access?: boolean | null
          created_at?: string
          duration?: string
          features?: Json
          id?: string
          max_bookings_per_month?: number | null
          max_study_halls?: number | null
          name?: string
          price?: number
          priority_support?: boolean | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscription_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          merchant_id: string
          payment_data: Json | null
          payment_id: string | null
          payment_method: string
          status: string
          subscription_id: string | null
          transaction_number: number | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          merchant_id: string
          payment_data?: Json | null
          payment_id?: string | null
          payment_method?: string
          status?: string
          subscription_id?: string | null
          transaction_number?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          merchant_id?: string
          payment_data?: Json | null
          payment_id?: string | null
          payment_method?: string
          status?: string
          subscription_id?: string | null
          transaction_number?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_transactions_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "merchant_subscriptions"
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
          transaction_number: number | null
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
          transaction_number?: number | null
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
          transaction_number?: number | null
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
      user_settings: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email_notifications: boolean | null
          id: string
          language: string | null
          location: string | null
          phone_verified: boolean | null
          push_notifications: boolean | null
          theme: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          location?: string | null
          phone_verified?: boolean | null
          push_notifications?: boolean | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          location?: string | null
          phone_verified?: boolean | null
          push_notifications?: boolean | null
          theme?: string | null
          timezone?: string | null
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
      auto_cancel_unpaid_bookings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      auto_complete_expired_bookings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      auto_recover_pending_ekqr_payments: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      auto_release_expired_bookings: {
        Args: Record<PropertyKey, never>
        Returns: {
          released_count: number
          released_booking_ids: string[]
        }[]
      }
      calculate_booking_amount: {
        Args: {
          p_start_date: string
          p_end_date: string
          p_daily_price: number
          p_weekly_price: number
          p_monthly_price: number
        }
        Returns: {
          amount: number
          days: number
          method: string
        }[]
      }
      check_seat_availability: {
        Args: { p_seat_id: string; p_start_date: string; p_end_date: string }
        Returns: boolean
      }
      cleanup_old_failed_transactions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_short_id: {
        Args: { table_name: string; column_name: string }
        Returns: number
      }
      get_available_seats: {
        Args: {
          p_study_hall_id: string
          p_start_date: string
          p_end_date: string
        }
        Returns: {
          seat_id: string
          seat_identifier: string
          row_name: string
          seat_number: number
        }[]
      }
      get_booking_health_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_bookings: number
          pending_unpaid: number
          expired_active: number
          orphaned_seats: number
          confirmed_future: number
          completed_today: number
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      progress_booking_statuses: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      run_booking_lifecycle_checks: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      send_booking_reminders: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
