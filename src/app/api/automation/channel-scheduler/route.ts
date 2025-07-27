import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

// Create service role client for admin operations (bypasses RLS)
const createServiceClient = () => {
  const supabaseUrl = 'https://ythsmnqclosoxiccchhh.supabase.co'
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0aHNtbnFjbG9zb3hpY2NjaGhoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE2NjMxOSwiZXhwIjoyMDY1NzQyMzE5fQ.WNEGkRDz0Ss_4QYUAI4VKhRWL0Q6o_dOJpYeYJ0qF50'
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * GET /api/automation/channel-scheduler - Run channel-specific automation
 */
export async function GET(request: NextRequest) {
  console.log('⏰ [CHANNEL-SCHEDULER] Channel-specific automation started:', new Date().toISOString());
  
  try {
    // Verify authorization for cron jobs
    const userAgent = request.headers.get('user-agent') || '';
    const isVercelCron = userAgent.includes('vercel-cron') || 
                        request.headers.get('x-vercel-deployment-url') ||
                        process.env.NODE_ENV === 'production';
                        
    if (!isVercelCron && process.env.NODE_ENV === 'production') {
      console.log('❌ [CHANNEL-SCHEDULER] Unauthorized attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('🔓 [CHANNEL-SCHEDULER] Authorized successfully');

    const supabase = createServiceClient();
    const now = new Date();
    
    const results = {
      timestamp: now.toISOString(),
      channelsProcessed: 0,
      contentGenerated: 0,
      channels: [] as any[]
    };

    // Get all active content schedules that should run now
    const { data: schedules, error } = await supabase
      .from('content_schedules')
      .select(`
        *,
        channels:channel_id (
          id,
          name,
          language,
          telegram_channel_id,
          is_active
        )
      `)
      .eq('is_active', true)
      .eq('channels.is_active', true)
      .lte('next_execution', now.toISOString())
      .gte('next_execution', new Date(now.getTime() - 5 * 60 * 1000).toISOString()); // Within last 5 minutes

    if (error) {
      console.error('❌ Error fetching content schedules:', error);
      return NextResponse.json(
        { error: 'Failed to fetch content schedules' },
        { status: 500 }
      );
    }

    if (!schedules || schedules.length === 0) {
      console.log('📭 No content schedules ready to execute');
      return NextResponse.json({
        ...results,
        message: 'No content schedules ready to execute'
      });
    }

    console.log(`🔍 Found ${schedules.length} content schedules ready to execute`);

    // Check each schedule to see if it should run content now
    for (const schedule of schedules) {
      const channel = schedule.channels;
      if (!channel) continue;

      try {
        // Check if we already ran recently (prevent duplicate runs)
        if (schedule.last_executed) {
          const lastExecution = new Date(schedule.last_executed);
          const timeSinceLastExecution = now.getTime() - lastExecution.getTime();
          
          // Don't run if we executed in the last 30 minutes
          if (timeSinceLastExecution < 30 * 60 * 1000) {
            console.log(`⏸️ Skipping ${channel.name}: Already executed recently (${Math.round(timeSinceLastExecution / 60000)} minutes ago)`);
            continue;
          }
        }

        console.log(`⚡ Running ${schedule.content_type} content for channel: ${channel.name} (${channel.language})`);
        
        // Add random delay to prevent all channels running at exact same time
        const delayRange = schedule.delay_minutes_range || [0, 30];
        const randomDelay = Math.floor(Math.random() * (delayRange[1] - delayRange[0]) + delayRange[0]) * 60 * 1000;
        
        if (randomDelay > 0) {
          console.log(`⏱️ Adding random delay of ${Math.round(randomDelay / 60000)} minutes for ${channel.name}`);
          await new Promise(resolve => setTimeout(resolve, randomDelay));
        }
        
        const contentResult = await generateContentForChannel(schedule);
        
        results.channelsProcessed++;
        results.contentGenerated += contentResult.generated;
        
        results.channels.push({
          channelId: channel.id,
          channelName: channel.name,
          language: channel.language,
          contentType: schedule.content_type,
          scheduledTime: schedule.next_execution,
          actualExecutionTime: new Date().toISOString(),
          delayApplied: Math.round(randomDelay / 60000),
          contentGenerated: contentResult.generated,
          status: contentResult.success ? 'success' : 'error',
          error: contentResult.error || null
        });
        
        // Update execution time and calculate next execution
        const nextExecution = calculateNextExecution(schedule, now);
        await supabase
          .from('content_schedules')
          .update({ 
            last_executed: now.toISOString(),
            next_execution: nextExecution
          })
          .eq('id', schedule.id);
          
      } catch (error) {
        console.error(`❌ Error processing schedule for ${channel.name}:`, error);
        results.channels.push({
          channelId: channel.id,
          channelName: channel.name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`✅ [CHANNEL-SCHEDULER] Completed: ${results.channelsProcessed} channels processed, ${results.contentGenerated} content items generated`);
    
    return NextResponse.json({
      success: true,
      ...results
    });

  } catch (error) {
    console.error('❌ [CHANNEL-SCHEDULER] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Generate content for a specific channel
 */
async function generateContentForChannel(schedule: any): Promise<{
  success: boolean;
  generated: number;
  types: string[];
  error?: string;
}> {
  try {
    const channel = schedule.channels;
    const contentType = schedule.content_type;
    
    console.log(`🎯 Generating ${contentType} content for ${channel.name} (${channel.language})`);
    
    // Call unified-content API for this specific channel
    const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/unified-content`;
    
    const requestBody = {
      content_type: contentType,
      target_channels: [channel.telegram_channel_id],
      language: channel.language,
      max_posts_per_channel: 1,
      context: {
        source: 'smart_channel_automation',
        channel_id: channel.id,
        schedule_id: schedule.id,
        scheduled_time: schedule.next_execution,
        content_priority: schedule.content_priority || 5
      }
    };
    
    console.log(`📤 Calling API:`, {
      url: apiUrl,
      contentType,
      language: channel.language,
      channelId: channel.telegram_channel_id,
      priority: schedule.content_priority
    });
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.success && result.distribution?.successful > 0) {
      console.log(`✅ ${contentType} content generated and sent to ${channel.name}`);
      return {
        success: true,
        generated: result.distribution.successful,
        types: [contentType]
      };
    } else {
      console.warn(`⚠️ No ${contentType} content generated for ${channel.name}:`, result.message);
      return {
        success: false,
        generated: 0,
        types: [],
        error: result.message || 'No content generated'
      };
    }
    
  } catch (error) {
    console.error('❌ Error generating content:', error);
    return {
      success: false,
      generated: 0,
      types: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Calculate next execution time based on schedule
 */
function calculateNextExecution(schedule: any, from: Date): string {
  try {
    const timezone = schedule.timezone || 'UTC';
    const currentTime = new Date(from.toLocaleString("en-US", {timeZone: timezone}));
    
    let nextExecution: Date;
    
    if (schedule.day_of_week === null || schedule.day_of_week === undefined) {
      // Daily schedule
      nextExecution = new Date(currentTime);
      nextExecution.setHours(schedule.hour, schedule.minute, 0, 0);
      
      // If time has passed today, move to tomorrow
      if (nextExecution <= currentTime) {
        nextExecution.setDate(nextExecution.getDate() + 1);
      }
    } else {
      // Weekly schedule (specific day of week)
      const targetDay = schedule.day_of_week; // 0=Sunday, 6=Saturday
      const currentDay = currentTime.getDay();
      
      nextExecution = new Date(currentTime);
      nextExecution.setHours(schedule.hour, schedule.minute, 0, 0);
      
      // Calculate days until target day
      let daysToAdd = targetDay - currentDay;
      if (daysToAdd < 0 || (daysToAdd === 0 && nextExecution <= currentTime)) {
        daysToAdd += 7; // Move to next week
      }
      
      nextExecution.setDate(nextExecution.getDate() + daysToAdd);
    }
    
    return nextExecution.toISOString();
  } catch (error) {
    console.error('Error calculating next execution:', error);
    // Default to 24 hours from now
    return new Date(from.getTime() + 24 * 60 * 60 * 1000).toISOString();
  }
} 