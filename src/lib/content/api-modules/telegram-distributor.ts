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
          
          // 🌍 LANGUAGE VALIDATION: Ensure content matches channel language
          const isLanguageValid = this.validateContentLanguage(content, channel.language, channel.name);
          if (!isLanguageValid) {
            const handled = await this.handleLanguageMismatch(content, channel.language, channel.name);
            if (!handled) {
              throw new Error(`Language mismatch: Content not in ${channel.language} for ${channel.name}`);
            }
          }
          
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
    language?: string;
  }>, pollData: any): Promise<Array<{
    channelName: string;
    success: boolean;
    error?: string;
    messageId?: number;
  }>> {
    const pollResults = [];
    
    for (const channel of channels) {
      try {
        // 🚀 Use Enhanced Telegram API for advanced poll features
        const enhancedAPI = new EnhancedTelegramAPI(channel.bot_token);
        
        const result = await enhancedAPI.sendSportsPoll({
          chat_id: channel.telegram_channel_id,
          type: pollData.type === 'quiz' ? 'trivia' : 'prediction',
          question: pollData.question,
          options: pollData.options,
          language: (channel.language || 'en') as 'en' | 'am' | 'sw' | 'fr' | 'ar', // 🌍 Use proper channel language
          correct_answer: pollData.correctOptionId,
          website_url: pollData.websiteUrl
        });
        
        pollResults.push({
          channelName: channel.name,
          success: !!result,
          error: result ? undefined : 'Failed to send poll',
          messageId: result?.message_id
        });
        
        console.log(`✅ Enhanced poll sent to ${channel.name}: ${result ? 'Success' : 'Failed'}`);
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

  // ====== LANGUAGE MATCHING & VALIDATION ======

  /**
   * 🌍 Ensure content language matches channel language
   */
  private validateContentLanguage(content: any, targetLanguage: string, channelName: string): boolean {
    console.log(`🌍 Validating content language for ${channelName} (target: ${targetLanguage})`);
    
    const contentText = content.content_items?.[0]?.content || content.content || '';
    const detectedLanguage = this.detectContentLanguage(contentText);
    
    console.log(`🔍 Detected language: ${detectedLanguage}, Target: ${targetLanguage}`);
    
    if (detectedLanguage !== targetLanguage) {
      console.log(`⚠️ LANGUAGE MISMATCH: Content is in ${detectedLanguage}, but channel ${channelName} expects ${targetLanguage}`);
      return false;
    }
    
    console.log(`✅ Language validation passed for ${channelName}`);
    return true;
  }

  /**
   * 🕵️ Detect content language based on text patterns
   */
  private detectContentLanguage(text: string): string {
    if (!text) return 'en';
    
    // Hebrew detection - Hebrew characters
    if (/[\u0590-\u05FF]/.test(text)) {
      return 'he';
    }
    
    // Amharic detection - Ethiopic script
    if (/[\u1200-\u137F]/.test(text)) {
      return 'am';
    }
    
    // Swahili detection - common Swahili words
    const swahiliWords = /\b(na|ya|wa|la|kwa|katika|kwa|hii|hizo|hile|habari|mchezo|timu|mechi|ufupi)\b/i;
    if (swahiliWords.test(text)) {
      return 'sw';
    }
    
    // French detection - common French words
    const frenchWords = /\b(le|la|les|de|du|des|et|est|dans|pour|avec|sur|par|un|une|ce|cette|qui|que|où|football|match|équipe)\b/i;
    if (frenchWords.test(text)) {
      return 'fr';
    }
    
    // Arabic detection - Arabic characters
    if (/[\u0600-\u06FF]/.test(text)) {
      return 'ar';
    }
    
    // Default to English
    return 'en';
  }

  /**
   * 🔄 Request content regeneration in correct language if needed
   */
  private async handleLanguageMismatch(content: any, targetLanguage: string, channelName: string): Promise<boolean> {
    console.log(`🔄 Handling language mismatch for ${channelName} - need ${targetLanguage} content`);
    
    // Log the mismatch for monitoring
    try {
      await supabase
        .from('content_quality_logs')
        .insert({
          channel_name: channelName,
          target_language: targetLanguage,
          detected_language: this.detectContentLanguage(content.content_items?.[0]?.content || ''),
          content_type: content.content_type || 'unknown',
          issue_type: 'language_mismatch',
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('❌ Failed to log language mismatch:', error);
    }
    
    // For now, skip sending mismatched content
    return false;
  }

  // ====== CONTENT FORMATTING ENHANCEMENT ======

  /**
   * 🎨 Apply advanced Telegram formatting to make content look amazing
   */
  private enhanceContentFormatting(content: string, contentType: string, language: string): string {
    console.log(`🎨 Enhancing ${contentType} content formatting for ${language}...`);
    
    // Enhanced formatting patterns for different content types
    let enhancedContent = content;
    
    // Add proper spacing and emojis based on content type
    if (contentType === 'betting') {
      enhancedContent = this.enhanceBettingFormat(enhancedContent, language);
    } else if (contentType === 'news') {
      enhancedContent = this.enhanceNewsFormat(enhancedContent, language);
    } else if (contentType === 'analysis') {
      enhancedContent = this.enhanceAnalysisFormat(enhancedContent, language);
    } else if (contentType === 'live_updates') {
      enhancedContent = this.enhanceLiveUpdatesFormat(enhancedContent, language);
    }
    
    // Universal enhancements
    enhancedContent = this.applyUniversalFormatting(enhancedContent);
    
    console.log(`✨ Content formatting enhanced! Length: ${enhancedContent.length} chars`);
    return enhancedContent;
  }

  /**
   * 🎯 Enhanced betting content formatting
   */
  private enhanceBettingFormat(content: string, language: string): string {
    // Add proper spacing around betting odds
    content = content.replace(/(\d+\.\d+)/g, ' <b>$1</b> ');
    
    // Enhance team names with bold formatting
    content = content.replace(/(vs|נגד|በተቃወመ|dhidi ya)/gi, ' <b>$1</b> ');
    
    // Add betting emojis and better structure
    content = content.replace(/🎯/g, '\n🎯 ');
    content = content.replace(/💰/g, '\n💰 ');
    content = content.replace(/⚠️/g, '\n\n⚠️ ');
    
    // Add more visual separation
    content = content.replace(/([.!])\s*([🎯💰📊])/g, '$1\n\n$2');
    
    return content;
  }

  /**
   * 📰 Enhanced news content formatting  
   */
  private enhanceNewsFormat(content: string, language: string): string {
    // Better paragraph spacing
    content = content.replace(/([.!?])\s+([A-Z])/g, '$1\n\n$2');
    
    // Enhance quotes and important statements
    content = content.replace(/"([^"]+)"/g, '\n💬 <i>"$1"</i>\n');
    
    // Add news emojis
    content = content.replace(/📰/g, '\n📰 ');
    content = content.replace(/🚨/g, '\n🚨 ');
    
    return content;
  }

  /**
   * 📊 Enhanced analysis content formatting
   */
  private enhanceAnalysisFormat(content: string, language: string): string {
    // Enhance statistics with better formatting
    content = content.replace(/(\d+%)/g, '<b>$1</b>');
    content = content.replace(/(\d+-\d+)/g, '<b>$1</b>');
    
    // Better structure for analysis sections
    content = content.replace(/📊/g, '\n\n📊 ');
    content = content.replace(/🔍/g, '\n🔍 ');
    content = content.replace(/⚽/g, '\n⚽ ');
    
    return content;
  }

  /**
   * 🔴 Enhanced live updates formatting
   */
  private enhanceLiveUpdatesFormat(content: string, language: string): string {
    // Enhance live events with proper spacing
    content = content.replace(/(\d+')/, '\n⏱️ <b>$1</b>');
    content = content.replace(/(GOAL|גול|ጎል|BAO)/gi, '\n⚽ <b>$1</b>');
    content = content.replace(/(CARD|כרטיס|ካርድ|KADI)/gi, '\n🟨 <b>$1</b>');
    
    // Better live score formatting
    content = content.replace(/(\d+-\d+)/, '<b>$1</b>');
    
    return content;
  }

  /**
   * ✨ Apply universal formatting improvements
   */
  private applyUniversalFormatting(content: string): string {
    // Better emoji spacing
    content = content.replace(/([🎯💰📊⚽🏆🔥💎⭐🎪🌟])([A-Za-z])/g, '$1 $2');
    
    // Fix multiple spaces and line breaks
    content = content.replace(/\s{3,}/g, '  ');
    content = content.replace(/\n{4,}/g, '\n\n\n');
    
    // Ensure proper line breaks before emojis
    content = content.replace(/([.!?])\s*([🎯💰📊⚽🏆🔥💎⭐🎪🌟])/g, '$1\n\n$2');
    
    // Clean up any trailing spaces
    content = content.replace(/[ \t]+$/gm, '');
    
    return content.trim();
  }

  // ====== ENHANCED CONTENT SENDING METHODS ======

  /**
   * 🎯 Send betting content with interactive features
   */
  private async sendBettingContent(enhancedAPI: EnhancedTelegramAPI, channel: any, content: any, imageUrl?: string, buttonConfig?: any) {
    // Get the original content and enhance formatting
    let bettingContent = content.content_items?.[0]?.content || content.content || 'Betting content not available';
    
    // 🎨 Apply enhanced formatting for amazing visual presentation
    bettingContent = this.enhanceContentFormatting(bettingContent, 'betting', channel.language);
    
    // CRITICAL: Ensure content fits Telegram's 4096 character limit for captions (1024) and messages (4096)
    const maxLength = imageUrl ? 1000 : 3800; // Leave room for buttons and formatting
    if (bettingContent.length > maxLength) {
      console.log(`⚠️ Betting content too long (${bettingContent.length} chars), truncating to ${maxLength}`);
      bettingContent = this.truncateHTMLContent(bettingContent, maxLength);
    }
    
    console.log(`🎯 Sending enhanced betting content (${bettingContent.length} chars) to ${channel.name}`);
    
    // 🚀 Use Enhanced Telegram API with advanced features
    const matchInfo = {
      home: content.analysis?.homeTeam || 'Team A',
      away: content.analysis?.awayTeam || 'Team B', 
      competition: content.analysis?.competition || 'Match'
    };
    
    const tips = content.analysis?.predictions?.map((pred: any) => ({
      type: pred.type,
      prediction: pred.prediction,
      odds: pred.odds_estimate || '2.00',
      confidence: pred.confidence
    })) || [];
    
    // Send using Enhanced API with interactive features
    return await enhancedAPI.sendBettingTips({
      chat_id: channel.telegram_channel_id,
      match: matchInfo,
      tips: tips,
      language: channel.language,
      image_url: imageUrl,
      affiliate_code: buttonConfig?.affiliate_code,
      website_url: buttonConfig?.website_url
    });
  }

  /**
   * 📰 Send news content with enhanced formatting and interactive features
   */
  private async sendNewsContent(enhancedAPI: EnhancedTelegramAPI, channel: any, content: any, imageUrl?: string, buttonConfig?: any) {
    // Get the original content and enhance formatting
    let newsContent = content.content_items?.[0]?.content || content.content || 'News content not available';
    
    // 🎨 Apply enhanced formatting for amazing visual presentation
    newsContent = this.enhanceContentFormatting(newsContent, 'news', channel.language);
    
    // CRITICAL: Ensure content fits Telegram's 4096 character limit for captions (1024) and messages (4096)
    const maxLength = imageUrl ? 1000 : 3800; // Leave room for buttons and formatting
    if (newsContent.length > maxLength) {
      console.log(`⚠️ News content too long (${newsContent.length} chars), truncating to ${maxLength}`);
      newsContent = this.truncateHTMLContent(newsContent, maxLength);
    }
    
    console.log(`📰 Sending enhanced news content (${newsContent.length} chars) to ${channel.name}`);
    
    // Extract news metadata for Enhanced API
    const title = content.title || content.content_items?.[0]?.title || 'Football News';
    const category = content.category || content.content_items?.[0]?.category || 'general';
    const sourceUrl = content.source_url || content.content_items?.[0]?.source_url;
    
    // 🚀 Use Enhanced Telegram API for rich news experience
    return await enhancedAPI.sendNews({
      chat_id: channel.telegram_channel_id,
      title: title,
      content: newsContent,
      language: channel.language,
      images: imageUrl ? [imageUrl] : undefined,
      source_url: sourceUrl,
      category: category,
      website_url: buttonConfig?.website_url
    });
  }

  /**
   * ✂️ Truncate HTML content while preserving formatting
   */
  private truncateHTMLContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }

    // Try to truncate at a sentence boundary first
    const truncated = content.substring(0, maxLength);
    const lastSentence = truncated.lastIndexOf('.');
    const lastNewline = truncated.lastIndexOf('\n');
    
    // Find the best truncation point
    let cutPoint = maxLength;
    if (lastSentence > maxLength * 0.7) {
      cutPoint = lastSentence + 1;
    } else if (lastNewline > maxLength * 0.7) {
      cutPoint = lastNewline;
    }
    
    let result = content.substring(0, cutPoint);
    
    // Add continuation indicator
    const continuationText = {
      'en': '\n\n📖 <i>Continue reading...</i>',
      'am': '\n\n📖 <i>ተጨማሪ ያንብቡ...</i>',
      'sw': '\n\n📖 <i>Endelea kusoma...</i>'
    };
    
    // Add appropriate continuation based on detected language
    const isAmharic = /[\u1200-\u137F]/.test(result);
    const isSwahili = /\b(na|ya|wa|la|kwa)\b/i.test(result);
    
    if (isAmharic) {
      result += continuationText['am'];
    } else if (isSwahili) {
      result += continuationText['sw'];
    } else {
      result += continuationText['en'];
    }
    
    return result;
  }

  /**
   * 📊 Send analysis content with interactive features
   */
  private async sendAnalysisContent(enhancedAPI: EnhancedTelegramAPI, channel: any, content: any, imageUrl?: string, buttonConfig?: any) {
    // Get the original content and enhance formatting
    let analysisContent = content.content_items?.[0]?.content || content.content || 'Analysis content not available';
    
    // 🎨 Apply enhanced formatting for amazing visual presentation
    analysisContent = this.enhanceContentFormatting(analysisContent, 'analysis', channel.language);
    
    // CRITICAL: Ensure content fits Telegram's 4096 character limit for captions (1024) and messages (4096)
    const maxLength = imageUrl ? 1000 : 3800; // Leave room for buttons and formatting
    if (analysisContent.length > maxLength) {
      console.log(`⚠️ Analysis content too long (${analysisContent.length} chars), truncating to ${maxLength}`);
      analysisContent = this.truncateHTMLContent(analysisContent, maxLength);
    }
    
    console.log(`📊 Sending enhanced analysis content (${analysisContent.length} chars) to ${channel.name}`);
    
    // For analysis, we'll use the standard enhanced message with special formatting
    return await enhancedAPI.sendMessage({
      chat_id: channel.telegram_channel_id,
      text: analysisContent,
      parse_mode: 'HTML',
      reply_markup: this.createAnalysisKeyboard(content, channel.language, buttonConfig),
      protect_content: true,
      link_preview_options: { is_disabled: true },
      message_effect_id: '5046589136895476101' // Special effect for analysis content
    });
  }

  /**
   * 🔴 Send live updates content with enhanced formatting and interactive features
   */
  private async sendLiveUpdatesContent(enhancedAPI: EnhancedTelegramAPI, channel: any, content: any, imageUrl?: string, buttonConfig?: any) {
    // Get the original content and enhance formatting
    let liveContent = content.content_items?.[0]?.content || content.content || 'Live update not available';
    
    // 🎨 Apply enhanced formatting for amazing visual presentation
    liveContent = this.enhanceContentFormatting(liveContent, 'live_updates', channel.language);
    
    console.log(`🔴 Sending enhanced live updates (${liveContent.length} chars) to ${channel.name}`);
    
    // Extract live data for Enhanced API
    const liveData = this.extractLiveData(content);
    
    // 🚀 Use Enhanced Telegram API for rich live experience with special effects
    return await enhancedAPI.sendLiveUpdate({
      chat_id: channel.telegram_channel_id,
      match: liveData.match,
      score: liveData.score,
      events: liveData.events,
      language: channel.language,
      website_url: buttonConfig?.website_url || process.env.NEXT_PUBLIC_WEBSITE_URL
    });
  }

  /**
   * 📋 Send daily summary content with interactive features - DIRECT TELEGRAM API
   */
  private async sendDailySummaryContent(enhancedAPI: EnhancedTelegramAPI, channel: any, content: any, imageUrl?: string, buttonConfig?: any) {
    // Use the pre-formatted HTML content directly from the generator - NO double formatting
    let summaryContent = content.content_items?.[0]?.content || content.content || 'Daily summary not available';
    
    // CRITICAL: Ensure content fits Telegram's 4096 character limit for captions (1024) and messages (4096)
    const maxLength = imageUrl ? 1000 : 3800; // Leave room for buttons and formatting
    if (summaryContent.length > maxLength) {
      console.log(`⚠️ Summary content too long (${summaryContent.length} chars), truncating to ${maxLength}`);
      summaryContent = this.truncateHTMLContent(summaryContent, maxLength);
    }
    
    console.log(`📋 DIRECT API: Sending daily summary with HTML formatting (${summaryContent.length} chars)`);
    console.log(`📋 SAMPLE HTML: ${summaryContent.substring(0, 200)}...`);
    
    // Create interactive buttons for summary
    const keyboard = this.createNewsKeyboard(content, channel.language, buttonConfig);
    
    // BYPASS ENHANCED API ENTIRELY - Use direct fetch to Telegram API
    const botToken = channel.bot_token;
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const payload = {
      chat_id: channel.telegram_channel_id,
      text: summaryContent,
      parse_mode: 'HTML',
      reply_markup: keyboard,
      protect_content: true,
      disable_web_page_preview: true
    };
    
    console.log(`🚀 DIRECT TELEGRAM API CALL: parse_mode=HTML, content has HTML tags: ${summaryContent.includes('<b>')}`);
    
    try {
      const response = await fetch(telegramUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      if (!result.ok) {
        console.error(`❌ Direct Telegram API Error:`, result);
        throw new Error(`Telegram API Error: ${result.description}`);
      }
      
      console.log(`✅ SUCCESS: Direct Telegram API call worked, HTML should be preserved!`);
      return { result: result.result };
      
    } catch (error) {
      console.error(`❌ Direct Telegram API call failed:`, error);
      throw error;
    }
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

  /**
   * 🎯 Create interactive keyboard for betting content
   */
  private createBettingKeyboard(content: any, language: string, buttonConfig?: any) {
    const keyboard = [];
    
    // Betting-specific buttons
    const bettingButtons = {
      en: [
        { text: '💰 Place Bet', callback_data: 'place_bet' },
        { text: '📊 Live Odds', callback_data: 'live_odds' },
        { text: '⚽ Match Stats', callback_data: 'match_stats' }
      ],
      am: [
        { text: '💰 ውርርድ ያድርጉ', callback_data: 'place_bet' },
        { text: '📊 የቀጥታ ዕድሎች', callback_data: 'live_odds' },
        { text: '⚽ የጨዋታ ስታትስቲክስ', callback_data: 'match_stats' }
      ],
      sw: [
        { text: '💰 Weka Kamari', callback_data: 'place_bet' },
        { text: '📊 Uwezekano wa Moja kwa Moja', callback_data: 'live_odds' },
        { text: '⚽ Takwimu za Mechi', callback_data: 'match_stats' }
      ]
    };

    // Add betting buttons
    const langButtons = bettingButtons[language as keyof typeof bettingButtons] || bettingButtons.en;
    keyboard.push(langButtons);

    // Add channel-specific buttons if available
    if (buttonConfig?.betting_platform) {
      const bettingPlatformButtons = {
        en: '🎯 Betting Site',
        am: '🎯 የውርርድ ድህረ ገጽ',
        sw: '🎯 Tovuti ya Kamari'
      };
      keyboard.push([{
        text: bettingPlatformButtons[language as keyof typeof bettingPlatformButtons] || bettingPlatformButtons.en,
        url: buttonConfig.betting_platform
      }]);
    }

    return { inline_keyboard: keyboard };
  }

  /**
   * 📰 Create interactive keyboard for news content
   */
  private createNewsKeyboard(content: any, language: string, buttonConfig?: any) {
    const keyboard = [];
    
    // News-specific buttons
    const newsButtons = {
      en: [
        { text: '📖 Read More', callback_data: 'read_more' },
        { text: '🔄 Share News', callback_data: 'share_news' },
        { text: '💬 Discuss', callback_data: 'discuss' }
      ],
      am: [
        { text: '📖 ተጨማሪ ያንብቡ', callback_data: 'read_more' },
        { text: '🔄 ዜና ያጋሩ', callback_data: 'share_news' },
        { text: '💬 ይወያዩ', callback_data: 'discuss' }
      ],
      sw: [
        { text: '📖 Soma Zaidi', callback_data: 'read_more' },
        { text: '🔄 Shiriki Habari', callback_data: 'share_news' },
        { text: '💬 Jadili', callback_data: 'discuss' }
      ]
    };

    // Add news buttons
    const langButtons = newsButtons[language as keyof typeof newsButtons] || newsButtons.en;
    keyboard.push(langButtons);

    // Add channel-specific buttons if available
    if (buttonConfig?.news_source) {
      const newsSourceButtons = {
        en: '📰 News Source',
        am: '📰 የዜና ምንጭ',
        sw: '📰 Chanzo cha Habari'
      };
      keyboard.push([{
        text: newsSourceButtons[language as keyof typeof newsSourceButtons] || newsSourceButtons.en,
        url: buttonConfig.news_source
      }]);
    }

    return { inline_keyboard: keyboard };
  }

  /**
   * 📊 Create interactive keyboard for analysis content
   */
  private createAnalysisKeyboard(content: any, language: string, buttonConfig?: any) {
    const keyboard = [];
    
    // Analysis-specific buttons
    const analysisButtons = {
      en: [
        { text: '📊 Full Statistics', callback_data: 'analysis_stats' },
        { text: '⚽ Match Preview', callback_data: 'match_preview' },
        { text: '📈 Team Form', callback_data: 'team_form' }
      ],
      am: [
        { text: '📊 ሙሉ ስታትስቲክስ', callback_data: 'analysis_stats' },
        { text: '⚽ የጨዋታ ቅድመ እይታ', callback_data: 'match_preview' },
        { text: '📈 የቡድን ፎርም', callback_data: 'team_form' }
      ],
      sw: [
        { text: '📊 Takwimu Kamili', callback_data: 'analysis_stats' },
        { text: '⚽ Muhtasari wa Mechi', callback_data: 'match_preview' },
        { text: '📈 Hali ya Timu', callback_data: 'team_form' }
      ]
    };

    // Add analysis buttons
    const langButtons = analysisButtons[language as keyof typeof analysisButtons] || analysisButtons.en;
    keyboard.push(langButtons);

    // Add channel-specific buttons if available
    if (buttonConfig?.main_website) {
      const websiteButtons = {
        en: '🌐 Visit Website',
        am: '🌐 ድህረ ገጽ ይጎብኙ',
        sw: '🌐 Tembelea Tovuti'
      };
      keyboard.push([{
        text: websiteButtons[language as keyof typeof websiteButtons] || websiteButtons.en,
        url: buttonConfig.main_website
      }]);
    }

    return { inline_keyboard: keyboard };
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