/**
 * 🌍 TIMEZONE UTILITIES - Centralized Timezone Management
 * 
 * Handles all timezone conversions and calculations for the Telegram bot system.
 * Supports channel-specific timezones with automatic DST handling.
 */

import { supabase } from '@/lib/supabase';

// Supported timezone mappings for common regions
export const TIMEZONE_MAPPINGS = {
  // Africa
  'Ethiopia': 'Africa/Addis_Ababa',
  'Kenya': 'Africa/Nairobi', 
  'Tanzania': 'Africa/Dar_es_Salaam',
  'Uganda': 'Africa/Kampala',
  'Rwanda': 'Africa/Kigali',
  'Somalia': 'Africa/Mogadishu',
  'Eritrea': 'Africa/Asmara',
  
  // Middle East
  'Israel': 'Asia/Jerusalem',
  'Palestine': 'Asia/Gaza',
  'Jordan': 'Asia/Amman',
  'Lebanon': 'Asia/Beirut',
  'Syria': 'Asia/Damascus',
  'Iraq': 'Asia/Baghdad',
  
  // Europe
  'UK': 'Europe/London',
  'France': 'Europe/Paris',
  'Germany': 'Europe/Berlin',
  'Italy': 'Europe/Rome',
  'Spain': 'Europe/Madrid',
  
  // Default
  'UTC': 'UTC'
};

export interface TimezoneInfo {
  timezone: string;
  offset: string;
  isDST: boolean;
  localTime: string;
  utcTime: string;
}

export interface ChannelTimezoneConfig {
  channelId: string;
  channelName: string;
  timezone: string;
  language: string;
}

export class TimezoneUtils {
  /**
   * 🕐 Convert UTC time to channel's local timezone
   */
  static utcToChannelTime(utcTime: Date | string, channelTimezone: string): Date {
    const utcDate = typeof utcTime === 'string' ? new Date(utcTime) : utcTime;
    
    try {
      // Use Intl.DateTimeFormat to get the local time in the target timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: channelTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      
      const parts = formatter.formatToParts(utcDate);
      const dateStr = `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}T${parts.find(p => p.type === 'hour')?.value}:${parts.find(p => p.type === 'minute')?.value}:${parts.find(p => p.type === 'second')?.value}`;
      
      return new Date(dateStr);
    } catch (error) {
      console.error(`❌ Error converting UTC to ${channelTimezone}:`, error);
      return utcDate; // Fallback to UTC
    }
  }

  /**
   * 🕐 Convert channel's local time to UTC
   */
  static channelTimeToUtc(localTime: Date | string, channelTimezone: string): Date {
    const localDate = typeof localTime === 'string' ? new Date(localTime) : localTime;
    
    try {
      // Create a date string in the target timezone and convert to UTC
      const localDateStr = localDate.toISOString().slice(0, 19); // Remove Z and milliseconds
      const utcDate = new Date(`${localDateStr}Z`); // Treat as UTC first
      
      // Get the offset for the target timezone at this time
      const tempDate = new Date(localDate.getTime());
      const utcTime1 = tempDate.getTime() + (tempDate.getTimezoneOffset() * 60000);
      const targetTimeWithOffset = new Date(utcTime1 + this.getTimezoneOffset(channelTimezone, tempDate));
      
      // Calculate the actual UTC time
      const offsetDiff = targetTimeWithOffset.getTime() - localDate.getTime();
      return new Date(utcDate.getTime() - offsetDiff);
      
    } catch (error) {
      console.error(`❌ Error converting ${channelTimezone} to UTC:`, error);
      return localDate; // Fallback
    }
  }

  /**
   * 🌍 Get timezone offset in milliseconds for a specific timezone
   */
  static getTimezoneOffset(timezone: string, date: Date = new Date()): number {
    try {
      const utcDate = new Date(date.toISOString());
      const targetDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
      return targetDate.getTime() - utcDate.getTime();
    } catch (error) {
      console.error(`❌ Error getting timezone offset for ${timezone}:`, error);
      return 0; // Fallback to UTC
    }
  }

  /**
   * 📊 Get comprehensive timezone information
   */
  static getTimezoneInfo(timezone: string, referenceTime: Date = new Date()): TimezoneInfo {
    try {
      const localTime = this.utcToChannelTime(referenceTime, timezone);
      const utcTime = referenceTime;
      
      // Calculate offset
      const offsetMinutes = (localTime.getTime() - utcTime.getTime()) / (1000 * 60);
      const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
      const offsetMins = Math.abs(offsetMinutes) % 60;
      const offsetSign = offsetMinutes >= 0 ? '+' : '-';
      const offset = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMins.toString().padStart(2, '0')}`;
      
      // Check if DST is active (simplified check)
      const jan = new Date(referenceTime.getFullYear(), 0, 1);
      const jul = new Date(referenceTime.getFullYear(), 6, 1);
      const janOffset = this.getTimezoneOffset(timezone, jan);
      const julOffset = this.getTimezoneOffset(timezone, jul);
      const currentOffset = this.getTimezoneOffset(timezone, referenceTime);
      const isDST = currentOffset !== Math.max(janOffset, julOffset);
      
      return {
        timezone,
        offset,
        isDST,
        localTime: localTime.toISOString(),
        utcTime: utcTime.toISOString()
      };
      
    } catch (error) {
      console.error(`❌ Error getting timezone info for ${timezone}:`, error);
      return {
        timezone: 'UTC',
        offset: '+00:00',
        isDST: false,
        localTime: referenceTime.toISOString(),
        utcTime: referenceTime.toISOString()
      };
    }
  }

  /**
   * ⏰ Calculate optimal posting time in UTC for a channel's timezone
   * Takes a local hour (0-23) and converts it to UTC time for scheduling
   */
  static calculateUtcTimeForChannelHour(
    channelTimezone: string, 
    localHour: number, 
    localMinute: number = 0,
    targetDate: Date = new Date()
  ): Date {
    try {
      // Create a date in the channel's timezone
      const localDate = new Date(targetDate);
      localDate.setHours(localHour, localMinute, 0, 0);
      
      // Convert to UTC
      const utcTime = this.channelTimeToUtc(localDate, channelTimezone);
      return utcTime;
      
    } catch (error) {
      console.error(`❌ Error calculating UTC time for channel hour:`, error);
      // Fallback: treat as UTC
      const fallbackDate = new Date(targetDate);
      fallbackDate.setHours(localHour, localMinute, 0, 0);
      return fallbackDate;
    }
  }

  /**
   * 📅 Get current hour in channel's timezone
   */
  static getCurrentHourInChannelTimezone(channelTimezone: string): number {
    try {
      const now = new Date();
      const channelTime = this.utcToChannelTime(now, channelTimezone);
      return channelTime.getHours();
    } catch (error) {
      console.error(`❌ Error getting current hour for ${channelTimezone}:`, error);
      return new Date().getUTCHours(); // Fallback to UTC
    }
  }

  /**
   * 🌍 Format time for display in channel's local timezone
   */
  static formatTimeForChannel(
    utcTime: Date | string, 
    channelTimezone: string,
    options: Intl.DateTimeFormatOptions = {}
  ): string {
    const utcDate = typeof utcTime === 'string' ? new Date(utcTime) : utcTime;
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      timeZone: channelTimezone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      ...options
    };
    
    try {
      return utcDate.toLocaleString('en-US', defaultOptions);
    } catch (error) {
      console.error(`❌ Error formatting time for ${channelTimezone}:`, error);
      return utcDate.toLocaleString('en-US', { ...defaultOptions, timeZone: 'UTC' });
    }
  }

  /**
   * 🎯 Check if current time is within active hours for a channel
   */
  static isWithinActiveHours(
    channelTimezone: string,
    activeStartHour: number = 6,  // 6 AM default
    activeEndHour: number = 23    // 11 PM default
  ): boolean {
    try {
      const currentHour = this.getCurrentHourInChannelTimezone(channelTimezone);
      return currentHour >= activeStartHour && currentHour <= activeEndHour;
    } catch (error) {
      console.error(`❌ Error checking active hours for ${channelTimezone}:`, error);
      return true; // Fallback to always active
    }
  }

  /**
   * 📊 Get timezone configuration for a specific channel from database
   */
  static async getChannelTimezoneConfig(channelId: string): Promise<ChannelTimezoneConfig | null> {
    try {
      const { data: channel, error } = await supabase
        .from('channels')
        .select('id, name, timezone, language')
        .eq('id', channelId)
        .eq('is_active', true)
        .single();

      if (error || !channel) {
        console.error(`❌ Error fetching channel timezone config:`, error);
        return null;
      }

      return {
        channelId: channel.id,
        channelName: channel.name,
        timezone: channel.timezone || 'Africa/Addis_Ababa', // Default to Ethiopia
        language: channel.language || 'en'
      };

    } catch (error) {
      console.error(`❌ Error in getChannelTimezoneConfig:`, error);
      return null;
    }
  }

  /**
   * 🌍 Get all active channels with their timezone configurations
   */
  static async getAllChannelTimezones(): Promise<ChannelTimezoneConfig[]> {
    try {
      const { data: channels, error } = await supabase
        .from('channels')
        .select('id, name, timezone, language')
        .eq('is_active', true);

      if (error || !channels) {
        console.error(`❌ Error fetching all channel timezones:`, error);
        return [];
      }

      return channels.map(channel => ({
        channelId: channel.id,
        channelName: channel.name,
        timezone: channel.timezone || 'Africa/Addis_Ababa',
        language: channel.language || 'en'
      }));

    } catch (error) {
      console.error(`❌ Error in getAllChannelTimezones:`, error);
      return [];
    }
  }

  /**
   * ⏱️ Calculate next scheduled time for multiple channels in different timezones
   */
  static async calculateNextScheduledTimes(
    localHour: number,
    localMinute: number = 0
  ): Promise<Array<{
    channelId: string;
    channelName: string;
    channelTimezone: string;
    localTime: string;
    utcTime: string;
    nextExecution: Date;
  }>> {
    try {
      const channels = await this.getAllChannelTimezones();
      const results = [];

      for (const channel of channels) {
        const nextUtcTime = this.calculateUtcTimeForChannelHour(
          channel.timezone,
          localHour,
          localMinute
        );

        const localTimeString = this.formatTimeForChannel(
          nextUtcTime,
          channel.timezone,
          { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZoneName: 'short' 
          }
        );

        results.push({
          channelId: channel.channelId,
          channelName: channel.channelName,
          channelTimezone: channel.timezone,
          localTime: localTimeString,
          utcTime: nextUtcTime.toISOString(),
          nextExecution: nextUtcTime
        });
      }

      return results;

    } catch (error) {
      console.error(`❌ Error calculating next scheduled times:`, error);
      return [];
    }
  }

  /**
   * 🎯 Validate timezone string
   */
  static isValidTimezone(timezone: string): boolean {
    try {
      // Test by trying to format a date with the timezone
      const testDate = new Date();
      testDate.toLocaleString('en-US', { timeZone: timezone });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 📝 Get human-readable timezone display name
   */
  static getTimezoneDisplayName(timezone: string): string {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'long'
      });
      
      const parts = formatter.formatToParts(now);
      const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value;
      
      return timeZoneName || timezone;
    } catch (error) {
      return timezone;
    }
  }
}

// Export singleton instance for convenience
export const timezoneUtils = new TimezoneUtils();

// Export default class for direct usage
export default TimezoneUtils;