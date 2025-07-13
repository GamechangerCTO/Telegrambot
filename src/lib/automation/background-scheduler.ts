/**
 * 🕐 Background Scheduler - Automated Content Timing Engine
 * 
 * Features:
 * - Continuous monitoring every minute for scheduled content
 * - Automatic automation execution
 * - Rule monitoring and execution tracking
 * - Duplicate prevention logic
 */

import { supabase } from '@/lib/supabase';

export class BackgroundScheduler {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 60000; // Check every minute
  private lastExecutionTimes: Map<string, number> = new Map();

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

    // Initial check immediately
    this.checkAndExecute();

    // Continuous checks every minute
    this.intervalId = setInterval(() => {
      this.checkAndExecute();
    }, this.CHECK_INTERVAL);
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

    console.log('🛑 Background Scheduler stopped');
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
    const lastExecution = this.lastExecutionTimes.get(ruleId) || 0;
    const timeSinceLastExecution = Date.now() - lastExecution;

    // Prevent duplicate execution - at least 30 minutes between executions
    if (timeSinceLastExecution < 30 * 60 * 1000) {
      return;
    }

    let shouldExecute = false;
    let reason = '';

    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

    switch (rule.automation_type) {
      case 'scheduled':
        ({ shouldExecute, reason } = this.checkScheduledRule(rule, now, currentTimeMinutes));
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
   * Check scheduled rule
   */
  private checkScheduledRule(rule: any, now: Date, currentTime: number): { shouldExecute: boolean, reason: string } {
    const schedule = rule.schedule || {};
    const times = schedule.times || [];

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

    return { shouldExecute: false, reason: '' };
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
   * Execute automation rule
   */
  private async executeRule(rule: any): Promise<void> {
    try {
      console.log(`🚀 Executing rule: ${rule.name} (${rule.content_type})`);

      // Call auto-scheduler API
      const response = await fetch('http://localhost:3000/api/automation/auto-scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-background-scheduler': 'true'
        },
        body: JSON.stringify({
          force_rule_id: rule.id // Execute specific rule
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Rule ${rule.name} executed successfully`);
        console.log(`📊 Content generated: ${result.results?.content_generated || 0}`);
      } else {
        console.error(`❌ Failed to execute rule ${rule.name}:`, result.error);
      }

    } catch (error) {
      console.error(`❌ Error executing rule ${rule.name}:`, error);
    }
  }

  /**
   * Get running status
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get statistics
   */
  getStats(): any {
    return {
      isRunning: this.isRunning,
      totalRulesExecuted: this.lastExecutionTimes.size,
      lastExecutions: Array.from(this.lastExecutionTimes.entries()).map(([ruleId, time]) => ({
        ruleId,
        lastExecuted: new Date(time).toLocaleString('en-US')
      }))
    };
  }
}

// יצירת instance גלובלי
export const backgroundScheduler = new BackgroundScheduler(); 