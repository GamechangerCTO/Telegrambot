/**
 * 📱 TELEGRAM DISTRIBUTOR - Telegram Distribution and Messaging Logic
 * Handles all Telegram sending logic, keyboard creation, and channel management
 */

import { createHash } from 'crypto';
import { supabase } from '@/lib/supabase';
import { telegramSender, type TelegramSendOptions } from '@/lib/content/telegram-sender';
import { contentFormatter } from './content-formatter';
import { aiImageGenerator } from '@/lib/content/ai-image-generator';
import { Language } from './channel-resolver';
import { ContentConfigUtils } from './content-config';
import { contentSpamPreventer } from '@/lib/utils/content-spam-preventer';
import { enhancedTelegramAPI, EnhancedTelegramAPI } from '../../telegram/enhanced-telegram-api';

export interface TelegramDistributionOptions {
  content: any;
  language: Language;
  mode: string;
  targetChannels?: string[];
  includeImages?: boolean;
  manualExecution?: boolean;
  isAutomationExecution?: boolean;
}

export interface TelegramDistributionResult {
  success: boolean;
  channels: number;
  results: Array<{
    channelName: string;
    success: boolean;
    error?: string;
    messageId?: number;
  }>;
  error?: string;
}

export class TelegramDistributor {
  /**
   * Main method to send content to Telegram channels
   */
  async sendContentToTelegram(options: TelegramDistributionOptions): Promise<TelegramDistributionResult> {
    const { content, language, mode, targetChannels, includeImages = true, manualExecution = false, isAutomationExecution = false } = options;
    
    try {
      console.log('📤 Starting Telegram distribution...');
      
      // Get channels to send to
      const channels = await this.getChannelsForDistribution(targetChannels, language);
      
      if (channels.length === 0) {
        console.log(`📭 No channels found for language: ${language}`);
        return {
          success: false,
          channels: 0,
          results: [],
          error: `No active channels available for language: ${language}`
        };
      }

      console.log(`📊 Found ${channels.length} active channels for language ${language}:`);
      channels.forEach(channel => {
        console.log(`  - ${channel.name} (${channel.language})`);
      });

      // 🛡️ ANTI-SPAM CHECK - Check each channel before sending
      const allowedChannels = [];
      for (const channel of channels) {
        const canSend = await contentSpamPreventer.canSendContent(
          content.content_type || 'unknown',
          channel.id,
          'default',
          manualExecution,
          isAutomationExecution
        );
        
        if (canSend.allowed) {
          allowedChannels.push(channel);
        } else {
          console.log(`🚫 SPAM PREVENTION: Blocked sending to ${channel.name}: ${canSend.reason}`);
        }
      }

      if (allowedChannels.length === 0) {
        console.log('🛡️ SPAM PREVENTION: All channels blocked by rate limiting');
        return {
          success: false,
          channels: 0,
          results: [],
          error: 'All channels blocked by spam prevention (rate limits exceeded)'
        };
      }

      console.log(`✅ Spam check passed: ${allowedChannels.length}/${channels.length} channels allowed`);

      // Prepare content for sending
      const messageContent = contentFormatter.formatForTelegram(content, mode);
      const keyboard = this.createTelegramKeyboard(content, mode);
      
      // Handle image generation/retrieval
      let imageUrl = await this.handleImageGeneration(content, language, includeImages);

      // 🎛️ Smart Telegram settings based on content metadata
      const telegramSettings = this.extractTelegramSettings(content);
      
      console.log(`⏰ Distribution - Enhanced settings:`, telegramSettings);

      // Send content to allowed channels only
      const distributionResult = await this.distributeToChannels(
        allowedChannels,
        messageContent,
        imageUrl,
        keyboard,
        content,
        telegramSettings,  // Pass enhanced settings to distribution
        options.manualExecution || false,  // Pass manual execution flag
        options.isAutomationExecution || false  // Pass automation execution flag
      );

      // 📊 TRACK SENT MESSAGES - Record successful sends for spam prevention
      if (distributionResult.success) {
        for (const result of distributionResult.results) {
          if (result.success) {
            const channel = allowedChannels.find(c => c.name === result.channelName);
            if (channel) {
              await contentSpamPreventer.recordSentMessage(
                channel.id,
                content.content_type || 'unknown',
                result.messageId?.toString() || 'unknown'
              );
            }
          }
        }
      }

      // Cleanup generated image after sending
      if (content._generatedImage && distributionResult.success) {
        await this.cleanupGeneratedImage(content._generatedImage);
      }

      return distributionResult;

    } catch (error) {
      console.error('🚨 Telegram distribution error:', error);
      return {
        success: false,
        channels: 0,
        results: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get channels for distribution
   */
  private async getChannelsForDistribution(targetChannels?: string[], language?: Language): Promise<Array<{
    id: string;
    name: string;
    telegram_channel_id: string;
    language: Language;
    bot_token: string;
  }>> {
    try {
      let channelQuery = supabase
        .from('channels')
        .select(`
          id,
          name,
          telegram_channel_id,
          language,
          is_active,
          content_types,
          bots!inner(
            id,
            name,
            telegram_token_encrypted,
            is_active
          )
        `)
        .eq('is_active', true)
        .eq('bots.is_active', true);
      
      // Add filter based on target channels or language
      if (targetChannels && targetChannels.length > 0) {
        console.log(`🎯 Using target channels: ${targetChannels.join(', ')}`);
        channelQuery = channelQuery.in('id', targetChannels);
      } else if (language) {
        console.log(`🌐 Using language filter: ${language}`);
        channelQuery = channelQuery.eq('language', language);
      }
      
      const { data: channels, error: channelsError } = await channelQuery;

      if (channelsError) {
        console.error('❌ Error fetching channels:', channelsError);
        return [];
      }

      return (channels || []).map((channel: any) => ({
        id: channel.id,
        name: channel.name,
        telegram_channel_id: channel.telegram_channel_id,
        language: channel.language as Language,
        bot_token: this.decodeTokenIfNeeded(channel.bots.telegram_token_encrypted, channel.name)
      }));

    } catch (error) {
      console.error('❌ Error in getChannelsForDistribution:', error);
      return [];
    }
  }

  /**
   * Handle image generation or retrieval
   */
  private async handleImageGeneration(content: any, language: Language, includeImages: boolean): Promise<string | undefined> {
    if (!includeImages) return undefined;
    
    // Check content type to determine if images should be generated
    const contentType = content.content_type || content.content_items?.[0]?.type;
    const shouldGenerateImage = ContentConfigUtils.shouldGenerateImage(contentType);
    
    if (!shouldGenerateImage) {
      console.log(`🚫 Image generation disabled for content type: ${contentType}`);
      return undefined;
    }

    // Check for existing image URLs
    let imageUrl = content.imageUrl;
    
    if (!imageUrl && content.content_items && content.content_items.length > 0) {
      const firstItem = content.content_items[0];
      
      // Search for images in various places
      if (firstItem.metadata?.imageUrl) {
        imageUrl = firstItem.metadata.imageUrl;
        console.log('📷 Found existing image in metadata:', imageUrl);
      } else if (firstItem.imageUrl) {
        imageUrl = firstItem.imageUrl;
        console.log('📷 Found existing image in content item:', imageUrl);
      } else if (content._generatedImage) {
        imageUrl = content._generatedImage.url;
        console.log('📷 Found existing generated image:', imageUrl);
      }
    }
    
    // Generate new image if needed and allowed
    if (!imageUrl && content.content_items && content.content_items.length > 0) {
      const firstItem = content.content_items[0];
      console.log('🎨 No existing image found, generating new one...');
      
      try {
        const contentText = firstItem.content || '';
        const titleText = firstItem.title || '';
        const combinedText = contentText || titleText || 'Football content';
        
        const teamsFromContent = contentFormatter.extractTeamsFromContent(combinedText);
        const competition = contentFormatter.extractCompetitionFromContent(combinedText);
        
        // Use intelligent image generation
        const generatedImage = await aiImageGenerator.generateImageFromContent({
          content: combinedText,
          title: titleText || undefined,
          contentType: content.content_type as 'news' | 'betting' | 'analysis' | 'live' | 'poll' | 'daily_summary' | 'weekly_summary',
          language: language,
          teams: teamsFromContent.length > 0 ? teamsFromContent : undefined,
          competition: competition || undefined
        });
        
        if (generatedImage) {
          imageUrl = generatedImage.url;
          content._generatedImage = generatedImage;
          console.log('🎨 AI Image generated successfully');
        } else {
          // Fallback to stock image
          imageUrl = aiImageGenerator.getFallbackImage(content.content_type);
          console.log('📷 Using fallback image');
        }
      } catch (error) {
        console.error('❌ Image generation failed:', error);
        imageUrl = aiImageGenerator.getFallbackImage(content.content_type);
      }
    }

    return imageUrl;
  }

  /**
   * Distribute content to multiple channels with enhanced Telegram settings
   */
  private async distributeToChannels(
    channels: Array<{
      id: string;
      name: string;
      telegram_channel_id: string;
      language: Language;
      bot_token: string;
    }>,
    messageContent: string,
    imageUrl: string | undefined,
    keyboard: any,
    content: any,
    telegramSettings: any,
    manualExecution: boolean = false,
    isAutomationExecution: boolean = false
  ): Promise<TelegramDistributionResult> {
    const allResults: Array<{
      channelName: string;
      success: boolean;
      error?: string;
      messageId?: number;
    }> = [];

    let totalSuccess = 0;
    let totalFailed = 0;

    // Check if content is a poll
    const isPoll = content.content_items?.[0]?.type === 'poll' && content.content_items[0].poll;
    
    if (isPoll) {
      console.log('🗳️ Detected poll content - sending as Telegram poll...');
      const pollResults = await this.sendPollToChannels(channels, content.content_items[0].poll);
      return {
        success: pollResults.filter(r => r.success).length > 0,
        channels: channels.length,
        results: pollResults
      };
    } else {
      // Enhanced content sending with interactive features
      console.log('🚀 Using Enhanced Telegram API for interactive content...');
      
      const results = [];
      let successCount = 0;
      let failedCount = 0;

      for (const channel of channels) {
        try {
          // Create Enhanced API instance with channel's bot token
          const enhancedAPI = new EnhancedTelegramAPI(channel.bot_token);
          
          // Load channel-specific button configuration
          const buttonConfig = await this.loadChannelButtonConfig(channel.id);
          console.log(`🔗 Loaded button config for ${channel.name}:`, buttonConfig ? 'Custom' : 'Default');
          
          let sendResult;
          
          // Determine content type and send with appropriate enhanced method
          const contentType = content.content_type || content.type || 'unknown';
          
          console.log(`📤 Sending ${contentType} to ${channel.name} (${channel.language}) with enhanced features...`);
          
          // Apply channel-specific button configuration
          this.applyChannelButtonConfig(enhancedAPI, buttonConfig, channel.id);
          
          switch (contentType) {
            case 'betting':
              sendResult = await this.sendBettingContent(enhancedAPI, channel, content, imageUrl, buttonConfig);
              break;
              
            case 'news':
              sendResult = await this.sendNewsContent(enhancedAPI, channel, content, imageUrl, buttonConfig);
              break;
              
            case 'analysis':
              sendResult = await this.sendAnalysisContent(enhancedAPI, channel, content, imageUrl, buttonConfig);
              break;
              
            case 'live_updates':
              sendResult = await this.sendLiveUpdatesContent(enhancedAPI, channel, content, imageUrl, buttonConfig);
              break;
              
            case 'daily_summary':
              sendResult = await this.sendDailySummaryContent(enhancedAPI, channel, content, imageUrl, buttonConfig);
              break;
              
            default:
              // Default enhanced content with interactive buttons
              sendResult = await this.sendGenericEnhancedContent(enhancedAPI, channel, content, messageContent, imageUrl, buttonConfig);
          }
          
          if (sendResult && sendResult.result) {
            successCount++;
            results.push({
              channelName: channel.name,
              success: true,
              messageId: sendResult.result.message_id,
              channelId: channel.telegram_channel_id
            });
            console.log(`✅ Enhanced message sent successfully to ${channel.name}`);
          } else {
            throw new Error('No result returned from Enhanced API');
          }
          
        } catch (error) {
          console.error(`❌ Enhanced sending failed for ${channel.name}:`, error);
          failedCount++;
          results.push({
            channelName: channel.name,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            channelId: channel.telegram_channel_id
          });
        }
      }

      console.log(`✅ Enhanced distribution completed: ${successCount}/${successCount + failedCount} channels`);
      
      return {
        success: successCount > 0,
        channels: successCount + failedCount,
        results
      };
    }
  }

  /**
   * Send polls to channels
   */
  async sendPollToChannels(channels: Array<{
    name: string;
    telegram_channel_id: string;
    bot_token: string;
  }>, pollData: any): Promise<Array<{
    channelName: string;
    success: boolean;
    error?: string;
    messageId?: number;
  }>> {
    const pollResults = [];
    
    for (const channel of channels) {
      try {
        const result = await telegramSender.sendMessage({
          botToken: channel.bot_token,
          channelId: channel.telegram_channel_id,
          content: '', // לא נדרש לסקר
          poll: {
            question: pollData.question,
            options: pollData.options,
            isAnonymous: pollData.isAnonymous !== false,
            type: pollData.type === 'quiz' ? 'quiz' : 'regular',
            allowsMultipleAnswers: pollData.allowsMultipleAnswers === true,
            correctOptionId: pollData.correctOptionId,
            explanation: pollData.explanation,
            openPeriod: pollData.openPeriod,
            closeDate: pollData.closeDate
          }
        });
        
        pollResults.push({
          channelName: channel.name,
          success: result.success,
          error: result.success ? undefined : result.error,
          messageId: result.messageId
        });
        
        console.log(`✅ Poll sent to ${channel.name}: ${result.success ? 'Success' : 'Failed'}`);
      } catch (error) {
        console.error(`❌ Failed to send poll to ${channel.name}:`, error);
        pollResults.push({
          channelName: channel.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return pollResults;
  }

  /**
   * Create enhanced Telegram keyboard for content with all button types
   */
  createTelegramKeyboard(content: any, mode: string): Array<Array<{
    text: string;
    url?: string;
    callback_data?: string;
    copy_text?: { text: string };
    web_app?: { url: string };
    switch_inline_query?: string;
    switch_inline_query_current_chat?: string;
  }>> | undefined {
    const keyboard: Array<Array<{
      text: string;
      url?: string;
      callback_data?: string;
      copy_text?: { text: string };
      web_app?: { url: string };
      switch_inline_query?: string;
      switch_inline_query_current_chat?: string;
    }>> = [];

    // Get language from content for all buttons
    const contentLanguage: Language = (content.language || content.content_items?.[0]?.language || 'en') as Language;

    // Buttons for different content types
    if (content.type === 'betting' && content.metadata?.bookmakerUrl) {
      // Button text in the correct language - ALL 5 LANGUAGES
      const placeBetText = {
        en: '🎯 Place Bet',
        am: '🎯 ውርርድ ያድርጉ',
        sw: '🎯 Weka Dau',
        fr: '🎯 Placer un Pari',
        ar: '🎯 ضع رهان'
      };

      keyboard.push([{
        text: placeBetText[contentLanguage as keyof typeof placeBetText] || placeBetText.en,
        url: content.metadata.bookmakerUrl
      }]);
    }

    if (content.type === 'coupons' && content.metadata?.couponUrl) {
      // First row: Main coupon button
      const getCouponText = {
        en: '🎁 Get Coupon',
        am: '🎁 ኩፖን ያግኙ',
        sw: '🎁 Pata Kuponi',
        fr: '🎁 Obtenir le Coupon',
        ar: '🎁 احصل على الكوبون'
      };

      keyboard.push([{
        text: getCouponText[contentLanguage as keyof typeof getCouponText] || getCouponText.en,
        url: content.metadata.couponUrl
      }]);

      // Second row: Copy code button (if coupon code exists)
      if (content.metadata?.couponCode) {
        const copyCodeText = {
          en: '📋 Copy Code',
          am: '📋 ኮድ ቅዳ',
          sw: '📋 Nakili Msimbo',
          fr: '📋 Copier le Code',
          ar: '📋 انسخ الكود'
        };

        keyboard.push([{
          text: copyCodeText[contentLanguage as keyof typeof copyCodeText] || copyCodeText.en,
          copy_text: { text: content.metadata.couponCode }
        }]);
      }

      // Third row: Share button for viral marketing
      const shareText = {
        en: '📤 Share Deal',
        am: '📤 ውል አጋራ',
        sw: '📤 Shiriki Ofa',
        fr: '📤 Partager l\'Offre',
        ar: '📤 شارك العرض'
      };

      const shareMessage = {
        en: `🎁 Amazing deal: ${content.title || 'Special Offer'} - `,
        am: `🎁 እውነተኛ ስምምነት: ${content.title || 'ልዩ ድረስ'} - `,
        sw: `🎁 Ofa kubwa: ${content.title || 'Ofa Maalum'} - `,
        fr: `🎁 Offre incroyable: ${content.title || 'Offre Spéciale'} - `,
        ar: `🎁 عرض رائع: ${content.title || 'عرض خاص'} - `
      };

      keyboard.push([{
        text: shareText[contentLanguage as keyof typeof shareText] || shareText.en,
        switch_inline_query: shareMessage[contentLanguage as keyof typeof shareMessage] || shareMessage.en
      }]);
    }

    if (content.type === 'analysis' && content.metadata?.detailsUrl) {
      // Analysis button text in all languages
      const fullAnalysisText = {
        en: '📊 Full Analysis',
        am: '📊 ሙሉ ትንታኔ',
        sw: '📊 Uchambuzi Kamili',
        fr: '📊 Analyse Complète',
        ar: '📊 التحليل الكامل'
      };

      keyboard.push([{
        text: fullAnalysisText[contentLanguage as keyof typeof fullAnalysisText] || fullAnalysisText.en,
        url: content.metadata.detailsUrl
      }]);
    }

    // Share button for viral content
    if (mode === 'share' && content.type === 'polls') {
      const shareText = {
        en: '📤 Share Poll',
        am: '📤 ስርዓተ ጥያቄ አጋራ',
        sw: '📤 Shiriki Kura',
        fr: '📤 Partager le Sondage',
        ar: '📤 شارك الاستطلاع'
      };

      keyboard.push([{
        text: shareText[contentLanguage as keyof typeof shareText] || shareText.en,
        callback_data: `share_poll_${content.content_items?.[0]?.id}`
      }]);
    }

    return keyboard.length > 0 ? keyboard : undefined;
  }

  /**
   * Decode bot token if needed
   */
  private decodeTokenIfNeeded(encryptedToken: string, channelName: string): string {
    let botToken = encryptedToken;
    
    // Check if token is already in correct format
    if (!botToken.includes(':') || botToken.length < 20) {
      // Try to decode from base64
      try {
        const decoded = Buffer.from(botToken, 'base64').toString('utf-8');
        if (decoded.includes(':') && decoded.length > 20) {
          botToken = decoded;
          console.log(`🔓 Decoded base64 token for channel: ${channelName}`);
        }
      } catch (decodeError) {
        console.log(`⚠️ Failed to decode token for channel: ${channelName}, using as-is`);
      }
    } else {
      console.log(`✅ Token for channel: ${channelName} already in correct format`);
    }

    return botToken;
  }

  /**
   * Cleanup generated image after successful send
   */
  private async cleanupGeneratedImage(generatedImage: any): Promise<void> {
    try {
      await aiImageGenerator.cleanupImage(generatedImage);
      console.log('🗑️ Image cleanup completed after successful telegram send');
    } catch (cleanupError) {
      console.error('⚠️ Image cleanup failed:', cleanupError);
    }
  }

  /**
   * Send single message to specific channel
   */
  async sendToSingleChannel(
    channelId: string,
    content: any,
    language: Language,
    mode: string
  ): Promise<TelegramDistributionResult> {
    return await this.sendContentToTelegram({
      content,
      language,
      mode,
      targetChannels: [channelId]
    });
  }

  /**
   * Send content to all channels of a specific language
   */
  async sendToLanguageChannels(
    language: Language,
    content: any,
    mode: string
  ): Promise<TelegramDistributionResult> {
    return await this.sendContentToTelegram({
      content,
      language,
      mode
    });
  }

  /**
   * Broadcast content to all active channels
   */
  async broadcastToAllChannels(
    content: any,
    mode: string
  ): Promise<TelegramDistributionResult[]> {
    const results: TelegramDistributionResult[] = [];
    const languages: Language[] = ['en', 'am', 'sw'];
    
    for (const language of languages) {
      try {
        const result = await this.sendContentToTelegram({
          content,
          language,
          mode
        });
        results.push(result);
      } catch (error) {
        console.error(`❌ Failed to broadcast to ${language} channels:`, error);
        results.push({
          success: false,
          channels: 0,
          results: [],
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return results;
  }

  /**
   * Get channel statistics
   */
  async getChannelStatistics(): Promise<{
    total_channels: number;
    active_channels: number;
    channels_by_language: Record<Language, number>;
    channels_with_bots: number;
  }> {
    try {
      const { data: channels, error } = await supabase
        .from('channels')
        .select(`
          id,
          language,
          is_active,
          bots!inner(
            id,
            is_active
          )
        `);

      if (error) {
        console.error('❌ Error fetching channel statistics:', error);
        return {
          total_channels: 0,
          active_channels: 0,
          channels_by_language: { en: 0, am: 0, sw: 0, fr: 0, ar: 0 },
          channels_with_bots: 0
        };
      }

             const stats = {
         total_channels: channels.length,
         active_channels: channels.filter((ch: any) => ch.is_active).length,
         channels_by_language: { en: 0, am: 0, sw: 0, fr: 0, ar: 0 } as Record<Language, number>,
         channels_with_bots: channels.filter((ch: any) => ch.is_active && (ch as any).bots.is_active).length
       };

       // Count channels by language
       channels.forEach((channel: any) => {
         if (channel.is_active) {
           stats.channels_by_language[channel.language as Language]++;
         }
       });

      return stats;
    } catch (error) {
      console.error('❌ Error in getChannelStatistics:', error);
      return {
        total_channels: 0,
        active_channels: 0,
        channels_by_language: { en: 0, am: 0, sw: 0, fr: 0, ar: 0 },
        channels_with_bots: 0
      };
    }
  }

  /**
   * 🎛️ Extract enhanced Telegram settings from content metadata
   */
  private extractTelegramSettings(content: any): {
    disableNotification: boolean;
    protectContent: boolean;
    hasSpoiler: boolean;
    priority: string;
  } {
    // Default settings
    const currentHour = new Date().getUTCHours();
    const isNightTime = currentHour >= 23 || currentHour < 6;
    
    const defaults = {
      disableNotification: isNightTime,  // Default night mode
      protectContent: false,
      hasSpoiler: false,
      priority: 'normal'
    };

    // Check if content has enhanced metadata
    const metadata = content.metadata || content.content_items?.[0]?.metadata;
    const telegramEnhancements = metadata?.telegramEnhancements;
    
    if (!telegramEnhancements) {
      console.log('📋 Using default Telegram settings');
      return defaults;
    }

    console.log('🎛️ Found enhanced Telegram metadata:', telegramEnhancements);

    // Extract settings from content metadata
    return {
      disableNotification: telegramEnhancements.disableNotification !== undefined 
        ? telegramEnhancements.disableNotification 
        : defaults.disableNotification,
      protectContent: telegramEnhancements.protectContent || false,
      hasSpoiler: telegramEnhancements.spoilerImage || false,
      priority: telegramEnhancements.priority || 'normal'
    };
  }

  // ====== ENHANCED CONTENT SENDING METHODS ======

  /**
   * 🎯 Send betting content with interactive features
   */
  private async sendBettingContent(enhancedAPI: EnhancedTelegramAPI, channel: any, content: any, imageUrl?: string, buttonConfig?: any) {
    const bettingData = this.extractBettingData(content);
    
    return await enhancedAPI.sendBettingTips({
      chat_id: channel.telegram_channel_id,
      match: bettingData.match,
      tips: bettingData.tips,
      language: channel.language,
      image_url: imageUrl,
      website_url: process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://your-sports-site.com'
    });
  }

  /**
   * 📰 Send news content with interactive features
   */
  private async sendNewsContent(enhancedAPI: EnhancedTelegramAPI, channel: any, content: any, imageUrl?: string, buttonConfig?: any) {
    const newsData = this.extractNewsData(content);
    
    return await enhancedAPI.sendNews({
      chat_id: channel.telegram_channel_id,
      title: newsData.title,
      content: newsData.content,
      language: channel.language,
      images: imageUrl ? [imageUrl] : undefined,
      source_url: newsData.sourceUrl,
      category: newsData.category || 'general',
      website_url: process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://your-sports-site.com'
    });
  }

  /**
   * 📊 Send analysis content with interactive features
   */
  private async sendAnalysisContent(enhancedAPI: EnhancedTelegramAPI, channel: any, content: any, imageUrl?: string, buttonConfig?: any) {
    const analysisData = this.extractAnalysisData(content);
    
    // For analysis, we'll use the betting tips format with analysis-specific data
    return await enhancedAPI.sendBettingTips({
      chat_id: channel.telegram_channel_id,
      match: analysisData.match,
      tips: analysisData.insights,
      language: channel.language,
      image_url: imageUrl,
      website_url: process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://your-sports-site.com'
    });
  }

  /**
   * 🔴 Send live updates content with interactive features
   */
  private async sendLiveUpdatesContent(enhancedAPI: EnhancedTelegramAPI, channel: any, content: any, imageUrl?: string, buttonConfig?: any) {
    const liveData = this.extractLiveData(content);
    
    return await enhancedAPI.sendLiveUpdate({
      chat_id: channel.telegram_channel_id,
      match: liveData.match,
      score: liveData.score,
      events: liveData.events,
      language: channel.language,
      website_url: process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://your-sports-site.com'
    });
  }

  /**
   * 📋 Send daily summary content with interactive features
   */
  private async sendDailySummaryContent(enhancedAPI: EnhancedTelegramAPI, channel: any, content: any, imageUrl?: string, buttonConfig?: any) {
    // For daily summary, we'll use news format with special category 'summary'
    // This tells the Enhanced API to use the pre-formatted content as-is
    const summaryData = this.extractSummaryData(content);
    
    console.log(`📋 Sending daily summary content for ${channel.name}:`, {
      title: summaryData.title,
      contentLength: summaryData.content?.length || 0,
      hasImage: !!imageUrl
    });
    
    return await enhancedAPI.sendNews({
      chat_id: channel.telegram_channel_id,
      title: summaryData.title,
      content: summaryData.content,
      language: channel.language,
      images: imageUrl ? [imageUrl] : undefined,
      source_url: undefined,
      category: 'summary', // This is the key - tells formatNewsContent to use content as-is
      website_url: process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://your-sports-site.com'
    });
  }

  /**
   * 🎮 Send generic enhanced content with interactive buttons
   */
  private async sendGenericEnhancedContent(enhancedAPI: EnhancedTelegramAPI, channel: any, content: any, messageContent: string, imageUrl?: string, buttonConfig?: any) {
    // Generic enhanced message with interactive buttons
    return await enhancedAPI.sendNews({
      chat_id: channel.telegram_channel_id,
      title: content.title || 'Sports Update',
      content: messageContent,
      language: channel.language,
      images: imageUrl ? [imageUrl] : undefined,
      source_url: undefined,
      category: 'general',
      website_url: process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://your-sports-site.com'
    });
  }

  // ====== DATA EXTRACTION HELPERS ======

  private extractBettingData(content: any) {
    // Extract betting-specific data from content
    return {
      match: {
        home: content.match?.home || content.home_team || 'Home Team',
        away: content.match?.away || content.away_team || 'Away Team',
        competition: content.match?.competition || content.league || 'Competition'
      },
      tips: content.tips || content.predictions || [{
        type: 'Main Tip',
        prediction: content.main_prediction || 'Check our analysis',
        odds: content.odds || '2.0',
        confidence: content.confidence || 75,
        risk: content.risk || 'MEDIUM'
      }]
    };
  }

  private extractNewsData(content: any) {
    return {
      title: content.title || content.headline || 'Sports News',
      content: content.content || content.body || content.text || 'News content',
      sourceUrl: content.source_url || content.url,
      category: content.category || 'general'
    };
  }

  private extractAnalysisData(content: any) {
    return {
      match: {
        home: content.match?.home || content.home_team || 'Home Team',
        away: content.match?.away || content.away_team || 'Away Team',
        competition: content.match?.competition || content.league || 'Competition'
      },
      insights: content.insights || content.analysis_points || [{
        type: 'Key Insight',
        prediction: content.main_insight || 'Analysis available',
        odds: '1.0',
        confidence: 80,
        risk: 'LOW'
      }]
    };
  }

  private extractLiveData(content: any) {
    return {
      match: {
        home: content.match?.home || content.home_team || 'Home Team',
        away: content.match?.away || content.away_team || 'Away Team',
        competition: content.match?.competition || content.league || 'Competition',
        status: content.status || 'LIVE',
        time: content.time || content.minute || '90'
      },
      score: {
        home: content.score?.home || content.home_score || 0,
        away: content.score?.away || content.away_score || 0
      },
      events: content.events || []
    };
  }

  private extractSummaryData(content: any) {
    return {
      title: content.title || 'Daily Summary',
      content: content.content || content.text || content.summary || 'Daily sports summary'
    };
  }

  /**
   * 🔗 Load channel-specific button configuration
   */
  private async loadChannelButtonConfig(channelId: string) {
    try {
      const { data: channelData, error } = await supabase
        .from('channels')
        .select('button_config')
        .eq('id', channelId)
        .single();

      if (error) {
        console.error('❌ Error loading button config:', error);
        return null;
      }

      return channelData?.button_config || null;
    } catch (error) {
      console.error('❌ Error loading channel button config:', error);
      return null;
    }
  }

  /**
   * 🎨 Get button templates for channel language
   */
  private async getButtonTemplates(language: string, category: string) {
    try {
      const { data: templates, error } = await supabase
        .from('button_templates')
        .select('*')
        .eq('language', language)
        .eq('category', category)
        .eq('is_system', true)
        .limit(1);

      if (error) {
        console.error('❌ Error loading button templates:', error);
        return null;
      }

      return templates?.[0] || null;
    } catch (error) {
      console.error('❌ Error loading button templates:', error);
      return null;
    }
  }

  /**
   * 🔧 Apply channel button configuration to Enhanced API
   */
  private applyChannelButtonConfig(enhancedAPI: any, buttonConfig: any, channelId: string) {
    if (!buttonConfig) return;

    // Update the button link manager with channel-specific config
    const buttonLinkManager = enhancedAPI.buttonLinkManager || (global as any).buttonLinkManager;
    if (buttonLinkManager && typeof buttonLinkManager.setChannelConfig === 'function') {
      buttonLinkManager.setChannelConfig(channelId, {
        main_website: buttonConfig.main_website,
        betting_platform: buttonConfig.betting_platform,
        live_scores: buttonConfig.live_scores,
        news_source: buttonConfig.news_source,
        social_media: buttonConfig.social_media || {},
        affiliate_codes: buttonConfig.affiliate_codes || {},
        channel_settings: buttonConfig.channel_settings || {}
      });
    }
  }
}

export const telegramDistributor = new TelegramDistributor(); 