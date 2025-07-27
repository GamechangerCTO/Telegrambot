/**
 * ⚙️ CONTENT CONFIGURATION - Content Type Settings and Configurations
 * Central configuration for all content types and their properties
 */

import { ContentType } from './content-router';

// 🌍 SUPPORTED LANGUAGES - Extended to 5 languages for single-user architecture
export type Language = 'en' | 'am' | 'sw' | 'fr' | 'ar';

// 🌐 LANGUAGE CONFIGURATIONS
export const LANGUAGE_CONFIG: Record<Language, {
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  footballTerms: {
    match: string;
    goal: string;
    team: string;
    player: string;
    win: string;
    draw: string;
    loss: string;
  };
  culturalContext: string;
}> = {
  en: {
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    footballTerms: {
      match: 'match',
      goal: 'goal',
      team: 'team',
      player: 'player',
      win: 'win',
      draw: 'draw',
      loss: 'loss'
    },
    culturalContext: 'Premier League, Champions League, European football culture'
  },
  am: {
    name: 'Amharic',
    nativeName: 'አማርኛ',
    direction: 'ltr',
    footballTerms: {
      match: 'ግጥሚያ',
      goal: 'ጎል',
      team: 'ቡድን',
      player: 'ተጫዋች',
      win: 'አሸንፏል',
      draw: 'አቻ',
      loss: 'ተሸንፏል'
    },
    culturalContext: 'Ethiopian football culture, African stadium atmosphere, vibrant fan culture'
  },
  sw: {
    name: 'Swahili',
    nativeName: 'Kiswahili',
    direction: 'ltr',
    footballTerms: {
      match: 'mechi',
      goal: 'bao',
      team: 'timu',
      player: 'mchezaji',
      win: 'kushinda',
      draw: 'sare',
      loss: 'kushindwa'
    },
    culturalContext: 'East African football culture, Swahili region stadium atmosphere, community football spirit'
  },
  fr: {
    name: 'French',
    nativeName: 'Français',
    direction: 'ltr',
    footballTerms: {
      match: 'match',
      goal: 'but',
      team: 'équipe',
      player: 'joueur',
      win: 'victoire',
      draw: 'match nul',
      loss: 'défaite'
    },
    culturalContext: 'Ligue 1, French football culture, European championship atmosphere'
  },
  ar: {
    name: 'Arabic',
    nativeName: 'العربية',
    direction: 'rtl',
    footballTerms: {
      match: 'مباراة',
      goal: 'هدف',
      team: 'فريق',
      player: 'لاعب',
      win: 'فوز',
      draw: 'تعادل',
      loss: 'هزيمة'
    },
    culturalContext: 'Arabic football culture, Middle Eastern and North African football passion'
  }
};

// 🎯 SINGLE USER CONFIGURATION
export const SINGLE_USER_CONFIG = {
  email: 'triroars@gmail.com',
  role: 'super_admin',
  allowedLanguages: ['en', 'am', 'sw', 'fr', 'ar'] as Language[],
  defaultLanguage: 'en' as Language
};

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

// 🎯 CONTENT TYPE CONFIGURATION INTERFACE
export interface ContentTypeConfig {
  priority: number;
  description: string;
  defaultMaxItems: number;
  needsImage: boolean;
  imageRequired: boolean;
  maxLength: number;
  schedulingEnabled: boolean;
  automationEnabled: boolean;
}

export const SUPPORTED_LANGUAGES: Language[] = ['en', 'am', 'sw', 'fr', 'ar'];

// 📋 CONTENT CONFIGURATION - Main content type definitions
export const CONTENT_CONFIG: Record<ContentType, ContentTypeConfig> = {
  live: {
    priority: 1,
    description: 'Live match updates and real-time scores',
    defaultMaxItems: 1,
    needsImage: false,
    imageRequired: false,
    maxLength: 500,
    schedulingEnabled: false,
    automationEnabled: true
  },
  betting: {
    priority: 2,
    description: 'Betting tips and odds analysis',
    defaultMaxItems: 2,
    needsImage: true,
    imageRequired: false,
    maxLength: 800,
    schedulingEnabled: true,
    automationEnabled: true
  },
  news: {
    priority: 3,
    description: 'Latest football news and updates',
    defaultMaxItems: 3,
    needsImage: true,
    imageRequired: false,
    maxLength: 1000,
    schedulingEnabled: true,
    automationEnabled: true
  },
  polls: {
    priority: 4,
    description: 'Interactive polls and fan engagement',
    defaultMaxItems: 1,
    needsImage: false,
    imageRequired: false,
    maxLength: 300,
    schedulingEnabled: true,
    automationEnabled: true
  },
  analysis: {
    priority: 5,
    description: 'Match analysis and tactical insights',
    defaultMaxItems: 2,
    needsImage: true,
    imageRequired: false,
    maxLength: 1200,
    schedulingEnabled: true,
    automationEnabled: true
  },
  coupons: {
    priority: 6,
    description: 'Promotional coupons and offers',
    defaultMaxItems: 1,
    needsImage: false,
    imageRequired: false,
    maxLength: 400,
    schedulingEnabled: true,
    automationEnabled: true
  },
  memes: {
    priority: 7,
    description: 'Football memes and humor content',
    defaultMaxItems: 2,
    needsImage: true,
    imageRequired: true,
    maxLength: 200,
    schedulingEnabled: true,
    automationEnabled: false
  },
  daily_summary: {
    priority: 8,
    description: 'Daily football summary and highlights',
    defaultMaxItems: 1,
    needsImage: false,
    imageRequired: false,
    maxLength: 1500,
    schedulingEnabled: true,
    automationEnabled: true
  },
  weekly_summary: {
    priority: 9,
    description: 'Weekly football roundup and analysis',
    defaultMaxItems: 1,
    needsImage: true,
    imageRequired: false,
    maxLength: 2000,
    schedulingEnabled: true,
    automationEnabled: false
  }
};

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