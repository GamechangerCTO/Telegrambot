/**
 * 🌐 CHANNEL RESOLVER - Channel and Language Resolution Logic
 * Handles all channel selection and language detection for content distribution
 */

import { supabase } from '@/lib/supabase';

export type Language = 'en' | 'am' | 'sw' | 'fr' | 'ar'; // ✅ All 5 supported languages

export interface ChannelResolutionRequest {
  target_channels?: string[];
  language?: Language;
  body?: any;
  searchParams?: URLSearchParams;
}

export interface ChannelResolutionResult {
  targetChannels: string[];
  language: Language;
  resolvedChannels: Array<{
    id: string;
    name: string;
    language: Language;
    telegram_channel_id: string;
    // 🎯 Additional channel settings for targeted content
    selected_leagues?: string[];
    selected_teams?: string[];
    affiliate_code?: string;
    smart_scheduling?: boolean;
    max_posts_per_day?: number;
  }>;
}

export class ChannelResolver {
  /**
   * Get all active channel languages
   */
  async getActiveChannelLanguages(): Promise<Language[]> {
    try {
      const { data: channels, error } = await supabase
        .from('channels')
        .select(`
          language,
          bots!inner(
            id,
            is_active
          )
        `)
        .eq('is_active', true)
        .eq('bots.is_active', true);
      
      if (error) {
        console.error('❌ Error fetching active channel languages:', error);
        return [];
      }
      
      // קבלת שפות ייחודיות
      const languageSet = new Set(channels.map((channel: any) => channel.language));
      const uniqueLanguages = Array.from(languageSet);
      console.log(`🌐 Active channel languages found: ${uniqueLanguages.join(', ')}`);
      return uniqueLanguages as Language[];
    } catch (error) {
      console.error('❌ Error in getActiveChannelLanguages:', error);
      return [];
    }
  }

  /**
   * Resolve target channels and language from request
   */
  async resolveTargetChannels(request: ChannelResolutionRequest): Promise<ChannelResolutionResult> {
    const { target_channels, language: requestedLanguage, body, searchParams } = request;
    
    // Get parameters from body first, fallback to searchParams
    let language = requestedLanguage || (body?.language || searchParams?.get('language')) as Language;
    
    console.log('🔍 Request body structure:', {
      target_channels: body?.target_channels,
      target_channels_type: typeof body?.target_channels,
      target_channels_isArray: Array.isArray(body?.target_channels),
      body_keys: body ? Object.keys(body) : []
    });
    
    // 🎯 SIMPLIFIED LANGUAGE LOGIC - Prioritize explicitly requested language
    let targetChannelsForLanguageDetection: string[] = [];
    
    // Step 1: Handle target channels if provided
    if (target_channels && Array.isArray(target_channels) && target_channels.length > 0) {
      targetChannelsForLanguageDetection = target_channels.map(String);
      console.log(`🎯 TARGET CHANNELS PROVIDED: ${targetChannelsForLanguageDetection.join(', ')}`);
      
      // Get channel languages for these specific channels
      const { data: targetChannelsData, error: targetChannelsError } = await supabase
        .from('channels')
        .select('id, language, name, is_active')
        .in('id', targetChannelsForLanguageDetection)
        .eq('is_active', true);
      
      if (!targetChannelsError && targetChannelsData && targetChannelsData.length > 0) {
        const languageSet2 = new Set(targetChannelsData.map((ch: any) => ch.language));
        const channelLanguages = Array.from(languageSet2);
        
        if (!language) {
          // No language requested - use channel language(s)
          language = channelLanguages.length === 1 ? channelLanguages[0] as Language : channelLanguages[0] as Language;
          console.log(`🎯 No language requested, using channel language: ${language}`);
        } else {
          // Language was explicitly requested - check if it matches channels
          if (channelLanguages.includes(language)) {
            console.log(`✅ Requested language '${language}' matches target channels`);
          } else {
            console.log(`⚠️ Requested language '${language}' doesn't match target channels (${channelLanguages.join(', ')}), keeping requested language`);
          }
        }
      }
    }
    
    // Step 2: If no language specified and no target channels, find active channels
    if (!language) {
      console.log('🔍 No language specified, checking for active channels...');
      const activeLanguages = await this.getActiveChannelLanguages();
      console.log(`🌐 Active languages available: ${activeLanguages.join(', ') || 'none'}`);
      
      if (activeLanguages.length > 0) {
        language = activeLanguages[0]; // Use first available language
        console.log(`🎯 Auto-detected language from active channels: ${language}`);
      } else {
        language = 'en'; // Ultimate fallback
        console.log(`⚠️ No active channels found, defaulting to: ${language}`);
      }
    }
    
    // Step 3: Validate language - Support all 5 languages
    if (!['en', 'am', 'sw', 'fr', 'ar'].includes(language)) {
      console.log(`⚠️ Invalid language '${language}', defaulting to 'en'`);
      language = 'en';
    }
    
    console.log(`✅ FINAL LANGUAGE DECISION: ${language} (will be used for AI content generation)`);
    
    // Step 4: Find appropriate channels if none were specified
    if (targetChannelsForLanguageDetection.length === 0) {
      console.log('🎯 NO TARGET CHANNELS: Finding active channels with bots');
      
      // If no language was explicitly requested, find ALL active channels and their languages
      if (!requestedLanguage && !body?.language && !searchParams?.get('language')) {
        console.log('🌐 No language specified, detecting from active channels...');
        const { data: allActiveChannels, error: allChannelsError } = await supabase
          .from('channels')
          .select('id, name, language, telegram_channel_id, is_active')
          .eq('is_active', true);
        
        if (!allChannelsError && allActiveChannels && allActiveChannels.length > 0) {
          // Use first active channel and its language
          const primaryChannel = allActiveChannels[0];
          targetChannelsForLanguageDetection = [primaryChannel.id];
          language = primaryChannel.language as Language;
          console.log(`🎯 Auto-detected: Using channel "${primaryChannel.name}" with language "${language}"`);
        }
      } else {
        // Language was specified, find channels for this specific language
        console.log(`🔍 Finding channels for specified language: ${language}`);
        const { data: availableChannels, error: channelsError } = await supabase
          .from('channels')
          .select('id, name, language, is_active')
          .eq('language', language)
          .eq('is_active', true)
          .limit(5);
        
        if (!channelsError && availableChannels && availableChannels.length > 0) {
          console.log(`📍 Found ${availableChannels.length} channels for language '${language}':`);
          availableChannels.forEach((ch: any) => console.log(`  - ${ch.name} (${ch.language})`));
          targetChannelsForLanguageDetection = [availableChannels[0].id]; // Use first channel
          console.log(`🎯 Using primary channel: ${availableChannels[0].name}`);
        }
      }
      
      // Final fallback - find ANY active channel
      if (targetChannelsForLanguageDetection.length === 0) {
        console.log(`❌ No channels found, trying final fallback...`);
        const { data: fallbackChannels } = await supabase
          .from('channels')
          .select('id, name, language, is_active')
          .eq('is_active', true)
          .limit(1);
          
        if (fallbackChannels && fallbackChannels.length > 0) {
          targetChannelsForLanguageDetection = [fallbackChannels[0].id];
          language = fallbackChannels[0].language as Language;
          console.log(`🔄 Final fallback: Using channel "${fallbackChannels[0].name}" (${fallbackChannels[0].language})`);
        }
      }
    }

    // Get resolved channel details
    const resolvedChannels = await this.getChannelDetails(targetChannelsForLanguageDetection);

    return {
      targetChannels: targetChannelsForLanguageDetection,
      language,
      resolvedChannels
    };
  }

  /**
   * Get detailed channel information
   */
  private async getChannelDetails(channelIds: string[]): Promise<Array<{
    id: string;
    name: string;
    language: Language;
    telegram_channel_id: string;
    selected_leagues?: string[];
    selected_teams?: string[];
    affiliate_code?: string;
    smart_scheduling?: boolean;
    max_posts_per_day?: number;
  }>> {
    if (channelIds.length === 0) return [];

    const { data: channels, error } = await supabase
      .from('channels')
      .select('id, name, language, telegram_channel_id, is_active, selected_leagues, selected_teams, affiliate_code, smart_scheduling, max_posts_per_day')
      .in('id', channelIds)
      .eq('is_active', true);

    if (error) {
      console.error('❌ Error fetching channel details:', error);
      return [];
    }

    return channels || [];
  }

  /**
   * Find primary active channel for simple operations
   */
  async findPrimaryChannel(): Promise<{
    id: string;
    name: string;
    language: Language;
    telegram_channel_id: string;
    bot_token: string;
  } | null> {
    try {
      const { data: primaryChannel, error: channelError } = await supabase
        .from('channels')
        .select(`
          id,
          name,
          telegram_channel_id,
          language,
          bots!inner(
            telegram_token_encrypted,
            is_active
          )
        `)
        .eq('is_active', true)
        .eq('bots.is_active', true)
        .limit(1)
        .single();

      if (channelError || !primaryChannel) {
        console.error('❌ No active channel found with active bot');
        return null;
      }

      console.log(`📍 Found primary channel: ${primaryChannel.name} (${primaryChannel.language})`);
      
      return {
        id: primaryChannel.id,
        name: primaryChannel.name,
        language: primaryChannel.language as Language,
        telegram_channel_id: primaryChannel.telegram_channel_id,
        bot_token: (primaryChannel as any).bots.telegram_token_encrypted
      };
    } catch (error) {
      console.error('❌ Error finding primary channel:', error);
      return null;
    }
  }

  /**
   * Get channels for specific language
   */
  async getChannelsForLanguage(language: Language): Promise<Array<{
    id: string;
    name: string;
    language: Language;
    telegram_channel_id: string;
    bot_token: string;
  }>> {
    try {
      const { data: channels, error } = await supabase
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
        .eq('bots.is_active', true)
        .eq('language', language);

      if (error) {
        console.error('❌ Error fetching channels for language:', error);
        return [];
      }

      return (channels || []).map((channel: any) => ({
        id: channel.id,
        name: channel.name,
        language: channel.language as Language,
        telegram_channel_id: channel.telegram_channel_id,
        bot_token: channel.bots.telegram_token_encrypted
      }));
    } catch (error) {
      console.error('❌ Error in getChannelsForLanguage:', error);
      return [];
    }
  }
}

export const channelResolver = new ChannelResolver(); 