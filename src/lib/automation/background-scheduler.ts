/**
 * 🕐 Background Scheduler - Automated Content Timing Engine
 * 
 * Features:
 * - Continuous monitoring every minute for scheduled content
 * - Automatic automation execution
 * - Rule monitoring and execution tracking
 * - Duplicate prevention logic
 * - 🆕 Live updates monitoring integration
 */

import { supabase } from '@/lib/supabase';

export class BackgroundScheduler {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 60000; // Check every minute
  private lastExecutionTimes: Map<string, number> = new Map();
  
  // 🆕 Live updates integration
  private liveUpdatesGenerator: any = null;
  private isLiveMonitoringActive = false;

  /**
   * Start the continuous background scheduler
   */
  start(): void {
    if (this.isRunning) {
      console.log('⚠️ Background Scheduler already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Background Scheduler starting - checking every minute');

    // 🗑️ Clean old logs on startup
    this.cleanOldLogs();

    // 🆕 Start live updates monitoring
    this.startLiveUpdatesMonitoring();

    // Initial check immediately
    this.checkAndExecute();

    // Continuous checks every minute
    this.intervalId = setInterval(() => {
      this.checkAndExecute();
    }, this.CHECK_INTERVAL);

    // Clean old logs every hour
    setInterval(() => {
      this.cleanOldLogs();
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Stop the background scheduler
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // 🆕 Stop live updates monitoring
    this.stopLiveUpdatesMonitoring();

    console.log('🛑 Background Scheduler stopped');
  }

  /**
   * 🆕 START LIVE UPDATES MONITORING
   */
  private async startLiveUpdatesMonitoring(): Promise<void> {
    try {
      console.log('🔴 Starting live updates monitoring...');
      
      // Dynamic import to avoid circular dependencies
      const { LiveUpdatesGenerator } = await import('../content/live-updates-generator');
      this.liveUpdatesGenerator = new LiveUpdatesGenerator();
      
      // Start monitoring with 60-second intervals
      const result = await this.liveUpdatesGenerator.startMonitoring(60);
      
      if (result.isRunning) {
        this.isLiveMonitoringActive = true;
        console.log('✅ Live updates monitoring started successfully');
      } else {
        console.log('⚠️ Live updates monitoring failed to start');
      }
      
    } catch (error) {
      console.error('❌ Error starting live updates monitoring:', error);
    }
  }

  /**
   * 🆕 STOP LIVE UPDATES MONITORING
   */
  private async stopLiveUpdatesMonitoring(): Promise<void> {
    try {
      if (this.liveUpdatesGenerator && this.isLiveMonitoringActive) {
        console.log('🛑 Stopping live updates monitoring...');
        
        await this.liveUpdatesGenerator.stopMonitoring();
        this.isLiveMonitoringActive = false;
        
        console.log('✅ Live updates monitoring stopped');
      }
    } catch (error) {
      console.error('❌ Error stopping live updates monitoring:', error);
    }
  }

  /**
   * 🆕 GET LIVE UPDATES STATUS
   */
  async getLiveUpdatesStatus(): Promise<any> {
    try {
      if (!this.liveUpdatesGenerator || !this.isLiveMonitoringActive) {
        return {
          isActive: false,
          message: 'Live monitoring not active'
        };
      }
      
      return await this.liveUpdatesGenerator.getMonitoringStats();
    } catch (error) {
      console.error('❌ Error getting live updates status:', error);
      return {
        isActive: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check and execute automation rules
   */
  private async checkAndExecute(): Promise<void> {
    try {
      const now = new Date();
      const currentTime = now.getTime();
      
      console.log(`🕐 Background Scheduler: checking at ${now.toLocaleTimeString('en-US')}`);

      // Get active automation rules
      const { data: rules } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('enabled', true);

      if (!rules || rules.length === 0) {
        console.log('📋 No active automation rules');
        return;
      }

      // Check for today's matches and upcoming opportunities
      await this.checkUpcomingMatches(now);

      // Check each rule
      for (const rule of rules) {
        await this.checkRule(rule, now, currentTime);
      }

    } catch (error) {
      console.error('❌ Background Scheduler error:', error);
    }
  }

  /**
   * Check for upcoming matches and plan content opportunities
   */
  private async checkUpcomingMatches(now: Date): Promise<void> {
    try {
      // Get today's matches from the unified football service
      const todayStr = now.toISOString().split('T')[0];
      
      console.log(`🔍 Checking matches for today: ${todayStr}`);
      
      // Get today's matches directly without HTTP calls (better for serverless)
      try {
        const { unifiedFootballService } = await import('../content/unified-football-service');
        
        // Get best matches for different content types
        const [bettingMatch, analysisMatch, liveMatch] = await Promise.all([
          unifiedFootballService.getBestMatchForContent('betting_tip', 'en'),
          unifiedFootballService.getBestMatchForContent('analysis', 'en'),
          unifiedFootballService.getBestMatchForContent('live_update', 'en')
        ]);
        
        const matches = [bettingMatch, analysisMatch, liveMatch].filter(Boolean);
        
        console.log(`⚽ Found ${matches.length} potential matches for content`);
        
        // For each available match, schedule content if timing is right
        for (const match of matches) {
          if (!match) continue;
          
          const homeTeamName = match.homeTeam?.name || 'Home Team';
          const awayTeamName = match.awayTeam?.name || 'Away Team';
          
          console.log(`🎯 Checking match: ${homeTeamName} vs ${awayTeamName}`);
          
          // Schedule content based on current time (simplified for serverless)
          const currentHour = now.getHours();
          
          // Schedule betting content during peak hours
          if (currentHour >= 14 && currentHour <= 18) {
            console.log(`🎯 SCHEDULED Betting: ${homeTeamName} vs ${awayTeamName} during peak hours`);
            this.scheduleContentForMatch(match, 'betting', 'peak_hours_betting');
          }
          
          // Schedule analysis content during evening hours  
          if (currentHour >= 19 && currentHour <= 22) {
            console.log(`📊 SCHEDULED Analysis: ${homeTeamName} vs ${awayTeamName} during evening hours`);
            this.scheduleContentForMatch(match, 'analysis', 'evening_hours_analysis');
          }
        }
      } catch (error) {
        console.error('❌ Error getting matches from unified service:', error);
      }
    } catch (error) {
      console.error('❌ Error checking upcoming matches:', error);
    }
  }

  /**
   * Schedule content for specific match
   */
  private async scheduleContentForMatch(match: any, contentType: string, reason: string): Promise<void> {
    const homeTeamName = match.homeTeam?.name || match.home_team;
    const awayTeamName = match.awayTeam?.name || match.away_team;
    const matchKey = `${homeTeamName}_${awayTeamName}_${contentType}`;
    const lastExecution = this.lastExecutionTimes.get(matchKey) || 0;
    const timeSinceLastExecution = Date.now() - lastExecution;
    
    // Prevent duplicate scheduling for same match
    if (timeSinceLastExecution < 60 * 60 * 1000) { // 1 hour cooldown
      return;
    }

    console.log(`📅 Scheduling ${contentType} content for ${homeTeamName} vs ${awayTeamName}`);
    
    try {
      // Use direct content generation instead of HTTP calls for serverless efficiency
      const { ContentRouter } = await import('../content/api-modules/content-router');
      const router = new ContentRouter();
      
      const result = await router.generateContent({
        type: contentType as any,
        language: 'en',
        maxItems: 1,
        channelId: 'automation',
        customContent: {
          match_context: {
            home_team: homeTeamName,
            away_team: awayTeamName,
            kickoff_time: match.kickoff || match.kickoff_time,
            competition: match.competition?.name || match.competition
          },
          trigger_reason: reason
        }
      });

      if (result?.contentItems && result.contentItems.length > 0) {
        console.log(`✅ Generated ${contentType} content for match successfully`);
        this.lastExecutionTimes.set(matchKey, Date.now());
      }
    } catch (error) {
      console.error(`❌ Error scheduling content for match:`, error);
    }
  }

  /**
   * Check specific automation rule
   */
  private async checkRule(rule: any, now: Date, currentTime: number): Promise<void> {
    const ruleId = rule.id;
    
    // 🔒 Database-based duplicate prevention (more reliable than memory)
    const isDuplicate = await this.checkForRecentExecution(ruleId, 30); // 30 minutes
    if (isDuplicate) {
      return;
    }
    
    // Memory fallback for performance
    const lastExecution = this.lastExecutionTimes.get(ruleId) || 0;
    const timeSinceLastExecution = Date.now() - lastExecution;
    if (timeSinceLastExecution < 30 * 60 * 1000) {
      return;
    }

    let shouldExecute = false;
    let reason = '';

    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

    switch (rule.automation_type) {
      case 'scheduled':
        ({ shouldExecute, reason } = await this.checkScheduledRule(rule, now, currentTimeMinutes));
        break;
      
      case 'event_driven':
        ({ shouldExecute, reason } = this.checkEventDrivenRule(rule, now));
        break;
      
      case 'context_aware':
        ({ shouldExecute, reason } = this.checkContextAwareRule(rule, now));
        break;
    }

    if (shouldExecute) {
      console.log(`🎯 Executing rule: ${rule.name} - ${reason}`);
      await this.executeRule(rule);
      this.lastExecutionTimes.set(ruleId, Date.now());
    }
  }

  /**
   * Check scheduled rule - Updated to use dynamic timeline
   */
  private async checkScheduledRule(rule: any, now: Date, currentTime: number): Promise<{ shouldExecute: boolean, reason: string }> {
    // Check for fixed times first (like news)
    const config = rule.config || {};
    const times = config.times || [];

    // Check fixed times (like news)
    for (const time of times) {
      const [hour, minute] = time.split(':').map(Number);
      const scheduleTime = hour * 60 + minute;
      
      // Check if we're in the time window (5 minutes)
      if (Math.abs(currentTime - scheduleTime) <= 5) {
        return {
          shouldExecute: true,
          reason: `scheduled time ${time}`
        };
      }
    }

    // If no fixed times, check dynamic scheduling based on matches
    return this.checkDynamicScheduling(rule, now, currentTime);
  }

  /**
   * Check dynamic scheduling based on matches
   */
  private async checkDynamicScheduling(rule: any, now: Date, currentTime: number): Promise<{ shouldExecute: boolean, reason: string }> {
    try {
      // Dynamic scheduling configuration
      const dynamicConfig: Record<string, any> = {
        'betting': { beforeMatch: 45, description: '45 min before match' },
        'analysis': { beforeMatch: 120, description: '2 hours before match' },
        'live': { duringMatch: true, description: 'During match' },
        'daily_summary': { afterMatch: 30, description: '30 min after match' },
        'smart_push': { afterContent: true, description: 'After content' }
      };

      const scheduling = dynamicConfig[rule.content_type];
      if (!scheduling) {
        return { shouldExecute: false, reason: 'No dynamic scheduling config' };
      }

      // Get today's matches
      const todayMatches = await this.getTodayMatches();
      if (todayMatches.length === 0) {
        return { shouldExecute: false, reason: 'No matches today' };
      }

      // Check each match for timing
      for (const match of todayMatches) {
        const matchTime = new Date(match.kickoff_time);
        let targetTime: Date | null = null;

        if ('beforeMatch' in scheduling && scheduling.beforeMatch) {
          targetTime = new Date(matchTime.getTime() - (scheduling.beforeMatch * 60 * 1000));
        } else if ('duringMatch' in scheduling && scheduling.duringMatch) {
          // Check if match is currently live (started but not finished)
          const currentTime = new Date();
          const matchStart = matchTime;
          const matchEnd = new Date(matchTime.getTime() + (120 * 60 * 1000)); // 2 hours after start
          
          if (currentTime >= matchStart && currentTime <= matchEnd) {
            targetTime = currentTime; // Execute now if match is live
          }
        } else if ('afterMatch' in scheduling && scheduling.afterMatch) {
          targetTime = new Date(matchTime.getTime() + (90 * 60 * 1000) + (scheduling.afterMatch * 60 * 1000));
        }

        if (targetTime) {
          // For live matches, always execute if match is ongoing
          if ('duringMatch' in scheduling && scheduling.duringMatch) {
            const currentTime = new Date();
            const matchStart = matchTime;
            const matchEnd = new Date(matchTime.getTime() + (120 * 60 * 1000));
            
            if (currentTime >= matchStart && currentTime <= matchEnd) {
              return {
                shouldExecute: true,
                reason: `LIVE MATCH - ${match.home_team} vs ${match.away_team}`
              };
            }
          } else {
            // For other content types, use time window check
            const targetTimeMinutes = targetTime.getHours() * 60 + targetTime.getMinutes();
            const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
            
            // Check if we're in the time window (5 minutes)
            if (Math.abs(currentTimeMinutes - targetTimeMinutes) <= 5) {
              return {
                shouldExecute: true,
                reason: `${scheduling.description} - ${match.home_team} vs ${match.away_team}`
              };
            }
          }
        }
      }

      return { shouldExecute: false, reason: 'No matching dynamic timing' };
    } catch (error) {
      console.error('Error in checkDynamicScheduling:', error);
      return { shouldExecute: false, reason: 'Dynamic scheduling error' };
    }
  }

  /**
   * Get today's important matches for dynamic scheduling
   */
  private async getTodayMatches(): Promise<any[]> {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    try {
      const { data: matches, error } = await supabase
        .from('daily_important_matches')
        .select('*')
        .in('discovery_date', [today, yesterday])
        .gte('importance_score', 15)
        .order('importance_score', { ascending: false })
        .limit(5); // Top 5 matches

      if (error) {
        console.error('Error fetching matches for dynamic scheduling:', error);
        return [];
      }

      return matches || [];
    } catch (error) {
      console.error('Error in getTodayMatches:', error);
      return [];
    }
  }

  /**
   * Check event-driven rule
   */
  private checkEventDrivenRule(rule: any, now: Date): { shouldExecute: boolean, reason: string } {
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Check if we're in active hours
    const isActiveHours = currentHour >= 6 && currentHour <= 23;
    
    if (!isActiveHours) {
      return { shouldExecute: false, reason: 'outside active hours' };
    }

    // Execute every hour in minutes 0-10 (example)
    if (currentMinute <= 10) {
      return {
        shouldExecute: true,
        reason: `event during active hours ${currentHour}:${currentMinute}`
      };
    }

    return { shouldExecute: false, reason: '' };
  }

  /**
   * Check context-aware rule
   */
  private checkContextAwareRule(rule: any, now: Date): { shouldExecute: boolean, reason: string } {
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Execute every 2 hours during minutes 30-40
    const isActiveTime = currentHour >= 8 && currentHour <= 20;
    const isContextTrigger = currentMinute >= 30 && currentMinute <= 40;
    const isEvenHour = currentHour % 2 === 0;

    if (isActiveTime && isContextTrigger && isEvenHour) {
      return {
        shouldExecute: true,
        reason: `context match ${currentHour}:${currentMinute}`
      };
    }

    return { shouldExecute: false, reason: '' };
  }

  /**
   * Execute automation rule - Updated to use unified-content API
   */
  private async executeRule(rule: any): Promise<void> {
    try {
      console.log(`🚀 Executing rule: ${rule.name} (${rule.content_type})`);

      // Get active channels for this rule
      const activeChannels = await this.getActiveChannelsForRule(rule);
      
      if (activeChannels.length === 0) {
        console.log(`⚠️ No active channels found for rule ${rule.name}`);
        return;
      }

      // Execute content generation for each channel
      for (const channel of activeChannels) {
        try {
          console.log(`📤 Executing for channel: ${channel.name} (${channel.language})`);
          
          // Call unified-content API directly
          const response = await fetch('http://localhost:3001/api/unified-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-background-scheduler': 'true'
        },
        body: JSON.stringify({
              content_type: rule.content_type,
              target_channels: [channel.id],
              language: channel.language || 'en',
              automation_execution: true,
              rule_id: rule.id
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
            console.log(`✅ Rule ${rule.name} executed successfully for ${channel.name}`);
            console.log(`📊 Content generated: ${result.content_generated || 0}, Messages sent: ${result.messages_sent || 0}`);
            
            // Log successful execution
            await this.logExecution(rule.id, channel.id, 'success', {
              content_generated: result.content_generated || 0,
              messages_sent: result.messages_sent || 0
            });
      } else {
            console.error(`❌ Failed to execute rule ${rule.name} for ${channel.name}:`, result.error);
            await this.logExecution(rule.id, channel.id, 'failed', { error: result.error });
          }

        } catch (channelError) {
          console.error(`❌ Error executing rule ${rule.name} for channel ${channel.name}:`, channelError);
          await this.logExecution(rule.id, channel.id, 'failed', { 
            error: channelError instanceof Error ? channelError.message : 'Unknown error' 
          });
        }
      }

    } catch (error) {
      console.error(`❌ Error executing rule ${rule.name}:`, error);
    }
  }

  /**
   * Get active channels for a rule
   */
  private async getActiveChannelsForRule(rule: any): Promise<any[]> {
    try {
      const { data: channels, error } = await supabase
        .from('channels')
        .select('*')
        .eq('is_active', true)
        .eq('auto_post_enabled', true);

      if (error) {
        console.error('Error fetching active channels:', error);
        return [];
      }

      return channels || [];
    } catch (error) {
      console.error('Error in getActiveChannelsForRule:', error);
      return [];
    }
  }

  /**
   * Log rule execution
   */
  private async logExecution(ruleId: string, channelId: string, status: string, details: any): Promise<void> {
    try {
      await supabase
        .from('automation_logs')
        .insert({
          automation_rule_id: ruleId,
          channel_id: channelId,
          status: status,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          details: details
        });
    } catch (error) {
      console.error('Error logging execution:', error);
    }
  }

  /**
   * Get running status
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * 🔒 Check for recent executions in database to prevent duplicates
   */
  private async checkForRecentExecution(ruleId: string, minutesBack: number = 30): Promise<boolean> {
    try {
      const cutoffTime = new Date(Date.now() - minutesBack * 60 * 1000);
      
      const { data: recentExecutions } = await supabase
        .from('automation_logs')
        .select('id, created_at')
        .eq('rule_id', ruleId)
        .gte('created_at', cutoffTime.toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (recentExecutions && recentExecutions.length > 0) {
        console.log(`🔒 DUPLICATE PREVENTION: Rule ${ruleId} executed recently at ${recentExecutions[0].created_at}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking recent executions:', error);
      return false; // Allow execution on error
    }
  }

  /**
   * 🗑️ Clean old automation logs to prevent database bloat
   */
  private async cleanOldLogs(): Promise<void> {
    try {
      // Delete logs older than 7 days
      const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const { data: deletedLogs, error } = await supabase
        .from('automation_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        console.error('Error cleaning old logs:', error);
      } else {
        console.log(`🗑️ Cleaned automation logs older than 7 days`);
      }

      // Also clean very old pending/failed logs (older than 24 hours)
      const pendingCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const { error: pendingError } = await supabase
        .from('automation_logs')
        .delete()
        .in('status', ['pending', 'failed'])
        .lt('created_at', pendingCutoff.toISOString());

      if (pendingError) {
        console.error('Error cleaning old pending logs:', pendingError);
      } else {
        console.log(`🗑️ Cleaned old pending/failed logs older than 24 hours`);
      }

    } catch (error) {
      console.error('❌ Error during log cleanup:', error);
    }
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<any> {
    const liveStats = await this.getLiveUpdatesStatus();
    
    return {
      isRunning: this.isRunning,
      totalRulesExecuted: this.lastExecutionTimes.size,
      lastExecutions: Array.from(this.lastExecutionTimes.entries()).map(([ruleId, time]) => ({
        ruleId,
        lastExecuted: new Date(time).toLocaleString('en-US')
      })),
      // 🆕 Live updates status
      liveUpdates: {
        isActive: this.isLiveMonitoringActive,
        isRunning: liveStats.isRunning || false,
        totalMatches: liveStats.totalMatches || 0,
        liveMatches: liveStats.liveMatches || 0,
        eventsProcessed: liveStats.eventsProcessed || 0,
        updatesGenerated: liveStats.updatesGenerated || 0,
        startTime: liveStats.startTime || null
      }
    };
  }
}

// יצירת instance גלובלי
export const backgroundScheduler = new BackgroundScheduler(); 