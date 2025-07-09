/**
 * Common types used across the application
 */

export type Language = 'en' | 'am' | 'sw';

export type ContentType = 'live' | 'betting' | 'news' | 'polls' | 'analysis' | 'coupons' | 'memes' | 'daily_summary' | 'weekly_summary';

export interface ProcessingInfo {
  data_source: string;
  ai_processing: boolean;
  image_generation: boolean;
  fallback_used: boolean;
  [key: string]: any;
}

export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  content: string;
  language: Language;
  generated_at: string;
  priority: number;
  metadata?: Record<string, any>;
}

export interface ContentGenerationResult {
  contentItems: ContentItem[];
  processingInfo: ProcessingInfo;
}