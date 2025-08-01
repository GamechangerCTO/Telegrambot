/**
 * 🚀 ENHANCED TELEGRAM API SERVICE
 * Full implementation of all Telegram Bot API capabilities for sports content
 * Based on the comprehensive Telegram API guide - utilizing every feature available
 */

import { supabase } from '@/lib/supabase';
import { buttonLinkManager } from './button-link-manager';

// ====== TYPES & INTERFACES ======

export interface TelegramMessage {
  chat_id: string;
  text?: string;
  photo?: string | Buffer;
  video?: string | Buffer;
  caption?: string;
  parse_mode?: 'HTML' | 'MarkdownV2';
  reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply;
  disable_notification?: boolean;
  protect_content?: boolean;
  message_effect_id?: string;
  link_preview_options?: LinkPreviewOptions;
  has_spoiler?: boolean;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface InlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
  web_app?: { url: string };
  switch_inline_query?: string;
  switch_inline_query_current_chat?: string;
  copy_text?: { text: string };
  login_url?: {
    url: string;
    forward_text?: string;
    bot_username?: string;
    request_write_access?: boolean;
  };
}

export interface ReplyKeyboardMarkup {
  keyboard: KeyboardButton[][];
  resize_keyboard?: boolean;
  one_time_keyboard?: boolean;
  selective?: boolean;
}

export interface KeyboardButton {
  text: string;
  request_contact?: boolean;
  request_location?: boolean;
  web_app?: { url: string };
}

export interface ReplyKeyboardRemove {
  remove_keyboard: true;
  selective?: boolean;
}

export interface ForceReply {
  force_reply: true;
  input_placeholder?: string;
  selective?: boolean;
}

export interface LinkPreviewOptions {
  is_disabled?: boolean;
  url?: string;
  prefer_small_media?: boolean;
  prefer_large_media?: boolean;
  show_above_text?: boolean;
}

export interface MediaGroupItem {
  type: 'photo' | 'video' | 'document';
  media: string | Buffer;
  caption?: string;
  parse_mode?: 'HTML' | 'MarkdownV2';
  width?: number;
  height?: number;
  duration?: number;
  has_spoiler?: boolean;
}

export interface PollOptions {
  question: string;
  options: string[];
  is_anonymous?: boolean;
  type?: 'regular' | 'quiz';
  allows_multiple_answers?: boolean;
  correct_option_id?: number;
  explanation?: string;
  explanation_parse_mode?: 'HTML' | 'MarkdownV2';
  open_period?: number;
  close_date?: number;
}

export interface LocationOptions {
  latitude: number;
  longitude: number;
  horizontal_accuracy?: number;
  live_period?: number;
  heading?: number;
  proximity_alert_radius?: number;
}

export interface SportsContentOptions {
  channel_id: string;
  content_type: 'betting' | 'news' | 'analysis' | 'live' | 'poll' | 'summary';
  language: 'en' | 'am' | 'sw' | 'fr' | 'ar';
  enhanced_features?: {
    interactive_buttons?: boolean;
    web_app_integration?: boolean;
    polls?: boolean;
    media_groups?: boolean;
    reactions?: boolean;
    affiliate_links?: boolean;
    sharing_options?: boolean;
  };
  branding?: {
    website_url?: string;
    affiliate_code?: string;
    social_links?: { platform: string; url: string }[];
  };
}

// ====== MAIN SERVICE CLASS ======

export class EnhancedTelegramAPI {
  private botToken: string;
  private baseURL: string;

  constructor(botToken?: string) {
    this.botToken = botToken || process.env.TELEGRAM_BOT_TOKEN || '';
    this.baseURL = `https://api.telegram.org/bot${this.botToken}`;
  }

  // ====== BASIC MESSAGING ======

  /**
   * 📝 Send enhanced text message with full HTML formatting
   */
  async sendMessage(options: TelegramMessage): Promise<any> {
    const payload = {
      chat_id: options.chat_id,
      text: options.text,
      parse_mode: options.parse_mode || 'HTML',
      reply_markup: options.reply_markup,
      disable_notification: options.disable_notification || false,
      protect_content: options.protect_content || false,
      message_effect_id: options.message_effect_id,
      link_preview_options: options.link_preview_options || { is_disabled: false }
    };

    return this.makeRequest('sendMessage', payload);
  }

  /**
   * 📸 Send photo with advanced options
   */
  async sendPhoto(options: {
    chat_id: string;
    photo: string | Buffer;
    caption?: string;
    parse_mode?: 'HTML' | 'MarkdownV2';
    has_spoiler?: boolean;
    reply_markup?: InlineKeyboardMarkup;
    protect_content?: boolean;
  }): Promise<any> {
    return this.makeRequest('sendPhoto', options);
  }

  /**
   * 🎬 Send video with streaming support
   */
  async sendVideo(options: {
    chat_id: string;
    video: string | Buffer;
    duration?: number;
    width?: number;
    height?: number;
    thumbnail?: string | Buffer;
    caption?: string;
    parse_mode?: 'HTML' | 'MarkdownV2';
    supports_streaming?: boolean;
    has_spoiler?: boolean;
    reply_markup?: InlineKeyboardMarkup;
  }): Promise<any> {
    return this.makeRequest('sendVideo', options);
  }

  /**
   * 📋 Send media group (album)
   */
  async sendMediaGroup(options: {
    chat_id: string;
    media: MediaGroupItem[];
    disable_notification?: boolean;
    protect_content?: boolean;
  }): Promise<any> {
    return this.makeRequest('sendMediaGroup', options);
  }

  // ====== INTERACTIVE FEATURES ======

  /**
   * 📊 Send interactive poll
   */
  async sendPoll(chatId: string, pollOptions: PollOptions): Promise<any> {
    return this.makeRequest('sendPoll', {
      chat_id: chatId,
      ...pollOptions
    });
  }

  /**
   * 🎲 Send dice/animation
   */
  async sendDice(chatId: string, emoji: '🎲' | '🎯' | '🏀' | '⚽' | '🎳' | '🎰' = '🎲'): Promise<any> {
    return this.makeRequest('sendDice', {
      chat_id: chatId,
      emoji
    });
  }

  /**
   * 📍 Send location
   */
  async sendLocation(chatId: string, locationOptions: LocationOptions): Promise<any> {
    return this.makeRequest('sendLocation', {
      chat_id: chatId,
      ...locationOptions
    });
  }

  // ====== SPORTS CONTENT SPECIFIC METHODS ======

  /**
   * 🎯 Send betting tips with full interactive features
   */
  async sendBettingTips(options: {
    chat_id: string;
    match: { home: string; away: string; competition: string };
    tips: Array<{ type: string; prediction: string; odds: string; confidence: number; risk: string }>;
    language: 'en' | 'am' | 'sw' | 'fr' | 'ar';
    image_url?: string;
    affiliate_code?: string;
    website_url?: string;
  }): Promise<any> {
    const { match, tips, language, affiliate_code, website_url } = options;

    // Create rich HTML content
    const content = this.formatBettingContent(match, tips, language, affiliate_code, website_url);

    // Create interactive buttons
    const keyboard = this.createBettingKeyboard(match, tips, language, affiliate_code, website_url, options.chat_id);

    if (options.image_url) {
      return this.sendPhoto({
        chat_id: options.chat_id,
        photo: options.image_url,
        caption: content,
        parse_mode: 'HTML',
        reply_markup: keyboard,
        protect_content: true
      });
    } else {
      return this.sendMessage({
        chat_id: options.chat_id,
        text: content,
        parse_mode: 'HTML',
        reply_markup: keyboard,
        protect_content: true
      });
    }
  }

  /**
   * 📰 Send news with rich media and interactions
   */
  async sendNews(options: {
    chat_id: string;
    title: string;
    content: string;
    language: 'en' | 'am' | 'sw' | 'fr' | 'ar';
    images?: string[];
    source_url?: string;
    category: string;
    website_url?: string;
  }): Promise<any> {
    const { title, content, language, images, source_url, category, website_url } = options;

    // Format news content with rich HTML
    const formattedContent = this.formatNewsContent(title, content, language, source_url, category);

    // Create news interaction buttons
    const keyboard = this.createNewsKeyboard(language, source_url, category, website_url, options.chat_id, title);

    if (images && images.length > 1) {
      // Send as media group for multiple images
      const mediaGroup: MediaGroupItem[] = images.slice(0, 4).map((img, index) => ({
        type: 'photo' as const,
        media: img,
        caption: index === 0 ? formattedContent : undefined,
        parse_mode: 'HTML' as const
      }));

      const mediaResult = await this.sendMediaGroup({
        chat_id: options.chat_id,
        media: mediaGroup,
        protect_content: true
      });

      // Send follow-up message with buttons
      await this.sendMessage({
        chat_id: options.chat_id,
        text: this.getInteractionPrompt(language),
        reply_markup: keyboard
      });

      return mediaResult;
    } else if (images && images.length === 1) {
      return this.sendPhoto({
        chat_id: options.chat_id,
        photo: images[0],
        caption: formattedContent,
        parse_mode: 'HTML',
        reply_markup: keyboard,
        protect_content: true
      });
    } else {
      return this.sendMessage({
        chat_id: options.chat_id,
        text: formattedContent,
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
    }
  }

  /**
   * 🔴 Send live match updates with real-time features
   */
  async sendLiveUpdate(options: {
    chat_id: string;
    match: { home: string; away: string; competition: string; status: string; time: string };
    score: { home: number; away: number };
    events: Array<{ type: string; team: string; player?: string; time: string }>;
    language: 'en' | 'am' | 'sw' | 'fr' | 'ar';
    website_url?: string;
  }): Promise<any> {
    const { match, score, events, language, website_url } = options;

    const content = this.formatLiveContent(match, score, events, language);
    const keyboard = this.createLiveKeyboard(match, language, website_url, options.chat_id);

    return this.sendMessage({
      chat_id: options.chat_id,
      text: content,
      parse_mode: 'HTML',
      reply_markup: keyboard,
      message_effect_id: match.status === 'LIVE' ? '5104841245755180586' : undefined // Special effect for live matches
    });
  }

  /**
   * 📊 Send interactive poll for audience engagement
   */
  async sendSportsPoll(options: {
    chat_id: string;
    type: 'prediction' | 'opinion' | 'trivia';
    question: string;
    options: string[];
    language: 'en' | 'am' | 'sw' | 'fr' | 'ar';
    match_info?: { home: string; away: string };
    correct_answer?: number; // For trivia
    website_url?: string;
  }): Promise<any> {
    const { type, question, options: pollOptions, language, match_info, correct_answer, website_url } = options;

    // Send introductory message with context
    const introContent = this.formatPollIntro(type, question, language, match_info);
    const introKeyboard = this.createPollIntroKeyboard(language, website_url, options.chat_id, type);

    await this.sendMessage({
      chat_id: options.chat_id,
      text: introContent,
      parse_mode: 'HTML',
      reply_markup: introKeyboard
    });

    // Send the actual poll
    const pollConfig: PollOptions = {
      question,
      options: pollOptions,
      is_anonymous: type !== 'trivia',
      type: type === 'trivia' ? 'quiz' : 'regular',
      allows_multiple_answers: type === 'opinion',
      correct_option_id: correct_answer,
      explanation: type === 'trivia' ? this.getTriviaExplanation(language) : undefined,
      explanation_parse_mode: 'HTML',
      open_period: type === 'prediction' ? 3600 : 86400 // 1 hour for predictions, 24 hours for others
    };

    return this.sendPoll(options.chat_id, pollConfig);
  }

  // ====== CONTENT FORMATTING METHODS ======

  private formatBettingContent(
    match: { home: string; away: string; competition: string },
    tips: Array<{ type: string; prediction: string; odds: string; confidence: number; risk: string }>,
    language: 'en' | 'am' | 'sw' | 'fr' | 'ar',
    affiliateCode?: string,
    websiteUrl?: string
  ): string {
    const translations = {
      en: {
        title: '🎯 BETTING TIPS',
        tips: '💰 TOP BETTING TIPS:',
        confidence: 'Confidence',
        odds: 'Odds', 
        risk: 'Risk',
        warning: '⚠️ Bet responsibly. Only stake what you can afford to lose.',
        ageWarning: '🔞 18+ only. Gambling can be addictive.',
        affiliate: '🔗 Use code',
        website: '🌐 More tips at'
      },
      am: {
        title: '🎯 የውርርድ ምክሮች',
        tips: '💰 ተመራጭ ውርርድ ምክሮች:',
        confidence: 'እምነት',
        odds: 'ዕድል',
        risk: 'አደጋ',
        warning: '⚠️ በመልከም ሁኔታ ውርርድ ያድርጉ። መጥፋት የሚችሉትን ብቻ ይወርርዱ።',
        ageWarning: '🔞 ከ18 አመት በላይ ብቻ። ውርርድ ሱስ ሊፈጥር ይችላል።',
        affiliate: '🔗 ኮድ ይጠቀሙ',
        website: '🌐 ተጨማሪ ምክሮች'
      },
      sw: {
        title: '🎯 MAPENDEKEZO YA KAMARI',
        tips: '💰 MAPENDEKEZO BORA YA KAMARI:',
        confidence: 'Ujasiri',
        odds: 'Uwezekano',
        risk: 'Hatari',
        warning: '⚠️ Weka kamari kwa busara. Tia tu kile unachoweza kupoteza.',
        ageWarning: '🔞 Miaka 18+ tu. Kamari inaweza kusababisha ulezi.',
        affiliate: '🔗 Tumia msimbo',
        website: '🌐 Mapendekezo zaidi'
      },
      fr: {
        title: '🎯 CONSEILS DE PARIS',
        tips: '💰 MEILLEURS CONSEILS DE PARIS:',
        confidence: 'Confiance',
        odds: 'Cotes',
        risk: 'Risque',
        warning: '⚠️ Pariez de manière responsable. Ne pariez que ce que vous pouvez vous permettre de perdre.',
        ageWarning: '🔞 18+ seulement. Le jeu peut créer une dépendance.',
        affiliate: '🔗 Utilisez le code',
        website: '🌐 Plus de conseils sur'
      },
      ar: {
        title: '🎯 نصائح الرهان',
        tips: '💰 أفضل نصائح الرهان:',
        confidence: 'الثقة',
        odds: 'الاحتمالات',
        risk: 'المخاطر',
        warning: '⚠️ راهن بمسؤولية. لا تراهن إلا بما يمكنك تحمل خسارته.',
        ageWarning: '🔞 +18 فقط. القمار يمكن أن يكون إدماناً.',
        affiliate: '🔗 استخدم الكود',
        website: '🌐 المزيد من النصائح على'
      }
    };

    const t = translations[language];
    
    let content = `<b>${t.title}: ${match.home} vs ${match.away}</b>\n\n`;
    content += `🏆 <i>${match.competition}</i>\n\n`;
    content += `${t.tips}\n\n`;

    tips.forEach((tip, index) => {
      const emoji = index === 0 ? '🏆' : index === 1 ? '⭐' : '💎';
      const riskEmoji = tip.risk === 'LOW' ? '🟢' : tip.risk === 'MEDIUM' ? '🟡' : '🔴';
      
      content += `${emoji} <b>${tip.prediction}</b>\n`;
      content += `💰 ${t.odds}: ${tip.odds} | ${t.confidence}: ${tip.confidence}% ${riskEmoji}\n\n`;
    });

    if (affiliateCode) {
      content += `${t.affiliate}: <code>${affiliateCode}</code>\n\n`;
    }

    if (websiteUrl) {
      content += `${t.website}: ${websiteUrl}\n\n`;
    }

    content += `${t.warning}\n${t.ageWarning}`;

    return content;
  }

  private formatNewsContent(
    title: string,
    content: string,
    language: 'en' | 'am' | 'sw' | 'fr' | 'ar',
    sourceUrl?: string,
    category?: string
  ): string {
    const categoryEmojis: Record<string, string> = {
      'transfer': '🔄',
      'match': '⚽',
      'injury': '🏥',
      'general': '📰',
      'breaking': '🚨'
    };

    const emoji = categoryEmojis[category || 'general'] || '📰';
    
    let formattedContent = `${emoji} <b>${title}</b>\n\n`;
    formattedContent += `${content}\n\n`;
    
    if (sourceUrl) {
      formattedContent += `📖 <a href="${sourceUrl}">Read full article</a>`;
    }

    return formattedContent;
  }

  private formatLiveContent(
    match: { home: string; away: string; competition: string; status: string; time: string },
    score: { home: number; away: number },
    events: Array<{ type: string; team: string; player?: string; time: string }>,
    language: 'en' | 'am' | 'sw' | 'fr' | 'ar'
  ): string {
    let content = `🔴 <b>LIVE: ${match.home} ${score.home} - ${score.away} ${match.away}</b>\n\n`;
    content += `🏆 ${match.competition}\n`;
    content += `⏱️ ${match.time}'\n\n`;

    if (events.length > 0) {
      content += `📝 <b>Recent Events:</b>\n`;
      events.slice(-3).forEach(event => {
        const eventEmoji = event.type === 'goal' ? '⚽' : event.type === 'card' ? '🟨' : '📝';
        content += `${eventEmoji} ${event.time}' ${event.team}${event.player ? ` - ${event.player}` : ''}\n`;
      });
    }

    return content;
  }

  // ====== KEYBOARD CREATION METHODS ======

  private createBettingKeyboard(
    match: { home: string; away: string; competition: string },
    tips: Array<{ type: string; prediction: string; odds: string; confidence: number; risk: string }>,
    language: 'en' | 'am' | 'sw' | 'fr' | 'ar',
    affiliateCode?: string,
    websiteUrl?: string,
    channelId?: string
  ): InlineKeyboardMarkup {
    // Use the enhanced button link manager for proper button creation
    const enhancedButtons = buttonLinkManager.createBettingButtons({
      match: { home: match.home, away: match.away, competition: match.competition },
      tips: tips.map(tip => ({ 
        type: tip.type, 
        prediction: tip.prediction, 
        odds: tip.odds, 
        confidence: tip.confidence 
      })),
      language,
      channelId
    });

    // Convert to Telegram format
    const keyboard = buttonLinkManager.convertToTelegramFormat(enhancedButtons);

    return { inline_keyboard: keyboard };
  }

  private createNewsKeyboard(
    language: 'en' | 'am' | 'sw' | 'fr' | 'ar',
    sourceUrl?: string,
    category?: string,
    websiteUrl?: string,
    channelId?: string,
    title?: string
  ): InlineKeyboardMarkup {
    // Use the enhanced button link manager for proper button creation
    const enhancedButtons = buttonLinkManager.createNewsButtons({
      title: title || 'News Article',
      category: category || 'general',
      sourceUrl,
      language,
      channelId
    });

    // Convert to Telegram format
    const keyboard = buttonLinkManager.convertToTelegramFormat(enhancedButtons);

    return { inline_keyboard: keyboard };
  }

  private createLiveKeyboard(
    match: { home: string; away: string; competition: string; status: string },
    language: 'en' | 'am' | 'sw' | 'fr' | 'ar',
    websiteUrl?: string,
    channelId?: string
  ): InlineKeyboardMarkup {
    // Use the enhanced button link manager for proper button creation
    const enhancedButtons = buttonLinkManager.createLiveButtons({
      match: { home: match.home, away: match.away, competition: match.competition, status: match.status },
      language,
      channelId
    });

    // Convert to Telegram format
    const keyboard = buttonLinkManager.convertToTelegramFormat(enhancedButtons);

    return { inline_keyboard: keyboard };
  }

  private createPollIntroKeyboard(
    language: 'en' | 'am' | 'sw' | 'fr' | 'ar',
    websiteUrl?: string,
    channelId?: string,
    pollType: 'prediction' | 'opinion' | 'trivia' = 'prediction'
  ): InlineKeyboardMarkup {
    // Use the enhanced button link manager for proper button creation
    const enhancedButtons = buttonLinkManager.createPollButtons({
      pollType,
      language,
      channelId
    });

    // Convert to Telegram format
    const keyboard = buttonLinkManager.convertToTelegramFormat(enhancedButtons);

    return { inline_keyboard: keyboard };
  }

  // ====== HELPER METHODS ======

  private formatPollIntro(
    type: 'prediction' | 'opinion' | 'trivia',
    question: string,
    language: 'en' | 'am' | 'sw' | 'fr' | 'ar',
    matchInfo?: { home: string; away: string }
  ): string {
    const emojis = {
      prediction: '🔮',
      opinion: '💭',
      trivia: '🧠'
    };

    let content = `${emojis[type]} <b>${question}</b>\n\n`;
    
    if (matchInfo) {
      content += `⚽ <i>${matchInfo.home} vs ${matchInfo.away}</i>\n\n`;
    }

    const instructions = {
      en: 'Vote in the poll below and see what others think! 👇',
      am: 'በሚከተለው ምርጫ ድምጽ ይስጡ እና ሌሎች ምን እንደሚያስቡ ይመልከቱ! 👇',
      sw: 'Piga kura katika uchaguzi hapa chini na uone wengine wanafikiri nini! 👇',
      fr: 'Votez dans le sondage ci-dessous et voyez ce que pensent les autres ! 👇',
      ar: 'صوت في الاستطلاع أدناه وانظر ما يعتقده الآخرون! 👇'
    };

    content += instructions[language];

    return content;
  }

  private getTriviaExplanation(language: 'en' | 'am' | 'sw' | 'fr' | 'ar'): string {
    const explanations = {
      en: '🧠 Great job! Keep testing your football knowledge with our daily trivia.',
      am: '🧠 በጣም ጥሩ! በየቀኑ በሚኖረው ጥያቄ የእግር ኳስ እውቀትዎን መሞከር ይቀጥሉ።',
      sw: '🧠 Kazi nzuri! Endelea kujaribu ujuzi wako wa mpira kwa maswali yetu ya kila siku.',
      fr: '🧠 Excellent travail ! Continuez à tester vos connaissances footballistiques avec nos quiz quotidiens.',
      ar: '🧠 عمل رائع! استمر في اختبار معرفتك بكرة القدم مع أسئلتنا اليومية.'
    };

    return explanations[language];
  }

  private getInteractionPrompt(language: 'en' | 'am' | 'sw' | 'fr' | 'ar'): string {
    const prompts = {
      en: '👆 What do you think about this news? React and share your thoughts!',
      am: '👆 ስለዚህ ዜና ምን ያስባሉ? ምላሽ ይስጡ እና ሃሳብዎን ያካፍሉ!',
      sw: '👆 Unafikiri nini kuhusu habari hii? Jibu na shiriki mawazo yako!',
      fr: '👆 Que pensez-vous de cette actualité ? Réagissez et partagez vos réflexions !',
      ar: '👆 ما رأيك في هذا الخبر؟ تفاعل وشارك أفكارك!'
    };

    return prompts[language];
  }

  // ====== UTILITY METHODS ======

  private async makeRequest(method: string, data: any): Promise<any> {
    try {
      const url = `${this.baseURL}/${method}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (!result.ok) {
        console.error(`❌ Telegram API Error (${method}):`, result);
        throw new Error(`Telegram API Error: ${result.description}`);
      }

      return result.result;
    } catch (error) {
      console.error(`❌ Error calling Telegram API (${method}):`, error);
      throw error;
    }
  }

  /**
   * 📊 Track user interactions for analytics
   */
  async trackInteraction(options: {
    user_id: string;
    channel_id: string;
    interaction_type: string;
    content_id: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await supabase
        .from('user_interactions')
        .insert({
          user_id: options.user_id,
          channel_id: options.channel_id,
          interaction_type: options.interaction_type,
          content_id: options.content_id,
          metadata: options.metadata || {},
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('❌ Error tracking interaction:', error);
    }
  }

  /**
   * 🔄 Update message with new content/buttons
   */
  async editMessage(options: {
    chat_id: string;
    message_id: number;
    text?: string;
    caption?: string;
    parse_mode?: 'HTML' | 'MarkdownV2';
    reply_markup?: InlineKeyboardMarkup;
  }): Promise<any> {
    const method = options.text ? 'editMessageText' : 'editMessageCaption';
    return this.makeRequest(method, options);
  }

  /**
   * 🗑️ Delete message
   */
  async deleteMessage(chatId: string, messageId: number): Promise<any> {
    return this.makeRequest('deleteMessage', {
      chat_id: chatId,
      message_id: messageId
    });
  }
}

// Export singleton instance
export const enhancedTelegramAPI = new EnhancedTelegramAPI();