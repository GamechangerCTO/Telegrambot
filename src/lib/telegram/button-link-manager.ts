/**
 * 🔗 TELEGRAM BUTTON LINK MANAGER
 * 
 * Manages all button links and ensures they connect to proper URLs/actions
 * Provides centralized link management for consistency across all content types
 */

import { supabase } from '@/lib/supabase';

export interface ButtonLinkConfig {
  // Website URLs
  main_website?: string;
  betting_platform?: string;
  live_scores?: string;
  news_source?: string;
  social_media?: {
    telegram?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  
  // Affiliate codes
  affiliate_codes?: {
    betting?: string;
    bookmaker?: string;
    casino?: string;
  };
  
  // Channel-specific settings
  channel_settings?: {
    enable_betting_links?: boolean;
    enable_affiliate_links?: boolean;
    enable_social_sharing?: boolean;
    custom_website?: string;
  };
}

export interface EnhancedButton {
  text: string;
  type: 'url' | 'callback' | 'copy' | 'webapp' | 'share';
  action?: string;
  url?: string;
  callback_data?: string;
  copy_text?: string;
  web_app_url?: string;
  share_text?: string;
  analytics_tag?: string;
}

export class ButtonLinkManager {
  private static instance: ButtonLinkManager;
  private linkConfig: ButtonLinkConfig = {};
  private channelConfigs: Map<string, ButtonLinkConfig> = new Map();

  constructor() {
    this.initializeDefaultConfig();
  }

  static getInstance(): ButtonLinkManager {
    if (!ButtonLinkManager.instance) {
      ButtonLinkManager.instance = new ButtonLinkManager();
    }
    return ButtonLinkManager.instance;
  }

  /**
   * 🔧 Initialize default configuration
   */
  private initializeDefaultConfig(): void {
    this.linkConfig = {
      main_website: 'https://africasportscenter.com',
      betting_platform: 'https://1xbet.com',
      live_scores: 'https://livescore.com',
      news_source: 'https://bbc.com/sport/football',
      social_media: {
        telegram: 'https://t.me/africansportdata',
        twitter: 'https://twitter.com/africasports',
        facebook: 'https://facebook.com/africasportscenter',
        instagram: 'https://instagram.com/africasportscenter'
      },
      affiliate_codes: {
        betting: 'AFRICA2024',
        bookmaker: 'SPORT123',
        casino: 'LUCKY777'
      },
      channel_settings: {
        enable_betting_links: true,
        enable_affiliate_links: true,
        enable_social_sharing: true,
        custom_website: undefined
      }
    };
  }

  /**
   * 🏆 Create betting content buttons with proper links
   */
  createBettingButtons(options: {
    match: { home: string; away: string; competition: string };
    tips: Array<{ type: string; prediction: string; odds: string; confidence: number }>;
    language: 'en' | 'am' | 'sw' | 'fr' | 'ar';
    channelId?: string;
  }): EnhancedButton[] {
    const { match, tips, language, channelId } = options;
    const config = this.getChannelConfig(channelId);
    const buttons: EnhancedButton[] = [];

    // Row 1: Interactive reaction buttons
    buttons.push(
      {
        text: this.getLocalizedText('like_tip', language),
        type: 'callback',
        callback_data: `like_betting_${Date.now()}`,
        analytics_tag: 'betting_like'
      },
      {
        text: this.getLocalizedText('follow_tip', language),
        type: 'callback',
        callback_data: `follow_tip_${Date.now()}`,
        analytics_tag: 'betting_follow'
      },
      {
        text: this.getLocalizedText('tip_stats', language),
        type: 'callback',
        callback_data: `tip_stats_${Date.now()}`,
        analytics_tag: 'betting_stats'
      }
    );

    // Row 2: Copy tip and save functionality
    if (tips.length > 0) {
      buttons.push(
        {
          text: `📋 ${this.getLocalizedText('copy_tip', language)}: ${tips[0].prediction.substring(0, 15)}...`,
          type: 'copy',
          copy_text: `${tips[0].prediction} - ${this.getLocalizedText('odds', language)}: ${tips[0].odds}`,
          analytics_tag: 'betting_copy'
        },
        {
          text: `⭐ ${this.getLocalizedText('save_tip', language)}`,
          type: 'callback',
          callback_data: `save_tip_${Date.now()}`,
          analytics_tag: 'betting_save'
        }
      );
    }

    // Row 3: External links (if enabled)
    if (config.channel_settings?.enable_betting_links) {
      const website = config.channel_settings?.custom_website || config.main_website;
      const bettingPlatform = config.betting_platform;
      
      if (website) {
        buttons.push({
          text: `🌐 ${this.getLocalizedText('more_tips', language)}`,
          type: 'url',
          url: this.addTrackingParams(website, 'betting_more_tips', channelId),
          analytics_tag: 'betting_website'
        });
      }
      
      if (bettingPlatform) {
        buttons.push({
          text: `📈 ${this.getLocalizedText('live_odds', language)}`,
          type: 'url',
          url: this.addTrackingParams(bettingPlatform, 'live_odds', channelId),
          analytics_tag: 'betting_odds'
        });
      }
    }

    // Row 4: Affiliate code (if enabled and available)
    if (config.channel_settings?.enable_affiliate_links && config.affiliate_codes?.betting) {
      buttons.push({
        text: `🎁 ${this.getLocalizedText('use_code', language)}: ${config.affiliate_codes.betting}`,
        type: 'copy',
        copy_text: config.affiliate_codes.betting,
        analytics_tag: 'betting_affiliate'
      });
    }

    // Row 5: Social sharing (if enabled)
    if (config.channel_settings?.enable_social_sharing) {
      const shareText = `⚽ ${match.home} vs ${match.away} - ${this.getLocalizedText('betting_tips', language)}!`;
      
      buttons.push(
        {
          text: `📤 ${this.getLocalizedText('share_match', language)}`,
          type: 'url',
          url: `https://t.me/share/url?url=${encodeURIComponent(shareText)}`,
          analytics_tag: 'betting_share'
        },
        {
          text: `💬 ${this.getLocalizedText('discuss', language)}`,
          type: 'callback',
          callback_data: `discuss_match_${Date.now()}`,
          analytics_tag: 'betting_discuss'
        }
      );
    }

    return buttons;
  }

  /**
   * 📰 Create news content buttons with proper links
   */
  createNewsButtons(options: {
    title: string;
    category: string;
    sourceUrl?: string;
    language: 'en' | 'am' | 'sw' | 'fr' | 'ar';
    channelId?: string;
  }): EnhancedButton[] {
    const { title, category, sourceUrl, language, channelId } = options;
    const config = this.getChannelConfig(channelId);
    const buttons: EnhancedButton[] = [];

    // Row 1: Reaction buttons
    buttons.push(
      {
        text: `👍 ${this.getLocalizedText('interesting', language)} (0)`,
        type: 'callback',
        callback_data: `news_like_${Date.now()}`,
        analytics_tag: 'news_like'
      },
      {
        text: `❤️ ${this.getLocalizedText('love', language)} (0)`,
        type: 'callback',
        callback_data: `news_love_${Date.now()}`,
        analytics_tag: 'news_love'
      },
      {
        text: `💬 ${this.getLocalizedText('discuss', language)}`,
        type: 'callback',
        callback_data: `news_discuss_${Date.now()}`,
        analytics_tag: 'news_discuss'
      }
    );

    // Row 2: Source and sharing
    if (sourceUrl) {
      buttons.push({
        text: `📖 ${this.getLocalizedText('full_article', language)}`,
        type: 'url',
        url: this.addTrackingParams(sourceUrl, 'news_source', channelId),
        analytics_tag: 'news_source'
      });
    }

    const shareText = `📰 ${title} - ${this.getLocalizedText('breaking_news', language)}`;
    buttons.push({
      text: `📤 ${this.getLocalizedText('share', language)}`,
      type: 'url',
      url: `https://t.me/share/url?url=${encodeURIComponent(shareText)}`,
      analytics_tag: 'news_share'
    });

    // Row 3: More content and alerts
    const website = config.channel_settings?.custom_website || config.main_website;
    if (website) {
      buttons.push(
        {
          text: `📰 ${this.getLocalizedText('more_news', language, category)}`,
          type: 'url',
          url: this.addTrackingParams(website, 'news_more', channelId),
          analytics_tag: 'news_website'
        },
        {
          text: `🔔 ${this.getLocalizedText('news_alerts', language)}`,
          type: 'callback',
          callback_data: `news_alerts_${Date.now()}`,
          analytics_tag: 'news_alerts'
        }
      );
    }

    return buttons;
  }

  /**
   * 🔴 Create live match buttons with proper links
   */
  createLiveButtons(options: {
    match: { home: string; away: string; competition: string; status: string };
    language: 'en' | 'am' | 'sw' | 'fr' | 'ar';
    channelId?: string;
  }): EnhancedButton[] {
    const { match, language, channelId } = options;
    const config = this.getChannelConfig(channelId);
    const buttons: EnhancedButton[] = [];

    // Row 1: Live interaction buttons
    buttons.push(
      {
        text: `⚽ ${this.getLocalizedText('goal_alert', language)}`,
        type: 'callback',
        callback_data: `goal_alert_${Date.now()}`,
        analytics_tag: 'live_goal_alert'
      },
      {
        text: `📊 ${this.getLocalizedText('live_stats', language)}`,
        type: 'callback',
        callback_data: `live_stats_${Date.now()}`,
        analytics_tag: 'live_stats'
      },
      {
        text: `🔄 ${this.getLocalizedText('refresh', language)}`,
        type: 'callback',
        callback_data: `refresh_live_${Date.now()}`,
        analytics_tag: 'live_refresh'
      }
    );

    // Row 2: Prediction and betting
    buttons.push(
      {
        text: `🎯 ${this.getLocalizedText('next_goal', language)}`,
        type: 'callback',
        callback_data: `predict_goal_${Date.now()}`,
        analytics_tag: 'live_predict'
      }
    );

    if (config.channel_settings?.enable_betting_links && config.betting_platform) {
      buttons.push({
        text: `💰 ${this.getLocalizedText('live_betting', language)}`,
        type: 'url',
        url: this.addTrackingParams(`${config.betting_platform}/live`, 'live_betting', channelId),
        analytics_tag: 'live_betting'
      });
    }

    // Row 3: Watch and share
    const liveStreamUrl = this.getLiveStreamUrl(match);
    if (liveStreamUrl) {
      buttons.push({
        text: `📱 ${this.getLocalizedText('watch_live', language)}`,
        type: 'webapp',
        web_app_url: liveStreamUrl,
        analytics_tag: 'live_watch'
      });
    }

    const shareText = `🔴 LIVE: ${match.home} vs ${match.away} - ${match.competition}`;
    buttons.push({
      text: `📤 ${this.getLocalizedText('share_score', language)}`,
      type: 'url',
      url: `https://t.me/share/url?url=${encodeURIComponent(shareText)}`,
      analytics_tag: 'live_share'
    });

    return buttons;
  }

  /**
   * 📊 Create poll buttons with proper links
   */
  createPollButtons(options: {
    pollType: 'prediction' | 'opinion' | 'trivia';
    language: 'en' | 'am' | 'sw' | 'fr' | 'ar';
    channelId?: string;
  }): EnhancedButton[] {
    const { pollType, language, channelId } = options;
    const config = this.getChannelConfig(channelId);
    const buttons: EnhancedButton[] = [];

    // Row 1: Poll interaction
    buttons.push(
      {
        text: `🎯 ${this.getLocalizedText('vote_now', language)} ⬇️`,
        type: 'callback',
        callback_data: `poll_prompt_${Date.now()}`,
        analytics_tag: 'poll_prompt'
      },
      {
        text: `📊 ${this.getLocalizedText('previous_polls', language)}`,
        type: 'callback',
        callback_data: `poll_history_${Date.now()}`,
        analytics_tag: 'poll_history'
      }
    );

    // Row 2: More polls and sharing
    const website = config.channel_settings?.custom_website || config.main_website;
    if (website) {
      buttons.push({
        text: `🌐 ${this.getLocalizedText('more_polls', language)}`,
        type: 'url',
        url: this.addTrackingParams(website, 'poll_more', channelId),
        analytics_tag: 'poll_website'
      });
    }

    const shareText = `🗳️ ${this.getLocalizedText('vote_poll', language)}`;
    buttons.push({
      text: `📤 ${this.getLocalizedText('share_poll', language)}`,
      type: 'share',
      share_text: shareText,
      analytics_tag: 'poll_share'
    });

    return buttons;
  }

  /**
   * ⚙️ Convert enhanced buttons to Telegram format
   */
  convertToTelegramFormat(buttons: EnhancedButton[]): Array<Array<any>> {
    const keyboard: Array<Array<any>> = [];
    let currentRow: Array<any> = [];

    buttons.forEach((button, index) => {
      const telegramButton: any = { text: button.text };

      switch (button.type) {
        case 'url':
          if (button.url) telegramButton.url = button.url;
          break;
        case 'callback':
          if (button.callback_data) telegramButton.callback_data = button.callback_data;
          break;
        case 'copy':
          if (button.copy_text) telegramButton.copy_text = { text: button.copy_text };
          break;
        case 'webapp':
          if (button.web_app_url) telegramButton.web_app = { url: button.web_app_url };
          break;
        case 'share':
          if (button.share_text) telegramButton.switch_inline_query = button.share_text;
          break;
      }

      currentRow.push(telegramButton);

      // Create new row every 2-3 buttons (based on text length)
      const shouldNewRow = currentRow.length >= 3 || 
                          (currentRow.length >= 2 && button.text.length > 15) ||
                          index === buttons.length - 1;

      if (shouldNewRow) {
        keyboard.push([...currentRow]);
        currentRow = [];
      }
    });

    return keyboard;
  }

  /**
   * 🌐 Get channel-specific configuration
   */
  private getChannelConfig(channelId?: string): ButtonLinkConfig {
    if (!channelId) return this.linkConfig;
    
    const channelConfig = this.channelConfigs.get(channelId);
    return channelConfig || this.linkConfig;
  }

  /**
   * 📊 Add tracking parameters to URLs
   */
  private addTrackingParams(url: string, source: string, channelId?: string): string {
    if (!url) return '';
    
    const separator = url.includes('?') ? '&' : '?';
    const params = new URLSearchParams();
    
    params.append('utm_source', 'telegram');
    params.append('utm_medium', 'bot');
    params.append('utm_campaign', source);
    
    if (channelId) {
      params.append('utm_content', channelId);
    }
    
    params.append('t', Date.now().toString());
    
    return `${url}${separator}${params.toString()}`;
  }

  /**
   * 📺 Get live stream URL for match
   */
  private getLiveStreamUrl(match: { home: string; away: string; competition: string }): string | null {
    // This would connect to actual live stream providers
    // For now, return a generic sports streaming platform
    const streamId = `${match.home}_${match.away}`.replace(/\s+/g, '_').toLowerCase();
    return `https://live-sports-stream.com/match/${streamId}`;
  }

  /**
   * 🌍 Get localized text for buttons
   */
  private getLocalizedText(key: string, language: 'en' | 'am' | 'sw' | 'fr' | 'ar', context?: string): string {
    const translations: Record<string, Record<string, string>> = {
      en: {
        like_tip: 'Like Tip',
        follow_tip: 'Follow',
        tip_stats: 'Stats',
        copy_tip: 'Copy',
        save_tip: 'Save Tip',
        more_tips: 'More Tips',
        live_odds: 'Live Odds',
        use_code: 'Code',
        betting_tips: 'betting tips',
        share_match: 'Share Match',
        discuss: 'Discuss',
        interesting: 'Interesting',
        love: 'Love',
        full_article: 'Full Article',
        breaking_news: 'Breaking News',
        share: 'Share',
        more_news: `More ${context || 'News'}`,
        news_alerts: 'News Alerts',
        goal_alert: 'Goal Alert',
        live_stats: 'Live Stats',
        refresh: 'Refresh',
        next_goal: 'Next Goal?',
        live_betting: 'Live Betting',
        watch_live: 'Watch Live',
        share_score: 'Share Score',
        vote_now: 'Vote Now',
        previous_polls: 'Previous Polls',
        more_polls: 'More Polls',
        vote_poll: 'Vote in our sports poll',
        share_poll: 'Share Poll',
        odds: 'Odds'
      },
      am: {
        like_tip: 'ምክር ወድጄዋለሁ',
        follow_tip: 'ተከተል',
        tip_stats: 'ስታቲስቲክስ',
        copy_tip: 'ቅዳ',
        save_tip: 'ምክር አስቀምጥ',
        more_tips: 'ተጨማሪ ምክሮች',
        live_odds: 'የቀጥታ ዕድሎች',
        use_code: 'ኮድ',
        betting_tips: 'የውርርድ ምክሮች',
        share_match: 'ግጥሚያ አካፍል',
        discuss: 'ተወያይ',
        interesting: 'አስደሳች',
        love: 'ወድጄዋለሁ',
        full_article: 'ሙሉ ጽሑፍ',
        breaking_news: 'አስቸኳይ ዜና',
        share: 'አካፍል',
        more_news: `ተጨማሪ ${context || 'ዜናዎች'}`,
        news_alerts: 'የዜና ማንቂያዎች',
        goal_alert: 'የጎል ማንቂያ',
        live_stats: 'የቀጥታ ስታቲስቲክስ',
        refresh: 'አድስ',
        next_goal: 'ቀጣዩ ጎል?',
        live_betting: 'የቀጥታ ውርርድ',
        watch_live: 'በቀጥታ ተመልከት',
        share_score: 'ውጤት አካፍል',
        vote_now: 'አሁን ድምጽ ስጥ',
        previous_polls: 'ያለፉ ምርጫዎች',
        more_polls: 'ተጨማሪ ምርጫዎች',
        vote_poll: 'በስፖርት ምርጫችን ድምጽ ስጡ',
        share_poll: 'ምርጫ አካፍል',
        odds: 'ዕድሎች'
      },
      sw: {
        like_tip: 'Nipendezei',
        follow_tip: 'Fuata',
        tip_stats: 'Takwimu',
        copy_tip: 'Nakili',
        save_tip: 'Hifadhi Pendekezo',
        more_tips: 'Mapendekezo Zaidi',
        live_odds: 'Uwezekano wa Moja kwa Moja',
        use_code: 'Msimbo',
        betting_tips: 'mapendekezo ya kamari',
        share_match: 'Shiriki Mechi',
        discuss: 'Jadili',
        interesting: 'Ya Kuvutia',
        love: 'Naipenda',
        full_article: 'Makala Kamili',
        breaking_news: 'Habari za Haraka',
        share: 'Shiriki',
        more_news: `Habari Zaidi za ${context || 'Habari'}`,
        news_alerts: 'Arifa za Habari',
        goal_alert: 'Arifa ya Bao',
        live_stats: 'Takwimu za Moja kwa Moja',
        refresh: 'Onyesha Upya',
        next_goal: 'Bao Linalofuata?',
        live_betting: 'Kamari ya Moja kwa Moja',
        watch_live: 'Tazama Moja kwa Moja',
        share_score: 'Shiriki Matokeo',
        vote_now: 'Piga Kura Sasa',
        previous_polls: 'Kura za Awali',
        more_polls: 'Kura Zaidi',
        vote_poll: 'Piga kura katika uchaguzi wetu wa michezo',
        share_poll: 'Shiriki Uchaguzi',
        odds: 'Uwezekano'
      },
      fr: {
        like_tip: 'J\'aime le Conseil',
        follow_tip: 'Suivre',
        tip_stats: 'Statistiques',
        copy_tip: 'Copier',
        save_tip: 'Sauvegarder',
        more_tips: 'Plus de Conseils',
        live_odds: 'Cotes en Direct',
        use_code: 'Code',
        betting_tips: 'conseils de paris',
        share_match: 'Partager Match',
        discuss: 'Discuter',
        interesting: 'Intéressant',
        love: 'J\'adore',
        full_article: 'Article Complet',
        breaking_news: 'Dernières Nouvelles',
        share: 'Partager',
        more_news: `Plus de ${context || 'Nouvelles'}`,
        news_alerts: 'Alertes Nouvelles',
        goal_alert: 'Alerte But',
        live_stats: 'Stats en Direct',
        refresh: 'Actualiser',
        next_goal: 'Prochain But?',
        live_betting: 'Paris en Direct',
        watch_live: 'Regarder en Direct',
        share_score: 'Partager Score',
        vote_now: 'Voter Maintenant',
        previous_polls: 'Sondages Précédents',
        more_polls: 'Plus de Sondages',
        vote_poll: 'Votez dans notre sondage sportif',
        share_poll: 'Partager Sondage',
        odds: 'Cotes'
      },
      ar: {
        like_tip: 'أعجبني النصيحة',
        follow_tip: 'متابعة',
        tip_stats: 'إحصائيات',
        copy_tip: 'نسخ',
        save_tip: 'حفظ النصيحة',
        more_tips: 'المزيد من النصائح',
        live_odds: 'احتمالات مباشرة',
        use_code: 'الكود',
        betting_tips: 'نصائح الرهان',
        share_match: 'مشاركة المباراة',
        discuss: 'مناقشة',
        interesting: 'مثير للاهتمام',
        love: 'أحب',
        full_article: 'المقال كاملاً',
        breaking_news: 'أخبار عاجلة',
        share: 'مشاركة',
        more_news: `المزيد من ${context || 'الأخبار'}`,
        news_alerts: 'تنبيهات الأخبار',
        goal_alert: 'تنبيه الهدف',
        live_stats: 'إحصائيات مباشرة',
        refresh: 'تحديث',
        next_goal: 'الهدف التالي؟',
        live_betting: 'رهان مباشر',
        watch_live: 'مشاهدة مباشرة',
        share_score: 'مشاركة النتيجة',
        vote_now: 'صوت الآن',
        previous_polls: 'استطلاعات سابقة',
        more_polls: 'المزيد من الاستطلاعات',
        vote_poll: 'صوت في استطلاع الرياضة',
        share_poll: 'مشاركة الاستطلاع',
        odds: 'الاحتمالات'
      }
    };

    return translations[language]?.[key] || translations.en[key] || key;
  }

  /**
   * 🔧 Load channel configuration from database
   */
  async loadChannelConfig(channelId: string): Promise<void> {
    try {
      const { data: channel } = await supabase
        .from('channels')
        .select('*')
        .eq('id', channelId)
        .single();

      if (channel) {
        const websites = channel.websites || {};
        
        const config: ButtonLinkConfig = {
          main_website: websites.main_website || this.linkConfig.main_website,
          betting_platform: websites.betting_platform || this.linkConfig.betting_platform,
          live_scores: websites.live_scores || this.linkConfig.live_scores,
          news_source: websites.news_source || this.linkConfig.news_source,
          social_media: {
            telegram: websites.telegram || this.linkConfig.social_media?.telegram,
            twitter: websites.twitter || this.linkConfig.social_media?.twitter,
            facebook: websites.facebook || this.linkConfig.social_media?.facebook,
            instagram: websites.instagram || this.linkConfig.social_media?.instagram
          },
          affiliate_codes: {
            betting: channel.affiliate_code || this.linkConfig.affiliate_codes?.betting,
            bookmaker: websites.bookmaker_code || this.linkConfig.affiliate_codes?.bookmaker,
            casino: websites.casino_code || this.linkConfig.affiliate_codes?.casino
          },
          channel_settings: {
            enable_betting_links: websites.enable_betting_links !== false,
            enable_affiliate_links: websites.enable_affiliate_links !== false,
            enable_social_sharing: websites.enable_social_sharing !== false,
            custom_website: websites.custom_website || undefined
          }
        };

        this.channelConfigs.set(channelId, config);
      }
    } catch (error) {
      console.error(`❌ Error loading channel config for ${channelId}:`, error);
    }
  }

  /**
   * 📊 Track button click analytics
   */
  async trackButtonClick(options: {
    channelId: string;
    buttonType: string;
    analytics_tag?: string;
    userId?: string;
  }): Promise<void> {
    try {
      await supabase
        .from('button_analytics')
        .insert({
          channel_id: options.channelId,
          button_type: options.buttonType,
          analytics_tag: options.analytics_tag,
          user_id: options.userId,
          clicked_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('❌ Error tracking button click:', error);
    }
  }
}

// Export singleton instance
export const buttonLinkManager = ButtonLinkManager.getInstance();
export default ButtonLinkManager;