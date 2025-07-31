/**
 * 🛡️ ANTI-SPAM CONTENT PREVENTION SYSTEM
 * Prevents unlimited message sending with strict rate limiting
 */

import { supabase } from '@/lib/supabase';

interface ContentLimits {
  maxPerHour: number;
  maxPerDay: number;
  minGapMinutes: number;
  emergencyBrakeHour: number;
  contentTypeLimits: Record<string, number>;
}

// STRICT limits to prevent spam
const CONTENT_LIMITS: ContentLimits = {
  maxPerHour: 2,           // Maximum 2 messages per hour
  maxPerDay: 12,           // Maximum 12 messages per day  
  minGapMinutes: 30,       // Minimum 30 minutes between messages
  emergencyBrakeHour: 15,  // Emergency stop at 15 messages/day
  contentTypeLimits: {
    'news': 3,             // Max 3 news per day
    'betting': 2,          // Max 2 betting tips per day
    'analysis': 2,         // Max 2 analysis per day
    'live': 4,             // Max 4 live updates per day
    'polls': 1,            // Max 1 poll per day
    'coupons': 3,          // Max 3 coupons per day
    'summary': 1,          // Max 1 summary per day
    'memes': 1             // Max 1 meme per day
  }
};

export class ContentSpamPreventer {
  private static instance: ContentSpamPreventer;
  private recentContentCache = new Map<string, Set<string>>(); // Cache for recent content
  
  static getInstance(): ContentSpamPreventer {
    if (!ContentSpamPreventer.instance) {
      ContentSpamPreventer.instance = new ContentSpamPreventer();
    }
    return ContentSpamPreventer.instance;
  }

  /**
   * 🔄 Check if similar content was recently generated (before calling OpenAI)
   */
  async canGenerateContent(
    contentType: string,
    channelId: string,
    newsTitle?: string,
    organizationId: string = 'default'
  ): Promise<{ allowed: boolean; reason?: string; duplicateContent?: any }> {
    
    const today = new Date().toISOString().split('T')[0];
    const last6Hours = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    
    try {
      // Check if similar content was generated in the last 6 hours
      const { data: recentLogs } = await supabase
        .from('automation_logs')
        .select('*')
        .eq('channel_id', channelId)
        .eq('content_type', contentType)
        .gte('created_at', last6Hours)
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentLogs && recentLogs.length > 0) {
        // For news, check if the same title was already processed
        if (contentType === 'news' && newsTitle) {
          const duplicateNews = recentLogs.find((log: any) => {
            const logDetails = log.details || {};
            const logTitle = logDetails.title || logDetails.content_title || '';
            return logTitle.toLowerCase().includes(newsTitle.toLowerCase().substring(0, 50)) ||
                   newsTitle.toLowerCase().includes(logTitle.toLowerCase().substring(0, 50));
          });
          
          if (duplicateNews) {
            console.log(`🔄 DUPLICATE CONTENT: Similar news already generated in last 6h for ${channelId}`);
            return { 
              allowed: false, 
              reason: `Similar news already generated: "${duplicateNews.details?.title || 'Unknown'}"`,
              duplicateContent: duplicateNews
            };
          }
        }

        // For other content types, check frequency
        const recentCount = recentLogs.length;
        const hourlyLimit = this.getHourlyLimitForType(contentType);
        
        if (recentCount >= hourlyLimit) {
          console.log(`🔄 FREQUENCY LIMIT: ${recentCount} ${contentType} items in last 6h >= ${hourlyLimit} limit`);
          return { 
            allowed: false, 
            reason: `Too many ${contentType} items generated recently: ${recentCount}/${hourlyLimit}` 
          };
        }
      }

      console.log(`✅ CONTENT GENERATION ALLOWED: ${contentType} for channel ${channelId}`);
      return { allowed: true, reason: 'Content generation allowed' };
      
    } catch (error) {
      console.error('Error checking content generation limits:', error);
      // On error, allow generation but log the issue
      return { allowed: true, reason: 'Error checking limits - allowing generation' };
    }
  }

  /**
   * Get hourly generation limits for content types
   */
  private getHourlyLimitForType(contentType: string): number {
    const hourlyLimits = {
      'news': 2,        // Max 2 news per 6 hours
      'betting': 1,     // Max 1 betting tip per 6 hours  
      'analysis': 1,    // Max 1 analysis per 6 hours
      'live': 3,        // Max 3 live updates per 6 hours
      'polls': 1,       // Max 1 poll per 6 hours
      'coupons': 2,     // Max 2 coupons per 6 hours
      'summary': 1,     // Max 1 summary per 6 hours
    };
    
    return hourlyLimits[contentType] || 1; // Default to 1 if unknown type
  }

  /**
   * Check if content sending is allowed
   */
  async canSendContent(
    contentType: string, 
    channelId: string,
    organizationId: string = 'default',
    manualExecution: boolean = false,
    isAutomationExecution: boolean = false
  ): Promise<{ allowed: boolean; reason?: string; waitTime?: number }> {
    
    const today = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();
    
    // Only manual execution bypasses restrictions, NOT automation
    if (manualExecution && !isAutomationExecution) {
      console.log(`🔓 MANUAL EXECUTION: Bypassing spam prevention for ${contentType} on channel ${channelId}`);
      return { allowed: true, reason: 'Manual execution - restrictions bypassed' };
    }
    
    // Automation executions must follow all spam prevention rules
    if (isAutomationExecution) {
      console.log(`🤖 AUTOMATION EXECUTION: Following spam prevention rules for ${contentType} on channel ${channelId}`);
    }
    
    try {
      // Get today's content count from automation_logs
      const { data: todayLogs } = await supabase
        .from('automation_logs')
        .select('*')
        .gte('created_at', `${today}T00:00:00Z`)
        .lte('created_at', `${today}T23:59:59Z`)
        .order('created_at', { ascending: false });

      const todayCount = todayLogs?.length || 0;
      
      // Emergency brake check
      if (todayCount >= CONTENT_LIMITS.emergencyBrakeHour) {
        console.log(`🚨 EMERGENCY BRAKE: ${todayCount} messages today >= ${CONTENT_LIMITS.emergencyBrakeHour}`);
        await this.sendEmergencyAlert(todayCount, channelId);
        return { 
          allowed: false, 
          reason: `Emergency brake activated: ${todayCount} messages today` 
        };
      }

      // Daily limit check
      if (todayCount >= CONTENT_LIMITS.maxPerDay) {
        console.log(`⛔ Daily limit reached: ${todayCount}/${CONTENT_LIMITS.maxPerDay}`);
        return { 
          allowed: false, 
          reason: `Daily limit reached: ${todayCount}/${CONTENT_LIMITS.maxPerDay}` 
        };
      }

      // Content type limit check
      const typeLimit = CONTENT_LIMITS.contentTypeLimits[contentType];
      if (typeLimit) {
        const typeCount = todayLogs?.filter((log: any) => 
          log.content_type === contentType
        ).length || 0;
        
        if (typeCount >= typeLimit) {
          console.log(`📋 Content type limit: ${contentType} ${typeCount}/${typeLimit}`);
          return { 
            allowed: false, 
            reason: `${contentType} daily limit reached: ${typeCount}/${typeLimit}` 
          };
        }
      }

      // Hourly limit check
      const hourStart = new Date();
      hourStart.setMinutes(0, 0, 0);
      const { data: hourLogs } = await supabase
        .from('automation_logs')
        .select('*')
        .gte('created_at', hourStart.toISOString())
        .order('created_at', { ascending: false });

      const hourCount = hourLogs?.length || 0;
      if (hourCount >= CONTENT_LIMITS.maxPerHour) {
        const nextHour = new Date(hourStart);
        nextHour.setHours(nextHour.getHours() + 1);
        const waitTime = Math.ceil((nextHour.getTime() - Date.now()) / (1000 * 60));
        
        console.log(`⏰ Hourly limit: ${hourCount}/${CONTENT_LIMITS.maxPerHour}, wait ${waitTime}min`);
        return { 
          allowed: false, 
          reason: `Hourly limit reached: ${hourCount}/${CONTENT_LIMITS.maxPerHour}`,
          waitTime
        };
      }

      // Time gap check - get last content sent
      if (todayLogs && todayLogs.length > 0) {
        const lastContent = new Date(todayLogs[0].created_at);
        const minutesSinceLastContent = (Date.now() - lastContent.getTime()) / (1000 * 60);
        
        if (minutesSinceLastContent < CONTENT_LIMITS.minGapMinutes) {
          const waitTime = Math.ceil(CONTENT_LIMITS.minGapMinutes - minutesSinceLastContent);
          console.log(`⏳ Time gap too small: ${minutesSinceLastContent.toFixed(1)}min < ${CONTENT_LIMITS.minGapMinutes}min`);
          return { 
            allowed: false, 
            reason: `Minimum gap not met: ${minutesSinceLastContent.toFixed(1)}min < ${CONTENT_LIMITS.minGapMinutes}min`,
            waitTime
          };
        }
      }

      // Bot sleeping hours (midnight to 6 AM)
      if (currentHour >= 0 && currentHour < 6) {
        console.log(`😴 Bot sleeping hours: ${currentHour}:00`);
        return { 
          allowed: false, 
          reason: `Bot sleeping hours (00:00-06:00), current: ${currentHour}:00` 
        };
      }

      // All checks passed
      console.log(`✅ Content sending allowed: ${contentType} for channel ${channelId}`);
      return { allowed: true };

    } catch (error) {
      console.error('❌ Error checking spam prevention:', error);
      // In case of error, be conservative and block
      return { 
        allowed: false, 
        reason: 'System error - being conservative' 
      };
    }
  }

  /**
   * Log content sending
   */
  async logContentSent(
    contentType: string, 
    channelId: string, 
    organizationId: string = 'default',
    success: boolean = true
  ): Promise<void> {
    try {
      await supabase.from('automation_logs').insert({
        automation_rule_id: `spam-preventer-${Date.now()}`,
        run_type: 'content_generation',
        status: success ? 'success' : 'failed', 
        content_type: contentType,
        channels_updated: success ? 1 : 0,
        content_generated: success ? 1 : 0,
        organization_id: organizationId,
        created_at: new Date().toISOString()
      });
      
      console.log(`📝 Logged ${contentType} content for channel ${channelId}`);
    } catch (error) {
      console.error('❌ Error logging content:', error);
    }
  }

  /**
   * Send emergency alert to admin
   */
  private async sendEmergencyAlert(messageCount: number, channelId: string): Promise<void> {
    try {
      // Here you would send a Telegram alert to admin
      console.log(`🚨 EMERGENCY ALERT: ${messageCount} messages sent today from channel ${channelId}`);
      
      // Could integrate with your telegram sender here
      // await telegramSender.sendToAdmin(`🚨 SPAM ALERT: ${messageCount} messages today!`);
      
    } catch (error) {
      console.error('❌ Error sending emergency alert:', error);
    }
  }

  /**
   * Record a successfully sent message
   */
  async recordSentMessage(
    channelId: string,
    contentType: string,
    messageId: string,
    organizationId: string = 'default'
  ): Promise<void> {
    try {
      console.log(`📊 Recording sent message: ${contentType} to channel ${channelId}`);
      
      await supabase
        .from('automation_logs')
        .insert({
          organization_id: organizationId,
          content_type: contentType,
          channel_id: channelId,
          message_id: messageId,
          status: 'success',
          created_at: new Date().toISOString()
        });
        
      console.log('✅ Message recorded successfully');
    } catch (error) {
      console.error('❌ Error recording sent message:', error);
    }
  }

  /**
   * Get current usage statistics
   */
  async getUsageStats(organizationId: string = 'default'): Promise<any> {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const { data: todayLogs } = await supabase
        .from('automation_logs')
        .select('*')
        .gte('created_at', `${today}T00:00:00Z`)
        .lte('created_at', `${today}T23:59:59Z`);

      const totalToday = todayLogs?.length || 0;
      const byType: Record<string, number> = {};
      
      todayLogs?.forEach((log: any) => {
        const type = log.content_type || 'unknown';
        byType[type] = (byType[type] || 0) + 1;
      });

      return {
        totalToday,
        maxDaily: CONTENT_LIMITS.maxPerDay,
        emergencyBrake: CONTENT_LIMITS.emergencyBrakeHour,
        byType,
        limits: CONTENT_LIMITS.contentTypeLimits,
        status: totalToday >= CONTENT_LIMITS.emergencyBrakeHour ? 'EMERGENCY_STOP' : 
                totalToday >= CONTENT_LIMITS.maxPerDay ? 'DAILY_LIMIT_REACHED' : 'NORMAL'
      };
    } catch (error) {
      console.error('❌ Error getting usage stats:', error);
      return { error: 'Failed to get stats' };
    }
  }
}

// Export singleton instance
export const contentSpamPreventer = ContentSpamPreventer.getInstance(); 