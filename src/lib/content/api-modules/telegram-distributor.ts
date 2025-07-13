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

export interface TelegramDistributionOptions {
  content: any;
  language: Language;
  mode: string;
  targetChannels?: string[];
  includeImages?: boolean;
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
    const { content, language, mode, targetChannels, includeImages = true } = options;
    
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

      // Prepare content for sending
      const messageContent = contentFormatter.formatForTelegram(content, mode);
      const keyboard = this.createTelegramKeyboard(content, mode);
      
      // Handle image generation/retrieval
      let imageUrl = await this.handleImageGeneration(content, language, includeImages);

      // Send content to channels
      const distributionResult = await this.distributeToChannels(
        channels,
        messageContent,
        imageUrl,
        keyboard,
        content
      );

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
          competition: competition || undefined,
          size: '1024x1024',
          quality: 'high'
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
   * Distribute content to multiple channels
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
    content: any
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
      // Regular content sending
      const telegramChannels = channels.map(channel => ({
        botToken: channel.bot_token,
        channelId: channel.telegram_channel_id,
        name: channel.name,
        language: channel.language
      }));

      const telegramResult = await telegramSender.sendToMultipleChannels(
        telegramChannels,
        messageContent,
        imageUrl,
        keyboard
      );

      console.log(`✅ Distribution completed: ${telegramResult.success}/${telegramResult.success + telegramResult.failed} channels`);
      
      return {
        success: telegramResult.success > 0,
        channels: telegramResult.success + telegramResult.failed,
        results: telegramResult.results
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
   * Create Telegram keyboard for content
   */
  createTelegramKeyboard(content: any, mode: string): Array<Array<{
    text: string;
    url?: string;
    callback_data?: string;
  }>> | undefined {
    const keyboard: Array<Array<{
      text: string;
      url?: string;
      callback_data?: string;
    }>> = [];

    // Get language from content for all buttons
    const contentLanguage = content.language || content.content_items?.[0]?.language || 'en';

    // Buttons for different content types
    if (content.type === 'betting' && content.metadata?.bookmakerUrl) {
      // Button text in the correct language
      const placeBetText = {
        en: '🎯 Place Bet',
        am: '🎯 ውርርድ ያድርጉ',
        sw: '🎯 Weka Dau'
      };
      
      keyboard.push([{
        text: placeBetText[contentLanguage as keyof typeof placeBetText] || placeBetText.en,
        url: content.metadata.bookmakerUrl
      }]);
    }

    if (content.type === 'news' && content.metadata?.sourceUrl) {
      // Button text in the correct language
      const buttonText = {
        en: '📖 Read Full Article',
        am: '📖 ሙሉ ጽሑፍ ያንብቡ',
        sw: '📖 Soma Makala Kamili'
      };
      
      keyboard.push([{
        text: buttonText[contentLanguage as keyof typeof buttonText] || buttonText.en,
        url: content.metadata.sourceUrl
      }]);
    }

    if (content.type === 'coupons' && content.metadata?.couponUrl) {
      // Button text in the correct language
      const getCouponText = {
        en: '🎫 Get Coupon',
        am: '🎫 ኩፖን ያግኙ',
        sw: '🎫 Pata Kuponi'
      };
      
      keyboard.push([{
        text: getCouponText[contentLanguage as keyof typeof getCouponText] || getCouponText.en,
        url: content.metadata.couponUrl
      }]);
    }

    // General interaction buttons
    if (content.type === 'polls') {
      // Poll button texts in the correct language
      const pollTexts = {
        en: { yes: '👍 Yes', no: '👎 No' },
        am: { yes: '👍 አዎ', no: '👎 አይ' },
        sw: { yes: '👍 Ndio', no: '👎 Hapana' }
      };
      
      const currentPollTexts = pollTexts[contentLanguage as keyof typeof pollTexts] || pollTexts.en;
      
      keyboard.push([
        { text: currentPollTexts.yes, callback_data: `poll_yes_${content.id}` },
        { text: currentPollTexts.no, callback_data: `poll_no_${content.id}` }
      ]);
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
          channels_by_language: { en: 0, am: 0, sw: 0 },
          channels_with_bots: 0
        };
      }

             const stats = {
         total_channels: channels.length,
         active_channels: channels.filter((ch: any) => ch.is_active).length,
         channels_by_language: { en: 0, am: 0, sw: 0 } as Record<Language, number>,
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
        channels_by_language: { en: 0, am: 0, sw: 0 },
        channels_with_bots: 0
      };
    }
  }
}

export const telegramDistributor = new TelegramDistributor(); 