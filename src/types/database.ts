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
      api_keys: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          key_value: string
          last_used: string | null
          service_name: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key_value: string
          last_used?: string | null
          service_name: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key_value?: string
          last_used?: string | null
          service_name?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      automation_executions: {
        Row: {
          channels_processed: number | null
          content_generated: number | null
          content_type: string
          created_at: string | null
          error_message: string | null
          executed_at: string | null
          execution_details: Json | null
          execution_status: string
          execution_time: unknown | null
          id: string
          language: string
          rule_id: string | null
        }
        Insert: {
          channels_processed?: number | null
          content_generated?: number | null
          content_type: string
          created_at?: string | null
          error_message?: string | null
          executed_at?: string | null
          execution_details?: Json | null
          execution_status: string
          execution_time?: unknown | null
          id?: string
          language?: string
          rule_id?: string | null
        }
        Update: {
          channels_processed?: number | null
          content_generated?: number | null
          content_type?: string
          created_at?: string | null
          error_message?: string | null
          executed_at?: string | null
          execution_details?: Json | null
          execution_status?: string
          execution_time?: unknown | null
          id?: string
          language?: string
          rule_id?: string | null
        }
        Relationships: []
      }
      automation_logs: {
        Row: {
          automation_rule_id: string | null
          channels_updated: number | null
          content_generated: number | null
          created_at: string | null
          details: Json | null
          errors: Json | null
          id: string
          run_time: string
          status: string | null
        }
        Insert: {
          automation_rule_id?: string | null
          channels_updated?: number | null
          content_generated?: number | null
          created_at?: string | null
          details?: Json | null
          errors?: Json | null
          id?: string
          run_time?: string
          status?: string | null
        }
        Update: {
          automation_rule_id?: string | null
          channels_updated?: number | null
          content_generated?: number | null
          created_at?: string | null
          details?: Json | null
          errors?: Json | null
          id?: string
          run_time?: string
          status?: string | null
        }
        Relationships: []
      }
      automation_rules: {
        Row: {
          automation_type: string | null
          channels: Json | null
          conditions: Json | null
          config: Json | null
          content_type: string | null
          content_types: Json | null
          created_at: string | null
          enabled: boolean | null
          error_count: number | null
          id: string
          languages: Json | null
          last_run: string | null
          name: string
          organization_id: string
          schedule: Json | null
          success_count: number | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          automation_type?: string | null
          channels?: Json | null
          conditions?: Json | null
          config?: Json | null
          content_type?: string | null
          content_types?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          error_count?: number | null
          id?: string
          languages?: Json | null
          last_run?: string | null
          name: string
          organization_id?: string
          schedule?: Json | null
          success_count?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          automation_type?: string | null
          channels?: Json | null
          conditions?: Json | null
          config?: Json | null
          content_type?: string | null
          content_types?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          error_count?: number | null
          id?: string
          languages?: Json | null
          last_run?: string | null
          name?: string
          organization_id?: string
          schedule?: Json | null
          success_count?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      automation_settings: {
        Row: {
          active_content_types: Json | null
          content_generation_interval: number | null
          created_at: string | null
          full_automation_enabled: boolean
          id: string
          max_daily_content: number | null
          notify_on_errors: boolean | null
          organization_id: string
          retry_failed_content: boolean | null
          updated_at: string | null
        }
        Insert: {
          active_content_types?: Json | null
          content_generation_interval?: number | null
          created_at?: string | null
          full_automation_enabled?: boolean
          id?: string
          max_daily_content?: number | null
          notify_on_errors?: boolean | null
          organization_id?: string
          retry_failed_content?: boolean | null
          updated_at?: string | null
        }
        Update: {
          active_content_types?: Json | null
          content_generation_interval?: number | null
          created_at?: string | null
          full_automation_enabled?: boolean
          id?: string
          max_daily_content?: number | null
          notify_on_errors?: boolean | null
          organization_id?: string
          retry_failed_content?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      automation_status: {
        Row: {
          failed_executions: number | null
          id: string
          is_running: boolean | null
          last_execution: string | null
          next_execution: string | null
          successful_executions: number | null
          system_health: Json | null
          total_executions: number | null
          updated_at: string | null
        }
        Insert: {
          failed_executions?: number | null
          id?: string
          is_running?: boolean | null
          last_execution?: string | null
          next_execution?: string | null
          successful_executions?: number | null
          system_health?: Json | null
          total_executions?: number | null
          updated_at?: string | null
        }
        Update: {
          failed_executions?: number | null
          id?: string
          is_running?: boolean | null
          last_execution?: string | null
          next_execution?: string | null
          successful_executions?: number | null
          system_health?: Json | null
          total_executions?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      bots: {
        Row: {
          approval_date: string | null
          approval_status: string | null
          auto_post_enabled: boolean | null
          created_at: string | null
          id: string
          is_active: boolean | null
          language_code: string | null
          last_post_at: string | null
          max_posts_per_day: number | null
          name: string
          notes: string | null
          preferred_post_times: string[] | null
          push_notifications: boolean | null
          region_id: string | null
          telegram_bot_username: string | null
          telegram_token_encrypted: string
          total_posts_sent: number | null
          updated_at: string | null
        }
        Insert: {
          approval_date?: string | null
          approval_status?: string | null
          auto_post_enabled?: boolean | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          language_code?: string | null
          last_post_at?: string | null
          max_posts_per_day?: number | null
          name: string
          notes?: string | null
          preferred_post_times?: string[] | null
          push_notifications?: boolean | null
          region_id?: string | null
          telegram_bot_username?: string | null
          telegram_token_encrypted: string
          total_posts_sent?: number | null
          updated_at?: string | null
        }
        Update: {
          approval_date?: string | null
          approval_status?: string | null
          auto_post_enabled?: boolean | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          language_code?: string | null
          last_post_at?: string | null
          max_posts_per_day?: number | null
          name?: string
          notes?: string | null
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
          auto_approve_high_quality: boolean | null
          channel_id: string
          conditions: Json | null
          created_at: string | null
          cron_schedule: string
          disabled_content_types: Json | null
          enabled_content_types: Json | null
          id: string
          is_active: boolean | null
          last_execution: string | null
          max_posts_per_day: number | null
          max_posts_per_hour: number | null
          min_content_quality: number | null
          min_interval_minutes: number | null
          next_scheduled_execution: string | null
          priority_level: number | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          auto_approve_high_quality?: boolean | null
          channel_id: string
          conditions?: Json | null
          created_at?: string | null
          cron_schedule?: string
          disabled_content_types?: Json | null
          enabled_content_types?: Json | null
          id?: string
          is_active?: boolean | null
          last_execution?: string | null
          max_posts_per_day?: number | null
          max_posts_per_hour?: number | null
          min_content_quality?: number | null
          min_interval_minutes?: number | null
          next_scheduled_execution?: string | null
          priority_level?: number | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_approve_high_quality?: boolean | null
          channel_id?: string
          conditions?: Json | null
          created_at?: string | null
          cron_schedule?: string
          disabled_content_types?: Json | null
          enabled_content_types?: Json | null
          id?: string
          is_active?: boolean | null
          last_execution?: string | null
          max_posts_per_day?: number | null
          max_posts_per_hour?: number | null
          min_content_quality?: number | null
          min_interval_minutes?: number | null
          next_scheduled_execution?: string | null
          priority_level?: number | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channel_automation_settings_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: true
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          affiliate_code: string | null
          auto_post: boolean | null
          auto_post_enabled: boolean | null
          automation_hours: Json | null
          bot_id: string | null
          content_types: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          language: string | null
          last_post_at: string | null
          max_posts_per_day: number | null
          member_count: number | null
          name: string
          post_approval_required: boolean | null
          post_frequency_hours: number | null
          preferred_post_times: string[] | null
          push_notifications: boolean | null
          selected_leagues: Json | null
          selected_teams: Json | null
          smart_scheduling: boolean | null
          telegram_channel_id: string | null
          telegram_channel_username: string | null
          timezone: string | null
          total_posts_sent: number | null
          updated_at: string | null
        }
        Insert: {
          affiliate_code?: string | null
          auto_post?: boolean | null
          auto_post_enabled?: boolean | null
          automation_hours?: Json | null
          bot_id?: string | null
          content_types?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          last_post_at?: string | null
          max_posts_per_day?: number | null
          member_count?: number | null
          name: string
          post_approval_required?: boolean | null
          post_frequency_hours?: number | null
          preferred_post_times?: string[] | null
          push_notifications?: boolean | null
          selected_leagues?: Json | null
          selected_teams?: Json | null
          smart_scheduling?: boolean | null
          telegram_channel_id?: string | null
          telegram_channel_username?: string | null
          timezone?: string | null
          total_posts_sent?: number | null
          updated_at?: string | null
        }
        Update: {
          affiliate_code?: string | null
          auto_post?: boolean | null
          auto_post_enabled?: boolean | null
          automation_hours?: Json | null
          bot_id?: string | null
          content_types?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          last_post_at?: string | null
          max_posts_per_day?: number | null
          member_count?: number | null
          name?: string
          post_approval_required?: boolean | null
          post_frequency_hours?: number | null
          preferred_post_times?: string[] | null
          push_notifications?: boolean | null
          selected_leagues?: Json | null
          selected_teams?: Json | null
          smart_scheduling?: boolean | null
          telegram_channel_id?: string | null
          telegram_channel_username?: string | null
          timezone?: string | null
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
          language: string
          metadata: Json | null
          priority: number | null
          scheduled_for: string | null
          source_data: Json | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          content_type_id?: string | null
          created_at?: string | null
          id?: string
          language: string
          metadata?: Json | null
          priority?: number | null
          scheduled_for?: string | null
          source_data?: Json | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          content_type_id?: string | null
          created_at?: string | null
          id?: string
          language?: string
          metadata?: Json | null
          priority?: number | null
          scheduled_for?: string | null
          source_data?: Json | null
          status?: string | null
          title?: string | null
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
          completed_at: string | null
          content_hash: string | null
          content_type: string
          created_at: string | null
          error_message: string | null
          id: string
          priority: number | null
          processing_started_at: string | null
          retry_count: number | null
          source_data: Json
          status: string | null
          updated_at: string | null
        }
        Insert: {
          channel_id?: string | null
          completed_at?: string | null
          content_hash?: string | null
          content_type: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          priority?: number | null
          processing_started_at?: string | null
          retry_count?: number | null
          source_data?: Json
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          channel_id?: string | null
          completed_at?: string | null
          content_hash?: string | null
          content_type?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          priority?: number | null
          processing_started_at?: string | null
          retry_count?: number | null
          source_data?: Json
          status?: string | null
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
          avoid_duplicate_with_channels: string[] | null
          channel_id: string
          content_priority: number | null
          content_type: string
          created_at: string | null
          day_of_week: number | null
          delay_minutes_range: Json | null
          hour: number
          id: string
          is_active: boolean | null
          last_executed: string | null
          minute: number | null
          next_execution: string | null
          schedule_name: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          avoid_duplicate_with_channels?: string[] | null
          channel_id: string
          content_priority?: number | null
          content_type: string
          created_at?: string | null
          day_of_week?: number | null
          delay_minutes_range?: Json | null
          hour: number
          id?: string
          is_active?: boolean | null
          last_executed?: string | null
          minute?: number | null
          next_execution?: string | null
          schedule_name?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          avoid_duplicate_with_channels?: string[] | null
          channel_id?: string
          content_priority?: number | null
          content_type?: string
          created_at?: string | null
          day_of_week?: number | null
          delay_minutes_range?: Json | null
          hour?: number
          id?: string
          is_active?: boolean | null
          last_executed?: string | null
          minute?: number | null
          next_execution?: string | null
          schedule_name?: string | null
          timezone?: string | null
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
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          priority: number | null
          template: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          priority?: number | null
          template?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: number | null
          template?: Json | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          affiliate_code: string
          affiliate_link: string | null
          affiliate_url: string
          betting_site: string | null
          bonus_amount: string | null
          bot_id: string | null
          brand_colors: Json | null
          brand_logo: string | null
          brand_name: string | null
          clicks: number | null
          conversions: number | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          current_usage: number | null
          description: string | null
          expiry_date: string | null
          id: string
          impressions: number | null
          is_active: boolean | null
          language: string | null
          languages: string[] | null
          max_usage: number | null
          offer_text: string | null
          priority: string | null
          target_audience: string[] | null
          terms_url: string | null
          title: string
          trigger_conditions: Json | null
          trigger_contexts: string[] | null
          type: string | null
          updated_at: string | null
          usage_count: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          affiliate_code: string
          affiliate_link?: string | null
          affiliate_url: string
          betting_site?: string | null
          bonus_amount?: string | null
          bot_id?: string | null
          brand_colors?: Json | null
          brand_logo?: string | null
          brand_name?: string | null
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          current_usage?: number | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          impressions?: number | null
          is_active?: boolean | null
          language?: string | null
          languages?: string[] | null
          max_usage?: number | null
          offer_text?: string | null
          priority?: string | null
          target_audience?: string[] | null
          terms_url?: string | null
          title: string
          trigger_conditions?: Json | null
          trigger_contexts?: string[] | null
          type?: string | null
          updated_at?: string | null
          usage_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          affiliate_code?: string
          affiliate_link?: string | null
          affiliate_url?: string
          betting_site?: string | null
          bonus_amount?: string | null
          bot_id?: string | null
          brand_colors?: Json | null
          brand_logo?: string | null
          brand_name?: string | null
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          current_usage?: number | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          impressions?: number | null
          is_active?: boolean | null
          language?: string | null
          languages?: string[] | null
          max_usage?: number | null
          offer_text?: string | null
          priority?: string | null
          target_audience?: string[] | null
          terms_url?: string | null
          title?: string
          trigger_conditions?: Json | null
          trigger_contexts?: string[] | null
          type?: string | null
          updated_at?: string | null
          usage_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
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
          away_team: string
          away_team_id: string | null
          competition: string
          content_generated: Json | null
          content_opportunities: Json | null
          content_scheduled: Json | null
          created_at: string | null
          discovery_date: string
          external_match_id: string
          home_team: string
          home_team_id: string | null
          id: string
          importance_score: number
          kickoff_time: string
          match_status: string | null
          raw_match_data: Json | null
          score_breakdown: Json | null
          updated_at: string | null
          venue: string | null
        }
        Insert: {
          api_source?: string | null
          away_team: string
          away_team_id?: string | null
          competition: string
          content_generated?: Json | null
          content_opportunities?: Json | null
          content_scheduled?: Json | null
          created_at?: string | null
          discovery_date: string
          external_match_id: string
          home_team: string
          home_team_id?: string | null
          id?: string
          importance_score: number
          kickoff_time: string
          match_status?: string | null
          raw_match_data?: Json | null
          score_breakdown?: Json | null
          updated_at?: string | null
          venue?: string | null
        }
        Update: {
          api_source?: string | null
          away_team?: string
          away_team_id?: string | null
          competition?: string
          content_generated?: Json | null
          content_opportunities?: Json | null
          content_scheduled?: Json | null
          created_at?: string | null
          discovery_date?: string
          external_match_id?: string
          home_team?: string
          home_team_id?: string | null
          id?: string
          importance_score?: number
          kickoff_time?: string
          match_status?: string | null
          raw_match_data?: Json | null
          score_breakdown?: Json | null
          updated_at?: string | null
          venue?: string | null
        }
        Relationships: []
      }
      languages: {
        Row: {
          code: string
          created_at: string | null
          direction: string | null
          is_active: boolean | null
          name: string
          native_name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          direction?: string | null
          is_active?: boolean | null
          name: string
          native_name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          direction?: string | null
          is_active?: boolean | null
          name?: string
          native_name?: string
        }
        Relationships: []
      }
      leagues: {
        Row: {
          api_source: string | null
          country: string | null
          created_at: string | null
          external_id: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          name_translations: Json | null
          priority: number | null
          season: string | null
          updated_at: string | null
        }
        Insert: {
          api_source?: string | null
          country?: string | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          name_translations?: Json | null
          priority?: number | null
          season?: string | null
          updated_at?: string | null
        }
        Update: {
          api_source?: string | null
          country?: string | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          name_translations?: Json | null
          priority?: number | null
          season?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      logs: {
        Row: {
          action: string
          bot_id: string | null
          channel_id: string | null
          component: string | null
          created_at: string | null
          duration_ms: number | null
          error_details: string | null
          id: string
          level: string | null
          message: string | null
          metadata: Json | null
          post_id: string | null
          status: string | null
        }
        Insert: {
          action: string
          bot_id?: string | null
          channel_id?: string | null
          component?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_details?: string | null
          id?: string
          level?: string | null
          message?: string | null
          metadata?: Json | null
          post_id?: string | null
          status?: string | null
        }
        Update: {
          action?: string
          bot_id?: string | null
          channel_id?: string | null
          component?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_details?: string | null
          id?: string
          level?: string | null
          message?: string | null
          metadata?: Json | null
          post_id?: string | null
          status?: string | null
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
          description: string | null
          event_type: string
          id: string
          match_id: string | null
          metadata: Json | null
          minute: number | null
          player_name: string | null
          team: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_type: string
          id?: string
          match_id?: string | null
          metadata?: Json | null
          minute?: number | null
          player_name?: string | null
          team?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_type?: string
          id?: string
          match_id?: string | null
          metadata?: Json | null
          minute?: number | null
          player_name?: string | null
          team?: string | null
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
          away_score: number | null
          away_team_id: string | null
          created_at: string | null
          external_id: string
          home_score: number | null
          home_team_id: string | null
          id: string
          kickoff_time: string
          league_id: string | null
          metadata: Json | null
          minute: number | null
          referee: string | null
          status: string | null
          updated_at: string | null
          venue: string | null
        }
        Insert: {
          away_score?: number | null
          away_team_id?: string | null
          created_at?: string | null
          external_id: string
          home_score?: number | null
          home_team_id?: string | null
          id?: string
          kickoff_time: string
          league_id?: string | null
          metadata?: Json | null
          minute?: number | null
          referee?: string | null
          status?: string | null
          updated_at?: string | null
          venue?: string | null
        }
        Update: {
          away_score?: number | null
          away_team_id?: string | null
          created_at?: string | null
          external_id?: string
          home_score?: number | null
          home_team_id?: string | null
          id?: string
          kickoff_time?: string
          league_id?: string | null
          metadata?: Json | null
          minute?: number | null
          referee?: string | null
          status?: string | null
          updated_at?: string | null
          venue?: string | null
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
          ai_confidence: number | null
          approved_at: string | null
          automation_rule_id: string | null
          channels: string[] | null
          content: string
          content_type: string
          created_at: string | null
          delivery_error: string | null
          delivery_status: string | null
          edited_content: Json | null
          estimated_engagement: string | null
          expires_at: string | null
          generated_at: string | null
          id: string
          language: string
          metadata: Json | null
          organization_id: string | null
          quality_score: number | null
          rejection_reason: string | null
          reviewed_at: string | null
          rule_name: string | null
          sent_at: string | null
          source_data: Json | null
          status: string | null
          telegram_message_id: number | null
          updated_at: string | null
        }
        Insert: {
          ai_confidence?: number | null
          approved_at?: string | null
          automation_rule_id?: string | null
          channels?: string[] | null
          content: string
          content_type: string
          created_at?: string | null
          delivery_error?: string | null
          delivery_status?: string | null
          edited_content?: Json | null
          estimated_engagement?: string | null
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          language: string
          metadata?: Json | null
          organization_id?: string | null
          quality_score?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          rule_name?: string | null
          sent_at?: string | null
          source_data?: Json | null
          status?: string | null
          telegram_message_id?: number | null
          updated_at?: string | null
        }
        Update: {
          ai_confidence?: number | null
          approved_at?: string | null
          automation_rule_id?: string | null
          channels?: string[] | null
          content?: string
          content_type?: string
          created_at?: string | null
          delivery_error?: string | null
          delivery_status?: string | null
          edited_content?: Json | null
          estimated_engagement?: string | null
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          language?: string
          metadata?: Json | null
          organization_id?: string | null
          quality_score?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          rule_name?: string | null
          sent_at?: string | null
          source_data?: Json | null
          status?: string | null
          telegram_message_id?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          bot_id: string | null
          channel_id: string | null
          content: string
          content_text: string | null
          content_translations: Json | null
          content_type: string | null
          created_at: string | null
          engagement_stats: Json | null
          error_message: string | null
          id: string
          image_url: string | null
          language: string | null
          priority: number | null
          retry_count: number | null
          scheduled_for: string | null
          sent_at: string | null
          source_data: Json | null
          status: string | null
          telegram_message_id: number | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          bot_id?: string | null
          channel_id?: string | null
          content: string
          content_text?: string | null
          content_translations?: Json | null
          content_type?: string | null
          created_at?: string | null
          engagement_stats?: Json | null
          error_message?: string | null
          id?: string
          image_url?: string | null
          language?: string | null
          priority?: number | null
          retry_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          source_data?: Json | null
          status?: string | null
          telegram_message_id?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          bot_id?: string | null
          channel_id?: string | null
          content?: string
          content_text?: string | null
          content_translations?: Json | null
          content_type?: string | null
          created_at?: string | null
          engagement_stats?: Json | null
          error_message?: string | null
          id?: string
          image_url?: string | null
          language?: string | null
          priority?: number | null
          retry_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          source_data?: Json | null
          status?: string | null
          telegram_message_id?: number | null
          type?: string | null
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
          country_code: string
          created_at: string | null
          flag_emoji: string
          id: string
          is_active: boolean | null
          name: string
          primary_language: string | null
          timezone: string | null
        }
        Insert: {
          country_code: string
          created_at?: string | null
          flag_emoji: string
          id?: string
          is_active?: boolean | null
          name: string
          primary_language?: string | null
          timezone?: string | null
        }
        Update: {
          country_code?: string
          created_at?: string | null
          flag_emoji?: string
          id?: string
          is_active?: boolean | null
          name?: string
          primary_language?: string | null
          timezone?: string | null
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
          coupon_id: string | null
          created_at: string | null
          delivery_id: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          language: string
          user_agent: string | null
        }
        Insert: {
          channel_id?: string | null
          coupon_id?: string | null
          created_at?: string | null
          delivery_id?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          language: string
          user_agent?: string | null
        }
        Update: {
          channel_id?: string | null
          coupon_id?: string | null
          created_at?: string | null
          delivery_id?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          language?: string
          user_agent?: string | null
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
          content_sent: string
          coupon_id: string | null
          created_at: string | null
          delivery_status: string | null
          engagement_data: Json | null
          error_details: string | null
          id: string
          language: string
          queue_id: string | null
          sent_at: string | null
          telegram_message_id: number | null
        }
        Insert: {
          channel_id?: string | null
          content_sent: string
          coupon_id?: string | null
          created_at?: string | null
          delivery_status?: string | null
          engagement_data?: Json | null
          error_details?: string | null
          id?: string
          language: string
          queue_id?: string | null
          sent_at?: string | null
          telegram_message_id?: number | null
        }
        Update: {
          channel_id?: string | null
          content_sent?: string
          coupon_id?: string | null
          created_at?: string | null
          delivery_status?: string | null
          engagement_data?: Json | null
          error_details?: string | null
          id?: string
          language?: string
          queue_id?: string | null
          sent_at?: string | null
          telegram_message_id?: number | null
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
          content_type: string
          context_data: Json | null
          created_at: string | null
          error_message: string | null
          id: string
          priority: number | null
          processed_at: string | null
          retry_count: number | null
          scheduled_for: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          channel_id?: string | null
          content_type: string
          context_data?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          priority?: number | null
          processed_at?: string | null
          retry_count?: number | null
          scheduled_for: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          channel_id?: string | null
          content_type?: string
          context_data?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          priority?: number | null
          processed_at?: string | null
          retry_count?: number | null
          scheduled_for?: string
          status?: string | null
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
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      team_mappings: {
        Row: {
          aliases: string[] | null
          api_mappings: Json
          confidence: number
          country: string | null
          created_at: string | null
          discovered_at: string | null
          id: string
          is_verified: boolean | null
          last_used: string | null
          league: string | null
          normalized_name: string
          notes: string | null
          sport: string | null
          tier: string | null
          universal_name: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          aliases?: string[] | null
          api_mappings?: Json
          confidence?: number
          country?: string | null
          created_at?: string | null
          discovered_at?: string | null
          id?: string
          is_verified?: boolean | null
          last_used?: string | null
          league?: string | null
          normalized_name: string
          notes?: string | null
          sport?: string | null
          tier?: string | null
          universal_name: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          aliases?: string[] | null
          api_mappings?: Json
          confidence?: number
          country?: string | null
          created_at?: string | null
          discovered_at?: string | null
          id?: string
          is_verified?: boolean | null
          last_used?: string | null
          league?: string | null
          normalized_name?: string
          notes?: string | null
          sport?: string | null
          tier?: string | null
          universal_name?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      teams: {
        Row: {
          country: string | null
          created_at: string | null
          external_id: string | null
          id: string
          is_local: boolean | null
          league: string | null
          league_id: string | null
          logo_url: string | null
          name: string
          name_translations: Json | null
          region_id: string | null
          updated_at: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          is_local?: boolean | null
          league?: string | null
          league_id?: string | null
          logo_url?: string | null
          name: string
          name_translations?: Json | null
          region_id?: string | null
          updated_at?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          is_local?: boolean | null
          league?: string | null
          league_id?: string | null
          logo_url?: string | null
          name?: string
          name_translations?: Json | null
          region_id?: string | null
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
      get_todays_important_matches: {
        Args: Record<PropertyKey, never>
        Returns: {
          match_id: string
          home_team: string
          away_team: string
          competition: string
          kickoff_time: string
          importance_score: number
          content_opportunities: Json
        }[]
      }
      get_upcoming_scheduled_content: {
        Args: { hours_ahead?: number }
        Returns: {
          schedule_id: string
          match_info: string
          content_type: string
          scheduled_for: string
          status: string
          priority: number
        }[]
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      search_team_mappings: {
        Args: { search_term: string }
        Returns: {
          aliases: string[] | null
          api_mappings: Json
          confidence: number
          country: string | null
          created_at: string | null
          discovered_at: string | null
          id: string
          is_verified: boolean | null
          last_used: string | null
          league: string | null
          normalized_name: string
          notes: string | null
          sport: string | null
          tier: string | null
          universal_name: string
          updated_at: string | null
          usage_count: number | null
        }[]
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
    Enums: {},
  },
} as const