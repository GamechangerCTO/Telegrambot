/**
 * ⚙️ CONTENT CONFIGURATION - Content Type Settings and Configurations
 * Central configuration for all content types and their properties
 */

import { ContentType } from './content-router';

export interface ContentTypeConfig {
  needsImage: boolean;
  maxLength: number;
  priority: number;
  description: string;
  defaultMaxItems: number;
  imageRequired: boolean;
  supportsPolls: boolean;
  supportsKeyboards: boolean;
  schedulingEnabled: boolean;
  automationEnabled: boolean;
}

export const CONTENT_CONFIG: Record<ContentType, ContentTypeConfig> = {
  live: {
    needsImage: false,
    maxLength: 300,
    priority: 1,
    description: 'Real-time match updates',
    defaultMaxItems: 3,
    imageRequired: false,
    supportsPolls: false,
    supportsKeyboards: false,
    schedulingEnabled: false,
    automationEnabled: true
  },
  betting: {
    needsImage: true,
    maxLength: 600,
    priority: 2,
    description: 'AI-powered betting tips',
    defaultMaxItems: 2,
    imageRequired: true,
    supportsPolls: false,
    supportsKeyboards: true,
    schedulingEnabled: true,
    automationEnabled: true
  },
  news: {
    needsImage: true,
    maxLength: 800,
    priority: 3,
    description: 'RSS-based news summaries',
    defaultMaxItems: 1,
    imageRequired: true,
    supportsPolls: false,
    supportsKeyboards: true,
    schedulingEnabled: true,
    automationEnabled: true
  },
  polls: {
    needsImage: false,
    maxLength: 500,
    priority: 4,
    description: 'Interactive fan polls',
    defaultMaxItems: 1,
    imageRequired: false,
    supportsPolls: true,
    supportsKeyboards: true,
    schedulingEnabled: true,
    automationEnabled: true
  },
  analysis: {
    needsImage: true,
    maxLength: 1000,
    priority: 5,
    description: 'Match analysis reports',
    defaultMaxItems: 1,
    imageRequired: true,
    supportsPolls: false,
    supportsKeyboards: false,
    schedulingEnabled: true,
    automationEnabled: true
  },
  coupons: {
    needsImage: true,
    maxLength: 400,
    priority: 6,
    description: 'Affiliate promotions',
    defaultMaxItems: 1,
    imageRequired: true,
    supportsPolls: false,
    supportsKeyboards: true,
    schedulingEnabled: true,
    automationEnabled: true
  },
  memes: {
    needsImage: true,
    maxLength: 200,
    priority: 7,
    description: 'Entertainment content',
    defaultMaxItems: 1,
    imageRequired: true,
    supportsPolls: false,
    supportsKeyboards: false,
    schedulingEnabled: true,
    automationEnabled: false
  },
  daily_summary: {
    needsImage: true,
    maxLength: 1200,
    priority: 8,
    description: 'Daily recap reports',
    defaultMaxItems: 1,
    imageRequired: true,
    supportsPolls: false,
    supportsKeyboards: false,
    schedulingEnabled: true,
    automationEnabled: true
  },
  weekly_summary: {
    needsImage: true,
    maxLength: 1500,
    priority: 9,
    description: 'Weekly summary reports',
    defaultMaxItems: 1,
    imageRequired: true,
    supportsPolls: false,
    supportsKeyboards: false,
    schedulingEnabled: true,
    automationEnabled: true
  }
};

export const SUPPORTED_LANGUAGES = ['en', 'am', 'sw'] as const;
export type Language = typeof SUPPORTED_LANGUAGES[number];

export const SUPPORTED_ACTIONS = ['send_now', 'preview', 'schedule', 'automation'] as const;
export type ActionType = typeof SUPPORTED_ACTIONS[number];

export const SUPPORTED_MODES = ['ai_enhanced', 'manual', 'automated'] as const;
export type ModeType = typeof SUPPORTED_MODES[number];

export const LANGUAGE_NAMES = {
  en: 'English',
  am: 'አማርኛ',
  sw: 'Kiswahili'
} as const;

export const CONTENT_TYPE_EMOJIS = {
  live: '🔴',
  betting: '🎯',
  news: '📰',
  polls: '📊',
  analysis: '📈',
  coupons: '🎫',
  memes: '😄',
  daily_summary: '📋',
  weekly_summary: '📊'
} as const;

export const DEFAULT_SETTINGS = {
  MAX_POSTS_PER_CHANNEL: 3,
  DEFAULT_LANGUAGE: 'en' as Language,
  DEFAULT_MODE: 'ai_enhanced' as ModeType,
  DEFAULT_ACTION: 'send_now' as ActionType,
  IMAGE_GENERATION_TIMEOUT: 30000, // 30 seconds
  TELEGRAM_SEND_TIMEOUT: 15000, // 15 seconds
  CONTENT_GENERATION_TIMEOUT: 60000, // 60 seconds
  MAX_RETRY_ATTEMPTS: 3,
  MIN_CONTENT_LENGTH: 10,
  MAX_CONTENT_LENGTH: 2000
} as const;

export const FALLBACK_TEMPLATES = {
  en: {
    title: 'Recent Football Updates',
    content: '⚽ Latest updates from the football world\n🏆 Stay tuned for more updates...'
  },
  am: {
    title: 'የቅርብ ጊዜ የእግር ኳስ ዝማኔዎች',
    content: '⚽ ከእግር ኳስ አለም የቅርብ ጊዜ ዝማኔዎች\n🏆 ለተጨማሪ ዝማኔዎች ተከታተሉን...'
  },
  sw: {
    title: 'Masasisho ya Hivi Karibuni ya Mpira wa Miguu',
    content: '⚽ Masasisho ya hivi karibuni kutoka ulimwenguni mwa mpira wa miguu\n🏆 Endelea kufuatilia...'
  }
} as const;

/**
 * Utility functions for content configuration
 */
export class ContentConfigUtils {
  static getContentConfig(type: ContentType): ContentTypeConfig {
    return CONTENT_CONFIG[type];
  }

  static getContentTypesByPriority(): ContentType[] {
    return Object.entries(CONTENT_CONFIG)
      .sort(([, a], [, b]) => a.priority - b.priority)
      .map(([type]) => type as ContentType);
  }

  static getAutomationEnabledTypes(): ContentType[] {
    return Object.entries(CONTENT_CONFIG)
      .filter(([, config]) => config.automationEnabled)
      .map(([type]) => type as ContentType);
  }

  static getImageRequiredTypes(): ContentType[] {
    return Object.entries(CONTENT_CONFIG)
      .filter(([, config]) => config.imageRequired)
      .map(([type]) => type as ContentType);
  }

  static isValidContentType(type: string): type is ContentType {
    return type in CONTENT_CONFIG;
  }

  static isValidLanguage(language: string): language is Language {
    return SUPPORTED_LANGUAGES.includes(language as Language);
  }

  static isValidAction(action: string): action is ActionType {
    return SUPPORTED_ACTIONS.includes(action as ActionType);
  }

  static isValidMode(mode: string): mode is ModeType {
    return SUPPORTED_MODES.includes(mode as ModeType);
  }

  static getContentTypeEmoji(type: ContentType): string {
    return CONTENT_TYPE_EMOJIS[type] || '⚽';
  }

  static getLanguageName(language: Language): string {
    return LANGUAGE_NAMES[language];
  }

  static getFallbackTemplate(language: Language): { title: string; content: string } {
    return FALLBACK_TEMPLATES[language];
  }

  static getDefaultMaxItems(type: ContentType): number {
    return CONTENT_CONFIG[type].defaultMaxItems;
  }

  static shouldGenerateImage(type: ContentType): boolean {
    return CONTENT_CONFIG[type].needsImage;
  }

  static getMaxContentLength(type: ContentType): number {
    return CONTENT_CONFIG[type].maxLength;
  }

  static supportsScheduling(type: ContentType): boolean {
    return CONTENT_CONFIG[type].schedulingEnabled;
  }

  static supportsAutomation(type: ContentType): boolean {
    return CONTENT_CONFIG[type].automationEnabled;
  }

  static getAllSupportedTypes(): Array<{ type: ContentType; priority: number; description: string }> {
    return Object.entries(CONTENT_CONFIG).map(([type, config]) => ({
      type: type as ContentType,
      priority: config.priority,
      description: config.description
    }));
  }
}

export const contentConfigUtils = new ContentConfigUtils(); 