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
      api_keys: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          key_name: string
          key_value: string
          service_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          key_name: string
          key_value: string
          service_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          key_name?: string
          key_value?: string
          service_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      automation_executions: {
        Row: {
          automation_rule_id: string | null
          content_generated: string | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          execution_data: Json | null
          execution_trigger: string | null
          id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          automation_rule_id?: string | null
          content_generated?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          execution_data?: Json | null
          execution_trigger?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          automation_rule_id?: string | null
          content_generated?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          execution_data?: Json | null
          execution_trigger?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_executions_automation_rule_id_fkey"
            columns: ["automation_rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_logs: {
        Row: {
          action: string | null
          automation_rule_id: string | null
          created_at: string | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          metadata: Json | null
          status: string | null
        }
        Insert: {
          action?: string | null
          automation_rule_id?: string | null
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          metadata?: Json | null
          status?: string | null
        }
        Update: {
          action?: string | null
          automation_rule_id?: string | null
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          metadata?: Json | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_automation_rule_id_fkey"
            columns: ["automation_rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          channel_id: string | null
          content_types: string[] | null
          created_at: string | null
          description: string | null
          execution_schedule: Json | null
          id: string
          is_active: boolean | null
          last_executed: string | null
          name: string
          priority: number | null
          rule_config: Json | null
          trigger_conditions: Json | null
          updated_at: string | null
        }
        Insert: {
          channel_id?: string | null
          content_types?: string[] | null
          created_at?: string | null
          description?: string | null
          execution_schedule?: Json | null
          id?: string
          is_active?: boolean | null
          last_executed?: string | null
          name: string
          priority?: number | null
          rule_config?: Json | null
          trigger_conditions?: Json | null
          updated_at?: string | null
        }
        Update: {
          channel_id?: string | null
          content_types?: string[] | null
          created_at?: string | null
          description?: string | null
          execution_schedule?: Json | null
          id?: string
          is_active?: boolean | null
          last_executed?: string | null
          name?: string
          priority?: number | null
          rule_config?: Json | null
          trigger_conditions?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_settings: {
        Row: {
          ai_creativity_level: number | null
          automation_hours: Json | null
          content_approval_required: boolean | null
          content_types_enabled: string[] | null
          created_at: string | null
          full_automation_enabled: boolean | null
          id: string
          max_daily_posts: number | null
          posting_interval_minutes: number | null
          smart_scheduling_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          ai_creativity_level?: number | null
          automation_hours?: Json | null
          content_approval_required?: boolean | null
          content_types_enabled?: string[] | null
          created_at?: string | null
          full_automation_enabled?: boolean | null
          id?: string
          max_daily_posts?: number | null
          posting_interval_minutes?: number | null
          smart_scheduling_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          ai_creativity_level?: number | null
          automation_hours?: Json | null
          content_approval_required?: boolean | null
          content_types_enabled?: string[] | null
          created_at?: string | null
          full_automation_enabled?: boolean | null
          id?: string
          max_daily_posts?: number | null
          posting_interval_minutes?: number | null
          smart_scheduling_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      automation_status: {
        Row: {
          created_at: string | null
          daily_posts_count: number | null
          id: string
          is_automation_running: boolean | null
          last_execution_at: string | null
          last_post_at: string | null
          next_execution_at: string | null
          status_message: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          daily_posts_count?: number | null
          id?: string
          is_automation_running?: boolean | null
          last_execution_at?: string | null
          last_post_at?: string | null
          next_execution_at?: string | null
          status_message?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          daily_posts_count?: number | null
          id?: string
          is_automation_running?: boolean | null
          last_execution_at?: string | null
          last_post_at?: string | null
          next_execution_at?: string | null
          status_message?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      bots: {
        Row: {
          auto_post_enabled: boolean | null
          created_at: string | null
          id: string
          is_active: boolean | null
          language_code: string | null
          last_post_at: string | null
          max_posts_per_day: number | null
          name: string
          preferred_post_times: string[] | null
          push_notifications: boolean | null
          region_id: string | null
          telegram_bot_username: string | null
          telegram_token_encrypted: string
          total_posts_sent: number | null
          updated_at: string | null
        }
        Insert: {
          auto_post_enabled?: boolean | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          language_code?: string | null
          last_post_at?: string | null
          max_posts_per_day?: number | null
          name: string
          preferred_post_times?: string[] | null
          push_notifications?: boolean | null
          region_id?: string | null
          telegram_bot_username?: string | null
          telegram_token_encrypted: string
          total_posts_sent?: number | null
          updated_at?: string | null
        }
        Update: {
          auto_post_enabled?: boolean | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          language_code?: string | null
          last_post_at?: string | null
          max_posts_per_day?: number | null
          name?: string
          preferred_post_times?: string[] | null
          push_notifications?: boolean | null
          region_id?: string | null
          telegram_bot_username?: string | null
          telegram_token_encrypted?: string
          total_posts_sent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bots_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "bots_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_automation_settings: {
        Row: {
          automation_hours: Json | null
          channel_id: string | null
          content_types: string[] | null
          created_at: string | null
          id: string
          is_enabled: boolean | null
          max_daily_posts: number | null
          updated_at: string | null
        }
        Insert: {
          automation_hours?: Json | null
          channel_id?: string | null
          content_types?: string[] | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          max_daily_posts?: number | null
          updated_at?: string | null
        }
        Update: {
          automation_hours?: Json | null
          channel_id?: string | null
          content_types?: string[] | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          max_daily_posts?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channel_automation_settings_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          auto_post_enabled: boolean | null
          automation_hours: number[] | null
          bot_id: string | null
          channel_id: string
          content_types: string[] | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          language: string | null
          last_content_sent: string | null
          last_post_at: string | null
          max_posts_per_day: number | null
          name: string
          post_approval_required: boolean | null
          preferred_post_times: string[] | null
          push_notifications: boolean | null
          smart_scheduling: boolean | null
          total_posts_sent: number | null
          updated_at: string | null
        }
        Insert: {
          auto_post_enabled?: boolean | null
          automation_hours?: number[] | null
          bot_id?: string | null
          channel_id: string
          content_types?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          last_content_sent?: string | null
          last_post_at?: string | null
          max_posts_per_day?: number | null
          name: string
          post_approval_required?: boolean | null
          preferred_post_times?: string[] | null
          push_notifications?: boolean | null
          smart_scheduling?: boolean | null
          total_posts_sent?: number | null
          updated_at?: string | null
        }
        Update: {
          auto_post_enabled?: boolean | null
          automation_hours?: number[] | null
          bot_id?: string | null
          channel_id?: string
          content_types?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          last_content_sent?: string | null
          last_post_at?: string | null
          max_posts_per_day?: number | null
          name?: string
          post_approval_required?: boolean | null
          preferred_post_times?: string[] | null
          push_notifications?: boolean | null
          smart_scheduling?: boolean | null
          total_posts_sent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channels_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_language_fkey"
            columns: ["language"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      content_items: {
        Row: {
          content: string
          content_type_id: string | null
          created_at: string | null
          id: string
          image_url: string | null
          is_published: boolean | null
          language: string | null
          metadata: Json | null
          updated_at: string | null
        }
        Insert: {
          content: string
          content_type_id?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          language?: string | null
          metadata?: Json | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          content_type_id?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          language?: string | null
          metadata?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_items_content_type_id_fkey"
            columns: ["content_type_id"]
            isOneToOne: false
            referencedRelation: "content_types"
            referencedColumns: ["id"]
          },
        ]
      }
      content_queue: {
        Row: {
          channel_id: string | null
          content: string
          content_type: string | null
          created_at: string | null
          id: string
          image_url: string | null
          is_processed: boolean | null
          metadata: Json | null
          priority: number | null
          scheduled_for: string | null
          updated_at: string | null
        }
        Insert: {
          channel_id?: string | null
          content: string
          content_type?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_processed?: boolean | null
          metadata?: Json | null
          priority?: number | null
          scheduled_for?: string | null
          updated_at?: string | null
        }
        Update: {
          channel_id?: string | null
          content?: string
          content_type?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_processed?: boolean | null
          metadata?: Json | null
          priority?: number | null
          scheduled_for?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_queue_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      content_schedules: {
        Row: {
          channel_id: string | null
          content_types: string[] | null
          created_at: string | null
          execution_times: Json | null
          id: string
          is_active: boolean | null
          name: string
          post_frequency: string | null
          recurrence_pattern: Json | null
          updated_at: string | null
        }
        Insert: {
          channel_id?: string | null
          content_types?: string[] | null
          created_at?: string | null
          execution_times?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          post_frequency?: string | null
          recurrence_pattern?: Json | null
          updated_at?: string | null
        }
        Update: {
          channel_id?: string | null
          content_types?: string[] | null
          created_at?: string | null
          execution_times?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          post_frequency?: string | null
          recurrence_pattern?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_schedules_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      content_types: {
        Row: {
          config: Json | null
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          action_url: string | null
          bonus_amount: string | null
          bot_id: string | null
          click_count: number | null
          code: string | null
          created_at: string | null
          description: string | null
          discount_percentage: number | null
          expiry_date: string | null
          id: string
          image_url: string | null
          impressions_count: number | null
          is_active: boolean | null
          language: string | null
          last_shown: string | null
          max_uses: number | null
          metadata: Json | null
          name: string
          priority: number | null
          show_count: number | null
          title: string | null
          type: string | null
          updated_at: string | null
          uses_count: number | null
        }
        Insert: {
          action_url?: string | null
          bonus_amount?: string | null
          bot_id?: string | null
          click_count?: number | null
          code?: string | null
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          impressions_count?: number | null
          is_active?: boolean | null
          language?: string | null
          last_shown?: string | null
          max_uses?: number | null
          metadata?: Json | null
          name: string
          priority?: number | null
          show_count?: number | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          uses_count?: number | null
        }
        Update: {
          action_url?: string | null
          bonus_amount?: string | null
          bot_id?: string | null
          click_count?: number | null
          code?: string | null
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          impressions_count?: number | null
          is_active?: boolean | null
          language?: string | null
          last_shown?: string | null
          max_uses?: number | null
          metadata?: Json | null
          name?: string
          priority?: number | null
          show_count?: number | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          uses_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_language_fkey"
            columns: ["language"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      daily_important_matches: {
        Row: {
          api_source: string | null
          away_team: string | null
          created_at: string | null
          home_team: string | null
          id: string
          importance_score: number | null
          league: string | null
          match_date: string | null
          match_id: string | null
          updated_at: string | null
        }
        Insert: {
          api_source?: string | null
          away_team?: string | null
          created_at?: string | null
          home_team?: string | null
          id?: string
          importance_score?: number | null
          league?: string | null
          match_date?: string | null
          match_id?: string | null
          updated_at?: string | null
        }
        Update: {
          api_source?: string | null
          away_team?: string | null
          created_at?: string | null
          home_team?: string | null
          id?: string
          importance_score?: number | null
          league?: string | null
          match_date?: string | null
          match_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      languages: {
        Row: {
          code: string
          created_at: string | null
          display_name: string
          id: string
          is_active: boolean | null
          native_name: string | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          native_name?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          native_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      leagues: {
        Row: {
          api_id: string | null
          api_source: string | null
          country: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          priority: number | null
          season: string | null
          updated_at: string | null
        }
        Insert: {
          api_id?: string | null
          api_source?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          priority?: number | null
          season?: string | null
          updated_at?: string | null
        }
        Update: {
          api_id?: string | null
          api_source?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          priority?: number | null
          season?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      logs: {
        Row: {
          bot_id: string | null
          channel_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          level: string | null
          message: string
          metadata: Json | null
          post_id: string | null
          source: string | null
        }
        Insert: {
          bot_id?: string | null
          channel_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          level?: string | null
          message: string
          metadata?: Json | null
          post_id?: string | null
          source?: string | null
        }
        Update: {
          bot_id?: string | null
          channel_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          level?: string | null
          message?: string
          metadata?: Json | null
          post_id?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logs_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logs_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      match_events: {
        Row: {
          created_at: string | null
          event_type: string | null
          id: string
          match_id: string | null
          metadata: Json | null
          minute: number | null
          player: string | null
          team: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          match_id?: string | null
          metadata?: Json | null
          minute?: number | null
          player?: string | null
          team?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          match_id?: string | null
          metadata?: Json | null
          minute?: number | null
          player?: string | null
          team?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          api_id: string | null
          api_source: string | null
          away_score: number | null
          away_team_id: string | null
          created_at: string | null
          home_score: number | null
          home_team_id: string | null
          id: string
          league_id: string | null
          match_date: string | null
          metadata: Json | null
          round: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          api_id?: string | null
          api_source?: string | null
          away_score?: number | null
          away_team_id?: string | null
          created_at?: string | null
          home_score?: number | null
          home_team_id?: string | null
          id?: string
          league_id?: string | null
          match_date?: string | null
          metadata?: Json | null
          round?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          api_id?: string | null
          api_source?: string | null
          away_score?: number | null
          away_team_id?: string | null
          created_at?: string | null
          home_score?: number | null
          home_team_id?: string | null
          id?: string
          league_id?: string | null
          match_date?: string | null
          metadata?: Json | null
          round?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_approvals: {
        Row: {
          approved_at: string | null
          automation_rule_id: string | null
          content: string
          content_metadata: Json | null
          content_type: string | null
          created_at: string | null
          id: string
          rejection_reason: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          automation_rule_id?: string | null
          content: string
          content_metadata?: Json | null
          content_type?: string | null
          created_at?: string | null
          id?: string
          rejection_reason?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          automation_rule_id?: string | null
          content?: string
          content_metadata?: Json | null
          content_type?: string | null
          created_at?: string | null
          id?: string
          rejection_reason?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_approvals_automation_rule_id_fkey"
            columns: ["automation_rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          bot_id: string | null
          channel_id: string | null
          content: string
          content_type: string | null
          created_at: string | null
          delivered_at: string | null
          engagement_stats: Json | null
          error_message: string | null
          id: string
          image_url: string | null
          language: string | null
          message_id: string | null
          post_analytics: Json | null
          status: string | null
          telegram_response: Json | null
          updated_at: string | null
        }
        Insert: {
          bot_id?: string | null
          channel_id?: string | null
          content: string
          content_type?: string | null
          created_at?: string | null
          delivered_at?: string | null
          engagement_stats?: Json | null
          error_message?: string | null
          id?: string
          image_url?: string | null
          language?: string | null
          message_id?: string | null
          post_analytics?: Json | null
          status?: string | null
          telegram_response?: Json | null
          updated_at?: string | null
        }
        Update: {
          bot_id?: string | null
          channel_id?: string | null
          content?: string
          content_type?: string | null
          created_at?: string | null
          delivered_at?: string | null
          engagement_stats?: Json | null
          error_message?: string | null
          id?: string
          image_url?: string | null
          language?: string | null
          message_id?: string | null
          post_analytics?: Json | null
          status?: string | null
          telegram_response?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          primary_language: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          primary_language?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          primary_language?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regions_primary_language_fkey"
            columns: ["primary_language"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      settings: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_secret: boolean | null
          key: string
          updated_at: string | null
          value: string | null
          value_type: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_secret?: boolean | null
          key: string
          updated_at?: string | null
          value?: string | null
          value_type?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_secret?: boolean | null
          key?: string
          updated_at?: string | null
          value?: string | null
          value_type?: string | null
        }
        Relationships: []
      }
      smart_push_analytics: {
        Row: {
          channel_id: string | null
          click_count: number | null
          coupon_id: string | null
          ctr: number | null
          delivery_id: string | null
          id: string
          impression_count: number | null
          metadata: Json | null
          recorded_at: string | null
        }
        Insert: {
          channel_id?: string | null
          click_count?: number | null
          coupon_id?: string | null
          ctr?: number | null
          delivery_id?: string | null
          id?: string
          impression_count?: number | null
          metadata?: Json | null
          recorded_at?: string | null
        }
        Update: {
          channel_id?: string | null
          click_count?: number | null
          coupon_id?: string | null
          ctr?: number | null
          delivery_id?: string | null
          id?: string
          impression_count?: number | null
          metadata?: Json | null
          recorded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "smart_push_analytics_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_push_analytics_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_push_analytics_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "smart_push_deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_push_deliveries: {
        Row: {
          channel_id: string | null
          coupon_id: string | null
          created_at: string | null
          delivered_at: string | null
          id: string
          metadata: Json | null
          queue_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          channel_id?: string | null
          coupon_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          metadata?: Json | null
          queue_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          channel_id?: string | null
          coupon_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          metadata?: Json | null
          queue_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "smart_push_deliveries_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_push_deliveries_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_push_deliveries_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "smart_push_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_push_queue: {
        Row: {
          channel_id: string | null
          content: string | null
          created_at: string | null
          id: string
          is_processed: boolean | null
          metadata: Json | null
          priority: number | null
          scheduled_for: string | null
          updated_at: string | null
        }
        Insert: {
          channel_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_processed?: boolean | null
          metadata?: Json | null
          priority?: number | null
          scheduled_for?: string | null
          updated_at?: string | null
        }
        Update: {
          channel_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_processed?: boolean | null
          metadata?: Json | null
          priority?: number | null
          scheduled_for?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "smart_push_queue_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_push_settings: {
        Row: {
          created_at: string | null
          enable_smart_push: boolean | null
          id: string
          max_daily_pushes: number | null
          probability_settings: Json | null
          push_intervals: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enable_smart_push?: boolean | null
          id?: string
          max_daily_pushes?: number | null
          probability_settings?: Json | null
          push_intervals?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enable_smart_push?: boolean | null
          id?: string
          max_daily_pushes?: number | null
          probability_settings?: Json | null
          push_intervals?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      team_mappings: {
        Row: {
          api_football_id: string | null
          api_source: string | null
          created_at: string | null
          football_data_id: string | null
          id: string
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          api_football_id?: string | null
          api_source?: string | null
          created_at?: string | null
          football_data_id?: string | null
          id?: string
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          api_football_id?: string | null
          api_source?: string | null
          created_at?: string | null
          football_data_id?: string | null
          id?: string
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_mappings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          api_id: string | null
          api_source: string | null
          country: string | null
          created_at: string | null
          founded: number | null
          id: string
          league_id: string | null
          logo_url: string | null
          name: string
          region_id: string | null
          stadium: string | null
          updated_at: string | null
        }
        Insert: {
          api_id?: string | null
          api_source?: string | null
          country?: string | null
          created_at?: string | null
          founded?: number | null
          id?: string
          league_id?: string | null
          logo_url?: string | null
          name: string
          region_id?: string | null
          stadium?: string | null
          updated_at?: string | null
        }
        Update: {
          api_id?: string | null
          api_source?: string | null
          country?: string | null
          created_at?: string | null
          founded?: number | null
          id?: string
          league_id?: string | null
          logo_url?: string | null
          name?: string
          region_id?: string | null
          stadium?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      translations: {
        Row: {
          am: string | null
          context: string | null
          created_at: string | null
          en: string
          id: string
          key: string
          sw: string | null
          updated_at: string | null
        }
        Insert: {
          am?: string | null
          context?: string | null
          created_at?: string | null
          en: string
          id?: string
          key: string
          sw?: string | null
          updated_at?: string | null
        }
        Update: {
          am?: string | null
          context?: string | null
          created_at?: string | null
          en?: string
          id?: string
          key?: string
          sw?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_admin_user: {
        Args: { admin_email: string; admin_name?: string }
        Returns: string
      }
      get_bot_token: {
        Args: { bot_id_param: string }
        Returns: {
          telegram_token_encrypted: string
        }[]
      }
      get_current_manager: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const 

// Content System Types
export type ContentType = 
  | 'news'
  | 'polls'
  | 'images'
  | 'coupons'
  | 'live_scores'
  | 'betting_tips'
  | 'daily_summary'
  | 'match_analysis'
  | 'live_update'
  | 'summary'
  | 'betting_tip'
  | 'poll'
  | 'coupon'
  | 'meme'
  | 'image'
  | 'lineup'
  | 'trend'
  | 'weekly_summary';

export type PostStatus = 
  | 'pending'
  | 'scheduled'
  | 'sent'
  | 'failed'
  | 'draft';

export type QueueStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

export interface Post {
  id: string;
  bot_id?: string;
  channel_id?: string;
  content: string;
  content_text?: string;
  content_translations?: Record<string, string>;
  content_type?: ContentType;
  image_url?: string;
  language?: 'en' | 'am' | 'sw';
  type?: string; // Legacy field
  status: PostStatus;
  scheduled_for?: string;
  sent_at?: string;
  telegram_message_id?: number;
  source_data?: Record<string, any>;
  priority?: number;
  retry_count?: number;
  error_message?: string;
  engagement_stats?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface ContentQueue {
  id: string;
  channel_id?: string;
  content_type: ContentType;
  source_data: Record<string, any>;
  priority: number;
  status: QueueStatus;
  processing_started_at?: string;
  completed_at?: string;
  error_message?: string;
  retry_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface RSSSource {
  id: string;
  name: string;
  url: string;
  language: 'en' | 'am' | 'sw';
  category: string;
  is_active: boolean;
  last_fetched_at?: string;
  last_item_count?: number;
  fetch_frequency_minutes?: number; // Legacy field
  fetch_frequency_seconds?: number;
  error_count?: number;
  last_error?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

// Content Generation Types
export interface ContentGenerationParams {
  contentType: ContentType;
  sourceData: any;
  channelId: string;
  language: 'en' | 'am' | 'sw';
  tone?: string;
  length?: 'short' | 'medium' | 'long';
}

export interface GeneratedContent {
  text: string;
  imageUrl?: string;
  metadata?: Record<string, any>;
}

export interface RSSItem {
  title: string;
  description: string;
  link: string;
  pubDate: Date;
  language: 'en' | 'am' | 'sw';
  category: string;
  source: string;
}

// Enhanced Channel type with content system fields
export interface Channel {
  id: string;
  bot_id?: string;
  name: string;
  telegram_channel_id?: string;
  telegram_channel_username?: string;
  description?: string;
  is_active: boolean;
  auto_post: boolean;
  post_frequency_hours: number;
  preferred_post_times: string[];
  member_count?: number;
  last_post_at?: string;
  total_posts_sent: number;
  language: 'en' | 'am' | 'sw';
  affiliate_code?: string;
  content_types: {
    news?: boolean;
    polls?: boolean;
    images?: boolean;
    coupons?: boolean;
    live_scores?: boolean;
    betting_tips?: boolean;
    daily_summary?: boolean;
    weekly_summary?: boolean;
    match_analysis?: boolean;
    live_update?: boolean;
    summary?: boolean;
    betting_tip?: boolean;
    poll?: boolean;
    coupon?: boolean;
    meme?: boolean;
    image?: boolean;
    lineup?: boolean;
    trend?: boolean;
  };
  max_posts_per_day: number;
  created_at?: string;
  updated_at?: string;
} 