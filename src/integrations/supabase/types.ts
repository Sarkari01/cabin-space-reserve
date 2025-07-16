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
      admin_user_profiles: {
        Row: {
          created_at: string | null
          department: string | null
          employee_id: string | null
          hire_date: string | null
          id: string
          manager_id: string | null
          permissions: Json | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          employee_id?: string | null
          hire_date?: string | null
          id?: string
          manager_id?: string | null
          permissions?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          department?: string | null
          employee_id?: string | null
          hire_date?: string | null
          id?: string
          manager_id?: string | null
          permissions?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_user_profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_user_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
          auto_approval_threshold: number | null
          brand_name: string | null
          created_at: string
          ekqr_enabled: boolean
          favicon_url: string | null
          id: string
          logo_url: string | null
          min_redemption_points: number | null
          minimum_settlement_amount: number | null
          minimum_withdrawal_amount: number | null
          offline_enabled: boolean
          platform_fee_percentage: number | null
          points_per_booking: number | null
          points_per_referral: number | null
          points_profile_complete: number | null
          razorpay_enabled: boolean
          rewards_conversion_rate: number | null
          rewards_enabled: boolean | null
          support_email: string | null
          support_phone: string | null
          tagline: string | null
          updated_at: string
          website_url: string | null
          withdrawal_processing_days: number | null
        }
        Insert: {
          auto_approval_threshold?: number | null
          brand_name?: string | null
          created_at?: string
          ekqr_enabled?: boolean
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          min_redemption_points?: number | null
          minimum_settlement_amount?: number | null
          minimum_withdrawal_amount?: number | null
          offline_enabled?: boolean
          platform_fee_percentage?: number | null
          points_per_booking?: number | null
          points_per_referral?: number | null
          points_profile_complete?: number | null
          razorpay_enabled?: boolean
          rewards_conversion_rate?: number | null
          rewards_enabled?: boolean | null
          support_email?: string | null
          support_phone?: string | null
          tagline?: string | null
          updated_at?: string
          website_url?: string | null
          withdrawal_processing_days?: number | null
        }
        Update: {
          auto_approval_threshold?: number | null
          brand_name?: string | null
          created_at?: string
          ekqr_enabled?: boolean
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          min_redemption_points?: number | null
          minimum_settlement_amount?: number | null
          minimum_withdrawal_amount?: number | null
          offline_enabled?: boolean
          platform_fee_percentage?: number | null
          points_per_booking?: number | null
          points_per_referral?: number | null
          points_profile_complete?: number | null
          razorpay_enabled?: boolean
          rewards_conversion_rate?: number | null
          rewards_enabled?: boolean | null
          support_email?: string | null
          support_phone?: string | null
          tagline?: string | null
          updated_at?: string
          website_url?: string | null
          withdrawal_processing_days?: number | null
        }
        Relationships: []
      }
      call_logs: {
        Row: {
          call_duration: number | null
          call_outcome: string | null
          call_purpose: string
          call_status: string
          caller_id: string
          contact_id: string
          contact_type: string
          created_at: string | null
          follow_up_date: string | null
          id: string
          notes: string | null
        }
        Insert: {
          call_duration?: number | null
          call_outcome?: string | null
          call_purpose: string
          call_status: string
          caller_id: string
          contact_id: string
          contact_type: string
          created_at?: string | null
          follow_up_date?: string | null
          id?: string
          notes?: string | null
        }
        Update: {
          call_duration?: number | null
          call_outcome?: string | null
          call_purpose?: string
          call_status?: string
          caller_id?: string
          contact_id?: string
          contact_type?: string
          created_at?: string | null
          follow_up_date?: string | null
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_caller_id_fkey"
            columns: ["caller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      coupon_usage: {
        Row: {
          booking_id: string | null
          coupon_id: string
          discount_amount: number
          id: string
          used_at: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          coupon_id: string
          discount_amount: number
          id?: string
          used_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          coupon_id?: string
          discount_amount?: number
          id?: string
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          id: string
          max_discount: number | null
          merchant_id: string | null
          min_booking_amount: number | null
          start_date: string
          status: string
          target_audience: string
          title: string
          type: string
          updated_at: string
          usage_count: number
          usage_limit: number | null
          user_usage_limit: number | null
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          id?: string
          max_discount?: number | null
          merchant_id?: string | null
          min_booking_amount?: number | null
          start_date?: string
          status?: string
          target_audience?: string
          title: string
          type: string
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
          user_usage_limit?: number | null
          value: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          id?: string
          max_discount?: number | null
          merchant_id?: string | null
          min_booking_amount?: number | null
          start_date?: string
          status?: string
          target_audience?: string
          title?: string
          type?: string
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
          user_usage_limit?: number | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_merchant_id_fkey"
            columns: ["merchant_id"]
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
      incharge_activity_logs: {
        Row: {
          action: string
          booking_id: string | null
          created_at: string
          details: Json | null
          id: string
          incharge_id: string
          study_hall_id: string | null
        }
        Insert: {
          action: string
          booking_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          incharge_id: string
          study_hall_id?: string | null
        }
        Update: {
          action?: string
          booking_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          incharge_id?: string
          study_hall_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incharge_activity_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incharge_activity_logs_incharge_id_fkey"
            columns: ["incharge_id"]
            isOneToOne: false
            referencedRelation: "incharges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incharge_activity_logs_study_hall_id_fkey"
            columns: ["study_hall_id"]
            isOneToOne: false
            referencedRelation: "study_halls"
            referencedColumns: ["id"]
          },
        ]
      }
      incharges: {
        Row: {
          account_activated: boolean
          assigned_study_halls: Json
          auth_method: string | null
          created_at: string
          created_by: string
          email: string
          full_name: string
          id: string
          invitation_sent_at: string | null
          invitation_token: string | null
          merchant_id: string
          mobile: string
          password_last_changed: string | null
          password_set_by_merchant: boolean | null
          permissions: Json
          status: string
          updated_at: string
        }
        Insert: {
          account_activated?: boolean
          assigned_study_halls?: Json
          auth_method?: string | null
          created_at?: string
          created_by: string
          email: string
          full_name: string
          id?: string
          invitation_sent_at?: string | null
          invitation_token?: string | null
          merchant_id: string
          mobile: string
          password_last_changed?: string | null
          password_set_by_merchant?: boolean | null
          permissions?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          account_activated?: boolean
          assigned_study_halls?: Json
          auth_method?: string | null
          created_at?: string
          created_by?: string
          email?: string
          full_name?: string
          id?: string
          invitation_sent_at?: string | null
          invitation_token?: string | null
          merchant_id?: string
          mobile?: string
          password_last_changed?: string | null
          password_set_by_merchant?: boolean | null
          permissions?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incharges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incharges_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          address: string | null
          created_at: string
          description: string | null
          email: string
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          status: string
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          description?: string | null
          email: string
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          description?: string | null
          email?: string
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "institutions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_documents: {
        Row: {
          document_type: string
          file_name: string
          file_size: number
          file_url: string
          id: string
          merchant_profile_id: string
          mime_type: string
          uploaded_at: string
          verification_notes: string | null
          verification_status: string
        }
        Insert: {
          document_type: string
          file_name: string
          file_size: number
          file_url: string
          id?: string
          merchant_profile_id: string
          mime_type: string
          uploaded_at?: string
          verification_notes?: string | null
          verification_status?: string
        }
        Update: {
          document_type?: string
          file_name?: string
          file_size?: number
          file_url?: string
          id?: string
          merchant_profile_id?: string
          mime_type?: string
          uploaded_at?: string
          verification_notes?: string | null
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_documents_merchant_profile_id_fkey"
            columns: ["merchant_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_profiles: {
        Row: {
          account_holder_name: string | null
          account_number: string | null
          bank_name: string | null
          business_address: string | null
          business_email: string | null
          created_at: string
          gstin_pan: string | null
          id: string
          ifsc_code: string | null
          is_onboarding_complete: boolean
          merchant_id: string
          onboarding_step: number
          phone: string | null
          trade_license_document_url: string | null
          trade_license_number: string | null
          updated_at: string
          verification_status: string
        }
        Insert: {
          account_holder_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          business_address?: string | null
          business_email?: string | null
          created_at?: string
          gstin_pan?: string | null
          id?: string
          ifsc_code?: string | null
          is_onboarding_complete?: boolean
          merchant_id: string
          onboarding_step?: number
          phone?: string | null
          trade_license_document_url?: string | null
          trade_license_number?: string | null
          updated_at?: string
          verification_status?: string
        }
        Update: {
          account_holder_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          business_address?: string | null
          business_email?: string | null
          created_at?: string
          gstin_pan?: string | null
          id?: string
          ifsc_code?: string | null
          is_onboarding_complete?: boolean
          merchant_id?: string
          onboarding_step?: number
          phone?: string | null
          trade_license_document_url?: string | null
          trade_license_number?: string | null
          updated_at?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_profiles_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "profiles"
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
          is_trial: boolean | null
          last_payment_date: string | null
          max_study_halls: number | null
          merchant_id: string
          next_payment_date: string | null
          payment_method: string | null
          plan_id: string
          plan_type: string | null
          start_date: string
          status: string
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean | null
          created_at?: string
          end_date?: string | null
          id?: string
          is_trial?: boolean | null
          last_payment_date?: string | null
          max_study_halls?: number | null
          merchant_id: string
          next_payment_date?: string | null
          payment_method?: string | null
          plan_id: string
          plan_type?: string | null
          start_date?: string
          status?: string
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean | null
          created_at?: string
          end_date?: string | null
          id?: string
          is_trial?: boolean | null
          last_payment_date?: string | null
          max_study_halls?: number | null
          merchant_id?: string
          next_payment_date?: string | null
          payment_method?: string | null
          plan_id?: string
          plan_type?: string | null
          start_date?: string
          status?: string
          trial_end_date?: string | null
          trial_start_date?: string | null
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
          institution_id: string | null
          scheduled_at: string | null
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
          institution_id?: string | null
          scheduled_at?: string | null
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
          institution_id?: string | null
          scheduled_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          video_url?: string | null
          visible_to?: Database["public"]["Enums"]["news_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "news_posts_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          active: boolean | null
          button_text: string | null
          button_url: string | null
          click_count: number | null
          created_at: string
          duration_seconds: number | null
          expires_at: string | null
          id: string
          image_url: string | null
          message: string
          popup_enabled: boolean | null
          priority: number | null
          read: boolean
          schedule_time: string | null
          shown_count: number | null
          target_audience: string | null
          title: string
          trigger_event: string | null
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          active?: boolean | null
          button_text?: string | null
          button_url?: string | null
          click_count?: number | null
          created_at?: string
          duration_seconds?: number | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          message: string
          popup_enabled?: boolean | null
          priority?: number | null
          read?: boolean
          schedule_time?: string | null
          shown_count?: number | null
          target_audience?: string | null
          title: string
          trigger_event?: string | null
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          active?: boolean | null
          button_text?: string | null
          button_url?: string | null
          click_count?: number | null
          created_at?: string
          duration_seconds?: number | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          message?: string
          popup_enabled?: boolean | null
          priority?: number | null
          read?: boolean
          schedule_time?: string | null
          shown_count?: number | null
          target_audience?: string | null
          title?: string
          trigger_event?: string | null
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      popup_user_interactions: {
        Row: {
          clicked_at: string | null
          created_at: string | null
          dismissed_at: string | null
          id: string
          notification_id: string
          shown_at: string | null
          user_id: string
        }
        Insert: {
          clicked_at?: string | null
          created_at?: string | null
          dismissed_at?: string | null
          id?: string
          notification_id: string
          shown_at?: string | null
          user_id: string
        }
        Update: {
          clicked_at?: string | null
          created_at?: string | null
          dismissed_at?: string | null
          id?: string
          notification_id?: string
          shown_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "popup_user_interactions_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
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
          student_number: number | null
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
          student_number?: number | null
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
          student_number?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          status: string
          successful_referrals: number
          total_earnings: number
          total_referrals: number
          updated_at: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          status?: string
          successful_referrals?: number
          total_earnings?: number
          total_referrals?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          status?: string
          successful_referrals?: number
          total_earnings?: number
          total_referrals?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_rewards: {
        Row: {
          booking_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          referee_coupon_id: string | null
          referee_id: string
          referee_reward_points: number
          referral_code_id: string
          referrer_coupon_id: string | null
          referrer_id: string
          referrer_reward_points: number
          status: string
        }
        Insert: {
          booking_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          referee_coupon_id?: string | null
          referee_id: string
          referee_reward_points?: number
          referral_code_id: string
          referrer_coupon_id?: string | null
          referrer_id: string
          referrer_reward_points?: number
          status?: string
        }
        Update: {
          booking_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          referee_coupon_id?: string | null
          referee_id?: string
          referee_reward_points?: number
          referral_code_id?: string
          referrer_coupon_id?: string | null
          referrer_id?: string
          referrer_reward_points?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_rewards_referee_coupon_id_fkey"
            columns: ["referee_coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_rewards_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_rewards_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_rewards_referrer_coupon_id_fkey"
            columns: ["referrer_coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_rewards_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_transactions: {
        Row: {
          booking_id: string | null
          created_at: string
          id: string
          points: number
          reason: string
          referral_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          id?: string
          points: number
          reason: string
          referral_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          id?: string
          points?: number
          reason?: string
          referral_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          available_points: number
          created_at: string
          id: string
          lifetime_earned: number
          lifetime_redeemed: number
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available_points?: number
          created_at?: string
          id?: string
          lifetime_earned?: number
          lifetime_redeemed?: number
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available_points?: number
          created_at?: string
          id?: string
          lifetime_earned?: number
          lifetime_redeemed?: number
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      settlement_transactions: {
        Row: {
          booking_id: string
          booking_number: number | null
          created_at: string
          id: string
          settlement_id: string
          transaction_amount: number
          transaction_id: string
          transaction_number: number | null
        }
        Insert: {
          booking_id: string
          booking_number?: number | null
          created_at?: string
          id?: string
          settlement_id: string
          transaction_amount: number
          transaction_id: string
          transaction_number?: number | null
        }
        Update: {
          booking_id?: string
          booking_number?: number | null
          created_at?: string
          id?: string
          settlement_id?: string
          transaction_amount?: number
          transaction_id?: string
          transaction_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "settlement_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_transactions_settlement_id_fkey"
            columns: ["settlement_id"]
            isOneToOne: false
            referencedRelation: "settlements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_transactions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      settlements: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          merchant_id: string
          net_settlement_amount: number
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          payment_reference: string | null
          platform_fee_amount: number
          platform_fee_percentage: number
          settlement_number: number
          status: string
          total_booking_amount: number
          updated_at: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          merchant_id: string
          net_settlement_amount?: number
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          platform_fee_amount?: number
          platform_fee_percentage?: number
          settlement_number: number
          status?: string
          total_booking_amount?: number
          updated_at?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          merchant_id?: string
          net_settlement_amount?: number
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          platform_fee_amount?: number
          platform_fee_percentage?: number
          settlement_number?: number
          status?: string
          total_booking_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlements_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_hall_images: {
        Row: {
          created_at: string
          display_order: number
          file_path: string
          file_size: number
          id: string
          image_url: string
          is_main: boolean
          mime_type: string
          study_hall_id: string
          updated_at: string
          uploaded_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          file_path: string
          file_size: number
          id?: string
          image_url: string
          is_main?: boolean
          mime_type: string
          study_hall_id: string
          updated_at?: string
          uploaded_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          file_path?: string
          file_size?: number
          id?: string
          image_url?: string
          is_main?: boolean
          mime_type?: string
          study_hall_id?: string
          updated_at?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_hall_images_study_hall_id_fkey"
            columns: ["study_hall_id"]
            isOneToOne: false
            referencedRelation: "study_halls"
            referencedColumns: ["id"]
          },
        ]
      }
      study_hall_reviews: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          merchant_id: string
          merchant_response: string | null
          rating: number
          review_text: string | null
          status: Database["public"]["Enums"]["review_status"]
          study_hall_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          merchant_id: string
          merchant_response?: string | null
          rating: number
          review_text?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          study_hall_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          merchant_id?: string
          merchant_response?: string | null
          rating?: number
          review_text?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          study_hall_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_hall_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_hall_reviews_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_hall_reviews_study_hall_id_fkey"
            columns: ["study_hall_id"]
            isOneToOne: false
            referencedRelation: "study_halls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_hall_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_halls: {
        Row: {
          amenities: Json | null
          average_rating: number | null
          created_at: string
          custom_row_names: string[]
          daily_price: number
          description: string | null
          formatted_address: string | null
          hall_number: number | null
          id: string
          image_url: string | null
          latitude: number | null
          location: string
          longitude: number | null
          merchant_id: string
          monthly_price: number
          name: string
          rows: number
          seats_per_row: number
          status: string
          total_reviews: number | null
          total_seats: number
          updated_at: string
          weekly_price: number
        }
        Insert: {
          amenities?: Json | null
          average_rating?: number | null
          created_at?: string
          custom_row_names?: string[]
          daily_price?: number
          description?: string | null
          formatted_address?: string | null
          hall_number?: number | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          location: string
          longitude?: number | null
          merchant_id: string
          monthly_price?: number
          name: string
          rows: number
          seats_per_row: number
          status?: string
          total_reviews?: number | null
          total_seats: number
          updated_at?: string
          weekly_price?: number
        }
        Update: {
          amenities?: Json | null
          average_rating?: number | null
          created_at?: string
          custom_row_names?: string[]
          daily_price?: number
          description?: string | null
          formatted_address?: string | null
          hall_number?: number | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          merchant_id?: string
          monthly_price?: number
          name?: string
          rows?: number
          seats_per_row?: number
          status?: string
          total_reviews?: number | null
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
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string | null
          description: string
          id: string
          merchant_id: string | null
          priority: string | null
          resolution: string | null
          resolved_at: string | null
          status: string | null
          ticket_number: number | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category: string
          created_at?: string | null
          description: string
          id?: string
          merchant_id?: string | null
          priority?: string | null
          resolution?: string | null
          resolved_at?: string | null
          status?: string | null
          ticket_number?: number | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string | null
          description?: string
          id?: string
          merchant_id?: string | null
          priority?: string | null
          resolution?: string | null
          resolved_at?: string | null
          status?: string | null
          ticket_number?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
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
      withdrawal_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          merchant_id: string
          payment_method: string | null
          payment_reference: string | null
          processed_at: string | null
          processed_by: string | null
          requested_amount: number
          status: string
          updated_at: string
          withdrawal_method: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          merchant_id: string
          payment_method?: string | null
          payment_reference?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_amount: number
          status?: string
          updated_at?: string
          withdrawal_method?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          merchant_id?: string
          payment_method?: string | null
          payment_reference?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_amount?: number
          status?: string
          updated_at?: string
          withdrawal_method?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawal_requests_processed_by_fkey"
            columns: ["processed_by"]
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
      audit_and_fix_study_hall_seats: {
        Args: Record<PropertyKey, never>
        Returns: {
          study_hall_id: string
          expected_seats: number
          actual_seats: number
          fixed: boolean
        }[]
      }
      auto_cancel_unpaid_bookings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      auto_complete_expired_bookings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      auto_publish_scheduled_news: {
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
      calculate_distance: {
        Args: { lat1: number; lon1: number; lat2: number; lon2: number }
        Returns: number
      }
      check_seat_availability: {
        Args: { p_seat_id: string; p_start_date: string; p_end_date: string }
        Returns: boolean
      }
      cleanup_old_failed_transactions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_invitation_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_short_id: {
        Args: { table_name: string; column_name: string }
        Returns: number
      }
      get_active_popup_notifications: {
        Args: { p_user_id: string; p_user_role?: string }
        Returns: {
          id: string
          title: string
          message: string
          image_url: string
          button_text: string
          button_url: string
          priority: number
          created_at: string
          duration_seconds: number
        }[]
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
      get_eligible_bookings_for_review: {
        Args: { p_user_id: string }
        Returns: {
          booking_id: string
          study_hall_id: string
          study_hall_name: string
          end_date: string
          already_reviewed: boolean
        }[]
      }
      get_eligible_transactions_for_settlement: {
        Args: { p_merchant_id: string }
        Returns: {
          transaction_id: string
          booking_id: string
          amount: number
          transaction_created_at: string
          booking_start_date: string
          booking_end_date: string
          user_email: string
          study_hall_name: string
          transaction_number: number
          booking_number: number
        }[]
      }
      get_merchant_available_balance: {
        Args: { p_merchant_id: string }
        Returns: {
          total_earnings: number
          platform_fees: number
          net_earnings: number
          pending_withdrawals: number
          available_balance: number
        }[]
      }
      get_merchant_subscription_limits: {
        Args: { p_merchant_id: string }
        Returns: {
          max_study_halls: number
          current_study_halls: number
          is_trial: boolean
          trial_expires_at: string
          plan_name: string
          status: string
          can_create_study_hall: boolean
        }[]
      }
      get_nearby_study_halls: {
        Args: { user_lat: number; user_lon: number; radius_km?: number }
        Returns: {
          id: string
          name: string
          location: string
          formatted_address: string
          latitude: number
          longitude: number
          distance_km: number
          daily_price: number
          weekly_price: number
          monthly_price: number
          amenities: Json
          image_url: string
          merchant_id: string
        }[]
      }
      get_unsettled_transactions_summary: {
        Args: { p_merchant_id: string }
        Returns: {
          total_transactions: number
          total_amount: number
          oldest_transaction_date: string
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_trial_expired: {
        Args: { subscription_id: string }
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
      update_user_rewards: {
        Args: {
          p_user_id: string
          p_points: number
          p_type: string
          p_reason: string
          p_booking_id?: string
          p_referral_id?: string
        }
        Returns: undefined
      }
      validate_date_string: {
        Args: { date_string: string }
        Returns: boolean
      }
      validate_withdrawal_request: {
        Args: { p_merchant_id: string; p_amount: number }
        Returns: {
          is_valid: boolean
          error_message: string
          available_balance: number
        }[]
      }
    }
    Enums: {
      banner_status: "active" | "inactive"
      banner_target_audience: "user" | "merchant" | "both"
      booking_period: "daily" | "weekly" | "monthly"
      news_visibility: "user" | "merchant" | "both"
      review_status: "approved" | "pending" | "hidden"
      user_role:
        | "admin"
        | "merchant"
        | "student"
        | "incharge"
        | "telemarketing_executive"
        | "pending_payments_caller"
        | "customer_care_executive"
        | "settlement_manager"
        | "general_administrator"
        | "institution"
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
      review_status: ["approved", "pending", "hidden"],
      user_role: [
        "admin",
        "merchant",
        "student",
        "incharge",
        "telemarketing_executive",
        "pending_payments_caller",
        "customer_care_executive",
        "settlement_manager",
        "general_administrator",
        "institution",
      ],
    },
  },
} as const
