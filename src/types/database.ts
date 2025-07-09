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
      bots: {
        Row: {
          auto_post_enabled: boolean | null
          created_at: string | null
          id: string
          is_active: boolean | null
          language_code: string | null
          last_post_at: string | null
          manager_id: string | null
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
          manager_id?: string | null
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
          manager_id?: string | null
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
            foreignKeyName: "bots_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "managers"
            referencedColumns: ["id"]
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
      channels: {
        Row: {
          affiliate_code: string | null
          auto_post: boolean | null
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
          post_frequency_hours: number | null
          preferred_post_times: string[] | null
          selected_leagues: Json | null
          selected_teams: Json | null
          telegram_channel_id: string
          telegram_channel_username: string | null
          total_posts_sent: number | null
          updated_at: string | null
        }
        Insert: {
          affiliate_code?: string | null
          auto_post?: boolean | null
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
          post_frequency_hours?: number | null
          preferred_post_times?: string[] | null
          selected_leagues?: Json | null
          selected_teams?: Json | null
          telegram_channel_id: string
          telegram_channel_username?: string | null
          total_posts_sent?: number | null
          updated_at?: string | null
        }
        Update: {
          affiliate_code?: string | null
          auto_post?: boolean | null
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
          post_frequency_hours?: number | null
          preferred_post_times?: string[] | null
          selected_leagues?: Json | null
          selected_teams?: Json | null
          telegram_channel_id?: string
          telegram_channel_username?: string | null
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
      coupons: {
        Row: {
          affiliate_code: string
          affiliate_url: string
          betting_site: string | null
          bonus_amount: string | null
          bot_id: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          expiry_date: string | null
          id: string
          is_active: boolean | null
          language: string | null
          max_usage: number | null
          title: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          affiliate_code: string
          affiliate_url: string
          betting_site?: string | null
          bonus_amount?: string | null
          bot_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          max_usage?: number | null
          title: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          affiliate_code?: string
          affiliate_url?: string
          betting_site?: string | null
          bonus_amount?: string | null
          bot_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          max_usage?: number | null
          title?: string
          updated_at?: string | null
          usage_count?: number | null
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
      managers: {
        Row: {
          created_at: string | null
          email: string
          email_notifications: boolean | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          name: string
          preferred_language: string | null
          role: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          email_notifications?: boolean | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          name: string
          preferred_language?: string | null
          role?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          email_notifications?: boolean | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          name?: string
          preferred_language?: string | null
          role?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "managers_preferred_language_fkey"
            columns: ["preferred_language"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      post_templates: {
        Row: {
          bot_id: string | null
          content: string
          content_template: string | null
          content_translations: Json | null
          created_at: string | null
          description: string | null
          frequency_hours: number | null
          id: string
          include_graph: boolean | null
          include_image: boolean | null
          is_active: boolean | null
          name: string
          template_variables: Json | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          bot_id?: string | null
          content: string
          content_template?: string | null
          content_translations?: Json | null
          created_at?: string | null
          description?: string | null
          frequency_hours?: number | null
          id?: string
          include_graph?: boolean | null
          include_image?: boolean | null
          is_active?: boolean | null
          name: string
          template_variables?: Json | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          bot_id?: string | null
          content?: string
          content_template?: string | null
          content_translations?: Json | null
          created_at?: string | null
          description?: string | null
          frequency_hours?: number | null
          id?: string
          include_graph?: boolean | null
          include_image?: boolean | null
          is_active?: boolean | null
          name?: string
          template_variables?: Json | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_templates_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          bot_id: string | null
          channel_id: string | null
          content: string
          content_translations: Json | null
          created_at: string | null
          engagement_stats: Json | null
          id: string
          scheduled_for: string | null
          sent_at: string | null
          status: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          bot_id?: string | null
          channel_id?: string | null
          content: string
          content_translations?: Json | null
          created_at?: string | null
          engagement_stats?: Json | null
          id?: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          bot_id?: string | null
          channel_id?: string | null
          content?: string
          content_translations?: Json | null
          created_at?: string | null
          engagement_stats?: Json | null
          id?: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
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
      rss_sources: {
        Row: {
          category: string | null
          created_at: string | null
          fetch_frequency_minutes: number | null
          id: string
          is_active: boolean | null
          language: string | null
          last_fetched_at: string | null
          name: string
          updated_at: string | null
          url: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          fetch_frequency_minutes?: number | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          last_fetched_at?: string | null
          name: string
          updated_at?: string | null
          url: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          fetch_frequency_minutes?: number | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          last_fetched_at?: string | null
          name?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "rss_sources_language_fkey"
            columns: ["language"]
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
          updated_by: string | null
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
          updated_by?: string | null
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
          updated_by?: string | null
          value?: string | null
          value_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "managers"
            referencedColumns: ["id"]
          },
        ]
      }
      sports_apis: {
        Row: {
          api_key: string | null
          api_url: string
          created_at: string | null
          daily_calls_limit: number | null
          daily_calls_used: number | null
          id: string
          is_active: boolean | null
          last_called_at: string | null
          name: string
          priority: number | null
          rate_limit_per_hour: number | null
        }
        Insert: {
          api_key?: string | null
          api_url: string
          created_at?: string | null
          daily_calls_limit?: number | null
          daily_calls_used?: number | null
          id?: string
          is_active?: boolean | null
          last_called_at?: string | null
          name: string
          priority?: number | null
          rate_limit_per_hour?: number | null
        }
        Update: {
          api_key?: string | null
          api_url?: string
          created_at?: string | null
          daily_calls_limit?: number | null
          daily_calls_used?: number | null
          id?: string
          is_active?: boolean | null
          last_called_at?: string | null
          name?: string
          priority?: number | null
          rate_limit_per_hour?: number | null
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