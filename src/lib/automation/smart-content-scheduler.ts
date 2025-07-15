/**
 * 🧠 SMART CONTENT SCHEDULER
 * 
 * Intelligent content scheduling based on match importance and timing.
 * Automatically creates content schedules for important matches.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface SchedulingOptions {
  match: any;
  languages: string[];
  targetChannels: { [language: string]: string[] };
  timingTemplate?: string;
}

export interface ContentScheduleItem {
  content_type: string;
  content_subtype?: string;
  scheduled_for: Date;
  priority: number;
  language: string;
  target_channels: string[];
}

export class SmartContentScheduler {

  /**
   * 🎯 Main scheduling function - create content schedule for a match
   */
  async scheduleContentForMatch(options: SchedulingOptions): Promise<ContentScheduleItem[]> {
    const { match, languages, targetChannels, timingTemplate } = options;
    
    console.log(`🧠 Creating smart content schedule for ${match.home_team} vs ${match.away_team}`);
    
    try {
      const kickoffTime = new Date(match.kickoff_time);
      const scheduleItems: ContentScheduleItem[] = [];

      // Get timing template based on match importance
      const template = await this.getTimingTemplate(match.importance_score, timingTemplate);
      if (!template) {
        console.log('❌ No suitable timing template found');
        return [];
      }

      console.log(`📋 Using template: ${template.name} for importance score ${match.importance_score}`);

      // Generate schedule for each language
      for (const language of languages) {
        const channelsForLanguage = targetChannels[language] || [];
        if (channelsForLanguage.length === 0) continue;

        // Process each content item in the template
        for (const contentRule of template.content_schedule) {
          const scheduledTime = this.calculateScheduledTime(kickoffTime, contentRule);
          
          // Only schedule future content
          if (scheduledTime > new Date()) {
            scheduleItems.push({
              content_type: contentRule.content_type,
              content_subtype: contentRule.subtype || 'standard',
              scheduled_for: scheduledTime,
              priority: contentRule.priority || 5,
              language: language,
              target_channels: channelsForLanguage
            });
          }
        }
      }

      // Save schedule to database
      if (scheduleItems.length > 0) {
        await this.saveScheduleToDatabase(match.id, scheduleItems);
        console.log(`✅ Scheduled ${scheduleItems.length} content items for ${match.home_team} vs ${match.away_team}`);
      }

      return scheduleItems;

    } catch (error) {
      console.error('❌ Error creating content schedule:', error);
      return [];
    }
  }

  /**
   * 📅 Calculate when content should be scheduled based on kickoff time and rules
   */
  private calculateScheduledTime(kickoffTime: Date, contentRule: any): Date {
    const scheduledTime = new Date(kickoffTime);

    if (contentRule.hours_before_kickoff !== undefined) {
      // Content before the match
      scheduledTime.setHours(scheduledTime.getHours() - contentRule.hours_before_kickoff);
    } else if (contentRule.hours_after_kickoff !== undefined) {
      // Content after the match
      scheduledTime.setHours(scheduledTime.getHours() + contentRule.hours_after_kickoff);
    } else if (contentRule.minutes_before_kickoff !== undefined) {
      // Content close to kickoff
      scheduledTime.setMinutes(scheduledTime.getMinutes() - contentRule.minutes_before_kickoff);
    } else if (contentRule.at_kickoff) {
      // Content exactly at kickoff (live updates)
      // Keep original kickoff time
    }

    // Add random variation to avoid clustering (±15 minutes)
    const randomMinutes = Math.floor(Math.random() * 31) - 15; // -15 to +15
    scheduledTime.setMinutes(scheduledTime.getMinutes() + randomMinutes);

    return scheduledTime;
  }

  /**
   * 📋 Get timing template based on match importance
   */
  private async getTimingTemplate(importanceScore: number, templateName?: string) {
    try {
      let query = supabase
        .from('content_timing_templates')
        .select('*')
        .eq('is_active', true);

      if (templateName) {
        // Use specific template
        query = query.eq('name', templateName);
      } else {
        // Find template based on importance score
        query = query
          .lte('min_importance_score', importanceScore)
          .gte('max_importance_score', importanceScore)
          .order('min_importance_score', { ascending: false });
      }

      const { data: templates, error } = await query.limit(1);

      if (error) {
        console.error('❌ Error fetching timing templates:', error);
        return null;
      }

      return templates && templates.length > 0 ? templates[0] : null;

    } catch (error) {
      console.error('❌ Error accessing timing templates:', error);
      return null;
    }
  }

  /**
   * 💾 Save schedule items to database
   */
  private async saveScheduleToDatabase(matchId: string, scheduleItems: ContentScheduleItem[]) {
    try {
      const dbItems = scheduleItems.map(item => ({
        match_id: matchId,
        content_type: item.content_type,
        content_subtype: item.content_subtype,
        scheduled_for: item.scheduled_for.toISOString(),
        priority: item.priority,
        language: item.language,
        target_channels: item.target_channels,
        status: 'pending',
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('dynamic_content_schedule')
        .insert(dbItems);

      if (error) {
        console.error('❌ Error saving schedule to database:', error);
        throw error;
      }

      console.log(`💾 Saved ${dbItems.length} schedule items to database`);

    } catch (error) {
      console.error('❌ Error in saveScheduleToDatabase:', error);
      throw error;
    }
  }

  /**
   * 🔄 Update existing schedule for a match (reschedule if needed)
   */
  async updateScheduleForMatch(matchId: string, newKickoffTime?: Date) {
    try {
      console.log(`🔄 Updating schedule for match ${matchId}`);

      if (!newKickoffTime) {
        // Just refresh priority and status
        const { error } = await supabase
          .from('dynamic_content_schedule')
          .update({ updated_at: new Date().toISOString() })
          .eq('match_id', matchId)
          .eq('status', 'pending');

        if (error) throw error;
        return;
      }

      // Get existing schedule
      const { data: existingSchedule, error: fetchError } = await supabase
        .from('dynamic_content_schedule')
        .select('*')
        .eq('match_id', matchId)
        .eq('status', 'pending');

      if (fetchError) throw fetchError;

      if (!existingSchedule || existingSchedule.length === 0) {
        console.log('ℹ️ No existing schedule to update');
        return;
      }

      // Recalculate timing for each item
      const updates = existingSchedule.map(item => {
        const originalScheduledTime = new Date(item.scheduled_for);
        const originalKickoff = new Date(item.scheduled_for); // We'll need to reverse-calculate this
        
        // Calculate time difference from original kickoff
        // This is a simplified approach - in practice you'd store the offset
        const hoursDiff = Math.round((originalScheduledTime.getTime() - originalKickoff.getTime()) / (1000 * 60 * 60));
        
        // Apply same offset to new kickoff time
        const newScheduledTime = new Date(newKickoffTime);
        newScheduledTime.setHours(newScheduledTime.getHours() + hoursDiff);

        return {
          id: item.id,
          scheduled_for: newScheduledTime.toISOString(),
          updated_at: new Date().toISOString()
        };
      });

      // Update each item
      for (const update of updates) {
        const { error } = await supabase
          .from('dynamic_content_schedule')
          .update({
            scheduled_for: update.scheduled_for,
            updated_at: update.updated_at
          })
          .eq('id', update.id);

        if (error) throw error;
      }

      console.log(`✅ Updated ${updates.length} scheduled items for new kickoff time`);

    } catch (error) {
      console.error('❌ Error updating schedule:', error);
      throw error;
    }
  }

  /**
   * 🗑️ Cancel schedule for a match (if match is cancelled/postponed)
   */
  async cancelScheduleForMatch(matchId: string, reason: string = 'Match cancelled') {
    try {
      console.log(`🗑️ Cancelling schedule for match ${matchId}: ${reason}`);

      const { error } = await supabase
        .from('dynamic_content_schedule')
        .update({ 
          status: 'cancelled',
          execution_result: { cancelled: true, reason },
          updated_at: new Date().toISOString()
        })
        .eq('match_id', matchId)
        .in('status', ['pending', 'executing']);

      if (error) throw error;

      console.log(`✅ Cancelled schedule for match ${matchId}`);

    } catch (error) {
      console.error('❌ Error cancelling schedule:', error);
      throw error;
    }
  }

  /**
   * 📊 Get schedule analytics for optimization
   */
  async getScheduleAnalytics(days: number = 7) {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data: analytics, error } = await supabase
        .from('match_content_analytics')
        .select(`
          content_type,
          content_timing,
          hours_before_kickoff,
          success,
          channels_sent,
          created_at
        `)
        .gte('created_at', since.toISOString());

      if (error) throw error;

      // Process analytics
      const summary = {
        total_scheduled: analytics?.length || 0,
        success_rate: 0,
        by_content_type: {} as any,
        by_timing: {} as any,
        optimal_hours_before: {} as any
      };

      if (analytics && analytics.length > 0) {
        const successful = analytics.filter(a => a.success);
        summary.success_rate = (successful.length / analytics.length) * 100;

        // Group by content type
        analytics.forEach(item => {
          if (!summary.by_content_type[item.content_type]) {
            summary.by_content_type[item.content_type] = { total: 0, successful: 0 };
          }
          summary.by_content_type[item.content_type].total++;
          if (item.success) summary.by_content_type[item.content_type].successful++;
        });

        // Group by timing
        analytics.forEach(item => {
          if (!summary.by_timing[item.content_timing]) {
            summary.by_timing[item.content_timing] = { total: 0, successful: 0 };
          }
          summary.by_timing[item.content_timing].total++;
          if (item.success) summary.by_timing[item.content_timing].successful++;
        });
      }

      return summary;

    } catch (error) {
      console.error('❌ Error getting schedule analytics:', error);
      return null;
    }
  }
}

// Export singleton instance
export const smartContentScheduler = new SmartContentScheduler(); 