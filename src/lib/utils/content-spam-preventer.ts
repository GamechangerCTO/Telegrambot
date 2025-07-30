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
  
  static getInstance(): ContentSpamPreventer {
    if (!ContentSpamPreventer.instance) {
      ContentSpamPreventer.instance = new ContentSpamPreventer();
    }
    return ContentSpamPreventer.instance;
  }

  /**
   * Check if content sending is allowed
   */
  async canSendContent(
    contentType: string, 
    channelId: string,
    organizationId: string = 'default',
    manualExecution: boolean = false
  ): Promise<{ allowed: boolean; reason?: string; waitTime?: number }> {
    
    const today = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();
    
    // Manual execution bypasses most restrictions
    if (manualExecution) {
      console.log(`🔓 MANUAL EXECUTION: Bypassing spam prevention for ${contentType} on channel ${channelId}`);
      return { allowed: true, reason: 'Manual execution - restrictions bypassed' };
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