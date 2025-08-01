import { NextRequest, NextResponse } from 'next/server';
import { backgroundScheduler } from '@/lib/automation/background-scheduler';
import { DailyWeeklySummaryGenerator } from '@/lib/content/daily-weekly-summary-generator';
import { PollsGenerator } from '@/lib/content/polls-generator';
import { supabase } from '@/lib/supabase';
import { TimezoneUtils } from '@/lib/utils/timezone-utils';

// Helper function to determine news time slot
function getNewsTimeSlot(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

// News content generation function
async function generateNewsContent(options: {
  language: 'en' | 'am' | 'sw';
  channelId: string;
  timeSlot: 'morning' | 'afternoon' | 'evening' | 'night';
}) {
  try {
    // Import the unified content API dynamically to avoid circular dependencies
    const response = await fetch(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/unified-content` : 'http://localhost:3000/api/unified-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-job': 'true'
      },
      body: JSON.stringify({
        type: 'news',
        language: options.language,
        target_channels: [options.channelId],
        automation_execution: true,
        customContent: {
          timeSlot: options.timeSlot,
          trigger_reason: `scheduled_news_${options.timeSlot}`
        }
      })
    });

    if (!response.ok) {
      throw new Error(`News API returned ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result.success ? result : null;
  } catch (error) {
    console.error('Error generating news content:', error);
    return null;
  }
}

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  console.log('⏰ [CRON] Daily job started:', new Date().toISOString());
  
  try {
    // Verify this is a Vercel cron job
    const userAgent = request.headers.get('user-agent') || '';
    const isVercelCron = userAgent.includes('vercel-cron') || 
                        request.headers.get('x-vercel-deployment-url') ||
                        process.env.NODE_ENV === 'production';
                        
    if (!isVercelCron && process.env.NODE_ENV === 'production') {
      console.log('❌ [CRON] Unauthorized daily job attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('🔓 [CRON] Daily job authorized successfully');

    const results = {
      timestamp: new Date().toISOString(),
      tasks: [] as any[]
    };

    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentDay = now.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
    const summaryGenerator = new DailyWeeklySummaryGenerator();
    const pollsGenerator = new PollsGenerator();

    // 🌍 NEW: Get all channels with their timezone configurations
    const { data: channels } = await supabase
      .from('channels')
      .select('id, name, language, timezone, bot_id')
      .eq('is_active', true);

    if (!channels || channels.length === 0) {
      console.log('⚠️ No active channels found');
      return NextResponse.json(results);
    }

    console.log(`🌍 Processing ${channels.length} channels with timezone-aware scheduling`);

    // 📰 TIMEZONE-AWARE NEWS GENERATION (Multiple times per day for each channel)
    for (const channel of channels) {
      const channelTimezone = channel.timezone || 'Africa/Addis_Ababa';
      const currentLocalHour = TimezoneUtils.getCurrentHourInChannelTimezone(channelTimezone);
      
      // Generate news at key times: 9 AM, 1 PM, 5 PM, 9 PM local time
      const newsHours = [9, 13, 17, 21];
      if (newsHours.includes(currentLocalHour)) {
        console.log(`📰 Generating news for ${channel.name} at ${currentLocalHour}:00 local time`);
        
        try {
          const newsContent = await generateNewsContent({
            language: channel.language as 'en' | 'am' | 'sw',
            channelId: channel.id,
            timeSlot: getNewsTimeSlot(currentLocalHour)
          });
          
          results.tasks.push({
            task: 'news_generation',
            channel: channel.id,
            channelName: channel.name,
            channelTimezone: channelTimezone,
            localTime: `${currentLocalHour}:00`,
            timeSlot: getNewsTimeSlot(currentLocalHour),
            status: newsContent ? 'completed' : 'failed',
            data: newsContent
          });
        } catch (error) {
          results.tasks.push({
            task: 'news_generation',
            channel: channel.id,
            channelName: channel.name,
            channelTimezone: channelTimezone,
            localTime: `${currentLocalHour}:00`,
            status: 'error',
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }

    // 🌅 TIMEZONE-AWARE MORNING SUMMARIES (7 AM local time for each channel)
    for (const channel of channels) {
      const channelTimezone = channel.timezone || 'Africa/Addis_Ababa';
      const currentLocalHour = TimezoneUtils.getCurrentHourInChannelTimezone(channelTimezone);
      
      console.log(`⏰ Channel ${channel.name} (${channelTimezone}): Local time is ${currentLocalHour}:00`);
      
      // Generate daily summary at 7 AM local time
      if (currentLocalHour === 7) {
        console.log(`📅 Generating morning summary for ${channel.name} at 7 AM local time`);
        
        try {
          const summary = await summaryGenerator.generateSummary({
            type: 'daily',
            language: channel.language as 'en' | 'am' | 'sw',
            channelId: channel.id
          });
          
          results.tasks.push({
            task: 'daily_summary_morning',
            channel: channel.id,
            channelName: channel.name,
            channelTimezone: channelTimezone,
            localTime: `${currentLocalHour}:00`,
            status: summary ? 'completed' : 'failed',
            data: summary
          });
        } catch (error) {
          results.tasks.push({
            task: 'daily_summary_morning',
            channel: channel.id,
            channelName: channel.name,
            status: 'error',
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }

    // 🌆 TIMEZONE-AWARE EVENING SUMMARIES (6 PM local time for each channel)
    for (const channel of channels) {
      const channelTimezone = channel.timezone || 'Africa/Addis_Ababa';
      const currentLocalHour = TimezoneUtils.getCurrentHourInChannelTimezone(channelTimezone);
      
      // Generate evening preview at 6 PM local time
      if (currentLocalHour === 18) {
        console.log(`🌆 Generating evening preview for ${channel.name} at 6 PM local time`);
        
        results.tasks.push({
          task: 'evening_preview',
          channel: channel.id,
          channelName: channel.name,
          channelTimezone: channelTimezone,
          localTime: `${currentLocalHour}:00`,
          status: 'completed',
          data: { trigger: 'evening_schedule_timezone_aware', localHour: currentLocalHour }
        });
      }
    }

    // 📊 TIMEZONE-AWARE POLLS GENERATION (3 PM local time for each channel)
    for (const channel of channels) {
      const channelTimezone = channel.timezone || 'Africa/Addis_Ababa';
      const currentLocalHour = TimezoneUtils.getCurrentHourInChannelTimezone(channelTimezone);
      
      // Generate polls at 3 PM local time
      if (currentLocalHour === 15) {
        console.log(`📊 Generating polls for ${channel.name} at 3 PM local time`);
        
        try {
          const poll = await pollsGenerator.generatePoll({
            language: channel.language as 'en' | 'am' | 'sw',
            channelId: channel.id,
            pollType: 'match_prediction',
            includeAnalysis: true,
            targetAudience: 'mixed',
            creativityLevel: 'high'
          });
          
          results.tasks.push({
            task: 'polls_generation',
            channel: channel.id,
            channelName: channel.name,
            channelTimezone: channelTimezone,
            localTime: `${currentLocalHour}:00`,
            status: poll ? 'completed' : 'failed',
            data: poll
          });
        } catch (error) {
          results.tasks.push({
            task: 'polls_generation',
            channel: channel.id,
            channelName: channel.name,
            status: 'error',
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }

    // 📊 TIMEZONE-AWARE WEEKLY SUMMARIES (Sunday 8 AM local time for each channel)
    for (const channel of channels) {
      const channelTimezone = channel.timezone || 'Africa/Addis_Ababa';
      const currentLocalHour = TimezoneUtils.getCurrentHourInChannelTimezone(channelTimezone);
      
      // Get current day in channel's timezone
      const channelTime = TimezoneUtils.utcToChannelTime(now, channelTimezone);
      const currentLocalDay = channelTime.getDay(); // 0 = Sunday
      
      // Generate weekly summary on Sunday at 8 AM local time
      if (currentLocalDay === 0 && currentLocalHour === 8) {
        console.log(`📊 Generating weekly summary for ${channel.name} on Sunday at 8 AM local time`);
        
        try {
          const summary = await summaryGenerator.generateSummary({
            type: 'weekly',
            language: channel.language as 'en' | 'am' | 'sw',
            channelId: channel.id
          });
          
          results.tasks.push({
            task: 'weekly_summary',
            channel: channel.id,
            channelName: channel.name,
            channelTimezone: channelTimezone,
            localTime: `Sunday ${currentLocalHour}:00`,
            status: summary ? 'completed' : 'failed',
            data: summary
          });
        } catch (error) {
          results.tasks.push({
            task: 'weekly_summary',
            channel: channel.id,
            channelName: channel.name,
            status: 'error',
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }

    // System cleanup and maintenance
    const stats = await backgroundScheduler.getStats();
    results.tasks.push({
      task: 'system_maintenance',
      status: 'completed',
      data: stats
    });

    // 🌍 Log timezone information for debugging
    const timezoneInfo = [];
    for (const channel of channels) {
      const channelTimezone = channel.timezone || 'Africa/Addis_Ababa';
      const currentLocalHour = TimezoneUtils.getCurrentHourInChannelTimezone(channelTimezone);
      const localTimeString = TimezoneUtils.formatTimeForChannel(now, channelTimezone);
      
      timezoneInfo.push({
        channel: channel.name,
        timezone: channelTimezone,
        localTime: localTimeString,
        localHour: currentLocalHour
      });
    }

    results.tasks.push({
      task: 'timezone_info',
      status: 'completed',
      data: {
        utcTime: now.toISOString(),
        channelTimezones: timezoneInfo
      }
    });

    console.log('✅ [CRON] Timezone-aware daily job completed successfully');
    console.log(`🌍 Processed ${channels.length} channels with individual timezone scheduling`);
    return NextResponse.json(results);

  } catch (error) {
    console.error('❌ [CRON] Daily job failed:', error);
    return NextResponse.json({ 
      error: 'Cron job failed',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 