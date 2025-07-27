/**
 * 🎯 SIMPLE CHANNEL RESOLVER - פשוט ויעיל
 * מתמקד בערוצים ושפות אוטומטיות
 */

import { createClient } from '@/lib/supabase';

export type Language = 'he' | 'en' | 'am' | 'sw';

export interface SimpleChannel {
  id: string;
  name: string;
  language: Language;
  channel_id: string;
  content_types: string[];
  automation_hours: number[];
  is_active: boolean;
}

export interface SimpleChannelResolution {
  channels: SimpleChannel[];
  languageGroups: Record<Language, SimpleChannel[]>;
}

export class SimpleChannelResolver {
  private supabase = createClient();

  /**
   * קבלת כל הערוצים הפעילים
   */
  async getActiveChannels(): Promise<SimpleChannel[]> {
    try {
      const { data: channels, error } = await supabase
        .from('channels')
        .select('id, name, language, channel_id, content_types, automation_hours, is_active')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('❌ שגיאה בטעינת ערוצים פעילים:', error);
        return [];
      }

      return channels as SimpleChannel[];
    } catch (error) {
      console.error('❌ שגיאה ב getActiveChannels:', error);
      return [];
    }
  }

  /**
   * קבלת ערוצים לפי סוגי תוכן
   */
  async getChannelsByContentType(contentType: string): Promise<SimpleChannel[]> {
    try {
      const { data: channels, error } = await supabase
        .from('channels')
        .select('id, name, language, channel_id, content_types, automation_hours, is_active')
        .eq('is_active', true)
        .contains('content_types', [contentType])
        .order('name');

      if (error) {
        console.error('❌ שגיאה בטעינת ערוצים לפי סוג תוכן:', error);
        return [];
      }

      console.log(`🎯 נמצאו ${channels.length} ערוצים עבור סוג תוכן: ${contentType}`);
      return channels as SimpleChannel[];
    } catch (error) {
      console.error('❌ שגיאה ב getChannelsByContentType:', error);
      return [];
    }
  }

  /**
   * קבלת ערוצים ספציפיים לפי IDs
   */
  async getSpecificChannels(channelIds: string[]): Promise<SimpleChannel[]> {
    try {
      const { data: channels, error } = await supabase
        .from('channels')
        .select('id, name, language, channel_id, content_types, automation_hours, is_active')
        .in('id', channelIds)
        .order('name');

      if (error) {
        console.error('❌ שגיאה בטעינת ערוצים ספציפיים:', error);
        return [];
      }

      console.log(`🎯 נמצאו ${channels.length} ערוצים ספציפיים`);
      return channels as SimpleChannel[];
    } catch (error) {
      console.error('❌ שגיאה ב getSpecificChannels:', error);
      return [];
    }
  }

  /**
   * פתרון פשוט של ערוצים - עם קיבוץ לפי שפות
   */
  async resolveChannels(params: {
    targetChannels?: string[];
    contentType?: string;
  }): Promise<SimpleChannelResolution> {
    const { targetChannels, contentType } = params;

    let channels: SimpleChannel[] = [];

    if (targetChannels && targetChannels.length > 0) {
      // ערוצים ספציפיים
      channels = await this.getSpecificChannels(targetChannels);
    } else if (contentType) {
      // ערוצים לפי סוג תוכן
      channels = await this.getChannelsByContentType(contentType);
    } else {
      // כל הערוצים הפעילים
      channels = await this.getActiveChannels();
    }

    // קיבוץ לפי שפות
    const languageGroups: Record<Language, SimpleChannel[]> = {
      'he': [],
      'en': [],
      'am': [],
      'sw': []
    };

    channels.forEach(channel => {
      if (languageGroups[channel.language]) {
        languageGroups[channel.language].push(channel);
      }
    });

    console.log('🎯 קיבוץ ערוצים לפי שפות:', {
      he: languageGroups.he.length,
      en: languageGroups.en.length,
      am: languageGroups.am.length,
      sw: languageGroups.sw.length,
      total: channels.length
    });

    return {
      channels,
      languageGroups
    };
  }

  /**
   * בדיקה אם ערוץ תומך בסוג תוכן
   */
  supportsContentType(channel: SimpleChannel, contentType: string): boolean {
    return channel.content_types.includes(contentType);
  }

  /**
   * בדיקה אם זמן נוכחי מתאים לאוטומציה של הערוץ
   */
  isAutomationTime(channel: SimpleChannel, currentHour: number = new Date().getHours()): boolean {
    return channel.automation_hours.includes(currentHour);
  }

  /**
   * קבלת ערוצים שראויים לאוטומציה כרגע
   */
  async getChannelsForAutomation(contentType: string): Promise<SimpleChannel[]> {
    const currentHour = new Date().getHours();
    const channels = await this.getChannelsByContentType(contentType);
    
    return channels.filter(channel => 
      this.isAutomationTime(channel, currentHour)
    );
  }
}

export const simpleChannelResolver = new SimpleChannelResolver(); 